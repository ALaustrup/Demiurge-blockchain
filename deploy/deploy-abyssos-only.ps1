# Deploy AbyssOS Only - Production
# Run this script once SSH access is restored

param(
    [string]$Server = "abyss"
)

Write-Host "🚀 Deploying AbyssOS to Production Server" -ForegroundColor Green
Write-Host "Server: $Server" -ForegroundColor Gray
Write-Host ""

# Test SSH connection
Write-Host "🔍 Testing SSH connection..." -ForegroundColor Cyan
$sshTest = ssh -o ConnectTimeout=10 $Server 'echo "OK" && hostname' 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ SSH connection failed!" -ForegroundColor Red
    Write-Host "Error: $sshTest" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please restore SSH access first:" -ForegroundColor Yellow
    Write-Host "1. Access server console/VNC" -ForegroundColor Gray
    Write-Host "2. Check SSH config: sudo cat /etc/ssh/sshd_config | grep AllowUsers" -ForegroundColor Gray
    Write-Host "3. Fix if needed: sudo nano /etc/ssh/sshd_config" -ForegroundColor Gray
    Write-Host "4. Restart SSH: sudo systemctl restart ssh" -ForegroundColor Gray
    exit 1
}

Write-Host "✅ SSH connected" -ForegroundColor Green
Write-Host ""

# Pull latest code
Write-Host "📥 Pulling latest code from D1 branch..." -ForegroundColor Cyan
ssh $Server 'cd /opt/demiurge/repo && sudo -u demiurge git fetch origin D1 && sudo -u demiurge git reset --hard origin/D1' 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to pull code" -ForegroundColor Red
    exit 1
}

# Build AbyssOS
Write-Host "🔨 Building AbyssOS..." -ForegroundColor Cyan
ssh $Server 'cd /opt/demiurge/repo/apps/abyssos-portal && sudo chown -R demiurge:demiurge . && sudo -u demiurge pnpm install && sudo -u demiurge pnpm build' 2>&1 | Write-Host
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Deploy to web directory
Write-Host "📦 Deploying to production web directory..." -ForegroundColor Cyan
ssh $Server @'
sudo rm -rf /opt/demiurge/web/abyssos/*
sudo cp -r /opt/demiurge/repo/apps/abyssos-portal/dist/* /opt/demiurge/web/abyssos/
sudo chown -R demiurge:demiurge /opt/demiurge/web/abyssos
sudo chmod -R 755 /opt/demiurge/web/abyssos
FILE_COUNT=$(find /opt/demiurge/web/abyssos -type f | wc -l)
echo "✅ Deployed $FILE_COUNT files"
'@

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Changes deployed:" -ForegroundColor Gray
    Write-Host "  • Intro video: NO autoplay (click-to-play only)" -ForegroundColor Gray
    Write-Host "  • Intro video: NO sound (muted)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🌐 Live at: https://demiurge.cloud" -ForegroundColor White
} else {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}
