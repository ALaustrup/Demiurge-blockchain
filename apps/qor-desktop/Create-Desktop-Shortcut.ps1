# Create Desktop Shortcut for QOR Desktop
# Run this once to add a shortcut to your desktop

$ErrorActionPreference = "Stop"

$ExePath = Join-Path $PSScriptRoot "build\QOR.exe"
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "QOR Desktop.lnk"

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "    QOR DESKTOP - Shortcut Creator" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if executable exists
if (-not (Test-Path $ExePath)) {
    Write-Host "❌ QOR.exe not found at: $ExePath" -ForegroundColor Red
    Write-Host "   Please build the project first." -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "📍 Executable: $ExePath" -ForegroundColor Gray
Write-Host "🖥️  Desktop: $DesktopPath" -ForegroundColor Gray
Write-Host ""

# Create shortcut
try {
    $WScriptShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = $ExePath
    $Shortcut.WorkingDirectory = Split-Path $ExePath
    $Shortcut.Description = "QOR Desktop - Ancient Code Meets Ethereal Glass"
    $Shortcut.IconLocation = $ExePath
    $Shortcut.Save()
    
    Write-Host "✅ Desktop shortcut created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "   → $ShortcutPath" -ForegroundColor White
    Write-Host ""
    Write-Host "You can now launch QOR Desktop from your desktop!" -ForegroundColor Yellow
    Write-Host ""
}
catch {
    Write-Host "❌ Failed to create shortcut: $_" -ForegroundColor Red
    Write-Host ""
    pause
    exit 1
}

pause
