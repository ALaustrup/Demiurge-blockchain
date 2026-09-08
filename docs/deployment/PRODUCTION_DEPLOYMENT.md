# Demiurge Protocol - Production Deployment Guide

## Overview

This document outlines the deployment process for the Demiurge Protocol to production servers.

## Prerequisites

### Server Requirements

- **OS**: Ubuntu 22.04 LTS or Debian 12
- **RAM**: Minimum 16GB (32GB recommended for validators)
- **Storage**: 500GB SSD (NVMe recommended)
- **CPU**: 4+ cores (8+ recommended)
- **Network**: Static IP, ports 30333, 9944, 9933 open

### Software Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install build essentials
sudo apt install -y build-essential pkg-config libssl-dev libclang-dev git curl

# Install Rust (nightly required for ZK circuits)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup install nightly
rustup default stable

# Install Node.js (for SDKs)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## Build Process

### 1. Clone Repository

```bash
git clone https://github.com/ALaustrup/Demiurge-Blockchain.git
cd Demiurge-Blockchain
```

### 2. Build Framework

```bash
cd framework

# Build release binaries
cargo build --release --features "demiurge-agentic/std,demiurge-cvp/zk-plonky2"

# Run tests
cargo test --release --features "demiurge-agentic/std"
```

### 3. Build Node

```bash
# The main node binary
cargo build --release -p demiurge-node
```

## Configuration

### Create Node Configuration

```toml
# /etc/demiurge/node.toml

[network]
listen_addresses = ["/ip4/0.0.0.0/tcp/30333"]
bootnodes = []  # Add known bootnodes here
max_peers = 50

[chain]
chain_id = "demiurge-mainnet-1"
genesis_path = "/etc/demiurge/genesis.json"

[rpc]
enabled = true
listen_address = "127.0.0.1:9944"
cors = ["*"]
max_connections = 100

[validator]
enabled = true
account = "YOUR_VALIDATOR_ACCOUNT_HEX"
# Generate with: dd if=/dev/urandom bs=32 count=1 2>/dev/null | xxd -p -c 64

[storage]
path = "/var/lib/demiurge/data"
cache_size_mb = 512

[logging]
level = "info"
format = "json"
```

### Create Systemd Service

```ini
# /etc/systemd/system/demiurge-node.service

[Unit]
Description=Demiurge Blockchain Node
After=network.target

[Service]
Type=simple
User=demiurge
Group=demiurge
ExecStart=/usr/local/bin/demiurge-node --config /etc/demiurge/node.toml
Restart=on-failure
RestartSec=10
LimitNOFILE=65535
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

## Deployment Steps

### 1. Create User

```bash
sudo useradd -r -s /bin/false demiurge
sudo mkdir -p /var/lib/demiurge/data
sudo mkdir -p /etc/demiurge
sudo chown -R demiurge:demiurge /var/lib/demiurge
```

### 2. Copy Binaries

```bash
sudo cp target/release/demiurge-node /usr/local/bin/
sudo chmod +x /usr/local/bin/demiurge-node
```

### 3. Copy Configuration

```bash
sudo cp node.toml /etc/demiurge/
sudo cp genesis.json /etc/demiurge/
sudo chown -R demiurge:demiurge /etc/demiurge
```

### 4. Enable Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable demiurge-node
sudo systemctl start demiurge-node
```

### 5. Check Status

```bash
# View logs
sudo journalctl -u demiurge-node -f

# Check status
sudo systemctl status demiurge-node

# Check RPC
curl -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"chain_getStatus","params":[]}' \
  http://localhost:9944
```

## Security Hardening

### Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow P2P networking
sudo ufw allow 30333/tcp

# Allow RPC (internal only)
# sudo ufw allow from 10.0.0.0/8 to any port 9944

# Enable firewall
sudo ufw enable
```

### Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/demiurge-rpc

server {
    listen 443 ssl http2;
    server_name rpc.demiurge.cloud;

    ssl_certificate /etc/letsencrypt/live/rpc.demiurge.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rpc.demiurge.cloud/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:9944;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Monitoring

### Prometheus Metrics

The node exposes Prometheus metrics at `/metrics` on port 9615:

```bash
# Add to Prometheus config
scrape_configs:
  - job_name: 'demiurge'
    static_configs:
      - targets: ['localhost:9615']
```

### Key Metrics

- `demiurge_block_height`: Current block height
- `demiurge_peers_connected`: Number of connected peers
- `demiurge_transactions_processed`: Transaction throughput
- `demiurge_cvp_mutations_verified`: CVP mutations verified

### Alerting Rules

```yaml
groups:
  - name: demiurge
    rules:
      - alert: NodeDown
        expr: up{job="demiurge"} == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Demiurge node is down"
          
      - alert: BlockProductionStopped
        expr: increase(demiurge_block_height[10m]) == 0
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Block production has stopped"
          
      - alert: LowPeerCount
        expr: demiurge_peers_connected < 3
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low peer count"
```

## Backup Procedures

### Database Backup

```bash
#!/bin/bash
# /etc/cron.daily/demiurge-backup

BACKUP_DIR="/var/backups/demiurge"
DATE=$(date +%Y%m%d_%H%M%S)

# Stop node temporarily
sudo systemctl stop demiurge-node

# Create backup
sudo tar -czf $BACKUP_DIR/demiurge-$DATE.tar.gz /var/lib/demiurge/data

# Start node
sudo systemctl start demiurge-node

# Remove old backups (keep 7 days)
find $BACKUP_DIR -type f -mtime +7 -delete
```

## Upgrade Procedure

### Rolling Upgrade

```bash
# 1. Build new version
cd Demiurge-Blockchain
git pull
cargo build --release

# 2. Stop service
sudo systemctl stop demiurge-node

# 3. Replace binary
sudo cp target/release/demiurge-node /usr/local/bin/

# 4. Start service
sudo systemctl start demiurge-node

# 5. Verify
sudo journalctl -u demiurge-node -f
```

## Troubleshooting

### Common Issues

1. **Node won't start**: Check permissions on data directory
2. **No peers**: Verify firewall rules and bootnode addresses
3. **High memory usage**: Adjust cache_size_mb in config
4. **RPC timeout**: Check Nginx proxy settings

### Log Locations

- Node logs: `journalctl -u demiurge-node`
- Nginx logs: `/var/log/nginx/access.log`
- System logs: `/var/log/syslog`

## Contact

- GitHub: https://github.com/ALaustrup/Demiurge-Blockchain
- Discord: https://discord.gg/demiurge
- Documentation: https://docs.demiurge.cloud
