# AbyssOS Alpha Deployment Script (PowerShell)
# Usage: .\deploy-alpha.ps1 -ServerIp YOUR_SERVER_IP [-Domain YOUR_DOMAIN] [-RpcUrl RPC_URL]

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIp,
    
    [Parameter(Mandatory=$false)]
    [string]$Domain = "",
    
    [Parameter(Mandatory=$false)]
    [string]$RpcUrl = "https://rpc.demiurge.cloud/rpc",
    
    [Parameter(Mandatory=$false)]
    [string]$ServerUser = "ubuntu"
)

$ErrorActionPreference = "Stop"

$DeployPath = "/var/www/abyssos-portal"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AbyssOS Alpha Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Green
Write-Host "  Server IP: $ServerIp"
Write-Host "  Domain: $(if ($Domain) { $Domain } else { 'none (IP-only)' })"
Write-Host "  RPC URL: $RpcUrl"
Write-Host "  Server User: $ServerUser"
Write-Host "  Deploy Path: $DeployPath"
Write-Host ""

# Step 1: Build
Write-Host "[1/6] Building AbyssOS for production..." -ForegroundColor Blue

# Check if pnpm is installed
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ pnpm not found. Please install pnpm first." -ForegroundColor Red
    exit 1
}

# Change to script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    pnpm install
}

# Build with environment variables
Write-Host "Building with RPC URL: $RpcUrl"
$env:VITE_DEMIURGE_RPC_URL = $RpcUrl
pnpm build

if (-not (Test-Path "dist")) {
    Write-Host "❌ Build failed: dist/ directory not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build complete" -ForegroundColor Green
Write-Host ""

# Step 2: Prepare server directory
Write-Host "[2/6] Preparing server directory..." -ForegroundColor Blue
ssh "${ServerUser}@${ServerIp}" "sudo mkdir -p $DeployPath && sudo chown -R ${ServerUser}:${ServerUser} $DeployPath"

Write-Host "✅ Server directory ready" -ForegroundColor Green
Write-Host ""

# Step 3: Copy files
Write-Host "[3/6] Copying files to server..." -ForegroundColor Blue
scp -r dist/* "${ServerUser}@${ServerIp}:${DeployPath}/"

Write-Host "✅ Files copied" -ForegroundColor Green
Write-Host ""

# Step 4: Configure Nginx
Write-Host "[4/6] Configuring Nginx..." -ForegroundColor Blue

# Generate Nginx config
$NginxConfig = @"
# HTTP server
server {
    listen 80$(if ($Domain) { " default_server" });
    listen [::]:80$(if ($Domain) { " default_server" });
    server_name $(if ($Domain) { $Domain } else { "_" });

    root $DeployPath;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Static assets with caching
    location /assets/ {
        try_files `$uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|mp4|wav|mp3)$ {
        try_files `$uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /video/ {
        try_files `$uri =404;
        expires 1d;
        add_header Cache-Control "public";
    }

    location /audio/ {
        try_files `$uri =404;
        expires 1d;
        add_header Cache-Control "public";
    }

    # SPA routing fallback
    location / {
        try_files `$uri `$uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location = / {
        try_files /index.html =404;
    }
}
"@

# Copy config to server
$NginxConfig | ssh "${ServerUser}@${ServerIp}" "sudo tee /etc/nginx/sites-available/abyssos > /dev/null"

# Enable site
ssh "${ServerUser}@${ServerIp}" "sudo ln -sf /etc/nginx/sites-available/abyssos /etc/nginx/sites-enabled/abyssos && sudo rm -f /etc/nginx/sites-enabled/default"

# Test and reload Nginx
$NginxTest = ssh "${ServerUser}@${ServerIp}" "sudo nginx -t 2>&1"
if ($LASTEXITCODE -eq 0) {
    ssh "${ServerUser}@${ServerIp}" "sudo systemctl reload nginx"
    Write-Host "✅ Nginx configured" -ForegroundColor Green
} else {
    Write-Host "❌ Nginx configuration test failed" -ForegroundColor Red
    Write-Host $NginxTest
    exit 1
}
Write-Host ""

# Step 5: Set permissions
Write-Host "[5/6] Setting file permissions..." -ForegroundColor Blue
ssh "${ServerUser}@${ServerIp}" "sudo chown -R www-data:www-data $DeployPath && sudo chmod -R 755 $DeployPath"

Write-Host "✅ Permissions set" -ForegroundColor Green
Write-Host ""

# Step 6: SSL Setup (if domain provided)
if ($Domain) {
    Write-Host "[6/6] SSL Setup Instructions..." -ForegroundColor Blue
    Write-Host "⚠️  SSL setup requires manual interaction" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run these commands on your server:"
    Write-Host "  sudo apt install -y certbot python3-certbot-nginx"
    Write-Host "  sudo certbot --nginx -d $Domain -d www.$Domain"
    Write-Host ""
} else {
    Write-Host "[6/6] Skipping SSL (no domain provided)" -ForegroundColor Blue
    Write-Host "⚠️  Accessing via IP only (HTTP)" -ForegroundColor Yellow
    Write-Host ""
}

# Summary
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access AbyssOS:" -ForegroundColor Cyan
if ($Domain) {
    Write-Host "   • HTTPS: https://$Domain" -ForegroundColor Green
    Write-Host "   • HTTP:  http://$Domain (redirects to HTTPS)"
} else {
    Write-Host "   • HTTP:  http://$ServerIp" -ForegroundColor Green
}
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
if ($Domain) {
    Write-Host "   1. Set up SSL: sudo certbot --nginx -d $Domain"
    Write-Host "   2. Configure firewall: sudo ufw allow 'Nginx Full'"
} else {
    Write-Host "   1. Configure firewall: sudo ufw allow 'Nginx Full'"
    Write-Host "   2. (Optional) Set up domain and SSL for HTTPS"
}
Write-Host "   3. Test the deployment in your browser"
Write-Host "   4. Share the URL with alpha testers!"
Write-Host ""
Write-Host "💡 To update:" -ForegroundColor Cyan
Write-Host "   Run this script again - it will overwrite the existing deployment"
Write-Host ""
