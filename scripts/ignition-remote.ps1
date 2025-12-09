# Remote Ignition Sequence for Prime Archon Pulse
# 
# This script executes the ignition sequence on the remote server
# via SSH commands
#
# Usage:
#   .\scripts\ignition-remote.ps1

param(
    [string]$Server = "ubuntu@51.210.209.112",
    [string]$SshKey = "$env:USERPROFILE\.ssh\demiurge_new"
)

Write-Host "`n🔥 PRIME ARCHON PULSE - REMOTE IGNITION SEQUENCE" -ForegroundColor Magenta
Write-Host "================================================`n" -ForegroundColor Magenta

# Verify SSH key exists
if (-not (Test-Path $SshKey)) {
    Write-Host "❌ SSH key not found: $SshKey" -ForegroundColor Red
    Write-Host "   Please verify the key path" -ForegroundColor Yellow
    exit 1
}

Write-Host "📡 Connecting to server: $Server" -ForegroundColor Yellow
Write-Host "   SSH Key: $SshKey`n" -ForegroundColor Cyan

# Step 1: Stop the service
Write-Host "⏹️  Step 1: Stopping service..." -ForegroundColor Yellow
$stopResult = ssh -i $SshKey $Server "sudo systemctl stop demiurge-node0" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Service stopped" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "⚠️  Service stop may have failed (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
    Write-Host "   Output: $stopResult" -ForegroundColor Gray
}

# Step 2: Verify binary exists
Write-Host "`n🔍 Step 2: Verifying binary..." -ForegroundColor Yellow
$verifyResult = ssh -i $SshKey $Server "ls -lh /opt/demiurge/target/release/demiurge-chain" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Binary found:" -ForegroundColor Green
    Write-Host $verifyResult -ForegroundColor Cyan
} else {
    Write-Host "❌ Binary not found!" -ForegroundColor Red
    Write-Host "   Output: $verifyResult" -ForegroundColor Yellow
    exit 1
}

# Step 3: Set executable permissions
Write-Host "`n🔐 Step 3: Setting executable permissions..." -ForegroundColor Yellow
$chmodResult = ssh -i $SshKey $Server "sudo chmod +x /opt/demiurge/target/release/demiurge-chain" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Permissions set" -ForegroundColor Green
} else {
    Write-Host "⚠️  Permission setting may have failed (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
    Write-Host "   Output: $chmodResult" -ForegroundColor Gray
}

# Step 4: Restart the service
Write-Host "`n🚀 Step 4: Restarting service..." -ForegroundColor Yellow
$restartResult = ssh -i $SshKey $Server "sudo systemctl restart demiurge-node0" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Service restarted" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "❌ Service restart failed (exit code: $LASTEXITCODE)" -ForegroundColor Red
    Write-Host "   Output: $restartResult" -ForegroundColor Yellow
    exit 1
}

# Step 5: Check service status
Write-Host "`n📊 Step 5: Checking service status..." -ForegroundColor Yellow
$statusResult = ssh -i $SshKey $Server "sudo systemctl status demiurge-node0 --no-pager -l" 2>&1
Write-Host $statusResult -ForegroundColor Cyan

# Step 6: Check for Archon events in logs
Write-Host "`n🔍 Step 6: Checking for Archon events..." -ForegroundColor Yellow
Write-Host "   Looking for: [ARCHON_EVENT], [ARCHON_DIRECTIVE], [ARCHON_HEARTBEAT]" -ForegroundColor Cyan
$logResult = ssh -i $SshKey $Server "sudo journalctl -u demiurge-node0 -n 50 --no-pager | grep -i archon" 2>&1

if ($logResult -match "ARCHON") {
    Write-Host "`n✅ ARCHON EVENTS FOUND:" -ForegroundColor Green
    Write-Host $logResult -ForegroundColor Green
    Write-Host "`n🎉 PRIME ARCHON PULSE IS IGNITED!" -ForegroundColor Magenta
} else {
    Write-Host "`n⚠️  No Archon events found in recent logs" -ForegroundColor Yellow
    Write-Host "   This may be normal if the service just started" -ForegroundColor Gray
    Write-Host "   Run manually: sudo journalctl -u demiurge-node0 -f" -ForegroundColor Cyan
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Monitor logs: ssh -i $SshKey $Server 'sudo journalctl -u demiurge-node0 -f'" -ForegroundColor White
Write-Host "   2. Test RPC: curl -X POST https://rpc.demiurge.cloud/rpc -d '{\"jsonrpc\":\"2.0\",\"method\":\"archon_state\",\"params\":[],\"id\":1}'" -ForegroundColor White
Write-Host "   3. Check AbyssOS: Open Archon Panel in portal" -ForegroundColor White
Write-Host ""
