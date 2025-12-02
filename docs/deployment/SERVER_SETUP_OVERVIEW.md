# Demiurge Server Setup Overview

**Last Updated:** Current  
**Server Environment:** Ubuntu 24.04.3 LTS  
**Hostname:** demiurge-node0

---

## 🏗️ **Server Architecture**

### **Directory Structure**

```
/opt/demiurge/
├── repo/                    # Git repository (DEMIURGE)
│   ├── apps/
│   │   ├── portal-web/      # Next.js portal (port 3000)
│   │   └── abyssid-backend/ # Identity service (port 3001)
│   ├── chain/               # Rust blockchain node
│   ├── indexer/             # Abyss Gateway (GraphQL)
│   └── scripts/             # Deployment scripts
├── media/                   # Video/audio files (served by NGINX)
├── logs/                    # Service logs (PM2)
└── pm2.config.js            # PM2 process manager config
```

---

## 🔧 **Services & Ports**

| Service | Port | Status | Process Manager |
|---------|------|--------|-----------------|
| **Portal Web** | 3000 | ✅ Configured | PM2 (`demiurge-portal`) |
| **AbyssID Backend** | 3001 | ✅ Configured | PM2 (`abyssid-backend`) |
| **NGINX** | 80/443 | ✅ Configured | systemd |
| **Chain Node** | 8545 | ⚠️ Manual | (Not in PM2 yet) |
| **Abyss Gateway** | 4000 | ⚠️ Manual | (Not in PM2 yet) |

---

## 📦 **Installed Software**

### **Core Runtime**
- **Node.js:** v24.11.1
- **Rust:** 1.91.1
- **Docker:** 29.1.0
- **pnpm:** (installed via npm)

### **System Services**
- **NGINX:** Reverse proxy + static file serving
- **PM2:** Process manager for Node.js services
- **UFW:** Firewall (SSH, HTTP, HTTPS allowed)

---

## 🚀 **Deployment Phases Status**

### **Phase 0: Environment Setup** ✅
- Git installed and configured
- SSH key generated for GitHub
- Repository cloned to `/opt/demiurge/repo`
- Branch: `feature/fracture-v1-portal`
- Node.js, Rust, pnpm verified

**Script:** `scripts/phase0_setup.sh`

---

### **Phase 1: Portal Build** ✅
- Dependencies installed (`pnpm install`)
- Production build (`pnpm run build`)
- Local test server verified

**Script:** `scripts/phase1_build.sh`

**Location:** `/opt/demiurge/repo/apps/portal-web`

---

### **Phase 2: NGINX Configuration** ✅
- NGINX installed
- Reverse proxy configured for port 3000
- Media file serving (`/media/` → `/opt/demiurge/media/`)
- Firewall rules configured
- SSL ready (Let's Encrypt documented)

**Script:** `scripts/phase2_nginx.sh`

**Config:** `/etc/nginx/sites-available/demiurge-portal`

**Domain:** (Configured but may need actual domain)

---

### **Phase 3: Media Integration** ⚠️
- Directory structure created (`/opt/demiurge/media/`)
- **Missing:** Video files (`fracture-bg.webm`, `fracture-bg.mp4`)

**Action Required:** Upload video assets

---

### **Phase 4: Audio Engine** 🚧
- AudioEngine.ts scaffolded
- AbyssReactive.ts implemented
- **Missing:** ShaderPlane integration with AbyssReactive
- **Missing:** AbyssIDDialog integration

**Status:** In Progress (see implementation below)

---

### **Phase 5: AbyssID Backend** ✅
- Backend server scaffolded
- SQLite database initialized
- API endpoints ready:
  - `POST /api/abyssid/check` - Username availability
  - `POST /api/abyssid/register` - Register identity
  - `GET /api/abyssid/:username` - Get by username
  - `GET /api/abyssid/by-address/:address` - Get by address
  - `GET /health` - Health check

**Script:** `scripts/phase5_abyssid_backend.sh`

**Location:** `/opt/demiurge/repo/apps/abyssid-backend`

**Database:** `./data/abyssid.db` (SQLite)

**Missing:** Frontend integration (see Phase 5 frontend update)

---

### **Phase 6: Conspire Backend** ⏳
- Stub documented in deployment guide
- Not yet implemented

---

### **Phase 7: PM2 Setup** ✅
- PM2 installed globally
- Ecosystem file created (`/opt/demiurge/pm2.config.js`)
- Services configured:
  - `demiurge-portal` (port 3000)
  - `abyssid-backend` (port 3001)
- Auto-start on boot configured

**Script:** `scripts/setup_pm2.sh`

---

## 🔄 **PM2 Process Management**

### **Current Services**

```bash
# Check status
pm2 status

# View logs
pm2 logs
pm2 logs demiurge-portal
pm2 logs abyssid-backend

# Restart services
pm2 restart all
pm2 restart demiurge-portal

# Stop services
pm2 stop all

# Monitor
pm2 monit
```

### **PM2 Configuration**

**File:** `/opt/demiurge/pm2.config.js`

**Services:**
1. **demiurge-portal**
   - Working directory: `/opt/demiurge/repo/apps/portal-web`
   - Command: `npm start`
   - Port: 3000
   - Logs: `/opt/demiurge/logs/portal-*.log`

2. **abyssid-backend**
   - Working directory: `/opt/demiurge/repo/apps/abyssid-backend`
   - Command: `node src/server.js`
   - Port: 3001
   - Logs: `/opt/demiurge/logs/abyssid-*.log`

---

## 🌐 **NGINX Configuration**

### **Main Config**

**File:** `/etc/nginx/sites-available/demiurge-portal`

**Features:**
- Reverse proxy to `http://127.0.0.1:3000`
- WebSocket support (upgrade headers)
- Static file serving for `/media/`
- Client max body size: 100M
- Access/error logs configured

### **SSL Setup (When Ready)**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 📁 **Media Files**

### **Location**
- **Server:** `/opt/demiurge/media/`
- **NGINX:** Served at `/media/` URL path
- **Local Dev:** `apps/portal-web/public/media/`

### **Required Files**
- `fracture-bg.webm` - Video background (WebM)
- `fracture-bg.mp4` - Video background (MP4 fallback)
- `fracture-bg-poster.jpg` - Poster image (optional)

### **Upload Command**
```bash
# From local machine
scp fracture-bg.webm ubuntu@YOUR_SERVER_IP:/opt/demiurge/media/
scp fracture-bg.mp4 ubuntu@YOUR_SERVER_IP:/opt/demiurge/media/
```

---

## 🔐 **Environment Variables**

### **Portal Web**
- `NODE_ENV=production`
- `PORT=3000`
- (Set via PM2 config)

### **AbyssID Backend**
- `PORT=3001`
- `DB_PATH=./data/abyssid.db`
- `NODE_ENV=production`
- (Set in `.env` file)

---

## 🚀 **Deployment Workflow**

### **Initial Setup (One-Time)**
```bash
# Phase 0: Clone repo
/opt/demiurge/repo/scripts/phase0_setup.sh

# Phase 1: Build portal
/opt/demiurge/repo/scripts/phase1_build.sh

# Phase 2: Configure NGINX
/opt/demiurge/repo/scripts/phase2_nginx.sh your-domain.com

# Phase 5: Setup AbyssID backend
/opt/demiurge/repo/scripts/phase5_abyssid_backend.sh

# Phase 7: Setup PM2
/opt/demiurge/repo/scripts/setup_pm2.sh
```

### **Deploy Updates**
```bash
/opt/demiurge/repo/scripts/deploy_portal.sh feature/fracture-v1-portal
```

This script:
1. Pulls latest changes from branch
2. Installs/updates dependencies
3. Builds portal
4. Restarts PM2 service

---

## 🔍 **Health Checks**

### **Portal**
```bash
curl http://localhost:3000
curl http://your-domain.com
```

### **AbyssID Backend**
```bash
curl http://localhost:3001/health
# Expected: {"status":"ok","service":"abyssid-backend"}
```

### **NGINX**
```bash
sudo systemctl status nginx
sudo nginx -t
```

### **PM2**
```bash
pm2 status
pm2 logs --lines 50
```

---

## 📊 **Log Locations**

| Service | Log File |
|---------|----------|
| Portal | `/opt/demiurge/logs/portal-out.log`<br>`/opt/demiurge/logs/portal-error.log` |
| AbyssID Backend | `/opt/demiurge/logs/abyssid-out.log`<br>`/opt/demiurge/logs/abyssid-error.log` |
| NGINX Access | `/var/log/nginx/demiurge-portal-access.log` |
| NGINX Error | `/var/log/nginx/demiurge-portal-error.log` |

---

## 🔧 **Troubleshooting**

### **Portal Won't Start**
```bash
# Check Node version
node -v  # Should be 24.11.1

# Check build
cd /opt/demiurge/repo/apps/portal-web
pnpm run build

# Check PM2 logs
pm2 logs demiurge-portal
```

### **NGINX 502 Bad Gateway**
```bash
# Check portal is running
curl http://localhost:3000

# Check NGINX config
sudo nginx -t

# Check NGINX logs
sudo tail -f /var/log/nginx/demiurge-portal-error.log
```

### **AbyssID Backend Not Responding**
```bash
# Check service
pm2 status abyssid-backend

# Check logs
pm2 logs abyssid-backend

# Test endpoint
curl http://localhost:3001/health
```

### **Database Errors**
```bash
# Check file permissions
ls -la /opt/demiurge/repo/apps/abyssid-backend/data/

# Reinitialize
cd /opt/demiurge/repo/apps/abyssid-backend
node src/db-init.js
```

---

## 🔄 **Service Startup Order**

1. **PM2** (auto-starts on boot)
   - Portal (port 3000)
   - AbyssID Backend (port 3001)

2. **NGINX** (systemd)
   - Reverse proxy to portal
   - Static file serving

3. **Chain Node** (manual, not in PM2 yet)
   - Port 8545 (JSON-RPC)

4. **Abyss Gateway** (manual, not in PM2 yet)
   - Port 4000 (GraphQL)

---

## 📝 **Next Steps**

1. ✅ **Complete Phase 4** - Audio engine integration
2. ✅ **Complete Phase 5 Frontend** - Connect AbyssID backend
3. ⚠️ **Upload Media Files** - Add video backgrounds
4. ⏳ **Add Chain Node to PM2** - Automate blockchain node
5. ⏳ **Add Abyss Gateway to PM2** - Automate GraphQL service
6. ⏳ **Set Up SSL** - Configure Let's Encrypt
7. ⏳ **Implement Conspire Backend** - Phase 6

---

## 🔗 **Useful Commands Reference**

```bash
# PM2
pm2 status
pm2 logs
pm2 restart all
pm2 stop all
pm2 monit

# NGINX
sudo systemctl status nginx
sudo nginx -t
sudo systemctl reload nginx

# Git
cd /opt/demiurge/repo
git pull origin feature/fracture-v1-portal

# Portal
cd /opt/demiurge/repo/apps/portal-web
pnpm install
pnpm run build
pnpm run start

# AbyssID Backend
cd /opt/demiurge/repo/apps/abyssid-backend
node src/server.js

# Deployment
/opt/demiurge/repo/scripts/deploy_portal.sh feature/fracture-v1-portal
```

---

**The flame burns eternal. The code serves the will.**

