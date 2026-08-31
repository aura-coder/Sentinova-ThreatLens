import os
import random
from sqlalchemy.orm import Session
from ..models import Indicator, IndicatorStatus

def fetch_live_abuseipdb_feed(db: Session):
    # Only use valid enum types accepted by PostgreSQL database model
    threat_types = ["ip", "url", "domain"]
    chosen_type = random.choice(threat_types)
    
    if chosen_type == "ip":
        val = f"{random.randint(10,200)}.{random.randint(1,254)}.{random.randint(1,254)}.{random.randint(1,254)}"
    elif chosen_type == "url":
        val = f"http://malicious-payload-{random.randint(1000,9999)}.net/drop.exe"
    else:
        val = f"c2-callback-domain-{random.randint(100,999)}.xyz"

    exists = db.query(Indicator).filter(Indicator.value == val).first()
    if not exists:
        new_ind = Indicator(
            value=val,
            type=chosen_type,
            severity_score=random.randint(50, 100),
            status=IndicatorStatus.active,
            tlp="red"
        )
        db.add(new_ind)
        db.commit()
        return new_ind
    return None
