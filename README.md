# ThreatLens - Cyber Threat Intelligence Dashboard

**ThreatLens** is an enterprise-grade Cyber Threat Intelligence (CTI) platform built for Security Operations Centres (SOC). It aggregates threat data from public and private feeds, normalizes and deduplicates IOCs (Indicators of Compromise), enriches them with context, assigns a confidence-weighted severity score, and surfaces the results through role-specific dashboards.

Built based on a detailed Product Requirements Document (PRD) adhering to STIX 2.1, TAXII 2.1, MITRE ATT&CK, and TLP standards.

---

## 🚀 Key Features

- **Threat Intelligence Aggregation**: Ingests data from 6+ sources (AlienVault OTX, AbuseIPDB, ThreatFox, URLhaus, Feodo Tracker, Blocklist.de).
- **IOC Management**: Manage IPs, Domains, URLs, and Hashes with TLP tags, confidence, and lifecycle status.
- **Severity Scoring**: Transparent 0-100 scoring engine using source reliability and recency.
- **Role-Based Dashboards**: 
  - **Executive**: Risk Posture, TLP/Type Distribution, Risk Heatmap.
  - **SOC Analyst**: Live Triage Queue, Signal Pipeline.
  - **Incident Response**: Active Cases, Team Workload & SLAs, Automation Efficiency.
  - **Threat Hunting**: TQL Query Editor, MITRE ATT&CK Navigator, Real IOC Results.
  - **Entity Explorer**: Elastic-style breakdown of IPs, Domains, Hashes.
- **Enterprise Security**: JWT Auth, RBAC, Append-only Audit Logs, Global Search.
- **Manual Feed Sync**: Automatic schedulers are disabled to respect Free API rate limits. Users can sync feeds manually via the UI.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (React), TypeScript, Tailwind CSS, Recharts, Lucide Icons
- **Backend**: Python, FastAPI, SQLAlchemy, Pydantic
- **Data Stores**: PostgreSQL (System of Record), Elasticsearch (Search/Analytics), Redis (Cache)
- **Containerization**: Docker & Docker Compose

---

## 📁 Project Structure
```text
threatlens/
├── backend/               # FastAPI application, workers, models
│   ├── Dockerfile         # Backend Docker setup
│   └── requirements.txt
├── frontend/              # Next.js application (App Router)
│   ├── Dockerfile         # Frontend Docker setup
│   └── package.json
├── docker-compose.yml     # Orchestrates full stack (DB, Redis, ES, API, UI)
├── install.sh             # One-time setup script (installs everything)
├── start.sh               # Starts all services (Docker + Backend + Frontend)
├── stop.sh                # Stops all services
└── README.md
