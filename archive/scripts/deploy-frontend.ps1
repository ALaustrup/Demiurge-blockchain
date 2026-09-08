Write-Warning "Remote frontend deployment to Monad/Pleroma has been retired."
Write-Host ""
Write-Host "Start the local Hub instead:" -ForegroundColor Cyan
Write-Host "  npm run local:hub" -ForegroundColor White
Write-Host ""
Write-Host "Optional local add-ons:" -ForegroundColor Yellow
Write-Host "  npm run local:marketing" -ForegroundColor White
Write-Host "  npm run local:sophia" -ForegroundColor White
Write-Host ""
Write-Host "Reference:" -ForegroundColor Yellow
Write-Host "  docs\\deploy\\LOCAL_FIRST.md" -ForegroundColor White
exit 1
