#!/bin/bash
# Complete RPC Fix Script - Run this on the server
# This script builds the Linux chain binary and starts the service

set -e

echo "=== Demiurge RPC Fix Script ==="
echo ""

# Check if we're in the right directory
if [ ! -f "Cargo.toml" ] || [ ! -d "chain" ]; then
    echo "ERROR: Must be run from /opt/demiurge directory with the full repo"
    echo "Please clone the repository first:"
    echo "  cd /opt/demiurge"
    echo "  git clone <repo-url> ."
    exit 1
fi

# Install Rust if needed
if ! command -v cargo >/dev/null 2>&1; then
    echo "[1/5] Installing Rust toolchain..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
else
    echo "[1/5] Rust already installed"
    source ~/.cargo/env 2>/dev/null || true
fi

# Build the chain
echo ""
echo "[2/5] Building chain (this may take 5-10 minutes)..."
cargo build --release -p demiurge-chain

# Verify binary
BINARY="target/release/demiurge-chain"
if [ ! -f "$BINARY" ]; then
    echo "ERROR: Build failed - binary not found"
    exit 1
fi

echo ""
echo "[3/5] Verifying binary..."
file "$BINARY"
BINARY_TYPE=$(file "$BINARY" | grep -o "ELF.*executable" || echo "")
if [ -z "$BINARY_TYPE" ]; then
    echo "ERROR: Binary is not a Linux ELF executable!"
    echo "Binary type: $(file $BINARY)"
    exit 1
fi

# Install binary
echo ""
echo "[4/5] Installing binary..."
sudo cp "$BINARY" /opt/demiurge/bin/demiurge-chain
sudo chmod +x /opt/demiurge/bin/demiurge-chain
sudo chown root:root /opt/demiurge/bin/demiurge-chain

echo "Binary installed to /opt/demiurge/bin/demiurge-chain"
file /opt/demiurge/bin/demiurge-chain

# Start service
echo ""
echo "[5/5] Starting chain service..."
sudo systemctl reset-failed demiurge-node1
sudo systemctl start demiurge-node1
sleep 3

# Check status
echo ""
echo "Service status:"
sudo systemctl status demiurge-node1 --no-pager | head -15

# Verify RPC
echo ""
echo "Checking RPC endpoint..."
sleep 2
if sudo ss -tlnp | grep -q 8545; then
    echo "✓ RPC port 8545 is listening"
    echo ""
    echo "Testing RPC call:"
    curl -s -X POST -H 'Content-Type: application/json' \
        -d '{"jsonrpc":"2.0","method":"cgt_getChainInfo","params":[],"id":1}' \
        http://localhost:8545/rpc | head -3
else
    echo "⚠ RPC port not yet listening. Check logs:"
    echo "  sudo journalctl -u demiurge-node1 -f"
fi

echo ""
echo "=== Fix Complete ==="
echo "Monitor logs: sudo journalctl -u demiurge-node1 -f"

