# Setup Substrate from ZIP file
# Extracts ZIP and sets up Git repository with correct remotes

param(
    [Parameter(Mandatory=$true)]
    [string]$ZipPath,
    
    [string]$ForkUrl = "https://github.com/ALaustrup/substrate.git",
    [string]$UpstreamUrl = "https://github.com/paritytech/substrate.git",
    [string]$BranchName = "fix/librocksdb-sys-conflict"
)

Write-Host "📦 Setting up Substrate from ZIP" -ForegroundColor Cyan
Write-Host ""

# Check if ZIP exists
if (-not (Test-Path $ZipPath)) {
    Write-Host "❌ ZIP file not found: $ZipPath" -ForegroundColor Red
    exit 1
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$substrateDir = Join-Path $projectRoot "substrate"

# Check if substrate directory already exists
if (Test-Path $substrateDir) {
    Write-Host "⚠️  Substrate directory already exists: $substrateDir" -ForegroundColor Yellow
    $response = Read-Host "Remove and extract fresh? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Remove-Item -Recurse -Force $substrateDir
    } else {
        Write-Host "Using existing directory"
        Set-Location $substrateDir
        return
    }
}

# Extract ZIP
Write-Host "📥 Extracting ZIP file..." -ForegroundColor Cyan
$tempExtract = Join-Path $env:TEMP "substrate-extract-$(Get-Random)"
New-Item -ItemType Directory -Path $tempExtract -Force | Out-Null

try {
    Expand-Archive -Path $ZipPath -DestinationPath $tempExtract -Force
    
    # Find the actual substrate directory (might be substrate-main or substrate-{branch})
    $extractedDirs = Get-ChildItem -Path $tempExtract -Directory
    $sourceDir = $extractedDirs | Where-Object { 
        $_.Name -match "^substrate" -and (Test-Path (Join-Path $_.FullName ".git"))
    } | Select-Object -First 1
    
    if (-not $sourceDir) {
        # Try without .git check (might be a ZIP without Git history)
        $sourceDir = $extractedDirs | Where-Object { 
            $_.Name -match "^substrate"
        } | Select-Object -First 1
    }
    
    if (-not $sourceDir) {
        Write-Host "❌ Could not find substrate directory in ZIP" -ForegroundColor Red
        Write-Host "   Found directories: $($extractedDirs.Name -join ', ')" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ Found: $($sourceDir.Name)" -ForegroundColor Green
    
    # Move to final location
    Move-Item -Path $sourceDir.FullName -Destination $substrateDir
    Write-Host "✅ Extracted to: $substrateDir" -ForegroundColor Green
    
} finally {
    # Cleanup temp directory
    if (Test-Path $tempExtract) {
        Remove-Item -Recurse -Force $tempExtract -ErrorAction SilentlyContinue
    }
}

# Setup Git repository
Set-Location $substrateDir

# Check if it's a Git repository
if (-not (Test-Path ".git")) {
    Write-Host "⚠️  Not a Git repository, initializing..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit from ZIP"
}

# Check remotes
$remotes = git remote -v
if ($remotes -notmatch "origin") {
    Write-Host "🔗 Adding origin remote..." -ForegroundColor Cyan
    git remote add origin $ForkUrl
} else {
    Write-Host "✅ Origin remote already exists" -ForegroundColor Green
}

if ($remotes -notmatch "upstream") {
    Write-Host "🔗 Adding upstream remote..." -ForegroundColor Cyan
    git remote add upstream $UpstreamUrl
} else {
    Write-Host "✅ Upstream remote already exists" -ForegroundColor Green
}

# Fetch upstream
Write-Host "📥 Fetching upstream..." -ForegroundColor Cyan
git fetch upstream 2>&1 | Out-Null

# Create fix branch
Write-Host "🌿 Creating fix branch..." -ForegroundColor Cyan
$currentBranch = git branch --show-current
if ($currentBranch -ne $BranchName) {
    # Try to checkout from upstream/master or create new branch
    git checkout -b $BranchName upstream/master 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        git checkout -b $BranchName 2>&1 | Out-Null
    }
}

Write-Host ""
Write-Host "✅ Substrate setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Location: $substrateDir" -ForegroundColor Cyan
Write-Host "Branch: $BranchName" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: .\scripts\apply-substrate-fix-in-fork.ps1" -ForegroundColor White
Write-Host "2. Test: cd substrate; cargo build -p sc-cli" -ForegroundColor White
Write-Host ""
