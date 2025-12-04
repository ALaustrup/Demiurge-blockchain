#!/bin/bash

# Clone Demiurge Repository Script
# This script clones the DEMIURGE repository to the specified location

set -e

# Default location
REPO_DIR="${1:-/opt/demiurge}"

echo "=========================================="
echo "  Demiurge Repository Clone"
echo "=========================================="
echo ""

# Check if directory exists
if [ -d "$REPO_DIR" ]; then
    echo "⚠️  Directory $REPO_DIR already exists"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Create directory if it doesn't exist
if [ ! -d "$REPO_DIR" ]; then
    echo "📁 Creating directory: $REPO_DIR"
    sudo mkdir -p "$REPO_DIR"
    sudo chown $USER:$USER "$REPO_DIR"
fi

# Navigate to directory
cd "$REPO_DIR"

# Clone repository
echo "📦 Cloning repository..."
echo "   Repository: git@github.com:ALaustrup/DEMIURGE.git"
echo "   Destination: $REPO_DIR"

if [ -d "DEMIURGE" ]; then
    echo "⚠️  DEMIURGE directory already exists in $REPO_DIR"
    read -p "Remove and re-clone? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf DEMIURGE
    else
        echo "Aborted."
        exit 1
    fi
fi

# Try SSH first, fallback to HTTPS
if git clone git@github.com:ALaustrup/DEMIURGE.git 2>/dev/null; then
    echo "✅ Repository cloned via SSH"
else
    echo "⚠️  SSH clone failed, trying HTTPS..."
    if git clone https://github.com/ALaustrup/DEMIURGE.git; then
        echo "✅ Repository cloned via HTTPS"
    else
        echo "❌ Failed to clone repository"
        exit 1
    fi
fi

# Navigate into repo
cd DEMIURGE

# Checkout the feature branch
echo ""
echo "🔀 Checking out feature/fracture-v1-portal branch..."
git checkout feature/fracture-v1-portal

echo ""
echo "=========================================="
echo "  ✅ Repository Clone Complete!"
echo "=========================================="
echo ""
echo "📍 Repository location: $REPO_DIR/DEMIURGE"
echo "📍 Current branch: $(git branch --show-current)"
echo ""
echo "Next steps:"
echo "  1. cd $REPO_DIR/DEMIURGE"
echo "  2. Review the deployment guide: cat OVHCLOUD_DEPLOYMENT_GUIDE.md"
echo "  3. Run setup scripts as needed"
echo ""

