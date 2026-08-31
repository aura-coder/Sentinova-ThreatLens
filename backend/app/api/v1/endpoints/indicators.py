from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ....database import get_db
from ....services.feed_poller import fetch_live_abuseipdb_feed
from .... import models

router = APIRouter()

@router.get("", include_in_schema=False)
@router.get("/")
def get_indicators(
    search: Optional[str] = None,
    type: Optional[str] = None,
    sort: Optional[str] = "latest",
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    try:
        fetch_live_abuseipdb_feed(db)
    except Exception as e:
        db.rollback()

    query = db.query(models.Indicator)
    
    if search:
        query = query.filter(
            or_(
                models.Indicator.value.ilike(f"%{search}%"),
                models.Indicator.type.ilike(f"%{search}%")
            )
        )
        
    if type:
        query = query.filter(models.Indicator.type == type)
        
    # Sorting logic
    if sort == "oldest":
        query = query.order_by(models.Indicator.id.asc())
    elif sort == "severity":
        query = query.order_by(models.Indicator.severity_score.desc(), models.Indicator.id.desc())
    else:
        query = query.order_by(models.Indicator.id.desc())
        
    total = query.count()
    indicators = query.offset((page - 1) * limit).limit(limit).all()
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": [
            {
                "id": str(ind.id),
                "severity_score": ind.severity_score,
                "value": ind.value,
                "type": ind.type.value if hasattr(ind.type, 'value') else str(ind.type),
                "tlp": ind.tlp,
                "status": ind.status.value if hasattr(ind.status, 'value') else str(ind.status),
            } for ind in indicators
        ]
    }
