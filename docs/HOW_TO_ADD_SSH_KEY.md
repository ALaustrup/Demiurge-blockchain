# How to Add Your SSH Key to OVHcloud Server

## ⚠️ Important: This is NOT a Command!

The SSH key (`ssh-ed25519 AAAAC3...`) is **text to copy and paste**, NOT a command to run in PowerShell.

---

## Method 1: OVHcloud Control Panel (Recommended)

### Step 1: Get Your Key
Your SSH public key is:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEd4AeR+rbtdgpdgYWoQaIJVzd7yO/GY05SLMfrk5FRR demiurge-server-git
```

**It's already copied to your clipboard!**

### Step 2: Log into OVHcloud
1. Go to: https://www.ovh.com/manager/
2. Log in with your credentials

### Step 3: Navigate to Your Server
1. Click on **"Bare Metal Cloud"** → **"VPS"** (or **"Public Cloud"** → **"Instances"**)
2. Find your server with IP: **51.210.209.112**
3. Click on it

### Step 4: Add SSH Key
1. Look for a tab/section called:
   - **"SSH Keys"**
   - **"Access"**
   - **"Security"**
   - **"Keys"**
2. Click **"Add SSH Key"** or **"Import SSH Key"** or **"Create Key"**
3. **Paste your key** (Ctrl+V) - it's already in your clipboard
4. Give it a name like: `demiurge-laptop` or `windows-key`
5. Click **"Save"** or **"Add"**

### Step 5: Test Connection
After adding the key, try connecting:
```powershell
ssh ubuntu@51.210.209.112
```

You should connect without a password prompt!

---

## Method 2: Web Console (No SSH Setup Needed!)

If you can't find the SSH Keys section, use the web console instead:

### Step 1: Access Web Console
1. In OVHcloud Control Panel → Your Server
2. Look for **"Console"**, **"VNC"**, or **"Web Terminal"** button
3. Click it to open a browser-based terminal

### Step 2: Run Setup Commands
Once in the web console, you can run commands directly:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install git
sudo apt install -y git

# Clone repository (using HTTPS - no SSH needed!)
cd /opt
sudo git clone https://github.com/ALaustrup/DEMIURGE.git
cd DEMIURGE
sudo git checkout feature/fracture-v1-portal
sudo chown -R ubuntu:ubuntu /opt/DEMIURGE

# Verify
cd /opt/DEMIURGE
git branch --show-current
ls -la
```

**This method doesn't require SSH setup at all!**

---

## Method 3: Manual Key Setup (If You Have Password Access)

If your server temporarily allows password authentication:

### Step 1: Connect with Password
```powershell
ssh ubuntu@51.210.209.112
# Enter password when prompted
```

### Step 2: Add Your Key (Once Connected)
```bash
# Create .ssh directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEd4AeR+rbtdgpdgYWoQaIJVzd7yO/GY05SLMfrk5FRR demiurge-server-git" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys

# Exit
exit
```

### Step 3: Test
```powershell
ssh ubuntu@51.210.209.112
# Should work without password now!
```

---

## Quick Reference: Your SSH Key

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEd4AeR+rbtdgpdgYWoQaIJVzd7yO/GY05SLMfrk5FRR demiurge-server-git
```

**To copy it again in PowerShell:**
```powershell
Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub" | Set-Clipboard
```

---

## Troubleshooting

### "I can't find SSH Keys section in OVHcloud"
→ Use **Method 2: Web Console** instead (no SSH needed)

### "Still getting Permission denied"
→ Make sure you:
- Copied the ENTIRE key (starts with `ssh-ed25519` and ends with `demiurge-server-git`)
- No line breaks in the key
- Saved it in OVHcloud Control Panel

### "I just want to clone the repo"
→ Use **Method 2: Web Console** with HTTPS clone (no SSH setup needed)

---

## Next Steps After SSH Works

Once you can connect via SSH:

```bash
# Clone repository
cd /opt
git clone git@github.com:ALaustrup/DEMIURGE.git
cd DEMIURGE
git checkout feature/fracture-v1-portal

# Or use HTTPS (no SSH key needed for GitHub)
git clone https://github.com/ALaustrup/DEMIURGE.git
```

See `QUICK_SERVER_SETUP.md` for complete setup instructions.

