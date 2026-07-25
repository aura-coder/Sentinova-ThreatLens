"""
URLhaus feed ingestion (abuse.ch).

Free, no API key required. Pulls recently reported malware
distribution URLs and their associated domains.

Usage:
    python ingest_urlhaus.py
"""

import requests
from urllib.parse import urlparse

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy import text

from database import SessionLocal
import models
from services.feed_service import update_feed

URLHAUS_RECENT_URL = "https://urlhaus.abuse.ch/downloads/json_recent/"


def fetch_recent_urls() -> list[dict]:
    resp = requests.get(URLHAUS_RECENT_URL, timeout=30)
    resp.raise_for_status()

    data = resp.json()

    entries = []

    for value in data.values():
        if isinstance(value, list):
            entries.extend(value)

    return entries


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
        seen_in_feeds=["URLHaus"],
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

        entries = fetch_recent_urls()

        print(f"Fetched {len(entries)} entries from URLhaus.")

        seen_in_batch = set()

        url_count = 0
        domain_count = 0

        for entry in entries:

            url = entry.get("url")
            threat = entry.get("threat", "malware_download")
            status = entry.get("url_status", "")

            if not url or status != "online":
                continue

            if url not in seen_in_batch:

                upsert_indicator(
                    db=db,
                    value=url,
                    ind_type=models.IndicatorType.url,
                    confidence=75,
                    notes=f"URLhaus: {threat}",
                )

                seen_in_batch.add(url)
                url_count += 1

            domain = urlparse(url).hostname

            if domain and domain not in seen_in_batch:

                upsert_indicator(
                    db=db,
                    value=domain,
                    ind_type=models.IndicatorType.domain,
                    confidence=65,
                    notes=f"URLhaus: {threat}",
                )

                seen_in_batch.add(domain)
                domain_count += 1

        db.commit()

        total = url_count + domain_count

        update_feed(
            db=db,
            feed_name="URLHaus",
            indicator_count=total,
        )

        print(f"Imported {total} URLHaus indicators.")
        print(f"URLs: {url_count}")
        print(f"Domains: {domain_count}")

    finally:

        db.close()


if __name__ == "__main__":
    main()