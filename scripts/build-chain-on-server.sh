#!/bin/bash
set -e

echo "=== Building Demiurge Chain on Server ==="

# Install Rust if needed
if ! command -v cargo >/dev/null 2>&1; then
    echo "Installing Rust toolchain..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
fi

# Build in home directory
BUILD_DIR="$HOME/demiurge-build"
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Extract workspace if tarball exists
if [ -f /tmp/demiurge-workspace.tar.gz ]; then
    echo "Extracting workspace..."
    tar -xzf /tmp/demiurge-workspace.tar.gz
    echo "Contents after extraction:"
    ls -la
    echo "Chain directory:"
    ls -la chain/ 2>/dev/null || echo "Chain directory not found"
fi

# Build the chain - try different paths
echo "Building chain (this may take several minutes)..."
if [ -f chain/Cargo.toml ]; then
    cargo build --release --manifest-path chain/Cargo.toml
elif [ -f Cargo.toml ] && [ -d chain ]; then
    cargo build --release -p demiurge-chain
else
    echo "ERROR: Cannot find chain source"
    exit 1
fi

# Verify binary
BINARY_PATH="$BUILD_DIR/chain/target/release/demiurge-chain"
if [ -f "$BINARY_PATH" ]; then
    echo "Build successful!"
    file "$BINARY_PATH"
    ls -lh "$BINARY_PATH"
    
    # Install binary
    echo "Installing binary..."
    sudo cp "$BINARY_PATH" /opt/demiurge/bin/demiurge-chain
    sudo chmod +x /opt/demiurge/bin/demiurge-chain
    sudo chown root:root /opt/demiurge/bin/demiurge-chain
    
    echo "Binary installed to /opt/demiurge/bin/demiurge-chain"
    file /opt/demiurge/bin/demiurge-chain
else
    echo "ERROR: Build failed - binary not found at $BINARY_PATH"
    exit 1
fi

