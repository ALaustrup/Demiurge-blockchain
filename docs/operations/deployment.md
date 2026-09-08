# Production Deployment

Guide for deploying Demiurge nodes to production.

---

## Prerequisites

### Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 4 GB | 16 GB |
| CPU | 2 cores | 4+ cores |
| Storage | 50 GB SSD | 200 GB NVMe |
| Network | 100 Mbps | 1 Gbps |

### Software Requirements

- Ubuntu 22.04 LTS or 24.04 LTS
- Rust 1.70+ (for building)
- PostgreSQL 14+ (for QOR Auth)
- Nginx (for reverse proxy)
- SSL certificate (Let's Encrypt)

---

## Server Setup

### 1. System Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y \
  build-essential \
  pkg-config \
  libssl-dev \
  libclang-dev \
  git \
  curl \
  nginx \
  certbot \
  python3-certbot-nginx

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

### 2. Clone Repository

```bash
sudo mkdir -p /opt/demiurge/source
sudo chown -R $USER:$USER /opt/demiurge
cd /opt/demiurge/source
git clone https://github.com/ALaustrup/Demiurge-Blockchain.git .
```

### 3. Build Node

```bash
cd /opt/demiurge/source/framework
cargo build --release

# Copy binary
sudo cp target/release/demiurge-node /usr/local/bin/
```

---

## Node Configuration

### Data Directory

```bash
sudo mkdir -p /var/lib/demiurge/data
sudo chown -R $USER:$USER /var/lib/demiurge
```

### Genesis Configuration

Create `/var/lib/demiurge/genesis.json`:

```json
{
  "chain_id": "demiurge-mainnet-v1",
  "timestamp": 1706745600,
  "consensus": {
    "block_time_ms": 6000,
    "initial_validators": [
      {
        "address": "0x...",
        "stake": 1000000000
      }
    ]
  },
  "balances": {
    "0x00000000000000000000000000000000DEMIURGE": 100000000000
  }
}
```

### Validator Key

```bash
# Generate validator key
demiurge-node keygen --output /var/lib/demiurge/validator.key
```

---

## Systemd Service

Create `/etc/systemd/system/demiurge-node.service`:

```ini
[Unit]
Description=Demiurge Blockchain Node
After=network.target

[Service]
Type=simple
User=ubuntu
Group=ubuntu
ExecStart=/usr/local/bin/demiurge-node \
  --rpc-addr 127.0.0.1:9944 \
  --p2p-addr 0.0.0.0:30333 \
  --data-dir /var/lib/demiurge/data \
  --validator-key /var/lib/demiurge/validator.key \
  --genesis /var/lib/demiurge/genesis.json \
  --log-level info

Restart=always
RestartSec=10
LimitNOFILE=65535

# Security hardening
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/demiurge

[Install]
WantedBy=multi-user.target
```

### Enable Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable demiurge-node
sudo systemctl start demiurge-node

# Check status
sudo systemctl status demiurge-node
sudo journalctl -u demiurge-node -f
```

---

## Nginx Configuration

Create `/etc/nginx/sites-available/demiurge`:

```nginx
# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name rpc.demiurge.cloud;
    return 301 https://$server_name$request_uri;
}

# HTTPS RPC proxy
server {
    listen 443 ssl http2;
    server_name rpc.demiurge.cloud;

    ssl_certificate /etc/letsencrypt/live/rpc.demiurge.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rpc.demiurge.cloud/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # RPC endpoint
    location / {
        proxy_pass http://127.0.0.1:9944;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/demiurge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificate

```bash
sudo certbot --nginx -d rpc.demiurge.cloud
```

---

## Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow P2P
sudo ufw allow 30333/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

---

## Monitoring

### Health Check Script

Create `/opt/demiurge/scripts/healthcheck.sh`:

```bash
#!/bin/bash

HEALTH=$(curl -s -X POST http://localhost:9944 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"chain_getHealth","params":[]}')

CONNECTED=$(echo $HEALTH | jq -r '.result.connected')
BLOCK=$(echo $HEALTH | jq -r '.result.block_number')

if [ "$CONNECTED" = "true" ]; then
  echo "OK: Block $BLOCK"
  exit 0
else
  echo "FAIL: Node not connected"
  exit 1
fi
```

### Cron Monitoring

```bash
# Add to crontab
*/5 * * * * /opt/demiurge/scripts/healthcheck.sh >> /var/log/demiurge-health.log 2>&1
```

### Log Rotation

Create `/etc/logrotate.d/demiurge`:

```
/var/log/demiurge*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

---

## Backup

### Data Backup

```bash
#!/bin/bash
# /opt/demiurge/scripts/backup.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR=/var/backups/demiurge

mkdir -p $BACKUP_DIR
systemctl stop demiurge-node

tar -czf $BACKUP_DIR/demiurge-data-$DATE.tar.gz \
  /var/lib/demiurge/data

systemctl start demiurge-node

# Keep last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

---

## Troubleshooting

### Node Won't Start

```bash
# Check logs
sudo journalctl -u demiurge-node -n 100

# Check permissions
ls -la /var/lib/demiurge/

# Check port availability
sudo ss -tulpn | grep 9944
```

### RPC Not Responding

```bash
# Test local connection
curl -s http://localhost:9944 \
  -d '{"jsonrpc":"2.0","id":1,"method":"chain_getHealth","params":[]}'

# Check nginx
sudo nginx -t
sudo systemctl status nginx
```

### High Memory Usage

```bash
# Check process
ps aux | grep demiurge

# Adjust limits in service file
LimitNOFILE=65535
LimitNPROC=65535
```

---

## Security Checklist

- [ ] Firewall enabled and configured
- [ ] SSH key authentication only
- [ ] Fail2ban installed
- [ ] SSL certificates valid
- [ ] Validator key secured
- [ ] Regular backups enabled
- [ ] Monitoring active
- [ ] Log rotation configured

---

## Further Reading

- [Testnet Setup](./testnet.md)
- [Monitoring Guide](./monitoring.md)
- [Architecture](../architecture/README.md)
