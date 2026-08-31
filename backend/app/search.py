import logging
from elasticsearch import Elasticsearch

logger = logging.getLogger(__name__)

# Connect to the Elasticsearch container
es_client = Elasticsearch("http://localhost:9200", verify_certs=False)

INDEX_NAME = "threatlens-indicators"

def setup_elasticsearch():
    """Creates the index with specific mappings for faceted search if it doesn't exist."""
    try:
        if not es_client.indices.exists(index=INDEX_NAME):
            mapping = {
                "mappings": {
                    "properties": {
                        "id": {"type": "keyword"},
                        "value": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                        "type": {"type": "keyword"},
                        "severity_score": {"type": "integer"},
                        "confidence": {"type": "integer"},
                        "tlp": {"type": "keyword"},
                        "status": {"type": "keyword"},
                        "tags": {"type": "keyword"},
                        "last_seen": {"type": "date"}
                    }
                }
            }
            es_client.indices.create(index=INDEX_NAME, body=mapping)
            logger.info(f"Created Elasticsearch index: {INDEX_NAME}")
    except Exception as e:
        logger.warning(f"Elasticsearch setup skipped/unreachable: {e}")

def project_indicator_to_index(indicator: dict):
    """Upserts a denormalized indicator record into Elasticsearch."""
    try:
        es_client.index(index=INDEX_NAME, id=str(indicator["id"]), document=indicator)
    except Exception as e:
        logger.error(f"Failed to project indicator to ES: {e}")

def search_indicators(query_string: str = "*", type_filter: str = None, min_severity: int = 0):
    """Executes a full-text search with optional facets."""
    query = {
        "bool": {
            "must": [{"query_string": {"query": query_string}}],
            "filter": [
                {"range": {"severity_score": {"gte": min_severity}}}
            ]
        }
    }
    
    if type_filter and type_filter != "all":
        query["bool"]["filter"].append({"term": {"type": type_filter}})

    try:
        response = es_client.search(index=INDEX_NAME, query=query, size=50)
        hits = response["hits"]["hits"]
        return [hit["_source"] for hit in hits]
    except Exception as e:
        logger.error(f"Search failed: {e}")
        return []
