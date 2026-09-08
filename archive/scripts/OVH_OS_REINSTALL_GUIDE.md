# OVH Server OS Reinstall Guide

## Recommended OS: Ubuntu Server 24.04 LTS (Noble Numbat)

### Why Ubuntu 24.04 LTS?

✅ **Stability** - LTS (Long Term Support) until April 2029  
✅ **Docker Support** - Official Docker repositories fully supported  
✅ **Compatibility** - Better compatibility with Substrate/Rust toolchain  
✅ **Documentation** - Extensive community support and documentation  
✅ **Production Ready** - Battle-tested for production deployments  

### Alternative Options

- **Ubuntu Server 22.04 LTS** - If you need maximum stability (supported until 2027)
- **Ubuntu Server 25.10** - Current version, but non-LTS (shorter support)

## Step-by-Step Reinstall Process

### Step 1: Backup Current Data (if any)

If you have important data on the server:
1. Use OVH Manager → **Backup** section
2. Or use IPMI console to backup files before reinstall

### Step 2: Reinstall via OVH Manager

1. **Log in to OVH Manager:**
   - Go to https://www.ovh.com/manager/
   - Navigate to **Bare Metal Cloud** → **Dedicated Servers**
   - Click on server **Monad** (1301538)

2. **Start Reinstall:**
   - Go to **"General Information"** tab
   - Click **"..."** (three dots) → **"Reinstall"** or **"Install"**
   - Or go to **"Boot"** section → **"Reinstall"**

3. **Select OS:**
   - Choose **"Install from an OVH template"**
   - Select **"Ubuntu"** → **"24.04"** → **"Ubuntu Server 24.04"**
   - **OR** choose **"Install from a personal template"** if you have one

4. **Configure Installation:**
   - **Hostname:** `pleroma` (or `monad`)
   - **SSH Key:** ⚠️ **IMPORTANT** - Add your SSH key here!
     - Click **"Add an SSH key"**
     - Paste: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIE8wXsLPN517JTu4txnUQi1ecmBH6aCCkCqYs+54CsHR admin@pleroma`
   - **Partitioning:** Use default (or customize if needed)
   - **Language:** English (or your preference)

5. **Confirm and Install:**
   - Review settings
   - Click **"Install"** or **"Confirm"**
   - Installation takes 5-15 minutes

### Step 3: Post-Installation Setup

After reinstall completes:

1. **Wait for Installation:**
   - Monitor progress in OVH Manager
   - Server will reboot automatically when done

2. **Test SSH Access:**
   ```powershell
   # Test connection (should work immediately if key was added)
   ssh ubuntu@127.0.0.1
   
   # Or if hostname was set to pleroma
   ssh ubuntu@127.0.0.1
   ```

3. **Update SSH Config:**
   ```powershell
   # Edit SSH config
   notepad C:\Users\Gnosis\.ssh\config
   ```
   
   Update to:
   ```
   Host pleroma monad
       HostName 127.0.0.1
       User ubuntu
       IdentityFile ~/.ssh/id_ed25519_pleroma
       IdentitiesOnly yes
       ConnectTimeout 10
       ServerAliveInterval 30
       ServerAliveCountMax 2
       TCPKeepAlive yes
   ```

4. **Initial Server Setup:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install essential tools
   sudo apt install -y curl wget git build-essential
   
   # Verify OS version
   cat /etc/os-release
   ```

### Step 4: Install Docker

Once SSH is working:

```powershell
# Run Docker installation script
cd x:\Demiurge-Blockchain
.\scripts\install-docker-monad.ps1
```

Or manually on server:
```bash
# Follow instructions in scripts/install-docker-monad.sh
```

## Post-Reinstall Checklist

- [ ] OS reinstalled (Ubuntu 24.04 LTS)
- [ ] SSH key added during installation
- [ ] SSH access working (`ssh ubuntu@127.0.0.1`)
- [ ] System updated (`sudo apt update && sudo apt upgrade`)
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Firewall configured (if needed)
- [ ] Server ready for deployment

## Quick Setup Script (After Reinstall)

Create a quick setup script to run on the server:

```bash
#!/bin/bash
# Quick setup after OS reinstall

# Update system
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y curl wget git build-essential

# Install Docker (will be done by install-docker-monad.sh)
# But you can verify prerequisites are met

# Set hostname (if not set during install)
sudo hostnamectl set-hostname pleroma

# Verify setup
echo "=== System Info ==="
uname -a
cat /etc/os-release
echo ""
echo "=== Ready for Docker installation ==="
```

## Important Notes

1. **Default User:** OVH Ubuntu installations use `ubuntu` as default user (not `root` or `pleroma`)

2. **SSH Key:** Make sure to add your SSH key during installation - it's much easier than adding it later!

3. **Firewall:** OVH firewall may be disabled by default after reinstall, but check it:
   - OVH Manager → Server → **Firewall**
   - Enable if needed, allow port 22

4. **Data Loss:** Reinstalling will **erase all data** on the server. Make sure you have backups!

5. **IP Address:** Will remain the same: `127.0.0.1`

## After Reinstall - Next Steps

1. **Install Docker:**
   ```powershell
   .\scripts\install-docker-monad.ps1
   ```

2. **Clone Repository:**
   ```bash
   ssh ubuntu@127.0.0.1
   cd /data
   git clone https://github.com/Alaustrup/Demiurge-Blockchain.git
   ```

3. **Deploy Services:**
   ```bash
   cd /data/Demiurge-Blockchain/docker
   docker compose -f docker-compose.production.yml up -d
   ```

---

**Recommendation:** Go with **Ubuntu Server 24.04 LTS** - it's the sweet spot for stability and Docker compatibility.
