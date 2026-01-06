#!/bin/bash
#
# Production Server Hardening & Lifecycle Management
# Branch: D1
# Purpose: Prepare server for long-term unattended operation
#

set -euo pipefail

# Configuration
LOG_FILE="/opt/demiurge/logs/server_hardening.log"
DEMIURGE_USER="demiurge"
DEMIURGE_ROOT="/opt/demiurge"
HOSTNAME_EXPECTED="Abyss"

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo "[$timestamp] [$level] $message" | sudo tee -a "$LOG_FILE" > /dev/null
    echo "[$timestamp] [$level] $message"
}

# Ensure log directory exists
sudo mkdir -p "$(dirname "$LOG_FILE")"
sudo touch "$LOG_FILE"
sudo chmod 644 "$LOG_FILE"

log "INFO" "=========================================="
log "INFO" "Production Server Hardening Script"
log "INFO" "Branch: D1"
log "INFO" "=========================================="

# Phase 1: System Sanity & Baseline
log "INFO" "PHASE 1: System Sanity & Baseline"
log "INFO" "----------------------------------------"

# Verify hostname
CURRENT_HOSTNAME=$(hostname)
if [ "$CURRENT_HOSTNAME" != "$HOSTNAME_EXPECTED" ]; then
    log "ERROR" "Hostname mismatch: expected '$HOSTNAME_EXPECTED', got '$CURRENT_HOSTNAME'"
    exit 1
fi
log "INFO" "Hostname verified: $CURRENT_HOSTNAME"

# Set timezone to UTC
sudo timedatectl set-timezone UTC
log "INFO" "Timezone set to UTC"

# Enable time synchronization
sudo systemctl enable systemd-timesyncd.service
sudo systemctl start systemd-timesyncd.service
if systemctl is-active --quiet systemd-timesyncd.service; then
    log "INFO" "Time synchronization enabled and active"
else
    log "ERROR" "Time synchronization failed to start"
    exit 1
fi

# Verify entropy
ENTROPY=$(cat /proc/sys/kernel/random/entropy_avail)
if [ "$ENTROPY" -lt 1000 ]; then
    log "WARN" "Low entropy: $ENTROPY (consider installing haveged)"
else
    log "INFO" "Entropy healthy: $ENTROPY"
fi

# Update package index (no dist-upgrade)
sudo apt-get update -qq
log "INFO" "Package index updated"

# Install core packages
log "INFO" "Installing core system packages..."
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
    build-essential \
    curl \
    git \
    nginx \
    ufw \
    fail2ban \
    certbot \
    python3-certbot-nginx \
    > /dev/null 2>&1

# Install Node.js 20+
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt 20 ]; then
    log "INFO" "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs > /dev/null 2>&1
fi
log "INFO" "Node.js version: $(node -v)"

# Install pnpm
if ! command -v pnpm &> /dev/null; then
    log "INFO" "Installing pnpm..."
    npm install -g pnpm > /dev/null 2>&1
fi
log "INFO" "pnpm version: $(pnpm -v)"

# Install Rust
if ! command -v rustc &> /dev/null; then
    log "INFO" "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
    source "$HOME/.cargo/env"
fi
log "INFO" "Rust version: $(rustc --version)"

# Disable unused services
log "INFO" "Disabling unused services..."
for service in avahi-daemon bluetooth cups modemmanager; do
    if systemctl list-unit-files | grep -q "^${service}"; then
        sudo systemctl stop "$service" 2>/dev/null || true
        sudo systemctl disable "$service" 2>/dev/null || true
        log "INFO" "Disabled: $service"
    fi
done

# Disable unattended upgrades for services
if [ -f /etc/apt/apt.conf.d/50unattended-upgrades ]; then
    sudo sed -i 's/Unattended-Upgrade::Automatic-Reboot "false";/Unattended-Upgrade::Automatic-Reboot "false";\nUnattended-Upgrade::Package-Blacklist {\n    "nginx";\n    "demiurge-chain";\n    "abyssid";\n    "abyss-gateway";\n};/' /etc/apt/apt.conf.d/50unattended-upgrades
    log "INFO" "Unattended upgrades configured to skip Demiurge services"
fi

log "INFO" "PHASE 1 COMPLETE"

# Phase 2: Security & Access Control
log "INFO" "PHASE 2: Security & Access Control"
log "INFO" "----------------------------------------"

# SSH hardening
log "INFO" "Hardening SSH configuration..."
SSH_CONFIG="/etc/ssh/sshd_config"
sudo cp "$SSH_CONFIG" "${SSH_CONFIG}.backup"

# Disable root login
sudo sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' "$SSH_CONFIG"
# Disable password authentication
sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' "$SSH_CONFIG"
# Enforce key-only
sudo sed -i 's/^#*PubkeyAuthentication.*/PubkeyAuthentication yes/' "$SSH_CONFIG"

# Limit allowed users (add current user and demiurge if exists)
CURRENT_USER=$(whoami)
if ! grep -q "^AllowUsers" "$SSH_CONFIG"; then
    echo "AllowUsers $CURRENT_USER" | sudo tee -a "$SSH_CONFIG" > /dev/null
fi

sudo systemctl restart ssh
log "INFO" "SSH hardened (restart required for full effect)"

# Firewall configuration
log "INFO" "Configuring UFW firewall..."
sudo ufw --force reset > /dev/null 2>&1
sudo ufw default deny incoming > /dev/null 2>&1
sudo ufw default allow outgoing > /dev/null 2>&1
sudo ufw allow 22/tcp comment 'SSH' > /dev/null 2>&1
sudo ufw allow 80/tcp comment 'HTTP' > /dev/null 2>&1
sudo ufw allow 443/tcp comment 'HTTPS' > /dev/null 2>&1
sudo ufw --force enable > /dev/null 2>&1
log "INFO" "UFW enabled with rules:"
sudo ufw status numbered | while read line; do log "INFO" "  $line"; done

# Configure fail2ban
log "INFO" "Configuring fail2ban..."
sudo systemctl enable fail2ban > /dev/null 2>&1
sudo systemctl start fail2ban > /dev/null 2>&1
if systemctl is-active --quiet fail2ban; then
    log "INFO" "fail2ban enabled and active"
else
    log "WARN" "fail2ban failed to start (non-critical)"
fi

log "INFO" "PHASE 2 COMPLETE"

# Phase 3: Filesystem & User Boundaries
log "INFO" "PHASE 3: Filesystem & User Boundaries"
log "INFO" "----------------------------------------"

# Create system user
if ! id "$DEMIURGE_USER" &>/dev/null; then
    sudo useradd -r -s /usr/sbin/nologin -d "$DEMIURGE_ROOT" -m "$DEMIURGE_USER"
    log "INFO" "Created system user: $DEMIURGE_USER"
else
    log "INFO" "User $DEMIURGE_USER already exists"
fi

# Create directory structure
log "INFO" "Creating directory structure..."
sudo mkdir -p "$DEMIURGE_ROOT"/{bin,chain,configs,services,web/abyssos,web/abyss-portal,logs,runtime}
sudo chown -R "$DEMIURGE_USER:$DEMIURGE_USER" "$DEMIURGE_ROOT"
sudo chmod 755 "$DEMIURGE_ROOT"
sudo find "$DEMIURGE_ROOT" -type d -exec chmod 755 {} \;
sudo find "$DEMIURGE_ROOT" -type f -exec chmod 644 {} \;

# Ensure logs directory is writable
sudo chmod 755 "$DEMIURGE_ROOT/logs"
log "INFO" "Directory structure created and permissions set"

log "INFO" "PHASE 3 COMPLETE"

# Phase 4: Logging & Observability
log "INFO" "PHASE 4: Logging & Observability"
log "INFO" "----------------------------------------"

# Enable persistent journald
sudo mkdir -p /var/log/journal
sudo systemd-tmpfiles --create --prefix /var/log/journal > /dev/null 2>&1
sudo systemctl restart systemd-journald > /dev/null 2>&1
log "INFO" "Persistent journald enabled"

# Configure log rotation for Nginx
if [ ! -f /etc/logrotate.d/nginx-demiurge ]; then
    sudo tee /etc/logrotate.d/nginx-demiurge > /dev/null <<EOF
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 \$(cat /var/run/nginx.pid)
    endscript
}
EOF
    log "INFO" "Nginx log rotation configured"
fi

# Create health check script
sudo tee "$DEMIURGE_ROOT/bin/health-check.sh" > /dev/null <<'HEALTH_EOF'
#!/bin/bash
# Health check script for Demiurge services

echo "=== Disk Usage ==="
df -h / | tail -1

echo "=== Memory ==="
free -h

echo "=== Service Status ==="
systemctl is-active demiurge-chain.service abyss-gateway.service abyssid.service nginx.service 2>&1

echo "=== Ports Listening ==="
ss -tlnp | grep -E ':(8545|4000|8082|80|443)' || echo "No expected ports found"
HEALTH_EOF

sudo chmod +x "$DEMIURGE_ROOT/bin/health-check.sh"
sudo chown "$DEMIURGE_USER:$DEMIURGE_USER" "$DEMIURGE_ROOT/bin/health-check.sh"
log "INFO" "Health check script created"

log "INFO" "PHASE 4 COMPLETE"

# Phase 5: Update & Maintenance Policy
log "INFO" "PHASE 5: Update & Maintenance Policy"
log "INFO" "----------------------------------------"

sudo mkdir -p "$DEMIURGE_ROOT/docs"
sudo tee "$DEMIURGE_ROOT/docs/OPERATIONS.md" > /dev/null <<'OPS_EOF'
# Demiurge Server Operations Manual

## OS Updates

Manual process only:
```bash
sudo apt update
sudo apt upgrade
sudo apt autoremove
```

**Important**: No unattended reboots. Reboot manually after updates if kernel changed.

## Rust Updates

Rust toolchain is pinned. To update:
```bash
rustup update stable
cd /opt/demiurge/repo
cargo build --release -p demiurge-chain
sudo systemctl restart demiurge-chain.service
```

## Node.js Updates

Node.js major version is pinned (v20). To update:
```bash
# Check current version
node -v

# Update pnpm
npm install -g pnpm@latest

# Rebuild services
cd /opt/demiurge/repo/apps/abyssid-service
pnpm install
pnpm build
sudo systemctl restart abyssid.service

cd /opt/demiurge/repo/indexer/abyss-gateway
pnpm install
pnpm build
sudo systemctl restart abyss-gateway.service
```

## Frontend Updates

AbyssOS and Portal updates:
```bash
# Build locally or on server
cd /opt/demiurge/repo/apps/abyssos-portal
pnpm build

# Deploy
sudo rm -rf /opt/demiurge/web/abyssos/*
sudo cp -r dist/* /opt/demiurge/web/abyssos/
sudo chown -R demiurge:demiurge /opt/demiurge/web/abyssos
sudo chmod -R 755 /opt/demiurge/web/abyssos
sudo systemctl reload nginx
```

## Service Management

Check status:
```bash
sudo systemctl status demiurge-chain abyss-gateway abyssid nginx
```

View logs:
```bash
sudo journalctl -u demiurge-chain.service -f
sudo journalctl -u abyss-gateway.service -f
sudo journalctl -u abyssid.service -f
sudo tail -f /var/log/nginx/access.log
```

Restart services:
```bash
sudo systemctl restart demiurge-chain
sudo systemctl restart abyss-gateway
sudo systemctl restart abyssid
sudo systemctl reload nginx
```

## Health Check

Run health check:
```bash
/opt/demiurge/bin/health-check.sh
```

## Backup Procedures

Critical data:
- `/opt/demiurge/chain/data/` - Chain state (RocksDB)
- `/opt/demiurge/configs/` - Configuration files
- `/etc/nginx/sites-enabled/` - Nginx configs
- `/etc/systemd/system/*.service` - Service definitions

Backup command:
```bash
sudo tar -czf /tmp/demiurge-backup-$(date +%Y%m%d).tar.gz \
  /opt/demiurge/chain/data \
  /opt/demiurge/configs \
  /etc/nginx/sites-enabled \
  /etc/systemd/system/*.service
```
OPS_EOF

sudo chown "$DEMIURGE_USER:$DEMIURGE_USER" "$DEMIURGE_ROOT/docs/OPERATIONS.md"
log "INFO" "Operations manual created at $DEMIURGE_ROOT/docs/OPERATIONS.md"

log "INFO" "PHASE 5 COMPLETE"

# Phase 6: Service Correctness Check
log "INFO" "PHASE 6: Service Correctness Check"
log "INFO" "----------------------------------------"

# Check if services exist and verify their configuration
SERVICES=("demiurge-chain" "abyss-gateway" "abyssid")
for service in "${SERVICES[@]}"; do
    if systemctl list-unit-files | grep -q "^${service}.service"; then
        SERVICE_FILE=$(systemctl show -p FragmentPath "$service.service" --value)
        if [ -f "$SERVICE_FILE" ]; then
            # Check User directive
            if grep -q "^User=$DEMIURGE_USER" "$SERVICE_FILE"; then
                log "INFO" "$service: runs as $DEMIURGE_USER ✓"
            else
                log "WARN" "$service: User directive not set to $DEMIURGE_USER"
            fi
            
            # Check Restart directive
            if grep -q "^Restart=" "$SERVICE_FILE"; then
                log "INFO" "$service: restart policy configured ✓"
            else
                log "WARN" "$service: no restart policy set"
            fi
        fi
    else
        log "WARN" "$service.service not found (may not be deployed yet)"
    fi
done

# Verify Nginx runs as root
if systemctl show nginx.service -p User --value | grep -q "root"; then
    log "INFO" "nginx: runs as root ✓"
else
    log "WARN" "nginx: not running as root"
fi

# Check for unexpected open ports
log "INFO" "Checking for unexpected open ports..."
OPEN_PORTS=$(ss -tlnp | grep LISTEN | awk '{print $4}' | cut -d: -f2 | sort -u)
EXPECTED_PORTS=(22 80 443 8545 4000 8082)
for port in $OPEN_PORTS; do
    if [[ ! " ${EXPECTED_PORTS[@]} " =~ " ${port} " ]]; then
        log "WARN" "Unexpected port open: $port"
    fi
done

log "INFO" "PHASE 6 COMPLETE"

# Phase 7: Nginx Validation
log "INFO" "PHASE 7: Nginx Validation"
log "INFO" "----------------------------------------"

# Check default site
if [ -L /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
    log "INFO" "Default Nginx site disabled"
fi

# Validate Nginx config
if sudo nginx -t > /dev/null 2>&1; then
    log "INFO" "Nginx configuration valid ✓"
else
    log "ERROR" "Nginx configuration invalid"
    sudo nginx -t
    exit 1
fi

# Check enabled sites
ENABLED_SITES=$(ls /etc/nginx/sites-enabled/ 2>/dev/null | wc -l)
log "INFO" "Nginx enabled sites: $ENABLED_SITES"

log "INFO" "PHASE 7 COMPLETE"

# Phase 8: TLS & Certificate Management
log "INFO" "PHASE 8: TLS & Certificate Management"
log "INFO" "----------------------------------------"

# Check existing certificates
EXISTING_CERTS=$(sudo certbot certificates 2>/dev/null | grep -c "Certificate Name" || echo "0")
log "INFO" "Existing certificates: $EXISTING_CERTS"

# Note: Certificate acquisition requires DNS to be configured
# This phase documents the process but doesn't force it
log "INFO" "TLS certificates should be obtained when DNS is ready:"
log "INFO" "  sudo certbot --nginx -d demiurge.cloud -d www.demiurge.cloud --non-interactive --agree-tos --email admin@demiurge.cloud --redirect"
log "INFO" "  sudo certbot --nginx -d demiurge.guru -d www.demiurge.guru --non-interactive --agree-tos --email admin@demiurge.cloud --redirect"
log "INFO" "  sudo certbot --nginx -d rpc.demiurge.cloud --non-interactive --agree-tos --email admin@demiurge.cloud --redirect"

# Test renewal (dry-run)
if command -v certbot &> /dev/null; then
    if sudo certbot renew --dry-run > /dev/null 2>&1; then
        log "INFO" "Certificate renewal test passed ✓"
    else
        log "WARN" "Certificate renewal test failed (may be normal if no certs exist)"
    fi
fi

log "INFO" "PHASE 8 COMPLETE"

# Phase 9: Failure & Reboot Validation
log "INFO" "PHASE 9: Failure & Reboot Validation"
log "INFO" "----------------------------------------"

# Verify services are enabled for auto-start
log "INFO" "Checking service enablement..."
for service in "${SERVICES[@]}" nginx; do
    if systemctl is-enabled --quiet "${service}.service" 2>/dev/null; then
        log "INFO" "$service: enabled for auto-start ✓"
    else
        log "WARN" "$service: not enabled for auto-start"
    fi
done

log "INFO" "=========================================="
log "INFO" "HARDENING COMPLETE"
log "INFO" "=========================================="
log "INFO" ""
log "INFO" "Next steps:"
log "INFO" "1. Reboot system to verify auto-start: sudo reboot"
log "INFO" "2. After reboot, verify all services: sudo systemctl status demiurge-chain abyss-gateway abyssid nginx"
log "INFO" "3. Test domains: curl -I https://demiurge.cloud"
log "INFO" "4. Review operations manual: cat $DEMIURGE_ROOT/docs/OPERATIONS.md"
log "INFO" ""
log "INFO" "Full log: $LOG_FILE"
