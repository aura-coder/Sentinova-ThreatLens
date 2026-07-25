from database import SessionLocal
import models

def seed():
    db = SessionLocal()
    test_indicator = models.Indicator(
        value="185.220.101.4",
        type=models.IndicatorType.ip,
        severity_score=96,
        confidence=91,
        tlp=models.TLP.amber,
        status=models.IndicatorStatus.active,
    )
    db.add(test_indicator)
    db.commit()
    print("Inserted 1 test indicator.")
    db.close()

if __name__ == "__main__":
    seed()