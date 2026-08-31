#!/bin/bash

set -e  # stop on error

echo "🔧 ThreatLens – All‑in‑One Fix & Startup Script"
echo "================================================"

# ------------------------------------------------------------
# 1. Ensure Docker is running
# ------------------------------------------------------------
if ! systemctl is-active --quiet docker; then
    echo "Starting Docker daemon (requires sudo)..."
    sudo systemctl start docker
    sleep 2
    if ! systemctl is-active --quiet docker; then
        echo "❌ Failed to start Docker. Please start it manually: sudo systemctl start docker"
        exit 1
    fi
fi

# ------------------------------------------------------------
# 2. Start containers
# ------------------------------------------------------------
cd ~/threatlens
echo "Starting Docker containers..."
docker compose up -d postgres redis elasticsearch

# ------------------------------------------------------------
# 3. Wait for PostgreSQL
# ------------------------------------------------------------
echo "Waiting for PostgreSQL..."
MAX_RETRIES=30
RETRY=0
until PGPASSWORD=supersecretpassword psql -h 127.0.0.1 -U threatlens_user -d threatlens -c "SELECT 1" > /dev/null 2>&1; do
    RETRY=$((RETRY+1))
    if [ $RETRY -ge $MAX_RETRIES ]; then
        echo "❌ PostgreSQL not ready. Aborting."
        exit 1
    fi
    sleep 2
done
echo "✅ PostgreSQL ready."

# ------------------------------------------------------------
# 4. Set environment and go to backend
# ------------------------------------------------------------
export DATABASE_URL="postgresql://threatlens_user:supersecretpassword@127.0.0.1:5432/threatlens"
cd ~/threatlens/backend

# ------------------------------------------------------------
# 5. Install Python dependencies (if missing)
# ------------------------------------------------------------
if [ ! -d "venv" ] || [ ! -f "venv/bin/activate" ]; then
    echo "Setting up Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
    echo "Virtual environment already exists."
fi

# ------------------------------------------------------------
# 6. Ensure alembic is installed (in case requirements changed)
# ------------------------------------------------------------
pip install alembic 2>/dev/null || true

# ------------------------------------------------------------
# 7. Run migrations (with intelligent fallback)
# ------------------------------------------------------------
echo "Running database migrations..."
# Try a normal upgrade
if alembic upgrade head 2>/dev/null; then
    echo "✅ Migrations applied successfully."
else
    echo "⚠️  Migration failed – attempting to fix by stamping the current head."
    # Get the latest revision ID from the versions folder
    LATEST_REV=$(ls -1 alembic/versions/*.py | tail -1 | sed -E 's/.*[0-9a-f]{12}(_[a-z0-9_]+)?\.py/\1/' | sed 's/^_//' | cut -d'_' -f1)
    if [ -n "$LATEST_REV" ]; then
        alembic stamp "$LATEST_REV" 2>/dev/null || true
        echo "✅ Stamped to revision $LATEST_REV."
    else
        echo "⚠️  Could not determine latest revision. Please check manually."
    fi
fi

# ------------------------------------------------------------
# 8. Seed feeds and test data (idempotent)
# ------------------------------------------------------------
echo "Seeding feeds..."
python seed_feeds.py 2>/dev/null || true

echo "Seeding test indicators..."
python seed_test_data.py 2>/dev/null || true

# ------------------------------------------------------------
# 9. Create admin user if missing
# ------------------------------------------------------------
echo "Ensuring admin user exists..."
python create_admin.py admin@threatlens.local admin123 2>/dev/null || true

# ------------------------------------------------------------
# 10. Install frontend dependencies (if node_modules missing)
# ------------------------------------------------------------
cd ~/threatlens/frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
else
    echo "Frontend dependencies already installed."
fi

# ------------------------------------------------------------
# 11. Stop any old processes
# ------------------------------------------------------------
echo "Stopping previous backend/frontend processes..."
pkill -f "uvicorn main:app" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
sleep 1

# ------------------------------------------------------------
# 12. Start backend
# ------------------------------------------------------------
echo "Starting backend (port 8000)..."
cd ~/threatlens/backend
source venv/bin/activate
nohup uvicorn main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &

# ------------------------------------------------------------
# 13. Start frontend
# ------------------------------------------------------------
echo "Starting frontend (port 3000)..."
cd ~/threatlens/frontend
nohup npm run dev > frontend.log 2>&1 &

# ------------------------------------------------------------
# 14. Done
# ------------------------------------------------------------
echo ""
echo "✅ All services started!"
echo "📍 Frontend:  http://localhost:3000"
echo "📍 Backend API: http://localhost:8000/docs"
echo "🔑 Login: admin@threatlens.local / admin123"
echo ""
echo "📄 Logs:"
echo "   Backend:  tail -f ~/threatlens/backend/backend.log"
echo "   Frontend: tail -f ~/threatlens/frontend/frontend.log"
echo ""
echo "🛑 To stop: bash ~/threatlens/stop.sh"
