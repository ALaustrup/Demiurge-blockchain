#!/bin/bash

# Manual System Update Script
# Run this script to manually update the system packages
# This is useful for checking what updates are available or forcing an update

set -e

echo "=========================================="
echo "  Demiurge System Update"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ This script must be run as root (use sudo)"
    exit 1
fi

# Update package lists
echo "📦 Updating package lists..."
apt-get update

echo ""
echo "📋 Checking for available updates..."
apt list --upgradable

echo ""
read -p "Do you want to install all available updates? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "⬆️  Upgrading packages..."
    apt-get upgrade -y
    
    echo ""
    echo "🧹 Cleaning up..."
    apt-get autoremove -y
    apt-get autoclean
    
    echo ""
    echo "✅ System update complete!"
    
    # Check if reboot is required
    if [ -f /var/run/reboot-required ]; then
        echo ""
        echo "⚠️  System reboot required!"
        echo "   Run: sudo reboot"
        cat /var/run/reboot-required.pkgs
    fi
else
    echo ""
    echo "ℹ️  Update cancelled. No changes made."
fi

echo ""

