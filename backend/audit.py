from sqlalchemy.orm import Session
import models


def log_action(db: Session, user: models.User, action: str, resource_type: str, resource_id: str, details: dict | None = None):
    entry = models.AuditLog(
        user_id=user.id,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        details=details or {},
    )
    db.add(entry)
    db.commit()
