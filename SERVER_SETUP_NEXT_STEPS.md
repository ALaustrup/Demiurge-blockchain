# Server Setup - Next Steps

## ✅ Commands You Just Ran

These are the correct commands for cloning the repository:

```bash
cd /opt
sudo git clone https://github.com/ALaustrup/DEMIURGE.git
cd DEMIURGE
sudo git checkout feature/fracture-v1-portal
sudo chown -R ubuntu:ubuntu /opt/DEMIURGE
```

---

## 🔍 Verification Steps

After running those commands, verify everything worked:

```bash
# Check you're in the right place
cd /opt/DEMIURGE
pwd
# Should show: /opt/DEMIURGE

# Check branch
git branch --show-current
# Should show: feature/fracture-v1-portal

# Check files
ls -la
# Should show repository files

# Check git status
git status
# Should show clean working tree
```

---

## 📦 Next Steps: Install Dependencies

### Step 1: Install Node.js (if not already installed)

```bash
# Check if Node.js is installed
node -v
npm -v

# If not installed or old version, install Node.js 20.x:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v  # Should show v20.x.x
npm -v
```

### Step 2: Install pnpm

```bash
# Install pnpm globally
sudo npm install -g pnpm

# Verify
pnpm -v
```

### Step 3: Install Project Dependencies

```bash
# Navigate to project
cd /opt/DEMIURGE

# Install dependencies
pnpm install

# This may take a few minutes...
```

### Step 4: Build the Project

```bash
# Build the project
pnpm run build

# This will compile everything...
```

---

## 🚀 Complete Setup Script

You can also run this all-in-one script:

```bash
#!/bin/bash
# Complete DEMIURGE setup on server

set -e

echo "=== DEMIURGE Server Setup ==="

# Update system
echo "📦 Updating system..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "📦 Installing packages..."
sudo apt install -y \
    git \
    curl \
    build-essential \
    nginx \
    nodejs \
    npm

# Install Node.js 20.x (if needed)
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt 20 ]; then
    echo "📦 Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install pnpm
echo "📦 Installing pnpm..."
sudo npm install -g pnpm

# Navigate to project
cd /opt/DEMIURGE

# Install dependencies
echo "📦 Installing project dependencies..."
pnpm install

# Build project
echo "🔨 Building project..."
pnpm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next: Configure NGINX and PM2 (see OVHCLOUD_DEPLOYMENT_GUIDE.md)"
```

Save this as `setup-demiurge.sh` and run:
```bash
chmod +x setup-demiurge.sh
./setup-demiurge.sh
```

---

## 📋 Quick Command Reference

```bash
# Navigate to project
cd /opt/DEMIURGE

# Check status
git status
git branch --show-current

# Install dependencies
pnpm install

# Build
pnpm run build

# Run dev server (for testing)
pnpm dev

# Check Node.js version
node -v
npm -v
pnpm -v
```

---

## 🔧 Troubleshooting

### "pnpm: command not found"
```bash
sudo npm install -g pnpm
```

### "Node.js version too old"
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### "Permission denied" errors
```bash
# Make sure ownership is correct
sudo chown -R ubuntu:ubuntu /opt/DEMIURGE
```

### "Git clone failed"
- Check internet connection: `ping github.com`
- Try again: `sudo git clone https://github.com/ALaustrup/DEMIURGE.git`

---

## 📚 Full Deployment Guide

For complete deployment instructions including NGINX configuration and PM2 setup, see:
- `OVHCLOUD_DEPLOYMENT_GUIDE.md`

