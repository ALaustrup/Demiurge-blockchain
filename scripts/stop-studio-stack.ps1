# Stop Demiurge Studio background processes (best-effort via saved PIDs).

$ErrorActionPreference = "Continue"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$PidFile = Join-Path $RepoRoot "projects\.studio\processes.json"

if (-not (Test-Path $PidFile)) {
    Write-Host "No Studio process file found. Close minimized PowerShell windows manually." -ForegroundColor Yellow
    exit 0
}

try {
    $data = Get-Content $PidFile -Raw | ConvertFrom-Json
    foreach ($proc in $data.processes) {
        try {
            Stop-Process -Id $proc.pid -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped $($proc.title) (PID $($proc.pid))" -ForegroundColor DarkGray
        } catch { }
    }
    Remove-Item $PidFile -Force
    Write-Host "Studio stack processes stopped." -ForegroundColor Green
} catch {
    Write-Host "Could not read process file. Close Studio PowerShell windows manually." -ForegroundColor Yellow
}
