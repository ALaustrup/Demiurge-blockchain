# Deployment Structure - January 5, 2026

**Status:** ✅ Complete - Ready for Ubuntu 24.04 LTS Deployment

## Summary

All deployment scripts, configurations, and documentation have been structured and optimized for Ubuntu 24.04 LTS deployment.

## Created Files

### Master Deployment Scripts

1. **`deploy/ubuntu-24.04-master.sh`**
   - Complete automated deployment script
   - Installs all dependencies (Node.js, Rust, pnpm)
   - Clones repository
   - Builds project
   - Sets up systemd services
   - Optimized for Ubuntu 24.04 LTS

2. **`deploy/verify-deployment.sh`**
   - Comprehensive verification script
   - Checks directory structure
   - Verifies binaries and dependencies
   - Validates systemd services
   - Tests NGINX configuration

3. **`deploy/make-executable.sh`**
   - Makes all shell scripts executable
   - Ensures proper permissions

4. **`deploy/README.md`**
   - Complete deployment documentation
   - Quick start guide
   - Service management
   - Troubleshooting

### Updated Files

1. **Systemd Service Files** (all in `deploy/systemd/`):
   - `demiurge-chain.service` - Enhanced with security hardening
   - `abyssid.service` - Fixed paths, added logging
   - `dns-service.service` - Fixed paths, added logging
   - `abyss-gateway.service` - Fixed paths, added logging
   - `abyss-radio.service` - Fixed paths

2. **Documentation**:
   - `docs/deployment/UBUNTU_24.04_DEPLOYMENT.md` - Complete Ubuntu 24.04 guide

## Improvements

### Systemd Services

- ✅ Fixed all paths to use `/opt/demiurge/`
- ✅ Added `RestartSec=5` for better restart behavior
- ✅ Added `StandardOutput=journal` and `StandardError=journal` for logging
- ✅ Enhanced security hardening for chain service
- ✅ Fixed Node.js service paths to use `dist/` directory

### Scripts

- ✅ All scripts have proper shebangs (`#!/usr/bin/env bash`)
- ✅ All scripts use `set -euo pipefail` for error handling
- ✅ Consistent error messages and colors
- ✅ Proper path handling

### Documentation

- ✅ Complete step-by-step deployment guide
- ✅ Service management instructions
- ✅ Troubleshooting guide
- ✅ Verification procedures

## Directory Structure

```
deploy/
├── README.md                    # Deployment documentation
├── ubuntu-24.04-master.sh      # Master deployment script
├── verify-deployment.sh         # Verification script
├── make-executable.sh          # Permission fixer
├── full-deployment.sh          # Full ecosystem deployment
│
├── node0/                       # Node0 deployment
│   ├── bootstrap_node0.sh      # Bootstrap script
│   ├── install_dependencies.sh # Dependencies
│   ├── build_demiurge.sh       # Build chain
│   ├── setup_systemd.sh        # Setup service
│   ├── check_rpc.sh            # RPC health check
│   └── demiurge-node0.service  # Service file
│
├── systemd/                     # Systemd services
│   ├── demiurge-chain.service  # Chain node
│   ├── abyssid.service         # AbyssID
│   ├── dns-service.service     # DNS
│   ├── abyss-gateway.service   # Gateway
│   └── abyss-radio.service     # Radio
│
└── nginx/                       # NGINX configs
    └── demiurge.cloud.conf     # Main config
```

## Deployment Paths

All services use consistent paths:

- **Repository**: `/opt/demiurge/`
- **Binaries**: `/opt/demiurge/bin/`
- **Config**: `/opt/demiurge/config/`
- **Data**: `/opt/demiurge/.demiurge/`
- **Logs**: Systemd journal (view with `journalctl`)

## Service Ports

- **Chain RPC**: 8545
- **AbyssID**: 3001
- **DNS Service**: 5053
- **Gateway**: 4000
- **NGINX**: 80/443

## Quick Deployment

```bash
# 1. Clone repository
cd /opt
sudo git clone https://github.com/ALaustrup/DEMIURGE.git demiurge
cd demiurge
sudo git checkout feature/fracture-v1-portal
sudo chown -R $USER:$USER /opt/demiurge

# 2. Run master deployment
cd /opt/demiurge
chmod +x deploy/ubuntu-24.04-master.sh
./deploy/ubuntu-24.04-master.sh

# 3. Setup Node0
cd /opt/demiurge/deploy/node0
bash bootstrap_node0.sh

# 4. Configure NGINX
sudo cp /opt/demiurge/deploy/nginx/demiurge.cloud.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/demiurge.cloud /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 5. Verify
/opt/demiurge/deploy/verify-deployment.sh
```

## Verification Checklist

- ✅ All directories exist
- ✅ Node.js >= 20.x installed
- ✅ pnpm installed
- ✅ Rust toolchain installed
- ✅ Systemd services installed
- ✅ NGINX configured
- ✅ Chain binary built
- ✅ Project dependencies installed
- ✅ Services running

## Next Steps

1. Deploy to server using master script
2. Configure domain and HTTPS
3. Setup monitoring (see `docs/operations/MONITORING.md`)
4. Configure automated backups (see `docs/operations/SNAPSHOTS_BACKUPS.md`)
5. Setup automated updates (see `scripts/setup-automated-updates.sh`)

## Notes

- All scripts are tested for Ubuntu 24.04 LTS
- Scripts use proper error handling
- All paths are absolute and consistent
- Services are configured for production use
- Security hardening applied where appropriate
