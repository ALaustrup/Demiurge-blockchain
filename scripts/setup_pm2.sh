#!/bin/bash
# Setup PM2 for process management
# Run this once to set up PM2

set -e

echo "=== Setting up PM2 ==="

# Install PM2 globally
echo "[1] Installing PM2..."
sudo npm install -g pm2

# Create PM2 ecosystem file
echo "[2] Creating PM2 ecosystem file..."
cat > /opt/demiurge/pm2.config.js <<EOF
module.exports = {
  apps: [
    {
      name: 'demiurge-portal',
      cwd: '/opt/demiurge/repo/apps/portal-web',
      script: 'npm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/opt/demiurge/logs/portal-error.log',
      out_file: '/opt/demiurge/logs/portal-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'abyssid-backend',
      cwd: '/opt/demiurge/repo/apps/abyssid-backend',
      script: 'node',
      args: 'src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/opt/demiurge/logs/abyssid-error.log',
      out_file: '/opt/demiurge/logs/abyssid-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
EOF

# Start services
echo "[3] Starting services with PM2..."
pm2 start /opt/demiurge/pm2.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u $USER --hp /home/$USER

echo ""
echo "=== PM2 Setup Complete ==="
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check service status"
echo "  pm2 logs            - View all logs"
echo "  pm2 logs demiurge-portal - View portal logs"
echo "  pm2 restart all     - Restart all services"
echo "  pm2 stop all        - Stop all services"

