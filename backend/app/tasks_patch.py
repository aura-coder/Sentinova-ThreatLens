# Add this logic inside your `upsert_and_project_indicator` function in tasks.py:
import json
import redis
from .models import IndicatorType, TLPColor

# Synchronous redis client for the Celery workers
sync_redis = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def push_to_realtime_stream(indicator_value, ind_type, score):
    if score >= 80:
        alert_payload = {
            "event": "NEW_HIGH_SEVERITY_IOC",
            "data": {
                "value": indicator_value,
                "type": ind_type.value,
                "severity_score": score
            }
        }
        sync_redis.publish("alerts.stream", json.dumps(alert_payload))
