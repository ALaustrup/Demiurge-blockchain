# Setup SSH Access to Demiurge Server D1
# This script helps configure SSH key access to the server

$SSH_KEY_PATH = "$env:USERPROFILE\.ssh\id_abyss"
$SSH_PUB_KEY_PATH = "$env:USERPROFILE\.ssh\id_abyss.pub"
$SERVER_IP = "51.210.209.112"
$SERVER_USER = "ubuntu"
$SSH_CONFIG = "$env:USERPROFILE\.ssh\config"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  SSH Access Setup for Demiurge Server D1" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify SSH key exists
Write-Host "[1/4] Checking SSH key..." -ForegroundColor Yellow
if (-not (Test-Path $SSH_KEY_PATH)) {
    Write-Host "   SSH key not found. Generating new key..." -ForegroundColor Yellow
    ssh-keygen -t ed25519 -f $SSH_KEY_PATH -C "abyss@demiurge" -N '""'
    Write-Host "   SSH key generated" -ForegroundColor Green
} else {
    Write-Host "   SSH key found" -ForegroundColor Green
}

if (-not (Test-Path $SSH_PUB_KEY_PATH)) {
    Write-Host "   ERROR: Public key not found!" -ForegroundColor Red
    exit 1
}

# Step 2: Display public key
Write-Host ""
Write-Host "[2/4] Your SSH Public Key:" -ForegroundColor Yellow
$publicKey = Get-Content $SSH_PUB_KEY_PATH
Write-Host "   $publicKey" -ForegroundColor White

# Step 3: Update SSH config
Write-Host ""
Write-Host "[3/4] Updating SSH config..." -ForegroundColor Yellow
$configEntry = @"

# Demiurge Server D1
Host abyss
    HostName $SERVER_IP
    User $SERVER_USER
    IdentityFile $SSH_KEY_PATH
    IdentitiesOnly yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
"@

if (Test-Path $SSH_CONFIG) {
    $configContent = Get-Content $SSH_CONFIG -Raw
    if ($configContent -match 'Host abyss') {
        Write-Host "   'abyss' host already exists in config" -ForegroundColor Yellow
        Write-Host "   Skipping config update..." -ForegroundColor Gray
    } else {
        Add-Content -Path $SSH_CONFIG -Value $configEntry
        Write-Host "   SSH config updated" -ForegroundColor Green
    }
} else {
    New-Item -Path $SSH_CONFIG -ItemType File -Force | Out-Null
    Set-Content -Path $SSH_CONFIG -Value $configEntry
    Write-Host "   SSH config created" -ForegroundColor Green
}

# Step 4: Test connection
Write-Host ""
Write-Host "[4/4] Testing SSH connection..." -ForegroundColor Yellow
Write-Host "   Attempting to connect..." -ForegroundColor Gray

$connectionTest = ssh -i $SSH_KEY_PATH -o ConnectTimeout=5 -o BatchMode=yes -o StrictHostKeyChecking=accept-new "$SERVER_USER@$SERVER_IP" "echo 'Connection successful'" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   SSH connection successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "SSH access is configured and working!" -ForegroundColor Green
    Write-Host "   You can now use: ssh abyss" -ForegroundColor Cyan
} else {
    Write-Host "   Connection failed: Permission denied (publickey)" -ForegroundColor Red
    Write-Host ""
    Write-Host "The public key needs to be added to the server!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Access server via IPMI console:" -ForegroundColor White
    Write-Host "   ssh ipmi@1.sol-ssh.ipmi.ovh.net" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. From IPMI, connect to your server:" -ForegroundColor White
    Write-Host "   ssh $SERVER_USER@$SERVER_IP" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. On the server, add your public key:" -ForegroundColor White
    Write-Host "   mkdir -p ~/.ssh" -ForegroundColor Gray
    Write-Host "   chmod 700 ~/.ssh" -ForegroundColor Gray
    Write-Host "   echo '$publicKey' >> ~/.ssh/authorized_keys" -ForegroundColor Gray
    Write-Host "   chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Verify the key was added:" -ForegroundColor White
    Write-Host "   cat ~/.ssh/authorized_keys" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5. Then test from your local machine:" -ForegroundColor White
    Write-Host "   ssh abyss" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
