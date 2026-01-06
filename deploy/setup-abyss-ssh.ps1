# Setup SSH Key for Abyss Server (D1)
# This script configures SSH access to the Abyss server

$SSH_CONFIG = "$env:USERPROFILE\.ssh\config"
$KEY_PATH = "$env:USERPROFILE\.ssh\id_abyss"
$PUBLIC_KEY_PATH = "$KEY_PATH.pub"

Write-Host "`n=== Abyss Server SSH Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if key exists
if (-not (Test-Path $KEY_PATH)) {
    Write-Host "❌ SSH key not found: $KEY_PATH" -ForegroundColor Red
    Write-Host "   Generating new key..." -ForegroundColor Yellow
    ssh-keygen -t ed25519 -f $KEY_PATH -C "abyss@demiurge" -N '""'
    Write-Host "✅ Key generated" -ForegroundColor Green
}

if (-not (Test-Path $PUBLIC_KEY_PATH)) {
    Write-Host "❌ Public key not found: $PUBLIC_KEY_PATH" -ForegroundColor Red
    exit 1
}

Write-Host "✅ SSH key found" -ForegroundColor Green
Write-Host ""

# Display public key
Write-Host "Your public key:" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Gray
$publicKey = Get-Content $PUBLIC_KEY_PATH
Write-Host $publicKey -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Gray
Write-Host ""

# Prompt for server details
Write-Host "Enter server details:" -ForegroundColor Cyan
$SERVER_IP = Read-Host "Server IP address"
$SERVER_USER = Read-Host "Server username (default: ubuntu)" 
if ([string]::IsNullOrWhiteSpace($SERVER_USER)) {
    $SERVER_USER = "ubuntu"
}

Write-Host ""
Write-Host "Server: ${SERVER_USER}@${SERVER_IP}" -ForegroundColor White
Write-Host ""

# Add to SSH config
Write-Host "Adding to SSH config..." -ForegroundColor Yellow

# Read existing config
$configContent = ""
if (Test-Path $SSH_CONFIG) {
    $configContent = Get-Content $SSH_CONFIG -Raw
}

# Check if abyss host already exists
if ($configContent -match "Host abyss") {
    Write-Host "⚠️  'abyss' host already exists in SSH config" -ForegroundColor Yellow
    $replace = Read-Host "Replace it? (y/N)"
    if ($replace -eq "y" -or $replace -eq "Y") {
        # Remove existing abyss entry
        $lines = Get-Content $SSH_CONFIG
        $newLines = @()
        $skip = $false
        foreach ($line in $lines) {
            if ($line -match "^Host abyss$") {
                $skip = $true
            } elseif ($skip -and ($line -match "^Host " -and $line -notmatch "^Host abyss")) {
                $skip = $false
                $newLines += $line
            } elseif (-not $skip) {
                $newLines += $line
            }
        }
        $configContent = $newLines -join "`n"
    } else {
        Write-Host "Keeping existing config. Exiting." -ForegroundColor Yellow
        exit 0
    }
}

# Add abyss host entry
$abyssConfig = @"

# Abyss Server (D1)
Host abyss
    HostName $SERVER_IP
    User $SERVER_USER
    IdentityFile $KEY_PATH
    IdentitiesOnly yes
    ServerAliveInterval 60
    ServerAliveCountMax 3

"@

# Append to config
if ([string]::IsNullOrWhiteSpace($configContent)) {
    $configContent = $abyssConfig
} else {
    $configContent = $configContent.TrimEnd() + "`n" + $abyssConfig
}

# Write config
Set-Content -Path $SSH_CONFIG -Value $configContent -NoNewline

Write-Host "✅ SSH config updated" -ForegroundColor Green
Write-Host ""

# Instructions for adding key to server
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Copy your public key (shown above)" -ForegroundColor White
Write-Host ""
Write-Host "2. Add it to the server using one of these methods:" -ForegroundColor White
Write-Host ""
Write-Host "   Option A: Manual (if you have password access)" -ForegroundColor Yellow
Write-Host "     ssh ${SERVER_USER}@${SERVER_IP}" -ForegroundColor Cyan
Write-Host "     mkdir -p ~/.ssh" -ForegroundColor Cyan
Write-Host "     chmod 700 ~/.ssh" -ForegroundColor Cyan
Write-Host "     echo 'PASTE_PUBLIC_KEY_HERE' >> ~/.ssh/authorized_keys" -ForegroundColor Cyan
Write-Host "     chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Option B: One-liner (if you have password access)" -ForegroundColor Yellow
Write-Host "     Get-Content `"$PUBLIC_KEY_PATH`" | ssh ${SERVER_USER}@${SERVER_IP} `"mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys`"" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Test connection:" -ForegroundColor White
Write-Host "     ssh abyss" -ForegroundColor Cyan
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$tryAdd = Read-Host "Do you want to try adding the key now? (y/N)"
if ($tryAdd -eq "y" -or $tryAdd -eq "Y") {
    Write-Host ""
    Write-Host "Attempting to add key to server..." -ForegroundColor Yellow
    Write-Host "You will be prompted for the server password" -ForegroundColor Yellow
    Write-Host ""
    
    Get-Content $PUBLIC_KEY_PATH | ssh "${SERVER_USER}@${SERVER_IP}" "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Key added successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Testing connection with 'ssh abyss'..." -ForegroundColor Yellow
        ssh abyss "echo 'Connection test successful!'"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ SSH key authentication working!" -ForegroundColor Green
            Write-Host "   You can now use: ssh abyss" -ForegroundColor Cyan
        }
    } else {
        Write-Host ""
        Write-Host "⚠️  Key addition may have failed. Try Option A (manual) instead." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host "   Use 'ssh abyss' to connect to the server" -ForegroundColor Cyan
Write-Host ""
