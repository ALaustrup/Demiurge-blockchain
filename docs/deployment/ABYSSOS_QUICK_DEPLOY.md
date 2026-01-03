# AbyssOS Quick Deployment Guide

**Fast deployment for alpha testing - 5 minutes to live!**

---

## Quick Deploy (PowerShell - Windows)

```powershell
cd apps/abyssos-portal

# Deploy to server (IP only)
.\deploy-alpha.ps1 -ServerIp YOUR_SERVER_IP

# Deploy with domain
.\deploy-alpha.ps1 -ServerIp YOUR_SERVER_IP -Domain yourdomain.com

# Deploy with custom RPC
.\deploy-alpha.ps1 -ServerIp YOUR_SERVER_IP -Domain yourdomain.com -RpcUrl https://your-rpc.com/rpc
```

---

## Quick Deploy (Bash - Linux/Mac)

```bash
cd apps/abyssos-portal
chmod +x deploy-alpha.sh

# Deploy to server (IP only)
./deploy-alpha.sh YOUR_SERVER_IP

# Deploy with domain
./deploy-alpha.sh YOUR_SERVER_IP yourdomain.com

# Deploy with custom RPC
./deploy-alpha.sh YOUR_SERVER_IP yourdomain.com https://your-rpc.com/rpc
```

---

## Manual Quick Deploy

### 1. Build
```bash
cd apps/abyssos-portal
pnpm install
pnpm build
```

### 2. Copy to Server
```bash
scp -r dist/* ubuntu@YOUR_SERVER_IP:/var/www/abyssos-portal/
```

### 3. Configure Nginx (on server)
```bash
ssh ubuntu@YOUR_SERVER_IP

# Create config
sudo nano /etc/nginx/sites-available/abyssos
```

**Paste:**
```nginx
server {
    listen 80;
    server_name _;
    root /var/www/abyssos-portal;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Enable:**
```bash
sudo ln -sf /etc/nginx/sites-available/abyssos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Set Permissions
```bash
sudo chown -R www-data:www-data /var/www/abyssos-portal
sudo chmod -R 755 /var/www/abyssos-portal
```

### 5. Access
Open: `http://YOUR_SERVER_IP`

---

## What the Script Does

✅ Builds AbyssOS for production  
✅ Creates server directory  
✅ Copies files via SCP  
✅ Configures Nginx automatically  
✅ Sets file permissions  
✅ Provides SSL setup instructions  

---

## After Deployment

1. **Test**: Open `http://YOUR_SERVER_IP` in browser
2. **SSL** (if domain): Run `sudo certbot --nginx -d yourdomain.com`
3. **Firewall**: `sudo ufw allow 'Nginx Full'`
4. **Share**: Give testers the URL!

---

## Troubleshooting

**Can't connect?**
- Check firewall: `sudo ufw status`
- Check Nginx: `sudo systemctl status nginx`
- Check logs: `sudo tail -f /var/log/nginx/error.log`

**Blank page?**
- Check files: `ls -la /var/www/abyssos-portal/`
- Check browser console (F12)
- Verify RPC endpoint is accessible

**404 errors?**
- Check Nginx config: `sudo nginx -t`
- Verify `try_files $uri $uri/ /index.html;` is in config

---

**See [ABYSSOS_ALPHA_DEPLOYMENT.md](ABYSSOS_ALPHA_DEPLOYMENT.md) for complete guide.**
