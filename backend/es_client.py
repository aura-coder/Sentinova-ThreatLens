import os
from dotenv import load_dotenv
from elasticsearch import Elasticsearch

load_dotenv()

ELASTICSEARCH_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")

es = Elasticsearch(ELASTICSEARCH_URL)

INDEX_NAME = "indicators"
