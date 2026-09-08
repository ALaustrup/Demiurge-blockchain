# Verify Fork Exists and Setup Local Clone
# This script checks if the fork exists, then sets up the local environment

param(
    [string]$ForkUrl = "https://github.com/ALaustrup/substrate.git",
    [string]$UpstreamUrl = "https://github.com/paritytech/substrate.git"
)

Write-Host "🔍 Verifying Substrate Fork..." -ForegroundColor Cyan
Write-Host ""

# Check if fork exists
Write-Host "Checking if fork exists at: $ForkUrl" -ForegroundColor Yellow
$forkCheck = git ls-remote $ForkUrl 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Fork not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fork the repository first:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://github.com/paritytech/substrate" -ForegroundColor White
    Write-Host "2. Click 'Fork' button (top right)" -ForegroundColor White
    Write-Host "3. Fork to: ALaustrup/substrate" -ForegroundColor White
    Write-Host "4. Wait for fork to complete" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ Fork found!" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
$currentDir = Get-Location
if (-not (Test-Path "blockchain\Cargo.toml")) {
    Write-Host "⚠️  Warning: Not in Demiurge-Blockchain root directory" -ForegroundColor Yellow
    Write-Host "   Current: $currentDir" -ForegroundColor Yellow
    Write-Host "   Expected: x:\Demiurge-Blockchain" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Continue anyway? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        exit 1
    }
}

# Run the fork setup script
Write-Host "🚀 Running fork setup script..." -ForegroundColor Cyan
Write-Host ""
& "$PSScriptRoot\fork-substrate.ps1" -ForkUrl $ForkUrl -UpstreamUrl $UpstreamUrl

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Setup complete! Next: Apply the fix in substrate/client/cli/Cargo.toml" -ForegroundColor Green
}
