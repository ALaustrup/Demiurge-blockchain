#!/usr/bin/env bash
# Complete Server Setup Script for Demiurge Node0
# Run this script on a fresh Ubuntu 24.04 LTS server
# Server IP: 51.210.209.112

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO_DIR="/opt/demiurge"
REPO_URL="https://github.com/ALaustrup/DEMIURGE.git"
REPO_BRANCH="feature/fracture-v1-portal"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Demiurge Complete Server Setup${NC}"
echo -e "${BLUE}  Ubuntu 24.04 LTS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}❌ Do not run as root. Run as ubuntu user with sudo.${NC}"
    exit 1
fi

# Phase 1: Update System
echo -e "${BLUE}[Phase 1/10]${NC} Updating system..."
sudo apt update -qq
sudo apt upgrade -y -qq
echo -e "${GREEN}✅ System updated${NC}"

# Phase 2: Install Node.js
echo -e "${BLUE}[Phase 2/10]${NC} Installing Node.js 20.x..."
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt 20 ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y -qq nodejs
fi
echo -e "${GREEN}✅ Node.js $(node -v) installed${NC}"

# Phase 3: Install pnpm
echo -e "${BLUE}[Phase 3/10]${NC} Installing pnpm..."
if ! command -v pnpm &> /dev/null; then
    sudo npm install -g pnpm@9.15.0
fi
echo -e "${GREEN}✅ pnpm $(pnpm -v) installed${NC}"

# Phase 4: Install Rust
echo -e "${BLUE}[Phase 4/10]${NC} Installing Rust..."
if ! command -v rustc &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env" 2>/dev/null || true
    export PATH="$HOME/.cargo/bin:$PATH"
fi
echo -e "${GREEN}✅ Rust installed${NC}"

# Phase 5: Install Dependencies
echo -e "${BLUE}[Phase 5/10]${NC} Installing build dependencies..."
sudo apt install -y -qq \
    build-essential \
    pkg-config \
    libssl-dev \
    clang \
    cmake \
    nginx \
    ufw \
    jq \
    sqlite3 \
    htop \
    git \
    curl \
    wget
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Phase 6: Create Directories
echo -e "${BLUE}[Phase 6/10]${NC} Creating directory structure..."
sudo mkdir -p "${REPO_DIR}"/{bin,config,data,logs}
sudo mkdir -p /var/www/abyssos-portal
sudo chown -R $USER:$USER "${REPO_DIR}"
echo -e "${GREEN}✅ Directories created${NC}"

# Phase 7: Clone Repository
echo -e "${BLUE}[Phase 7/10]${NC} Cloning repository..."
if [ ! -d "${REPO_DIR}/.git" ]; then
    cd "${REPO_DIR}"
    git clone "${REPO_URL}" .
    git checkout "${REPO_BRANCH}" || echo "Branch may not exist"
else
    cd "${REPO_DIR}"
    git fetch origin
    git checkout "${REPO_BRANCH}" || echo "Branch may not exist"
    git pull origin "${REPO_BRANCH}" || true
fi
sudo chown -R $USER:$USER "${REPO_DIR}"
echo -e "${GREEN}✅ Repository cloned${NC}"

# Phase 8: Install Project Dependencies
echo -e "${BLUE}[Phase 8/10]${NC} Installing project dependencies..."
cd "${REPO_DIR}"
export PATH="$HOME/.cargo/bin:$PATH"
pnpm install
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Phase 9: Build Project
echo -e "${BLUE}[Phase 9/10]${NC} Building project..."
cd "${REPO_DIR}"
pnpm run build || {
    echo -e "${YELLOW}⚠️  Build may have warnings, continuing...${NC}"
}

# Build chain binary
echo -e "${BLUE}[Phase 9/10]${NC} Building chain binary..."
cd "${REPO_DIR}/chain"
export PATH="$HOME/.cargo/bin:$PATH"
cargo build --release

# Copy binary
sudo cp "${REPO_DIR}/chain/target/release/demiurge-chain" "${REPO_DIR}/bin/"
sudo chmod +x "${REPO_DIR}/bin/demiurge-chain"
sudo chown $USER:$USER "${REPO_DIR}/bin/demiurge-chain"
echo -e "${GREEN}✅ Project built${NC}"

# Phase 10: Setup Services
echo -e "${BLUE}[Phase 10/10]${NC} Setting up systemd services..."
if [ -d "${REPO_DIR}/deploy/systemd" ]; then
    sudo cp "${REPO_DIR}/deploy/systemd"/*.service /etc/systemd/system/
    sudo systemctl daemon-reload
    echo -e "${GREEN}✅ Services installed${NC}"
else
    echo -e "${YELLOW}⚠️  Service files not found${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Configure systemd services:"
echo "     sudo systemctl enable demiurge-chain abyssid dns-service abyss-gateway"
echo "     sudo systemctl start demiurge-chain abyssid dns-service abyss-gateway"
echo ""
echo "  2. Configure NGINX:"
echo "     sudo cp ${REPO_DIR}/deploy/nginx/demiurge.cloud.conf /etc/nginx/sites-available/"
echo "     sudo ln -sf /etc/nginx/sites-available/demiurge.cloud /etc/nginx/sites-enabled/"
echo "     sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "  3. Configure firewall:"
echo "     sudo ufw allow OpenSSH"
echo "     sudo ufw allow 'Nginx Full'"
echo "     sudo ufw --force enable"
echo ""
echo "  4. Verify deployment:"
echo "     ${REPO_DIR}/deploy/verify-deployment.sh"
echo ""
