# Substrate Fork Setup Script
# Clones Substrate fork and sets up fix branch

param(
    [string]$ForkUrl = "https://github.com/ALaustrup/substrate.git",
    [string]$UpstreamUrl = "https://github.com/paritytech/substrate.git",
    [string]$BranchName = "fix/librocksdb-sys-conflict",
    [string]$SubstrateVersion = "v0.43.0"
)

Write-Host "🔧 Substrate Fork Setup Script" -ForegroundColor Cyan
Write-Host ""

# Check if substrate directory exists
if (Test-Path "substrate") {
    Write-Host "⚠️  Substrate directory already exists" -ForegroundColor Yellow
    $response = Read-Host "Remove and re-clone? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Remove-Item -Recurse -Force substrate
    } else {
        Write-Host "Using existing substrate directory"
        Set-Location substrate
        return
    }
}

# Clone fork
Write-Host "📥 Cloning Substrate fork..." -ForegroundColor Cyan
git clone $ForkUrl substrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to clone fork. Make sure you've forked the repository on GitHub." -ForegroundColor Red
    Write-Host "   Fork URL: $ForkUrl" -ForegroundColor Yellow
    exit 1
}

Set-Location substrate

# Add upstream remote
Write-Host "🔗 Adding upstream remote..." -ForegroundColor Cyan
git remote add upstream $UpstreamUrl 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Upstream remote may already exist" -ForegroundColor Yellow
}

# Fetch upstream
Write-Host "📥 Fetching upstream..." -ForegroundColor Cyan
git fetch upstream

# Check if version tag exists
Write-Host "🔍 Checking for Substrate version $SubstrateVersion..." -ForegroundColor Cyan
$tagExists = git tag -l $SubstrateVersion
if ($tagExists) {
    Write-Host "✅ Found tag $SubstrateVersion" -ForegroundColor Green
    git checkout -b $BranchName $SubstrateVersion
} else {
    Write-Host "⚠️  Tag $SubstrateVersion not found, using upstream/master" -ForegroundColor Yellow
    git checkout -b $BranchName upstream/master
}

Write-Host ""
Write-Host "✅ Fork setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit client/cli/Cargo.toml to update sc-client-db version"
Write-Host "2. Run: cargo build -p sc-cli"
Write-Host "3. Test the fix"
Write-Host "4. Commit and push: git push origin $BranchName"
Write-Host ""
