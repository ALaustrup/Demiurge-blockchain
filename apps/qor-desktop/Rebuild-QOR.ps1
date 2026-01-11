# QOR Desktop Rebuild Script
# WARNING: Close Cursor IDE before running this to avoid crashes!

param(
    [switch]$Clean,
    [int]$Jobs = 2
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
$BuildDir = "$ProjectRoot\build"

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    QOR DESKTOP - REBUILD SCRIPT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if Cursor is running
$CursorRunning = Get-Process | Where-Object { $_.ProcessName -like "*Cursor*" }
if ($CursorRunning) {
    Write-Host "⚠️  WARNING: Cursor IDE is currently running!" -ForegroundColor Yellow
    Write-Host "   Building while Cursor is open may cause crashes." -ForegroundColor Yellow
    Write-Host ""
    $Continue = Read-Host "   Continue anyway? (y/N)"
    if ($Continue -ne 'y' -and $Continue -ne 'Y') {
        Write-Host ""
        Write-Host "   Build cancelled. Please close Cursor and try again." -ForegroundColor Yellow
        Write-Host ""
        pause
        exit 0
    }
    Write-Host ""
}

# Clean build if requested
if ($Clean) {
    Write-Host "🧹 Cleaning build directory..." -ForegroundColor Yellow
    if (Test-Path $BuildDir) {
        Remove-Item -Recurse -Force $BuildDir
        Write-Host "✅ Build directory cleaned" -ForegroundColor Green
    }
    Write-Host ""
}

# Create build directory if needed
if (-not (Test-Path $BuildDir)) {
    Write-Host "📁 Creating build directory..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $BuildDir | Out-Null
    Write-Host ""
    
    Write-Host "🔧 Configuring CMake..." -ForegroundColor Cyan
    Push-Location $BuildDir
    try {
        cmake .. -G "Ninja" -DCMAKE_BUILD_TYPE=Release
        if ($LASTEXITCODE -ne 0) {
            throw "CMake configuration failed"
        }
    }
    catch {
        Write-Host "❌ CMake configuration failed: $_" -ForegroundColor Red
        Pop-Location
        pause
        exit 1
    }
    Pop-Location
    Write-Host ""
}

# Build
Write-Host "🔨 Building QOR Desktop (using $Jobs cores)..." -ForegroundColor Yellow
Write-Host "   This may take 10-30 seconds..." -ForegroundColor Gray
Write-Host ""

Push-Location $BuildDir
try {
    $StartTime = Get-Date
    
    cmake --build . --config Release -j $Jobs
    
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed with exit code $LASTEXITCODE"
    }
    
    $EndTime = Get-Date
    $Duration = ($EndTime - $StartTime).TotalSeconds
    
    Write-Host ""
    Write-Host "✅ Build completed successfully in $([math]::Round($Duration, 1)) seconds!" -ForegroundColor Green
    Write-Host ""
    
    # Show executable info
    if (Test-Path "QOR.exe") {
        $FileInfo = Get-Item "QOR.exe"
        $FileSize = "{0:N0} KB" -f ($FileInfo.Length / 1KB)
        Write-Host "📦 Executable: $($FileInfo.FullName)" -ForegroundColor Cyan
        Write-Host "📏 Size: $FileSize" -ForegroundColor Cyan
        Write-Host "🕐 Built: $($FileInfo.LastWriteTime)" -ForegroundColor Cyan
        Write-Host ""
    }
}
catch {
    Write-Host ""
    Write-Host "❌ Build failed: $_" -ForegroundColor Red
    Write-Host ""
    Pop-Location
    pause
    exit 1
}
Pop-Location

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  BUILD SUCCESSFUL - QOR Desktop Ready!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "To launch QOR Desktop:" -ForegroundColor Yellow
Write-Host "  • Double-click: Launch-QOR.bat" -ForegroundColor White
Write-Host "  • Or run:       .\Launch-QOR.ps1" -ForegroundColor White
Write-Host ""

pause
