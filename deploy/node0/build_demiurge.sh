#!/usr/bin/env bash
# Build the Demiurge chain binary

set -euo pipefail

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "[NODE0] Building Demiurge chain..."

# Change to repo root
cd "${REPO_ROOT}"

# Source Rust environment (if available)
source "$HOME/.cargo/env" 2>/dev/null || true

# Ensure cargo is in PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Build the release binary
echo "[NODE0] Running: cargo build --release"
cargo build --release

# Determine binary path (package name is demiurge-chain)
BINARY_NAME="demiurge-chain"
BINARY_PATH="${REPO_ROOT}/target/release/${BINARY_NAME}"

# Verify binary exists
if [[ ! -f "${BINARY_PATH}" ]]; then
    echo "Error: Binary not found at ${BINARY_PATH}" >&2
    echo "Please check the Cargo.toml package name matches the expected binary name." >&2
    exit 1
fi

# Print binary info
echo "[NODE0] Build complete!"
echo "[NODE0] Binary: ${BINARY_PATH}"
echo "[NODE0] Size: $(du -h "${BINARY_PATH}" | cut -f1)"

