# DEMIURGE ARM64 OS - Frequently Asked Questions

## General

### What is DEMIURGE ARM64 OS?

A custom operating system for Raspberry Pi 5 that includes the complete Demiurge Blockchain ecosystem pre-installed and configured. Everything starts automatically on boot.

### What Raspberry Pi models are supported?

Currently **Raspberry Pi 5 only** (ARM64 architecture). Pi 4 and earlier use ARMv7 and are not supported.

### Do I need to build the image myself?

No! Pre-built images will be available in GitHub releases. Building yourself is optional for customization.

### How long does the build take?

- **First build**: 1-2 hours (downloads + compilation)
- **Subsequent builds**: 30-60 minutes (if dependencies cached)

### How much disk space do I need?

- **Build process**: ~10GB
- **Final image**: 2-4GB (compressed)
- **SD card**: 64GB recommended (32GB minimum)

## Installation

### Can I install on existing Raspberry Pi OS?

Yes! Use `build-on-pi.sh` to install all components on an existing Pi OS installation.

### Do I need to compile everything?

No. Pre-built images include everything. Only build if you want to customize.

### Can I use a USB SSD instead of microSD?

Yes! You can:
1. Flash image to SSD (same as SD card)
2. Or boot from SD, move chain data to SSD (see Performance section)

### What if the build fails?

- Check disk space: `df -h`
- Check logs: Look at build output
- Try building on Pi directly (slower but more reliable)
- Check GitHub Issues for known problems

## Usage

### How do I access the system?

- **Web**: `http://raspberrypi.local` or `http://<IP-ADDRESS>`
- **SSH**: `ssh demiurge@raspberrypi.local`
- **Desktop**: Connect HDMI and keyboard/mouse

### What's the default password?

- **Username**: `demiurge`
- **Password**: `demiurge` (CHANGE IMMEDIATELY after first login!)

### How do I start/stop services?

```bash
# Start
sudo systemctl start demiurge-chain

# Stop
sudo systemctl stop demiurge-chain

# Restart
sudo systemctl restart demiurge-chain

# Check status
sudo systemctl status demiurge-chain
```

### Can I run this headless (no display)?

Yes! All services run headless. SSH and web interfaces are available.

## Performance

### How fast is mining on Pi 5?

- **CPU mining**: ~80-100% CPU usage
- **Hash rate**: Depends on difficulty, typically slower than dedicated miners
- **Power consumption**: ~5-7W when mining

### Can I use GPU for mining?

No. The Forge PoW algorithm is CPU-based (Argon2id). GPU acceleration is not supported.

### Should I overclock?

Optional. Pi 5 can handle:
- **2.4GHz** CPU (with adequate cooling)
- **750MHz** GPU
- Use official power supply (5V 5A)

### Is SSD faster than microSD?

**Yes!** USB 3.0 SSD is 5-10x faster than microSD for chain data. Highly recommended for full nodes.

## Networking

### Can I use WiFi?

Yes! Configure during image flash (Raspberry Pi Imager) or after boot:

```bash
sudo raspi-config
# System Options → Wireless LAN
```

### What ports are open?

- **22**: SSH
- **80**: HTTP (Nginx)
- **443**: HTTPS (if configured)
- **8545**: Chain RPC
- **4000**: GraphQL
- All others: Blocked by firewall

### Can I access from the internet?

Yes, but **not recommended without proper security**:
1. Set up firewall rules
2. Use SSH keys (disable passwords)
3. Consider VPN
4. Use HTTPS (set up SSL certificate)

## Troubleshooting

### Services won't start

1. Check logs: `sudo journalctl -u demiurge-chain -n 50`
2. Check dependencies: `systemctl list-dependencies demiurge-chain`
3. Check ports: `sudo netstat -tulpn | grep :8545`
4. Restart: `sudo systemctl restart demiurge-chain`

### Chain not syncing

1. Check RPC: `curl -X POST http://localhost:8545/rpc -d '{"jsonrpc":"2.0","method":"chain_getHeight","params":[],"id":1}'`
2. Check logs: `sudo journalctl -u demiurge-chain -f`
3. Check network: `ping -c 4 8.8.8.8`
4. Reset chain (deletes data): `sudo rm -rf /var/lib/demiurge/chain/*`

### High CPU usage

- **Normal when mining**: 80-100% CPU is expected
- **Disable mining**: Edit `/etc/demiurge/chain.toml`, set `mining_enabled = false`
- **Check processes**: `htop` to see what's using CPU

### Out of disk space

```bash
# Check usage
df -h
du -sh /var/lib/demiurge/*

# Clean logs
sudo journalctl --vacuum-time=7d

# Clean packages
sudo apt-get clean
```

### Can't connect via SSH

1. **Wait longer**: First boot takes 2-3 minutes
2. **Check Ethernet**: Must be connected
3. **Find IP**: Check router DHCP list or use `arp -a`
4. **Try mDNS**: `raspberrypi.local` or `demiurge-pi.local`
5. **Check firewall**: Temporarily disable Windows firewall

## Security

### Is it safe to expose RPC port 8545?

**No!** RPC should only be accessible on local network. If exposing:
1. Use firewall rules
2. Consider authentication (future feature)
3. Use VPN or reverse proxy

### How do I secure SSH?

1. **Set up SSH keys**:
   ```bash
   ssh-copy-id demiurge@raspberrypi.local
   ```

2. **Disable password auth**:
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PasswordAuthentication no
   sudo systemctl restart ssh
   ```

### Are automatic updates enabled?

Yes! Security updates are enabled via `unattended-upgrades`. Check status:

```bash
sudo systemctl status unattended-upgrades
```

## Development

### Can I modify the image?

Yes! Edit `arm64-os/image/customize.sh` and rebuild.

### How do I add a new service?

1. Create service file in `arm64-os/systemd/`
2. Add to image build process
3. Enable in `customize.sh`

### Can I develop on the Pi?

Yes! All development tools are available:
- Rust (for chain)
- Node.js/pnpm (for web apps)
- Qt (for desktop apps)
- Git

## Maintenance

### How do I update?

```bash
# System packages
sudo apt-get update
sudo apt-get upgrade -y

# Demiurge components
cd /opt/demiurge
git pull origin main
# Rebuild and restart services
```

### How do I backup?

```bash
# Chain data
sudo tar -czf chain-backup.tar.gz /var/lib/demiurge/chain

# Wallets
sudo tar -czf wallets-backup.tar.gz /var/lib/demiurge/wallets

# Config
sudo tar -czf config-backup.tar.gz /etc/demiurge
```

### How do I restore from backup?

```bash
# Stop services
sudo systemctl stop demiurge-chain

# Restore
sudo tar -xzf chain-backup.tar.gz -C /

# Start services
sudo systemctl start demiurge-chain
```

## Support

### Where do I get help?

- **Documentation**: `arm64-os/DOCUMENTATION.md`
- **GitHub Issues**: https://github.com/ALaustrup/DEMIURGE/issues
- **Discord/Community**: (if available)

### How do I report bugs?

1. Check existing issues on GitHub
2. Create new issue with:
   - Description of problem
   - Steps to reproduce
   - Logs: `sudo journalctl -u service-name -n 100`
   - System info: `uname -a`, `cat /etc/os-release`

### Can I contribute?

Yes! Contributions welcome:
- Code improvements
- Documentation
- Bug fixes
- Feature requests

See GitHub for contribution guidelines.
