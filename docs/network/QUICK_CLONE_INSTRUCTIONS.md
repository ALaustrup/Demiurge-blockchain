# Quick Clone Instructions - OVHcloud Server

## Prerequisites
- SSH access to your OVHcloud server
- SSH key added to GitHub (or use HTTPS)

---

## Method 1: Direct Clone (Your Preferred Method)

```bash
# Connect to your server
ssh ubuntu@YOUR_SERVER_IP
# or
ssh root@YOUR_SERVER_IP

# Navigate to /opt
cd /opt

# Clone the repository
git clone git@github.com:ALaustrup/DEMIURGE.git

# Navigate into the repo
cd DEMIURGE

# Checkout the feature branch
git checkout feature/fracture-v1-portal

# Verify
git branch --show-current
# Should show: feature/fracture-v1-portal
```

---

## Method 2: Using the Clone Script

```bash
# Connect to your server
ssh ubuntu@YOUR_SERVER_IP

# Clone the repository first (to get the script)
cd /opt
git clone git@github.com:ALaustrup/DEMIURGE.git
cd DEMIURGE
git checkout feature/fracture-v1-portal

# Make script executable
chmod +x scripts/clone-repo.sh

# Run the script (if you want to clone to a different location)
# ./scripts/clone-repo.sh /opt/demiurge
```

---

## Method 3: HTTPS Clone (If SSH Key Not Set Up)

```bash
cd /opt
git clone https://github.com/ALaustrup/DEMIURGE.git
cd DEMIURGE
git checkout feature/fracture-v1-portal
```

---

## Verify Clone Success

```bash
# Check repository location
pwd
# Should show: /opt/DEMIURGE

# Check branch
git branch --show-current
# Should show: feature/fracture-v1-portal

# Check repository structure
ls -la
# Should show: apps/, chain/, indexer/, scripts/, etc.

# Check for key files
ls -la apps/portal-web/
ls -la scripts/
```

---

## Next Steps After Cloning

1. **Set up automated updates:**
   ```bash
   cd /opt/DEMIURGE
   chmod +x scripts/setup-automated-updates.sh
   sudo ./scripts/setup-automated-updates.sh
   ```

2. **Follow the deployment guide:**
   ```bash
   cat OVHCLOUD_DEPLOYMENT_GUIDE.md
   ```

3. **Build and deploy services:**
   - See `OVHCLOUD_DEPLOYMENT_GUIDE.md` for complete instructions

---

## Troubleshooting

### SSH Key Not Set Up
If you get "Permission denied (publickey)":

1. **Generate SSH key on server:**
   ```bash
   ssh-keygen -t ed25519 -C "demiurge-server@ovhcloud"
   cat ~/.ssh/id_ed25519.pub
   ```

2. **Add to GitHub:**
   - Go to GitHub → Settings → SSH and GPG keys
   - Click "New SSH key"
   - Paste the public key

3. **Or use HTTPS instead:**
   ```bash
   git clone https://github.com/ALaustrup/DEMIURGE.git
   ```

### Repository Already Exists
If `/opt/DEMIURGE` already exists:

```bash
# Remove and re-clone
rm -rf /opt/DEMIURGE
cd /opt
git clone git@github.com:ALaustrup/DEMIURGE.git
cd DEMIURGE
git checkout feature/fracture-v1-portal
```

---

**Ready to deploy!** 🚀

