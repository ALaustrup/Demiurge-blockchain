#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Complete build script for DEMIURGE QOR Launcher and Installer
    
.DESCRIPTION
    This script builds the launcher, bundles all dependencies, prepares installer files,
    and creates a polished installer package ready for distribution.
    
.PARAMETER QtPath
    Path to Qt installation (default: C:\Qt\6.10.1\msvc2022_64)
    
.PARAMETER Version
    Version number (default: 1.0.0)
    
.PARAMETER BuildType
    Build type: Release or Debug (default: Release)
    
.PARAMETER SkipBuild
    Skip application build (use existing build)
    
.PARAMETER SkipInstaller
    Skip installer creation (only build app)
    
.EXAMPLE
    .\build-installer-complete.ps1 -Version "1.0.0"
    
.EXAMPLE
    .\build-installer-complete.ps1 -QtPath "C:\Qt\6.10.1\mingw_64" -SkipBuild
#>

param(
    [string]$QtPath = "C:\Qt\6.10.1\msvc2022_64",
    [string]$Version = "1.0.0",
    [ValidateSet("Release", "Debug")]
    [string]$BuildType = "Release",
    [switch]$SkipBuild,
    [switch]$SkipInstaller
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
function Write-Step { param($msg) Write-Host "`n▶ $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }
function Write-Warning { param($msg) Write-Host "⚠ $msg" -ForegroundColor Yellow }

# Script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$BuildDir = Join-Path $ProjectRoot "build-installer"
$ReleaseDir = Join-Path $BuildDir $BuildType
$InstallerData = Join-Path $ProjectRoot "installer\packages\com.demiurge.qor\data"
$AssetsDir = Join-Path $ProjectRoot "assets"

Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║     DEMIURGE QOR Launcher & Installer Build System          ║
║                  Version $Version                              ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Magenta

# ============================================================================
# STEP 1: Verify Prerequisites
# ============================================================================
Write-Step "Verifying prerequisites..."

# Check Qt
if (-not (Test-Path $QtPath)) {
    Write-Error "Qt not found at: $QtPath"
    Write-Host "Please install Qt 6.10+ or specify -QtPath parameter" -ForegroundColor Yellow
    exit 1
}

$QtBin = Join-Path $QtPath "bin"
$QtTools = "C:\Qt\Tools\QtInstallerFramework\4.6\bin"
$BinaryCreator = Join-Path $QtTools "binarycreator.exe"

if (-not (Test-Path $BinaryCreator)) {
    Write-Warning "Qt Installer Framework not found at: $QtTools"
    Write-Host "Download from: https://download.qt.io/official_releases/qt-installer-framework/" -ForegroundColor Yellow
    $SkipInstaller = $true
}

# Check CMake
$cmake = Get-Command cmake -ErrorAction SilentlyContinue
if (-not $cmake) {
    Write-Error "CMake not found in PATH"
    exit 1
}

Write-Success "Prerequisites verified"

# ============================================================================
# STEP 2: Build Application
# ============================================================================
if (-not $SkipBuild) {
    Write-Step "Building application ($BuildType)..."
    
    # Create build directory
    if (-not (Test-Path $BuildDir)) {
        New-Item -ItemType Directory -Path $BuildDir -Force | Out-Null
    }
    
    Push-Location $BuildDir
    
    try {
        # Configure
        Write-Host "  Configuring CMake..." -ForegroundColor Gray
        cmake .. `
            -G "Visual Studio 17 2022" `
            -A x64 `
            -DCMAKE_PREFIX_PATH="$QtPath" `
            -DCMAKE_BUILD_TYPE=$BuildType `
            2>&1 | Out-Null
        
        if ($LASTEXITCODE -ne 0) {
            throw "CMake configuration failed"
        }
        
        # Build
        Write-Host "  Building..." -ForegroundColor Gray
        cmake --build . --config $BuildType --parallel
        
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed"
        }
        
        Write-Success "Application built successfully"
    }
    catch {
        Write-Error "Build failed: $_"
        Pop-Location
        exit 1
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Warning "Skipping build (using existing)"
}

# Verify executable exists
$ExePath = Join-Path $ReleaseDir "GenesisLauncher.exe"
if (-not (Test-Path $ExePath)) {
    Write-Error "Executable not found: $ExePath"
    exit 1
}

Write-Success "Executable found: $ExePath"

# ============================================================================
# STEP 3: Deploy Qt Dependencies
# ============================================================================
Write-Step "Deploying Qt dependencies..."

$Windeployqt = Join-Path $QtBin "windeployqt.exe"
if (-not (Test-Path $Windeployqt)) {
    Write-Error "windeployqt not found: $Windeployqt"
    exit 1
}

# Create installer data directory
if (Test-Path $InstallerData) {
    Remove-Item -Recurse -Force $InstallerData
}
New-Item -ItemType Directory -Path $InstallerData -Force | Out-Null

# Copy executable
Copy-Item $ExePath $InstallerData

# Deploy Qt dependencies
Write-Host "  Running windeployqt..." -ForegroundColor Gray
$QmlDir = Join-Path $ProjectRoot "src\qml"
& $Windeployqt `
    --qmldir $QmlDir `
    --release `
    --compiler-runtime `
    --no-translations `
    (Join-Path $InstallerData "GenesisLauncher.exe")

if ($LASTEXITCODE -ne 0) {
    Write-Warning "windeployqt completed with warnings"
}

Write-Success "Qt dependencies deployed"

# ============================================================================
# STEP 4: Copy Resources
# ============================================================================
Write-Step "Copying resources..."

# Copy video (from assets or fallback)
$VideoSource = Join-Path $AssetsDir "intro.mp4"
$VideoDest = Join-Path $InstallerData "videos\intro.mp4"

if (Test-Path $VideoSource) {
    $videoDir = Split-Path -Parent $VideoDest
    if (-not (Test-Path $videoDir)) {
        New-Item -ItemType Directory -Path $videoDir -Force | Out-Null
    }
    Copy-Item $VideoSource $VideoDest -Force
    Write-Success "Intro video copied"
}
else {
    Write-Warning "Intro video not found at: $VideoSource"
}

# Copy icons if they exist
$IconsSource = Join-Path $ProjectRoot "src\resources\icons"
if (Test-Path $IconsSource) {
    Get-ChildItem $IconsSource -Filter "*.ico","*.png" | ForEach-Object {
        Copy-Item $_.FullName $InstallerData
    }
    Write-Success "Icons copied"
}

Write-Success "Resources copied"

# ============================================================================
# STEP 5: Verify Installation Package
# ============================================================================
Write-Step "Verifying installation package..."

$RequiredFiles = @(
    "GenesisLauncher.exe",
    "Qt6Core.dll",
    "Qt6Qml.dll",
    "Qt6Quick.dll"
)

$MissingFiles = @()
foreach ($file in $RequiredFiles) {
    $filePath = Join-Path $InstallerData $file
    if (-not (Test-Path $filePath)) {
        $MissingFiles += $file
    }
}

if ($MissingFiles.Count -gt 0) {
    Write-Error "Missing required files:"
    $MissingFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

Write-Success "Installation package verified"

# ============================================================================
# STEP 6: Create Installer
# ============================================================================
if (-not $SkipInstaller) {
    Write-Step "Creating installer..."
    
    $InstallerName = "DEMIURGE-QOR-$Version-Setup.exe"
    $InstallerPath = Join-Path $ProjectRoot $InstallerName
    
    $ConfigPath = Join-Path $ProjectRoot "installer\config\config.xml"
    $PackagesPath = Join-Path $ProjectRoot "installer\packages"
    
    Write-Host "  Running binarycreator..." -ForegroundColor Gray
    & $BinaryCreator `
        --offline-only `
        -c $ConfigPath `
        -p $PackagesPath `
        $InstallerPath
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Installer creation failed"
        exit 1
    }
    
    if (Test-Path $InstallerPath) {
        $SizeMB = [math]::Round((Get-Item $InstallerPath).Length / 1MB, 2)
        Write-Success "Installer created: $InstallerName ($SizeMB MB)"
        Write-Host "  Location: $InstallerPath" -ForegroundColor Gray
    }
    else {
        Write-Error "Installer file not found after creation"
        exit 1
    }
}
else {
    Write-Warning "Skipping installer creation"
}

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║                    Build Complete!                           ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green

Write-Host "Executable: $ExePath" -ForegroundColor Cyan
Write-Host "Installer Data: $InstallerData" -ForegroundColor Cyan
if (-not $SkipInstaller) {
    Write-Host "Installer: $InstallerPath" -ForegroundColor Cyan
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "  1. Test the installer: .\$InstallerName" -ForegroundColor White
    Write-Host "  2. Verify installation works correctly" -ForegroundColor White
    Write-Host "  3. Test launcher startup and video playback" -ForegroundColor White
}
