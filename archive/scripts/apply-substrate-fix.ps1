# Apply Substrate Fork Fix to Demiurge Blockchain
# Updates Cargo.toml to use fixed Substrate fork

param(
    [string]$ForkUrl = "https://github.com/ALaustrup/substrate.git",
    [string]$BranchName = "fix/librocksdb-sys-conflict"
)

Write-Host "🔧 Applying Substrate Fork Fix" -ForegroundColor Cyan
Write-Host ""

$cargoToml = "blockchain\Cargo.toml"

if (-not (Test-Path $cargoToml)) {
    Write-Host "❌ Cargo.toml not found at $cargoToml" -ForegroundColor Red
    exit 1
}

# Backup original
$backup = "$cargoToml.backup"
Copy-Item $cargoToml $backup
Write-Host "📋 Backup created: $backup" -ForegroundColor Green

# Read current Cargo.toml
$content = Get-Content $cargoToml -Raw

# Check if patch section exists
if ($content -notmatch "\[patch\.crates-io\]") {
    # Add patch section before [workspace.dependencies]
    $patchSection = @"

# Use Substrate fork with librocksdb-sys fix
[patch.crates-io]
sc-cli = { git = "$ForkUrl", branch = "$BranchName", package = "sc-cli" }
sc-service = { git = "$ForkUrl", branch = "$BranchName", package = "sc-service" }
sc-client-db = { git = "$ForkUrl", branch = "$BranchName", package = "sc-client-db" }

"@
    
    # Insert before [workspace.dependencies]
    $content = $content -replace "(\[workspace\.dependencies\])", "$patchSection`$1"
} else {
    Write-Host "⚠️  Patch section already exists, updating..." -ForegroundColor Yellow
    # Update existing patch section
    $content = $content -replace "sc-cli = \{.*?\}", "sc-cli = { git = `"$ForkUrl`", branch = `"$BranchName`", package = `"sc-cli`" }"
    $content = $content -replace "sc-service = \{.*?\}", "sc-service = { git = `"$ForkUrl`", branch = `"$BranchName`", package = `"sc-service`" }"
    $content = $content -replace "sc-client-db = \{.*?\}", "sc-client-db = { git = `"$ForkUrl`", branch = `"$BranchName`", package = `"sc-client-db`" }"
}

# Write updated content
Set-Content -Path $cargoToml -Value $content -NoNewline

Write-Host "✅ Updated $cargoToml" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. cd blockchain"
Write-Host "2. cargo update"
Write-Host "3. cargo check --bin demiurge-node"
Write-Host ""
