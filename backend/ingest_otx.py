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

API_KEY = os.getenv("OTX_API_KEY")
PULSES_URL = "https://otx.alienvault.com/api/v1/pulses/subscribed"

# OTX type -> ThreatLens type mapping
OTX_TYPE_MAP = {
    "IPv4": models.IndicatorType.ip,
    "IPv6": models.IndicatorType.ip,
    "domain": models.IndicatorType.domain,
    "hostname": models.IndicatorType.domain,
    "URL": models.IndicatorType.url,
    "FileHash-MD5": models.IndicatorType.hash_md5,
    "FileHash-SHA256": models.IndicatorType.hash_sha256,
    "email": models.IndicatorType.email,
    "CVE": models.IndicatorType.cve,
}


def fetch_pulses():
    headers = {
        "X-OTX-API-KEY": API_KEY,
    }

    params = {
        "limit": 20,
    }

    response = requests.get(
        PULSES_URL,
        headers=headers,
        params=params,
        timeout=30,
    )

    response.raise_for_status()

    return response.json()["results"]


def ingest():

    db = SessionLocal()

    try:

        pulses = fetch_pulses()

        count = 0
        skipped_unknown_type = 0

        for pulse in pulses:

            for ioc in pulse.get("indicators", []):

                otx_type = ioc.get("type")
                our_type = OTX_TYPE_MAP.get(otx_type)

                if our_type is None:
                    skipped_unknown_type += 1
                    continue

                value = ioc.get("indicator")

                if not value:
                    continue

                last_seen = datetime.now(timezone.utc)

                confidence = 70

                score = compute_severity_score(
                    confidence=confidence,
                    source="otx",
                    last_seen=last_seen,
                )

                stmt = (
                    pg_insert(models.Indicator)
                    .values(
                        value=value,
                        type=our_type,
                        severity_score=score,
                        confidence=confidence,
                        tlp=models.TLP.clear,
                        status=models.IndicatorStatus.active,
                        last_seen=last_seen,
                        seen_in_feeds=["AlienVault OTX"],
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
            feed_name="AlienVault OTX",
            indicator_count=count,
        )

        print(f"Imported {count} AlienVault OTX indicators.")
        print(f"Skipped {skipped_unknown_type} unsupported indicator types.")

    finally:

        db.close()


if __name__ == "__main__":
    ingest()