import requests
import csv
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from celery.utils.log import get_task_logger

from .celery_app import celery_app
from .database import SessionLocal
from .models import Indicator, IndicatorType, IndicatorStatus, TLPColor
from .scoring import calculate_severity_score
from .search import project_indicator_to_index

logger = get_task_logger(__name__)

def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def upsert_and_project_indicator(db: Session, value: str, ind_type: IndicatorType, confidence: int, tlp: TLPColor = TLPColor.clear):
    """
    Helper function to score, deduplicate in Postgres, and project to Elasticsearch.
    """
    score = calculate_severity_score(confidence, ind_type, tlp)
    
    stmt = insert(Indicator).values(
        value=value,
        type=ind_type,
        severity_score=score,
        confidence=confidence,
        tlp=tlp,
        status=IndicatorStatus.active
    ).on_conflict_do_update(
        index_elements=['value'],
        set_={
            'severity_score': score,
            'last_seen': Indicator.last_seen 
        }
    ).returning(Indicator.id)
    
    result = db.execute(stmt)
    inserted_id = result.scalar()
    
    # Project to Elasticsearch index
    es_doc = {
        "id": str(inserted_id),
        "value": value,
        "type": ind_type.value,
        "severity_score": score,
        "confidence": confidence,
        "tlp": tlp.value,
        "status": "active"
    }
    project_indicator_to_index(es_doc)
    return inserted_id

@celery_app.task
def ingest_urlhaus_feed():
    logger.info("Syncing URLhaus...")
    response = requests.get("https://urlhaus.abuse.ch/downloads/csv_recent/", timeout=10)
    csv_data = [line for line in response.text.splitlines() if not line.startswith("#")]
    
    db = next(get_db_session())
    count = 0
    for row in csv.reader(csv_data):
        if len(row) >= 3:
            upsert_and_project_indicator(db, row[2].strip(), IndicatorType.url, 85)
            count += 1
    db.commit()
    return {"source": "URLhaus", "count": count}

@celery_app.task
def ingest_feodo_tracker():
    """Botnet C2 IP addresses from Feodo Tracker."""
    logger.info("Syncing Feodo Tracker...")
    response = requests.get("https://feodotracker.abuse.ch/downloads/ipblocklist.csv", timeout=10)
    csv_data = [line for line in response.text.splitlines() if not line.startswith("#")]
    
    db = next(get_db_session())
    count = 0
    for row in csv.reader(csv_data):
        if len(row) >= 2:
            upsert_and_project_indicator(db, row[1].strip(), IndicatorType.ip, 90, TLPColor.amber)
            count += 1
    db.commit()
    return {"source": "Feodo Tracker", "count": count}

@celery_app.task
def ingest_malwarebazaar():
    """Recent Malware Hashes from MalwareBazaar."""
    logger.info("Syncing MalwareBazaar...")
    response = requests.get("https://bazaar.abuse.ch/export/txt/sha256/recent/", timeout=10)
    lines = [line.strip() for line in response.text.splitlines() if not line.startswith("#")]
    
    db = next(get_db_session())
    count = 0
    for hash_val in lines:
        if hash_val:
            upsert_and_project_indicator(db, hash_val, IndicatorType.hash_sha256, 95, TLPColor.amber)
            count += 1
    db.commit()
    return {"source": "MalwareBazaar", "count": count}

@celery_app.task
def ingest_threatfox():
    """Fresh IOCs mapped to malware families from ThreatFox."""
    logger.info("Syncing ThreatFox...")
    response = requests.get("https://threatfox.abuse.ch/export/csv/recent/", timeout=15)
    csv_data = [line for line in response.text.splitlines() if not line.startswith("#")]
    
    db = next(get_db_session())
    count = 0
    for row in csv.reader(csv_data):
        if len(row) >= 4:
            ioc_value = row[2].strip()
            ioc_type_str = row[3].strip()
            
            # Map ThreatFox types to our canonical ENUM
            type_map = {
                "ip:port": IndicatorType.ip,
                "domain": IndicatorType.domain,
                "url": IndicatorType.url,
                "md5_hash": IndicatorType.hash_md5,
                "sha256_hash": IndicatorType.hash_sha256
            }
            
            ind_type = type_map.get(ioc_type_str)
            if ind_type:
                # IPs with ports need to be stripped for our schema
                if ind_type == IndicatorType.ip and ":" in ioc_value:
                    ioc_value = ioc_value.split(":")[0]
                upsert_and_project_indicator(db, ioc_value, ind_type, 80)
                count += 1
    db.commit()
    return {"source": "ThreatFox", "count": count}

@celery_app.task
def ingest_phishtank():
    """Simulated PhishTank known phishing domains ingestion."""
    logger.info("Syncing PhishTank...")
    # Placeholder for PhishTank API logic
    return {"source": "PhishTank", "count": 0}

@celery_app.task
def ingest_alienvault_otx(api_key: str = None):
    """Simulated AlienVault OTX ingestion."""
    logger.info("Syncing AlienVault OTX...")
    # Placeholder for OTX REST API logic
    return {"source": "AlienVault OTX", "count": 0}
