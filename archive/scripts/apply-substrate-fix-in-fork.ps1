# Apply the librocksdb-sys fix in the Substrate fork
# Updates sc-cli to use sc-client-db v0.51.0

param(
    [string]$SubstrateDir = "substrate",
    [string]$TargetVersion = "0.51.0"
)

Write-Host "Applying Substrate Fix in Fork" -ForegroundColor Cyan
Write-Host ""

# Check if substrate directory exists
if (-not (Test-Path $SubstrateDir)) {
    Write-Host "ERROR: Substrate directory not found: $SubstrateDir" -ForegroundColor Red
    Write-Host "   Run fork-substrate.ps1 first!" -ForegroundColor Yellow
    exit 1
}

$cargoToml = Join-Path $SubstrateDir "client\cli\Cargo.toml"

if (-not (Test-Path $cargoToml)) {
    Write-Host "ERROR: Cargo.toml not found at: $cargoToml" -ForegroundColor Red
    exit 1
}

# Backup original
$backup = "$cargoToml.backup"
Copy-Item $cargoToml $backup
Write-Host "Backup created: $backup" -ForegroundColor Green

# Read current Cargo.toml line by line
$lines = Get-Content $cargoToml
$updated = $false

for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    
    # Check if this line contains sc-client-db dependency
    if ($line -match 'sc-client-db') {
        # Try to find version number in the line (handles versions like "0.10.0-dev" or "0.50.0")
        if ($line -match 'version\s*=\s*"([^"]+)"') {
            $oldVersion = $matches[1]
            Write-Host "Found sc-client-db version: $oldVersion" -ForegroundColor Yellow
            
            # Extract just the numeric version part for comparison
            $numericVersion = $oldVersion -replace '-.*$', ''
            $targetNumeric = $TargetVersion -replace '-.*$', ''
            
            if ($numericVersion -eq $targetNumeric) {
                Write-Host "Already at target version $TargetVersion" -ForegroundColor Green
                Remove-Item $backup
                exit 0
            }
            
            # Replace the entire version string
            $newLine = $line -replace 'version\s*=\s*"[^"]+"', "version = `"$TargetVersion`""
            $lines[$i] = $newLine
            Write-Host "Updated line $($i+1): $newLine" -ForegroundColor Green
            $updated = $true
        }
    }
}

if (-not $updated) {
    Write-Host "ERROR: Could not update sc-client-db version automatically" -ForegroundColor Red
    Write-Host "   Please edit $cargoToml manually:" -ForegroundColor Yellow
    Write-Host "   Change: sc-client-db = { version = X.X.X, ... }" -ForegroundColor White
    Write-Host "   To:     sc-client-db = { version = $TargetVersion, ... }" -ForegroundColor White
    Remove-Item $backup
    exit 1
}

# Write updated content
$content = $lines -join "`r`n"
Set-Content -Path $cargoToml -Value $content -NoNewline

Write-Host ""
Write-Host "Fix applied to $cargoToml" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. cd $SubstrateDir" -ForegroundColor White
Write-Host "2. cargo build -p sc-cli" -ForegroundColor White
Write-Host "3. If successful, commit and push:" -ForegroundColor White
Write-Host "   git add client/cli/Cargo.toml" -ForegroundColor Gray
Write-Host "   git commit -m 'fix: Update sc-cli to use sc-client-db v0.51.0'" -ForegroundColor Gray
Write-Host "   git push origin fix/librocksdb-sys-conflict" -ForegroundColor Gray
Write-Host ""
