"""
ThreatFox feed ingestion (abuse.ch).

Free API, requires an Auth-Key from https://auth.abuse.ch/
Pulls IOCs reported in the last N days across multiple types
(ip:port, domain, url, md5_hash, sha256_hash, etc).

Usage:
    python ingest_threatfox.py
"""

import os
import requests
from dotenv import load_dotenv
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy import text

from database import SessionLocal
import models
from services.feed_service import update_feed

load_dotenv()

THREATFOX_API_KEY = os.getenv("THREATFOX_API_KEY")
THREATFOX_URL = "https://threatfox-api.abuse.ch/api/v1/"

TYPE_MAP = {
    "ip:port": models.IndicatorType.ip,
    "domain": models.IndicatorType.domain,
    "url": models.IndicatorType.url,
    "md5_hash": models.IndicatorType.hash_md5,
    "sha256_hash": models.IndicatorType.hash_sha256,
}


def fetch_recent_iocs(days: int = 3) -> list[dict]:
    headers = (
        {
            "Auth-Key": THREATFOX_API_KEY,
            "User-Agent": "ThreatLens/1.0 (SOC research project)",
        }
        if THREATFOX_API_KEY
        else {"User-Agent": "ThreatLens/1.0 (SOC research project)"}
    )

    payload = {
        "query": "get_iocs",
        "days": days,
    }

    resp = requests.post(
        THREATFOX_URL,
        json=payload,
        headers=headers,
        timeout=30,
    )

    if resp.status_code != 200:
        print(f"Status: {resp.status_code}")
        print(resp.text)
        resp.raise_for_status()

    body = resp.json()

    if body.get("query_status") != "ok":
        print(f"ThreatFox returned: {body.get('query_status')}")
        return []

    return body.get("data", [])


def upsert_indicator(
    db,
    value: str,
    ind_type: models.IndicatorType,
    confidence: int,
    notes: str = None,
):
    stmt = pg_insert(models.Indicator).values(
        value=value,
        type=ind_type,
        confidence=confidence,
        severity_score=confidence,
        notes=notes,
        tlp=models.TLP.clear,
        seen_in_feeds=["ThreatFox"],
    )

    stmt = stmt.on_conflict_do_update(
        index_elements=["value"],
        set_={
            "last_seen": stmt.excluded.last_seen,
            "confidence": stmt.excluded.confidence,
            "tlp": stmt.excluded.tlp,
            "seen_in_feeds": text(
                "(SELECT ARRAY(SELECT DISTINCT unnest(indicators.seen_in_feeds || excluded.seen_in_feeds)))"
            ),
        },
    )

    db.execute(stmt)


def main():

    if not THREATFOX_API_KEY:
        print("THREATFOX_API_KEY not set in .env")
        return

    db = SessionLocal()

    try:

        iocs = fetch_recent_iocs(days=3)

        print(f"Fetched {len(iocs)} IOCs from ThreatFox.")

        seen_in_batch = set()
        counts = {}
        count = 0

        for ioc in iocs:

            raw_type = ioc.get("ioc_type")
            mapped_type = TYPE_MAP.get(raw_type)

            if not mapped_type:
                continue

            value = ioc.get("ioc")

            if not value:
                continue

            if raw_type == "ip:port" and ":" in value:
                value = value.split(":")[0]

            if value in seen_in_batch:
                continue

            seen_in_batch.add(value)

            confidence_level = ioc.get("confidence_level", 50)
            malware = ioc.get("malware_printable", "Unknown")

            upsert_indicator(
                db=db,
                value=value,
                ind_type=mapped_type,
                confidence=confidence_level,
                notes=f"ThreatFox: {malware}",
            )

            counts[mapped_type.value] = (
                counts.get(mapped_type.value, 0) + 1
            )

            count += 1

        db.commit()

        update_feed(
            db=db,
            feed_name="ThreatFox",
            indicator_count=count,
        )

        print(f"\nImported {count} indicators.")
        print(f"Indicators by type: {counts}")

    finally:
        db.close()


if __name__ == "__main__":
    main()