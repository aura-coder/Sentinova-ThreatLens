import sqlalchemy
import sqlalchemy
from sqlalchemy import Column, String, SmallInteger, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base
import uuid
import enum

Base = declarative_base()

class IndicatorType(str, enum.Enum):
    ip = "ip"
    domain = "domain"
    url = "url"
    hash_md5 = "hash_md5"
    hash_sha256 = "hash_sha256"
    email = "email"
    cve = "cve"

class TLPColor(str, enum.Enum):
    clear = "clear"
    green = "green"
    amber = "amber"
    red = "red"

class IndicatorStatus(str, enum.Enum):
    active = "active"
    expired = "expired"
    whitelisted = "whitelisted"
    under_review = "under_review"

class Indicator(Base):
    __tablename__ = "indicators"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    value = Column(String, index=True, unique=True, nullable=False)
    type = Column(Enum(IndicatorType), nullable=False)
    severity_score = Column(SmallInteger, index=True, default=0)
    confidence = Column(SmallInteger, default=0)
    tlp = Column(Enum(TLPColor), default=TLPColor.clear)
    status = Column(Enum(IndicatorStatus), default=IndicatorStatus.under_review, index=True)
    
    first_seen = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class UserRole(str, enum.Enum):
    administrator = "administrator"
    security_engineer = "security_engineer"
    incident_responder = "incident_responder"
    threat_hunter = "threat_hunter"
    soc_analyst = "soc_analyst"
    executive = "executive"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.soc_analyst)
    is_active = Column(sqlalchemy.Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

from sqlalchemy import ForeignKey, JSON
from sqlalchemy.orm import relationship

class Enrichment(Base):
    __tablename__ = "enrichments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    indicator_id = Column(UUID(as_uuid=True), ForeignKey("indicators.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String, nullable=False)  # e.g., "abuseipdb", "virustotal", "geoip"
    raw_response = Column(JSON, nullable=False)
    summary = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    indicator = relationship("Indicator", backref="enrichments")

from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

class SecurityEvent(Base):
    """Ingested internal events used for correlation."""
    __tablename__ = "security_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    endpoint = Column(String, nullable=False)
    event_type = Column(String, nullable=False) # e.g., 'ProcessCreate', 'NetworkConnection'
    related_ioc = Column(String, index=True, nullable=False) # Extracted IP, hash, or domain
    raw_log = Column(String, nullable=False)

class AlertStatus(str, enum.Enum):
    new = "new"
    acknowledged = "acknowledged"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"

class AlertRule(Base):
    """User-defined conditions that raise alerts."""
    __tablename__ = "alert_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    min_severity = Column(SmallInteger, default=80)
    target_type = Column(Enum(IndicatorType), nullable=True) # If null, applies to all types
    route_to_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

class Alert(Base):
    """Raised alerts with severity, rule reference, lifecycle state and assignee."""
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    indicator_id = Column(UUID(as_uuid=True), ForeignKey("indicators.id", ondelete="CASCADE"), nullable=False)
    rule_id = Column(UUID(as_uuid=True), ForeignKey("alert_rules.id", ondelete="SET NULL"), nullable=True)
    status = Column(Enum(AlertStatus), default=AlertStatus.new, index=True)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    indicator = relationship("Indicator")
    assignee = relationship("User")
    rule = relationship("AlertRule")

class IncidentStatus(str, enum.Enum):
    open = "open"
    investigating = "investigating"
    contained = "contained"
    closed = "closed"

class Incident(Base):
    """Investigation container linking indicators and actions."""
    __tablename__ = "incidents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.open, index=True)
    lead_analyst_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class IncidentTimeline(Base):
    """Ordered, append-only events belonging to an incident."""
    __tablename__ = "incident_timeline"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    incident_id = Column(UUID(as_uuid=True), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True)
    action_type = Column(String, nullable=False)  # e.g., 'indicator_linked', 'containment_initiated'
    description = Column(String, nullable=False)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    incident = relationship("Incident")
    actor = relationship("User")

class AuditLog(Base):
    """Immutable ledger of user activity and system events."""
    __tablename__ = "audit_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    actor_username = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False) # e.g., 'login_success', 'indicator_whitelisted'
    resource = Column(String, nullable=True) # The ID or name of the affected resource
    ip_address = Column(String, nullable=True)
    status = Column(String, default="success") # 'success' or 'failed'
    
    # Note: In a true production environment, DB permissions for the app user 
    # would explicitly DENY UPDATE and DELETE on this specific table.
