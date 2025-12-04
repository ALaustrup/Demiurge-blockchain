#!/bin/bash
# Clone DEMIURGE repository on OVHcloud server
# Run this script on your server via web console or SSH

set -e  # Exit on error

echo "=== Cloning DEMIURGE Repository ==="
echo ""

# Navigate to /opt
cd /opt
echo "✅ Changed to /opt directory"

# Clone repository
echo "📥 Cloning repository..."
sudo git clone https://github.com/ALaustrup/DEMIURGE.git
echo "✅ Repository cloned"

# Navigate to repository
cd DEMIURGE
echo "✅ Changed to DEMIURGE directory"

# Checkout correct branch
echo "🔀 Checking out feature/fracture-v1-portal branch..."
sudo git checkout feature/fracture-v1-portal
echo "✅ Branch checked out"

# Set ownership
echo "👤 Setting ownership to ubuntu:ubuntu..."
sudo chown -R ubuntu:ubuntu /opt/DEMIURGE
echo "✅ Ownership set"

# Verify
echo ""
echo "=== Verification ==="
cd /opt/DEMIURGE
echo "Current directory: $(pwd)"
echo "Current branch: $(git branch --show-current)"
echo "Repository status:"
git status --short
echo ""
echo "Directory contents:"
ls -la
echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. cd /opt/DEMIURGE"
echo "  2. pnpm install"
echo "  3. pnpm run build"

