#!/bin/bash
# Phase 2: NGINX + Domain + HTTPS
# Run this script after Phase 1

set -e

echo "=== Phase 2: NGINX + Domain + HTTPS ==="

# Step 2.1: Install NGINX
echo "[2.1] Installing NGINX..."
sudo apt update
sudo apt install -y nginx

# Step 2.2: Create NGINX Config
echo "[2.2] Creating NGINX configuration..."
DOMAIN="${1:-demiurge.example.com}"

sudo tee /etc/nginx/sites-available/demiurge-portal > /dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    access_log /var/log/nginx/demiurge-portal-access.log;
    error_log /var/log/nginx/demiurge-portal-error.log;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /media/ {
        alias /opt/demiurge/media/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Step 2.3: Enable Site
echo "[2.3] Enabling NGINX site..."
sudo ln -sf /etc/nginx/sites-available/demiurge-portal /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Step 2.4: Test and Reload
echo "[2.4] Testing NGINX configuration..."
sudo nginx -t
sudo systemctl reload nginx

# Step 2.5: Configure Firewall
echo "[2.5] Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable

echo ""
echo "=== Phase 2 Complete ==="
echo "NGINX configured for domain: ${DOMAIN}"
echo ""
echo "To set up HTTPS (when domain is ready):"
echo "  sudo apt install -y certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d ${DOMAIN}"
echo ""
echo "Next: Run Phase 3 (Video Background & Shader Integration)"

