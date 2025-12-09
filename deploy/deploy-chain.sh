#!/usr/bin/env bash
# Demiurge Chain Deployment Script
# This script sets up a complete validator node on Ubuntu 24.04 LTS
# Run as root or with sudo

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO_DIR="${REPO_DIR:-/opt/demiurge}"
KEYS_DIR="${REPO_DIR}/keys"
CONFIGS_DIR="${REPO_DIR}/configs"
BIN_DIR="${REPO_DIR}/bin"
DATA_DIR="${REPO_DIR}/.demiurge/data"
VALIDATOR_KEY="${KEYS_DIR}/validator.key"
GENESIS_TEMPLATE="${REPO_DIR}/chain/configs/genesis.toml"
GENESIS_CONFIG="${CONFIGS_DIR}/genesis.toml"
NODE_CONFIG="${CONFIGS_DIR}/node.toml"

echo -e "${GREEN}=== Demiurge Chain Deployment ===${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: This script must be run as root or with sudo${NC}"
    exit 1
fi

# Step 1: Create directory structure
echo -e "${YELLOW}[1/8] Creating directory structure...${NC}"
mkdir -p "${KEYS_DIR}"
mkdir -p "${CONFIGS_DIR}"
mkdir -p "${BIN_DIR}"
mkdir -p "${DATA_DIR}"
chmod 700 "${KEYS_DIR}"
echo -e "${GREEN}✓ Directories created${NC}"

# Step 2: Check if repo is cloned
if [ ! -d "${REPO_DIR}/chain" ]; then
    echo -e "${RED}Error: Repository not found at ${REPO_DIR}${NC}"
    echo "Please clone the repository first:"
    echo "  git clone <repo-url> ${REPO_DIR}"
    exit 1
fi

# Step 3: Generate validator key if it doesn't exist
echo -e "${YELLOW}[2/8] Checking validator key...${NC}"
if [ ! -f "${VALIDATOR_KEY}" ]; then
    echo "Generating new validator key..."
    cd "${REPO_DIR}"
    
    # Build CLI tool first if needed
    if [ ! -f "${REPO_DIR}/target/release/demiurge" ]; then
        echo "Building CLI tool for key generation..."
        cargo build --release --bin demiurge || {
            echo -e "${RED}Error: Failed to build CLI tool${NC}"
            exit 1
        }
    fi
    
    # Generate key using CLI
    KEYGEN_OUTPUT=$("${REPO_DIR}/target/release/demiurge" keygen --output "${VALIDATOR_KEY}" 2>&1)
    VALIDATOR_ADDRESS=$(echo "${KEYGEN_OUTPUT}" | grep "Validator address:" | awk '{print $3}')
    
    if [ -z "${VALIDATOR_ADDRESS}" ]; then
        echo -e "${RED}Error: Failed to generate validator key${NC}"
        echo "Output: ${KEYGEN_OUTPUT}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Validator key generated${NC}"
    echo -e "  Address: ${VALIDATOR_ADDRESS}"
else
    echo -e "${GREEN}✓ Validator key already exists${NC}"
    # Extract address from existing key using CLI
    if [ -f "${REPO_DIR}/target/release/demiurge" ]; then
        KEYGEN_OUTPUT=$("${REPO_DIR}/target/release/demiurge" keygen --output "${VALIDATOR_KEY}" 2>&1)
        VALIDATOR_ADDRESS=$(echo "${KEYGEN_OUTPUT}" | grep "Validator address:" | awk '{print $3}' || echo "")
    fi
    if [ -n "${VALIDATOR_ADDRESS}" ]; then
        echo -e "  Address: ${VALIDATOR_ADDRESS}"
    fi
fi

# Step 4: Copy and inject genesis config
echo -e "${YELLOW}[3/8] Setting up genesis configuration...${NC}"
if [ ! -f "${GENESIS_TEMPLATE}" ]; then
    echo -e "${RED}Error: Genesis template not found at ${GENESIS_TEMPLATE}${NC}"
    exit 1
fi

cp "${GENESIS_TEMPLATE}" "${GENESIS_CONFIG}"

# Extract validator address if we have the key but not the address
if [ -z "${VALIDATOR_ADDRESS:-}" ] && [ -f "${VALIDATOR_KEY}" ]; then
    # Try to get address using a simple Rust one-liner or wait for node startup
    echo -e "${YELLOW}⚠ Validator address will be injected during first node run${NC}"
elif [ -n "${VALIDATOR_ADDRESS:-}" ]; then
    sed -i "s/validator_address_here/${VALIDATOR_ADDRESS}/g" "${GENESIS_CONFIG}"
    sed -i "s/<YOUR_ADDRESS_FROM_KEYGEN>/${VALIDATOR_ADDRESS}/g" "${GENESIS_CONFIG}"
    echo -e "${GREEN}✓ Validator address injected into genesis${NC}"
fi

# Step 5: Copy node config
echo -e "${YELLOW}[4/8] Setting up node configuration...${NC}"
if [ -f "${REPO_DIR}/chain/configs/node.toml" ]; then
    cp "${REPO_DIR}/chain/configs/node.toml" "${NODE_CONFIG}"
    echo -e "${GREEN}✓ Node configuration copied${NC}"
else
    echo -e "${RED}Error: Node config template not found${NC}"
    exit 1
fi

# Step 6: Build the chain
echo -e "${YELLOW}[5/8] Building Demiurge chain...${NC}"
cd "${REPO_DIR}"

if ! command -v cargo &> /dev/null; then
    echo -e "${RED}Error: Cargo is not installed. Please install Rust toolchain.${NC}"
    exit 1
fi

echo "Running: cargo build --release"
cargo build --release --bin demiurge-chain || {
    echo -e "${RED}Build failed. Check errors above.${NC}"
    exit 1
}

echo -e "${GREEN}✓ Build completed${NC}"

# Step 7: Install binary
echo -e "${YELLOW}[6/8] Installing binary...${NC}"
BINARY_SOURCE="${REPO_DIR}/target/release/demiurge-chain"
if [ ! -f "${BINARY_SOURCE}" ]; then
    echo -e "${RED}Error: Binary not found at ${BINARY_SOURCE}${NC}"
    exit 1
fi

cp "${BINARY_SOURCE}" "${BIN_DIR}/demiurge-chain"
chmod +x "${BIN_DIR}/demiurge-chain"
echo -e "${GREEN}✓ Binary installed to ${BIN_DIR}/demiurge-chain${NC}"

# Step 8: Install systemd service
echo -e "${YELLOW}[7/8] Installing systemd service...${NC}"
SERVICE_FILE="${REPO_DIR}/deploy/systemd/demiurge-chain.service"
if [ ! -f "${SERVICE_FILE}" ]; then
    echo -e "${RED}Error: Service file not found at ${SERVICE_FILE}${NC}"
    exit 1
fi

cp "${SERVICE_FILE}" /etc/systemd/system/
systemctl daemon-reload
echo -e "${GREEN}✓ Systemd service installed${NC}"

# Step 9: Set permissions
echo -e "${YELLOW}[8/8] Setting permissions...${NC}"
chown -R root:root "${REPO_DIR}"
chmod 700 "${KEYS_DIR}"
chmod 755 "${BIN_DIR}"
chmod 755 "${CONFIGS_DIR}"
echo -e "${GREEN}✓ Permissions set${NC}"

# Summary
echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Next steps:"
echo "  1. Enable the service:  sudo systemctl enable demiurge-chain"
echo "  2. Start the service:   sudo systemctl start demiurge-chain"
echo "  3. Check status:        sudo systemctl status demiurge-chain"
echo "  4. View logs:           sudo journalctl -u demiurge-chain -f"
echo ""
echo "Configuration:"
echo "  Binary:      ${BIN_DIR}/demiurge-chain"
echo "  Config:      ${NODE_CONFIG}"
echo "  Genesis:     ${GENESIS_CONFIG}"
echo "  Data:        ${DATA_DIR}"
echo "  Key:         ${VALIDATOR_KEY}"
if [ -n "${VALIDATOR_ADDRESS:-}" ]; then
    echo "  Validator:   ${VALIDATOR_ADDRESS}"
fi
echo ""
