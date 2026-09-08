# 🚀 Demiurge Blockchain - Deployment Guide

**Last Updated**: January 2026  
**Server**: 127.0.0.1

> *"The ancient ritual begins. From code to creation, the deployment serves the will."*

---

## 📋 Overview

Complete guide for deploying the Demiurge Blockchain testnet, including blockchain node and frontend.

---

## 🎯 Prerequisites

### Server Requirements
- Ubuntu 20.04+ or Debian 11+
- 4+ GB RAM
- 50+ GB disk space
- Rust 1.80+
- Node.js 20+
- Docker (optional, for frontend)

### Local Requirements
- PowerShell (Windows) or Bash (Linux/Mac)
- SSH access to server
- SSH key configured

---

## 🚀 Quick Deployment

### Automated Deployment (Recommended)

```powershell
cd scripts
.\deploy-testnet-complete.ps1
```

This script automatically:
1. Stops existing services
2. Clones fresh repository
3. Builds blockchain node
4. Creates systemd service
5. Builds and deploys frontend
6. Verifies all services

---

## 📝 Manual Deployment

### Step 1: Prepare Server

```bash
ssh root@127.0.0.1

# Update system
apt update && apt upgrade -y

# Install dependencies
apt install -y git curl build-essential

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source ~/.cargo/env

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Docker (optional)
curl -fsSL https://get.docker.com | sh
```

### Step 2: Deploy Blockchain Node

```bash
# Clone repository
cd /opt
rm -rf demiurge-blockchain
git clone https://github.com/Alaustrup/Demiurge-Blockchain.git demiurge-blockchain
cd demiurge-blockchain
git checkout main

# Build node
cd framework
source ~/.cargo/env
cargo build --release

# Create data directory
mkdir -p /opt/demiurge-data
chmod 755 /opt/demiurge-data

# Create systemd service
cat > /etc/systemd/system/demiurge-node.service << 'EOF'
[Unit]
Description=Demiurge Blockchain Node
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/demiurge-blockchain/framework
ExecStart=/opt/demiurge-blockchain/framework/target/release/demiurge-node --data-dir /opt/demiurge-data --rpc-addr 0.0.0.0:9944 --p2p-addr 0.0.0.0:30333
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Start service
systemctl daemon-reload
systemctl enable demiurge-node
systemctl start demiurge-node

# Check status
systemctl status demiurge-node
```

### Step 3: Deploy Frontend

```bash
cd /opt/demiurge-blockchain/apps/hub

# Create environment file
cat > .env.production << 'EOF'
NEXT_PUBLIC_DEMIURGE_RPC_URL=http://localhost:9944
NEXT_PUBLIC_QOR_AUTH_URL=http://localhost:8080/api/v1
NODE_ENV=production
PORT=3000
EOF

# Build and run with Docker
docker build -t demiurge-hub:latest .
docker run -d --name demiurge-hub --restart unless-stopped -p 3000:3000 --env-file .env.production demiurge-hub:latest

# Or run directly with Node.js
npm install
npm run build
npm start
```

---

## 🔍 Verification

### Check Services

```bash
# Blockchain node
systemctl status demiurge-node

# Frontend (Docker)
docker ps | grep demiurge-hub

# RPC health check
curl -X POST http://localhost:9944 \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"chain_getHealth","id":1}'

# Frontend check
curl http://localhost:3000
```

---

## 📊 Monitoring

### Logs

```bash
# Node logs
journalctl -u demiurge-node -f

# Frontend logs (Docker)
docker logs -f demiurge-hub
```

### Health Checks

```bash
# Production RPC endpoint
curl -X POST https://rpc.demiurge.cloud \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"chain_getHealth","params":[],"id":1}'

# Local RPC endpoint
curl -X POST http://localhost:9944 \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"chain_getHealth","params":[],"id":1}'
```

---

## 🔗 Connection Information

- **Blockchain RPC**: `https://rpc.demiurge.cloud` (HTTPS) / `wss://rpc.demiurge.cloud` (WebSocket)
- **Frontend**: `https://demiurge.cloud`
- **Local RPC**: `http://localhost:9944` (development)

---

**The flame burns eternal. The code serves the will.**
