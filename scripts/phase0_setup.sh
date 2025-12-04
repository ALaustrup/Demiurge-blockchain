#!/bin/bash
# Phase 0: Clone Repo & Verify Environment
# Run this script on your Ubuntu 24.04 server

set -e  # Exit on error

echo "=== Phase 0: Clone Repo & Verify Environment ==="

# Step 0.1: Verify Git
echo "[0.1] Checking Git installation..."
if ! command -v git &> /dev/null; then
    echo "Installing Git..."
    sudo apt update
    sudo apt install -y git
fi
git --version

# Step 0.2: Check/Generate SSH Key
echo "[0.2] Checking SSH key..."
if [ ! -f ~/.ssh/id_ed25519 ]; then
    echo "Generating SSH key..."
    ssh-keygen -t ed25519 -C "demiurge-node0@demiurge" -f ~/.ssh/id_ed25519 -N ""
    echo ""
    echo "=== ADD THIS KEY TO GITHUB ==="
    cat ~/.ssh/id_ed25519.pub
    echo "=== Copy the above key and add it to GitHub: Settings → SSH and GPG keys ==="
    read -p "Press Enter after adding the key to GitHub..."
fi

# Step 0.3: Test GitHub Connection
echo "[0.3] Testing GitHub SSH connection..."
ssh -T git@github.com || echo "Note: GitHub connection test completed (may show warning, that's OK)"

# Step 0.4: Create Directory Structure
echo "[0.4] Creating directory structure..."
sudo mkdir -p /opt/demiurge/{portal,chain,media,logs,scripts}
sudo chown -R $USER:$USER /opt/demiurge

# Step 0.5: Clone Repository
echo "[0.5] Cloning DEMIURGE repository..."
if [ ! -d "/opt/demiurge/repo" ]; then
    cd /opt/demiurge
    git clone git@github.com:ALaustrup/DEMIURGE.git repo
else
    echo "Repository already exists at /opt/demiurge/repo"
    cd /opt/demiurge/repo
    git fetch origin
fi

# Step 0.6: Checkout Feature Branch
echo "[0.6] Checking out feature/fracture-v1-portal branch..."
cd /opt/demiurge/repo
git checkout feature/fracture-v1-portal || echo "Branch may not exist, staying on current branch"
git pull origin feature/fracture-v1-portal || true

# Step 0.7: Verify Project Structure
echo "[0.7] Verifying project structure..."
echo "Portal location:"
ls -la apps/portal-web/ 2>/dev/null || echo "WARNING: apps/portal-web/ not found"

echo ""
echo "Chain location:"
ls -la chain/ 2>/dev/null || echo "WARNING: chain/ not found"

echo ""
echo "Docker configs:"
find . -maxdepth 3 -name "docker-compose.yml" -o -name "Dockerfile" 2>/dev/null | head -5

# Step 0.8: Verify Node.js
echo ""
echo "[0.8] Verifying Node.js..."
node -v
npm -v

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm
fi
pnpm --version

echo ""
echo "=== Phase 0 Complete ==="
echo "Repository cloned to: /opt/demiurge/repo"
echo "Current branch: $(git branch --show-current)"
echo ""
echo "Next: Run Phase 1 (Portal Build & Local Run)"

