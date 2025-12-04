# AbyssOS Deployment Guide

Quick reference for deploying AbyssOS to `demiurge.cloud` on Node0.

## Prerequisites

- Node0 server accessible at `51.210.209.112`
- SSH access as `ubuntu` user
- Nginx installed and running

## One-Command Deploy Script

Save this as `deploy.sh` and run from the project root:

```bash
#!/bin/bash
set -e

echo "Building AbyssOS..."
cd apps/abyssos-portal
pnpm install
pnpm build

echo "Copying to server..."
scp -r dist/* ubuntu@51.210.209.112:/var/www/abyssos-portal/

echo "Deployment complete! Visit http://demiurge.cloud"
```

## Manual Deployment Steps

### 1. Build Locally

```bash
cd apps/abyssos-portal
pnpm install
pnpm build
```

### 2. Prepare Server Directory

```bash
ssh ubuntu@51.210.209.112
sudo mkdir -p /var/www/abyssos-portal
sudo chown -R ubuntu:ubuntu /var/www/abyssos-portal
```

### 3. Copy Files

From your local machine:

```bash
scp -r apps/abyssos-portal/dist/* ubuntu@51.210.209.112:/var/www/abyssos-portal/
```

### 4. Configure Nginx

On the server, create `/etc/nginx/sites-available/demiurge.cloud`:

```nginx
server {
    listen 80;
    server_name demiurge.cloud;

    root /var/www/abyssos-portal;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 5. Enable Site

```bash
sudo ln -sf /etc/nginx/sites-available/demiurge.cloud /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Set Up SSL (Optional)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d demiurge.cloud
```

## Environment Variables

If you need to customize the RPC endpoint, set it during build:

```bash
VITE_DEMIURGE_RPC_URL=https://custom-rpc.example.com/rpc pnpm build
```

## Troubleshooting

### 404 Errors

- Check nginx config: `sudo nginx -t`
- Verify files exist: `ls -la /var/www/abyssos-portal/`
- Check nginx error log: `sudo tail -f /var/log/nginx/error.log`

### RPC Connection Issues

- Verify RPC endpoint is accessible
- Check browser console for CORS errors
- Ensure RPC server allows requests from `demiurge.cloud`

### Permission Issues

```bash
sudo chown -R www-data:www-data /var/www/abyssos-portal
sudo chmod -R 755 /var/www/abyssos-portal
```

## Updating

To update AbyssOS:

1. Build new version locally
2. Copy to server (overwrites old files)
3. Reload nginx (if config changed): `sudo systemctl reload nginx`

No server restart needed for static file updates.

