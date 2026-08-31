#!/bin/bash

echo "🛑 Stopping ThreatLens services..."

# ------------------------------------------------------------
# 1. Stop Docker containers (PostgreSQL, Redis, Elasticsearch)
# ------------------------------------------------------------
cd ~/threatlens
echo "Stopping Docker containers..."
docker compose stop

# ------------------------------------------------------------
# 2. Kill backend (uvicorn)
# ------------------------------------------------------------
echo "Stopping backend (uvicorn)..."
pkill -f "uvicorn main:app" 2>/dev/null && echo "   Backend stopped." || echo "   Backend was not running."

# ------------------------------------------------------------
# 3. Kill frontend (npm run dev)
# ------------------------------------------------------------
echo "Stopping frontend (npm run dev)..."
pkill -f "npm run dev" 2>/dev/null && echo "   Frontend stopped." || echo "   Frontend was not running."

echo ""
echo "✅ All services stopped."
echo ""
echo "💡 To start again: bash ~/threatlens/start.sh"
