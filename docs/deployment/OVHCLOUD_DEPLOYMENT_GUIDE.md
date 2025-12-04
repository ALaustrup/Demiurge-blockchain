# OVHcloud Deployment Guide - Demiurge Devnet

This guide will help you deploy the entire Demiurge Devnet stack to your OVHcloud hosting plan.

---

## 📋 Prerequisites

1. **OVHcloud Account** with an active hosting plan (VPS or Dedicated Server recommended)
2. **Domain Name** configured and pointing to your OVHcloud server IP
3. **SSH Access** to your OVHcloud server
4. **Basic Linux Knowledge** (Ubuntu/Debian commands)

---

## 🎯 Deployment Architecture

### **Services to Deploy:**

1. **Demiurge Portal Web** (Next.js) - Port 3000
2. **AbyssID Backend** (Node.js) - Port 3001
3. **Abyss Gateway** (GraphQL) - Port 4000
4. **NGINX** (Reverse Proxy) - Port 80/443
5. **PM2** (Process Manager)

### **Recommended Server Specs:**

- **Minimum:** 2 vCPU, 4GB RAM, 40GB SSD
- **Recommended:** 4 vCPU, 8GB RAM, 80GB SSD
- **OS:** Ubuntu 22.04 LTS or 24.04 LTS

---

## 🚀 Step-by-Step Deployment

### **Phase 1: Server Setup**

#### 1.1 Connect to Your OVHcloud Server

```bash
ssh ubuntu@YOUR_SERVER_IP
# or
ssh root@YOUR_SERVER_IP
```

#### 1.2 Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

#### 1.2.1 Setup Automated Updates (Optional but Recommended)

```bash
cd /opt/demiurge/repo
chmod +x scripts/setup-automated-updates.sh
sudo ./scripts/setup-automated-updates.sh
```

This configures automatic security and regular updates. You can skip this and run it later if preferred.

#### 1.3 Install Node.js (v24.11.1)

```bash
# Install Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install Node.js 24.11.1
nvm install 24.11.1
nvm use 24.11.1
nvm alias default 24.11.1

# Verify
node -v  # Should show v24.11.1
npm -v
```

#### 1.4 Install pnpm

```bash
npm install -g pnpm
pnpm -v
```

#### 1.5 Install PM2

```bash
npm install -g pm2
pm2 -v
```

#### 1.6 Install NGINX

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

#### 1.7 Configure Firewall (UFW)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

---

### **Phase 2: Clone Repository**

#### 2.1 Clone Repository (Simple Method - Recommended)

```bash
# Navigate to /opt
cd /opt

# Clone repository (SSH)
git clone git@github.com:ALaustrup/DEMIURGE.git

# Or using HTTPS (if SSH key not set up)
# git clone https://github.com/ALaustrup/DEMIURGE.git

# Navigate into repo
cd DEMIURGE

# Checkout the feature branch
git checkout feature/fracture-v1-portal
```

#### 2.2 Alternative: Nested Directory Structure

If you prefer the nested structure (`/opt/demiurge/repo`):

```bash
sudo mkdir -p /opt/demiurge
sudo chown $USER:$USER /opt/demiurge
cd /opt/demiurge

# Clone to 'repo' subdirectory
git clone git@github.com:ALaustrup/DEMIURGE.git repo
# Or: git clone https://github.com/ALaustrup/DEMIURGE.git repo

cd repo
git checkout feature/fracture-v1-portal
```

#### 2.3 Verify Structure

```bash
ls -la apps/
# Should show: portal-web, abyssid-backend
ls -la indexer/
# Should show: abyss-gateway
```

---

### **Phase 3: Build Services**

#### 3.1 Build Portal Web

```bash
cd /opt/demiurge/repo/apps/portal-web
pnpm install
pnpm run build

# Test build
pnpm run start
# Press Ctrl+C after verifying it works
```

#### 3.2 Setup AbyssID Backend

```bash
cd /opt/demiurge/repo/apps/abyssid-backend
npm install

# Initialize database
mkdir -p data
node src/db-init.js

# Test
node src/server.js
# Press Ctrl+C after verifying it works
```

#### 3.3 Setup Abyss Gateway

```bash
cd /opt/demiurge/repo/indexer/abyss-gateway
pnpm install

# Initialize data directory
mkdir -p data

# Test
pnpm dev
# Press Ctrl+C after verifying it works
```

---

### **Phase 4: Configure PM2**

#### 4.1 Create PM2 Ecosystem File

```bash
cd /opt/demiurge
cat > pm2.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'demiurge-portal',
      cwd: '/opt/demiurge/repo/apps/portal-web',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/opt/demiurge/logs/portal-error.log',
      out_file: '/opt/demiurge/logs/portal-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
    },
    {
      name: 'abyssid-backend',
      cwd: '/opt/demiurge/repo/apps/abyssid-backend',
      script: 'node',
      args: 'src/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: '/opt/demiurge/logs/abyssid-error.log',
      out_file: '/opt/demiurge/logs/abyssid-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '512M',
    },
    {
      name: 'abyss-gateway',
      cwd: '/opt/demiurge/repo/indexer/abyss-gateway',
      script: 'pnpm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      error_file: '/opt/demiurge/logs/gateway-error.log',
      out_file: '/opt/demiurge/logs/gateway-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '512M',
    },
  ],
};
EOF
```

#### 4.2 Create Logs Directory

```bash
mkdir -p /opt/demiurge/logs
```

#### 4.3 Start Services with PM2

```bash
cd /opt/demiurge
pm2 start pm2.config.js
pm2 save
pm2 startup
# Follow the instructions to enable PM2 on boot
```

#### 4.4 Verify Services

```bash
pm2 status
pm2 logs
```

---

### **Phase 5: Configure NGINX**

#### 5.1 Create NGINX Configuration

```bash
sudo nano /etc/nginx/sites-available/demiurge-portal
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN.com www.YOUR_DOMAIN.com;

    # Logs
    access_log /var/log/nginx/demiurge-portal-access.log;
    error_log /var/log/nginx/demiurge-portal-error.log;

    # Client max body size (for file uploads)
    client_max_body_size 100M;

    # Main portal (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Media files (video backgrounds)
    location /media/ {
        alias /opt/demiurge/media/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # AbyssID Backend API
    location /api/abyssid/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Abyss Gateway GraphQL
    location /graphql {
        proxy_pass http://127.0.0.1:4000/graphql;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Replace `YOUR_DOMAIN.com` with your actual domain.**

#### 5.2 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/demiurge-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### **Phase 6: Setup SSL (HTTPS)**

#### 6.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

#### 6.2 Obtain SSL Certificate

```bash
sudo certbot --nginx -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com
```

**Follow the prompts:**
- Enter your email address
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

#### 6.3 Verify Auto-Renewal

```bash
sudo certbot renew --dry-run
```

---

### **Phase 7: Upload Media Files**

#### 7.1 Create Media Directory

```bash
mkdir -p /opt/demiurge/media
```

#### 7.2 Upload Video Files

**From your local machine:**

```bash
# Upload WebM
scp fracture-bg.webm ubuntu@YOUR_SERVER_IP:/opt/demiurge/media/

# Upload MP4
scp fracture-bg.mp4 ubuntu@YOUR_SERVER_IP:/opt/demiurge/media/

# Upload poster (optional)
scp fracture-bg-poster.jpg ubuntu@YOUR_SERVER_IP:/opt/demiurge/media/
```

**Or use SFTP/FTP client** to upload to `/opt/demiurge/media/`

#### 7.3 Verify Files

```bash
ls -lh /opt/demiurge/media/
```

---

### **Phase 8: Environment Variables**

#### 8.1 Portal Web Environment

```bash
cd /opt/demiurge/repo/apps/portal-web
nano .env.local
```

**Add:**

```env
NEXT_PUBLIC_ABYSSID_API_URL=https://YOUR_DOMAIN.com/api/abyssid
NEXT_PUBLIC_ABYSS_GATEWAY_URL=https://YOUR_DOMAIN.com/graphql
```

#### 8.2 Rebuild Portal

```bash
cd /opt/demiurge/repo/apps/portal-web
pnpm run build
pm2 restart demiurge-portal
```

---

### **Phase 9: Final Verification**

#### 9.1 Check Services

```bash
pm2 status
pm2 logs --lines 50
```

#### 9.2 Test Endpoints

```bash
# Portal
curl http://localhost:3000

# AbyssID Backend
curl http://localhost:3001/health

# Abyss Gateway
curl http://localhost:4000/graphql
```

#### 9.3 Test from Browser

- Visit: `https://YOUR_DOMAIN.com`
- Visit: `https://YOUR_DOMAIN.com/haven`
- Visit: `https://YOUR_DOMAIN.com/void`
- Check browser console for errors

---

## 🔧 Maintenance Commands

### **View Logs**

```bash
# All services
pm2 logs

# Specific service
pm2 logs demiurge-portal
pm2 logs abyssid-backend
pm2 logs abyss-gateway

# NGINX logs
sudo tail -f /var/log/nginx/demiurge-portal-error.log
```

### **Restart Services**

```bash
pm2 restart all
pm2 restart demiurge-portal
pm2 restart abyssid-backend
pm2 restart abyss-gateway
```

### **Update Deployment**

```bash
cd /opt/demiurge/repo
git pull origin feature/fracture-v1-portal

# Rebuild portal
cd apps/portal-web
pnpm install
pnpm run build
pm2 restart demiurge-portal

# Restart other services if needed
pm2 restart abyssid-backend
pm2 restart abyss-gateway
```

### **System Updates**

#### **Setup Automated Updates (Recommended)**

```bash
cd /opt/demiurge/repo
chmod +x scripts/setup-automated-updates.sh
sudo ./scripts/setup-automated-updates.sh
```

This will configure:
- ✅ Automatic security updates
- ✅ Automatic regular updates
- ✅ Automatic cleanup of unused packages
- ✅ Logging to syslog
- ❌ Auto-reboot disabled (manual reboot required)

#### **Manual System Update**

```bash
cd /opt/demiurge/repo
chmod +x scripts/update-system.sh
sudo ./scripts/update-system.sh
```

Or manually:
```bash
# Update package lists
sudo apt update

# Check what's available
sudo apt list --upgradable

# Install updates
sudo apt upgrade -y

# Clean up
sudo apt autoremove -y
sudo apt autoclean
```

#### **Check Update Status**

```bash
# Test automated updates (dry run)
sudo unattended-upgrade --dry-run

# View update logs
sudo tail -f /var/log/unattended-upgrades/unattended-upgrades.log

# Check if reboot is required
cat /var/run/reboot-required 2>/dev/null || echo "No reboot required"
```

---

## 🐛 Troubleshooting

### **Portal Not Loading**

1. Check PM2: `pm2 status`
2. Check logs: `pm2 logs demiurge-portal`
3. Check NGINX: `sudo nginx -t`
4. Check port: `curl http://localhost:3000`

### **502 Bad Gateway**

- Portal might not be running: `pm2 restart demiurge-portal`
- Check NGINX config: `sudo nginx -t`
- Check firewall: `sudo ufw status`

### **SSL Certificate Issues**

- Renew certificate: `sudo certbot renew`
- Check expiration: `sudo certbot certificates`

### **Database Errors**

- Check permissions: `ls -la /opt/demiurge/repo/apps/abyssid-backend/data/`
- Reinitialize: `cd /opt/demiurge/repo/apps/abyssid-backend && node src/db-init.js`

---

## 📊 Monitoring

### **PM2 Monitoring**

```bash
pm2 monit
```

### **System Resources**

```bash
htop
# or
top
```

### **Disk Usage**

```bash
df -h
du -sh /opt/demiurge/*
```

---

## 🔐 Security Checklist

- [ ] Firewall configured (UFW)
- [ ] SSH key-based authentication enabled
- [ ] SSL certificate installed and auto-renewal configured
- [ ] PM2 processes running as non-root user
- [ ] Environment variables secured (not in git)
- [ ] Regular backups configured
- [ ] Logs rotated (PM2 handles this)
- [ ] Automated updates configured (run `setup-automated-updates.sh`)

---

## 📝 Next Steps

1. **Set up automated backups** for database and media files
2. **Configure monitoring** (optional: Prometheus, Grafana)
3. **Set up CI/CD** for automated deployments
4. **Configure CDN** for static assets (optional)
5. **Set up email notifications** for errors (optional)

---

## 🆘 Support

If you encounter issues:

1. Check logs: `pm2 logs` and `sudo journalctl -u nginx`
2. Verify services: `pm2 status` and `sudo systemctl status nginx`
3. Test endpoints: `curl http://localhost:PORT`
4. Review this guide for common issues

---

**Deployment Complete! 🎉**

Your Demiurge Devnet should now be accessible at `https://YOUR_DOMAIN.com`

