from sqlalchemy.orm import Session
from .models import Incident, IncidentTimeline, IncidentStatus

def create_incident(title: str, severity: str, lead_analyst_id: str, db: Session):
    """Initializes a new incident workspace."""
    new_incident = Incident(
        title=title,
        severity=severity,
        status=IncidentStatus.open,
        lead_analyst_id=lead_analyst_id
    )
    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)
    
    # Auto-log the creation in the timeline
    append_timeline_event(
        incident_id=new_incident.id,
        action_type="incident_created",
        description=f"Incident '{title}' declared with {severity} severity.",
        actor_id=lead_analyst_id,
        db=db
    )
    return new_incident

def append_timeline_event(incident_id, action_type: str, description: str, actor_id: str, db: Session):
    """Appends an immutable event to the incident timeline."""
    event = IncidentTimeline(
        incident_id=incident_id,
        action_type=action_type,
        description=description,
        actor_id=actor_id
    )
    db.add(event)
    db.commit()
    return event
