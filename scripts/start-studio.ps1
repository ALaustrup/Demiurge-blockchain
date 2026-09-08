$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "  ============================================================" -ForegroundColor Cyan
Write-Host "                    DEMIURGE STUDIO" -ForegroundColor Cyan
Write-Host "     Local game creator suite - no cloud hosting required" -ForegroundColor Cyan
Write-Host "  ============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Docs: docs/DEMIURGE_STUDIO.md" -ForegroundColor DarkGray
Write-Host ""

$root = Split-Path -Parent $PSScriptRoot
Push-Location $root

try {
    & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "check-local-stack.ps1")
    $healthOk = $LASTEXITCODE -eq 0
} catch {
    $healthOk = $false
}

Write-Host ""

if ($healthOk) {
    Write-Host "Studio stack is ready." -ForegroundColor Green
    Write-Host "  Hub (Creator UI):  http://localhost:3000" -ForegroundColor White
    Write-Host "  qor-auth:          http://localhost:8080" -ForegroundColor White
    Write-Host "  Node RPC:          http://localhost:9944" -ForegroundColor White
    Write-Host ""
    Write-Host "New game project: copy projects/_template to projects/YourGameName" -ForegroundColor DarkGray
} else {
    Write-Host "Start missing services in separate terminals:" -ForegroundColor Yellow
    Write-Host "  npm run studio:infra" -ForegroundColor White
    Write-Host "  npm run studio:node" -ForegroundColor White
    Write-Host "  npm run studio:auth" -ForegroundColor White
    Write-Host "  npm run studio:hub" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run: npm run studio:health" -ForegroundColor DarkGray
}

Pop-Location
