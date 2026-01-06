#!/bin/bash
# Server Wipe Commands
# Run these commands on the server to completely wipe it

set -e

echo "================================================================"
echo "  WARNING: SERVER WIPE - ALL DATA WILL BE LOST!"
echo "================================================================"
echo ""
read -p "Type 'WIPE' to confirm: " confirm
if [ "$confirm" != "WIPE" ]; then
    echo "Wipe cancelled."
    exit 0
fi

echo ""
echo "Stopping all services..."
sudo systemctl stop demiurge-chain abyssid abyss-gateway nginx 2>/dev/null || true
sudo systemctl disable demiurge-chain abyssid abyss-gateway nginx 2>/dev/null || true

echo "Removing application data..."
sudo rm -rf /opt/demiurge/*

echo "Removing user data..."
sudo rm -rf /home/ubuntu/.demiurge 2>/dev/null || true
sudo rm -rf /home/ubuntu/demiurge 2>/dev/null || true

echo "Removing systemd services..."
sudo rm -f /etc/systemd/system/demiurge-*.service
sudo rm -f /etc/systemd/system/abyss*.service
sudo systemctl daemon-reload

echo "Removing Nginx configs..."
sudo rm -f /etc/nginx/sites-available/demiurge*
sudo rm -f /etc/nginx/sites-enabled/demiurge*
sudo nginx -t && sudo systemctl reload nginx 2>/dev/null || true

echo "Cleaning up logs..."
sudo rm -rf /var/log/demiurge 2>/dev/null || true
sudo rm -rf /opt/demiurge/logs 2>/dev/null || true

echo "Removing database files..."
sudo rm -rf /opt/demiurge/chain 2>/dev/null || true
sudo rm -rf /opt/demiurge/identity 2>/dev/null || true

echo ""
echo "================================================================"
echo "  Server wiped successfully!"
echo "================================================================"
echo ""
echo "Server is now clean and ready for fresh deployment."
echo "Run the deployment script to set everything up again."
