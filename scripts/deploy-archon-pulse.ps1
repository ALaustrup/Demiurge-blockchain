# Deploy Prime Archon Pulse Binary
# 
# This script helps deploy the Archon-enabled binary to the server
# 
# Usage:
#   .\scripts\deploy-archon-pulse.ps1
#
# Prerequisites:
#   - Binary built: cargo build --release
#   - SSH access to server
#   - Server path: /opt/demiurge/target/release/

param(
    [string]$Server = "ubuntu@51.210.209.112",
    [string]$RemotePath = "/opt/demiurge/target/release/",
    [switch]$SkipBuild = $false
)

Write-Host "`n🚀 PRIME ARCHON PULSE DEPLOYMENT" -ForegroundColor Magenta
Write-Host "================================`n" -ForegroundColor Magenta

# Step 1: Build binary
if (-not $SkipBuild) {
    Write-Host "📦 Step 1: Building binary..." -ForegroundColor Yellow
    Push-Location "$PSScriptRoot\..\chain"
    
    try {
        cargo build --release
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Build failed!" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Build successful" -ForegroundColor Green
    } finally {
        Pop-Location
    }
} else {
    Write-Host "⏭️  Skipping build (--SkipBuild flag)" -ForegroundColor Cyan
}

# Step 2: Locate binary
Write-Host "`n🔍 Step 2: Locating binary..." -ForegroundColor Yellow
$binaryPath = $null

if (Test-Path "$PSScriptRoot\..\chain\target\release\demiurge-chain.exe") {
    $binaryPath = "$PSScriptRoot\..\chain\target\release\demiurge-chain.exe"
} elseif (Test-Path "$PSScriptRoot\..\chain\target\release\demiurge-chain") {
    $binaryPath = "$PSScriptRoot\..\chain\target\release\demiurge-chain"
} else {
    Write-Host "❌ Binary not found!" -ForegroundColor Red
    Write-Host "   Expected: chain\target\release\demiurge-chain" -ForegroundColor Yellow
    Write-Host "   Run: cd chain && cargo build --release" -ForegroundColor Yellow
    exit 1
}

$binaryInfo = Get-Item $binaryPath
Write-Host "✅ Found: $($binaryInfo.Name)" -ForegroundColor Green
Write-Host "   Size: $([math]::Round($binaryInfo.Length / 1MB, 2)) MB" -ForegroundColor Cyan
Write-Host "   Path: $binaryPath" -ForegroundColor Cyan

# Step 3: Deploy to server
Write-Host "`n📤 Step 3: Deploying to server..." -ForegroundColor Yellow
Write-Host "   Server: $Server" -ForegroundColor Cyan
Write-Host "   Remote: $RemotePath" -ForegroundColor Cyan
Write-Host "`n⚠️  Manual deployment required:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Option A - SCP (if OpenSSH installed):" -ForegroundColor White
Write-Host "   scp `"$binaryPath`" ${Server}:${RemotePath}" -ForegroundColor Gray
Write-Host ""
Write-Host "   Option B - Manual upload via SFTP client:" -ForegroundColor White
Write-Host "   1. Connect to $Server" -ForegroundColor Gray
Write-Host "   2. Navigate to $RemotePath" -ForegroundColor Gray
Write-Host "   3. Upload: $($binaryInfo.Name)" -ForegroundColor Gray
Write-Host "   4. Set permissions: chmod +x $($binaryInfo.Name)" -ForegroundColor Gray
Write-Host ""

# Step 4: Post-deployment instructions
Write-Host "`n📋 Step 4: Post-deployment steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   After deploying, SSH to server and run:" -ForegroundColor White
Write-Host "   ssh $Server" -ForegroundColor Gray
Write-Host "   sudo systemctl stop demiurge-node0" -ForegroundColor Gray
Write-Host "   sudo systemctl restart demiurge-node0" -ForegroundColor Gray
Write-Host "   sudo journalctl -u demiurge-node0 -f" -ForegroundColor Gray
Write-Host ""
Write-Host "   Look for Archon events:" -ForegroundColor White
Write-Host "   [ARCHON_EVENT] Heartbeat evaluated" -ForegroundColor Green
Write-Host "   [ARCHON_DIRECTIVE] A0: State unified" -ForegroundColor Green
Write-Host ""

Write-Host "✅ Deployment script complete!" -ForegroundColor Green
Write-Host "   See DEPLOYMENT_CHECKLIST.md for full instructions" -ForegroundColor Cyan
Write-Host ""
