# AbyssOS Deployment Guide

Complete guide for deploying AbyssOS to production with HTTPS.

## Current Production Deployment

- **URL**: https://demiurge.cloud
- **Server**: Node0 (51.210.209.112)
- **Status**: ✅ Live with HTTPS
- **SSL**: Let's Encrypt certificates (auto-renewal enabled)

## Prerequisites

- Ubuntu 24.04 server (Node0)
- SSH access as `ubuntu` user
- Nginx installed
- Domain DNS configured (demiurge.cloud, www.demiurge.cloud, rpc.demiurge.cloud)

## Deployment Steps

### 1. Build AbyssOS Locally

```bash
cd apps/abyssos-portal
pnpm install
pnpm build
```

This creates the `dist/` directory with production-ready static files.

### 2. Prepare Server Directory

```bash
ssh ubuntu@51.210.209.112
sudo mkdir -p /var/www/abyssos-portal
sudo chown -R ubuntu:ubuntu /var/www/abyssos-portal
```

### 3. Copy Files to Server

From your local machine:

```bash
scp -r dist/* ubuntu@51.210.209.112:/var/www/abyssos-portal/
```

### 4. Install and Configure Nginx

#### Install Nginx (if not already installed)

```bash
sudo apt update
sudo apt install -y nginx
```

#### Create Nginx Configuration

Create `/etc/nginx/sites-available/demiurge.cloud`:

```nginx
# HTTP to HTTPS redirect for main site
server {
    listen 80;
    server_name demiurge.cloud www.demiurge.cloud;
    return 301 https://$server_name$request_uri;
}

# HTTPS server for main site
server {
    listen 443 ssl;
    server_name demiurge.cloud www.demiurge.cloud;

    root /var/www/abyssos-portal;
    index index.html;

    # SSL configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/demiurge.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/demiurge.cloud/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Main AbyssOS SPA routing fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# HTTP to HTTPS redirect for RPC
server {
    listen 80;
    server_name rpc.demiurge.cloud;
    return 301 https://$server_name$request_uri;
}

# HTTPS server for RPC proxy
server {
    listen 443 ssl;
    server_name rpc.demiurge.cloud;

    # SSL configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/demiurge.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/demiurge.cloud/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Direct RPC access without CORS/proxy issues
    location / {
        proxy_pass http://127.0.0.1:8545;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type";
    }
}
```

#### Enable Site

```bash
sudo ln -sf /etc/nginx/sites-available/demiurge.cloud /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Set Up SSL with Let's Encrypt

#### Install Certbot

```bash
sudo snap install --classic certbot
```

#### Obtain Certificates

```bash
sudo certbot --nginx --non-interactive --agree-tos --register-unsafely-without-email \
  -d demiurge.cloud -d www.demiurge.cloud -d rpc.demiurge.cloud
```

Certbot will:
- Obtain SSL certificates for all three domains
- Automatically configure nginx with HTTPS
- Set up auto-renewal

#### Verify SSL

```bash
curl -I https://demiurge.cloud
```

You should see `HTTP/1.1 200 OK`.

## Updating AbyssOS

To update the deployed version:

1. **Build new version locally:**
   ```bash
   cd apps/abyssos-portal
   pnpm build
   ```

2. **Copy to server:**
   ```bash
   scp -r dist/* ubuntu@51.210.209.112:/var/www/abyssos-portal/
   ```

3. **No nginx reload needed** (static files only)

## Troubleshooting

### 404 Errors

- Check nginx config: `sudo nginx -t`
- Verify files exist: `ls -la /var/www/abyssos-portal/`
- Check nginx error log: `sudo tail -f /var/log/nginx/error.log`

### SSL Certificate Issues

- Check certificate status: `sudo certbot certificates`
- Test renewal: `sudo certbot renew --dry-run`
- View certbot logs: `sudo tail -f /var/log/letsencrypt/letsencrypt.log`

### RPC Connection Issues

- Verify RPC endpoint is accessible: `curl http://127.0.0.1:8545`
- Check CORS headers in nginx config
- Review browser console for errors

### Permission Issues

```bash
sudo chown -R www-data:www-data /var/www/abyssos-portal
sudo chmod -R 755 /var/www/abyssos-portal
```

## Environment Variables

AbyssOS uses the following environment variables (set at build time):

- `VITE_DEMIURGE_RPC_URL`: RPC endpoint URL (default: `https://rpc.demiurge.cloud/rpc`)

To customize the RPC endpoint:

```bash
VITE_DEMIURGE_RPC_URL=https://custom-rpc.example.com/rpc pnpm build
```

## Related Documentation

- [AbyssOS Portal Documentation](../apps/ABYSSOS_PORTAL.md) - Complete AbyssOS guide
- [Node0 Deployment Guide](README_NODE0.md) - Demiurge node deployment
- [RPC API](../api/RPC.md) - Demiurge RPC methods

