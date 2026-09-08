# SSH Setup Guide

## Quick Setup

Run the SSH setup script to automatically configure everything:

```powershell
.\scripts\setup-ssh-keys.ps1
```

This script will:
1. ✅ Find your SSH keys (checks multiple locations including `G:\Users\Gnosis\.ssh`)
2. ✅ Copy keys to standard location (`C:\Users\Gnosis\.ssh`)
3. ✅ Create/update SSH config file
4. ✅ Test SSH connection
5. ✅ Provide instructions if setup needed

## Manual Setup

If you prefer to set up manually:

### 1. Copy SSH Keys to Standard Location

```powershell
# Create .ssh directory if it doesn't exist
New-Item -ItemType Directory -Path "$env:USERPROFILE\.ssh" -Force

# Copy keys from G: drive (if they exist there)
Copy-Item "G:\Users\Gnosis\.ssh\id_*" "$env:USERPROFILE\.ssh\" -Force
```

### 2. Create SSH Config

Create/edit `C:\Users\Gnosis\.ssh\config`:

```
Host pleroma
    HostName 127.0.0.1
    User ubuntu
    IdentityFile ~/.ssh/id_ed25519_pleroma
    IdentitiesOnly yes

Host monad
    HostName 127.0.0.1
    User ubuntu
    IdentityFile ~/.ssh/id_ed25519_pleroma
    IdentitiesOnly yes
```

### 3. Copy Public Key to Server

```powershell
# Copy public key to clipboard
Get-Content "$env:USERPROFILE\.ssh\id_ed25519_pleroma.pub" | Set-Clipboard

# Then SSH to server and add to authorized_keys
ssh ubuntu@127.0.0.1
# On server: echo "<paste key>" >> ~/.ssh/authorized_keys
```

Or use one command:

```powershell
type "$env:USERPROFILE\.ssh\id_ed25519_pleroma.pub" | ssh ubuntu@127.0.0.1 "mkdir -p ~/.ssh; cat >> ~/.ssh/authorized_keys"
```

### 4. Test Connection

```powershell
ssh pleroma
# or
ssh monad
```

## Troubleshooting

### "Permission denied (publickey)"

**Solution:**
1. Ensure key is in standard location: `C:\Users\Gnosis\.ssh\`
2. Check SSH config: `cat C:\Users\Gnosis\.ssh\config`
3. Verify public key is on server: `ssh ubuntu@127.0.0.1 "cat ~/.ssh/authorized_keys"`
4. Run setup script: `.\scripts\setup-ssh-keys.ps1`

### "Host key verification failed"

**Solution:**
```powershell
ssh-keygen -R 127.0.0.1
ssh pleroma  # Will prompt to accept new key
```

### Keys in Wrong Location

If your keys are in `G:\Users\Gnosis\.ssh`:

1. **Option 1:** Run setup script (recommended)
   ```powershell
   .\scripts\setup-ssh-keys.ps1
   ```

2. **Option 2:** Copy manually
   ```powershell
   Copy-Item "G:\Users\Gnosis\.ssh\*" "$env:USERPROFILE\.ssh\" -Force
   ```

3. **Option 3:** Use SSH config to point to G: drive
   ```
   Host pleroma
       HostName 127.0.0.1
       User ubuntu
       IdentityFile G:/Users/Gnosis/.ssh/id_ed25519_pleroma
   ```

## Standard SSH Locations

Windows SSH reads from:
- `%USERPROFILE%\.ssh` (usually `C:\Users\Username\.ssh`)
- `~/.ssh` (same as above)

**Important:** Always use forward slashes (`/`) in SSH config paths, even on Windows.

## Verification

After setup, verify everything works:

```powershell
# Test SSH connection
ssh pleroma "echo 'SSH OK'"

# Check SSH config
cat "$env:USERPROFILE\.ssh\config"

# List SSH keys
Get-ChildItem "$env:USERPROFILE\.ssh\id_*"
```

---

**Last Updated:** January 2026
