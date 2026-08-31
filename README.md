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
```

⚡ Installation & Usage (3 Simple Scripts)
This project uses 3 simple shell scripts to manage the entire lifecycle. You do not need to manually run uvicorn or npm commands.

1. ./install.sh (Run this ONCE)
This is the one-time setup script. It:

Checks prerequisites (Python 3, Node.js 20+, Docker).

Sets up Backend: Creates a Python virtual environment and installs all Python dependencies.

Sets up Database: Starts PostgreSQL, Redis, and Elasticsearch using Docker Compose.

Initializes Database: Creates tables, seeds the threat feeds, and creates a default admin user.

Sets up Frontend: Installs all Node.js packages (npm install).

Note: You only need to run this script the first time you clone the repository.

2. ./start.sh (Run this EVERY TIME you want to start)
This script starts all services in the background:

Starts Docker infrastructure: docker-compose up -d db redis elasticsearch

Starts Backend: Activates the virtual environment and runs uvicorn on port 8000 (logs saved to backend.log).

Starts Frontend: Runs npm run dev on port 3000 (logs saved to frontend.log).

After running, you can access:

Frontend UI: http://localhost:3000

Backend API Documentation: http://localhost:8000/docs

3. ./stop.sh (Run this EVERY TIME you want to stop)
This script cleanly shuts down all services:

Stops Docker infrastructure.

Kills any running uvicorn and next dev processes.

Cleans up log files.

🔑 Default Login Credentials
After running install.sh and start.sh, log in with:

Email: admin@threatlens.local

Password: Admin@123

🔒 Note on API Credits
The project supports Manual Sync to save free-tier API limits. Users can click the "Sync" button on the Threat Feeds page to fetch fresh IOCs manually.

📝 License
Internal / Confidential - Built by aura-coder as a Capstone Project.
