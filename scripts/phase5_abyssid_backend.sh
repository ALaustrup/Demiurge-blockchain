#!/bin/bash
# Phase 5: AbyssID Backend Setup
# Run this script after Phase 1

set -e

echo "=== Phase 5: AbyssID Backend Setup ==="

cd /opt/demiurge/repo/apps/abyssid-backend

# Step 5.1: Install Dependencies
echo "[5.1] Installing dependencies..."
npm install

# Step 5.2: Initialize Database
echo "[5.2] Initializing database..."
mkdir -p data
node src/db-init.js

# Step 5.3: Create .env file
echo "[5.3] Creating .env file..."
if [ ! -f .env ]; then
    cat > .env <<EOF
PORT=3001
DB_PATH=./data/abyssid.db
NODE_ENV=production
EOF
    echo ".env file created"
else
    echo ".env file already exists"
fi

# Step 5.4: Test server
echo "[5.4] Testing server..."
node src/server.js &
SERVER_PID=$!
sleep 2

# Test health endpoint
curl http://localhost:3001/health || echo "Server test failed"

# Stop test server
kill $SERVER_PID 2>/dev/null || true

echo ""
echo "=== Phase 5 Complete ==="
echo "AbyssID Backend ready on port 3001"
echo ""
echo "To start the service:"
echo "  cd /opt/demiurge/repo/apps/abyssid-backend"
echo "  node src/server.js"
echo ""
echo "Next: Update frontend to use this backend (see phase5_frontend_update.md)"

