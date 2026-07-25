from database import SessionLocal
import models

db = SessionLocal()

feeds = db.query(models.Feed).all()

print(f"\nTotal feeds: {len(feeds)}\n")

for feed in feeds:
    print("------------------------------")
    print("Name:", feed.name)
    print("Status:", feed.status)
    print("Reliability:", feed.reliability)
    print("Indicators:", feed.indicator_count)
    print("Last Sync:", feed.last_sync)

db.close()