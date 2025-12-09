# Add SSH Public Key to Server
# This script helps you add your Node0 public key to the server

$SERVER_IP = "51.210.209.112"
$SERVER_USER = "ubuntu"
$KEY_PATH = "$env:USERPROFILE\.ssh\Node0"
$PUBLIC_KEY_PATH = "$KEY_PATH.pub"

Write-Host "`n=== Add SSH Key to Server ===" -ForegroundColor Cyan
Write-Host "Server: ${SERVER_USER}@${SERVER_IP}" -ForegroundColor White
Write-Host ""

# Check if key exists
if (-not (Test-Path $KEY_PATH)) {
    Write-Host "❌ SSH key not found: $KEY_PATH" -ForegroundColor Red
    Write-Host "   Generate it first with:" -ForegroundColor Yellow
    Write-Host "   ssh-keygen -t ed25519 -C `"Node0@`$(hostname)`" -f `"$KEY_PATH`"" -ForegroundColor White
    exit 1
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

Write-Host "Choose method to add key to server:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Manual (Recommended if you have password access)" -ForegroundColor Yellow
Write-Host "  1. Copy the public key above" -ForegroundColor White
Write-Host "  2. SSH to server with password:" -ForegroundColor White
Write-Host "     ssh ${SERVER_USER}@${SERVER_IP}" -ForegroundColor Cyan
Write-Host "  3. On server, run:" -ForegroundColor White
Write-Host "     mkdir -p ~/.ssh" -ForegroundColor Cyan
Write-Host "     chmod 700 ~/.ssh" -ForegroundColor Cyan
Write-Host "     echo 'PASTE_YOUR_PUBLIC_KEY_HERE' >> ~/.ssh/authorized_keys" -ForegroundColor Cyan
Write-Host "     chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Cyan
Write-Host ""

Write-Host "Option 2: Using ssh-copy-id (if available)" -ForegroundColor Yellow
Write-Host "  ssh-copy-id -i `"$PUBLIC_KEY_PATH`" ${SERVER_USER}@${SERVER_IP}" -ForegroundColor Cyan
Write-Host ""

Write-Host "Option 3: One-liner (if you have password access)" -ForegroundColor Yellow
Write-Host "  Get-Content `"$PUBLIC_KEY_PATH`" | ssh ${SERVER_USER}@${SERVER_IP} `"mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys`"" -ForegroundColor Cyan
Write-Host ""

$choice = Read-Host "Do you want to try Option 3 (one-liner)? (y/N)"
if ($choice -eq "y" -or $choice -eq "Y") {
    Write-Host ""
    Write-Host "Attempting to add key..." -ForegroundColor Yellow
    Write-Host "You will be prompted for the server password" -ForegroundColor Yellow
    Write-Host ""
    
    Get-Content $PUBLIC_KEY_PATH | ssh "${SERVER_USER}@${SERVER_IP}" "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Key added successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Testing connection..." -ForegroundColor Yellow
        ssh -i $KEY_PATH -o ConnectTimeout=5 "${SERVER_USER}@${SERVER_IP}" "echo 'Connection test successful'"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ SSH key authentication working!" -ForegroundColor Green
        }
    } else {
        Write-Host ""
        Write-Host "⚠️  Key addition may have failed. Try Option 1 (manual) instead." -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "Please use Option 1 (manual) to add your key to the server." -ForegroundColor Yellow
}
