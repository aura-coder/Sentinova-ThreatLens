from datetime import datetime
from sqlalchemy.orm import Session

import models


def update_feed(
    db: Session,
    feed_name: str,
    indicator_count: int,
    status: str = "Healthy",
):
    """
    Update feed metadata after a successful ingestion.
    """

    feed = (
        db.query(models.Feed)
        .filter(models.Feed.name == feed_name)
        .first()
    )

    if not feed:
        print(f"Feed '{feed_name}' not found.")
        return

    feed.indicator_count = indicator_count
    feed.status = status
    feed.last_sync = datetime.utcnow()

    db.commit()

    print(f"{feed_name} updated successfully.")