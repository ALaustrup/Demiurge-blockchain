#!/usr/bin/env bash
# Bootstrap script for Demiurge Node0 deployment
# This is the single entrypoint script that sets up everything

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo -e "${GREEN}[NODE0]${NC} Starting Demiurge Node0 bootstrap..."
echo -e "${GREEN}[NODE0]${NC} Repository root: ${REPO_ROOT}"

# Verify we're in the repo root (contains Cargo.toml)
if [[ ! -f "${REPO_ROOT}/Cargo.toml" ]]; then
    echo -e "${RED}[NODE0]${NC} Error: Cargo.toml not found. Please run this script from the repository root." >&2
    exit 1
fi

# Change to repo root
cd "${REPO_ROOT}"

# Step 1: Install dependencies
echo -e "${GREEN}[NODE0]${NC} Step 1/4: Installing dependencies..."
bash "${SCRIPT_DIR}/install_dependencies.sh"

# Step 2: Build Demiurge
echo -e "${GREEN}[NODE0]${NC} Step 2/4: Building Demiurge chain..."
bash "${SCRIPT_DIR}/build_demiurge.sh"

# Step 3: Setup systemd
echo -e "${GREEN}[NODE0]${NC} Step 3/4: Configuring systemd service..."
bash "${SCRIPT_DIR}/setup_systemd.sh"

# Step 4: Final status
echo -e "${GREEN}[NODE0]${NC} Step 4/4: Verifying deployment..."

# Wait a moment for service to start
sleep 2

# Check service status
if systemctl is-active --quiet demiurge-node0.service; then
    echo -e "${GREEN}[NODE0]${NC} Service is running!"
else
    echo -e "${YELLOW}[NODE0]${NC} Warning: Service may not be running. Check status with:"
    echo -e "  ${YELLOW}sudo systemctl status demiurge-node0.service${NC}"
fi

# Print summary
echo ""
echo -e "${GREEN}[NODE0]${NC} ========================================="
echo -e "${GREEN}[NODE0]${NC} Deployment Summary"
echo -e "${GREEN}[NODE0]${NC} ========================================="
echo ""
echo -e "Service Status: ${GREEN}sudo systemctl status demiurge-node0.service${NC}"
echo -e "View Logs:      ${GREEN}sudo journalctl -u demiurge-node0.service -f${NC}"
echo -e "RPC Endpoint:   ${GREEN}http://127.0.0.1:8545/rpc${NC}"
echo ""
echo -e "Test RPC:       ${GREEN}bash deploy/node0/check_rpc.sh${NC}"
echo ""
echo -e "${GREEN}[NODE0]${NC} Bootstrap complete!"

