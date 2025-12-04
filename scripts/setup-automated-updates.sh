#!/bin/bash

# Automated Updates Setup Script for Demiurge Server
# This script configures unattended-upgrades for automatic security updates
# and optional automatic package updates.

set -e

echo "=========================================="
echo "  Demiurge Automated Updates Setup"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ This script must be run as root (use sudo)"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
else
    echo "❌ Cannot detect OS. This script is for Ubuntu/Debian only."
    exit 1
fi

echo "✅ Detected OS: $OS $VERSION"
echo ""

# Install unattended-upgrades if not already installed
if ! command -v unattended-upgrade &> /dev/null; then
    echo "📦 Installing unattended-upgrades..."
    apt-get update
    apt-get install -y unattended-upgrades apt-listchanges
else
    echo "✅ unattended-upgrades is already installed"
fi

# Configure unattended-upgrades
echo ""
echo "⚙️  Configuring unattended-upgrades..."

# Backup existing config
if [ -f /etc/apt/apt.conf.d/50unattended-upgrades ]; then
    cp /etc/apt/apt.conf.d/50unattended-upgrades /etc/apt/apt.conf.d/50unattended-upgrades.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backed up existing configuration"
fi

# Create configuration file
cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
// Automatically upgrade packages from these (origin:archive) pairs
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}:${distro_codename}-updates";
//  "${distro_id}:${distro_codename}-proposed";
//  "${distro_id}:${distro_codename}-backports";
};

// List of packages to not update (regexp are supported)
Unattended-Upgrade::Package-Blacklist {
//  "vim";
//  "libc6";
//  "libc6-dev";
//  "libc6-i686";
};

// This option allows you to control if on a unclean dpkg exit
// unattended-upgrades will automatically run 
//   dpkg --force-confold --configure -a
// The default is true, to ensure updates keep getting installed
Unattended-Upgrade::AutoFixInterruptedDpkg "true";

// Split the upgrade into the smallest possible chunks so that
// they can be interrupted with SIGUSR1. This makes the upgrade
// a bit slower but it has the benefit that shutdown while a upgrade
// is running is possible (with a small delay)
Unattended-Upgrade::MinimalSteps "true";

// Install all updates when the machine is shutting down
// instead of doing it in the background while the machine is running.
// This will (obviously) make shutdown slower.
// Unattended-Upgrade::InstallOnShutdown "true";

// Send email to this address for problems or packages upgrades
// If empty or unset then no email is sent, make sure that you
// have a working mail setup on your system. A package that provides
// 'mail-transport-agent' is required.
// Unattended-Upgrade::Mail "root";

// Set this value to "true" to get emails only on errors. Default
// is to always send a mail if Unattended-Upgrade::Mail is set
// Unattended-Upgrade::MailOnlyOnError "true";

// Do automatic removal of new unused dependencies after the upgrade
// (equivalent to apt-get autoremove)
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";

// Automatically reboot *WITHOUT CONFIRMATION* if
//  the file /var/run/reboot-required exists after the upgrade
// Unattended-Upgrade::Automatic-Reboot "false";

// Automatically reboot even if there are users currently logged in
// when Unattended-Upgrade::Automatic-Reboot is set to true
// Unattended-Upgrade::Automatic-Reboot-WithUsers "true";

// If automatic reboot is enabled and needed, reboot at the specific
// time instead of immediately
//  Default: "now"
// Unattended-Upgrade::Automatic-Reboot-Time "02:00";

// Use apt bandwidth limit feature, this example limits the download
// speed to 70kb/sec. Alternative you can set this to "100%" for
// unlimited speed.
// Unattended-Upgrade::DownloadLimit "70";

// Enable logging to syslog. Default is False
Unattended-Upgrade::SyslogEnable "true";

// Specify syslog facility. Default is daemon
Unattended-Upgrade::SyslogFacility "daemon";

// Log level. Default is "info"
Unattended-Upgrade::Verbose "1";
EOF

echo "✅ Created unattended-upgrades configuration"
echo ""

# Enable automatic updates
echo "⚙️  Enabling automatic updates..."
cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
// Enable automatic updates
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
EOF

echo "✅ Enabled automatic updates"
echo ""

# Enable and start the service
echo "🚀 Enabling unattended-upgrades service..."
systemctl enable unattended-upgrades
systemctl start unattended-upgrades

echo "✅ Service enabled and started"
echo ""

# Test the configuration
echo "🧪 Testing configuration..."
unattended-upgrade --dry-run --debug 2>&1 | head -20

echo ""
echo "=========================================="
echo "  ✅ Automated Updates Setup Complete!"
echo "=========================================="
echo ""
echo "📋 Configuration Summary:"
echo "   • Security updates: ✅ Automatic"
echo "   • Regular updates: ✅ Automatic"
echo "   • Auto-reboot: ❌ Disabled (manual)"
echo "   • Email notifications: ❌ Disabled"
echo "   • Logging: ✅ Enabled (syslog)"
echo ""
echo "📝 To modify settings, edit:"
echo "   /etc/apt/apt.conf.d/50unattended-upgrades"
echo ""
echo "📊 Check update status:"
echo "   sudo unattended-upgrade --dry-run"
echo ""
echo "📋 View update logs:"
echo "   sudo tail -f /var/log/unattended-upgrades/unattended-upgrades.log"
echo ""
echo "🔄 Manual update check:"
echo "   sudo apt update && sudo apt list --upgradable"
echo ""

