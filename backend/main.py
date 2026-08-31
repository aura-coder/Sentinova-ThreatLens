from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import csv, io, subprocess
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timezone

import auth, deps, models, schemas
from database import get_db

app = FastAPI(title="ThreatLens API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/v1/auth/login", response_model=schemas.TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": str(user.id), "role": user.role.value})
    
    # Audit Log add for Login
    new_log = models.AuditLog(user_id=user.id, actor_username=user.email, action="auth.login", resource_type="Auth", resource_id=str(user.id), details={"status": "success"}, status="success")
    db.add(new_log)
    db.commit()
    
    return schemas.TokenResponse(access_token=access_token)

@app.get("/api/v1/auth/me", response_model=schemas.UserOut)
def read_current_user(current_user: models.User = Depends(deps.get_current_user)):
    return current_user

@app.get("/api/v1/dashboard/analyst")
def analyst_dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(deps.get_current_user)):
    high_severity_query = db.query(models.Indicator).filter(models.Indicator.severity_score >= 80).filter(models.Indicator.status == models.IndicatorStatus.active)
    high_severity_total = high_severity_query.count()
    recent_high_severity = high_severity_query.order_by(desc(models.Indicator.last_seen)).limit(15).all()
    by_type_rows = db.query(models.Indicator.type, func.count(models.Indicator.id)).group_by(models.Indicator.type).all()
    by_type = {t.value: c for t, c in by_type_rows}
    total = db.query(models.Indicator).count()
    active = db.query(models.Indicator).filter(models.Indicator.status == models.IndicatorStatus.active).count()
    whitelisted = db.query(models.Indicator).filter(models.Indicator.status == models.IndicatorStatus.whitelisted).count()
    return {"recent_high_severity": recent_high_severity, "high_severity_total": high_severity_total, "by_type": by_type, "total": total, "active": active, "whitelisted": whitelisted}

@app.get("/api/v1/dashboard/executive")
def executive_dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(deps.get_current_user)):
    total = db.query(models.Indicator).count()
    active = db.query(models.Indicator).filter(models.Indicator.status == models.IndicatorStatus.active).count()
    whitelisted = db.query(models.Indicator).filter(models.Indicator.status == models.IndicatorStatus.whitelisted).count()
    under_review = db.query(models.Indicator).filter(models.Indicator.status == models.IndicatorStatus.under_review).count()
    high_severity = db.query(models.Indicator).filter(models.Indicator.severity_score >= 80).count()
    avg_severity = db.query(func.avg(models.Indicator.severity_score)).scalar() or 0
    by_type_rows = db.query(models.Indicator.type, func.count(models.Indicator.id)).group_by(models.Indicator.type).all()
    by_type = {t.value: c for t, c in by_type_rows}
    by_tlp_rows = db.query(models.Indicator.tlp, func.count(models.Indicator.id)).group_by(models.Indicator.tlp).all()
    by_tlp = {t.value: c for t, c in by_tlp_rows}
    return {
        "total": total, "active": active, "whitelisted": whitelisted, "under_review": under_review,
        "high_severity": high_severity, "high_severity_pct": round((high_severity/total)*100, 1) if total else 0,
        "avg_severity": round(float(avg_severity), 1), "new_last_24h": 0,
        "by_type": by_type, "by_tlp": by_tlp
    }

@app.get("/api/v1/indicators")
def list_indicators(sort_by: str = "severity", page: int = 1, page_size: int = 50, type: models.IndicatorType | None = None, status: models.IndicatorStatus | None = None, severity_min: int | None = None, db: Session = Depends(get_db), current_user: models.User = Depends(deps.get_current_user)):
    query = db.query(models.Indicator)
    if type: query = query.filter(models.Indicator.type == type)
    if status: query = query.filter(models.Indicator.status == status)
    if severity_min: query = query.filter(models.Indicator.severity_score >= severity_min)
    total = query.count()
    indicators = query.order_by(desc(models.Indicator.severity_score)).offset((page-1)*page_size).limit(page_size).all()
    results = []
    for ind in indicators:
        source_feed = ind.source_feed if ind.source_feed else (ind.seen_in_feeds[0] if ind.seen_in_feeds else "N/A")
        results.append({"id": ind.id, "value": ind.value, "type": ind.type, "severity_score": ind.severity_score, "confidence": ind.confidence, "tlp": ind.tlp, "status": ind.status, "first_seen": ind.first_seen, "last_seen": ind.last_seen, "notes": ind.notes, "source_feed": source_feed, "times_seen": ind.times_seen, "seen_in_feeds": ind.seen_in_feeds})
    return {"total": total, "page": page, "page_size": page_size, "results": results}

@app.patch("/api/v1/indicators/{indicator_id}")
def update_indicator(indicator_id: str, update: schemas.IndicatorUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(deps.require_role(models.UserRole.admin, models.UserRole.security_engineer, models.UserRole.incident_responder, models.UserRole.threat_hunter))):
    indicator = db.query(models.Indicator).filter(models.Indicator.id == indicator_id).first()
    if not indicator: raise HTTPException(status_code=404, detail="Indicator not found")
    changes = update.model_dump(exclude_unset=True)
    for field, value in changes.items(): setattr(indicator, field, value)
    db.commit(); db.refresh(indicator)
    new_log = models.AuditLog(user_id=current_user.id, actor_username=current_user.email, action="indicator.update", resource_type="indicator", resource_id=indicator_id, details=changes, status="success")
    db.add(new_log); db.commit()
    return indicator

@app.get("/api/v1/audit-logs", response_model=list[schemas.AuditLogOut])
def list_audit_logs(db: Session = Depends(get_db), current_user: models.User = Depends(deps.require_role(models.UserRole.admin))):
    logs = (db.query(models.AuditLog, models.User.email).join(models.User, models.AuditLog.user_id == models.User.id, isouter=True).order_by(desc(models.AuditLog.created_at)).limit(500).all())
    return [{"id": log.id, "actor": username if username else "System", "action": log.action, "resource_type": log.resource_type, "resource_id": log.resource_id, "details": log.details, "status": log.status, "created_at": log.created_at} for log, username in logs]

@app.get("/api/v1/feeds", response_model=list[schemas.FeedOut])
def list_feeds(db: Session = Depends(get_db), current_user: models.User = Depends(deps.get_current_user)):
    return db.query(models.Feed).order_by(models.Feed.name).all()

@app.post("/api/v1/feeds/{feed_name}/sync")
def sync_feed(feed_name: str, db: Session = Depends(get_db), current_user: models.User = Depends(deps.require_role(models.UserRole.admin, models.UserRole.security_engineer))):
    scripts = {"ThreatFox": "ingest_threatfox.py", "AbuseIPDB": "ingest_abuseipdb.py", "AlienVault OTX": "ingest_otx.py", "URLhaus": "ingest_urlhaus.py", "Feodo Tracker": "ingest_feodotracker.py", "Blocklist.de": "ingest_blocklistde.py"}
    script = scripts.get(feed_name)
    if not script: raise HTTPException(status_code=404, detail=f"Unknown feed: {feed_name}")
    result = subprocess.run(["python", script], capture_output=True, text=True)
    if result.returncode != 0: raise HTTPException(status_code=500, detail=f"Sync failed: {result.stderr}")
    feed = db.query(models.Feed).filter(models.Feed.name == feed_name).first()
    if feed: feed.last_sync = datetime.now(timezone.utc); db.commit()
    new_log = models.AuditLog(user_id=current_user.id, actor_username=current_user.email, action="feed.sync", resource_type="Feed", resource_id=feed_name, details={"status": "success"}, status="success")
    db.add(new_log); db.commit()
    return {"success": True, "message": f"{feed_name} synchronized successfully.", "output": result.stdout}
