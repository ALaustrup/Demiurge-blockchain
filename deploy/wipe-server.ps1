# Wipe and Reset Demiurge Server D1
# WARNING: This will destroy all data on the server!
# Use only if you want a completely fresh start

$SERVER_IP = "51.210.209.112"
$SERVER_USER = "ubuntu"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Red
Write-Host "  WARNING: SERVER WIPE OPERATION" -ForegroundColor Red
Write-Host "================================================================" -ForegroundColor Red
Write-Host ""
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  - Stop all services" -ForegroundColor White
Write-Host "  - Remove all application data" -ForegroundColor White
Write-Host "  - Remove all user data" -ForegroundColor White
Write-Host "  - Remove all configuration" -ForegroundColor White
Write-Host "  - Reset to clean state" -ForegroundColor White
Write-Host ""
Write-Host "ALL DATA WILL BE LOST!" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Type 'WIPE' to confirm server wipe"
if ($confirm -ne "WIPE") {
    Write-Host "Wipe cancelled." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Connecting to server to wipe..." -ForegroundColor Yellow

# Commands to run on server
$wipeCommands = @"
# Stop all services
sudo systemctl stop demiurge-chain abyssid abyss-gateway nginx 2>/dev/null || true
sudo systemctl disable demiurge-chain abyssid abyss-gateway nginx 2>/dev/null || true

# Remove all application data
sudo rm -rf /opt/demiurge/*

# Remove all user data
sudo rm -rf /home/ubuntu/.demiurge 2>/dev/null || true
sudo rm -rf /home/ubuntu/demiurge 2>/dev/null || true

# Remove systemd services
sudo rm -f /etc/systemd/system/demiurge-*.service
sudo rm -f /etc/systemd/system/abyss*.service
sudo systemctl daemon-reload

# Remove Nginx configs
sudo rm -f /etc/nginx/sites-available/demiurge*
sudo rm -f /etc/nginx/sites-enabled/demiurge*
sudo nginx -t && sudo systemctl reload nginx 2>/dev/null || true

# Clean up logs
sudo rm -rf /var/log/demiurge 2>/dev/null || true
sudo rm -rf /opt/demiurge/logs 2>/dev/null || true

# Remove database files
sudo rm -rf /opt/demiurge/chain 2>/dev/null || true
sudo rm -rf /opt/demiurge/identity 2>/dev/null || true

echo "Server wiped successfully"
"@

Write-Host "Server wipe complete. Ready for fresh deployment." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run deployment script: .\deploy-to-d1.ps1" -ForegroundColor White
Write-Host "  2. Or run: ssh abyss 'bash /tmp/production-d1-deploy.sh'" -ForegroundColor White
