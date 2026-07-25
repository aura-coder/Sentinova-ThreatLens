"""
Feodo Tracker feed ingestion (abuse.ch).

Free, no API key required. Tracks active botnet Command & Control
(C2) server IPs for malware families like Dridex, Emotet, TrickBot.

Usage:
    python ingest_feodotracker.py
"""

import requests
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy import text

from database import SessionLocal
import models
from services.feed_service import update_feed

FEODO_URL = "https://feodotracker.abuse.ch/downloads/ipblocklist.json"


def fetch_c2_ips() -> list[dict]:
    headers = {
        "User-Agent": "ThreatLens/1.0 (SOC research project)"
    }

    resp = requests.get(
        FEODO_URL,
        headers=headers,
        timeout=30,
    )

    resp.raise_for_status()

    return resp.json()


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
        seen_in_feeds=["Feodo Tracker"],
    )

    stmt = stmt.on_conflict_do_update(
        index_elements=["value"],
        set_={
            "last_seen": stmt.excluded.last_seen,
            "confidence": stmt.excluded.confidence,
            "seen_in_feeds": text(
                "(SELECT ARRAY(SELECT DISTINCT unnest(indicators.seen_in_feeds || excluded.seen_in_feeds)))"
            ),
        },
    )

    db.execute(stmt)


def main():

    db = SessionLocal()

    try:

        entries = fetch_c2_ips()

        print(f"Fetched {len(entries)} C2 IPs from Feodo Tracker.")

        count = 0

        for entry in entries:

            ip = entry.get("ip_address")
            malware = entry.get("malware", "unknown botnet")
            status = entry.get("status", "")

            if not ip or status != "online":
                continue

            upsert_indicator(
                db=db,
                value=ip,
                ind_type=models.IndicatorType.ip,
                confidence=85,
                notes=f"Feodo Tracker: {malware} C2",
            )

            count += 1

        db.commit()

        update_feed(
            db=db,
            feed_name="Feodo Tracker",
            indicator_count=count,
        )

        print(f"Imported {count} Feodo Tracker indicators.")

    finally:

        db.close()


if __name__ == "__main__":
    main()