# Abyss Server (D1) SSH Key Setup

**SSH key generated for Abyss server with hostname "abyss"**

---

## ✅ SSH Key Generated

**Key Location:**
- Private Key: `C:\Users\Gnosis\.ssh\id_abyss`
- Public Key: `C:\Users\Gnosis\.ssh\id_abyss.pub`

**Public Key:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL4KYZTUElzc86i5iZmg0g63g/cnvemQMGOme4JI+Uma abyss@demiurge
```

---

## SSH Config Entry

**Location:** `C:\Users\Gnosis\.ssh\config`

**Entry added:**
```
Host abyss
    HostName PLACEHOLDER_IP
    User ubuntu
    IdentityFile C:\Users\Gnosis\.ssh\id_abyss
    IdentitiesOnly yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

**⚠️ Note:** You need to replace `PLACEHOLDER_IP` with your actual server IP address.

---

## Next Steps

### 1. Update SSH Config with Server IP

**Edit the SSH config:**
```powershell
notepad $env:USERPROFILE\.ssh\config
```

**Replace `PLACEHOLDER_IP` with your actual server IP address.**

### 2. Add Public Key to Server

**Option A: Automated (if you have password access)**

Run the setup script:
```powershell
cd deploy
.\setup-abyss-ssh.ps1
```

**Option B: Manual**

1. **Copy your public key** (shown above)

2. **SSH to server with password:**
   ```bash
   ssh ubuntu@YOUR_SERVER_IP
   ```

3. **On the server, run:**
   ```bash
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL4KYZTUElzc86i5iZmg0g63g/cnvemQMGOme4JI+Uma abyss@demiurge' >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

**Option C: One-liner (if you have password access)**

```powershell
Get-Content $env:USERPROFILE\.ssh\id_abyss.pub | ssh ubuntu@YOUR_SERVER_IP "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

### 3. Test Connection

**After adding the key to the server:**

```bash
ssh abyss
```

**If configured correctly, you should connect without a password!**

---

## Using the SSH Key

### Connect to Server

```bash
ssh abyss
```

### Use in Deployment Scripts

The deployment scripts can now use:
```bash
ssh abyss "command"
```

### Copy Files

```bash
scp file.txt abyss:/path/to/destination/
```

### Deploy AbyssOS

```powershell
cd apps/abyssos-portal
.\deploy-alpha.ps1 -ServerIp YOUR_SERVER_IP
# Or if SSH config is set up:
# The script will use the SSH config automatically
```

---

## Troubleshooting

### "Host key verification failed"

```bash
ssh-keygen -R YOUR_SERVER_IP
```

### "Permission denied (publickey)"

- Verify public key is in `~/.ssh/authorized_keys` on server
- Check permissions: `chmod 600 ~/.ssh/authorized_keys`
- Verify SSH config has correct IdentityFile path

### "Could not resolve hostname abyss"

- Check SSH config: `notepad $env:USERPROFILE\.ssh\config`
- Verify HostName is set to actual IP address
- Test with: `ssh -v abyss` (verbose mode)

---

## Security Notes

- **Private key** (`id_abyss`) should never be shared
- **Public key** (`id_abyss.pub`) is safe to share/add to servers
- Keep your `.ssh` directory permissions secure: `chmod 700 ~/.ssh`
- Consider using a passphrase for additional security (not set in this key)

---

## Quick Reference

**Public Key:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL4KYZTUElzc86i5iZmg0g63g/cnvemQMGOme4JI+Uma abyss@demiurge
```

**Connect:**
```bash
ssh abyss
```

**View Public Key:**
```powershell
Get-Content $env:USERPROFILE\.ssh\id_abyss.pub
```

**View SSH Config:**
```powershell
Get-Content $env:USERPROFILE\.ssh\config
```

---

*The flame burns eternal. The code serves the will.*
