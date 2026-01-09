# Manual libtorrent installation script
# Run this in a separate PowerShell window to avoid Cursor issues

param(
    [switch]$SkipBoost = $false
)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TORRNT - Manual libtorrent Installation" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$vcpkgRoot = "$env:USERPROFILE\vcpkg"
$vcpkgExe = Join-Path $vcpkgRoot "vcpkg.exe"

if (-not (Test-Path $vcpkgExe)) {
    Write-Host "[ERROR] vcpkg not found at: $vcpkgRoot" -ForegroundColor Red
    Write-Host "Please install vcpkg first using install-libtorrent.ps1" -ForegroundColor Yellow
    exit 1
}

# Clean up any locked files
Write-Host "[1/3] Cleaning up locked files..." -ForegroundColor Cyan
Get-ChildItem "$vcpkgRoot\buildtrees" -Recurse -Filter "stdout-*.log" -ErrorAction SilentlyContinue | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddHours(-1) } | 
    Remove-Item -Force -ErrorAction SilentlyContinue

# Check if Boost is already installed (most time-consuming part)
Write-Host "[2/3] Checking Boost installation..." -ForegroundColor Cyan
$boostInstalled = & $vcpkgExe list | Select-String "boost-" | Measure-Object | Select-Object -ExpandProperty Count

if ($boostInstalled -lt 10 -and -not $SkipBoost) {
    Write-Host "Boost not fully installed. This will take 30-45 minutes..." -ForegroundColor Yellow
    Write-Host "Installing Boost dependencies first..." -ForegroundColor Cyan
    
    # Install Boost in smaller chunks to avoid timeouts
    & $vcpkgExe install boost-system:x64-windows boost-thread:x64-windows boost-chrono:x64-windows
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[WARN] Some Boost packages failed, continuing..." -ForegroundColor Yellow
    }
}

# Install libtorrent
Write-Host "[3/3] Installing libtorrent..." -ForegroundColor Cyan
Write-Host "This may take 10-20 minutes depending on dependencies..." -ForegroundColor Yellow

& $vcpkgExe install libtorrent:x64-windows --triplet x64-windows

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[OK] libtorrent installed successfully!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Rebuild TORRNT with:" -ForegroundColor White
    Write-Host "   cd C:\Repos\DEMIURGE\apps\torrnt\build" -ForegroundColor Gray
    Write-Host "   cmake .. -G `"Visual Studio 17 2022`" -A x64 `" -ForegroundColor Gray
    Write-Host "     -DCMAKE_PREFIX_PATH=`"C:\Qt\6.10.1\msvc2022_64`" `" -ForegroundColor Gray
    Write-Host "     -DCMAKE_TOOLCHAIN_FILE=`"$vcpkgRoot\scripts\buildsystems\vcpkg.cmake`"" -ForegroundColor Gray
    Write-Host "   cmake --build . --config Release" -ForegroundColor Gray
} else {
    Write-Host "`n[ERROR] Installation failed. Check the output above." -ForegroundColor Red
    Write-Host "You may need to run this script multiple times if Boost installation is incomplete." -ForegroundColor Yellow
    exit 1
}
