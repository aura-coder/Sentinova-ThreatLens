#!/bin/bash
set -e

echo "🚀 ThreatLens Startup Script"

if ! systemctl is-active --quiet docker; then
    echo "Starting Docker daemon..."
    sudo systemctl start docker
    sleep 2
fi

cd ~/threatlens
echo "Starting Docker containers..."
docker compose up -d postgres redis elasticsearch

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

cd ~/threatlens/backend
export DATABASE_URL="postgresql://threatlens_user:supersecretpassword@127.0.0.1:5432/threatlens"

echo "Running migrations..."
alembic upgrade head

echo "Seeding feeds..."
python seed_feeds.py 2>/dev/null || true
echo "Seeding test data..."
python seed_test_data.py 2>/dev/null || true
echo "Creating admin user..."
python create_admin.py admin@threatlens.local admin123 2>/dev/null || true

echo "Stopping old processes..."
pkill -f "uvicorn main:app" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
sleep 1

echo "Starting backend..."
nohup uvicorn main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &

echo "Starting frontend..."
cd ~/threatlens/frontend
nohup npm run dev > frontend.log 2>&1 &

echo ""
echo "✅ All services started!"
echo "📍 Frontend:  http://localhost:3000"
echo "📍 Backend API: http://localhost:8000/docs"
echo "🔑 Login: admin@threatlens.local / admin123"
echo ""
echo "📄 Logs: tail -f ~/threatlens/backend/backend.log (backend), tail -f ~/threatlens/frontend/frontend.log (frontend)"
echo "🛑 To stop: bash ~/threatlens/stop.sh"
