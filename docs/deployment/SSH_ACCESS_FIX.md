# SSH Access Fix - Server D1

## Problem
SSH access is blocked after hardening script applied `AllowUsers ubuntu` restriction.

**Error:**
```
ssh: connect to host 51.210.209.112 port 22: Connection timed out
ubuntu@51.210.209.112: Permission denied (publickey).
```

## Root Cause
The `production-hardening.sh` script added:
```
AllowUsers ubuntu
```
to `/etc/ssh/sshd_config`, restricting SSH to only the `ubuntu` user. Your SSH key may not be authorized for that user.

---

## Solution 1: Via Server Console/VNC (RECOMMENDED)

### Step 1: Access Server Console
- Use your hosting provider's console/VNC access
- Or physical access if on-premise

### Step 2: Check Current SSH Config
```bash
sudo cat /etc/ssh/sshd_config | grep -E "AllowUsers|PermitRootLogin|PasswordAuthentication|PubkeyAuthentication"
```

### Step 3: Fix SSH Configuration
```bash
# Backup current config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Edit SSH config
sudo nano /etc/ssh/sshd_config
```

**Find and comment out or remove:**
```
# AllowUsers ubuntu
```

**Or add your username:**
```
AllowUsers ubuntu your_username
```

**Ensure these settings are correct:**
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
```

### Step 4: Verify Your SSH Key is Authorized
```bash
# Check if your public key is in authorized_keys
cat /home/ubuntu/.ssh/authorized_keys

# If missing, add it manually (paste your public key)
nano /home/ubuntu/.ssh/authorized_keys
# Paste your public key from: C:\Users\Gnosis\.ssh\id_abyss.pub
```

### Step 5: Restart SSH Service
```bash
# Test config first
sudo sshd -t

# If test passes, restart SSH
sudo systemctl restart ssh

# Verify SSH is running
sudo systemctl status ssh
```

### Step 6: Test SSH Connection
From your local machine:
```powershell
ssh abyss 'echo "✅ SSH Access Restored" && hostname'
```

---

## Solution 2: Add Your Public Key to Authorized Keys

If you can access the server another way, add your public key:

### Get Your Public Key
```powershell
# On Windows
Get-Content C:\Users\Gnosis\.ssh\id_abyss.pub
```

### Add to Server (via console)
```bash
# Create .ssh directory if missing
mkdir -p /home/ubuntu/.ssh
chmod 700 /home/ubuntu/.ssh

# Add your public key
echo "YOUR_PUBLIC_KEY_HERE" >> /home/ubuntu/.ssh/authorized_keys
chmod 600 /home/ubuntu/.ssh/authorized_keys
chown -R ubuntu:ubuntu /home/ubuntu/.ssh
```

---

## Solution 3: Temporarily Allow Password Authentication

**⚠️ WARNING: Less secure, use only if necessary**

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Temporarily enable password auth
PasswordAuthentication yes

# Restart SSH
sudo systemctl restart ssh
```

Then connect with password and fix the `AllowUsers` issue.

---

## Solution 4: Remove AllowUsers Entirely

If you want to allow all users with authorized keys:

```bash
sudo nano /etc/ssh/sshd_config

# Comment out or remove:
# AllowUsers ubuntu

# Restart SSH
sudo systemctl restart ssh
```

---

## Verification Commands

After fixing, verify SSH access:

```powershell
# Test connection
ssh abyss 'echo "Connected" && whoami && hostname'

# Check SSH config
ssh abyss 'sudo cat /etc/ssh/sshd_config | grep AllowUsers'

# Verify services
ssh abyss 'sudo systemctl status demiurge-chain abyssid abyss-gateway nginx'
```

---

## Your Public Key (for reference)

Located at: `C:\Users\Gnosis\.ssh\id_abyss.pub`

To view it:
```powershell
Get-Content C:\Users\Gnosis\.ssh\id_abyss.pub
```

---

## Quick Fix Script (Run on Server Console)

```bash
#!/bin/bash
# Quick SSH fix - run on server console

# Backup config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d_%H%M%S)

# Comment out AllowUsers
sudo sed -i 's/^AllowUsers ubuntu/#AllowUsers ubuntu/' /etc/ssh/sshd_config

# Test config
sudo sshd -t

# Restart SSH
sudo systemctl restart ssh

# Verify
sudo systemctl status ssh
echo "✅ SSH config updated. Try connecting now."
```

---

## After SSH is Restored

Once SSH access is working, deploy AbyssOS:

```powershell
.\deploy\deploy-abyssos-only.ps1
```

---

## Prevention

To prevent this in the future, modify `deploy/production-hardening.sh`:

```bash
# Instead of:
AllowUsers ubuntu

# Use:
# AllowUsers ubuntu your_username
# Or comment it out entirely if you want to allow all users with keys
```
