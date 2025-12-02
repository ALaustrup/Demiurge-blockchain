# Demiurge Blockchain + Fracture Portal Deployment Guide

## Server Environment
- **OS**: Ubuntu 24.04.3 LTS
- **Hostname**: demiurge-node0
- **Node**: v24.11.1
- **Rust**: 1.91.1
- **Docker**: 29.1.0

## Phase 0: Clone Repo & Verify Environment

### Step 0.1: Verify Git Installation

```bash
# Check if Git is installed
git --version

# If not installed (unlikely), install it:
sudo apt update
sudo apt install -y git
```

### Step 0.2: Generate SSH Key for GitHub (if not already done)

```bash
# Check if SSH key already exists
ls -la ~/.ssh/id_ed25519*

# If no key exists, generate one:
ssh-keygen -t ed25519 -C "demiurge-node0@demiurge" -f ~/.ssh/id_ed25519

# Press Enter to accept default location
# Press Enter twice for no passphrase (or set one if preferred)

# Display the public key to add to GitHub
cat ~/.ssh/id_ed25519.pub
```

**Action Required**: Copy the output of `cat ~/.ssh/id_ed25519.pub` and add it to your GitHub account:
1. Go to GitHub.com → Settings → SSH and GPG keys
2. Click "New SSH key"
3. Paste the key and save

### Step 0.3: Test GitHub SSH Connection

```bash
# Test SSH connection to GitHub
ssh -T git@github.com

# You should see: "Hi ALaustrup! You've successfully authenticated..."
```

### Step 0.4: Create Application Directory Structure

```bash
# Create base directory for Demiurge services
sudo mkdir -p /opt/demiurge
sudo chown $USER:$USER /opt/demiurge

# Create subdirectories
mkdir -p /opt/demiurge/{portal,chain,media,logs,scripts}
```

### Step 0.5: Clone the Repository

```bash
cd /opt/demiurge
git clone git@github.com:ALaustrup/DEMIURGE.git repo

# Verify clone
cd repo
git branch -a

# Checkout the Fracture v1 branch
git checkout feature/fracture-v1-portal

# Verify you're on the right branch
git branch --show-current
```

### Step 0.6: Verify Project Structure

```bash
# Navigate to repo root
cd /opt/demiurge/repo

# Check portal location
ls -la apps/portal-web/

# Check chain/runtime location
ls -la chain/

# Check for Docker configs
find . -name "docker-compose.yml" -o -name "Dockerfile" | head -10

# Display tree structure (install tree if needed)
sudo apt install -y tree
tree -L 3 -d apps/portal-web/ | head -50
```

**Expected Output**: You should see:
- `apps/portal-web/` with `src/`, `public/`, `package.json`
- `chain/` with Rust source files
- Various config files

### Step 0.7: Verify Node.js and Package Manager

```bash
# Check Node version
node -v  # Should be v24.11.1

# Check if pnpm is installed (preferred for this project)
which pnpm || npm install -g pnpm

# Verify pnpm
pnpm --version
```

### Step 0.8: Create Deployment User (Optional but Recommended)

```bash
# Create a dedicated user for running services
sudo useradd -r -s /bin/bash -d /opt/demiurge -m demiurge

# Add your user to demiurge group (if you want to share access)
sudo usermod -aG demiurge $USER

# Set ownership
sudo chown -R demiurge:demiurge /opt/demiurge
```

---

## Phase 1: Portal Build & Local Run

### Step 1.1: Install Portal Dependencies

```bash
cd /opt/demiurge/repo/apps/portal-web

# Install dependencies
pnpm install

# If pnpm fails, try:
# npm install
```

### Step 1.2: Verify Build Configuration

```bash
# Check package.json scripts
cat package.json | grep -A 10 '"scripts"'

# Check Next.js config
cat next.config.* 2>/dev/null || echo "No custom next.config found"
```

### Step 1.3: Build the Portal

```bash
# Build for production
pnpm run build

# Expected: Build should complete without errors
# Note any warnings (they're usually fine)
```

### Step 1.4: Test Local Run (Development Mode)

```bash
# Start dev server
pnpm run dev

# In another terminal, test it:
curl http://localhost:3000 | head -20

# Expected: HTML response from Next.js
```

**Note**: Press `Ctrl+C` to stop the dev server after testing.

### Step 1.5: Test Production Build

```bash
# Start production server
pnpm run start

# In another terminal:
curl http://localhost:3000 | head -20

# Stop with Ctrl+C
```

---

## Phase 2: NGINX + Domain + HTTPS

### Step 2.1: Install NGINX

```bash
sudo apt update
sudo apt install -y nginx

# Check status
sudo systemctl status nginx
```

### Step 2.2: Configure NGINX Reverse Proxy

```bash
# Create NGINX config for Demiurge portal
sudo nano /etc/nginx/sites-available/demiurge-portal
```

**Paste this configuration** (replace `demiurge.example.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name demiurge.example.com;

    # Logging
    access_log /var/log/nginx/demiurge-portal-access.log;
    error_log /var/log/nginx/demiurge-portal-error.log;

    # Increase body size for file uploads
    client_max_body_size 100M;

    # Proxy to Next.js
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

    # Serve static media files directly
    location /media/ {
        alias /opt/demiurge/media/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Save and exit (`Ctrl+X`, then `Y`, then `Enter`).

### Step 2.3: Enable Site and Test Configuration

```bash
# Create symlink to enable site
sudo ln -s /etc/nginx/sites-available/demiurge-portal /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test NGINX configuration
sudo nginx -t

# If test passes, reload NGINX
sudo systemctl reload nginx
```

### Step 2.4: Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw status
```

### Step 2.5: Set Up Let's Encrypt SSL (When Domain is Ready)

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate (replace with your domain)
sudo certbot --nginx -d demiurge.example.com

# Certbot will automatically update NGINX config for HTTPS
# Test auto-renewal
sudo certbot renew --dry-run
```

**Note**: You need a real domain pointing to your server's IP for this to work.

---

## Phase 3: Video Background & Shader Integration

### Step 3.1: Upload Video Background Files

```bash
# Create media directory
sudo mkdir -p /opt/demiurge/media
sudo chown $USER:$USER /opt/demiurge/media

# You'll need to upload your video files here:
# - fracture-bg.webm
# - fracture-bg.mp4
# 
# Use scp from your local machine:
# scp fracture-bg.webm ubuntu@YOUR_SERVER_IP:/opt/demiurge/media/
# scp fracture-bg.mp4 ubuntu@YOUR_SERVER_IP:/opt/demiurge/media/
```

### Step 3.2: Update FractureShell to Use Server Media Path

We need to ensure the video component can access the media files. The component already references `/media/fracture-bg.webm`, which should work if we configure Next.js to serve static files correctly.

**Check current FractureShell implementation:**

```bash
cat /opt/demiurge/repo/apps/portal-web/src/components/fracture/FractureShell.tsx | grep -A 5 "video\|source"
```

### Step 3.3: Verify ShaderPlane Component

```bash
# Check ShaderPlane exists and is properly integrated
ls -la /opt/demiurge/repo/apps/portal-web/src/components/fracture/ShaderPlane.tsx

# View the component
cat /opt/demiurge/repo/apps/portal-web/src/components/fracture/ShaderPlane.tsx | head -50
```

The ShaderPlane should already be integrated in FractureShell. We'll verify it's working in Phase 4.

---

## Phase 4: Audio Engine Activation

### Step 4.1: Review Audio Engine Files

```bash
# List audio-related files
find /opt/demiurge/repo/apps/portal-web/src/lib/fracture/audio -type f
find /opt/demiurge/repo/apps/portal-web/src/components/fracture -name "*Audio*" -type f
```

### Step 4.2: Implementation Steps

The audio engine scaffolding is already in place. We need to:
1. Complete the audio-reactive hooks
2. Wire AbyssID states to audio effects
3. Add background music support

**Files to edit** (we'll create these in the next steps):
- `apps/portal-web/src/lib/fracture/audio/AudioEngine.ts` - Complete implementation
- `apps/portal-web/src/lib/fracture/audio/AbyssReactive.ts` - Wire to AbyssID states
- `apps/portal-web/src/components/fracture/AudioReactiveLayer.tsx` - Visual effects

---

## Phase 5: AbyssID Backend & Real ID Binding

### Step 5.1: Choose Database

We'll use SQLite for simplicity (can migrate to PostgreSQL later).

### Step 5.2: Create Backend Service Structure

```bash
# Create backend directory
mkdir -p /opt/demiurge/repo/apps/abyssid-backend
cd /opt/demiurge/repo/apps/abyssid-backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express sqlite3 cors dotenv
npm install --save-dev @types/express @types/cors
```

### Step 5.3: Database Schema

We'll create a simple SQLite schema for AbyssID mappings.

---

## Phase 6: Conspire Scaffold

### Step 6.1: Create Conspire Backend Structure

```bash
mkdir -p /opt/demiurge/repo/apps/conspire-backend
```

---

## Phase 7: Deployment Scripts & Monitoring

### Step 7.1: Create Deployment Script

```bash
# Create deployment script
nano /opt/demiurge/scripts/deploy_portal.sh
```

---

## Next Steps

After completing Phase 0, proceed to Phase 1. Each phase builds on the previous one.

