from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
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
    q: str,
    size: int = 50,
    current_user: models.User = Depends(deps.get_current_user),
):
    if not q or not q.strip():
        return {"total": 0, "results": []}

    body = {
        "query": {
            "wildcard": {
                "value": {
                    "value": f"*{q.lower()}*"
                }
            }
        },
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
