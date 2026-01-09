#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test the DEMIURGE QOR installer
    
.DESCRIPTION
    This script tests the installer by:
    1. Running the installer in silent mode
    2. Verifying installation
    3. Testing launcher startup
    4. Cleaning up test installation
    
.PARAMETER InstallerPath
    Path to the installer executable
    
.PARAMETER TestDir
    Test installation directory (default: $env:TEMP\DemiurgeQOR-Test)
    
.PARAMETER SkipCleanup
    Don't remove test installation after testing
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$InstallerPath,
    [string]$TestDir = "$env:TEMP\DemiurgeQOR-Test",
    [switch]$SkipCleanup
)

$ErrorActionPreference = "Stop"

function Write-Step { param($msg) Write-Host "`n▶ $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }

Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║          DEMIURGE QOR Installer Test Suite                   ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Magenta

# Verify installer exists
if (-not (Test-Path $InstallerPath)) {
    Write-Error "Installer not found: $InstallerPath"
    exit 1
}

$InstallerName = Split-Path -Leaf $InstallerPath
Write-Host "Testing installer: $InstallerName" -ForegroundColor Cyan

# ============================================================================
# STEP 1: Silent Installation
# ============================================================================
Write-Step "Step 1: Running silent installation..."

$InstallArgs = @(
    "--verbose",
    "--accept-licenses",
    "--confirm-command",
    "install",
    "--root", $TestDir
)

try {
    $process = Start-Process -FilePath $InstallerPath -ArgumentList $InstallArgs -Wait -PassThru -NoNewWindow
    
    if ($process.ExitCode -ne 0) {
        Write-Error "Installation failed with exit code: $($process.ExitCode)"
        exit 1
    }
    
    Write-Success "Installation completed"
}
catch {
    Write-Error "Installation failed: $_"
    exit 1
}

# ============================================================================
# STEP 2: Verify Installation
# ============================================================================
Write-Step "Step 2: Verifying installation..."

$ExpectedExe = Join-Path $TestDir "GenesisLauncher.exe"
if (-not (Test-Path $ExpectedExe)) {
    Write-Error "Executable not found: $ExpectedExe"
    exit 1
}
Write-Success "Executable found"

# Check for Qt DLLs
$RequiredDlls = @("Qt6Core.dll", "Qt6Qml.dll", "Qt6Quick.dll")
$MissingDlls = @()
foreach ($dll in $RequiredDlls) {
    $dllPath = Join-Path $TestDir $dll
    if (-not (Test-Path $dllPath)) {
        $MissingDlls += $dll
    }
}

if ($MissingDlls.Count -gt 0) {
    Write-Error "Missing required DLLs: $($MissingDlls -join ', ')"
    exit 1
}
Write-Success "All required DLLs present"

# Check for video
$VideoPath = Join-Path $TestDir "videos\intro.mp4"
if (Test-Path $VideoPath) {
    Write-Success "Intro video found"
}
else {
    Write-Host "⚠ Intro video not found (optional)" -ForegroundColor Yellow
}

# ============================================================================
# STEP 3: Test Launcher Startup
# ============================================================================
Write-Step "Step 3: Testing launcher startup..."

try {
    # Start launcher in background
    $launcher = Start-Process -FilePath $ExpectedExe -PassThru -WindowStyle Hidden
    
    # Wait a moment for startup
    Start-Sleep -Seconds 3
    
    # Check if process is still running
    if (-not $launcher.HasExited) {
        Write-Success "Launcher started successfully"
        
        # Stop launcher
        Stop-Process -Id $launcher.Id -Force
        Write-Success "Launcher stopped cleanly"
    }
    else {
        Write-Error "Launcher exited immediately (may indicate an error)"
        exit 1
    }
}
catch {
    Write-Error "Failed to start launcher: $_"
    exit 1
}

# ============================================================================
# STEP 4: Cleanup
# ============================================================================
if (-not $SkipCleanup) {
    Write-Step "Step 4: Cleaning up test installation..."
    
    try {
        Remove-Item -Recurse -Force $TestDir -ErrorAction Stop
        Write-Success "Test installation removed"
    }
    catch {
        Write-Host "⚠ Could not remove test installation: $_" -ForegroundColor Yellow
        Write-Host "  Manual cleanup required: $TestDir" -ForegroundColor Yellow
    }
}
else {
    Write-Host "`nTest installation preserved at: $TestDir" -ForegroundColor Cyan
}

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║                    All Tests Passed!                         ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green

Write-Success "Installer test completed successfully"
Write-Host "`nThe installer is ready for distribution!" -ForegroundColor Cyan
