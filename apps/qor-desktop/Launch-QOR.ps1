# QOR Desktop Launcher
# Simple script to launch the QOR Desktop application

param(
    [switch]$Rebuild
)

$ErrorActionPreference = "Stop"
$BuildDir = "$PSScriptRoot\build"
$ExePath = "$BuildDir\QOR.exe"

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    QOR DESKTOP - Ancient Code Meets Glass" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if executable exists
if (-not (Test-Path $ExePath)) {
    Write-Host "❌ QOR.exe not found at: $ExePath" -ForegroundColor Red
    Write-Host "   Please build the project first." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Run this to build:" -ForegroundColor Yellow
    Write-Host "   .\Rebuild-QOR.ps1" -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

# Rebuild if requested
if ($Rebuild) {
    Write-Host "🔨 Rebuilding QOR Desktop..." -ForegroundColor Yellow
    Write-Host ""
    
    Push-Location $BuildDir
    try {
        cmake --build . --config Release -j 2
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed"
        }
        Write-Host ""
        Write-Host "✅ Build successful!" -ForegroundColor Green
        Write-Host ""
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
}

# Get file info
$FileInfo = Get-Item $ExePath
$FileSize = "{0:N0} KB" -f ($FileInfo.Length / 1KB)
$LastModified = $FileInfo.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")

Write-Host "📦 Executable: $ExePath" -ForegroundColor Gray
Write-Host "📏 Size: $FileSize" -ForegroundColor Gray
Write-Host "🕐 Built: $LastModified" -ForegroundColor Gray
Write-Host ""

Write-Host "🚀 Launching QOR Desktop..." -ForegroundColor Green
Write-Host ""
Write-Host "⌨️  Keyboard Shortcuts:" -ForegroundColor Cyan
Write-Host "   Ctrl+T         → Terminal" -ForegroundColor White
Write-Host "   Ctrl+W         → Wallet" -ForegroundColor White
Write-Host "   Ctrl+S         → Settings" -ForegroundColor White
Write-Host "   Ctrl+E         → Explorer" -ForegroundColor White
Write-Host "   Ctrl+Shift+S   → System Monitor" -ForegroundColor White
Write-Host "   Ctrl+Q         → Quit" -ForegroundColor White
Write-Host ""

# Launch the application
try {
    Start-Process -FilePath $ExePath -WorkingDirectory $BuildDir
    Write-Host "✅ QOR Desktop launched successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "   The window should appear shortly..." -ForegroundColor Yellow
    Write-Host "   If you don't see it, check your taskbar!" -ForegroundColor Yellow
    Write-Host ""
}
catch {
    Write-Host "❌ Failed to launch: $_" -ForegroundColor Red
    Write-Host ""
    pause
    exit 1
}

# Wait a moment to see output
Start-Sleep -Seconds 2
