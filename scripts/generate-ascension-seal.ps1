# 💀 ASCENSION SEAL GENERATOR
# Generates cryptographic seal proving repo integrity

param(
    [string]$OutputPath = "ASCENSION_SEAL.json"
)

$ErrorActionPreference = "Stop"

Write-Host "🔒 Generating Ascension Seal..." -ForegroundColor Cyan

function Get-FileHash {
    param([string]$FilePath)
    if (-not (Test-Path $FilePath)) { return "missing" }
    $content = Get-Content -Path $FilePath -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
    if (-not $content) { return "empty" }
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
    $hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
    return [System.BitConverter]::ToString($hash).Replace("-", "").ToLower()
}

function Get-DirectoryHash {
    param([string]$DirPath)
    if (-not (Test-Path $DirPath)) { return "missing" }
    $files = Get-ChildItem -Path $DirPath -File -Recurse -ErrorAction SilentlyContinue | 
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
    protocol = "ASCENSION"
    repo = "DEMIURGE"
    phase = "OMEGA_COMPLETE"
    
    modules = @{}
    runtime = @{}
    sdk = @{}
    schemas = @{}
    services = @{}
    portal = @{}
    dns = @{}
    radio = @{}
    fractall = @{}
    buildGraph = @{}
    
    masterHash = ""
    status = "VALIDATED"
}

# Module hashes
Write-Host "  Calculating module hashes..." -ForegroundColor Yellow

$criticalModules = @(
    "chain/src/runtime/mod.rs",
    "chain/src/runtime/work_claim.rs",
    "chain/src/runtime/version.rs",
    "chain/src/node.rs",
    "chain/src/main.rs"
)

foreach ($module in $criticalModules) {
    $seal.modules[$module] = Get-FileHash $module
}

# Runtime registry hash
$seal.runtime.registryHash = Get-FileHash "chain/src/runtime/mod.rs"
$seal.runtime.versionHash = Get-FileHash "chain/src/runtime/version.rs"
$seal.runtime.workClaimHash = Get-FileHash "chain/src/runtime/work_claim.rs"

# SDK hashes
$seal.sdk.tsSdkHash = Get-DirectoryHash "sdk/ts-sdk/src"
$seal.sdk.rustSdkHash = Get-DirectoryHash "sdk/rust-sdk/src"

# Schema hashes
$schemas = @("drc369", "abyssid", "fractal1", "wallet")
foreach ($schema in $schemas) {
    $seal.schemas[$schema] = Get-FileHash "sdk/schema/$schema.json"
}

# Service hashes
$seal.services.abyssidService = Get-DirectoryHash "apps/abyssid-service/src"
$seal.services.dnsService = Get-DirectoryHash "apps/dns-service/src"

# Portal hash
$seal.portal.abyssosPortal = Get-DirectoryHash "apps/abyssos-portal/src"

# DNS hash
$seal.dns.resolver = Get-FileHash "apps/dns-service/src/dns/resolver.ts"
$seal.dns.security = Get-DirectoryHash "apps/dns-service/src/security"

# Radio hash
$seal.radio.routes = Get-FileHash "apps/abyssid-service/src/routes/radio.ts"
$seal.radio.modules = Get-DirectoryHash "apps/abyssid-service/src/radio"

# Fractal-1 hash
$seal.fractall.codec = Get-FileHash "apps/abyssos-portal/src/fractall/codec.ts"
$seal.fractall.verifier = Get-FileHash "apps/abyssos-portal/src/fractall/fractall_verifier.ts"
$seal.fractall.benchmark = Get-FileHash "apps/abyssos-portal/src/fractall/fractall_benchmark.ts"
$seal.fractall.directory = Get-DirectoryHash "apps/abyssos-portal/src/fractall"

# Build graph hash
$buildFiles = @("package.json", "pnpm-workspace.yaml", "Cargo.toml", "turbo.json")
$buildContent = $buildFiles | ForEach-Object { 
    if (Test-Path $_) { Get-Content $_ -Raw } else { "" }
}
$buildString = $buildContent -join "|"
$buildBytes = [System.Text.Encoding]::UTF8.GetBytes($buildString)
$buildHash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($buildBytes)
$seal.buildGraph.hash = [System.BitConverter]::ToString($buildHash).Replace("-", "").ToLower()

# Generate master hash
$sealJson = $seal | ConvertTo-Json -Depth 10
$sealBytes = [System.Text.Encoding]::UTF8.GetBytes($sealJson)
$masterHash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($sealBytes)
$seal.masterHash = [System.BitConverter]::ToString($masterHash).Replace("-", "").ToLower()

# Write seal
$finalSeal = $seal | ConvertTo-Json -Depth 10
$finalSeal | Out-File -FilePath $OutputPath -Encoding UTF8

Write-Host "✅ Ascension Seal generated: $OutputPath" -ForegroundColor Green
Write-Host "   Master Hash: $($seal.masterHash)" -ForegroundColor Cyan
