# Test SSH Connection to Demiurge Node0 Server
# Server: 51.210.209.112

$SERVER_IP = "51.210.209.112"
$SERVER_USER = "ubuntu"
$KEY_PATH = "$env:USERPROFILE\.ssh\Node0"

Write-Host "`n=== Testing SSH Connection ===" -ForegroundColor Cyan
Write-Host "Server: ${SERVER_USER}@${SERVER_IP}" -ForegroundColor White
Write-Host "Key: $KEY_PATH" -ForegroundColor White
Write-Host ""

# Check if key exists
if (-not (Test-Path $KEY_PATH)) {
    Write-Host "❌ SSH key not found: $KEY_PATH" -ForegroundColor Red
    Write-Host "   Generate it with: ssh-keygen -t ed25519 -C `"Node0@`$(hostname)`" -f `"$KEY_PATH`"" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ SSH key found" -ForegroundColor Green
Write-Host ""

# Remove old host key if exists
Write-Host "[1/3] Removing old host key entry..." -ForegroundColor Yellow
ssh-keygen -R $SERVER_IP 2>&1 | Out-Null
Write-Host "✅ Old host key removed" -ForegroundColor Green
Write-Host ""

# Test connection
Write-Host "[2/3] Testing SSH connection..." -ForegroundColor Yellow
try {
    $sshCmd = "ssh -i `"$KEY_PATH`" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 -o BatchMode=yes ${SERVER_USER}@${SERVER_IP} `"echo CONNECTION_SUCCESS && hostname && uname -r && whoami`""
    $result = Invoke-Expression $sshCmd 2>&1
    
    if ($LASTEXITCODE -eq 0 -and $result -match "CONNECTION_SUCCESS") {
        Write-Host "✅ SSH Connection Successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Server Response:" -ForegroundColor Cyan
        $result | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
        Write-Host ""
        Write-Host "[3/3] Connection verified!" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now connect with:" -ForegroundColor Cyan
        Write-Host "  ssh -i `"$KEY_PATH`" ${SERVER_USER}@${SERVER_IP}" -ForegroundColor White
        exit 0
    } else {
        Write-Host "❌ SSH Connection Failed" -ForegroundColor Red
        Write-Host ""
        Write-Host "Output:" -ForegroundColor Yellow
        $result | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
        Write-Host ""
        Write-Host "Possible issues:" -ForegroundColor Yellow
        Write-Host "  • SSH key not added to server's authorized_keys" -ForegroundColor White
        Write-Host "  • Server is not reachable" -ForegroundColor White
        Write-Host "  • Firewall blocking connection" -ForegroundColor White
        exit 1
    }
} catch {
    Write-Host "❌ Error testing connection: $_" -ForegroundColor Red
    exit 1
}
