Write-Warning "Remote deployment to Monad/Pleroma has been retired."
Write-Host ""
Write-Host "Use the local-first workflow instead:" -ForegroundColor Cyan
Write-Host "  1. npm run qor-auth:infra" -ForegroundColor White
Write-Host "  2. npm run qor-auth:run" -ForegroundColor White
Write-Host "  3. npm run local:health" -ForegroundColor White
Write-Host ""
Write-Host "Reference:" -ForegroundColor Yellow
Write-Host "  docs\\deploy\\LOCAL_FIRST.md" -ForegroundColor White
exit 1
