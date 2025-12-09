# SSH Key Setup for Server Deployment

Complete guide for generating and setting up SSH keys for Ubuntu 24.04 LTS server access.

## Quick Setup (Windows PowerShell)

### Step 1: Generate SSH Key

```powershell
# Generate ED25519 SSH key (recommended - more secure and faster)
ssh-keygen -t ed25519 -C "Node0@$(hostname)" -f "$env:USERPROFILE\.ssh\Node0"

# Or if you prefer RSA (if ED25519 is not supported):
# ssh-keygen -t rsa -b 4096 -C "Node0@$(hostname)" -f "$env:USERPROFILE\.ssh\Node0"
```

**Note:** When prompted:
- **Passphrase**: Enter a strong passphrase (recommended) or press Enter for no passphrase
- The key will be saved to: `C:\Users\YourUsername\.ssh\Node0`

### Step 2: Display Public Key

```powershell
# Display the public key to copy
Get-Content "$env:USERPROFILE\.ssh\Node0.pub"
```

### Step 3: Add to SSH Agent (Optional but Recommended)

```powershell
# Start SSH agent
Start-Service ssh-agent

# Add key to agent
ssh-add "$env:USERPROFILE\.ssh\Node0"
```

### Step 4: Copy Public Key to Server

**Option A: Using ssh-copy-id (if available on Windows)**

```powershell
# Install OpenSSH client if not already installed
# Then use:
ssh-copy-id -i "$env:USERPROFILE\.ssh\Node0.pub" ubuntu@YOUR_SERVER_IP
```

**Option B: Manual Copy (Recommended for Windows)**

```powershell
# 1. Display public key
Get-Content "$env:USERPROFILE\.ssh\Node0.pub"

# 2. Copy the output, then SSH to server and run:
# ssh ubuntu@YOUR_SERVER_IP

# 3. On the server, run:
# mkdir -p ~/.ssh
# chmod 700 ~/.ssh
# echo "PASTE_YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
# chmod 600 ~/.ssh/authorized_keys
```

## Linux/Ubuntu Commands

### Step 1: Generate SSH Key

```bash
# Generate ED25519 SSH key
ssh-keygen -t ed25519 -C "Node0@$(hostname)" -f ~/.ssh/Node0

# Or RSA if needed:
# ssh-keygen -t rsa -b 4096 -C "Node0@$(hostname)" -f ~/.ssh/Node0
```

### Step 2: Display Public Key

```bash
# Display the public key
cat ~/.ssh/Node0.pub
```

### Step 3: Add to SSH Agent

```bash
# Start SSH agent
eval "$(ssh-agent -s)"

# Add key to agent
ssh-add ~/.ssh/Node0
```

### Step 4: Copy Public Key to Server

```bash
# Using ssh-copy-id (easiest method)
ssh-copy-id -i ~/.ssh/Node0.pub ubuntu@YOUR_SERVER_IP

# Or manually:
# 1. Display public key
cat ~/.ssh/Node0.pub

# 2. SSH to server
ssh ubuntu@YOUR_SERVER_IP

# 3. On server, add key:
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "PASTE_YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## Complete Windows PowerShell Script

```powershell
# Complete SSH Key Setup Script for Windows
$KEY_NAME = "Node0"
$KEY_PATH = "$env:USERPROFILE\.ssh\$KEY_NAME"
$PUBLIC_KEY_PATH = "$KEY_PATH.pub"

Write-Host "=== SSH Key Setup for Demiurge Server ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Generate key
Write-Host "[1/4] Generating SSH key..." -ForegroundColor Yellow
if (Test-Path $KEY_PATH) {
    $overwrite = Read-Host "Key already exists. Overwrite? (y/N)"
    if ($overwrite -ne "y") {
        Write-Host "Aborted." -ForegroundColor Red
        exit 1
    }
    Remove-Item $KEY_PATH -Force -ErrorAction SilentlyContinue
    Remove-Item $PUBLIC_KEY_PATH -Force -ErrorAction SilentlyContinue
}

ssh-keygen -t ed25519 -C "Node0@$(hostname)" -f $KEY_PATH -N '""'

if (Test-Path $KEY_PATH) {
    Write-Host "✅ SSH key generated successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to generate SSH key" -ForegroundColor Red
    exit 1
}

# Step 2: Display public key
Write-Host ""
Write-Host "[2/4] Your public key:" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Gray
Get-Content $PUBLIC_KEY_PATH
Write-Host "==========================================" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Copy the above public key!" -ForegroundColor Yellow
Write-Host ""

# Step 3: Add to SSH agent
Write-Host "[3/4] Adding key to SSH agent..." -ForegroundColor Yellow
Start-Service ssh-agent -ErrorAction SilentlyContinue
ssh-add $KEY_PATH
Write-Host "✅ Key added to SSH agent" -ForegroundColor Green

# Step 4: Instructions
Write-Host ""
Write-Host "[4/4] Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Copy the public key shown above" -ForegroundColor White
Write-Host "2. SSH to your server:" -ForegroundColor White
Write-Host "   ssh ubuntu@YOUR_SERVER_IP" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. On the server, run:" -ForegroundColor White
Write-Host "   mkdir -p ~/.ssh" -ForegroundColor Cyan
Write-Host "   chmod 700 ~/.ssh" -ForegroundColor Cyan
Write-Host "   echo 'PASTE_YOUR_PUBLIC_KEY_HERE' >> ~/.ssh/authorized_keys" -ForegroundColor Cyan
Write-Host "   chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Test connection:" -ForegroundColor White
Write-Host "   ssh -i $KEY_PATH ubuntu@YOUR_SERVER_IP" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
```

## Server-Side Setup (On Ubuntu Server)

Once you have your public key, add it to the server:

```bash
# On your Ubuntu 24.04 server, run:

# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key
echo "YOUR_PUBLIC_KEY_CONTENT_HERE" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys

# Verify
cat ~/.ssh/authorized_keys
```

## Testing the Connection

```powershell
# Windows PowerShell
ssh -i "$env:USERPROFILE\.ssh\Node0" ubuntu@YOUR_SERVER_IP

# Or if added to SSH agent:
ssh ubuntu@YOUR_SERVER_IP
```

```bash
# Linux/Ubuntu
ssh -i ~/.ssh/Node0 ubuntu@YOUR_SERVER_IP

# Or if added to SSH agent:
ssh ubuntu@YOUR_SERVER_IP
```

## Using the Key for Deployment

Once your key is set up, you can use it in deployment scripts:

```bash
# In deployment scripts, specify the key:
ssh -i ~/.ssh/Node0 ubuntu@YOUR_SERVER_IP "command"

# Or set it in SSH config
```

## SSH Config (Optional but Recommended)

Create `~/.ssh/config` (Linux) or `$env:USERPROFILE\.ssh\config` (Windows):

```
Host demiurge-server
    HostName YOUR_SERVER_IP
    User ubuntu
    IdentityFile ~/.ssh/Node0
    IdentitiesOnly yes
```

Then connect with:
```bash
ssh demiurge-server
```

## Security Best Practices

1. **Use ED25519 keys** (more secure than RSA)
2. **Use a passphrase** for your private key
3. **Never share your private key** (only share the public key)
4. **Set correct permissions**:
   - Private key: `chmod 600 ~/.ssh/Node0`
   - Public key: `chmod 644 ~/.ssh/Node0.pub`
   - `.ssh` directory: `chmod 700 ~/.ssh`
5. **Disable password authentication** on server (after key is working)

## Troubleshooting

### "Permission denied (publickey)"

- Verify public key is in `~/.ssh/authorized_keys` on server
- Check permissions: `chmod 600 ~/.ssh/authorized_keys`
- Verify key format (should be one line)

### "Could not open a connection to your authentication agent"

```powershell
# Windows: Start SSH agent
Start-Service ssh-agent
ssh-add "$env:USERPROFILE\.ssh\Node0"
```

```bash
# Linux: Start SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/Node0
```

### Key not found

- Verify key path: `ls ~/.ssh/Node0*`
- Use full path: `ssh -i /full/path/to/key ubuntu@SERVER_IP`
