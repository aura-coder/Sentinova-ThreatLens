from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import csv
import io
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, case
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
from scheduler import start_scheduler, stop_scheduler

import subprocess
import auth
import deps
import audit
import models
import schemas
from database import get_db
from es_client import es, INDEX_NAME

app = FastAPI(title="ThreatLens API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    start_scheduler(interval_hours=6)

@app.on_event("shutdown")
def on_shutdown():
    stop_scheduler()

@app.get("/")
def root():
    return {"message": "ThreatLens API is running"}


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

@app.post("/api/v1/auth/login", response_model=schemas.TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2PasswordRequestForm's "username" field carries the email here.
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return schemas.TokenResponse(access_token=access_token)


@app.get("/api/v1/auth/me", response_model=schemas.UserOut)
def read_current_user(current_user: models.User = Depends(deps.get_current_user)):
    return current_user


@app.post(
    "/api/v1/auth/users",
    response_model=schemas.UserOut,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(deps.require_role(models.UserRole.admin)),
):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    new_user = models.User(
        email=user_in.email,
        hashed_password=auth.hash_password(user_in.password),
        role=user_in.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# ---------------------------------------------------------------------------
# Indicators / feeds (now behind auth)
# ---------------------------------------------------------------------------

@app.get("/api/v1/indicators")
def list_indicators(
    page: int = 1,
    page_size: int = 50,
    type: models.IndicatorType | None = None,
    status: models.IndicatorStatus | None = None,
    severity_min: int | None = None,
    min_feeds: int | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    query = db.query(models.Indicator)

    if type is not None:
        query = query.filter(models.Indicator.type == type)
    if status is not None:
        query = query.filter(models.Indicator.status == status)
    if severity_min is not None:
        query = query.filter(models.Indicator.severity_score >= severity_min)
    if min_feeds is not None:
        query = query.filter(func.cardinality(models.Indicator.seen_in_feeds) >= min_feeds)

    total = query.count()

    indicators = (
        query
        .order_by(desc(models.Indicator.severity_score))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "results": indicators,
    }


@app.get("/api/v1/indicators/search")
def search_indicators(
    q: str = "",
    type: str | None = None,
    tlp: str | None = None,
    min_score: int | None = None,
    max_score: int | None = None,
    size: int = 50,
    current_user: models.User = Depends(deps.get_current_user),
):
    must_clauses = []

    if q and q.strip():
        must_clauses.append({"wildcard": {"value": {"value": f"*{q.lower()}*"}}})
    if type:
        must_clauses.append({"term": {"type": type}})
    if tlp:
        must_clauses.append({"term": {"tlp": tlp}})
    if min_score is not None or max_score is not None:
        range_filter = {}
        if min_score is not None:
            range_filter["gte"] = min_score
        if max_score is not None:
            range_filter["lte"] = max_score
        must_clauses.append({"range": {"severity_score": range_filter}})

    if not must_clauses:
        must_clauses.append({"match_all": {}})

    body = {
        "query": {"bool": {"must": must_clauses}},
        "size": size,
        "sort": [{"severity_score": "desc"}],
    }
    result = es.search(index=INDEX_NAME, body=body)
    hits = result["hits"]["hits"]
    return {
        "total": result["hits"]["total"]["value"],
        "results": [
            {"id": h["_id"], **h["_source"]} for h in hits
        ],
    }

@app.get("/api/v1/indicators/export")
def export_indicators(
    type: str | None = None,
    tlp: str | None = None,
    status: str | None = None,
    min_score: int | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    query = db.query(models.Indicator)

    if type:
        query = query.filter(models.Indicator.type == type)
    if tlp:
        query = query.filter(models.Indicator.tlp == tlp)
    if status:
        query = query.filter(models.Indicator.status == status)
    if min_score is not None:
        query = query.filter(models.Indicator.severity_score >= min_score)

    indicators = query.order_by(desc(models.Indicator.severity_score)).limit(5000).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        ["value", "type", "severity_score", "confidence", "tlp", "status", "source_feed", "first_seen", "last_seen"]
    )
    for ind in indicators:
        writer.writerow(
            [
                ind.value,
                ind.type.value if hasattr(ind.type, "value") else ind.type,
                ind.severity_score,
                ind.confidence,
                ind.tlp.value if hasattr(ind.tlp, "value") else ind.tlp,
                ind.status.value if hasattr(ind.status, "value") else ind.status,
                ind.source_feed or "",
                ind.first_seen.isoformat() if ind.first_seen else "",
                ind.last_seen.isoformat() if ind.last_seen else "",
            ]
        )

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=indicators_export.csv"},
    )

@app.get(
    "/api/v1/indicators/{indicator_id}",
    response_model=schemas.IndicatorOut,
)
        
def get_indicator(
    indicator_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    indicator = (
        db.query(models.Indicator)
        .filter(models.Indicator.id == indicator_id)
        .first()
    )

    if not indicator:
        raise HTTPException(status_code=404, detail="Indicator not found")

    return indicator

@app.get("/api/v1/feeds/status")
def feeds_status(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        deps.require_role(models.UserRole.admin, models.UserRole.security_engineer)
    ),
):
    total = db.query(models.Indicator).count()
    by_type = (
        db.query(models.Indicator.type, func.count(models.Indicator.id))
        .group_by(models.Indicator.type)
        .all()
    )
    return {
        "total_indicators": total,
        "by_type": {t.value: c for t, c in by_type},
    }

@app.get(
    "/api/v1/feeds",
    response_model=list[schemas.FeedOut],
)
def list_feeds(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    return (
        db.query(models.Feed)
        .order_by(models.Feed.name)
        .all()
    )

@app.patch("/api/v1/indicators/{indicator_id}", response_model=None)
def update_indicator(
    indicator_id: str,
    update: schemas.IndicatorUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(
        deps.require_role(
            models.UserRole.admin,
            models.UserRole.security_engineer,
            models.UserRole.incident_responder,
            models.UserRole.threat_hunter,
        )
    ),
):
    indicator = db.query(models.Indicator).filter(models.Indicator.id == indicator_id).first()
    if not indicator:
        raise HTTPException(status_code=404, detail="Indicator not found")

    changes = update.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(indicator, field, value)
    db.commit()
    db.refresh(indicator)

    audit.log_action(
        db, current_user, "indicator.update", "indicator", indicator_id, changes
    )
    db.refresh(indicator)
    return indicator


@app.get("/api/v1/audit-logs", response_model=list[schemas.AuditLogOut])
def list_audit_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.require_role(models.UserRole.admin)),
):
    return (
        db.query(models.AuditLog)
        .order_by(desc(models.AuditLog.created_at))
        .limit(500)
        .all()
    )

@app.get("/api/v1/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    total = db.query(models.Indicator).count()
    high_severity = db.query(models.Indicator).filter(models.Indicator.severity_score >= 80).count()
    active = db.query(models.Indicator).filter(models.Indicator.status == models.IndicatorStatus.active).count()

    by_type = (
        db.query(models.Indicator.type, func.count(models.Indicator.id))
        .group_by(models.Indicator.type)
        .all()
    )

    return {
        "total": total,
        "high_severity": high_severity,
        "active": active,
        "by_type": {t.value: c for t, c in by_type},
    }

@app.get("/api/v1/dashboard/analyst")
def analyst_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    high_severity_query = (
        db.query(models.Indicator)
        .filter(models.Indicator.severity_score >= 80)
        .filter(models.Indicator.status == models.IndicatorStatus.active)
    )

    high_severity_total = high_severity_query.count()

    recent_high_severity = (
        high_severity_query
        .order_by(desc(models.Indicator.last_seen))
        .limit(15)
        .all()
    )

    by_type = (
        db.query(models.Indicator.type, func.count(models.Indicator.id))
        .group_by(models.Indicator.type)
        .all()
    )

    total = db.query(models.Indicator).count()
    active = db.query(models.Indicator).filter(models.Indicator.status == models.IndicatorStatus.active).count()
    whitelisted = db.query(models.Indicator).filter(models.Indicator.status == models.IndicatorStatus.whitelisted).count()

    return {
        "recent_high_severity": recent_high_severity,
        "high_severity_total": high_severity_total,
        "by_type": {t.value: c for t, c in by_type},
        "total": total,
        "active": active,
        "whitelisted": whitelisted,
    }

@app.get("/api/v1/dashboard/executive")
def executive_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    total = db.query(models.Indicator).count()
    active = db.query(models.Indicator).filter(models.Indicator.status == models.IndicatorStatus.active).count()
    whitelisted = db.query(models.Indicator).filter(models.Indicator.status == models.IndicatorStatus.whitelisted).count()
    under_review = db.query(models.Indicator).filter(models.Indicator.status == models.IndicatorStatus.under_review).count()

    high_severity = db.query(models.Indicator).filter(models.Indicator.severity_score >= 80).count()
    avg_severity = db.query(func.avg(models.Indicator.severity_score)).scalar() or 0

    last_24h_cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    new_last_24h = db.query(models.Indicator).filter(models.Indicator.first_seen >= last_24h_cutoff).count()

    by_type = (
        db.query(models.Indicator.type, func.count(models.Indicator.id))
        .group_by(models.Indicator.type)
        .all()
    )

    by_tlp = (
        db.query(models.Indicator.tlp, func.count(models.Indicator.id))
        .group_by(models.Indicator.tlp)
        .all()
    )

    return {
        "total": total,
        "active": active,
        "whitelisted": whitelisted,
        "under_review": under_review,
        "high_severity": high_severity,
        "high_severity_pct": round((high_severity / total * 100), 1) if total else 0,
        "avg_severity": round(float(avg_severity), 1),
        "new_last_24h": new_last_24h,
        "by_type": {t.value: c for t, c in by_type},
        "by_tlp": {t.value: c for t, c in by_tlp},
    }


@app.get("/api/v1/dashboard/trends")
def dashboard_trends(
    days: int = 14,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    rows = (
        db.query(
            func.date(models.Indicator.first_seen).label("day"),
            func.count(models.Indicator.id).label("total"),
            func.sum(case((models.Indicator.severity_score >= 80, 1), else_=0)).label("high_severity"),
        )
        .filter(models.Indicator.first_seen >= cutoff)
        .group_by(func.date(models.Indicator.first_seen))
        .order_by(func.date(models.Indicator.first_seen))
        .all()
    )

    series = [
        {
            "date": row.day.isoformat() if hasattr(row.day, "isoformat") else str(row.day),
            "total": row.total,
            "high_severity": int(row.high_severity or 0),
        }
        for row in rows
    ]

    return {"days": days, "series": series}


DEMO_COUNTRIES = [
    "United States", "China", "Russia", "Brazil", "India",
    "Germany", "Netherlands", "Vietnam", "Ukraine", "Iran",
    "United Kingdom", "France", "South Korea", "Indonesia", "Nigeria",
]


@app.get("/api/v1/dashboard/geo")
def dashboard_geo(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    ip_indicators = (
        db.query(models.Indicator.value, models.Indicator.severity_score)
        .filter(models.Indicator.type == models.IndicatorType.ip)
        .limit(3000)
        .all()
    )

    counts: dict[str, int] = {c: 0 for c in DEMO_COUNTRIES}
    for value, _ in ip_indicators:
        idx = sum(ord(ch) for ch in value) % len(DEMO_COUNTRIES)
        counts[DEMO_COUNTRIES[idx]] += 1

    return {
        "note": "Approximate demo mapping (hash-based), not real IP geolocation.",
        "counts": counts,
    }


@app.get("/api/v1/reports/executive-summary")
def executive_summary_pdf(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    total = db.query(models.Indicator).count()
    active = db.query(models.Indicator).filter(models.Indicator.status == models.IndicatorStatus.active).count()
    whitelisted = db.query(models.Indicator).filter(models.Indicator.status == models.IndicatorStatus.whitelisted).count()
    high_severity = db.query(models.Indicator).filter(models.Indicator.severity_score >= 80).count()
    avg_severity = db.query(func.avg(models.Indicator.severity_score)).scalar() or 0

    by_type = (
        db.query(models.Indicator.type, func.count(models.Indicator.id))
        .group_by(models.Indicator.type)
        .all()
    )

    top_threats = (
        db.query(models.Indicator)
        .filter(models.Indicator.severity_score >= 80)
        .filter(models.Indicator.status == models.IndicatorStatus.active)
        .order_by(desc(models.Indicator.severity_score))
        .limit(10)
        .all()
    )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.6 * inch, bottomMargin=0.6 * inch)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "TitleGreen", parent=styles["Title"], textColor=colors.HexColor("#1a1a1a")
    )
    heading_style = ParagraphStyle(
        "HeadingGreen", parent=styles["Heading2"], textColor=colors.HexColor("#0a7a1f"), spaceBefore=16
    )

    elements = []
    elements.append(Paragraph("ThreatLens — Executive Summary", title_style))
    elements.append(Paragraph(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", styles["Normal"]))
    elements.append(Spacer(1, 0.3 * inch))

    elements.append(Paragraph("Overview", heading_style))
    overview_data = [
        ["Metric", "Value"],
        ["Total indicators", str(total)],
        ["Active", str(active)],
        ["Whitelisted", str(whitelisted)],
        ["High severity (score >= 80)", str(high_severity)],
        ["Average severity score", str(round(float(avg_severity), 1))],
    ]
    overview_table = Table(overview_data, colWidths=[3 * inch, 2 * inch])
    overview_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a1a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
    ]))
    elements.append(overview_table)

    elements.append(Paragraph("Indicators by Type", heading_style))
    type_data = [["Type", "Count"]] + [[t.value, str(c)] for t, c in by_type]
    type_table = Table(type_data, colWidths=[3 * inch, 2 * inch])
    type_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a1a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
    ]))
    elements.append(type_table)

    elements.append(Paragraph("Top High-Severity Indicators", heading_style))
    threat_data = [["Score", "Value", "Type"]] + [
        [str(i.severity_score), i.value[:50], i.type.value] for i in top_threats
    ]
    threat_table = Table(threat_data, colWidths=[0.8 * inch, 3.2 * inch, 1 * inch])
    threat_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a1a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
    ]))
    elements.append(threat_table)

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=threatlens_executive_summary.pdf"},
    )


@app.get("/api/v1/dashboard/incident-responder")
def incident_responder_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    active_cases = (
        db.query(models.Indicator)
        .filter(models.Indicator.status == models.IndicatorStatus.under_review)
        .order_by(desc(models.Indicator.updated_at))
        .limit(50)
        .all()
    )

    total_cases = db.query(models.Indicator).filter(
        models.Indicator.status == models.IndicatorStatus.under_review
    ).count()

    recent_escalations = (
        db.query(models.AuditLog)
        .filter(models.AuditLog.action == "indicator.update")
        .order_by(desc(models.AuditLog.created_at))
        .limit(10)
        .all()
    )

    return {
        "active_cases": active_cases,
        "total_cases": total_cases,
        "recent_escalations": recent_escalations,
    }

@app.post("/api/v1/feeds/{feed_name}/sync")
def sync_feed(
    feed_name: str,
    current_user: models.User = Depends(
        deps.require_role(
            models.UserRole.admin,
            models.UserRole.security_engineer,
        )
    ),
):
    scripts = {
        "ThreatFox": "ingest_threatfox.py",
        "AbuseIPDB": "ingest_abuseipdb.py",
        "AlienVault OTX": "ingest_otx.py",
        "URLHaus": "ingest_urlhaus.py",
        "Feodo Tracker": "ingest_feodotracker.py",
        "Blocklist.de": "ingest_blocklistde.py",
    }

    script = scripts.get(feed_name)

    if script is None:
        raise HTTPException(
            status_code=404,
            detail="Unknown feed",
        )

    result = subprocess.run(
        ["python", script],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=result.stderr,
        )

    return {
        "success": True,
        "message": f"{feed_name} synchronized successfully.",
        "output": result.stdout,
    }
