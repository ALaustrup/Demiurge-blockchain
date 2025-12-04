# Add SSH Key to OVHcloud Server

## Your SSH Public Key (Already Copied to Clipboard)

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEd4AeR+rbtdgpdgYWoQaIJVzd7yO/GY05SLMfrk5FRR demiurge-server-git
```

---

## Method 1: OVHcloud Control Panel (Recommended)

1. **Log into OVHcloud:**
   - Go to https://www.ovh.com/manager/
   - Log in with your credentials

2. **Navigate to your VPS:**
   - Click on "Bare Metal Cloud" → "VPS" (or "Public Cloud" → "Instances")
   - Select your server (IP: 51.210.209.112)

3. **Add SSH Key:**
   - Look for "SSH Keys" section or "Access" tab
   - Click "Add SSH Key" or "Import SSH Key"
   - Paste your public key (already in clipboard)
   - Save

4. **Test Connection:**
   ```bash
   ssh ubuntu@51.210.209.112
   ```

---

## Method 2: Manual Setup via OVHcloud Web Console

1. **Access Web Console:**
   - In OVHcloud Control Panel, find your server
   - Click "Console" or "VNC" to access web terminal
   - Log in with your credentials

2. **Add SSH Key:**
   ```bash
   # Create .ssh directory if it doesn't exist
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   
   # Add your public key
   nano ~/.ssh/authorized_keys
   # Paste your key (Ctrl+Shift+V or right-click → Paste)
   # Save: Ctrl+X, then Y, then Enter
   
   # Set correct permissions
   chmod 600 ~/.ssh/authorized_keys
   ```

3. **Test Connection:**
   ```bash
   # From your local machine
   ssh ubuntu@51.210.209.112
   ```

---

## Method 3: If Password Authentication is Enabled

If your server temporarily allows password login:

```bash
# Connect with password
ssh ubuntu@51.210.209.112
# Enter password when prompted

# Once connected, add your key:
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEd4AeR+rbtdgpdgYWoQaIJVzd7yO/GY05SLMfrk5FRR demiurge-server-git" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit

# Now try connecting again (should work without password)
ssh ubuntu@51.210.209.112
```

---

## Method 4: Use HTTPS for Git (No SSH Needed)

If you just need to clone the repo and don't want to set up SSH:

```bash
# Access server via web console or if you get password access
cd /opt
git clone https://github.com/ALaustrup/DEMIURGE.git
cd DEMIURGE
git checkout feature/fracture-v1-portal
```

---

## Quick Test After Setup

Once the key is added, test the connection:

```bash
ssh ubuntu@51.210.209.112
```

You should connect without being prompted for a password.

---

## Troubleshooting

### Still Getting "Permission denied"
- Verify key format: Should start with `ssh-ed25519` or `ssh-rsa`
- Check server logs: `sudo tail -f /var/log/auth.log` (on server)
- Try verbose mode: `ssh -v ubuntu@51.210.209.112` (shows detailed connection info)

### Key Format Issues
Make sure your key is on a single line with no line breaks:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEd4AeR+rbtdgpdgYWoQaIJVzd7yO/GY05SLMfrk5FRR demiurge-server-git
```

### Need to Specify Key Explicitly
```bash
ssh -i ~/.ssh/id_ed25519 ubuntu@51.210.209.112
```

---

**Your public key is already copied to your clipboard!** Just paste it into OVHcloud Control Panel or the server's `authorized_keys` file.


