# 💀 DEMIURGE CI/CD GUARDIAN PROTOCOL
# Enforces repository purity and canonical structure

$ErrorActionPreference = "Stop"
$failures = @()

Write-Host "🔒 DEMIURGE CI/CD GUARDIAN PROTOCOL" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Check 1: Directory Schema Correctness
Write-Host "`n[1/7] Checking directory schema..." -ForegroundColor Yellow
$canonicalDirs = @("apps", "chain", "runtime", "indexer", "sdk", "engine", "deploy", "scripts", "templates", "docs")
$rootDirs = Get-ChildItem -Directory | Select-Object -ExpandProperty Name
$nonCanonical = $rootDirs | Where-Object { $_ -notin $canonicalDirs -and $_ -ne ".git" -and $_ -ne ".github" }
if ($nonCanonical) {
    $failures += "Non-canonical directories found: $($nonCanonical -join ', ')"
    Write-Host "  ❌ FAIL: Non-canonical directories" -ForegroundColor Red
} else {
    Write-Host "  ✅ PASS: Directory schema correct" -ForegroundColor Green
}

# Check 2: Orphaned Imports
Write-Host "`n[2/7] Checking for orphaned imports..." -ForegroundColor Yellow
$tsFiles = Get-ChildItem -Recurse -Include "*.ts", "*.tsx" | 
    Where-Object { $_.FullName -notmatch 'node_modules|target|dist|\.next' }
$orphaned = @()
foreach ($file in $tsFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "from ['\`"]\.\.\/\.\.\/\.\.\/apps\/") {
        $orphaned += $file.FullName
    }
}
if ($orphaned.Count -gt 0) {
    $failures += "Orphaned relative imports found in $($orphaned.Count) files"
    Write-Host "  ❌ FAIL: $($orphaned.Count) files with fragile imports" -ForegroundColor Red
} else {
    Write-Host "  ✅ PASS: No orphaned imports" -ForegroundColor Green
}

# Check 3: Runtime Module Registration
Write-Host "`n[3/7] Verifying runtime module registration..." -ForegroundColor Yellow
$runtimeMod = Get-Content "chain/src/runtime/mod.rs" -Raw
$requiredModules = @("bank_cgt", "nft_dgen", "abyss_registry", "fabric_manager", "work_claim")
$missing = @()
foreach ($module in $requiredModules) {
    if ($runtimeMod -notmatch "mod $module|pub mod $module") {
        $missing += $module
    }
}
if ($missing) {
    $failures += "Missing runtime modules: $($missing -join ', ')"
    Write-Host "  ❌ FAIL: Missing modules: $($missing -join ', ')" -ForegroundColor Red
} else {
    Write-Host "  ✅ PASS: All runtime modules registered" -ForegroundColor Green
}

# Check 4: Schema Drift
Write-Host "`n[4/7] Checking schema consistency..." -ForegroundColor Yellow
$schemas = @("drc369", "abyssid", "fractal1", "wallet")
$missingSchemas = @()
foreach ($schema in $schemas) {
    if (-not (Test-Path "sdk/schema/$schema.json")) {
        $missingSchemas += $schema
    }
}
if ($missingSchemas) {
    $failures += "Missing schemas: $($missingSchemas -join ', ')"
    Write-Host "  ❌ FAIL: Missing schemas: $($missingSchemas -join ', ')" -ForegroundColor Red
} else {
    Write-Host "  ✅ PASS: All schemas present" -ForegroundColor Green
}

# Check 5: SDK Drift
Write-Host "`n[5/7] Verifying SDK structure..." -ForegroundColor Yellow
$sdkDirs = @("rust-sdk", "ts-sdk", "schema")
$missingSdk = @()
foreach ($dir in $sdkDirs) {
    if (-not (Test-Path "sdk/$dir")) {
        $missingSdk += $dir
    }
}
if ($missingSdk) {
    $failures += "Missing SDK directories: $($missingSdk -join ', ')"
    Write-Host "  ❌ FAIL: Missing SDK dirs: $($missingSdk -join ', ')" -ForegroundColor Red
} else {
    Write-Host "  ✅ PASS: SDK structure correct" -ForegroundColor Green
}

# Check 6: Work Claim Module
Write-Host "`n[6/7] Verifying work_claim module..." -ForegroundColor Yellow
if (-not (Test-Path "chain/src/runtime/work_claim.rs")) {
    $failures += "Missing work_claim.rs module"
    Write-Host "  ❌ FAIL: work_claim.rs missing" -ForegroundColor Red
} else {
    Write-Host "  ✅ PASS: work_claim module present" -ForegroundColor Green
}

# Check 7: No Nested DEMIURGE
Write-Host "`n[7/7] Checking for nested duplicates..." -ForegroundColor Yellow
if (Test-Path "DEMIURGE") {
    $failures += "Nested DEMIURGE directory found"
    Write-Host "  ❌ FAIL: Nested DEMIURGE directory exists" -ForegroundColor Red
} else {
    Write-Host "  ✅ PASS: No nested duplicates" -ForegroundColor Green
}

# Summary
Write-Host "`n====================================" -ForegroundColor Cyan
if ($failures.Count -eq 0) {
    Write-Host "✅ ALL CHECKS PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ GUARDIAN PROTOCOL FAILED" -ForegroundColor Red
    Write-Host "`nFailures:" -ForegroundColor Red
    foreach ($failure in $failures) {
        Write-Host "  - $failure" -ForegroundColor Red
    }
    exit 1
}
