# Complete Server Setup Guide - Demiurge Node0

**Server IP**: 51.210.209.112  
**OS**: Ubuntu 24.04 LTS  
**User**: ubuntu

This is the definitive guide for setting up Demiurge blockchain on a fresh Ubuntu 24.04 LTS server.

---

## Prerequisites

- Fresh Ubuntu 24.04 LTS server installed
- Root/sudo access
- SSH access (password or key)
- Minimum 4GB RAM, 2 vCPU, 40GB disk (recommended: 8GB RAM, 4 vCPU, 80GB disk)

---

## Phase 1: Initial Server Access & Setup

### Step 1.1: Access Server

**Option A: Via Remote KVM Console**
- Log into hosting provider control panel
- Open Remote KVM/Console for server
- Login with: `ubuntu` user and password

**Option B: Via SSH (if password access works)**
```bash
ssh ubuntu@51.210.209.112
```

### Step 1.2: Update System

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget git
```

### Step 1.3: Create Directory Structure

```bash
sudo mkdir -p /opt/demiurge/{bin,config,data,logs}
sudo mkdir -p /var/www/abyssos-portal
sudo chown -R ubuntu:ubuntu /opt/demiurge
```

---

## Phase 2: Install Dependencies

### Step 2.1: Install Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v  # Should show v20.x.x
npm -v
```

### Step 2.2: Install pnpm

```bash
sudo npm install -g pnpm@9.15.0
pnpm -v
```

### Step 2.3: Install Rust Toolchain

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
export PATH="$HOME/.cargo/bin:$PATH"

# Verify
rustc --version
cargo --version
```

### Step 2.4: Install Build Dependencies

```bash
sudo apt install -y \
    build-essential \
    pkg-config \
    libssl-dev \
    clang \
    cmake \
    nginx \
    ufw \
    jq \
    sqlite3 \
    htop
```

---

## Phase 3: Clone Repository

### Step 3.1: Clone Demiurge Repository

```bash
cd /opt/demiurge
sudo git clone https://github.com/ALaustrup/DEMIURGE.git .
sudo git checkout feature/fracture-v1-portal
sudo chown -R ubuntu:ubuntu /opt/demiurge
```

### Step 3.2: Verify Repository Structure

```bash
ls -la
# Should see: chain/, apps/, sdk/, indexer/, deploy/, other/, etc.
```

---

## Phase 4: Install Project Dependencies

### Step 4.1: Install Node.js Dependencies

```bash
cd /opt/demiurge
pnpm install
```

This will install dependencies for all workspace packages. May take a few minutes.

### Step 4.2: Build Project

```bash
cd /opt/demiurge
pnpm run build
```

This builds all applications and prepares them for deployment.

---

## Phase 5: Build Chain Binary

### Step 5.1: Build Rust Chain

```bash
cd /opt/demiurge/chain
cargo build --release
```

This may take 10-20 minutes depending on server specs.

### Step 5.2: Copy Binary to bin Directory

```bash
sudo cp /opt/demiurge/chain/target/release/demiurge-chain /opt/demiurge/bin/
sudo chmod +x /opt/demiurge/bin/demiurge-chain
sudo chown ubuntu:ubuntu /opt/demiurge/bin/demiurge-chain
```

### Step 5.3: Verify Binary

```bash
/opt/demiurge/bin/demiurge-chain --version
# or
/opt/demiurge/bin/demiurge-chain --help
```

---

## Phase 6: Setup Systemd Services

### Step 6.1: Copy Service Files

```bash
sudo cp /opt/demiurge/deploy/systemd/*.service /etc/systemd/system/
```

### Step 6.2: Reload Systemd

```bash
sudo systemctl daemon-reload
```

### Step 6.3: Enable Services

```bash
sudo systemctl enable demiurge-chain
sudo systemctl enable abyssid
sudo systemctl enable dns-service
sudo systemctl enable abyss-gateway
```

### Step 6.4: Start Services

```bash
sudo systemctl start demiurge-chain
sudo systemctl start abyssid
sudo systemctl start dns-service
sudo systemctl start abyss-gateway
```

### Step 6.5: Check Service Status

```bash
sudo systemctl status demiurge-chain
sudo systemctl status abyssid
sudo systemctl status dns-service
sudo systemctl status abyss-gateway
```

---

## Phase 7: Configure NGINX

### Step 7.1: Copy NGINX Configuration

```bash
sudo cp /opt/demiurge/deploy/nginx/demiurge.cloud.conf /etc/nginx/sites-available/demiurge.cloud
```

### Step 7.2: Enable Site

```bash
sudo ln -sf /etc/nginx/sites-available/demiurge.cloud /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

### Step 7.3: Test Configuration

```bash
sudo nginx -t
```

Should show: `nginx: configuration file /etc/nginx/nginx.conf test is successful`

### Step 7.4: Reload NGINX

```bash
sudo systemctl reload nginx
```

---

## Phase 8: Configure Firewall

### Step 8.1: Setup UFW

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

### Step 8.2: Verify Firewall

```bash
sudo ufw status verbose
```

---

## Phase 9: Verify Deployment

### Step 9.1: Check All Services

```bash
sudo systemctl status demiurge-chain --no-pager
sudo systemctl status abyssid --no-pager
sudo systemctl status dns-service --no-pager
sudo systemctl status abyss-gateway --no-pager
sudo systemctl status nginx --no-pager
```

### Step 9.2: Test RPC Endpoint

```bash
curl -X POST http://localhost:8545/rpc \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"getNetworkInfo","params":[],"id":1}'
```

Should return JSON with chain information.

### Step 9.3: Check Service Logs

```bash
# Chain logs
sudo journalctl -u demiurge-chain -n 50 --no-pager

# AbyssID logs
sudo journalctl -u abyssid -n 50 --no-pager

# DNS service logs
sudo journalctl -u dns-service -n 50 --no-pager

# Gateway logs
sudo journalctl -u abyss-gateway -n 50 --no-pager
```

---

## Phase 10: Post-Deployment Configuration

### Step 10.1: Setup Environment Variables (if needed)

Some services may need `.env` files:

```bash
# AbyssID service
cd /opt/demiurge/abyssid-service
# Create .env file if needed
sudo nano .env

# DNS service
cd /opt/demiurge/dns-service
# Create .env file if needed
sudo nano .env
```

### Step 10.2: Configure Domain & SSL (Optional)

If you have a domain name:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d demiurge.cloud -d www.demiurge.cloud
```

### Step 10.3: Setup Monitoring (Optional)

```bash
# Install monitoring tools
sudo apt install -y htop iotop

# View system resources
htop
```

---

## Quick Reference Commands

### Service Management

```bash
# Start all services
sudo systemctl start demiurge-chain abyssid dns-service abyss-gateway

# Stop all services
sudo systemctl stop demiurge-chain abyssid dns-service abyss-gateway

# Restart all services
sudo systemctl restart demiurge-chain abyssid dns-service abyss-gateway

# Check status
sudo systemctl status demiurge-chain
```

### View Logs

```bash
# Real-time logs
sudo journalctl -u demiurge-chain -f

# Last 100 lines
sudo journalctl -u demiurge-chain -n 100

# Logs since boot
sudo journalctl -u demiurge-chain -b
```

### Test Endpoints

```bash
# RPC endpoint
curl -X POST http://localhost:8545/rpc \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"getNetworkInfo","params":[],"id":1}'

# AbyssID health
curl http://localhost:3001/health

# DNS service
curl http://localhost:5053/api/dns/lookup?domain=demiurge.cloud

# Gateway GraphQL
curl -X POST http://localhost:4000/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ __typename }"}'
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check service status
sudo systemctl status <service-name>

# Check logs
sudo journalctl -u <service-name> -n 50

# Check if binary exists
ls -lh /opt/demiurge/bin/demiurge-chain

# Check permissions
sudo chmod +x /opt/demiurge/bin/demiurge-chain
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

### Build Failures

```bash
# Rust build issues
cd /opt/demiurge/chain
cargo clean
cargo build --release

# Node.js build issues
cd /opt/demiurge
rm -rf node_modules
pnpm install
pnpm run build
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R ubuntu:ubuntu /opt/demiurge

# Fix permissions
sudo chmod +x /opt/demiurge/bin/demiurge-chain
```

---

## Verification Checklist

After setup, verify:

- [ ] All services are running (`systemctl status`)
- [ ] RPC endpoint responds (`curl` test)
- [ ] NGINX is running and configured
- [ ] Firewall is active
- [ ] Chain binary exists and is executable
- [ ] All logs show no critical errors
- [ ] Services start on boot (enabled)

---

## Next Steps

1. **Configure domain** (if you have one)
2. **Setup SSL certificates** (Let's Encrypt)
3. **Configure monitoring** (see `docs/operations/MONITORING.md`)
4. **Setup automated backups** (see `docs/operations/SNAPSHOTS_BACKUPS.md`)
5. **Review security** (disable password auth, configure fail2ban)

---

## Support

- **Deployment Issues**: Check `docs/deployment/` for specific guides
- **Service Issues**: Check logs with `journalctl -u <service> -f`
- **Build Issues**: See troubleshooting section above
