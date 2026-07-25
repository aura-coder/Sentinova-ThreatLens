from database import SessionLocal
import models
from es_client import es, INDEX_NAME
from elasticsearch.helpers import bulk

BATCH_SIZE = 500  # small batches to stay light on 8GB RAM


def generate_docs(indicators):
    for ind in indicators:
        yield {
            "_index": INDEX_NAME,
            "_id": str(ind.id),
            "_source": {
                "value": ind.value,
                "type": ind.type.value,
                "severity_score": ind.severity_score,
                "confidence": ind.confidence,
                "tlp": ind.tlp.value,
                "status": ind.status.value,
                "source_feed": ind.source_feed,
                "notes": ind.notes,
            },
        }


def main():
    db = SessionLocal()
    try:
        total_indexed = 0
        offset = 0

        while True:
            batch = (
                db.query(models.Indicator)
                .order_by(models.Indicator.id)
                .offset(offset)
                .limit(BATCH_SIZE)
                .all()
            )
            if not batch:
                break

            success, errors = bulk(es, generate_docs(batch), raise_on_error=False)
            total_indexed += success
            offset += BATCH_SIZE

            print(f"Indexed {total_indexed} so far...")

        print(f"Done. Indexed {total_indexed} indicators into Elasticsearch.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
