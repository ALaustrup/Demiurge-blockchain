# Post-Install Server Setup Guide

Complete guide for hardening and configuring a fresh Ubuntu 24.04 LTS server after initial SSH access.

## Overview

The post-install script automates the initial server setup and security hardening. It should be run immediately after gaining SSH access to a fresh Ubuntu 24.04 server.

## Quick Start

### Step 1: SSH to Your Server

```bash
# Using your Node0 SSH key
ssh -i ~/.ssh/Node0 ubuntu@YOUR_SERVER_IP
```

### Step 2: Download and Run Post-Install Script

```bash
# Download the script
curl -O https://raw.githubusercontent.com/ALaustrup/DEMIURGE/feature/fracture-v1-portal/deploy/post-install.sh

# Or if you've already cloned the repo:
cd /opt/demiurge
bash deploy/post-install.sh
```

### Step 3: Verify Everything Works

```bash
# Test SSH key access (from another terminal)
ssh -i ~/.ssh/Node0 ubuntu@YOUR_SERVER_IP

# Check services
sudo systemctl status fail2ban
sudo systemctl status unattended-upgrades
sudo ufw status
```

## What the Script Does

### 1. System Updates
- Updates all packages to latest versions
- Removes obsolete packages

### 2. Base Dependencies
Installs essential packages:
- Build tools (gcc, make, cmake)
- Development libraries (libssl-dev)
- Web server (nginx)
- Security tools (fail2ban, ufw)
- System utilities (htop, jq, sqlite3)

### 3. Timezone Configuration
- Sets timezone (default: UTC)
- Can be customized with `TIMEZONE` environment variable

### 4. Swap Configuration
- Creates swap file if none exists (default: 2GB)
- Optimizes swapiness settings
- Can be customized with `SWAP_SIZE` environment variable

### 5. Firewall (UFW)
- Denies all incoming by default
- Allows SSH (port 22)
- Allows HTTP/HTTPS (ports 80/443)
- Enables firewall

### 6. SSH Hardening
- Disables password authentication
- Disables root login
- Reduces max auth attempts to 3
- Configures connection timeouts
- **⚠️ IMPORTANT: Only SSH key authentication will work after this**

### 7. fail2ban Configuration
- Protects against brute force attacks
- Monitors SSH and other services
- Auto-bans suspicious IPs

### 8. Automated Security Updates
- Configures unattended-upgrades
- Automatic security updates
- Automatic cleanup of old packages
- No automatic reboots (manual control)

### 9. Demiurge User Creation
- Creates dedicated `demiurge` user
- Sets home directory to `/opt/demiurge`
- Adds to sudo group

### 10. Directory Structure
Creates:
- `/opt/demiurge/` - Main directory
- `/opt/demiurge/bin/` - Binaries
- `/opt/demiurge/config/` - Configuration files
- `/opt/demiurge/data/` - Data storage
- `/opt/demiurge/logs/` - Log files
- `/var/www/abyssos-portal/` - Web portal files

### 11. System Limits
- Increases file descriptor limits
- Increases process limits
- Optimized for blockchain node

### 12. Log Rotation
- Configures automatic log rotation
- Keeps 14 days of logs
- Compresses old logs

## Customization

### Custom Timezone

```bash
TIMEZONE="America/New_York" bash deploy/post-install.sh
```

### Custom Swap Size

```bash
SWAP_SIZE="4G" bash deploy/post-install.sh
```

## Manual Steps After Post-Install

### 1. Set Password for Demiurge User (Optional)

```bash
sudo passwd demiurge
```

### 2. Add Your SSH Key to Demiurge User

```bash
# As ubuntu user
sudo mkdir -p /opt/demiurge/.ssh
sudo cp ~/.ssh/authorized_keys /opt/demiurge/.ssh/
sudo chown -R demiurge:demiurge /opt/demiurge/.ssh
sudo chmod 700 /opt/demiurge/.ssh
sudo chmod 600 /opt/demiurge/.ssh/authorized_keys
```

### 3. Clone Repository

```bash
cd /opt/demiurge
sudo -u demiurge git clone https://github.com/ALaustrup/DEMIURGE.git .
sudo -u demiurge git checkout feature/fracture-v1-portal
```

### 4. Run Deployment

```bash
cd /opt/demiurge
sudo -u demiurge bash deploy/ubuntu-24.04-master.sh
```

## Security Checklist

After running the post-install script, verify:

- [ ] SSH password authentication is disabled
- [ ] Root login is disabled
- [ ] Firewall is active and configured
- [ ] fail2ban is running
- [ ] Automated updates are enabled
- [ ] Your SSH key still works
- [ ] Timezone is correct
- [ ] Swap is configured

## Verification Commands

```bash
# Check SSH config
sudo sshd -T | grep -E "PasswordAuthentication|PermitRootLogin"

# Check firewall
sudo ufw status verbose

# Check fail2ban
sudo systemctl status fail2ban
sudo fail2ban-client status

# Check automated updates
sudo systemctl status unattended-upgrades
sudo unattended-upgrade --dry-run

# Check swap
free -h
swapon --show

# Check system limits
ulimit -n
ulimit -u
```

## Troubleshooting

### SSH Access Lost

If you lose SSH access after running the script:

1. **Use server console** (if available through hosting provider)
2. **Restore SSH config**:
   ```bash
   sudo cp /etc/ssh/sshd_config.backup.* /etc/ssh/sshd_config
   sudo systemctl restart sshd
   ```
3. **Verify your SSH key is in authorized_keys**:
   ```bash
   cat ~/.ssh/authorized_keys
   ```

### Firewall Blocking Access

```bash
# Temporarily disable firewall (for testing)
sudo ufw disable

# Re-enable after fixing
sudo ufw enable
```

### fail2ban Blocking Your IP

```bash
# Check banned IPs
sudo fail2ban-client status sshd

# Unban your IP
sudo fail2ban-client set sshd unbanip YOUR_IP
```

## Best Practices

1. **Always test SSH key access** before running the script
2. **Keep a backup SSH session open** while running the script
3. **Test from another terminal** after SSH hardening
4. **Document your server IP** for easy access
5. **Set up SSH config** on your local machine for easier access

## Next Steps

After post-install is complete:

1. Clone Demiurge repository
2. Run master deployment script
3. Configure NGINX
4. Setup SSL certificates
5. Configure monitoring
6. Setup backups

See `docs/deployment/UBUNTU_24.04_DEPLOYMENT.md` for complete deployment guide.
