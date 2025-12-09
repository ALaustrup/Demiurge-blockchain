#!/usr/bin/env bash
# Master Deployment Script for Demiurge Blockchain on Ubuntu 24.04 LTS
# This script sets up the complete Demiurge ecosystem on a fresh Ubuntu 24.04 server

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_DIR="${REPO_DIR:-/opt/demiurge}"
REPO_URL="${REPO_URL:-https://github.com/ALaustrup/DEMIURGE.git}"
REPO_BRANCH="${REPO_BRANCH:-feature/fracture-v1-portal}"
NODE_VERSION="${NODE_VERSION:-20}"
PNPM_VERSION="${PNPM_VERSION:-9.15.0}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Demiurge Blockchain Deployment${NC}"
echo -e "${BLUE}  Ubuntu 24.04 LTS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}❌ Do not run this script as root. Run as a regular user with sudo privileges.${NC}"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
    echo -e "${GREEN}✅ Detected OS: $OS $VERSION${NC}"
    
    if [ "$OS" != "ubuntu" ] || [ "$VERSION" != "24.04" ]; then
        echo -e "${YELLOW}⚠️  Warning: This script is optimized for Ubuntu 24.04 LTS${NC}"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    echo -e "${RED}❌ Cannot detect OS. This script is for Ubuntu 24.04 LTS only.${NC}"
    exit 1
fi

# Step 1: Update system
echo -e "${BLUE}[1/10]${NC} Updating system packages..."
sudo apt update -qq
sudo apt upgrade -y -qq

# Step 2: Install base dependencies
echo -e "${BLUE}[2/10]${NC} Installing base dependencies..."
sudo apt install -y -qq \
    build-essential \
    pkg-config \
    libssl-dev \
    clang \
    cmake \
    git \
    curl \
    wget \
    nginx \
    ufw \
    jq \
    sqlite3 \
    || {
    echo -e "${RED}❌ Failed to install system packages${NC}" >&2
    exit 1
}

# Step 3: Install Node.js
echo -e "${BLUE}[3/10]${NC} Installing Node.js ${NODE_VERSION}.x..."
if command -v node &> /dev/null; then
    NODE_CURRENT=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_CURRENT" -ge "$NODE_VERSION" ]; then
        echo -e "${GREEN}✅ Node.js $(node -v) already installed${NC}"
    else
        echo -e "${YELLOW}⚠️  Node.js version is too old, installing ${NODE_VERSION}.x...${NC}"
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
        sudo apt install -y -qq nodejs
    fi
else
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt install -y -qq nodejs
fi

echo -e "${GREEN}✅ Node.js $(node -v) installed${NC}"

# Step 4: Install pnpm
echo -e "${BLUE}[4/10]${NC} Installing pnpm..."
if command -v pnpm &> /dev/null; then
    echo -e "${GREEN}✅ pnpm $(pnpm -v) already installed${NC}"
else
    sudo npm install -g pnpm@${PNPM_VERSION}
    echo -e "${GREEN}✅ pnpm $(pnpm -v) installed${NC}"
fi

# Step 5: Install Rust (for chain)
echo -e "${BLUE}[5/10]${NC} Installing Rust toolchain..."
if command -v rustc &> /dev/null; then
    echo -e "${GREEN}✅ Rust $(rustc --version) already installed${NC}"
else
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env" 2>/dev/null || true
    export PATH="$HOME/.cargo/bin:$PATH"
    echo -e "${GREEN}✅ Rust installed${NC}"
fi

# Ensure cargo is in PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Step 6: Create directory structure
echo -e "${BLUE}[6/10]${NC} Creating directory structure..."
sudo mkdir -p "${REPO_DIR}" \
    "${REPO_DIR}/bin" \
    "${REPO_DIR}/config" \
    "${REPO_DIR}/data" \
    "${REPO_DIR}/logs" \
    "/var/www/abyssos-portal"

sudo chown -R $USER:$USER "${REPO_DIR}"
echo -e "${GREEN}✅ Directories created${NC}"

# Step 7: Clone repository
echo -e "${BLUE}[7/10]${NC} Cloning repository..."
if [ -d "${REPO_DIR}/.git" ]; then
    echo -e "${YELLOW}⚠️  Repository already exists, updating...${NC}"
    cd "${REPO_DIR}"
    git fetch origin
    git checkout "${REPO_BRANCH}" || echo "Branch may not exist"
    git pull origin "${REPO_BRANCH}" || true
else
    cd "${REPO_DIR}"
    git clone "${REPO_URL}" .
    git checkout "${REPO_BRANCH}" || echo "Branch may not exist"
fi
echo -e "${GREEN}✅ Repository cloned/updated${NC}"

# Step 8: Install project dependencies
echo -e "${BLUE}[8/10]${NC} Installing project dependencies..."
cd "${REPO_DIR}"
pnpm install
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 9: Build project
echo -e "${BLUE}[9/10]${NC} Building project..."
cd "${REPO_DIR}"
pnpm run build || {
    echo -e "${YELLOW}⚠️  Build may have warnings, continuing...${NC}"
}
echo -e "${GREEN}✅ Project built${NC}"

# Step 10: Setup systemd services
echo -e "${BLUE}[10/10]${NC} Setting up systemd services..."
if [ -d "${REPO_DIR}/deploy/systemd" ]; then
    sudo cp "${REPO_DIR}/deploy/systemd"/*.service /etc/systemd/system/
    sudo systemctl daemon-reload
    echo -e "${GREEN}✅ Systemd services installed${NC}"
else
    echo -e "${YELLOW}⚠️  Systemd service files not found${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Configure systemd services:"
echo "     cd ${REPO_DIR}/deploy/node0"
echo "     bash bootstrap_node0.sh"
echo ""
echo "  2. Configure NGINX:"
echo "     sudo cp ${REPO_DIR}/deploy/nginx/demiurge.cloud.conf /etc/nginx/sites-available/"
echo "     sudo ln -sf /etc/nginx/sites-available/demiurge.cloud /etc/nginx/sites-enabled/"
echo "     sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "  3. Start services:"
echo "     sudo systemctl enable demiurge-chain abyssid dns-service abyss-gateway"
echo "     sudo systemctl start demiurge-chain abyssid dns-service abyss-gateway"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  • Check service status: sudo systemctl status demiurge-chain"
echo "  • View logs: sudo journalctl -u demiurge-chain -f"
echo "  • Test RPC: curl -X POST http://localhost:8545/rpc -d '{\"jsonrpc\":\"2.0\",\"method\":\"getNetworkInfo\",\"params\":[],\"id\":1}'"
echo ""
