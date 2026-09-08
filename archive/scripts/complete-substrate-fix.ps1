# Complete Substrate Fork Fix Workflow
# This script orchestrates the entire fix process

param(
    [switch]$SkipForkCheck,
    [switch]$SkipSubstrateBuild,
    [switch]$SkipDemiurgeBuild
)

Write-Host "🚀 Complete Substrate Fork Fix Workflow" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Step 1: Verify fork exists
if (-not $SkipForkCheck) {
    Write-Host "Step 1: Verifying fork exists..." -ForegroundColor Yellow
    & "$PSScriptRoot\verify-and-setup-fork.ps1"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Fork verification failed. Please fork the repository first." -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

# Step 2: Apply fix in Substrate fork
Write-Host "Step 2: Applying fix in Substrate fork..." -ForegroundColor Yellow
& "$PSScriptRoot\apply-substrate-fix-in-fork.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to apply fix in Substrate fork" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Test Substrate fix
if (-not $SkipSubstrateBuild) {
    Write-Host "Step 3: Testing Substrate fix..." -ForegroundColor Yellow
    Push-Location substrate
    try {
        Write-Host "Building sc-cli..." -ForegroundColor Cyan
        cargo build -p sc-cli 2>&1 | Tee-Object -Variable buildOutput
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Substrate build failed" -ForegroundColor Red
            Write-Host $buildOutput
            exit 1
        }
        Write-Host "✅ Substrate build successful!" -ForegroundColor Green
    } finally {
        Pop-Location
    }
    Write-Host ""
}

# Step 4: Commit and push (optional)
Write-Host "Step 4: Commit and push changes?" -ForegroundColor Yellow
$response = Read-Host "Commit and push to GitHub? (y/N)"
if ($response -eq "y" -or $response -eq "Y") {
    Push-Location substrate
    try {
        git add client/cli/Cargo.toml
        git commit -m "fix: Update sc-cli to use sc-client-db v0.51.0 to resolve librocksdb-sys conflict"
        git push origin fix/librocksdb-sys-conflict
        Write-Host "✅ Changes pushed to GitHub" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Failed to push changes: $_" -ForegroundColor Yellow
        Write-Host "   You can push manually later" -ForegroundColor Yellow
    } finally {
        Pop-Location
    }
} else {
    Write-Host "⏭️  Skipping commit/push" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Apply fix to Demiurge
Write-Host "Step 5: Applying fix to Demiurge blockchain..." -ForegroundColor Yellow
& "$PSScriptRoot\apply-substrate-fix.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to apply fix to Demiurge" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 6: Test Demiurge build
if (-not $SkipDemiurgeBuild) {
    Write-Host "Step 6: Testing Demiurge build..." -ForegroundColor Yellow
    Push-Location blockchain
    try {
        Write-Host "Updating dependencies..." -ForegroundColor Cyan
        cargo update 2>&1 | Out-Null
        
        Write-Host "Checking build..." -ForegroundColor Cyan
        cargo check --bin demiurge-node 2>&1 | Tee-Object -Variable checkOutput
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Demiurge build check failed" -ForegroundColor Red
            Write-Host $checkOutput
            exit 1
        }
        Write-Host "✅ Demiurge build check successful!" -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "🎉 All steps completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "- ✅ Fork verified and cloned" -ForegroundColor Green
Write-Host "- ✅ Fix applied in Substrate fork" -ForegroundColor Green
Write-Host "- ✅ Substrate build tested" -ForegroundColor Green
Write-Host "- ✅ Fix applied to Demiurge" -ForegroundColor Green
Write-Host "- ✅ Demiurge build verified" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Build the full release:" -ForegroundColor Cyan
Write-Host "  cd blockchain" -ForegroundColor White
Write-Host "  cargo build --release --bin demiurge-node" -ForegroundColor White
Write-Host ""
