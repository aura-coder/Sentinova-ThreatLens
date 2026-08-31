import uuid
from datetime import datetime
from typing import List
from .models import Indicator

def generate_stix_bundle(indicators: List[Indicator]) -> dict:
    """
    Transforms canonical Postgres indicators into a STIX 2.1 compatible bundle.
    """
    stix_objects = []
    
    for ind in indicators:
        # Map our internal types to STIX 2.1 pattern syntax
        pattern_value = f"[{ind.type.value}:value = '{ind.value}']"
        if ind.type.value == "ip":
            pattern_value = f"[ipv4-addr:value = '{ind.value}']"
            
        stix_indicator = {
            "type": "indicator",
            "spec_version": "2.1",
            "id": f"indicator--{ind.id}",
            "created": ind.created_at.isoformat() + "Z",
            "modified": ind.updated_at.isoformat() + "Z",
            "name": ind.value,
            "description": f"ThreatLens Auto-Export. Severity: {ind.severity_score}",
            "pattern": pattern_value,
            "pattern_type": "stix",
            "valid_from": ind.created_at.isoformat() + "Z"
        }
        stix_objects.append(stix_indicator)
        
    bundle = {
        "type": "bundle",
        "id": f"bundle--{uuid.uuid4()}",
        "objects": stix_objects
    }
    
    return bundle
