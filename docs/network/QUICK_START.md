# Quick Start - Demiurge Deployment

## Prerequisites
- Ubuntu 24.04.3 LTS server
- SSH access as `ubuntu` user
- Domain name (optional for Phase 2)

## Step-by-Step Execution

### 1. Connect to Server

```bash
ssh ubuntu@YOUR_SERVER_IP
```

### 2. Clone Repository (Phase 0)

```bash
# Run Phase 0 setup script
curl -o /tmp/phase0.sh https://raw.githubusercontent.com/ALaustrup/DEMIURGE/feature/fracture-v1-portal/scripts/phase0_setup.sh
chmod +x /tmp/phase0.sh
/tmp/phase0.sh

# OR manually:
sudo mkdir -p /opt/demiurge
sudo chown $USER:$USER /opt/demiurge
cd /opt/demiurge
git clone git@github.com:ALaustrup/DEMIURGE.git repo
cd repo
git checkout feature/fracture-v1-portal
```

**Important**: Add your SSH key to GitHub if prompted.

### 3. Build Portal (Phase 1)

```bash
cd /opt/demiurge/repo
chmod +x scripts/*.sh
./scripts/phase1_build.sh
```

### 4. Configure NGINX (Phase 2)

```bash
# Replace 'your-domain.com' with your actual domain
./scripts/phase2_nginx.sh your-domain.com
```

### 5. Upload Media Files (Phase 3)

```bash
# From your local machine:
scp fracture-bg.webm ubuntu@YOUR_SERVER_IP:/opt/demiurge/media/
scp fracture-bg.mp4 ubuntu@YOUR_SERVER_IP:/opt/demiurge/media/
```

### 6. Set Up PM2 (Phase 7)

```bash
./scripts/setup_pm2.sh
```

### 7. Deploy AbyssID Backend (Phase 5)

```bash
./scripts/phase5_abyssid_backend.sh
```

### 8. Update Frontend for AbyssID (Phase 5)

Follow instructions in `scripts/phase5_frontend_update.md` to update:
- `AbyssStateMachine.ts`
- Create `AbyssIDContext.tsx`
- Update `layout.tsx`

### 9. Implement Audio Engine (Phase 4)

Follow detailed guide in `scripts/phase4_audio_implementation.md`

### 10. Deploy Updates

```bash
./scripts/deploy_portal.sh feature/fracture-v1-portal
```

## Verify Everything Works

```bash
# Check services
pm2 status

# Check portal
curl http://localhost:3000

# Check AbyssID backend
curl http://localhost:3001/health

# Check NGINX
curl http://your-domain.com
```

## Common Commands

```bash
# View logs
pm2 logs
pm2 logs demiurge-portal
pm2 logs abyssid-backend

# Restart services
pm2 restart all
pm2 restart demiurge-portal

# Stop services
pm2 stop all

# Monitor in real-time
pm2 monit
```

## Troubleshooting

See `COMPLETE_DEPLOYMENT_INSTRUCTIONS.md` for detailed troubleshooting.

