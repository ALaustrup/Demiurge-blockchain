# 💀 DEMIURGE REPO SOVEREIGNTY SEAL GENERATOR
# Generates cryptographic certificate of purity for the repository

param(
    [string]$OutputPath = "REPO_STATE_SEAL.json"
)

$ErrorActionPreference = "Stop"

Write-Host "🔒 Generating Demiurge Repository Sovereignty Seal..." -ForegroundColor Cyan

function Get-FileHash {
    param([string]$FilePath)
    $content = Get-Content -Path $FilePath -Raw -Encoding UTF8
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
    $hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
    return [System.BitConverter]::ToString($hash).Replace("-", "").ToLower()
}

function Get-DirectoryHash {
    param([string]$DirPath)
    $files = Get-ChildItem -Path $DirPath -File -Recurse | 
        Where-Object { $_.FullName -notmatch 'node_modules|target|\.git|dist|build|\.next' } |
        Sort-Object FullName
    $hashes = $files | ForEach-Object { Get-FileHash $_.FullName }
    $combined = $hashes -join ""
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($combined)
    $hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
    return [System.BitConverter]::ToString($hash).Replace("-", "").ToLower()
}

$seal = @{
    timestamp = (Get-Date -Format "o")
    version = "1.0.0"
    repo = "DEMIURGE"
    phase = "OMEGA"
    directories = @{}
    files = @{}
    runtime = @{}
    sdk = @{}
    schemas = @{}
    dependencies = @{}
}

# Directory hashes
Write-Host "  Calculating directory hashes..." -ForegroundColor Yellow
$canonicalDirs = @("apps", "chain", "runtime", "indexer", "sdk", "engine", "deploy", "scripts", "templates", "docs")
foreach ($dir in $canonicalDirs) {
    if (Test-Path $dir) {
        $seal.directories[$dir] = Get-DirectoryHash $dir
    }
}

# Critical file hashes
Write-Host "  Calculating critical file hashes..." -ForegroundColor Yellow
$criticalFiles = @(
    "Cargo.toml",
    "package.json",
    "pnpm-workspace.yaml",
    "turbo.json",
    "chain/src/runtime/mod.rs",
    "chain/src/runtime/work_claim.rs"
)
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        $seal.files[$file] = Get-FileHash $file
    }
}

# Runtime module registration
Write-Host "  Verifying runtime modules..." -ForegroundColor Yellow
$runtimeModules = @("abyss_registry", "avatars_profiles", "bank_cgt", "fabric_manager", "nft_dgen")
foreach ($module in $runtimeModules) {
    $modulePath = "runtime/$module/src/lib.rs"
    if (Test-Path $modulePath) {
        $seal.runtime[$module] = Get-FileHash $modulePath
    }
}
# work_claim is in chain/src/runtime/, not runtime/
if (Test-Path "chain/src/runtime/work_claim.rs") {
    $seal.runtime["work_claim"] = Get-FileHash "chain/src/runtime/work_claim.rs"
}

# SDK schemas
Write-Host "  Verifying SDK schemas..." -ForegroundColor Yellow
$schemas = @("drc369", "abyssid", "fractal1", "wallet")
foreach ($schema in $schemas) {
    $schemaPath = "sdk/schema/$schema.json"
    if (Test-Path $schemaPath) {
        $seal.schemas[$schema] = Get-FileHash $schemaPath
    }
}

# Dependency graph hash
Write-Host "  Calculating dependency graph hash..." -ForegroundColor Yellow
$depContent = @()
if (Test-Path "Cargo.toml") { $depContent += Get-Content "Cargo.toml" -Raw }
if (Test-Path "package.json") { $depContent += Get-Content "package.json" -Raw }
if (Test-Path "pnpm-workspace.yaml") { $depContent += Get-Content "pnpm-workspace.yaml" -Raw }
$depString = $depContent -join "|"
$depBytes = [System.Text.Encoding]::UTF8.GetBytes($depString)
$depHash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($depBytes)
$seal.dependencies.graph = [System.BitConverter]::ToString($depHash).Replace("-", "").ToLower()

# Generate master seal hash
$sealJson = $seal | ConvertTo-Json -Depth 10
$sealBytes = [System.Text.Encoding]::UTF8.GetBytes($sealJson)
$masterHash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($sealBytes)
$seal.masterHash = [System.BitConverter]::ToString($masterHash).Replace("-", "").ToLower()

# Write seal
$sealJson = $seal | ConvertTo-Json -Depth 10
$sealJson | Out-File -FilePath $OutputPath -Encoding UTF8

Write-Host "✅ Sovereignty Seal generated: $OutputPath" -ForegroundColor Green
Write-Host "   Master Hash: $($seal.masterHash)" -ForegroundColor Cyan
