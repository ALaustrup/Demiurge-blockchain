#!/usr/bin/env bash
# Post-Install Script for Ubuntu 24.04 LTS Server
# Run this script immediately after gaining SSH access to a fresh Ubuntu 24.04 server
# This script hardens the server and prepares it for Demiurge deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TIMEZONE="${TIMEZONE:-UTC}"
SWAP_SIZE="${SWAP_SIZE:-2G}"  # 2GB swap (adjust based on server RAM)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Demiurge Server Post-Install${NC}"
echo -e "${BLUE}  Ubuntu 24.04 LTS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ This script must be run as root (use sudo)${NC}"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VERSION=$VERSION_ID
    echo -e "${GREEN}✅ Detected OS: $OS $VERSION${NC}"
    
    if [ "$OS" != "ubuntu" ] || [ "$VERSION" != "24.04" ]; then
        echo -e "${YELLOW}⚠️  Warning: This script is optimized for Ubuntu 24.04 LTS${NC}"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    echo -e "${RED}❌ Cannot detect OS${NC}"
    exit 1
fi

# Step 1: Update system
echo -e "${BLUE}[1/12]${NC} Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt update -qq
apt upgrade -y -qq
apt autoremove -y -qq
echo -e "${GREEN}✅ System updated${NC}"

# Step 2: Install base dependencies
echo -e "${BLUE}[2/12]${NC} Installing base dependencies..."
apt install -y -qq \
    curl \
    wget \
    git \
    build-essential \
    pkg-config \
    libssl-dev \
    clang \
    cmake \
    nginx \
    ufw \
    fail2ban \
    unattended-upgrades \
    apt-listchanges \
    jq \
    sqlite3 \
    htop \
    net-tools \
    vim \
    nano \
    || {
    echo -e "${RED}❌ Failed to install base packages${NC}" >&2
    exit 1
}
echo -e "${GREEN}✅ Base dependencies installed${NC}"

# Step 3: Configure timezone
echo -e "${BLUE}[3/12]${NC} Configuring timezone..."
timedatectl set-timezone "$TIMEZONE"
echo -e "${GREEN}✅ Timezone set to $TIMEZONE${NC}"

# Step 4: Setup swap (if not exists)
echo -e "${BLUE}[4/12]${NC} Checking swap..."
if [ -z "$(swapon --show)" ]; then
    echo -e "${YELLOW}⚠️  No swap found, creating ${SWAP_SIZE} swap file...${NC}"
    fallocate -l "$SWAP_SIZE" /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    
    # Optimize swapiness
    sysctl vm.swappiness=10
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    
    sysctl vm.vfs_cache_pressure=50
    echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.conf
    
    echo -e "${GREEN}✅ Swap created and configured${NC}"
else
    echo -e "${GREEN}✅ Swap already exists${NC}"
fi

# Step 5: Configure firewall
echo -e "${BLUE}[5/12]${NC} Configuring firewall (UFW)..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo -e "${GREEN}✅ Firewall configured${NC}"

# Step 6: Harden SSH
echo -e "${BLUE}[6/12]${NC} Hardening SSH configuration..."
SSH_CONFIG="/etc/ssh/sshd_config"
SSH_BACKUP="/etc/ssh/sshd_config.backup.$(date +%Y%m%d_%H%M%S)"

# Backup original config
cp "$SSH_CONFIG" "$SSH_BACKUP"

# Apply security settings
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' "$SSH_CONFIG"
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' "$SSH_CONFIG"
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' "$SSH_CONFIG"
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' "$SSH_CONFIG"
sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' "$SSH_CONFIG"
sed -i 's/#MaxAuthTries 6/MaxAuthTries 3/' "$SSH_CONFIG"
sed -i 's/MaxAuthTries 6/MaxAuthTries 3/' "$SSH_CONFIG"

# Add additional security settings if not present
if ! grep -q "^ClientAliveInterval" "$SSH_CONFIG"; then
    echo "ClientAliveInterval 300" >> "$SSH_CONFIG"
fi
if ! grep -q "^ClientAliveCountMax" "$SSH_CONFIG"; then
    echo "ClientAliveCountMax 2" >> "$SSH_CONFIG"
fi

# Test SSH config
if sshd -t; then
    systemctl restart sshd
    echo -e "${GREEN}✅ SSH hardened (password auth disabled)${NC}"
    echo -e "${YELLOW}⚠️  Make sure your SSH key is working before disconnecting!${NC}"
else
    echo -e "${RED}❌ SSH config test failed, restoring backup${NC}"
    cp "$SSH_BACKUP" "$SSH_CONFIG"
    systemctl restart sshd
fi

# Step 7: Configure fail2ban
echo -e "${BLUE}[7/12]${NC} Configuring fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban
echo -e "${GREEN}✅ fail2ban configured${NC}"

# Step 8: Setup automated security updates
echo -e "${BLUE}[8/12]${NC} Configuring automated security updates..."
cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}:${distro_codename}-updates";
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::SyslogEnable "true";
Unattended-Upgrade::SyslogFacility "daemon";
Unattended-Upgrade::Verbose "1";
EOF

cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
EOF

systemctl enable unattended-upgrades
systemctl start unattended-upgrades
echo -e "${GREEN}✅ Automated security updates configured${NC}"

# Step 9: Create demiurge user (if not exists)
echo -e "${BLUE}[9/12]${NC} Creating demiurge user..."
if ! id -u demiurge &>/dev/null; then
    useradd -r -m -d /opt/demiurge -s /bin/bash demiurge
    usermod -aG sudo demiurge
    echo -e "${GREEN}✅ User 'demiurge' created${NC}"
    echo -e "${YELLOW}⚠️  Set password for demiurge user: passwd demiurge${NC}"
else
    echo -e "${GREEN}✅ User 'demiurge' already exists${NC}"
fi

# Step 10: Create directory structure
echo -e "${BLUE}[10/12]${NC} Creating directory structure..."
mkdir -p /opt/demiurge/{bin,config,data,logs}
mkdir -p /var/www/abyssos-portal
chown -R demiurge:demiurge /opt/demiurge
chown -R www-data:www-data /var/www/abyssos-portal
echo -e "${GREEN}✅ Directories created${NC}"

# Step 11: Configure system limits
echo -e "${BLUE}[11/12]${NC} Configuring system limits..."
cat >> /etc/security/limits.conf << 'EOF'
# Demiurge blockchain node limits
demiurge soft nofile 65535
demiurge hard nofile 65535
demiurge soft nproc 32768
demiurge hard nproc 32768
EOF
echo -e "${GREEN}✅ System limits configured${NC}"

# Step 12: Setup log rotation
echo -e "${BLUE}[12/12]${NC} Configuring log rotation..."
cat > /etc/logrotate.d/demiurge << 'EOF'
/opt/demiurge/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 demiurge demiurge
    sharedscripts
}
EOF
echo -e "${GREEN}✅ Log rotation configured${NC}"

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Post-Install Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Security Hardening:${NC}"
echo "  ✅ SSH password authentication disabled"
echo "  ✅ Root login disabled"
echo "  ✅ Firewall (UFW) configured"
echo "  ✅ fail2ban enabled"
echo "  ✅ Automated security updates enabled"
echo ""
echo -e "${BLUE}System Configuration:${NC}"
echo "  ✅ System updated"
echo "  ✅ Base dependencies installed"
echo "  ✅ Timezone: $TIMEZONE"
echo "  ✅ Swap configured"
echo "  ✅ System limits set"
echo "  ✅ Log rotation configured"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Verify SSH key access still works"
echo "  2. Clone Demiurge repository:"
echo "     cd /opt/demiurge"
echo "     git clone https://github.com/ALaustrup/DEMIURGE.git ."
echo "  3. Run deployment script:"
echo "     bash deploy/ubuntu-24.04-master.sh"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "  • SSH password authentication is now DISABLED"
echo "  • Only SSH key authentication is allowed"
echo "  • Make sure your SSH key is working before closing this session!"
echo "  • Test with: ssh -i ~/.ssh/Node0 ubuntu@$(hostname -I | awk '{print $1}')"
echo ""
