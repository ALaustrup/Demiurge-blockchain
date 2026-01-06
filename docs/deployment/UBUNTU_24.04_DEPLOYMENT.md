# Ubuntu 24.04 LTS Deployment Guide

Complete deployment guide for Demiurge Blockchain on Ubuntu 24.04 LTS.

## Quick Start

```bash
# Clone repository
cd /opt
sudo git clone https://github.com/ALaustrup/DEMIURGE.git demiurge
cd demiurge
sudo git checkout feature/fracture-v1-portal
sudo chown -R $USER:$USER /opt/demiurge

# Run master deployment script
cd /opt/demiurge
chmod +x deploy/ubuntu-24.04-master.sh
./deploy/ubuntu-24.04-master.sh
```

## Prerequisites

- Ubuntu 24.04 LTS server
- Root or sudo access
- Minimum 4GB RAM, 2 vCPU, 40GB disk
- Domain name (optional, for HTTPS)

## Step-by-Step Deployment

### Phase 1: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install base packages
sudo apt install -y \
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
    sqlite3
```

### Phase 2: Install Node.js and pnpm

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v  # Should show v20.x.x
npm -v

# Install pnpm
sudo npm install -g pnpm@9.15.0
pnpm -v
```

### Phase 3: Install Rust Toolchain

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

# Source Rust environment
source "$HOME/.cargo/env"

# Verify installation
rustc --version
cargo --version
```

### Phase 4: Clone and Setup Repository

```bash
# Create directory
sudo mkdir -p /opt/demiurge
sudo chown -R $USER:$USER /opt/demiurge

# Clone repository
cd /opt/demiurge
git clone https://github.com/ALaustrup/DEMIURGE.git .
git checkout feature/fracture-v1-portal

# Install dependencies
pnpm install

# Build project
pnpm run build
```

### Phase 5: Build Chain Binary

```bash
cd /opt/demiurge/chain
cargo build --release

# Verify binary
ls -lh target/release/demiurge-chain

# Copy to bin directory
sudo mkdir -p /opt/demiurge/bin
sudo cp target/release/demiurge-chain /opt/demiurge/bin/
sudo chmod +x /opt/demiurge/bin/demiurge-chain
```

### Phase 6: Setup Systemd Services

```bash
# Copy service files
sudo cp /opt/demiurge/deploy/systemd/*.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable demiurge-chain abyssid dns-service abyss-gateway

# Start services
sudo systemctl start demiurge-chain abyssid dns-service abyss-gateway

# Check status
sudo systemctl status demiurge-chain
```

### Phase 7: Configure NGINX

```bash
# Copy NGINX config
sudo cp /opt/demiurge/deploy/nginx/demiurge.cloud.conf /etc/nginx/sites-available/demiurge.cloud

# Enable site
sudo ln -sf /etc/nginx/sites-available/demiurge.cloud /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload NGINX
sudo systemctl reload nginx
```

### Phase 8: Configure Firewall

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP/HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status
```

### Phase 9: Setup HTTPS (Optional)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d demiurge.cloud -d www.demiurge.cloud

# Auto-renewal is set up automatically
```

## Verification

Run the verification script:

```bash
chmod +x /opt/demiurge/deploy/verify-deployment.sh
/opt/demiurge/deploy/verify-deployment.sh
```

### Manual Verification

```bash
# Check chain RPC
curl -X POST http://localhost:8545/rpc \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"getNetworkInfo","params":[],"id":1}'

# Check service status
sudo systemctl status demiurge-chain
sudo systemctl status abyssid
sudo systemctl status dns-service
sudo systemctl status abyss-gateway

# Check logs
sudo journalctl -u demiurge-chain -f
sudo journalctl -u abyssid -f
```

## Service Management

### Start/Stop Services

```bash
# Start all services
sudo systemctl start demiurge-chain abyssid dns-service abyss-gateway

# Stop all services
sudo systemctl stop demiurge-chain abyssid dns-service abyss-gateway

# Restart all services
sudo systemctl restart demiurge-chain abyssid dns-service abyss-gateway
```

### View Logs

```bash
# Chain logs
sudo journalctl -u demiurge-chain -f

# AbyssID logs
sudo journalctl -u abyssid -f

# DNS service logs
sudo journalctl -u dns-service -f

# Gateway logs
sudo journalctl -u abyss-gateway -f
```

## Troubleshooting

### Service Won't Start

```bash
# Check service status
sudo systemctl status <service-name>

# Check logs
sudo journalctl -u <service-name> -n 50

# Check configuration
sudo systemctl cat <service-name>
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :8545
sudo lsof -i :3001
sudo lsof -i :4000

# Kill process if needed
sudo kill -9 <PID>
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R $USER:$USER /opt/demiurge

# Fix permissions
sudo chmod +x /opt/demiurge/bin/demiurge-chain
```

## Maintenance

### Update Repository

```bash
cd /opt/demiurge
git pull origin feature/fracture-v1-portal
pnpm install
pnpm run build
sudo systemctl restart demiurge-chain abyssid dns-service abyss-gateway
```

### Backup Chain Data

```bash
# Backup chain data
sudo tar -czf demiurge-backup-$(date +%Y%m%d).tar.gz /opt/demiurge/.demiurge
```

## Directory Structure

```
/opt/demiurge/
├── bin/                    # Binaries
│   └── demiurge-chain
├── config/                 # Configuration files
├── data/                   # Data directories
├── logs/                   # Log files
├── chain/                  # Chain source code
├── other/                  # Legacy code and experimental features
│   └── legacy-runtime-stubs/ # Legacy placeholder runtime crates
├── apps/                   # Applications
├── sdk/                    # SDKs
├── indexer/                # Indexer
└── deploy/                 # Deployment scripts
```

## Next Steps

- Configure monitoring (see `docs/operations/MONITORING.md`)
- Setup automated backups (see `docs/operations/SNAPSHOTS_BACKUPS.md`)
- Configure automated updates (see `scripts/setup-automated-updates.sh`)
