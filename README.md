# ThreatLens

A full-stack Cyber Threat Intelligence (CTI) platform that aggregates, correlates, and scores indicators of compromise (IOCs) from multiple live threat feeds, built as a SOC L1 portfolio project.

## What it does

- Ingests real-time indicators from 6 threat intelligence feeds: ThreatFox, URLHaus, Feodo Tracker, Blocklist.de, AbuseIPDB, and AlienVault OTX
- Scores every indicator's severity (0–100) using a confidence × source-reliability × recency-decay formula
- Flags indicators independently confirmed by 2+ feeds as high-confidence correlated threats
- Provides full-text search over 45,000+ indicators via Elasticsearch
- Enforces 6-role RBAC (admin, security engineer, incident responder, threat hunter, SOC analyst, executive)
- Automatically re-syncs all feeds on a schedule (every 6 hours) via APScheduler
- Logs every state-changing action to an append-only audit trail
- Serves role-specific dashboards (Analyst, Executive, Incident Responder)

## Tech stack

**Backend:** FastAPI, PostgreSQL, SQLAlchemy, Alembic, Elasticsearch, Redis, APScheduler
**Frontend:** Next.js, React, Tailwind CSS
**Infra:** Docker Compose

## Architecture

Frontend (Next.js) → FastAPI backend → PostgreSQL (system of record)
→ Elasticsearch (search index)
→ Redis (caching)
↑
6 ingestion scripts (scheduled every 6h)

## Running it locally

### Prerequisites
- Docker & Docker Compose
- Python 3.11+
- Node.js 18+
- Free API keys from [ThreatFox](https://auth.abuse.ch/), [AbuseIPDB](https://www.abuseipdb.com/), and [AlienVault OTX](https://otx.alienvault.com/) (URLHaus, Feodo Tracker, and Blocklist.de need no key)

### 1. Clone and start infrastructure
```bash
git clone https://github.com/aura-coder/Sentinova-ThreatLens.git
cd Sentinova-ThreatLens
docker-compose up -d
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env — fill in your DATABASE_URL, JWT_SECRET_KEY, and feed API keys

alembic upgrade head
python create_admin.py your@email.com yourpassword
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### 3. Ingest initial data
```bash
python ingest_threatfox.py
python ingest_urlhaus.py
python ingest_feodotracker.py
python ingest_blocklistde.py
python ingest_abuseipdb.py
python ingest_otx.py
```
(The scheduler will re-run these automatically every 6 hours after that.)

### 4. Frontend setup
```bash
cd ../frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`.

### 5. Run the test suite
```bash
cd ../backend
pytest -v
```

## Notes

- Elasticsearch needs a one-time indexing pass after first ingesting data: `python index_to_elasticsearch.py`
- There's no public signup — the first admin account is created via `create_admin.py`, and all other users are provisioned by an admin from there (intentional, matches how real SOC accounts are provisioned)
- Built as a portfolio project; not intended for production use as-is (see the security/hardening notes in the project's internal PRD for what a production deployment would additionally require)


