# Test Blockchain Build - Verify librocksdb-sys Fix
# Tests if the blockchain builds successfully with current setup

Write-Host "🧪 Testing Blockchain Build" -ForegroundColor Cyan
Write-Host ""

$blockchainDir = "x:\Demiurge-Blockchain\blockchain"

if (-not (Test-Path $blockchainDir)) {
    Write-Host "❌ Blockchain directory not found: $blockchainDir" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Checking Cargo.toml..." -ForegroundColor Yellow
$cargoToml = Join-Path $blockchainDir "Cargo.toml"
if (-not (Test-Path $cargoToml)) {
    Write-Host "❌ Cargo.toml not found" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Cargo.toml found" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Checking for patch section..." -ForegroundColor Yellow
$content = Get-Content $cargoToml -Raw
if ($content -match "\[patch\.crates-io\]") {
    Write-Host "⚠️  Patch section exists - using fork dependencies" -ForegroundColor Yellow
} else {
    Write-Host "ℹ️  No patch section - using crates.io versions" -ForegroundColor Gray
    Write-Host "   Note: Local substrate fix won't apply automatically" -ForegroundColor Gray
}
Write-Host ""

Write-Host "Step 3: Running cargo check..." -ForegroundColor Yellow
Write-Host "   This will verify dependencies resolve correctly" -ForegroundColor Gray
Write-Host ""

Set-Location $blockchainDir

try {
    $output = cargo check --bin demiurge-node 2>&1 | Tee-Object -Variable buildOutput
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Build check passed!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Run full build: cargo build --release --bin demiurge-node" -ForegroundColor White
        Write-Host "2. Test node: cargo run --bin demiurge-node -- --help" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ Build check failed" -ForegroundColor Red
        Write-Host ""
        
        # Check for librocksdb-sys conflict
        if ($buildOutput -match "librocksdb-sys") {
            Write-Host "⚠️  librocksdb-sys conflict detected!" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Solution options:" -ForegroundColor Cyan
            Write-Host "1. Apply Substrate fork fix:" -ForegroundColor White
            Write-Host "   .\scripts\apply-substrate-fix.ps1" -ForegroundColor Gray
            Write-Host ""
            Write-Host "2. Or use local substrate path (if available):" -ForegroundColor White
            Write-Host "   Add [patch.crates-io] section pointing to local substrate" -ForegroundColor Gray
        }
        
        # Show last 20 lines of error
        Write-Host "Last 20 lines of output:" -ForegroundColor Yellow
        $buildOutput | Select-Object -Last 20 | ForEach-Object {
            Write-Host $_ -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ Error running cargo check: $_" -ForegroundColor Red
    exit 1
} finally {
    Set-Location "x:\Demiurge-Blockchain"
}
