import json
import redis
from sqlalchemy.orm import Session
from .models import Indicator, Enrichment
from .database import SessionLocal

# Connect to Redis caching layer
redis_client = redis.Redis(host="localhost", port=6379, db=1, decode_responses=True)
CACHE_TTL = 3600 * 24  # 24-hour cache for external API verdicts

def enrich_ip(ip_address: str, indicator_id: str, db: Session) -> dict:
    cache_key = f"enrich:ip:{ip_address}"
    cached_data = redis_client.get(cache_key)
    
    if cached_data:
        return {"source": "cache", "data": json.loads(cached_data)}

    # Mocking live reputation lookup (Replace with AbuseIPDB / GreyNoise API key requests)
    verdict = {
        "ip": ip_address,
        "abuse_score": 85,
        "isp": "DigitalOcean LLC",
        "country": "US",
        "total_reports": 142,
        "is_tor": False,
        "is_vpn": True
    }

    # Persist in DB
    enrichment_record = Enrichment(
        indicator_id=indicator_id,
        provider="abuseipdb",
        raw_response=verdict,
        summary=f"Abuse Score {verdict['abuse_score']}% - Reported {verdict['total_reports']} times"
    )
    db.add(enrichment_record)
    db.commit()

    # Save to Redis
    redis_client.setex(cache_key, CACHE_TTL, json.dumps(verdict))
    
    return {"source": "live", "data": verdict}

def enrich_hash(file_hash: str, indicator_id: str, db: Session) -> dict:
    cache_key = f"enrich:hash:{file_hash}"
    cached_data = redis_client.get(cache_key)
    
    if cached_data:
        return {"source": "cache", "data": json.loads(cached_data)}

    # Mocking VirusTotal Hash verdict
    verdict = {
        "hash": file_hash,
        "positives": 58,
        "total_engines": 72,
        "malware_family": "AgentTesla",
        "threat_classification": "Trojan.Spyware"
    }

    enrichment_record = Enrichment(
        indicator_id=indicator_id,
        provider="virustotal",
        raw_response=verdict,
        summary=f"Detected by {verdict['positives']}/{verdict['total_engines']} security vendors"
    )
    db.add(enrichment_record)
    db.commit()

    redis_client.setex(cache_key, CACHE_TTL, json.dumps(verdict))
    
    return {"source": "live", "data": verdict}
