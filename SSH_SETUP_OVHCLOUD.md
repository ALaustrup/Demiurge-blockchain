# SSH Setup for OVHcloud Server

## Problem
You're getting: `Permission denied (publickey)` when trying to connect.

## Solution Options

### Option 1: Generate SSH Key and Add to Server (Recommended)

#### Step 1: Generate SSH Key (Windows)

**Using PowerShell:**
```powershell
# Generate new SSH key
ssh-keygen -t ed25519 -C "demiurge-ovhcloud"

# Press Enter to accept default location (C:\Users\Gnosis\.ssh\id_ed25519)
# Press Enter twice for no passphrase (or set one if you prefer)

# Display your public key
cat $env:USERPROFILE\.ssh\id_ed25519.pub
```

**Or using Git Bash (if installed):**
```bash
ssh-keygen -t ed25519 -C "demiurge-ovhcloud"
cat ~/.ssh/id_ed25519.pub
```

#### Step 2: Copy Your Public Key

Copy the entire output from the `cat` command. It should look like:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... demiurge-ovhcloud
```

#### Step 3: Add Key to OVHcloud Server

**Method A: Using OVHcloud Control Panel (Easiest)**
1. Log into your OVHcloud account
2. Go to your VPS/server management
3. Look for "SSH Keys" or "Access" section
4. Add your public key there

**Method B: Manual Setup (If you have password access)**
If your server allows password authentication temporarily:

```bash
# Connect with password (if enabled)
ssh ubuntu@51.210.209.112
# Enter password when prompted

# Once connected, add your public key:
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste your public key, save (Ctrl+X, Y, Enter)
chmod 600 ~/.ssh/authorized_keys
exit
```

**Method C: Using ssh-copy-id (if available)**
```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub ubuntu@51.210.209.112
```

#### Step 4: Test Connection

```bash
ssh ubuntu@51.210.209.112
# Should connect without password prompt
```

---

### Option 2: Use Password Authentication (Temporary)

If your server allows password authentication, you can use it temporarily:

```bash
ssh ubuntu@51.210.209.112
# Enter password when prompted
```

**Note:** Password authentication is less secure. Use SSH keys for production.

---

### Option 3: Use OVHcloud Web Console

1. Log into OVHcloud Control Panel
2. Access your VPS/server
3. Use the web-based console/terminal
4. Run commands directly there (no SSH needed)

---

### Option 4: Use HTTPS for Git (No SSH Needed)

If you just need to clone the repository, you can use HTTPS instead:

```bash
# On your server (via web console or if you get access)
cd /opt
git clone https://github.com/ALaustrup/DEMIURGE.git
cd DEMIURGE
git checkout feature/fracture-v1-portal
```

---

## Quick Windows PowerShell Commands

**Check if you have SSH key:**
```powershell
Test-Path "$env:USERPROFILE\.ssh\id_ed25519.pub"
```

**Generate new SSH key:**
```powershell
ssh-keygen -t ed25519 -C "demiurge-ovhcloud"
```

**Display your public key:**
```powershell
Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub"
```

**Copy to clipboard (Windows):**
```powershell
Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub" | Set-Clipboard
```

---

## Troubleshooting

### "ssh-keygen: command not found"
- Install OpenSSH: Windows Settings → Apps → Optional Features → OpenSSH Client
- Or use Git Bash (comes with Git for Windows)

### "Permission denied" persists
- Verify key was added correctly: `cat ~/.ssh/authorized_keys` on server
- Check file permissions: `chmod 600 ~/.ssh/authorized_keys`
- Try different key type: `ssh-keygen -t rsa -b 4096`

### Need to specify key explicitly
```bash
ssh -i ~/.ssh/id_ed25519 ubuntu@51.210.209.112
```

---

## Next Steps After SSH Setup

Once you can connect:

```bash
ssh ubuntu@51.210.209.112

# Clone repository
cd /opt
git clone git@github.com:ALaustrup/DEMIURGE.git
cd DEMIURGE
git checkout feature/fracture-v1-portal

# Or use HTTPS (no SSH key needed for GitHub)
git clone https://github.com/ALaustrup/DEMIURGE.git
```

---

**Need help?** Check OVHcloud documentation or contact their support for SSH key setup assistance.


