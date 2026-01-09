# DEMIURGE ARM64 OS - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Services](#services)
6. [Applications](#applications)
7. [Networking](#networking)
8. [Security](#security)
9. [Performance](#performance)
10. [Troubleshooting](#troubleshooting)
11. [Development](#development)
12. [Maintenance](#maintenance)

## Overview

The DEMIURGE ARM64 Operating System is a custom Linux distribution based on Raspberry Pi OS (Debian Bookworm) that includes the complete Demiurge Blockchain ecosystem pre-installed and configured for Raspberry Pi 5.

### Key Features

- **Complete Ecosystem**: All Demiurge components pre-installed
- **Auto-Start Services**: Everything starts automatically on boot
- **Optimized for Pi 5**: ARM64 native builds for maximum performance
- **Genesis Theme**: Consistent branding throughout
- **Production Ready**: Secure, stable, and optimized

### What's Included

| Component | Description | Status |
|-----------|------------|--------|
| Demiurge Chain | Blockchain node with Forge PoW | ✅ Auto-start |
| Indexer | GraphQL API gateway | ✅ Auto-start |
| Portal Web | Landing page and dashboard | ✅ Auto-start |
| QLOUD OS | Web-based desktop environment | ✅ Auto-start |
| QOR Desktop | Native Qt desktop application | ✅ Available |
| Genesis Launcher | Application launcher | ✅ Available |
| TORRNT | Torrenting client | ✅ Available |
| QorID Service | Identity and authentication | ✅ Auto-start |
| DNS Service | Blockchain DNS resolver | ✅ Auto-start |

## System Requirements

### Hardware

#### Minimum (Light Node)
- **Raspberry Pi 5** (4GB RAM)
- **32GB microSD card** (Class 10)
- **5V 3A power supply**
- **Ethernet connection**

#### Recommended (Full Node)
- **Raspberry Pi 5** (8GB RAM)
- **64GB+ microSD card** (Class 10, UHS-I)
- **5V 5A power supply** (official recommended)
- **Ethernet connection**
- **USB 3.0 SSD** (for chain data - highly recommended)

#### Optimal (Mining/Validator)
- **Raspberry Pi 5** (8GB RAM)
- **128GB+ USB 3.0 SSD** (for OS and data)
- **5V 5A power supply**
- **Gigabit Ethernet**
- **Cooling solution** (heatsink/fan recommended)

### Software

- **Raspberry Pi Imager** (for flashing)
- **SSH client** (for remote access)
- **Web browser** (for web interfaces)

## Installation

### Quick Install (Pre-built Image)

1. **Download** the latest image from releases
2. **Flash** using Raspberry Pi Imager (see `FLASH_IMAGE.md`)
3. **Boot** Raspberry Pi 5
4. **Done!** All services start automatically

### Custom Build

See `BUILD_WINDOWS.md` for Windows build instructions or `QUICKSTART.md` for Linux/WSL.

## Configuration

### First Boot Setup

#### 1. Change Default Password

```bash
ssh demiurge@raspberrypi.local
passwd
```

#### 2. Configure Network

**Static IP (Optional):**

```bash
sudo nano /etc/dhcpcd.conf

# Add:
interface eth0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=8.8.8.8 8.8.4.4
```

**WiFi (Optional):**

```bash
sudo raspi-config
# Navigate to: System Options → Wireless LAN
```

#### 3. Update System

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### Chain Configuration

Edit `/etc/demiurge/chain.toml`:

```toml
[rpc]
host = "0.0.0.0"
port = 8545

[mining]
enabled = true
threads = 4  # Use all Pi 5 cores

[storage]
data_dir = "/var/lib/demiurge/chain"
# For SSD: data_dir = "/mnt/ssd/chain"
```

Restart service:
```bash
sudo systemctl restart demiurge-chain
```

### Service Configuration

All service configs are in `/etc/demiurge/`:

- `chain.toml` - Chain node configuration
- `indexer.json` - Indexer configuration
- `services.json` - Service coordination

## Services

### Service Management

```bash
# List all Demiurge services
systemctl list-units demiurge-*

# Check service status
sudo systemctl status demiurge-chain
sudo systemctl status demiurge-indexer
sudo systemctl status demiurge-portal
sudo systemctl status demiurge-qloud
sudo systemctl status demiurge-qorid

# Start/stop/restart
sudo systemctl start demiurge-chain
sudo systemctl stop demiurge-chain
sudo systemctl restart demiurge-chain

# Enable/disable auto-start
sudo systemctl enable demiurge-chain
sudo systemctl disable demiurge-chain
```

### Service Logs

```bash
# View logs
sudo journalctl -u demiurge-chain -f
sudo journalctl -u demiurge-indexer -f

# View all Demiurge logs
sudo journalctl -u demiurge-* -f

# View last 100 lines
sudo journalctl -u demiurge-chain -n 100
```

### Service Dependencies

```
demiurge-chain (no dependencies)
    └── demiurge-indexer (depends on chain)
    └── demiurge-portal (depends on chain)
    └── demiurge-qloud (depends on chain)
    └── demiurge-qorid (depends on chain)
```

## Applications

### Web Applications

#### Portal Web
- **URL**: `http://raspberrypi.local` or `http://<IP>:3000`
- **Purpose**: Landing page, documentation, wallet management
- **Service**: `demiurge-portal.service`

#### QLOUD OS
- **URL**: `http://raspberrypi.local/qloud` or `http://<IP>:5173`
- **Purpose**: Full web-based desktop environment
- **Service**: `demiurge-qloud.service`

#### GraphQL API
- **URL**: `http://raspberrypi.local/graphql` or `http://<IP>:4000/graphql`
- **Purpose**: Query blockchain data
- **Service**: `demiurge-indexer.service`

### Desktop Applications

#### QOR Desktop
- **Location**: `/opt/demiurge/apps/qor-desktop`
- **Launch**: From desktop menu or `qor-desktop` command
- **Purpose**: Native Qt desktop environment

#### Genesis Launcher
- **Location**: `/opt/demiurge/apps/genesis-launcher`
- **Launch**: `GenesisLauncher` command
- **Purpose**: Application launcher and updater

#### TORRNT
- **Location**: `/opt/demiurge/apps/torrnt`
- **Launch**: `torrnt` command
- **Purpose**: Torrenting client with blockchain integration

## Networking

### Ports

| Port | Service | Protocol | Access |
|------|---------|----------|--------|
| 22 | SSH | TCP | Local network |
| 80 | HTTP (Nginx) | TCP | Public |
| 443 | HTTPS (Nginx) | TCP | Public |
| 3000 | Portal Web | TCP | Local |
| 4000 | GraphQL API | TCP | Local/Public |
| 5173 | QLOUD OS | TCP | Local |
| 8082 | QorID Service | TCP | Local |
| 8545 | Chain RPC | TCP | Local/Public |
| 53 | DNS Service | UDP/TCP | Local |

### Firewall (UFW)

```bash
# Check status
sudo ufw status

# View rules
sudo ufw status verbose

# Allow specific port
sudo ufw allow 8545/tcp

# Deny port
sudo ufw deny 3000/tcp
```

### Nginx Configuration

Main config: `/etc/nginx/sites-available/demiurge`

```nginx
server {
    listen 80;
    server_name _;

    # Portal Web
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # QLOUD OS
    location /qloud {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    # GraphQL API
    location /graphql {
        proxy_pass http://localhost:4000/graphql;
    }
}
```

Reload Nginx:
```bash
sudo nginx -t  # Test config
sudo systemctl reload nginx
```

## Security

### Initial Hardening

```bash
# Run hardening script
sudo /opt/demiurge/scripts/harden-system.sh
```

This will:
- Change default password
- Configure firewall
- Set up SSH keys
- Enable automatic security updates
- Configure fail2ban

### SSH Security

**Disable password authentication (after keys work):**

```bash
sudo nano /etc/ssh/sshd_config

# Set:
PasswordAuthentication no
PubkeyAuthentication yes

sudo systemctl restart ssh
```

**Set up SSH keys:**

```bash
# On your computer
ssh-copy-id demiurge@raspberrypi.local

# Test
ssh demiurge@raspberrypi.local  # Should not prompt for password
```

### Firewall Rules

Default rules:
- SSH (22): Allowed
- HTTP (80): Allowed
- HTTPS (443): Allowed
- Chain RPC (8545): Allowed (consider restricting)
- All other ports: Denied

### Automatic Updates

Security updates are enabled by default via `unattended-upgrades`.

Check status:
```bash
sudo systemctl status unattended-upgrades
```

## Performance

### CPU Governor

Set to `performance` for mining:

```bash
# Check current
cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Set to performance
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor

# Make permanent
sudo nano /etc/default/cpufrequtils
# Add: GOVERNOR=performance
```

### Overclocking

Edit `/boot/config.txt`:

```bash
sudo nano /boot/config.txt

# Add:
arm_freq=2400          # CPU frequency (MHz)
over_voltage=6         # Voltage offset
gpu_freq=750           # GPU frequency
```

**Warning**: Overclocking may void warranty and cause instability. Start conservative and test.

### Storage Optimization

**Use SSD for chain data:**

```bash
# Connect USB 3.0 SSD
# Format (if needed)
sudo mkfs.ext4 /dev/sda1

# Mount
sudo mkdir -p /mnt/ssd
sudo mount /dev/sda1 /mnt/ssd

# Move chain data
sudo systemctl stop demiurge-chain
sudo mv /var/lib/demiurge/chain /mnt/ssd/
sudo ln -s /mnt/ssd/chain /var/lib/demiurge/chain

# Update config
sudo nano /etc/demiurge/chain.toml
# Set: data_dir = "/mnt/ssd/chain"

# Auto-mount on boot
echo "/dev/sda1 /mnt/ssd ext4 defaults 0 2" | sudo tee -a /etc/fstab

sudo systemctl start demiurge-chain
```

### Memory Optimization

**Check memory usage:**

```bash
free -h
htop
```

**Optimize for mining:**

```bash
# Reduce GPU memory split (if not using desktop)
sudo nano /boot/config.txt
# Set: gpu_mem=64
```

## Troubleshooting

### Services Won't Start

```bash
# Check service status
sudo systemctl status demiurge-chain

# Check logs
sudo journalctl -u demiurge-chain -n 50

# Check dependencies
systemctl list-dependencies demiurge-chain

# Check ports
sudo netstat -tulpn | grep :8545
```

### Chain Not Syncing

```bash
# Check chain logs
sudo journalctl -u demiurge-chain -f

# Check RPC connectivity
curl -X POST http://localhost:8545/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"chain_getHeight","params":[],"id":1}'

# Reset chain (WARNING: deletes data)
sudo systemctl stop demiurge-chain
sudo rm -rf /var/lib/demiurge/chain/*
sudo systemctl start demiurge-chain
```

### High CPU Usage

```bash
# Check processes
htop
top

# Check mining status
curl -X POST http://localhost:8545/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"forge_getMiningStatus","params":[],"id":1}'

# Disable mining if needed
sudo nano /etc/demiurge/chain.toml
# Set: mining_enabled = false
sudo systemctl restart demiurge-chain
```

### Network Issues

```bash
# Check network
ip addr show
ping -c 4 8.8.8.8

# Check DNS
nslookup raspberrypi.local

# Restart networking
sudo systemctl restart networking
```

### Disk Space

```bash
# Check disk usage
df -h
du -sh /var/lib/demiurge/*

# Clean logs
sudo journalctl --vacuum-time=7d  # Keep last 7 days

# Clean package cache
sudo apt-get clean
```

## Development

### Building Components

#### Chain (Cross-compile)

```bash
cd arm64-os/scripts
./cross-compile-chain.sh
```

#### Qt Applications

```bash
cd arm64-os/scripts
./build-qt-apps.sh
```

#### Node.js Applications

```bash
cd /opt/demiurge/apps/portal-web
pnpm install
pnpm build
```

### Adding New Services

1. Create service file in `arm64-os/systemd/`
2. Copy to `/etc/systemd/system/` during image build
3. Enable: `sudo systemctl enable service-name`

### Modifying Image

Edit `arm64-os/image/customize.sh` and rebuild.

## Maintenance

### Regular Updates

```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Update Demiurge components
cd /opt/demiurge
git pull origin main
# Rebuild and restart services
```

### Backup

**Important data to backup:**

```bash
# Chain data
sudo tar -czf chain-backup-$(date +%Y%m%d).tar.gz /var/lib/demiurge/chain

# Wallets
sudo tar -czf wallets-backup-$(date +%Y%m%d).tar.gz /var/lib/demiurge/wallets

# Configuration
sudo tar -czf config-backup-$(date +%Y%m%d).tar.gz /etc/demiurge
```

### Monitoring

**System resources:**

```bash
# CPU and memory
htop

# Disk I/O
iotop

# Network
iftop
```

**Service health:**

```bash
# Check all services
systemctl status demiurge-*

# Service uptime
systemctl show demiurge-chain -p ActiveEnterTimestamp
```

### Log Rotation

Logs are automatically rotated via `journald`. Configure in `/etc/systemd/journald.conf`:

```ini
[Journal]
SystemMaxUse=500M
SystemKeepFree=1G
MaxRetentionSec=7day
```

## Support Resources

- **Main README**: `arm64-os/README.md`
- **Architecture**: `arm64-os/ARCHITECTURE.md`
- **Quick Start**: `arm64-os/QUICKSTART.md`
- **Build Guide**: `arm64-os/BUILD_WINDOWS.md`
- **Flash Guide**: `arm64-os/FLASH_IMAGE.md`
- **GitHub Issues**: https://github.com/ALaustrup/DEMIURGE/issues

## Version History

- **v1.0.0** (2026-01-09): Initial release
  - Complete Demiurge ecosystem
  - Auto-starting services
  - Genesis theme integration
  - Raspberry Pi 5 optimized
