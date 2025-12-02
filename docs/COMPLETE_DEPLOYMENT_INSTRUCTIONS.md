# Complete Deployment Instructions - Demiurge Blockchain + Fracture Portal

## Quick Start Summary

1. **Phase 0**: Clone repo, verify environment
2. **Phase 1**: Build portal locally
3. **Phase 2**: Configure NGINX
4. **Phase 3**: Upload media files
5. **Phase 4**: Implement audio engine
6. **Phase 5**: Set up AbyssID backend
7. **Phase 6**: Scaffold Conspire
8. **Phase 7**: Create deployment scripts

---

## Phase 0: Clone Repo & Verify Environment

**On your Ubuntu server, run:**

```bash
# Make scripts executable
chmod +x /opt/demiurge/repo/scripts/*.sh

# Run Phase 0 setup
/opt/demiurge/repo/scripts/phase0_setup.sh
```

**Manual steps if script fails:**

1. **Generate SSH key** (if needed):
   ```bash
   ssh-keygen -t ed25519 -C "demiurge-node0@demiurge" -f ~/.ssh/id_ed25519 -N ""
   cat ~/.ssh/id_ed25519.pub
   ```
   Add the output to GitHub: Settings → SSH and GPG keys

2. **Clone repository**:
   ```bash
   sudo mkdir -p /opt/demiurge
   sudo chown $USER:$USER /opt/demiurge
   cd /opt/demiurge
   git clone git@github.com:ALaustrup/DEMIURGE.git repo
   cd repo
   git checkout feature/fracture-v1-portal
   ```

3. **Verify structure**:
   ```bash
   ls -la apps/portal-web/
   ls -la chain/
   ```

---

## Phase 1: Portal Build & Local Run

```bash
/opt/demiurge/repo/scripts/phase1_build.sh
```

**Manual steps:**

```bash
cd /opt/demiurge/repo/apps/portal-web
pnpm install
pnpm run build
pnpm run start  # Test it works
# Press Ctrl+C to stop
```

---

## Phase 2: NGINX + Domain + HTTPS

```bash
# Replace 'demiurge.example.com' with your actual domain
/opt/demiurge/repo/scripts/phase2_nginx.sh demiurge.example.com
```

**After domain is configured, set up HTTPS:**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**Verify NGINX is proxying correctly:**

```bash
curl http://localhost:3000  # Should return Next.js HTML
sudo systemctl status nginx
```

---

## Phase 3: Video Background & Shader Integration

**Upload your video files:**

```bash
# From your local machine:
scp fracture-bg.webm ubuntu@YOUR_SERVER_IP:/opt/demiurge/media/
scp fracture-bg.mp4 ubuntu@YOUR_SERVER_IP:/opt/demiurge/media/

# On server, verify:
ls -lh /opt/demiurge/media/
```

**The FractureShell component already references `/media/fracture-bg.webm`**, so it should work automatically once files are uploaded.

**Verify ShaderPlane is integrated:**

```bash
grep -r "ShaderPlane" /opt/demiurge/repo/apps/portal-web/src/components/fracture/
```

---

## Phase 4: Audio Engine Activation

**Follow the implementation guide:**

See `scripts/phase4_audio_implementation.md` for detailed code changes.

**Quick summary:**
1. Complete `AudioEngine.ts` implementation
2. Update `AbyssReactive.ts` to map states to audio effects
3. Wire `ShaderPlane` to use `AbyssReactive` values
4. Add background music support (optional)

**Test audio reactivity:**

1. Open AbyssID ritual
2. Verify shader effects change with state transitions
3. Test with microphone or background music

---

## Phase 5: AbyssID Backend & Real ID Binding

**Set up backend:**

```bash
/opt/demiurge/repo/scripts/phase5_abyssid_backend.sh
```

**Update frontend:**

See `scripts/phase5_frontend_update.md` for code changes to:
- `AbyssStateMachine.ts` - Use real API
- Create `AbyssIDContext.tsx` - Store identity
- Update `layout.tsx` - Wrap with provider

**Test the flow:**

1. Start backend: `cd /opt/demiurge/repo/apps/abyssid-backend && node src/server.js`
2. Open portal, click AbyssID
3. Enter username → should check against backend
4. Complete registration → should save to database

---

## Phase 6: Conspire Scaffold

**Create basic structure:**

```bash
mkdir -p /opt/demiurge/repo/apps/conspire-backend/src
cd /opt/demiurge/repo/apps/conspire-backend
npm init -y
npm install express cors dotenv
```

**Create basic server** (`src/server.js`):

```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Stub endpoint for now
app.post('/api/conspire/chat', (req, res) => {
  const { message, context } = req.body;
  
  // Echo bot for testing
  res.json({
    response: `Echo: ${message}`,
    context: context || {},
  });
});

app.listen(3002, () => {
  console.log('Conspire backend running on port 3002');
});
```

**Update frontend** to call this endpoint (stub for now).

---

## Phase 7: Deployment Scripts & Monitoring

**Set up PM2:**

```bash
/opt/demiurge/repo/scripts/setup_pm2.sh
```

**Create deployment script:**

The `deploy_portal.sh` script is already created. Use it:

```bash
/opt/demiurge/repo/scripts/deploy_portal.sh feature/fracture-v1-portal
```

**Monitor services:**

```bash
pm2 status
pm2 logs
pm2 monit  # Real-time monitoring
```

---

## File Structure Summary

```
/opt/demiurge/
├── repo/                    # Git repository
│   ├── apps/
│   │   ├── portal-web/      # Next.js portal
│   │   ├── abyssid-backend/ # Identity service
│   │   └── conspire-backend/ # AI chat service
│   ├── chain/               # Rust blockchain
│   └── scripts/             # Deployment scripts
├── media/                   # Video/audio files
├── logs/                    # Service logs
└── pm2.config.js            # PM2 configuration
```

---

## Troubleshooting

### Portal won't start
- Check Node version: `node -v` (should be 24.11.1)
- Check build: `cd apps/portal-web && pnpm run build`
- Check logs: `pm2 logs demiurge-portal`

### NGINX 502 Bad Gateway
- Check portal is running: `curl http://localhost:3000`
- Check NGINX config: `sudo nginx -t`
- Check NGINX logs: `sudo tail -f /var/log/nginx/demiurge-portal-error.log`

### AbyssID backend not responding
- Check service: `pm2 status abyssid-backend`
- Check logs: `pm2 logs abyssid-backend`
- Test endpoint: `curl http://localhost:3001/health`

### Database errors
- Check file permissions: `ls -la apps/abyssid-backend/data/`
- Reinitialize: `cd apps/abyssid-backend && node src/db-init.js`

---

## Next Steps After Deployment

1. **Configure domain DNS** to point to your server IP
2. **Set up SSL** with Let's Encrypt
3. **Add monitoring** (optional: Prometheus, Grafana)
4. **Set up backups** for database and media files
5. **Implement real ArchonAI** integration (replace stub)

---

## Git Workflow

**For each phase:**

```bash
# Create feature branch
git checkout -b feature/fracture-v1-deployment

# Make changes
# ... edit files ...

# Commit
git add .
git commit -m "feat: implement Phase X - [description]"

# Push
git push origin feature/fracture-v1-deployment
```

**When ready to merge:**

```bash
# Create PR on GitHub
# After review, merge to main/develop
```

---

## Security Considerations

1. **Firewall**: UFW is enabled, only SSH and HTTP/HTTPS open
2. **SSH Keys**: Use key-based auth, disable password auth
3. **Database**: SQLite is fine for now, migrate to PostgreSQL for production
4. **Secrets**: Use `.env` files, never commit secrets
5. **HTTPS**: Always use SSL in production

---

## Support

If you encounter issues:
1. Check logs: `pm2 logs` or `sudo journalctl -u nginx`
2. Verify services: `pm2 status` and `sudo systemctl status nginx`
3. Test endpoints: `curl http://localhost:PORT/health`

