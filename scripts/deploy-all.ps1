# Deploy All Components - Complete Deployment Script
# 
# This script builds and deploys all Demiurge components to the server
#
# Usage:
#   .\scripts\deploy-all.ps1
#
# Prerequisites:
#   - SSH access to server
#   - Server path: /opt/demiurge/
#   - All dependencies installed locally

param(
    [string]$Server = "ubuntu@51.210.209.112",
    [string]$SshKey = "$env:USERPROFILE\.ssh\demiurge_new",
    [string]$RemoteBase = "/opt/demiurge",
    [switch]$SkipBuild = $false,
    [switch]$SkipChain = $false,
    [switch]$SkipIndexer = $false
)

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 DEMIURGE COMPLETE DEPLOYMENT" -ForegroundColor Magenta
Write-Host "================================`n" -ForegroundColor Magenta

Write-Host "📋 Deployment Configuration:" -ForegroundColor Yellow
Write-Host "   Server: $Server" -ForegroundColor Cyan
Write-Host "   SSH Key: $SshKey" -ForegroundColor Cyan
Write-Host "   Remote Base: $RemoteBase" -ForegroundColor Cyan
Write-Host ""

# Verify SSH key exists
if (-not (Test-Path $SshKey)) {
    Write-Host "❌ SSH key not found: $SshKey" -ForegroundColor Red
    exit 1
}

# ============================================
# STEP 1: BUILD CHAIN
# ============================================
if (-not $SkipChain -and -not $SkipBuild) {
    Write-Host "📦 Step 1: Building chain binary..." -ForegroundColor Yellow
    Push-Location "$PSScriptRoot\..\chain"
    
    try {
        Write-Host "   Running: cargo build --release" -ForegroundColor Gray
        cargo build --release
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Chain build failed!" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "✅ Chain build successful" -ForegroundColor Green
        
        # Verify binary exists
        $chainBinary = if (Test-Path "target\release\demiurge-chain.exe") {
            "target\release\demiurge-chain.exe"
        } elseif (Test-Path "target\release\demiurge-chain") {
            "target\release\demiurge-chain"
        } else {
            $null
        }
        
        if ($chainBinary) {
            $binInfo = Get-Item $chainBinary
            Write-Host "   Binary: $($binInfo.Name)" -ForegroundColor Cyan
            Write-Host "   Size: $([math]::Round($binInfo.Length / 1MB, 2)) MB" -ForegroundColor Cyan
        } else {
            Write-Host "⚠️  Chain binary not found after build" -ForegroundColor Yellow
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Host "⏭️  Skipping chain build (--SkipChain or --SkipBuild)" -ForegroundColor Cyan
}

# ============================================
# STEP 2: BUILD INDEXER (if needed)
# ============================================
if (-not $SkipIndexer -and -not $SkipBuild) {
    Write-Host "`n📦 Step 2: Building indexer..." -ForegroundColor Yellow
    Push-Location "$PSScriptRoot\..\indexer\ingestor-rs"
    
    try {
        Write-Host "   Running: cargo build --release" -ForegroundColor Gray
        cargo build --release
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️  Indexer build failed (non-critical)" -ForegroundColor Yellow
        } else {
            Write-Host "✅ Indexer build successful" -ForegroundColor Green
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Host "⏭️  Skipping indexer build (--SkipIndexer or --SkipBuild)" -ForegroundColor Cyan
}

# ============================================
# STEP 3: DEPLOY CHAIN BINARY
# ============================================
if (-not $SkipChain) {
    Write-Host "`n📤 Step 3: Deploying chain binary to server..." -ForegroundColor Yellow
    
    $chainBinary = $null
    if (Test-Path "$PSScriptRoot\..\chain\target\release\demiurge-chain.exe") {
        $chainBinary = Resolve-Path "$PSScriptRoot\..\chain\target\release\demiurge-chain.exe"
    } elseif (Test-Path "$PSScriptRoot\..\chain\target\release\demiurge-chain") {
        $chainBinary = Resolve-Path "$PSScriptRoot\..\chain\target\release\demiurge-chain"
    }
    
    if (-not $chainBinary) {
        Write-Host "❌ Chain binary not found!" -ForegroundColor Red
        Write-Host "   Build first: cd chain && cargo build --release" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "   Source: $chainBinary" -ForegroundColor Cyan
    Write-Host "   Target: ${Server}:${RemoteBase}/target/release/demiurge-chain" -ForegroundColor Cyan
    Write-Host "   Uploading..." -ForegroundColor Gray
    
    scp -i $SshKey $chainBinary "${Server}:${RemoteBase}/target/release/demiurge-chain" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Chain binary deployed" -ForegroundColor Green
    } else {
        Write-Host "❌ Chain binary deployment failed" -ForegroundColor Red
        exit 1
    }
}

# ============================================
# STEP 4: RESTART SERVICES ON SERVER
# ============================================
Write-Host "`n🔄 Step 4: Restarting services on server..." -ForegroundColor Yellow

$restartCommands = @(
    "sudo systemctl stop demiurge-node0",
    "sleep 2",
    "sudo chmod +x ${RemoteBase}/target/release/demiurge-chain",
    "sudo systemctl restart demiurge-node0",
    "sleep 2",
    "sudo systemctl status demiurge-node0 --no-pager -l | head -20"
)

$restartScript = $restartCommands -join " && "

Write-Host "   Executing restart sequence..." -ForegroundColor Gray
ssh -i $SshKey $Server $restartScript 2>&1 | ForEach-Object {
    if ($_ -match "active \(running\)") {
        Write-Host $_ -ForegroundColor Green
    } elseif ($_ -match "failed|error|Error") {
        Write-Host $_ -ForegroundColor Red
    } else {
        Write-Host $_
    }
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Services restarted" -ForegroundColor Green
} else {
    Write-Host "⚠️  Service restart may have issues - check manually" -ForegroundColor Yellow
}

# ============================================
# STEP 5: VERIFY DEPLOYMENT
# ============================================
Write-Host "`n🔍 Step 5: Verifying deployment..." -ForegroundColor Yellow

# Check service status
Write-Host "   Checking service status..." -ForegroundColor Gray
$status = ssh -i $SshKey $Server "sudo systemctl is-active demiurge-node0" 2>&1
if ($status -match "active") {
    Write-Host "✅ Service is active" -ForegroundColor Green
} else {
    Write-Host "⚠️  Service status: $status" -ForegroundColor Yellow
}

# Check for Archon events
Write-Host "   Checking for Archon events..." -ForegroundColor Gray
Start-Sleep -Seconds 3
$archonEvents = ssh -i $SshKey $Server "sudo journalctl -u demiurge-node0 -n 100 --no-pager | grep -i archon | head -5" 2>&1

if ($archonEvents -and $archonEvents -match "ARCHON") {
    Write-Host "✅ Archon events found:" -ForegroundColor Green
    $archonEvents | ForEach-Object { Write-Host "   $_" -ForegroundColor Green }
    Write-Host "`n🎉 PRIME ARCHON PULSE IS ACTIVE!" -ForegroundColor Magenta
} else {
    Write-Host "⚠️  No Archon events in recent logs" -ForegroundColor Yellow
    Write-Host "   This may be normal if blocks aren't being produced yet" -ForegroundColor Gray
}

# Test RPC endpoint
Write-Host "   Testing RPC endpoint..." -ForegroundColor Gray
$rpcTest = ssh -i $SshKey $Server "curl -s -X POST http://localhost:8545/rpc -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"archon_state\",\"params\":[],\"id\":1}'" 2>&1

if ($rpcTest -match "result" -and $rpcTest -notmatch "error") {
    Write-Host "✅ RPC endpoint responding" -ForegroundColor Green
} else {
    Write-Host "⚠️  RPC endpoint test inconclusive" -ForegroundColor Yellow
}

# ============================================
# DEPLOYMENT SUMMARY
# ============================================
Write-Host "`n📊 DEPLOYMENT SUMMARY" -ForegroundColor Magenta
Write-Host "====================`n" -ForegroundColor Magenta

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Monitor logs: ssh -i $SshKey $Server 'sudo journalctl -u demiurge-node0 -f'" -ForegroundColor White
Write-Host "   2. Check Archon: Look for [ARCHON_EVENT] messages" -ForegroundColor White
Write-Host "   3. Test RPC: curl -X POST http://localhost:8545/rpc -d '{\"jsonrpc\":\"2.0\",\"method\":\"archon_state\",\"params\":[],\"id\":1}'" -ForegroundColor White
Write-Host "   4. Verify AbyssOS: Open Archon Panel in portal" -ForegroundColor White
Write-Host ""
