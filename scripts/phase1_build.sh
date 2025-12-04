#!/bin/bash
# Phase 1: Portal Build & Local Run
# Run this script after Phase 0

set -e

echo "=== Phase 1: Portal Build & Local Run ==="

cd /opt/demiurge/repo/apps/portal-web

# Step 1.1: Install Dependencies
echo "[1.1] Installing dependencies..."
pnpm install

# Step 1.2: Verify Build Configuration
echo "[1.2] Checking build configuration..."
echo "Package.json scripts:"
cat package.json | grep -A 10 '"scripts"' || echo "No scripts found"

# Step 1.3: Build Portal
echo "[1.3] Building portal for production..."
pnpm run build

echo ""
echo "=== Phase 1 Complete ==="
echo "Portal built successfully!"
echo ""
echo "To test locally:"
echo "  cd /opt/demiurge/repo/apps/portal-web"
echo "  pnpm run start"
echo ""
echo "Next: Run Phase 2 (NGINX + Domain + HTTPS)"

