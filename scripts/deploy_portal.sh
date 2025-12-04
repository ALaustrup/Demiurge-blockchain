#!/bin/bash
# Deployment Script for Demiurge Portal
# Run this to deploy updates to the portal

set -e

echo "=== Demiurge Portal Deployment ==="

REPO_DIR="/opt/demiurge/repo"
PORTAL_DIR="$REPO_DIR/apps/portal-web"
BRANCH="${1:-feature/fracture-v1-portal}"

cd $REPO_DIR

# Step 1: Pull latest changes
echo "[1] Pulling latest changes from $BRANCH..."
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# Step 2: Install/update dependencies
echo "[2] Installing dependencies..."
cd $PORTAL_DIR
pnpm install

# Step 3: Build
echo "[3] Building portal..."
pnpm run build

# Step 4: Restart service (if using PM2)
if command -v pm2 &> /dev/null; then
    echo "[4] Restarting PM2 process..."
    pm2 restart demiurge-portal || pm2 start npm --name "demiurge-portal" -- start
else
    echo "[4] PM2 not found. Please restart the portal manually:"
    echo "    cd $PORTAL_DIR && pnpm run start"
fi

echo ""
echo "=== Deployment Complete ==="
echo "Portal deployed from branch: $BRANCH"
echo "Check logs: pm2 logs demiurge-portal"

