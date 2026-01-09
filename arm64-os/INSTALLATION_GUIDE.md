# DEMIURGE ARM64 OS - Installation Guide

Complete step-by-step installation guide for Raspberry Pi 5.

## Prerequisites Checklist

- [ ] Raspberry Pi 5 (4GB+ RAM recommended)
- [ ] 64GB+ microSD card (Class 10 or better)
- [ ] 5V 5A power supply (official recommended)
- [ ] Ethernet cable
- [ ] Computer with SD card reader
- [ ] Raspberry Pi Imager installed
- [ ] Internet connection

## Installation Methods

### Method 1: Pre-built Image (Easiest)

**When available**, download the pre-built image from GitHub releases.

1. **Download Image**
   - Go to: https://github.com/ALaustrup/DEMIURGE/releases
   - Download: `demiurge-arm64-YYYYMMDD.img.xz`
   - Extract: `demiurge-arm64-YYYYMMDD.img`

2. **Flash with Raspberry Pi Imager**
   - See `FLASH_IMAGE.md` for detailed steps
   - Use "Use custom image" option
   - Configure hostname, SSH, password

3. **Boot Raspberry Pi 5**
   - Insert SD card
   - Connect Ethernet
   - Power on
   - Wait 2-3 minutes

4. **Access**
   - Web: `http://raspberrypi.local`
   - SSH: `ssh demiurge@raspberrypi.local`

### Method 2: Build Your Own Image

#### On Windows (WSL2)

1. **Install WSL2** (if not already)
   ```powershell
   wsl --install
   ```

2. **Install Docker Desktop**
   - Download: https://www.docker.com/products/docker-desktop
   - Enable WSL2 integration

3. **Build Image**
   ```powershell
   cd C:\Repos\DEMIURGE\arm64-os
   .\scripts\build-image.ps1
   ```

4. **Flash Image**
   - Use Raspberry Pi Imager
   - Select the built image from `build/` directory

#### On Linux/WSL

1. **Install Prerequisites**
   ```bash
   sudo apt-get update
   sudo apt-get install -y docker.io qemu-user-static
   ```

2. **Build Image**
   ```bash
   cd arm64-os
   ./scripts/build-image.sh
   ```

3. **Flash Image**
   ```bash
   # Using dd (be careful!)
   sudo dd if=build/demiurge-arm64-*.img of=/dev/sdX bs=4M status=progress
   ```

### Method 3: Build on Raspberry Pi

If you already have Raspberry Pi OS installed:

1. **Clone Repository**
   ```bash
   git clone https://github.com/ALaustrup/DEMIURGE.git
   cd DEMIURGE/arm64-os
   ```

2. **Run Build Script**
   ```bash
   ./scripts/build-on-pi.sh
   ```

3. **Services Auto-Start**
   - All services will be installed and started
   - Access via web or SSH

## Post-Installation

### 1. First Login

```bash
ssh demiurge@raspberrypi.local
# Password: (the one you set, or 'demiurge')
```

### 2. Change Password

```bash
passwd
```

### 3. Verify Services

```bash
# Check all services
systemctl status demiurge-*

# Should show all services as "active (running)"
```

### 4. Access Web Interfaces

- **Portal**: http://raspberrypi.local
- **QLOUD OS**: http://raspberrypi.local/qloud
- **GraphQL**: http://raspberrypi.local/graphql

### 5. Configure Mining (Optional)

```bash
sudo nano /etc/demiurge/chain.toml

# Set:
mining_enabled = true
mining_threads = 4

sudo systemctl restart demiurge-chain
```

## Verification

### Check Chain Status

```bash
# Via RPC
curl -X POST http://localhost:8545/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"chain_getHeight","params":[],"id":1}'

# Should return current block height
```

### Check GraphQL

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ chain { height } }"}'
```

### Check Web Interfaces

Open browser:
- http://raspberrypi.local (should show Portal)
- http://raspberrypi.local/qloud (should show QLOUD OS)

## Common Issues

### Image Won't Boot

1. **Check SD card**: Try different card
2. **Check power**: Use official 5V 5A supply
3. **Check image**: Verify it's for Pi 5 (ARM64)
4. **Check connections**: HDMI, Ethernet

### Can't Connect via SSH

1. **Wait longer**: First boot takes 2-3 minutes
2. **Check Ethernet**: Must be connected
3. **Find IP**: Check router DHCP list
4. **Try mDNS**: `raspberrypi.local` or `demiurge-pi.local`

### Services Not Running

```bash
# Check logs
sudo journalctl -u demiurge-chain -n 50

# Restart service
sudo systemctl restart demiurge-chain

# Check dependencies
systemctl list-dependencies demiurge-chain
```

## Next Steps

1. **Secure the system** (see Security section in DOCUMENTATION.md)
2. **Configure mining** (if desired)
3. **Set up wallet** (via web interface)
4. **Create QOR ID** (via Portal)
5. **Start using Demiurge!**

## Support

- **Documentation**: `arm64-os/DOCUMENTATION.md`
- **Troubleshooting**: See DOCUMENTATION.md
- **Issues**: GitHub Issues
