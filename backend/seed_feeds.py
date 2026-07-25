from database import SessionLocal
import models

db = SessionLocal()

feeds = [
    {
        "name": "AbuseIPDB",
        "description": "Community-reported malicious IP blacklist",
        "status": "Healthy",
        "reliability": 90,
    },
    {
        "name": "AlienVault OTX",
        "description": "Open Threat Exchange community intelligence",
        "status": "Healthy",
        "reliability": 85,
    },
    {
        "name": "ThreatFox",
        "description": "Abuse.ch malware IOC feed",
        "status": "Healthy",
        "reliability": 80,
    },
    {
        "name": "URLHaus",
        "description": "Malware URL feed",
        "status": "Healthy",
        "reliability": 85,
    },
    {
        "name": "Feodo Tracker",
        "description": "Botnet C2 and Feodo infrastructure",
        "status": "Healthy",
        "reliability": 95,
    },
    {
        "name": "Blocklist.de",
        "description": "Attack source IP blacklist",
        "status": "Healthy",
        "reliability": 75,
    },
]

for feed in feeds:

    existing = (
        db.query(models.Feed)
        .filter(models.Feed.name == feed["name"])
        .first()
    )

    if existing:
        print(f"{feed['name']} already exists")
        continue

    db.add(
        models.Feed(
            name=feed["name"],
            description=feed["description"],
            status=feed["status"],
            reliability=feed["reliability"],
            indicator_count=0,
        )
    )

db.commit()

print("Threat feeds seeded successfully.")

db.close()