# Fix all MultiEffect usage in QML files
$files = @(
    "src\qml\components\FlameButton.qml",
    "src\qml\components\BreathingGlow.qml",
    "src\qml\effects\VoidBackground.qml",
    "src\qml\dock\QORButton.qml",
    "src\qml\dock\QDockItem.qml"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Fixing: $file"
        $content = Get-Content $file -Raw
        
        # Comment out layer.enabled lines that are followed by layer.effect
        $content = $content -replace 'layer\.enabled:\s*([^\n]+)\s*\n\s*layer\.effect:', '// layer.enabled: $1`n        // layer.effect:'
        
        # Comment out MultiEffect blocks with proper indentation
        $content = $content -replace '(//)?\s*layer\.effect:\s*MultiEffect\s*\{([^\}]*)\}', '// layer.effect: MultiEffect {$2// }'
        
        Set-Content $file $content
        Write-Host "  Done" -ForegroundColor Green
    }
}

Write-Host "`nAll files fixed!" -ForegroundColor Cyan
