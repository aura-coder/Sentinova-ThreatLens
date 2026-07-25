import uuid
import enum

from sqlalchemy import (
    Column,
    String,
    SmallInteger,
    DateTime,
    Enum,
    ForeignKey,
    Text,
    Integer,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.sql import func

from database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    security_engineer = "security_engineer"
    incident_responder = "incident_responder"
    threat_hunter = "threat_hunter"
    soc_analyst = "soc_analyst"
    executive = "executive"


class IndicatorType(str, enum.Enum):
    ip = "ip"
    domain = "domain"
    url = "url"
    hash_md5 = "hash_md5"
    hash_sha256 = "hash_sha256"
    email = "email"
    cve = "cve"


class IndicatorStatus(str, enum.Enum):
    active = "active"
    expired = "expired"
    whitelisted = "whitelisted"
    under_review = "under_review"


class TLP(str, enum.Enum):
    clear = "clear"
    green = "green"
    amber = "amber"
    red = "red"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.soc_analyst)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Indicator(Base):
    __tablename__ = "indicators"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    value = Column(String, nullable=False, unique=True, index=True)
    type = Column(Enum(IndicatorType), nullable=False)
    severity_score = Column(SmallInteger, default=0)
    confidence = Column(SmallInteger, default=0)
    tlp = Column(Enum(TLP), default=TLP.amber)
    status = Column(Enum(IndicatorStatus), default=IndicatorStatus.active)
    first_seen = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    notes = Column(Text, nullable=True)

    source_feed = Column(String, nullable=True)
    seen_in_feeds = Column(ARRAY(String), nullable=False, server_default="{}")

    times_seen = Column(SmallInteger, default=1)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    resource_type = Column(String, nullable=False)
    resource_id = Column(String, nullable=True)
    details = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Feed(Base):
    __tablename__ = "feeds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name = Column(String, unique=True, nullable=False)

    description = Column(Text, nullable=True)

    status = Column(String, nullable=False, default="Active")

    reliability = Column(SmallInteger, nullable=False, default=80)

    last_sync = Column(DateTime(timezone=True), nullable=True)

    indicator_count = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )