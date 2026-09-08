# Server SSH Key Setup Guide

## Quick Setup

### 1. Get Your Public Key

Run this script to display your public key:
```powershell
.\scripts\show-ssh-public-key.ps1
```

This will:
- Display your public SSH key
- Copy it to your clipboard automatically
- Show instructions for adding it to the server

### 2. Add Key to Server

Once you have the public key, add it to the server using one of these methods:

#### Method A: Direct File Edit (if you have console access)

```bash
# On the server, create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

#### Method B: Using Server Panel/Console

If your VPS provider has a web console or key management interface:

1. Navigate to SSH Keys section
2. Click "Add SSH Key" or "Import Key"
3. Paste your public key (from the script output)
4. Save

#### Method C: One-Line Command (if you have temporary access)

```bash
# Replace YOUR_PUBLIC_KEY with the key from show-ssh-public-key.ps1
echo "YOUR_PUBLIC_KEY" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys
```

### 3. Verify Setup

After adding the key, test the connection:

```powershell
# Test SSH connection (will timeout after 10 seconds if it fails)
ssh pleroma

# Or test with verbose output
ssh -v pleroma
```

## Troubleshooting

### Key Format

Your public key should look like:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... ubuntu@127.0.0.1
```

### Common Issues

1. **Wrong permissions on server:**
   ```bash
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

2. **SSH service not running:**
   ```bash
   sudo systemctl status ssh
   sudo systemctl start ssh
   sudo systemctl enable ssh
   ```

3. **Firewall blocking port 22:**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw reload
   ```

4. **SELinux issues (if enabled):**
   ```bash
   sudo restorecon -R ~/.ssh
   ```

## After Key is Added

Once SSH works, you can:

1. **Install Docker:**
   ```powershell
   .\scripts\install-docker-monad.ps1
   ```

2. **Deploy services:**
   ```bash
   ssh pleroma
   cd /data/Demiurge-Blockchain/docker
   docker compose -f docker-compose.production.yml up -d
   ```

---

**Note:** The server user is `ubuntu` (default for OVH Ubuntu installations). If your server uses a different user, update the SSH config:
```
Host pleroma
    User your-actual-username
```
