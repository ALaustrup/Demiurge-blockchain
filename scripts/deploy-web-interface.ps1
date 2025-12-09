# Deploy Full Web Interface for Demiurge
# Sets up Nginx, AbyssOS Portal, SSL, and RPC proxy

param(
    [string]$Server = "ubuntu@51.210.209.112",
    [string]$SshKey = "$env:USERPROFILE\.ssh\Node1",
    [string]$RemoteBase = "/opt/demiurge"
)

$ErrorActionPreference = "Stop"

Write-Host "`n=== DEMIURGE WEB INTERFACE DEPLOYMENT ===" -ForegroundColor Cyan
Write-Host "Server: $Server" -ForegroundColor White
Write-Host "SSH Key: $SshKey" -ForegroundColor White
Write-Host "Remote Base: $RemoteBase`n" -ForegroundColor White

# Verify SSH key exists
if (-not (Test-Path $SshKey)) {
    Write-Host "ERROR: SSH key not found: $SshKey" -ForegroundColor Red
    exit 1
}

# Step 1: Build AbyssOS Portal
Write-Host "[1/6] Building AbyssOS Portal..." -ForegroundColor Yellow
Push-Location "apps/abyssos-portal"
try {
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing dependencies..." -ForegroundColor Gray
        pnpm install
    }
    
    Write-Host "Building production bundle..." -ForegroundColor Gray
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Build failed!" -ForegroundColor Red
        exit 1
    }
    
    if (-not (Test-Path "dist")) {
        Write-Host "ERROR: Build output 'dist' directory not found" -ForegroundColor Red
        exit 1
    }
    Write-Host "OK: Build successful" -ForegroundColor Green
} finally {
    Pop-Location
}

# Step 2: Install Nginx on server
Write-Host "`n[2/6] Installing Nginx on server..." -ForegroundColor Yellow
$installNginx = "sudo apt update && sudo apt install -y nginx"
ssh -i $SshKey $Server $installNginx
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Nginx installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Nginx installed" -ForegroundColor Green

# Step 3: Deploy AbyssOS Portal
Write-Host "`n[3/6] Deploying AbyssOS Portal..." -ForegroundColor Yellow
$portalDir = "/var/www/abyssos-portal"
$tempDir = "/tmp/abyssos-portal-$(Get-Date -Format 'yyyyMMddHHmmss')"

Write-Host "Creating remote directory..." -ForegroundColor Gray
ssh -i $SshKey $Server "sudo mkdir -p $portalDir && sudo chown ubuntu:ubuntu $portalDir"

Write-Host "Uploading files..." -ForegroundColor Gray
# Create temp directory and upload
ssh -i $SshKey $Server "mkdir -p $tempDir"
scp -i $SshKey -r apps/abyssos-portal/dist/* "${Server}:${tempDir}/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: File upload failed" -ForegroundColor Red
    exit 1
}

Write-Host "Installing files..." -ForegroundColor Gray
ssh -i $SshKey $Server "sudo rm -rf $portalDir/* && sudo mv $tempDir/* $portalDir/ && sudo chown -R www-data:www-data $portalDir && rm -rf $tempDir"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: File installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Portal deployed to $portalDir" -ForegroundColor Green

# Step 4: Configure Nginx
Write-Host "`n[4/6] Configuring Nginx..." -ForegroundColor Yellow
$nginxConfig = "deploy/nginx/demiurge.cloud.conf"
if (-not (Test-Path $nginxConfig)) {
    Write-Host "ERROR: Nginx config not found: $nginxConfig" -ForegroundColor Red
    exit 1
}

Write-Host "Uploading Nginx config..." -ForegroundColor Gray
scp -i $SshKey $nginxConfig "${Server}:/tmp/demiurge.cloud.conf"
ssh -i $SshKey $Server "sudo mv /tmp/demiurge.cloud.conf /etc/nginx/sites-available/demiurge.cloud && sudo ln -sf /etc/nginx/sites-available/demiurge.cloud /etc/nginx/sites-enabled/ && sudo rm -f /etc/nginx/sites-enabled/default"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Nginx config installation failed" -ForegroundColor Red
    exit 1
}

Write-Host "Testing Nginx config..." -ForegroundColor Gray
ssh -i $SshKey $Server "sudo nginx -t"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Nginx config test failed" -ForegroundColor Red
    exit 1
}

Write-Host "Reloading Nginx..." -ForegroundColor Gray
ssh -i $SshKey $Server "sudo systemctl reload nginx"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Nginx reload failed" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Nginx configured" -ForegroundColor Green

# Step 5: Configure Firewall
Write-Host "`n[5/6] Configuring firewall..." -ForegroundColor Yellow
$firewallSetup = "sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw --force enable"
ssh -i $SshKey $Server $firewallSetup
Write-Host "OK: Firewall configured" -ForegroundColor Green

# Step 6: Setup SSL (Let's Encrypt)
Write-Host "`n[6/6] Setting up SSL certificates..." -ForegroundColor Yellow
Write-Host "This will prompt for email and domain confirmation" -ForegroundColor Yellow
$installCertbot = "sudo apt install -y certbot python3-certbot-nginx"
ssh -i $SshKey $Server $installCertbot

Write-Host "`nObtaining SSL certificate..." -ForegroundColor Gray
Write-Host "NOTE: You'll need to provide an email address and confirm domain ownership" -ForegroundColor Yellow
$getCert = "sudo certbot --nginx -d demiurge.cloud -d www.demiurge.cloud -d rpc.demiurge.cloud --non-interactive --agree-tos --email admin@demiurge.cloud --redirect"
ssh -i $SshKey $Server $getCert
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: SSL certificate setup may have failed. You may need to run manually:" -ForegroundColor Yellow
    Write-Host "  ssh -i $SshKey $Server 'sudo certbot --nginx -d demiurge.cloud -d www.demiurge.cloud -d rpc.demiurge.cloud'" -ForegroundColor White
} else {
    Write-Host "OK: SSL certificates configured" -ForegroundColor Green
}

# Summary
Write-Host "`n=== Deployment Complete ===" -ForegroundColor Cyan
Write-Host "`nAccess Points:" -ForegroundColor Yellow
Write-Host "  - Web Interface: https://demiurge.cloud" -ForegroundColor White
Write-Host "  - RPC Endpoint: https://rpc.demiurge.cloud/rpc" -ForegroundColor White
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Verify DNS: Ensure demiurge.cloud points to 51.210.209.112" -ForegroundColor White
Write-Host "  2. Test access: Open https://demiurge.cloud in your browser" -ForegroundColor White
Write-Host "  3. Check logs: ssh -i $SshKey $Server 'sudo journalctl -u nginx -f'" -ForegroundColor White

