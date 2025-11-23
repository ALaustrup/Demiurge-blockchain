# Stop all Demiurge servers
# Usage: .\stop-all.ps1

Write-Host "🛑 Stopping all Demiurge servers..." -ForegroundColor Red
Write-Host ""

$jobs = Get-Job

if ($jobs.Count -eq 0) {
    Write-Host "No running jobs found." -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $($jobs.Count) job(s):" -ForegroundColor Cyan
foreach ($job in $jobs) {
    Write-Host "   • $($job.Name) (ID: $($job.Id), State: $($job.State))" -ForegroundColor White
}
Write-Host ""

# Stop all jobs
Write-Host "Stopping jobs..." -ForegroundColor Yellow
Get-Job | Stop-Job

# Wait a moment for graceful shutdown
Start-Sleep -Seconds 2

# Remove jobs
Write-Host "Removing jobs..." -ForegroundColor Yellow
Get-Job | Remove-Job

Write-Host ""
Write-Host "✅ All servers stopped." -ForegroundColor Green

# Also try to kill processes by port (in case jobs didn't clean up)
Write-Host ""
Write-Host "Checking for processes on ports 8545, 4000, 3000..." -ForegroundColor Cyan

$ports = @(8545, 4000, 3000)
foreach ($port in $ports) {
    $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($processes) {
        foreach ($pid in $processes) {
            try {
                $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "   Killing process $($proc.ProcessName) (PID: $pid) on port $port" -ForegroundColor Yellow
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
            } catch {
                # Ignore errors
            }
        }
    }
}

Write-Host ""
Write-Host "✅ Cleanup complete." -ForegroundColor Green

