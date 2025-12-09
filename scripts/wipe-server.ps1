# WIPE SERVER - Complete Server Cleanup
# 
# ⚠️  WARNING: THIS IS A DESTRUCTIVE OPERATION
# This script will:
# - Stop all services
# - Remove all data directories
# - Remove binaries
# - Clean up logs
# - Optionally remove systemd services
#
# Usage:
#   .\scripts\wipe-server.ps1 [-RemoveServices]

param(
    [string]$Server = "ubuntu@51.210.209.112",
    [string]$SshKey = "$env:USERPROFILE\.ssh\demiurge_new",
    [string]$RemoteBase = "/opt/demiurge",
    [switch]$RemoveServices = $false,
    [switch]$Confirm = $false
)

$ErrorActionPreference = "Stop"

Write-Host "`n💀 SERVER WIPE - DESTRUCTIVE OPERATION" -ForegroundColor Red
Write-Host "====================================`n" -ForegroundColor Red

Write-Host "⚠️  WARNING: This will DELETE ALL DATA on the server!" -ForegroundColor Yellow
Write-Host "   - All chain data" -ForegroundColor Red
Write-Host "   - All binaries" -ForegroundColor Red
Write-Host "   - All logs" -ForegroundColor Red
if ($RemoveServices) {
    Write-Host "   - All systemd services" -ForegroundColor Red
}
Write-Host ""

if (-not $Confirm) {
    Write-Host "❌ This operation requires explicit confirmation." -ForegroundColor Red
    Write-Host "   Add -Confirm flag to proceed: .\scripts\wipe-server.ps1 -Confirm" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔐 Connecting to server: $Server" -ForegroundColor Cyan
Write-Host ""

# Verify SSH key exists
if (-not (Test-Path $SshKey)) {
    Write-Host "❌ SSH key not found: $SshKey" -ForegroundColor Red
    exit 1
}

# ============================================
# STEP 1: STOP ALL SERVICES
# ============================================
Write-Host "⏹️  Step 1: Stopping all services..." -ForegroundColor Yellow

$stopCommands = @(
    "sudo systemctl stop demiurge-node0 2>/dev/null || true",
    "sudo systemctl stop abyssid-service 2>/dev/null || true",
    "sudo systemctl stop dns-service 2>/dev/null || true",
    "sleep 3"
)

$stopScript = $stopCommands -join " && "
ssh -i $SshKey $Server $stopScript 2>&1 | Out-Null

Write-Host "✅ Services stopped" -ForegroundColor Green

# ============================================
# STEP 2: REMOVE DATA DIRECTORIES
# ============================================
Write-Host "`n🗑️  Step 2: Removing data directories..." -ForegroundColor Yellow

$dataPaths = @(
    "$RemoteBase/.demiurge/data",
    "$RemoteBase/.demiurge/logs",
    "$RemoteBase/data",
    "$RemoteBase/logs",
    "$RemoteBase/.demiurge"
)

foreach ($path in $dataPaths) {
    Write-Host "   Removing: $path" -ForegroundColor Gray
    ssh -i $SshKey $Server "sudo rm -rf $path 2>/dev/null || true" 2>&1 | Out-Null
}

Write-Host "✅ Data directories removed" -ForegroundColor Green

# ============================================
# STEP 3: REMOVE BINARIES
# ============================================
Write-Host "`n🗑️  Step 3: Removing binaries..." -ForegroundColor Yellow

$binaryPaths = @(
    "$RemoteBase/target/release/demiurge-chain",
    "$RemoteBase/target/release/demiurge-indexer-ingestor",
    "$RemoteBase/target"
)

foreach ($path in $binaryPaths) {
    Write-Host "   Removing: $path" -ForegroundColor Gray
    ssh -i $SshKey $Server "sudo rm -rf $path 2>/dev/null || true" 2>&1 | Out-Null
}

Write-Host "✅ Binaries removed" -ForegroundColor Green

# ============================================
# STEP 4: CLEAN UP LOGS
# ============================================
Write-Host "`n🗑️  Step 4: Cleaning up logs..." -ForegroundColor Yellow

$logCommands = @(
    "sudo journalctl --vacuum-time=1s -u demiurge-node0 2>/dev/null || true",
    "sudo journalctl --vacuum-time=1s -u abyssid-service 2>/dev/null || true",
    "sudo journalctl --vacuum-time=1s -u dns-service 2>/dev/null || true",
    "sudo rm -f $RemoteBase/*.log 2>/dev/null || true",
    "sudo rm -f $RemoteBase/PULSE_SEAL.json 2>/dev/null || true"
)

$logScript = $logCommands -join " && "
ssh -i $SshKey $Server $logScript 2>&1 | Out-Null

Write-Host "✅ Logs cleaned" -ForegroundColor Green

# ============================================
# STEP 5: REMOVE SYSTEMD SERVICES (OPTIONAL)
# ============================================
if ($RemoveServices) {
    Write-Host "`n🗑️  Step 5: Removing systemd services..." -ForegroundColor Yellow
    
    $serviceCommands = @(
        "sudo systemctl disable demiurge-node0 2>/dev/null || true",
        "sudo systemctl disable abyssid-service 2>/dev/null || true",
        "sudo systemctl disable dns-service 2>/dev/null || true",
        "sudo rm -f /etc/systemd/system/demiurge-node0.service 2>/dev/null || true",
        "sudo rm -f /etc/systemd/system/abyssid-service.service 2>/dev/null || true",
        "sudo rm -f /etc/systemd/system/dns-service.service 2>/dev/null || true",
        "sudo systemctl daemon-reload"
    )
    
    $serviceScript = $serviceCommands -join " && "
    ssh -i $SshKey $Server $serviceScript 2>&1 | Out-Null
    
    Write-Host "✅ Services removed" -ForegroundColor Green
} else {
    Write-Host "`n⏭️  Step 5: Skipping service removal (use -RemoveServices to remove)" -ForegroundColor Cyan
}

# ============================================
# STEP 6: VERIFY WIPE
# ============================================
Write-Host "`n🔍 Step 6: Verifying wipe..." -ForegroundColor Yellow

$verifyCommands = @(
    "echo '=== Data Directories ==='",
    "ls -la $RemoteBase/.demiurge 2>/dev/null || echo 'Data directory removed'",
    "echo ''",
    "echo '=== Binaries ==='",
    "ls -la $RemoteBase/target/release/ 2>/dev/null || echo 'Binaries removed'",
    "echo ''",
    "echo '=== Services ==='",
    "sudo systemctl list-units --type=service | grep -i demiurge || echo 'No demiurge services found'"
)

$verifyScript = $verifyCommands -join " && "
$verifyOutput = ssh -i $SshKey $Server $verifyScript 2>&1

Write-Host $verifyOutput

# ============================================
# WIPE SUMMARY
# ============================================
Write-Host "`n💀 SERVER WIPE COMPLETE" -ForegroundColor Magenta
Write-Host "======================`n" -ForegroundColor Magenta

Write-Host "✅ All data removed" -ForegroundColor Green
Write-Host "✅ All binaries removed" -ForegroundColor Green
Write-Host "✅ All logs cleaned" -ForegroundColor Green
if ($RemoveServices) {
    Write-Host "✅ All services removed" -ForegroundColor Green
}

Write-Host "`n📋 Server Status:" -ForegroundColor Yellow
Write-Host "   - Data: WIPED" -ForegroundColor Red
Write-Host "   - Binaries: REMOVED" -ForegroundColor Red
Write-Host "   - Services: " -NoNewline -ForegroundColor Red
if ($RemoveServices) {
    Write-Host "REMOVED" -ForegroundColor Red
} else {
    Write-Host "STOPPED (but not removed)" -ForegroundColor Yellow
}

Write-Host "`n⚠️  To redeploy:" -ForegroundColor Yellow
Write-Host "   1. Run: .\scripts\deploy-all.ps1" -ForegroundColor White
Write-Host "   2. Or manually deploy binaries and restart services" -ForegroundColor White
Write-Host ""
