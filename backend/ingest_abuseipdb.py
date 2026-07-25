import os
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.sql import func
from sqlalchemy import text

from database import SessionLocal
import models
from scoring import compute_severity_score
from services.feed_service import update_feed

load_dotenv()

API_KEY = os.getenv("ABUSEIPDB_API_KEY")
BLACKLIST_URL = "https://api.abuseipdb.com/api/v2/blacklist"


def fetch_malicious_ips():
    headers = {
        "Key": API_KEY,
        "Accept": "application/json",
    }

    params = {
        "confidenceMinimum": 75,
        "limit": 100,
    }

    response = requests.get(
        BLACKLIST_URL,
        headers=headers,
        params=params,
        timeout=30,
    )

    response.raise_for_status()

    return response.json()["data"]


def ingest():

    db = SessionLocal()

    try:

        raw_ips = fetch_malicious_ips()

        count = 0

        for entry in raw_ips:

            ip_value = entry["ipAddress"]
            confidence = entry["abuseConfidenceScore"]

            last_seen_str = entry.get("lastReportedAt")

            last_seen = (
                datetime.fromisoformat(last_seen_str.replace("Z", "+00:00"))
                if last_seen_str
                else datetime.now(timezone.utc)
            )

            score = compute_severity_score(
                confidence=confidence,
                source="abuseipdb",
                last_seen=last_seen,
            )

            stmt = (
                pg_insert(models.Indicator)
                .values(
                    value=ip_value,
                    type=models.IndicatorType.ip,
                    severity_score=score,
                    confidence=confidence,
                    tlp=models.TLP.clear,
                    status=models.IndicatorStatus.active,
                    last_seen=last_seen,
                    seen_in_feeds=["AbuseIPDB"],
                )
                .on_conflict_do_update(
                    index_elements=["value"],
                    set_={
                        "severity_score": score,
                        "confidence": confidence,
                        "last_seen": last_seen,
                        "updated_at": func.now(),
                        "tlp": models.TLP.clear,
                        "seen_in_feeds": text(
                            "(SELECT ARRAY(SELECT DISTINCT unnest(indicators.seen_in_feeds || excluded.seen_in_feeds)))"
                        ),
                    },
                )
            )

            db.execute(stmt)

            count += 1

        db.commit()

        update_feed(
            db=db,
            feed_name="AbuseIPDB",
            indicator_count=count,
        )

        print(f"Imported {count} AbuseIPDB indicators.")

    finally:

        db.close()


if __name__ == "__main__":
    ingest()