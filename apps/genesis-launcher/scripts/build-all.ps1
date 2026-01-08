# Genesis Launcher Build Script (Windows)
# Builds all components with Qt 6

param(
    [string]$QtPath = "C:\Qt\6.10.1\mingw_64",
    [string]$BuildType = "Release"
)

$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $PSScriptRoot
$BuildDir = Join-Path $ProjectDir "build"

Write-Host "=== Genesis Launcher Build ===" -ForegroundColor Cyan
Write-Host "Qt Path: $QtPath"
Write-Host "Build Type: $BuildType"
Write-Host ""

# Setup environment
$env:Path = "C:\Qt\Tools\mingw1310_64\bin;C:\Qt\Tools\CMake_64\bin;C:\Qt\Tools\Ninja;$env:Path"
$env:CMAKE_PREFIX_PATH = $QtPath

# Clean build directory
if (Test-Path $BuildDir) {
    Write-Host "Cleaning previous build..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $BuildDir
}

New-Item -ItemType Directory -Force -Path $BuildDir | Out-Null

# Configure
Write-Host "Configuring CMake..." -ForegroundColor Green
cmake -S $ProjectDir -B $BuildDir -G Ninja `
    -DCMAKE_BUILD_TYPE=$BuildType `
    -DCMAKE_C_COMPILER="C:/Qt/Tools/mingw1310_64/bin/gcc.exe" `
    -DCMAKE_CXX_COMPILER="C:/Qt/Tools/mingw1310_64/bin/g++.exe"

if ($LASTEXITCODE -ne 0) {
    Write-Host "CMake configuration failed!" -ForegroundColor Red
    exit 1
}

# Build
Write-Host "Building..." -ForegroundColor Green
ninja -C $BuildDir

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# List built executables
Write-Host ""
Write-Host "=== Build Complete ===" -ForegroundColor Cyan
Get-ChildItem -Path $BuildDir -Filter "*.exe" | ForEach-Object {
    $size = "{0:N2} MB" -f ($_.Length / 1MB)
    Write-Host "  $($_.Name): $size" -ForegroundColor Green
}

Write-Host ""
Write-Host "Run 'python scripts/deploy.py' to create distribution packages" -ForegroundColor Yellow
