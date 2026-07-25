from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict

import models
import models as _models


# ---------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------

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


# ---------------------------------------------------------------------
# Indicators
# ---------------------------------------------------------------------

class IndicatorUpdate(BaseModel):
    status: Optional[_models.IndicatorStatus] = None
    severity_score: Optional[int] = None
    confidence: Optional[int] = None
    tlp: Optional[_models.TLP] = None
    notes: Optional[str] = None

class IndicatorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    value: str
    type: _models.IndicatorType
    severity_score: int
    confidence: int
    tlp: _models.TLP
    status: _models.IndicatorStatus

    first_seen: datetime
    last_seen: datetime

    notes: Optional[str]

    # New fields
    source_feed: Optional[str]
    times_seen: int
    seen_in_feeds: list[str] = []

# ---------------------------------------------------------------------
# Audit Logs
# ---------------------------------------------------------------------

class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: Optional[UUID]
    action: str
    resource_type: str
    resource_id: Optional[str]
    details: Optional[dict]
    created_at: datetime


# ---------------------------------------------------------------------
# Threat Feeds
# ---------------------------------------------------------------------

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