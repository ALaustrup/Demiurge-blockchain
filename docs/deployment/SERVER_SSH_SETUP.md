# Server SSH Setup - Node0

Complete guide for setting up SSH key access to Demiurge Node0 server.

## Server Information

- **Server IP**: 51.210.209.112
- **User**: ubuntu
- **SSH Key**: Node0
- **Key Location**: `~/.ssh/Node0` (Linux) or `$USERPROFILE\.ssh\Node0` (Windows)

## Quick Setup

### Step 1: Generate SSH Key (if not already done)

**Windows PowerShell:**
```powershell
ssh-keygen -t ed25519 -C "Node0@$(hostname)" -f "$env:USERPROFILE\.ssh\Node0"
```

**Linux/Ubuntu:**
```bash
ssh-keygen -t ed25519 -C "Node0@$(hostname)" -f ~/.ssh/Node0
```

### Step 2: Display Public Key

**Windows PowerShell:**
```powershell
Get-Content "$env:USERPROFILE\.ssh\Node0.pub"
```

**Linux/Ubuntu:**
```bash
cat ~/.ssh/Node0.pub
```

### Step 3: Add Public Key to Server

**Option A: Using ssh-copy-id (Linux/Mac)**
```bash
ssh-copy-id -i ~/.ssh/Node0.pub ubuntu@51.210.209.112
```

**Option B: Manual (Windows/All)**
```bash
# 1. Display your public key
cat ~/.ssh/Node0.pub  # or Get-Content on Windows

# 2. SSH to server (using password initially)
ssh ubuntu@51.210.209.112

# 3. On the server, add your key:
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

### Step 4: Test Connection

**Windows PowerShell:**
```powershell
ssh -i "$env:USERPROFILE\.ssh\Node0" ubuntu@51.210.209.112
```

**Linux/Ubuntu:**
```bash
ssh -i ~/.ssh/Node0 ubuntu@51.210.209.112
```

## Verify Setup

Run the verification script:

```bash
# Make executable
chmod +x deploy/verify-ssh-setup.sh

# Run verification
./deploy/verify-ssh-setup.sh
```

## SSH Config (Recommended)

Create or edit `~/.ssh/config` (Linux) or `$USERPROFILE\.ssh\config` (Windows):

```
Host demiurge-node0
    HostName 51.210.209.112
    User ubuntu
    IdentityFile ~/.ssh/Node0
    IdentitiesOnly yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

Then connect simply with:
```bash
ssh demiurge-node0
```

## Troubleshooting

### Connection Refused

```bash
# Check if server is reachable
ping 51.210.209.112

# Check if SSH port is open
telnet 51.210.209.112 22
# or
nc -zv 51.210.209.112 22
```

### Permission Denied (publickey)

1. **Verify key is on server:**
   ```bash
   ssh ubuntu@51.210.209.112 "cat ~/.ssh/authorized_keys"
   ```

2. **Check permissions on server:**
   ```bash
   ssh ubuntu@51.210.209.112 "ls -la ~/.ssh/"
   ```
   Should show:
   - `~/.ssh` directory: `drwx------` (700)
   - `~/.ssh/authorized_keys`: `-rw-------` (600)

3. **Fix permissions if needed:**
   ```bash
   ssh ubuntu@51.210.209.112
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

### Key Not Found

**Windows:**
```powershell
# Verify key exists
Test-Path "$env:USERPROFILE\.ssh\Node0"

# Use full path
ssh -i "$env:USERPROFILE\.ssh\Node0" ubuntu@51.210.209.112
```

**Linux:**
```bash
# Verify key exists
ls -la ~/.ssh/Node0*

# Use full path
ssh -i ~/.ssh/Node0 ubuntu@51.210.209.112
```

## Security Best Practices

1. **Use ED25519 keys** (already configured)
2. **Disable password authentication** on server (after key is working)
3. **Use SSH config** for easier access
4. **Keep private key secure** - never share it
5. **Use passphrase** for extra security (optional)

## Server Access Commands

### Basic Connection
```bash
ssh -i ~/.ssh/Node0 ubuntu@51.210.209.112
# or with SSH config:
ssh demiurge-node0
```

### Execute Remote Commands
```bash
ssh -i ~/.ssh/Node0 ubuntu@51.210.209.112 "command"
# or
ssh demiurge-node0 "command"
```

### Copy Files
```bash
# Copy file to server
scp -i ~/.ssh/Node0 file.txt ubuntu@51.210.209.112:/path/to/destination

# Copy file from server
scp -i ~/.ssh/Node0 ubuntu@51.210.209.112:/path/to/file.txt ./
```

### Port Forwarding
```bash
# Local port forward
ssh -i ~/.ssh/Node0 -L 8080:localhost:8545 ubuntu@51.210.209.112

# Remote port forward
ssh -i ~/.ssh/Node0 -R 8080:localhost:3000 ubuntu@51.210.209.112
```

## Next Steps

Once SSH access is verified:

1. **Clone repository:**
   ```bash
   ssh demiurge-node0
   cd /opt
   sudo git clone https://github.com/ALaustrup/DEMIURGE.git demiurge
   ```

2. **Run deployment:**
   ```bash
   cd /opt/demiurge
   bash deploy/ubuntu-24.04-master.sh
   ```

3. **Verify deployment:**
   ```bash
   bash deploy/verify-deployment.sh
   ```
