"""
Blocklist.de feed ingestion.

Free, no API key required. Aggregates IPs reported for attacks
(SSH brute force, mail abuse, web attacks, etc.) by fail2ban-style
reporting servers worldwide.

Usage:
    python ingest_blocklistde.py
"""

import requests
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy import text

from database import SessionLocal
import models
from services.feed_service import update_feed

BLOCKLIST_URL = "https://lists.blocklist.de/lists/all.txt"


def fetch_attack_ips() -> list[str]:
    headers = {
        "User-Agent": "ThreatLens/1.0 (SOC research project)"
    }

    resp = requests.get(
        BLOCKLIST_URL,
        headers=headers,
        timeout=30,
    )

    resp.raise_for_status()

    lines = resp.text.strip().splitlines()

    return [line.strip() for line in lines if line.strip()]


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
        seen_in_feeds=["Blocklist.de"],
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

    db = SessionLocal()

    try:

        ips = fetch_attack_ips()

        print(f"Fetched {len(ips)} attack-source IPs from Blocklist.de.")

        count = 0
        seen = set()

        for ip in ips:

            if ip in seen:
                continue

            seen.add(ip)

            upsert_indicator(
                db=db,
                value=ip,
                ind_type=models.IndicatorType.ip,
                confidence=60,
                notes="Blocklist.de: reported attack source",
            )

            count += 1

        db.commit()

        update_feed(
            db=db,
            feed_name="Blocklist.de",
            indicator_count=count,
        )

        print(f"Imported {count} Blocklist.de indicators.")

    finally:

        db.close()


if __name__ == "__main__":
    main()