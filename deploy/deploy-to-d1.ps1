# PowerShell script to deploy and execute production deployment on Server D1
# Branch: D1

param(
    [Parameter(Mandatory=$false)]
    [string]$ServerHost = "abyss"
)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Demiurge Production Deployment" -ForegroundColor Cyan
Write-Host "  Server: $ServerHost" -ForegroundColor Cyan
Write-Host "  Branch: D1" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Verify we're on branch D1
Write-Host "Verifying Git branch..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
if ($currentBranch -ne "D1") {
    Write-Host "⚠️  WARNING: Not on branch D1 (current: $currentBranch)" -ForegroundColor Yellow
    Write-Host "This script should be run from branch D1" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# Check SSH connection
Write-Host "`nTesting SSH connection..." -ForegroundColor Yellow
try {
    $testResult = ssh -o ConnectTimeout=5 $ServerHost "echo 'Connection successful'" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "SSH connection failed"
    }
    Write-Host "✅ SSH connection verified" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to connect to server: $_" -ForegroundColor Red
    exit 1
}

# Copy deployment script to server
Write-Host "`nCopying deployment script to server..." -ForegroundColor Yellow
$scriptPath = Join-Path $PSScriptRoot "production-d1-deploy.sh"
if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Deployment script not found: $scriptPath" -ForegroundColor Red
    exit 1
}

scp $scriptPath "${ServerHost}:/tmp/production-d1-deploy.sh"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to copy script to server" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Script copied to server" -ForegroundColor Green

# Make script executable and execute
Write-Host "`nExecuting deployment script on server..." -ForegroundColor Yellow
Write-Host "This will take 15-30 minutes depending on build times" -ForegroundColor Yellow
Write-Host ""

ssh $ServerHost "chmod +x /tmp/production-d1-deploy.sh && sudo /tmp/production-d1-deploy.sh"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  ✅ DEPLOYMENT COMPLETE" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Verify services: ssh $ServerHost 'sudo systemctl status demiurge-chain abyssid abyss-gateway nginx'" -ForegroundColor White
    Write-Host "2. Check logs: ssh $ServerHost 'sudo journalctl -u demiurge-chain -f'" -ForegroundColor White
    Write-Host "3. Test RPC: curl -X POST http://$ServerHost:8545/rpc -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"cgt_getChainInfo\",\"params\":[],\"id\":1}'" -ForegroundColor White
    Write-Host "4. Reboot server for final verification: ssh $ServerHost 'sudo reboot'" -ForegroundColor White
} else {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "  ❌ DEPLOYMENT FAILED" -ForegroundColor Red
    Write-Host "========================================`n" -ForegroundColor Red
    Write-Host "Check the deployment log on the server:" -ForegroundColor Yellow
    Write-Host "  ssh $ServerHost 'sudo tail -100 /opt/demiurge/logs/bootstrap.log'" -ForegroundColor White
    exit 1
}
