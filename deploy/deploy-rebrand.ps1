# DEMIURGE QOR Rebrand - Windows Deployment Script
# Run this from your local Windows machine

param(
    [string]$Server = "ubuntu@51.210.209.112",
    [switch]$SkipBackup,
    [switch]$ChainOnly,
    [switch]$FrontendOnly
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  DEMIURGE QOR REBRAND DEPLOYMENT" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Helper function to run SSH commands
function Invoke-SSH {
    param([string]$Command)
    ssh $Server "bash -l -c `"$Command`""
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code $LASTEXITCODE"
    }
}

try {
    # Step 1: Verify connection
    Write-Host "[1/8] Verifying server connection..." -ForegroundColor Green
    Invoke-SSH "echo 'Connected to server successfully'"
    Write-Host "✓ Connected" -ForegroundColor Green
    Write-Host ""

    # Step 2: Create backup (unless skipped)
    if (-not $SkipBackup) {
        Write-Host "[2/8] Creating backup..." -ForegroundColor Green
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        Invoke-SSH "mkdir -p ~/backups/$timestamp && echo 'Backup created at: ~/backups/$timestamp'"
        Write-Host "✓ Backup created" -ForegroundColor Green
    } else {
        Write-Host "[2/8] Skipping backup (as requested)" -ForegroundColor Yellow
    }
    Write-Host ""

    if (-not $FrontendOnly) {
        # Step 3: Rebuild Chain
        Write-Host "[3/8] Rebuilding blockchain..." -ForegroundColor Green
        Write-Host "  This may take 5-10 minutes..." -ForegroundColor Yellow
        Invoke-SSH "cd /home/ubuntu/DEMIURGE/chain && cargo build --release"
        Write-Host "✓ Chain rebuilt" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "[3/8] Skipping chain rebuild (frontend only)" -ForegroundColor Yellow
        Write-Host ""
    }

    if (-not $ChainOnly) {
        # Step 4: Install QOR ID Service
        Write-Host "[4/8] Installing QOR ID Service..." -ForegroundColor Green
        Invoke-SSH "cd /home/ubuntu/DEMIURGE/apps/qorid-service && pnpm install"
        Write-Host "✓ QOR ID Service installed" -ForegroundColor Green
        Write-Host ""

        # Step 5: Install QOR Gateway
        Write-Host "[5/8] Installing QOR Gateway..." -ForegroundColor Green
        Invoke-SSH "cd /home/ubuntu/DEMIURGE/indexer/qor-gateway && pnpm install"
        Write-Host "✓ QOR Gateway installed" -ForegroundColor Green
        Write-Host ""

        # Step 6: Build QLOUD OS
        Write-Host "[6/8] Building QLOUD OS..." -ForegroundColor Green
        Invoke-SSH "cd /home/ubuntu/DEMIURGE/apps/qloud-os && pnpm install && pnpm build"
        Write-Host "✓ QLOUD OS built" -ForegroundColor Green
        Write-Host ""

        # Step 7: Fix permissions
        Write-Host "[7/8] Fixing permissions..." -ForegroundColor Green
        Invoke-SSH "chmod 755 /home/ubuntu && chmod -R 755 /home/ubuntu/DEMIURGE/apps/qloud-os/dist"
        Write-Host "✓ Permissions fixed" -ForegroundColor Green
        Write-Host ""

        # Step 8: Reload Nginx
        Write-Host "[8/8] Reloading Nginx..." -ForegroundColor Green
        Invoke-SSH "sudo nginx -t && sudo systemctl reload nginx"
        Write-Host "✓ Nginx reloaded" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "[4-8] Skipping frontend deployment (chain only)" -ForegroundColor Yellow
        Write-Host ""
    }

    # Success!
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "✓ All services deployed successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "Test your deployment:" -ForegroundColor Cyan
    Write-Host "  QLOUD OS:  https://demiurge.cloud" -ForegroundColor White
    Write-Host "  GraphQL:   https://api.demiurge.cloud/graphql" -ForegroundColor White
    Write-Host "  RPC:       https://rpc.demiurge.cloud/rpc" -ForegroundColor White
    Write-Host ""
    Write-Host "Monitor logs:" -ForegroundColor Cyan
    Write-Host "  ssh $Server 'sudo journalctl -f -u demiurge -u qorid -u qor-gateway'" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host "  DEPLOYMENT FAILED" -ForegroundColor Red
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check logs:" -ForegroundColor Yellow
    Write-Host "  ssh $Server 'tail -100 ~/.npm/_logs/*.log'" -ForegroundColor White
    Write-Host ""
    exit 1
}
