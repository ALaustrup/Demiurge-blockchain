# Simple Deployment Script for Demiurge
# Deploys chain binary and restarts services

param(
    [string]$Server = "ubuntu@51.210.209.112",
    [string]$SshKey = "$env:USERPROFILE\.ssh\Node1",
    [string]$RemoteBase = "/opt/demiurge"
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== DEMIURGE DEPLOYMENT ===" -ForegroundColor Cyan
Write-Host "Server: $Server" -ForegroundColor White
Write-Host "SSH Key: $SshKey" -ForegroundColor White
Write-Host "Remote Base: $RemoteBase`n" -ForegroundColor White

# Verify SSH key exists
if (-not (Test-Path $SshKey)) {
    Write-Host "ERROR: SSH key not found: $SshKey" -ForegroundColor Red
    exit 1
}

# Step 1: Build chain (if needed)
Write-Host "[1/4] Building chain..." -ForegroundColor Yellow
Push-Location "chain"
try {
    cargo build --release
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Chain build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "OK: Chain build successful" -ForegroundColor Green
} finally {
    Pop-Location
}

# Step 2: Deploy chain binary
Write-Host "`n[2/4] Deploying chain binary..." -ForegroundColor Yellow
$chainBinary = $null
# Check workspace root target (for Cargo workspaces)
if (Test-Path "target\release\demiurge-chain.exe") {
    $chainBinary = "target\release\demiurge-chain.exe"
} elseif (Test-Path "target\release\demiurge-chain") {
    $chainBinary = "target\release\demiurge-chain"
} elseif (Test-Path "chain\target\release\demiurge-chain.exe") {
    $chainBinary = "chain\target\release\demiurge-chain.exe"
} elseif (Test-Path "chain\target\release\demiurge-chain") {
    $chainBinary = "chain\target\release\demiurge-chain"
}

if (-not $chainBinary -or -not (Test-Path $chainBinary)) {
    Write-Host "ERROR: Chain binary not found" -ForegroundColor Red
    Write-Host "   Checked: target\release\demiurge-chain.exe" -ForegroundColor Yellow
    Write-Host "   Checked: target\release\demiurge-chain" -ForegroundColor Yellow
    exit 1
}

Write-Host "Creating remote directories..." -ForegroundColor Gray
ssh -i $SshKey $Server "sudo mkdir -p ${RemoteBase}/bin && sudo chmod 755 ${RemoteBase}/bin" 2>&1 | Out-Null

Write-Host "Uploading binary to temp location..." -ForegroundColor Gray
$tempPath = "/tmp/demiurge-chain-$(Get-Date -Format 'yyyyMMddHHmmss')"
scp -i $SshKey $chainBinary "${Server}:${tempPath}"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Binary upload failed" -ForegroundColor Red
    exit 1
}

Write-Host "Installing binary..." -ForegroundColor Gray
$binPath = "${RemoteBase}/bin/demiurge-chain"
ssh -i $SshKey $Server "sudo mv ${tempPath} ${binPath} && sudo chmod +x ${binPath} && sudo chown root:root ${binPath}"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Binary installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Binary installed to ${binPath}" -ForegroundColor Green

# Step 3: Restart services
Write-Host "`n[3/4] Restarting services..." -ForegroundColor Yellow
$serviceName = "Node1"
$restartScript = "sudo systemctl restart ${serviceName} && sleep 2 && sudo systemctl status ${serviceName} --no-pager | head -20"
ssh -i $SshKey $Server $restartScript
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Service restart may have issues" -ForegroundColor Yellow
}

# Step 4: Verify deployment
Write-Host "`n[4/4] Verifying deployment..." -ForegroundColor Yellow
$status = ssh -i $SshKey $Server "sudo systemctl is-active ${serviceName}"
if ($status -match "active") {
    Write-Host "OK: Service is active" -ForegroundColor Green
} else {
    Write-Host "WARNING: Service status: $status" -ForegroundColor Yellow
    Write-Host "Checking service logs..." -ForegroundColor Gray
    ssh -i $SshKey $Server "sudo journalctl -u ${serviceName} -n 20 --no-pager"
}

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Cyan
Write-Host "Monitor logs: ssh -i $SshKey $Server 'sudo journalctl -u ${serviceName} -f'" -ForegroundColor White

