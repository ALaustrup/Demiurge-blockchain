# 🚀 Testnet Deployment Guide

**Complete step-by-step guide for deploying Demiurge Blockchain testnet**

> *"The ancient ritual begins. From code to creation, the deployment serves the will."*

---

## 📋 Pre-Deployment Checklist

### ✅ Prerequisites Verification

- [ ] Server access (SSH key configured)
- [ ] Server has sufficient resources (4+ GB RAM, 50+ GB disk)
- [ ] Rust 1.80+ installed
- [ ] Node.js 20+ installed
- [ ] Docker installed (optional, for frontend)
- [ ] Git installed
- [ ] Firewall configured (ports 9944, 30333, 3000)

---

## 🎯 Deployment Steps

### Step 1: Server Preparation

```bash
# SSH to server
ssh root@127.0.0.1

# Update system
apt update && apt upgrade -y

# Install dependencies
apt install -y git curl build-essential pkg-config libssl-dev

# Install Rust (if not installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source ~/.cargo/env
rustup default stable

# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Docker (optional)
curl -fsSL https://get.docker.com | sh
```

### Step 2: Clone Repository

```bash
# Navigate to deployment directory
cd /opt

# Remove old deployment (if exists)
rm -rf demiurge-blockchain

# Clone repository
git clone https://github.com/Alaustrup/Demiurge-Blockchain.git demiurge-blockchain
cd demiurge-blockchain
git checkout main
```

### Step 3: Build Blockchain Node

```bash
# Navigate to framework
cd framework

# Build release version
source ~/.cargo/env
cargo build --release

# Verify build
ls -lh target/release/demiurge-node
```

**Expected build time:** 10-30 minutes depending on server specs

### Step 4: Create Data Directory

```bash
# Create data directory
mkdir -p /opt/demiurge-data
chmod 755 /opt/demiurge-data
```

### Step 5: Create Systemd Service

```bash
# Create systemd service file
cat > /etc/systemd/system/demiurge-node.service << 'EOF'
[Unit]
Description=Demiurge Blockchain Node
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/demiurge-blockchain/framework
ExecStart=/opt/demiurge-blockchain/framework/target/release/demiurge-node \
  --data-dir /opt/demiurge-data \
  --rpc-addr 0.0.0.0:9944 \
  --p2p-addr 0.0.0.0:30333
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Enable service
systemctl enable demiurge-node

# Start service
systemctl start demiurge-node
```

### Step 6: Verify Node is Running

```bash
# Check service status
systemctl status demiurge-node

# Check logs
journalctl -u demiurge-node -f

# Test RPC endpoint
curl -X POST http://localhost:9944 \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"chain_getHealth","id":1}'
```

**Expected response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "status": "healthy",
    "block_number": 0
  },
  "id": 1
}
```

### Step 7: Deploy Frontend

```bash
# Navigate to frontend
cd /opt/demiurge-blockchain/apps/hub

# Create environment file
cat > .env.production << 'EOF'
NEXT_PUBLIC_DEMIURGE_RPC_URL=http://localhost:9944
NEXT_PUBLIC_QOR_AUTH_URL=http://localhost:8080/api/v1
NODE_ENV=production
PORT=3000
EOF

# Install dependencies
npm install

# Build frontend
npm run build

# Start frontend (using PM2 or similar)
npm install -g pm2
pm2 start npm --name "demiurge-hub" -- start
pm2 save
pm2 startup
```

**Alternative: Docker Deployment**

```bash
# Build Docker image
docker build -t demiurge-hub:latest .

# Run container
docker run -d \
  --name demiurge-hub \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.production \
  demiurge-hub:latest
```

### Step 8: Configure Nginx (Optional)

```bash
# Install Nginx
apt install -y nginx

# Create Nginx config
cat > /etc/nginx/sites-available/demiurge << 'EOF'
server {
    listen 80;
    server_name 127.0.0.1;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # RPC endpoint
    location /rpc {
        proxy_pass http://localhost:9944;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/demiurge /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx
```

---

## 🔍 Verification

### Verify Blockchain Node

```bash
# Check service status
systemctl status demiurge-node

# Check RPC endpoint
curl -X POST https://rpc.demiurge.cloud \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"chain_getBlockNumber","id":1}'

# Check P2P port
netstat -tlnp | grep 30333
```

### Verify Frontend

```bash
# Check frontend
curl http://127.0.0.1:3000

# Check Docker container (if used)
docker ps | grep demiurge-hub
docker logs demiurge-hub
```

### Verify Nginx (if configured)

```bash
# Check Nginx status
systemctl status nginx

# Test configuration
nginx -t
```

---

## 📊 Monitoring

### Node Logs

```bash
# View real-time logs
journalctl -u demiurge-node -f

# View last 100 lines
journalctl -u demiurge-node -n 100
```

### Frontend Logs

```bash
# PM2 logs
pm2 logs demiurge-hub

# Docker logs
docker logs -f demiurge-hub
```

### System Resources

```bash
# Check CPU and memory
htop

# Check disk usage
df -h

# Check network
iftop
```

---

## 🐛 Troubleshooting

### Node Won't Start

```bash
# Check logs
journalctl -u demiurge-node -n 50

# Check if port is in use
lsof -i :9944
lsof -i :30333

# Check permissions
ls -la /opt/demiurge-data
```

### RPC Not Responding

```bash
# Check if node is running
systemctl status demiurge-node

# Check firewall
ufw status
iptables -L

# Test local connection
curl -X POST http://localhost:9944 \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"chain_getHealth","id":1}'
```

### Frontend Issues

```bash
# Check Node.js version
node --version

# Rebuild frontend
cd /opt/demiurge-blockchain/apps/hub
rm -rf .next node_modules
npm install
npm run build

# Check PM2/Docker status
pm2 status
docker ps
```

---

## 🔄 Updates and Maintenance

### Update Node

```bash
# Stop service
systemctl stop demiurge-node

# Pull latest code
cd /opt/demiurge-blockchain
git pull origin main

# Rebuild
cd framework
cargo build --release

# Restart service
systemctl start demiurge-node
```

### Update Frontend

```bash
# Pull latest code
cd /opt/demiurge-blockchain/apps/hub
git pull origin main

# Rebuild
npm run build

# Restart
pm2 restart demiurge-hub
# OR
docker restart demiurge-hub
```

---

## 📝 Post-Deployment Checklist

- [ ] Node is running and producing blocks
- [ ] RPC endpoint is accessible
- [ ] Frontend is accessible
- [ ] Health checks are passing
- [ ] Monitoring is set up
- [ ] Documentation is updated with endpoints

---

## 🔗 Related Documentation

- **[Deployment Guide](./DEPLOYMENT.md)** - General deployment guide
- **[Developer Documentation](../developers/)** - Integration guides
- **[Status Documentation](../STATUS.md)** - Current status

---

**The flame burns eternal. The code serves the will.**
