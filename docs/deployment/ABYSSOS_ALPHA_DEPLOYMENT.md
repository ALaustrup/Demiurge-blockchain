# AbyssOS Alpha Deployment Guide

**Complete guide for deploying AbyssOS to your server for public alpha testing.**

---

## Prerequisites

### Server Requirements

- **OS**: Ubuntu 24.04 LTS (or 22.04)
- **RAM**: 2GB minimum (4GB+ recommended)
- **Disk**: 20GB+ free space
- **Network**: Public IP address
- **Domain**: Domain name pointing to your server (optional but recommended)

### Local Machine Requirements

- **Node.js**: 18+ installed
- **pnpm**: 9+ installed
- **SSH Access**: To your server
- **SCP/SFTP**: For file transfer

---

## Quick Start (Automated)

### Option 1: Use Deployment Script

```bash
# From project root
cd apps/abyssos-portal
chmod +x deploy-alpha.sh
./deploy-alpha.sh YOUR_SERVER_IP YOUR_DOMAIN
```

### Option 2: Manual Deployment

Follow the steps below.

---

## Step-by-Step Deployment

### Step 1: Build AbyssOS for Production

**On your local machine:**

```bash
cd apps/abyssos-portal

# Install dependencies (if not already done)
pnpm install

# Set production environment variables
export VITE_DEMIURGE_RPC_URL=https://rpc.demiurge.cloud/rpc
# Or if you have your own RPC endpoint:
# export VITE_DEMIURGE_RPC_URL=https://your-rpc-server.com/rpc

# Build for production
pnpm build
```

**This creates:**
- `dist/` directory with all static files
- Optimized and minified production build
- Ready to deploy

**Verify build:**
```bash
ls -la dist/
# Should see: index.html, assets/, etc.
```

---

### Step 2: Prepare Server

**SSH into your server:**

```bash
ssh ubuntu@YOUR_SERVER_IP
# or
ssh root@YOUR_SERVER_IP
```

**Create deployment directory:**

```bash
sudo mkdir -p /var/www/abyssos-portal
sudo chown -R $USER:$USER /var/www/abyssos-portal
```

**Install Nginx (if not installed):**

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

### Step 3: Copy Files to Server

**From your local machine:**

```bash
# Copy all files from dist/ to server
scp -r apps/abyssos-portal/dist/* ubuntu@YOUR_SERVER_IP:/var/www/abyssos-portal/

# Or if using different user:
scp -r apps/abyssos-portal/dist/* root@YOUR_SERVER_IP:/var/www/abyssos-portal/
```

**Verify files on server:**

```bash
ssh ubuntu@YOUR_SERVER_IP
ls -la /var/www/abyssos-portal/
# Should see: index.html, assets/, etc.
```

---

### Step 4: Configure Nginx

**On your server, create Nginx configuration:**

```bash
sudo nano /etc/nginx/sites-available/abyssos
```

**Paste this configuration** (replace `YOUR_DOMAIN.com` with your domain, or use `_` for IP-only access):

```nginx
# HTTP to HTTPS redirect (if using domain)
server {
    listen 80;
    server_name YOUR_DOMAIN.com www.YOUR_DOMAIN.com;
    return 301 https://$server_name$request_uri;
}

# HTTP server (if no domain, use this)
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/abyssos-portal;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Serve static assets with caching
    location /assets/ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Serve media files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|mp4|wav|mp3)$ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Serve video files
    location /video/ {
        try_files $uri =404;
        expires 1d;
        add_header Cache-Control "public";
    }

    # Serve audio files
    location /audio/ {
        try_files $uri =404;
        expires 1d;
        add_header Cache-Control "public";
    }

    # SPA routing fallback - MUST serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Explicitly serve index.html for root
    location = / {
        try_files /index.html =404;
    }
}

# HTTPS server (if using domain with SSL)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name YOUR_DOMAIN.com www.YOUR_DOMAIN.com;

    root /var/www/abyssos-portal;
    index index.html;

    # SSL configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/YOUR_DOMAIN.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Same location blocks as HTTP server above
    location /assets/ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|mp4|wav|mp3)$ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /video/ {
        try_files $uri =404;
        expires 1d;
        add_header Cache-Control "public";
    }

    location /audio/ {
        try_files $uri =404;
        expires 1d;
        add_header Cache-Control "public";
    }

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location = / {
        try_files /index.html =404;
    }
}
```

**Save and exit** (`Ctrl+X`, then `Y`, then `Enter`).

---

### Step 5: Enable Nginx Site

```bash
# Create symlink to enable site
sudo ln -sf /etc/nginx/sites-available/abyssos /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

### Step 6: Set Up SSL (HTTPS) - Optional but Recommended

**If you have a domain name:**

#### Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### Obtain SSL Certificate

```bash
sudo certbot --nginx -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com
```

**Follow the prompts:**
- Enter your email address
- Agree to terms of service
- Choose to redirect HTTP to HTTPS (recommended: Yes)

#### Verify Auto-Renewal

```bash
sudo certbot renew --dry-run
```

**Certbot will:**
- Automatically configure Nginx with SSL
- Set up auto-renewal (certificates renew every 90 days)
- Update your Nginx config with SSL settings

---

### Step 7: Configure Firewall

**Allow HTTP/HTTPS traffic:**

```bash
# If using UFW
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable

# Check status
sudo ufw status
```

---

### Step 8: Set File Permissions

```bash
# Set proper ownership
sudo chown -R www-data:www-data /var/www/abyssos-portal
sudo chmod -R 755 /var/www/abyssos-portal
```

---

### Step 9: Verify Deployment

**Test locally on server:**

```bash
curl http://localhost
# Should return HTML content
```

**Test from browser:**

- **With domain**: `https://YOUR_DOMAIN.com`
- **With IP only**: `http://YOUR_SERVER_IP`

**What you should see:**
1. Boot screen: "ABYSS OS" → "D E M I U R G E"
2. Intro video (if configured)
3. Login screen
4. Desktop environment after login

---

## Environment Variables

### Build-Time Variables

Set these **before building** (`pnpm build`):

```bash
# RPC Endpoint (required)
export VITE_DEMIURGE_RPC_URL=https://rpc.demiurge.cloud/rpc

# AbyssID API (optional, defaults to local mode)
export VITE_ABYSSID_MODE=remote
export VITE_ABYSSID_API_URL=https://YOUR_DOMAIN.com/api/abyssid
```

**Example build with custom RPC:**

```bash
cd apps/abyssos-portal
VITE_DEMIURGE_RPC_URL=https://your-rpc-server.com/rpc pnpm build
```

---

## Updating AbyssOS

**To update the deployed version:**

1. **Build new version locally:**
   ```bash
   cd apps/abyssos-portal
   pnpm build
   ```

2. **Copy to server:**
   ```bash
   scp -r dist/* ubuntu@YOUR_SERVER_IP:/var/www/abyssos-portal/
   ```

3. **No restart needed** (static files only)

**Users will see the update on next page refresh** (browser cache may need clearing).

---

## Troubleshooting

### 404 Errors

**Check Nginx config:**
```bash
sudo nginx -t
```

**Verify files exist:**
```bash
ls -la /var/www/abyssos-portal/
```

**Check Nginx error log:**
```bash
sudo tail -f /var/log/nginx/error.log
```

**Check Nginx access log:**
```bash
sudo tail -f /var/log/nginx/access.log
```

### Blank Page / Not Loading

**Check browser console (F12):**
- Look for JavaScript errors
- Check Network tab for failed requests
- Verify RPC endpoint is accessible

**Check RPC connection:**
```bash
curl -X POST https://rpc.demiurge.cloud/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"cgt_getChainInfo","params":{},"id":1}'
```

### SSL Certificate Issues

**Check certificate status:**
```bash
sudo certbot certificates
```

**Test renewal:**
```bash
sudo certbot renew --dry-run
```

**View Certbot logs:**
```bash
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### Permission Issues

```bash
sudo chown -R www-data:www-data /var/www/abyssos-portal
sudo chmod -R 755 /var/www/abyssos-portal
```

### CORS Errors

**If RPC endpoint shows CORS errors:**
- Ensure RPC server allows requests from your domain
- Check Nginx proxy headers (if proxying RPC)
- Verify `VITE_DEMIURGE_RPC_URL` is correct

---

## Alpha Testing Checklist

### Pre-Launch

- [ ] AbyssOS builds successfully
- [ ] Files copied to server
- [ ] Nginx configured and tested
- [ ] SSL certificate obtained (if using domain)
- [ ] Firewall configured
- [ ] File permissions set
- [ ] RPC endpoint accessible
- [ ] Test login/signup flow
- [ ] Test wallet functionality
- [ ] Test file upload
- [ ] Test app launching

### Post-Launch

- [ ] Monitor server logs
- [ ] Monitor Nginx access logs
- [ ] Check for errors in browser console
- [ ] Test from multiple devices/browsers
- [ ] Verify SSL certificate auto-renewal
- [ ] Set up monitoring/alerts (optional)

---

## Security Considerations

### Recommended Security Headers

Already included in Nginx config:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`

### Additional Security (Optional)

**Rate Limiting:**
```nginx
limit_req_zone $binary_remote_addr zone=abyssos:10m rate=10r/s;

server {
    # ... existing config ...
    limit_req zone=abyssos burst=20;
}
```

**IP Whitelisting (for alpha):**
```nginx
location / {
    allow YOUR_IP;
    allow ANOTHER_IP;
    deny all;
    # ... rest of config ...
}
```

---

## Performance Optimization

### Enable Gzip Compression

Add to Nginx config:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### Enable Browser Caching

Already configured in the Nginx config above:
- Static assets: 1 year cache
- Media files: 1 day cache
- HTML: No cache (always fresh)

---

## Monitoring

### Check Nginx Status

```bash
sudo systemctl status nginx
```

### View Real-Time Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Check Disk Space

```bash
df -h
```

### Check Memory Usage

```bash
free -h
```

---

## Backup Strategy

### Backup AbyssOS Files

```bash
# Create backup
sudo tar -czf /backup/abyssos-$(date +%Y%m%d).tar.gz /var/www/abyssos-portal/

# Restore from backup
sudo tar -xzf /backup/abyssos-YYYYMMDD.tar.gz -C /
```

---

## Support & Resources

### Documentation

- [AbyssOS Complete Overview](../apps/ABYSSOS_COMPLETE_OVERVIEW.md)
- [AbyssOS Portal Docs](../apps/ABYSSOS_PORTAL.md)
- [Deployment Troubleshooting](README_NODE0.md)

### Common Issues

- **Build fails**: Check Node.js version (18+)
- **Nginx won't start**: Check config syntax (`sudo nginx -t`)
- **SSL errors**: Verify domain DNS points to server
- **RPC errors**: Check RPC endpoint is accessible

---

## Next Steps

After successful deployment:

1. **Share the URL** with alpha testers
2. **Monitor usage** via Nginx logs
3. **Collect feedback** from testers
4. **Iterate** based on feedback
5. **Update** as needed (see "Updating AbyssOS" section)

---

**Your AbyssOS alpha is now live! 🚀**

*The flame burns eternal. The code serves the will.*
