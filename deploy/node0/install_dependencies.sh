#!/usr/bin/env bash
# Install system dependencies and Rust toolchain for Demiurge Node0

set -euo pipefail

echo "[NODE0] Installing system dependencies..."

# Set non-interactive mode for apt
export DEBIAN_FRONTEND=noninteractive

# Update package list
sudo apt-get update -qq

# Install required packages (idempotent - safe to run multiple times)
sudo apt-get install -y \
    build-essential \
    pkg-config \
    libssl-dev \
    clang \
    cmake \
    git \
    curl \
    || {
    echo "Error: Failed to install system packages" >&2
    exit 1
}

echo "[NODE0] System packages installed."

# Check if Rust is already installed
if command -v rustc &> /dev/null; then
    echo "[NODE0] Rust is already installed: $(rustc --version)"
else
    echo "[NODE0] Installing Rust via rustup..."
    
    # Install rustup
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    
    # Source cargo environment
    source "$HOME/.cargo/env" 2>/dev/null || true
    
    # Verify installation
    if command -v rustc &> /dev/null; then
        echo "[NODE0] Rust installed successfully: $(rustc --version)"
    else
        echo "Error: Rust installation failed" >&2
        exit 1
    fi
fi

# Ensure cargo is in PATH for subsequent scripts
export PATH="$HOME/.cargo/bin:$PATH"

echo "[NODE0] Dependencies installation complete."

