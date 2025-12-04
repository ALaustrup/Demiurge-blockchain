#!/usr/bin/env bash
# Setup systemd service for Demiurge Node0

set -euo pipefail

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "[NODE0] Setting up systemd service..."

# Create demiurge user if it doesn't exist
if ! id -u demiurge &>/dev/null; then
    echo "[NODE0] Creating demiurge system user..."
    sudo useradd -r -m -d /var/lib/demiurge -s /usr/sbin/nologin demiurge
    echo "[NODE0] User 'demiurge' created."
else
    echo "[NODE0] User 'demiurge' already exists."
fi

# Ensure /opt/demiurge exists (assume repo is already cloned there)
if [[ ! -d "/opt/demiurge" ]]; then
    echo "Warning: /opt/demiurge does not exist. Creating directory..." >&2
    sudo mkdir -p /opt/demiurge
fi

# Set ownership of repository to demiurge user
echo "[NODE0] Setting ownership of /opt/demiurge to demiurge:demiurge..."
sudo chown -R demiurge:demiurge /opt/demiurge

# Copy systemd unit file
echo "[NODE0] Installing systemd unit file..."
sudo cp "${SCRIPT_DIR}/demiurge-node0.service" /etc/systemd/system/demiurge-node0.service

# Reload systemd daemon
echo "[NODE0] Reloading systemd daemon..."
sudo systemctl daemon-reload

# Enable service (start on boot)
echo "[NODE0] Enabling demiurge-node0.service (start on boot)..."
sudo systemctl enable demiurge-node0.service

# Start service
echo "[NODE0] Starting demiurge-node0.service..."
sudo systemctl restart demiurge-node0.service

# Wait a moment for service to start
sleep 2

# Show service status
echo ""
echo "[NODE0] Service status:"
sudo systemctl status demiurge-node0.service --no-pager || true

echo ""
echo "[NODE0] Systemd setup complete!"
echo "[NODE0] View logs with: sudo journalctl -u demiurge-node0.service -f"

