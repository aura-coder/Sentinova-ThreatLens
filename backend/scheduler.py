import subprocess
import logging
from apscheduler.schedulers.background import BackgroundScheduler

logger = logging.getLogger("threatlens.scheduler")
logging.basicConfig(level=logging.INFO)

FEED_SCRIPTS = {
    "ThreatFox": "ingest_threatfox.py",
    "AbuseIPDB": "ingest_abuseipdb.py",
    "AlienVault OTX": "ingest_otx.py",
    "URLHaus": "ingest_urlhaus.py",
    "Feodo Tracker": "ingest_feodotracker.py",
    "Blocklist.de": "ingest_blocklistde.py",
}


def run_feed_sync(feed_name: str, script: str):
    logger.info(f"[scheduler] Starting scheduled sync: {feed_name}")
    result = subprocess.run(["python", script], capture_output=True, text=True)
    if result.returncode != 0:
        logger.error(f"[scheduler] {feed_name} failed: {result.stderr}")
    else:
        logger.info(f"[scheduler] {feed_name} completed successfully.")


scheduler = BackgroundScheduler()


def start_scheduler(interval_hours: int = 6):
    for feed_name, script in FEED_SCRIPTS.items():
        scheduler.add_job(
            run_feed_sync,
            "interval",
            hours=interval_hours,
            args=[feed_name, script],
            id=f"sync_{feed_name}",
            replace_existing=True,
            max_instances=1,
        )
    scheduler.start()
    logger.info(f"[scheduler] Started — syncing all feeds every {interval_hours}h.")


def stop_scheduler():
    scheduler.shutdown(wait=False)
