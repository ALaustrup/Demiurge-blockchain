# 💀 ASCENSION PROTOCOL
# System-wide validation and purification script

$ErrorActionPreference = "Stop"
$issues = @()
$redList = @()

Write-Host "🔥 ASCENSION PROTOCOL INITIATED" -ForegroundColor Cyan
Write-Host ""

# TASK 1: Directory Reconciliation
Write-Host "TASK 1: Directory Reconciliation..." -ForegroundColor Yellow

# Check for obsolete apps/desktop
if (Test-Path "apps\desktop") {
    $redList += "apps/desktop/ - Obsolete, superseded by desktop-qt"
    Write-Host "  ⚠️ FOUND: apps/desktop/ (should be removed)" -ForegroundColor Yellow
} else {
    Write-Host "  ✅ apps/desktop/ not found" -ForegroundColor Green
}

# Check for nested DEMIURGE
if (Test-Path "DEMIURGE") {
    $redList += "DEMIURGE/ - Nested duplicate directory"
    Write-Host "  ⚠️ FOUND: DEMIURGE/ nested directory" -ForegroundColor Red
} else {
    Write-Host "  ✅ No nested DEMIURGE/ directory" -ForegroundColor Green
}

# Check for build artifacts
$buildArtifacts = @("target", "dist", "node_modules", ".next", "build")
foreach ($artifact in $buildArtifacts) {
    $count = (Get-ChildItem -Recurse -Directory -Filter $artifact -ErrorAction SilentlyContinue | Measure-Object).Count
    if ($count -gt 0) {
        Write-Host "  ℹ️ Found $count $artifact directories (expected in .gitignore)" -ForegroundColor Gray
    }
}

Write-Host ""

# TASK 2: Workspace Alignment
Write-Host "TASK 2: Workspace Alignment..." -ForegroundColor Yellow

# Check pnpm workspace
if (Test-Path "pnpm-workspace.yaml") {
    $workspace = Get-Content "pnpm-workspace.yaml" -Raw
    Write-Host "  ✅ pnpm-workspace.yaml exists" -ForegroundColor Green
    
    # Verify packages exist
    if ($workspace -match "apps/\*") {
        $apps = Get-ChildItem "apps" -Directory
        Write-Host "  ✅ Found $($apps.Count) apps" -ForegroundColor Green
    }
} else {
    $issues += "Missing pnpm-workspace.yaml"
    Write-Host "  ❌ Missing pnpm-workspace.yaml" -ForegroundColor Red
}

# Check Cargo.toml workspace
if (Test-Path "Cargo.toml") {
    $cargo = Get-Content "Cargo.toml" -Raw
    Write-Host "  ✅ Cargo.toml exists" -ForegroundColor Green
    
    # Verify members exist
    if ($cargo -match 'members = \[') {
        Write-Host "  ✅ Cargo workspace defined" -ForegroundColor Green
    }
} else {
    $issues += "Missing Cargo.toml"
    Write-Host "  ❌ Missing Cargo.toml" -ForegroundColor Red
}

Write-Host ""

# TASK 3: Runtime Consistency
Write-Host "TASK 3: Runtime Consistency..." -ForegroundColor Yellow

if (Test-Path "chain\src\runtime\work_claim.rs") {
    Write-Host "  ✅ work_claim.rs exists" -ForegroundColor Green
} else {
    $issues += "Missing chain/src/runtime/work_claim.rs"
    Write-Host "  ❌ Missing work_claim.rs" -ForegroundColor Red
}

if (Test-Path "chain\src\runtime\mod.rs") {
    $modContent = Get-Content "chain\src\runtime\mod.rs" -Raw
    if ($modContent -match "mod work_claim") {
        Write-Host "  ✅ work_claim registered in mod.rs" -ForegroundColor Green
    } else {
        $issues += "work_claim not registered in mod.rs"
        Write-Host "  ❌ work_claim not registered" -ForegroundColor Red
    }
} else {
    $issues += "Missing chain/src/runtime/mod.rs"
    Write-Host "  ❌ Missing mod.rs" -ForegroundColor Red
}

Write-Host ""

# Generate RED LIST
Write-Host "RED LIST (Items to Delete/Archive):" -ForegroundColor Red
foreach ($item in $redList) {
    Write-Host "  - $item" -ForegroundColor Red
}

Write-Host ""
Write-Host "Issues Found: $($issues.Count)" -ForegroundColor $(if ($issues.Count -eq 0) { "Green" } else { "Yellow" })
if ($issues.Count -gt 0) {
    foreach ($issue in $issues) {
        Write-Host "  - $issue" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ TASK 1-3 Complete" -ForegroundColor Green
