from app.api.v1.endpoints import indicators
from datetime import timedelta
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import models, schemas, auth
from .database import engine, get_db

# Create tables (In a real production app, we will use Alembic for migrations)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ThreatLens API",
    description="Cyber Threat Intelligence Dashboard API",
    version="1.0.0",
    docs_url="/api/v1/docs",
    openapi_url="/api/v1/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/health")
def health_check():
    return {"status": "operational", "services": ["api", "database"]}

@app.post("/api/v1/auth/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Fetch user from DB
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    # Authenticate
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    # Generate JWT Token
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    
    # Update last login
    user.last_login = models.func.now()
    db.commit()
    
    return {"access_token": access_token, "token_type": "bearer"}

# --- Protected Route Example ---
@app.get("/api/v1/indicators/secret-feed")
def get_secret_indicators(current_user: schemas.TokenData = Depends(auth.require_role(["administrator", "threat_hunter", "soc_analyst"]))):
    """
    This endpoint will REJECT requests from 'executive' or unauthenticated users.
    """
    return {
        "message": f"Welcome, {current_user.username}.",
        "role": current_user.role,
        "data": ["192.168.1.1", "malicious-domain.com"]
    }

from .enrichment import enrich_ip, enrich_hash

@app.post("/api/v1/indicators/{indicator_id}/enrich")
def trigger_indicator_enrichment(
    indicator_id: str,
    db: Session = Depends(get_db),
    current_user: schemas.TokenData = Depends(auth.require_role(["administrator", "soc_analyst", "incident_responder"]))
):
    indicator = db.query(models.Indicator).filter(models.Indicator.id == indicator_id).first()
    if not indicator:
        raise HTTPException(status_code=404, detail="Indicator not found")
        
    if indicator.type == models.IndicatorType.ip:
        result = enrich_ip(indicator.value, str(indicator.id), db)
    elif indicator.type in [models.IndicatorType.hash_sha256, models.IndicatorType.hash_md5]:
        result = enrich_hash(indicator.value, str(indicator.id), db)
    else:
        result = {"source": "none", "data": {"message": "No dedicated enrichment adapter for this type yet"}}

    return {
        "indicator_id": str(indicator.id),
        "value": indicator.value,
        "enrichment": result
    }

from typing import Optional
from .search import setup_elasticsearch, search_indicators

# Initialize Elasticsearch index on startup
@app.on_event("startup")
def startup_event():
    setup_elasticsearch()

@app.get("/api/v1/search")
def advanced_search(
    q: str = "*",
    type: Optional[str] = "all",
    min_severity: Optional[int] = 0,
    current_user: schemas.TokenData = Depends(auth.require_role(["administrator", "soc_analyst", "incident_responder", "threat_hunter"]))
):
    """
    Executes a full-text and faceted search across the intelligence index.
    """
    results = search_indicators(query_string=q, type_filter=type, min_severity=min_severity)
    
    return {
        "query": q,
        "filters": {"type": type, "min_severity": min_severity},
        "total_hits": len(results),
        "results": results
    }

import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from .websocket import manager, redis_listener

# Start the Redis Pub/Sub listener in the background when the app starts
@app.on_event("startup")
async def startup_event_ws():
    asyncio.create_task(redis_listener())

@app.websocket("/api/v1/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for the frontend to receive real-time alerts.
    """
    await manager.connect(websocket)
    try:
        while True:
            # We just need to keep the connection open, frontend mostly listens
            data = await websocket.receive_text() 
    except WebSocketDisconnect:
        manager.disconnect(websocket)

from pydantic import BaseModel
from .models import Alert, AlertStatus
from .schemas import TokenData

class AlertUpdate(BaseModel):
    status: AlertStatus
    assignee_id: Optional[str] = None

@app.get("/api/v1/alerts")
def get_alerts(
    status: Optional[AlertStatus] = None,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(auth.require_role(["administrator", "soc_analyst", "incident_responder"]))
):
    """List alerts with optional status filtering."""
    query = db.query(Alert)
    if status:
        query = query.filter(Alert.status == status)
        
    alerts = query.order_by(Alert.created_at.desc()).limit(100).all()
    
    # Format the response to include indicator details
    result = []
    for a in alerts:
        result.append({
            "id": str(a.id),
            "status": a.status,
            "indicator_value": a.indicator.value,
            "severity_score": a.indicator.severity_score,
            "created_at": a.created_at
        })
    return result

@app.patch("/api/v1/alerts/{alert_id}")
def update_alert_status(
    alert_id: str,
    payload: AlertUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(auth.require_role(["administrator", "soc_analyst", "incident_responder"]))
):
    """Manage alert lifecycle state and assignee."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.status = payload.status
    if payload.assignee_id:
        alert.assignee_id = payload.assignee_id
        
    db.commit()
    return {"status": "success", "alert_id": alert_id, "new_state": alert.status}

from .incidents import create_incident, append_timeline_event
from .reports import generate_stix_bundle

@app.get("/api/v1/incidents/{incident_id}/timeline")
def get_incident_timeline(
    incident_id: str,
    db: Session = Depends(get_db),
    current_user: schemas.TokenData = Depends(auth.require_role(["administrator", "incident_responder", "soc_analyst"]))
):
    """Retrieve the ordered incident timeline."""
    events = db.query(models.IncidentTimeline).filter(
        models.IncidentTimeline.incident_id == incident_id
    ).order_by(models.IncidentTimeline.timestamp.asc()).all()
    
    return [
        {
            "timestamp": e.timestamp,
            "action_type": e.action_type,
            "description": e.description,
            "actor": e.actor.username if e.actor else "System"
        } for e in events
    ]

@app.get("/api/v1/export/stix")
def export_stix_feed(
    min_severity: int = 70,
    limit: int = 1000,
    db: Session = Depends(get_db),
    current_user: schemas.TokenData = Depends(auth.require_role(["administrator", "threat_hunter"]))
):
    """Export a STIX 2.1 bundle of selected intelligence."""
    indicators = db.query(models.Indicator).filter(
        models.Indicator.severity_score >= min_severity,
        models.Indicator.status == models.IndicatorStatus.active
    ).order_by(models.Indicator.severity_score.desc()).limit(limit).all()
    
    bundle = generate_stix_bundle(indicators)
    
    # Audit log the export action
    new_audit = models.IncidentTimeline(
        action_type="stix_export",
        description=f"Exported STIX bundle containing {len(indicators)} IOCs (min_severity={min_severity}).",
        actor_id=current_user.id # Assuming user ID parsing in auth layer
    )
    # Note: In production, the actor_id should map properly from the DB user matching current_user.username
    
    return bundle

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import time
import redis

# Redis connection for rate limiting
rate_limit_redis = redis.Redis(host='localhost', port=6379, db=2, decode_responses=True)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Apply standard OWASP security headers
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = "default-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'"
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        # Very basic sliding window rate limit: 100 requests per minute per IP
        current_minute = int(time.time() // 60)
        redis_key = f"rate_limit:{client_ip}:{current_minute}"
        
        requests_this_minute = rate_limit_redis.incr(redis_key)
        if requests_this_minute == 1:
            rate_limit_redis.expire(redis_key, 60)
            
        if requests_this_minute > 100:
            return Response("Rate limit exceeded", status_code=429)
            
        return await call_next(request)

# Add middlewares to the application
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)

# --- Example of wiring the Audit Log into the Auth Endpoint ---
# Inside your existing login_for_access_token endpoint, you would call:
# from .audit import log_audit_event
# log_audit_event(db, actor=form_data.username, action="login", ip_address=request.client.host, status="success" if authenticated else "failed")

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import time
import redis

# Redis connection for rate limiting
rate_limit_redis = redis.Redis(host='localhost', port=6379, db=2, decode_responses=True)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Apply standard OWASP security headers
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = "default-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'"
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        # Very basic sliding window rate limit: 100 requests per minute per IP
        current_minute = int(time.time() // 60)
        redis_key = f"rate_limit:{client_ip}:{current_minute}"
        
        requests_this_minute = rate_limit_redis.incr(redis_key)
        if requests_this_minute == 1:
            rate_limit_redis.expire(redis_key, 60)
            
        if requests_this_minute > 100:
            return Response("Rate limit exceeded", status_code=429)
            
        return await call_next(request)

# Add middlewares to the application
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)

# --- Example of wiring the Audit Log into the Auth Endpoint ---
# Inside your existing login_for_access_token endpoint, you would call:
# from .audit import log_audit_event
# log_audit_event(db, actor=form_data.username, action="login", ip_address=request.client.host, status="success" if authenticated else "failed")

from fastapi.responses import FileResponse
from .pdf_generator import generate_executive_pdf

@app.get("/api/v1/reports/executive-pdf")
def get_executive_pdf(
    db: Session = Depends(get_db),
    current_user: schemas.TokenData = Depends(auth.require_role(["administrator", "executive", "soc_analyst"]))
):
    """Generates and returns an executive threat report in PDF format."""
    file_path = f"/tmp/threatlens_report_{int(time.time())}.pdf"
    generate_executive_pdf(db, file_path)
    
    # Log the export action
    log_audit_event(db, actor=current_user.username, action="export_executive_pdf", status="success")
    
    return FileResponse(path=file_path, filename="ThreatLens_Executive_Report.pdf", media_type="application/pdf")

app.include_router(indicators.router, prefix="/api/v1/indicators", tags=["Indicators"])
