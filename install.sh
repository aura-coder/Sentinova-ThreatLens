#!/bin/bash

# =====================================================================
# ThreatLens - Complete Setup Script
# This script installs all dependencies and starts services.
# =====================================================================

echo "============================================================"
echo " ThreatLens Setup Script"
echo "============================================================"

# ---- Step 1: Check Prerequisites ----
echo ""
echo "[1/6] Checking prerequisites..."

# Python
if command -v python3 &>/dev/null; then
    echo "  ✅ Python 3: $(python3 --version)"
else
    echo "  ❌ Python 3 not found. Please install Python 3.11+."
    exit 1
fi

# Node.js
if command -v node &>/dev/null; then
    echo "  ✅ Node.js: $(node --version)"
else
    echo "  ❌ Node.js not found. Please install Node.js 20+."
    exit 1
fi

# Docker
if command -v docker &>/dev/null; then
    echo "  ✅ Docker: $(docker --version)"
else
    echo "  ❌ Docker not found. Please install Docker first."
    exit 1
fi

# ---- Step 2: Setup Backend ----
echo ""
echo "[2/6] Setting up Backend (Python)..."

cd backend

if [ ! -d "venv" ]; then
    echo "  Creating virtual environment..."
    python3 -m venv venv
fi

echo "  Activating virtual environment..."
source venv/bin/activate

echo "  Installing Python packages..."
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "  ❌ Backend dependencies failed to install. Please check network."
    exit 1
fi

echo "  ✅ Backend dependencies installed."

cd ..

# ---- Step 3: Start Docker Services ----
echo ""
echo "[3/6] Starting Database, Redis, and Elasticsearch via Docker..."

if [ -f "docker-compose.yml" ]; then
    docker-compose up -d db redis elasticsearch
    echo "  ✅ Docker services started."
else
    echo "  ❌ docker-compose.yml not found in root."
    exit 1
fi

# Wait for services to be ready
echo "  Waiting for services to be ready (30s)..."
sleep 30

# ---- Step 4: Initialize Database ----
echo ""
echo "[4/6] Initializing Database..."

cd backend

if [ -f ".env" ]; then
    echo "  Using existing .env file."
else
    echo "  Creating .env file with default values..."
    cat > .env << 'ENVEOF'
DATABASE_URL=postgresql://threatlens_user:supersecretpassword@localhost:5432/threatlens
REDIS_URL=redis://localhost:6379/0
ELASTICSEARCH_URL=http://localhost:9200
JWT_SECRET_KEY=super_secret_key_123
ENVEOF
fi

# Run init and seed
echo "  Running init_db.py..."
python init_db.py

echo "  Running seed_feeds.py..."
python seed_feeds.py

echo "  Creating admin user (admin@threatlens.local / Admin@123) if not exists..."
python create_admin.py admin@threatlens.local Admin@123 || echo "  (Admin may already exist, skipping)"

echo "  ✅ Database initialized."

cd ..

# ---- Step 5: Setup Frontend ----
echo ""
echo "[5/6] Setting up Frontend (Next.js)..."

cd frontend

if [ ! -d "node_modules" ]; then
    echo "  Installing Node modules... (This may take a few minutes)"
    npm install
else
    echo "  Node modules already exist."
fi

echo "  ✅ Frontend setup complete."

cd ..

# ---- Step 6: Done ----
echo ""
echo "============================================================"
echo " Setup Complete! 🎉"
echo "============================================================"
echo ""
echo "Now, to start the application, use the start script:"
echo "  ./start.sh"
echo ""
echo "And to stop the application, use the stop script:"
echo "  ./stop.sh"
echo ""
echo "Open http://localhost:3000 and login with:"
echo "  Email: admin@threatlens.local"
echo "  Password: Admin@123"
echo ""
echo "============================================================"
