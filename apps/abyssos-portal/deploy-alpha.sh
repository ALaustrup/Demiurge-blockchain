#!/bin/bash
# AbyssOS Alpha Deployment Script
# Usage: ./deploy-alpha.sh SERVER_IP [DOMAIN] [RPC_URL]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="${1:-}"
DOMAIN="${2:-}"
RPC_URL="${3:-https://rpc.demiurge.cloud/rpc}"
SERVER_USER="${SERVER_USER:-ubuntu}"
DEPLOY_PATH="/var/www/abyssos-portal"

# Validate inputs
if [ -z "$SERVER_IP" ]; then
    echo -e "${RED}❌ Error: Server IP required${NC}"
    echo "Usage: ./deploy-alpha.sh SERVER_IP [DOMAIN] [RPC_URL]"
    echo "Example: ./deploy-alpha.sh 192.168.1.100"
    echo "Example: ./deploy-alpha.sh 192.168.1.100 example.com"
    echo "Example: ./deploy-alpha.sh 192.168.1.100 example.com https://custom-rpc.com/rpc"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  AbyssOS Alpha Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Configuration:${NC}"
echo "  Server IP: $SERVER_IP"
echo "  Domain: ${DOMAIN:-none (IP-only)}"
echo "  RPC URL: $RPC_URL"
echo "  Server User: $SERVER_USER"
echo "  Deploy Path: $DEPLOY_PATH"
echo ""

# Step 1: Build
echo -e "${BLUE}[1/6]${NC} Building AbyssOS for production..."
cd "$(dirname "$0")"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm not found. Please install pnpm first.${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    pnpm install
fi

# Build with environment variables
echo "Building with RPC URL: $RPC_URL"
VITE_DEMIURGE_RPC_URL="$RPC_URL" pnpm build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed: dist/ directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Step 2: Prepare server directory
echo -e "${BLUE}[2/6]${NC} Preparing server directory..."
ssh "$SERVER_USER@$SERVER_IP" "sudo mkdir -p $DEPLOY_PATH && sudo chown -R $SERVER_USER:$SERVER_USER $DEPLOY_PATH"

echo -e "${GREEN}✅ Server directory ready${NC}"
echo ""

# Step 3: Copy files
echo -e "${BLUE}[3/6]${NC} Copying files to server..."
scp -r dist/* "$SERVER_USER@$SERVER_IP:$DEPLOY_PATH/"

echo -e "${GREEN}✅ Files copied${NC}"
echo ""

# Step 4: Configure Nginx
echo -e "${BLUE}[4/6]${NC} Configuring Nginx..."

# Generate Nginx config
NGINX_CONFIG=$(cat <<EOF
# HTTP server
server {
    listen 80${DOMAIN:+ default_server};
    listen [::]:80${DOMAIN:+ default_server};
    server_name ${DOMAIN:-_};

    root $DEPLOY_PATH;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Static assets with caching
    location /assets/ {
        try_files \$uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|mp4|wav|mp3)\$ {
        try_files \$uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /video/ {
        try_files \$uri =404;
        expires 1d;
        add_header Cache-Control "public";
    }

    location /audio/ {
        try_files \$uri =404;
        expires 1d;
        add_header Cache-Control "public";
    }

    # SPA routing fallback
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location = / {
        try_files /index.html =404;
    }
}
EOF
)

# Copy config to server
echo "$NGINX_CONFIG" | ssh "$SERVER_USER@$SERVER_IP" "sudo tee /etc/nginx/sites-available/abyssos > /dev/null"

# Enable site
ssh "$SERVER_USER@$SERVER_IP" "sudo ln -sf /etc/nginx/sites-available/abyssos /etc/nginx/sites-enabled/abyssos && sudo rm -f /etc/nginx/sites-enabled/default"

# Test and reload Nginx
if ssh "$SERVER_USER@$SERVER_IP" "sudo nginx -t"; then
    ssh "$SERVER_USER@$SERVER_IP" "sudo systemctl reload nginx"
    echo -e "${GREEN}✅ Nginx configured${NC}"
else
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    exit 1
fi
echo ""

# Step 5: Set permissions
echo -e "${BLUE}[5/6]${NC} Setting file permissions..."
ssh "$SERVER_USER@$SERVER_IP" "sudo chown -R www-data:www-data $DEPLOY_PATH && sudo chmod -R 755 $DEPLOY_PATH"

echo -e "${GREEN}✅ Permissions set${NC}"
echo ""

# Step 6: SSL Setup (if domain provided)
if [ -n "$DOMAIN" ]; then
    echo -e "${BLUE}[6/6]${NC} Setting up SSL certificate..."
    echo -e "${YELLOW}⚠️  SSL setup requires manual interaction${NC}"
    echo ""
    echo "Run these commands on your server:"
    echo "  sudo apt install -y certbot python3-certbot-nginx"
    echo "  sudo certbot --nginx -d $DOMAIN${DOMAIN#www} -d www.$DOMAIN"
    echo ""
else
    echo -e "${BLUE}[6/6]${NC} Skipping SSL (no domain provided)"
    echo -e "${YELLOW}⚠️  Accessing via IP only (HTTP)${NC}"
    echo ""
fi

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}📍 Access AbyssOS:${NC}"
if [ -n "$DOMAIN" ]; then
    echo -e "   • HTTPS: ${GREEN}https://$DOMAIN${NC}"
    echo -e "   • HTTP:  http://$DOMAIN (redirects to HTTPS)"
else
    echo -e "   • HTTP:  ${GREEN}http://$SERVER_IP${NC}"
fi
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
if [ -n "$DOMAIN" ]; then
    echo "   1. Set up SSL: sudo certbot --nginx -d $DOMAIN"
    echo "   2. Configure firewall: sudo ufw allow 'Nginx Full'"
else
    echo "   1. Configure firewall: sudo ufw allow 'Nginx Full'"
    echo "   2. (Optional) Set up domain and SSL for HTTPS"
fi
echo "   3. Test the deployment in your browser"
echo "   4. Share the URL with alpha testers!"
echo ""
echo -e "${BLUE}💡 To update:${NC}"
echo "   Run this script again - it will overwrite the existing deployment"
echo ""
