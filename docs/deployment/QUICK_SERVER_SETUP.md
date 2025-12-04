# Quick Server Setup Guide

## Current Status
SSH key authentication is not working yet. The key needs to be added to the server.

## Solution Options

### Option 1: Add SSH Key via OVHcloud Control Panel ⭐ (Easiest)

1. **Log into OVHcloud:**
   - https://www.ovh.com/manager/
   - Navigate to your VPS/server

2. **Add SSH Key:**
   - Find "SSH Keys" or "Access" section
   - Add this key:
   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEd4AeR+rbtdgpdgYWoQaIJVzd7yO/GY05SLMfrk5FRR demiurge-server-git
   ```

3. **Test:**
   ```bash
   ssh ubuntu@51.210.209.112
   ```

---

### Option 2: Use OVHcloud Web Console (No SSH Needed)

1. **Access Web Console:**
   - In OVHcloud Control Panel → Your Server → "Console" or "VNC"
   - This gives you direct terminal access

2. **Run Setup Commands:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install required tools
   sudo apt install -y git curl build-essential
   
   # Clone repository (using HTTPS - no SSH needed)
   cd /opt
   sudo git clone https://github.com/ALaustrup/DEMIURGE.git
   cd DEMIURGE
   sudo git checkout feature/fracture-v1-portal
   
   # Set ownership
   sudo chown -R ubuntu:ubuntu /opt/DEMIURGE
   
   # Verify
   cd /opt/DEMIURGE
   git branch --show-current
   ls -la
   ```

---

### Option 3: Manual SSH Key Setup (If Password Auth Works)

If your server temporarily allows password authentication:

```bash
# Connect with password
ssh ubuntu@51.210.209.112
# Enter password when prompted

# Once connected, add your SSH key:
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEd4AeR+rbtdgpdgYWoQaIJVzd7yO/GY05SLMfrk5FRR demiurge-server-git" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit

# Now SSH should work without password
ssh ubuntu@51.210.209.112
```

---

## Once Connected: Full Setup Script

After you can SSH in (or via web console), run:

```bash
#!/bin/bash
# Complete server setup for DEMIURGE

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y \
    git \
    curl \
    build-essential \
    nginx \
    nodejs \
    npm \
    pm2

# Clone repository
cd /opt
sudo git clone https://github.com/ALaustrup/DEMIURGE.git
cd DEMIURGE
sudo git checkout feature/fracture-v1-portal
sudo chown -R ubuntu:ubuntu /opt/DEMIURGE

# Install Node.js (if not latest)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Navigate to project
cd /opt/DEMIURGE

# Install dependencies
pnpm install

# Build project
pnpm run build

echo "✅ Setup complete!"
```

---

## Quick Commands Reference

**Check connection:**
```bash
ssh ubuntu@51.210.209.112
```

**Clone repo (HTTPS - no SSH needed):**
```bash
cd /opt
git clone https://github.com/ALaustrup/DEMIURGE.git
cd DEMIURGE
git checkout feature/fracture-v1-portal
```

**Check current branch:**
```bash
git branch --show-current
```

**View files:**
```bash
ls -la
```

---

## Next Steps After Setup

1. ✅ Clone repository
2. ✅ Checkout correct branch
3. ⏭️ Install dependencies (`pnpm install`)
4. ⏭️ Build project (`pnpm run build`)
5. ⏭️ Configure NGINX
6. ⏭️ Set up PM2
7. ⏭️ Deploy!

See `OVHCLOUD_DEPLOYMENT_GUIDE.md` for complete deployment instructions.

