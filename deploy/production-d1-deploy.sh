#!/usr/bin/env bash
# Production Deployment Script for Demiurge Ecosystem - Server D1
# Branch: D1
# OS: Ubuntu 24.04 LTS
# This script MUST be run on branch D1 only

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
DEMIURGE_USER="demiurge"
DEMIURGE_HOME="/opt/demiurge"
REPO_DIR="${DEMIURGE_HOME}/repo"
LOG_FILE="${DEMIURGE_HOME}/logs/bootstrap.log"

# Domains
DOMAIN_ABYSSOS="demiurge.cloud"
DOMAIN_PORTAL="demiurge.guru"
DOMAIN_RPC="rpc.demiurge.cloud"

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    # Ensure log directory exists
    mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || sudo mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
    touch "$LOG_FILE" 2>/dev/null || sudo touch "$LOG_FILE" 2>/dev/null || true
    echo -e "[$timestamp] [$level] $message" | tee -a "$LOG_FILE" 2>/dev/null || echo -e "[$timestamp] [$level] $message"
}

log_info() { log "INFO" "$@"; }
log_error() { log "ERROR" "$@"; }
log_warn() { log "WARN" "$@"; }
log_success() { log "SUCCESS" "$@"; }

# Error handler
error_exit() {
    log_error "$1"
    exit 1
}

# Verify we're on branch D1 (if in git repo)
check_branch() {
    if [ -d "${REPO_DIR}/.git" ]; then
        cd "${REPO_DIR}"
        CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
        if [ "$CURRENT_BRANCH" != "D1" ]; then
            log_warn "Not on branch D1 (current: $CURRENT_BRANCH). Continuing anyway..."
        else
            log_success "Verified: Working on branch D1"
        fi
    fi
}

# PHASE 1: SYSTEM BASELINE
phase1_system_baseline() {
    log_info "=========================================="
    log_info "PHASE 1: SYSTEM BASELINE"
    log_info "=========================================="
    
    # Verify hostname
    HOSTNAME=$(hostname)
    log_info "Hostname: $HOSTNAME"
    if [ "$HOSTNAME" != "Abyss" ]; then
        log_warn "Hostname is not 'Abyss' (current: $HOSTNAME)"
        read -p "Set hostname to 'Abyss'? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo hostnamectl set-hostname Abyss
            log_success "Hostname set to Abyss"
        fi
    else
        log_success "Hostname verified: Abyss"
    fi
    
    # Update package index
    log_info "Updating package index..."
    sudo apt update -qq || error_exit "Failed to update package index"
    log_success "Package index updated"
    
    # Install required packages
    log_info "Installing required packages..."
    sudo apt install -y -qq \
        build-essential \
        curl \
        git \
        nginx \
        ufw \
        jq \
        sqlite3 \
        pkg-config \
        libssl-dev \
        clang \
        cmake \
        || error_exit "Failed to install system packages"
    log_success "System packages installed"
    
    # Install Node.js 20+
    log_info "Installing Node.js 20.x..."
    if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt 20 ]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y -qq nodejs
    fi
    NODE_VERSION=$(node -v)
    log_success "Node.js installed: $NODE_VERSION"
    
    # Install pnpm
    log_info "Installing pnpm..."
    if ! command -v pnpm &> /dev/null; then
        sudo npm install -g pnpm@latest
    fi
    PNPM_VERSION=$(pnpm -v)
    log_success "pnpm installed: $PNPM_VERSION"
    
    # Install Rust
    log_info "Installing Rust toolchain..."
    if ! command -v rustc &> /dev/null; then
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source "$HOME/.cargo/env" 2>/dev/null || true
    fi
    export PATH="$HOME/.cargo/bin:$PATH"
    RUST_VERSION=$(rustc --version)
    log_success "Rust installed: $RUST_VERSION"
    
    # Enable time synchronization
    log_info "Enabling time synchronization..."
    sudo timedatectl set-ntp true || log_warn "Failed to enable NTP"
    log_success "Time synchronization enabled"
    
    log_success "PHASE 1 COMPLETE"
}

# PHASE 2: SECURITY BASELINE
phase2_security_baseline() {
    log_info "=========================================="
    log_info "PHASE 2: SECURITY BASELINE"
    log_info "=========================================="
    
    # Configure UFW
    log_info "Configuring UFW firewall..."
    sudo ufw --force reset || true
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow 22/tcp comment 'SSH'
    sudo ufw allow 80/tcp comment 'HTTP'
    sudo ufw allow 443/tcp comment 'HTTPS'
    sudo ufw --force enable
    log_success "UFW firewall configured and enabled"
    
    log_success "PHASE 2 COMPLETE"
}

# PHASE 3: USER + FILESYSTEM BOUNDARY
phase3_user_filesystem() {
    log_info "=========================================="
    log_info "PHASE 3: USER + FILESYSTEM BOUNDARY"
    log_info "=========================================="
    
    # Create system user
    log_info "Creating system user: $DEMIURGE_USER"
    if ! id "$DEMIURGE_USER" &>/dev/null; then
        sudo useradd -r -s /usr/sbin/nologin -d "$DEMIURGE_HOME" "$DEMIURGE_USER" || error_exit "Failed to create user"
        log_success "User $DEMIURGE_USER created"
    else
        log_info "User $DEMIURGE_USER already exists"
    fi
    
    # Create directory structure
    log_info "Creating directory structure..."
    sudo mkdir -p \
        "${DEMIURGE_HOME}/bin" \
        "${DEMIURGE_HOME}/chain" \
        "${DEMIURGE_HOME}/configs" \
        "${DEMIURGE_HOME}/services" \
        "${DEMIURGE_HOME}/web/abyssos" \
        "${DEMIURGE_HOME}/web/abyss-portal" \
        "${DEMIURGE_HOME}/logs" \
        "${DEMIURGE_HOME}/runtime" \
        "${DEMIURGE_HOME}/repo" \
        || error_exit "Failed to create directories"
    
    # Set ownership
    sudo chown -R "$DEMIURGE_USER:$DEMIURGE_USER" "$DEMIURGE_HOME"
    
    # Set permissions (no world-writable)
    sudo chmod -R 755 "$DEMIURGE_HOME"
    sudo find "$DEMIURGE_HOME" -type d -exec chmod 755 {} \;
    sudo find "$DEMIURGE_HOME" -type f -exec chmod 644 {} \;
    
    log_success "Directory structure created and permissions set"
    log_success "PHASE 3 COMPLETE"
}

# PHASE 4: BUILD & INSTALL DEMIURGE CHAIN
phase4_build_chain() {
    log_info "=========================================="
    log_info "PHASE 4: BUILD & INSTALL DEMIURGE CHAIN"
    log_info "=========================================="
    
    # Clone repo if not exists (as current user, then fix ownership)
    if [ ! -d "${REPO_DIR}/.git" ]; then
        log_info "Cloning repository..."
        git clone https://github.com/ALaustrup/DEMIURGE.git "$REPO_DIR" || error_exit "Failed to clone repo"
        cd "$REPO_DIR"
        git checkout D1 || log_warn "Branch D1 may not exist, using current branch"
        sudo chown -R "$DEMIURGE_USER:$DEMIURGE_USER" "$REPO_DIR"
    else
        log_info "Repository already exists, updating..."
        cd "$REPO_DIR"
        # Fix git ownership issue
        git config --global --add safe.directory "$REPO_DIR" 2>/dev/null || true
        sudo -u "$DEMIURGE_USER" git config --global --add safe.directory "$REPO_DIR" 2>/dev/null || true
        # Update as current user (who has git access)
        git fetch origin || log_warn "Git fetch failed"
        git checkout D1 || log_warn "Branch D1 may not exist"
        git pull origin D1 || true
        sudo chown -R "$DEMIURGE_USER:$DEMIURGE_USER" "$REPO_DIR"
    fi
    
    check_branch
    
    # Build chain (as current user who has Rust installed)
    log_info "Building demiurge-chain (this may take several minutes)..."
    cd "${REPO_DIR}"
    
    # Ensure Rust is in PATH for current user
    export PATH="$HOME/.cargo/bin:$PATH"
    if [ -f "$HOME/.cargo/env" ]; then
        source "$HOME/.cargo/env"
    fi
    
    # Build as current user (Rust is installed for this user)
    # Build from workspace root (target will be at workspace root)
    log_info "Running cargo build --release..."
    cargo build --release -p demiurge-chain || error_exit "Failed to build chain"
    
    # Install binary (workspace builds to repo root target/)
    log_info "Installing binary..."
    if [ -f "${REPO_DIR}/target/release/demiurge-chain" ]; then
        sudo cp "${REPO_DIR}/target/release/demiurge-chain" "${DEMIURGE_HOME}/bin/demiurge-chain"
    elif [ -f "${REPO_DIR}/chain/target/release/demiurge-chain" ]; then
        sudo cp "${REPO_DIR}/chain/target/release/demiurge-chain" "${DEMIURGE_HOME}/bin/demiurge-chain"
    else
        error_exit "Binary not found in expected locations"
    fi
    sudo chown "$DEMIURGE_USER:$DEMIURGE_USER" "${DEMIURGE_HOME}/bin/demiurge-chain"
    sudo chmod 755 "${DEMIURGE_HOME}/bin/demiurge-chain"
    log_success "Binary installed to ${DEMIURGE_HOME}/bin/demiurge-chain"
    
    # Create config
    log_info "Creating chain configuration..."
    sudo tee "${DEMIURGE_HOME}/configs/node.toml" > /dev/null <<EOF
[chain]
chain_id = 77701
name = "Demiurge Devnet"

[node]
rpc_host = "127.0.0.1"
rpc_port = 8545
db_path = "${DEMIURGE_HOME}/chain/data"
p2p_listen = "127.0.0.1:30333"

[genesis]
genesis_config = "genesis.devnet.toml"
EOF
    sudo chown "$DEMIURGE_USER:$DEMIURGE_USER" "${DEMIURGE_HOME}/configs/node.toml"
    sudo chmod 644 "${DEMIURGE_HOME}/configs/node.toml"
    log_success "Configuration created"
    
    # Initialize chain data directory
    log_info "Initializing chain data directory..."
    sudo mkdir -p "${DEMIURGE_HOME}/chain/data"
    sudo chown -R "$DEMIURGE_USER:$DEMIURGE_USER" "${DEMIURGE_HOME}/chain"
    log_success "Chain data directory initialized"
    
    log_success "PHASE 4 COMPLETE"
}

# PHASE 5: SYSTEMD: DEMIURGE CHAIN
phase5_systemd_chain() {
    log_info "=========================================="
    log_info "PHASE 5: SYSTEMD: DEMIURGE CHAIN"
    log_info "=========================================="
    
    # Create systemd service
    log_info "Creating systemd service: demiurge-chain.service"
    sudo tee /etc/systemd/system/demiurge-chain.service > /dev/null <<EOF
[Unit]
Description=Demiurge L1 Chain Node
Documentation=https://github.com/ALaustrup/DEMIURGE
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=${DEMIURGE_HOME}/bin/demiurge-chain
WorkingDirectory=${DEMIURGE_HOME}
Restart=always
RestartSec=5
User=${DEMIURGE_USER}
Group=${DEMIURGE_USER}
LimitNOFILE=65535

Environment=RUST_LOG=info
Environment=RUST_BACKTRACE=1

StandardOutput=journal
StandardError=journal
SyslogIdentifier=demiurge-chain

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=${DEMIURGE_HOME}/chain ${DEMIURGE_HOME}/configs ${DEMIURGE_HOME}/logs
ReadOnlyPaths=${DEMIURGE_HOME}/bin

LimitNOFILE=65535
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable demiurge-chain.service
    log_success "Systemd service created and enabled"
    
    # Start service
    log_info "Starting demiurge-chain service..."
    sudo systemctl start demiurge-chain.service
    sleep 3
    
    # Verify service
    if sudo systemctl is-active --quiet demiurge-chain.service; then
        log_success "demiurge-chain service is running"
    else
        log_error "demiurge-chain service failed to start"
        sudo systemctl status demiurge-chain.service
        error_exit "Service start failed"
    fi
    
    # Verify RPC
    log_info "Verifying JSON-RPC endpoint..."
    sleep 2
    if curl -s -X POST http://127.0.0.1:8545/rpc -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"cgt_getChainInfo","params":[],"id":1}' > /dev/null; then
        log_success "JSON-RPC endpoint responding"
    else
        log_warn "JSON-RPC endpoint not responding yet (may need more time)"
    fi
    
    log_success "PHASE 5 COMPLETE"
}

# PHASE 6: ARCHON (integrated in chain, no separate service needed)
phase6_archon() {
    log_info "=========================================="
    log_info "PHASE 6: ARCHON"
    log_info "=========================================="
    log_info "Archon is integrated into demiurge-chain binary"
    log_info "No separate service required"
    log_success "PHASE 6 COMPLETE"
}

# PHASE 7: ABYSSID
phase7_abyssid() {
    log_info "=========================================="
    log_info "PHASE 7: ABYSSID SERVICE"
    log_info "=========================================="
    
    # Install dependencies
    log_info "Installing AbyssID dependencies..."
    cd "${REPO_DIR}/apps/abyssid-service"
    sudo -u "$DEMIURGE_USER" pnpm install || error_exit "Failed to install AbyssID dependencies"
    
    # Build
    log_info "Building AbyssID service..."
    sudo -u "$DEMIURGE_USER" pnpm build || error_exit "Failed to build AbyssID"
    
    # Create data directory
    sudo mkdir -p "${DEMIURGE_HOME}/chain/identity"
    sudo chown -R "$DEMIURGE_USER:$DEMIURGE_USER" "${DEMIURGE_HOME}/chain/identity"
    
    # Create .env file
    log_info "Creating AbyssID environment configuration..."
    sudo tee "${REPO_DIR}/apps/abyssid-service/.env" > /dev/null <<EOF
PORT=8082
HOST=127.0.0.1
DB_PATH=${DEMIURGE_HOME}/chain/identity/abyssid.db
RPC_URL=http://127.0.0.1:8545/rpc
NODE_ENV=production
EOF
    sudo chown "$DEMIURGE_USER:$DEMIURGE_USER" "${REPO_DIR}/apps/abyssid-service/.env"
    sudo chmod 600 "${REPO_DIR}/apps/abyssid-service/.env"
    
    # Create systemd service
    log_info "Creating systemd service: abyssid.service"
    sudo tee /etc/systemd/system/abyssid.service > /dev/null <<EOF
[Unit]
Description=AbyssID Identity Backend
After=network.target demiurge-chain.service
Wants=demiurge-chain.service

[Service]
Type=simple
ExecStart=/usr/bin/node ${REPO_DIR}/apps/abyssid-service/dist/index.js
WorkingDirectory=${REPO_DIR}/apps/abyssid-service
Restart=always
RestartSec=5
User=${DEMIURGE_USER}
Group=${DEMIURGE_USER}
EnvironmentFile=${REPO_DIR}/apps/abyssid-service/.env

StandardOutput=journal
StandardError=journal
SyslogIdentifier=abyssid

NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable abyssid.service
    sudo systemctl start abyssid.service
    
    sleep 2
    if sudo systemctl is-active --quiet abyssid.service; then
        log_success "abyssid service is running"
    else
        log_error "abyssid service failed to start"
        sudo systemctl status abyssid.service
        error_exit "Service start failed"
    fi
    
    log_success "PHASE 7 COMPLETE"
}

# PHASE 8: ABYSS GATEWAY
phase8_abyss_gateway() {
    log_info "=========================================="
    log_info "PHASE 8: ABYSS GATEWAY"
    log_info "=========================================="
    
    # Install dependencies
    log_info "Installing Abyss Gateway dependencies..."
    cd "${REPO_DIR}/indexer/abyss-gateway"
    sudo -u "$DEMIURGE_USER" pnpm install || error_exit "Failed to install gateway dependencies"
    
    # Build
    log_info "Building Abyss Gateway..."
    sudo -u "$DEMIURGE_USER" pnpm build || error_exit "Failed to build gateway"
    
    # Create systemd service
    log_info "Creating systemd service: abyss-gateway.service"
    sudo tee /etc/systemd/system/abyss-gateway.service > /dev/null <<EOF
[Unit]
Description=Abyss Gateway (Indexer + GraphQL)
After=network.target demiurge-chain.service
Wants=demiurge-chain.service

[Service]
Type=simple
ExecStart=/usr/bin/node ${REPO_DIR}/indexer/abyss-gateway/dist/index.js
WorkingDirectory=${REPO_DIR}/indexer/abyss-gateway
Restart=always
RestartSec=5
User=${DEMIURGE_USER}
Group=${DEMIURGE_USER}
Environment=RPC_URL=http://127.0.0.1:8545/rpc
Environment=NODE_ENV=production

StandardOutput=journal
StandardError=journal
SyslogIdentifier=abyss-gateway

NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable abyss-gateway.service
    sudo systemctl start abyss-gateway.service
    
    sleep 2
    if sudo systemctl is-active --quiet abyss-gateway.service; then
        log_success "abyss-gateway service is running"
    else
        log_error "abyss-gateway service failed to start"
        sudo systemctl status abyss-gateway.service
        error_exit "Service start failed"
    fi
    
    log_success "PHASE 8 COMPLETE"
}

# PHASE 9: WEB BUILDS
phase9_web_builds() {
    log_info "=========================================="
    log_info "PHASE 9: WEB BUILDS"
    log_info "=========================================="
    
    # Install root dependencies
    log_info "Installing root dependencies..."
    cd "$REPO_DIR"
    sudo -u "$DEMIURGE_USER" pnpm install || error_exit "Failed to install root dependencies"
    
    # Build AbyssOS
    log_info "Building AbyssOS Portal..."
    cd "${REPO_DIR}/apps/abyssos-portal"
    sudo -u "$DEMIURGE_USER" pnpm install || error_exit "Failed to install AbyssOS dependencies"
    sudo -u "$DEMIURGE_USER" pnpm build || error_exit "Failed to build AbyssOS"
    
    # Copy AbyssOS assets
    log_info "Copying AbyssOS assets..."
    sudo rm -rf "${DEMIURGE_HOME}/web/abyssos"/*
    sudo cp -r "${REPO_DIR}/apps/abyssos-portal/dist"/* "${DEMIURGE_HOME}/web/abyssos/"
    sudo chown -R "$DEMIURGE_USER:$DEMIURGE_USER" "${DEMIURGE_HOME}/web/abyssos"
    sudo chmod -R 755 "${DEMIURGE_HOME}/web/abyssos"
    log_success "AbyssOS assets deployed"
    
    # Build Abyss Portal
    log_info "Building Abyss Portal..."
    cd "${REPO_DIR}/apps/portal-web"
    sudo -u "$DEMIURGE_USER" pnpm install || error_exit "Failed to install portal dependencies"
    sudo -u "$DEMIURGE_USER" pnpm build || error_exit "Failed to build portal"
    
    # Copy portal assets
    log_info "Copying portal assets..."
    sudo rm -rf "${DEMIURGE_HOME}/web/abyss-portal"/*
    sudo cp -r "${REPO_DIR}/apps/portal-web/.next/standalone"/* "${DEMIURGE_HOME}/web/abyss-portal/" 2>/dev/null || \
    sudo cp -r "${REPO_DIR}/apps/portal-web/.next/static" "${DEMIURGE_HOME}/web/abyss-portal/.next/static" 2>/dev/null || \
    sudo cp -r "${REPO_DIR}/apps/portal-web/out"/* "${DEMIURGE_HOME}/web/abyss-portal/" 2>/dev/null || \
    sudo cp -r "${REPO_DIR}/apps/portal-web/.next" "${DEMIURGE_HOME}/web/abyss-portal/.next" 2>/dev/null || \
    log_warn "Portal build structure may differ, manual copy may be needed"
    
    # Try Next.js export if available
    if [ -f "${REPO_DIR}/apps/portal-web/next.config.js" ] || [ -f "${REPO_DIR}/apps/portal-web/next.config.ts" ]; then
        log_info "Attempting Next.js export..."
        cd "${REPO_DIR}/apps/portal-web"
        sudo -u "$DEMIURGE_USER" pnpm build 2>&1 | tee -a "$LOG_FILE" || log_warn "Build may have issues"
        if [ -d "${REPO_DIR}/apps/portal-web/out" ]; then
            sudo cp -r "${REPO_DIR}/apps/portal-web/out"/* "${DEMIURGE_HOME}/web/abyss-portal/"
        fi
    fi
    
    sudo chown -R "$DEMIURGE_USER:$DEMIURGE_USER" "${DEMIURGE_HOME}/web/abyss-portal"
    sudo chmod -R 755 "${DEMIURGE_HOME}/web/abyss-portal"
    log_success "Portal assets deployed"
    
    log_success "PHASE 9 COMPLETE"
}

# PHASE 10: NGINX
phase10_nginx() {
    log_info "=========================================="
    log_info "PHASE 10: NGINX CONFIGURATION"
    log_info "=========================================="
    
    # Disable default site
    log_info "Disabling default Nginx site..."
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Create AbyssOS site
    log_info "Creating Nginx config: $DOMAIN_ABYSSOS"
    sudo tee /etc/nginx/sites-available/abyssos > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_ABYSSOS www.$DOMAIN_ABYSSOS;
    
    root ${DEMIURGE_HOME}/web/abyssos;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # Create Portal site
    log_info "Creating Nginx config: $DOMAIN_PORTAL"
    sudo tee /etc/nginx/sites-available/abyss-portal > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_PORTAL www.$DOMAIN_PORTAL;
    
    root ${DEMIURGE_HOME}/web/abyss-portal;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # Create RPC proxy site
    log_info "Creating Nginx config: $DOMAIN_RPC"
    sudo tee /etc/nginx/sites-available/rpc > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_RPC;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=rpc_limit:10m rate=10r/s;
    limit_req zone=rpc_limit burst=20 nodelay;
    
    # CORS headers
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    
    location / {
        proxy_pass http://127.0.0.1:8545;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Handle OPTIONS for CORS
    location / {
        if (\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
}
EOF
    
    # Enable sites
    sudo ln -sf /etc/nginx/sites-available/abyssos /etc/nginx/sites-enabled/
    sudo ln -sf /etc/nginx/sites-available/abyss-portal /etc/nginx/sites-enabled/
    sudo ln -sf /etc/nginx/sites-available/rpc /etc/nginx/sites-enabled/
    
    # Test configuration
    log_info "Testing Nginx configuration..."
    sudo nginx -t || error_exit "Nginx configuration test failed"
    
    # Reload Nginx
    sudo systemctl reload nginx
    log_success "Nginx configured and reloaded"
    
    log_success "PHASE 10 COMPLETE"
}

# PHASE 11: TLS
phase11_tls() {
    log_info "=========================================="
    log_info "PHASE 11: TLS CERTIFICATES"
    log_info "=========================================="
    
    # Install certbot
    log_info "Installing Certbot..."
    sudo apt install -y -qq certbot python3-certbot-nginx || error_exit "Failed to install certbot"
    
    # Obtain certificates
    log_info "Obtaining Let's Encrypt certificates..."
    log_warn "This requires DNS to be pointing to this server"
    log_warn "Press Ctrl+C if DNS is not ready, or Enter to continue..."
    read -r
    
    sudo certbot --nginx -d "$DOMAIN_ABYSSOS" -d "www.$DOMAIN_ABYSSOS" --non-interactive --agree-tos --email admin@$DOMAIN_ABYSSOS --redirect || log_warn "Certificate for $DOMAIN_ABYSSOS failed (DNS may not be ready)"
    sudo certbot --nginx -d "$DOMAIN_PORTAL" -d "www.$DOMAIN_PORTAL" --non-interactive --agree-tos --email admin@$DOMAIN_PORTAL --redirect || log_warn "Certificate for $DOMAIN_PORTAL failed (DNS may not be ready)"
    sudo certbot --nginx -d "$DOMAIN_RPC" --non-interactive --agree-tos --email admin@$DOMAIN_ABYSSOS --redirect || log_warn "Certificate for $DOMAIN_RPC failed (DNS may not be ready)"
    
    # Configure auto-renewal
    log_info "Configuring certificate auto-renewal..."
    sudo systemctl enable certbot.timer
    sudo systemctl start certbot.timer
    
    log_success "PHASE 11 COMPLETE"
}

# PHASE 12: VERIFICATION
phase12_verification() {
    log_info "=========================================="
    log_info "PHASE 12: VERIFICATION"
    log_info "=========================================="
    
    log_info "Checking service status..."
    
    SERVICES=("demiurge-chain" "abyssid" "abyss-gateway" "nginx")
    ALL_ACTIVE=true
    
    for service in "${SERVICES[@]}"; do
        if sudo systemctl is-active --quiet "$service.service"; then
            log_success "$service.service is active"
        else
            log_error "$service.service is NOT active"
            ALL_ACTIVE=false
        fi
    done
    
    if [ "$ALL_ACTIVE" = true ]; then
        log_success "All services are running"
    else
        log_error "Some services are not running"
    fi
    
    log_info "Service status summary:"
    sudo systemctl status demiurge-chain.service --no-pager -l | head -10
    sudo systemctl status abyssid.service --no-pager -l | head -10
    sudo systemctl status abyss-gateway.service --no-pager -l | head -10
    
    log_info "Testing JSON-RPC endpoint..."
    if curl -s -X POST http://127.0.0.1:8545/rpc -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"cgt_getChainInfo","params":[],"id":1}' | grep -q "result"; then
        log_success "JSON-RPC endpoint is responding"
    else
        log_warn "JSON-RPC endpoint may not be ready"
    fi
    
    log_success "PHASE 12 COMPLETE"
    log_info "=========================================="
    log_info "DEPLOYMENT COMPLETE"
    log_info "=========================================="
    log_info "Services are running. Reboot recommended for final verification."
    log_info "After reboot, verify all services start automatically."
}

# Main execution
main() {
    # Create log directory FIRST (before any logging)
    sudo mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
    sudo touch "$LOG_FILE" 2>/dev/null || touch "$LOG_FILE" 2>/dev/null || true
    sudo chown "$USER:$USER" "$LOG_FILE" 2>/dev/null || chown "$USER:$USER" "$LOG_FILE" 2>/dev/null || true
    
    log_info "=========================================="
    log_info "DEMIURGE PRODUCTION DEPLOYMENT - SERVER D1"
    log_info "Branch: D1"
    log_info "=========================================="
    
    # Execute phases
    phase1_system_baseline
    phase2_security_baseline
    phase3_user_filesystem
    phase4_build_chain
    phase5_systemd_chain
    phase6_archon
    phase7_abyssid
    phase8_abyss_gateway
    phase9_web_builds
    phase10_nginx
    phase11_tls
    phase12_verification
    
    log_success "=========================================="
    log_success "ALL PHASES COMPLETE"
    log_success "=========================================="
}

# Run main
main "$@"
