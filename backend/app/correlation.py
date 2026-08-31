import json
import redis
from sqlalchemy.orm import Session
from .models import Indicator, SecurityEvent, AlertRule, Alert, AlertStatus

# Synchronous redis client for publishing alerts
sync_redis = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def run_correlation_and_alerting(indicator: Indicator, db: Session):
    """
    Correlates a newly ingested/updated indicator against internal events
    and evaluates it against Alert Rules.
    """
    # 1. Correlate against internal security events
    internal_sightings = db.query(SecurityEvent).filter(SecurityEvent.related_ioc == indicator.value).count()
    has_internal_sightings = internal_sightings > 0

    # 2. Evaluate against active alert rules
    rules = db.query(AlertRule).all()
    triggered_rules = []
    
    for rule in rules:
        type_match = rule.target_type is None or rule.target_type == indicator.type
        severity_match = indicator.severity_score >= rule.min_severity
        
        if type_match and severity_match:
            triggered_rules.append(rule)
            
    # 3. If it hits a rule OR has been seen internally, raise an alert
    if triggered_rules or has_internal_sightings:
        # Check if an active alert already exists for this indicator to prevent spam
        existing_alert = db.query(Alert).filter(
            Alert.indicator_id == indicator.id,
            Alert.status.in_([AlertStatus.new, AlertStatus.acknowledged, AlertStatus.in_progress])
        ).first()

        if not existing_alert:
            # Assign to the specific user if a rule dictates it, otherwise leave unassigned
            assignee = triggered_rules[0].route_to_user_id if triggered_rules and triggered_rules[0].route_to_user_id else None
            
            new_alert = Alert(
                indicator_id=indicator.id,
                rule_id=triggered_rules[0].id if triggered_rules else None,
                status=AlertStatus.new,
                assignee_id=assignee
            )
            db.add(new_alert)
            db.commit()
            db.refresh(new_alert)

            # 4. Push to the real-time WebSocket Gateway
            alert_payload = {
                "event": "NEW_ALERT",
                "data": {
                    "alert_id": str(new_alert.id),
                    "indicator_value": indicator.value,
                    "severity_score": indicator.severity_score,
                    "internal_sightings": internal_sightings
                }
            }
            sync_redis.publish("alerts.stream", json.dumps(alert_payload))
