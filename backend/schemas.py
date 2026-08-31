from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
import models

# Auth
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: models.UserRole = models.UserRole.soc_analyst

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: str
    role: models.UserRole

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Indicators
class IndicatorUpdate(BaseModel):
    status: Optional[models.IndicatorStatus] = None
    severity_score: Optional[int] = None
    confidence: Optional[int] = None
    tlp: Optional[models.TLP] = None
    notes: Optional[str] = None

class IndicatorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    value: str
    type: models.IndicatorType
    severity_score: int
    confidence: int
    tlp: models.TLP
    status: models.IndicatorStatus
    first_seen: datetime
    last_seen: datetime
    notes: Optional[str]
    source_feed: Optional[str]
    times_seen: int
    seen_in_feeds: list[str] = []

# Audit Logs (Frontend ke hisaab se)
class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    actor: Optional[str] = None  # Frontend `actor` maangta hai
    action: str
    resource_type: str
    resource_id: Optional[str]
    details: Optional[dict]
    status: Optional[str] = None  # Frontend `status` maangta hai
    created_at: datetime

# Feeds
class FeedOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    description: Optional[str]
    status: str
    reliability: int
    last_sync: Optional[datetime]
    indicator_count: int

class FeedUpdate(BaseModel):
    status: Optional[str] = None
    reliability: Optional[int] = None
