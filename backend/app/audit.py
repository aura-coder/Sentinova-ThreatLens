from sqlalchemy.orm import Session
from .models import AuditLog

def log_audit_event(
    db: Session, 
    actor: str, 
    action: str, 
    resource: str = None, 
    ip_address: str = None, 
    status: str = "success"
):
    """Writes an immutable record to the global audit ledger."""
    audit_record = AuditLog(
        actor_username=actor,
        action=action,
        resource=resource,
        ip_address=ip_address,
        status=status
    )
    db.add(audit_record)
    db.commit()
    return audit_record
