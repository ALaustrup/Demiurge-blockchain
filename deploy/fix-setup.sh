#!/usr/bin/env bash
# Quick Fix Script for Demiurge Setup
# Run this on your server to fix common setup issues

set -euo pipefail

echo "=== Demiurge Setup Fix ==="
echo ""

# Step 1: Find the binary
echo "[1/5] Finding the binary..."
BINARY_PATH=""

# Check workspace target
if [ -f "/opt/demiurge/target/release/demiurge-chain" ]; then
    BINARY_PATH="/opt/demiurge/target/release/demiurge-chain"
    echo "✅ Found binary at: $BINARY_PATH"
elif [ -f "/opt/demiurge/chain/target/release/demiurge-chain" ]; then
    BINARY_PATH="/opt/demiurge/chain/target/release/demiurge-chain"
    echo "✅ Found binary at: $BINARY_PATH"
else
    echo "❌ Binary not found. Searching..."
    BINARY_PATH=$(find /opt/demiurge -name "demiurge-chain" -type f 2>/dev/null | head -1)
    if [ -n "$BINARY_PATH" ]; then
        echo "✅ Found binary at: $BINARY_PATH"
    else
        echo "❌ Binary not found. You need to build it first:"
        echo "   cd /opt/demiurge/chain"
        echo "   source \$HOME/.cargo/env"
        echo "   cargo build --release"
        exit 1
    fi
fi

# Step 2: Create bin directory
echo ""
echo "[2/5] Creating bin directory..."
sudo mkdir -p /opt/demiurge/bin
echo "✅ Directory created"

# Step 3: Copy binary
echo ""
echo "[3/5] Copying binary..."
sudo cp "$BINARY_PATH" /opt/demiurge/bin/demiurge-chain
sudo chmod +x /opt/demiurge/bin/demiurge-chain
sudo chown ubuntu:ubuntu /opt/demiurge/bin/demiurge-chain
echo "✅ Binary copied to /opt/demiurge/bin/demiurge-chain"

# Step 4: Verify service files
echo ""
echo "[4/5] Checking service files..."
if [ -d "/opt/demiurge/deploy/systemd" ]; then
    SERVICE_COUNT=$(find /opt/demiurge/deploy/systemd -name "*.service" | wc -l)
    echo "✅ Found $SERVICE_COUNT service files"
    
    # Copy service files
    sudo cp /opt/demiurge/deploy/systemd/*.service /etc/systemd/system/
    sudo systemctl daemon-reload
    echo "✅ Service files installed"
else
    echo "⚠️  Service files directory not found"
fi

# Step 5: Summary
echo ""
echo "[5/5] Setup Summary"
echo "=================="
echo ""
echo "Binary location: /opt/demiurge/bin/demiurge-chain"
if [ -f "/opt/demiurge/bin/demiurge-chain" ]; then
    ls -lh /opt/demiurge/bin/demiurge-chain
    echo ""
    echo "✅ Binary is ready!"
else
    echo "❌ Binary not found"
fi

echo ""
echo "Next steps:"
echo "  1. Enable services:"
echo "     sudo systemctl enable demiurge-chain abyssid dns-service abyss-gateway"
echo ""
echo "  2. Start services:"
echo "     sudo systemctl start demiurge-chain abyssid dns-service abyss-gateway"
echo ""
echo "  3. Check status:"
echo "     sudo systemctl status demiurge-chain"
echo ""
