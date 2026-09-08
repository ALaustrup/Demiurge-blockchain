# Demiurge Server Deployment Status

**Date**: Jan 20, 2026  
**Server**: `pleroma` (Ubuntu 24.04 LTS)  
**Repo Location**: `~/demiurge`  
**Status**: In-Progress (Docker build running)

---

## ✅ Completed

### Infrastructure
- [x] SSH connectivity verified
- [x] Docker 29.1.5 available
- [x] Docker Compose v5.0.1 (plugin) available
- [x] Rust 1.92.0 (stable) installed with wasm32 target

### Services
- [x] PostgreSQL 18 running on `localhost:5432`
- [x] Redis 7.4 running on `localhost:6379`
- [x] Network `demiurge-network` created
- [x] Repository cloned to `~/demiurge` (from local backup)

### Configuration
- [x] `.env` created in `~/demiurge/docker/` (from `.env.example`)
- [x] Git remote configured: `https://github.com/ALaustrup/Demiurge-Blockchain.git`
- [x] Cargo environment configured for stable Rust

---

## 🔄 In Progress

### Blockchain Node Docker Build
**Command**: `docker build -t demiurge-node:latest -f blockchain/Dockerfile .`  
**Status**: Compiling Rust dependencies (started Jan 20, 21:38 UTC)  
**Est. Time**: 10-30 minutes total  
**Location**: `~/demiurge`

**To Check Build Status**:
```bash
ssh pleroma "docker build -t demiurge-node:latest -f ~/demiurge/blockchain/Dockerfile ~/demiurge 2>&1 | tail -30"
```

**To Monitor in Real-Time**:
```bash
ssh pleroma "cd ~/demiurge && docker build -t demiurge-node:latest -f blockchain/Dockerfile ."
```

---

## ⏭️ Next Steps (After Build Completes)

### 1. Verify Docker Image Built
```bash
ssh pleroma "docker images | grep demiurge-node"
```

### 2. Start Blockchain Node
Once the image is ready, run:
```bash
ssh pleroma "cd ~/demiurge/docker && docker compose -f docker-compose.yml -f docker-compose.node.yml up -d"
```

Or start only the node:
```bash
ssh pleroma "docker run -d --name demiurge-node \
  -p 9944:9944 -p 9933:9933 -p 30333:30333 -p 9615:9615 \
  -v demiurge-node-data:/data \
  --network demiurge-network \
  demiurge-node:latest"
```

### 3. Verify Node Health
```bash
# Check container status
ssh pleroma "docker ps | grep demiurge-node"

# Check logs
ssh pleroma "docker logs -f demiurge-node | head -50"

# Test RPC
ssh pleroma "curl -s http://localhost:9933/health | jq ."

# Test WebSocket
ssh pleroma "curl -s -w '\n' -d '{\"jsonrpc\":\"2.0\",\"method\":\"system_chain\",\"params\":[],\"id\":1}' http://localhost:9933 | jq ."
```

### 4. Connect Hub & QOR Auth Services
Once node is running, update Hub `.env`:
```bash
ssh pleroma "cat >> ~/demiurge/docker/.env <<'EOF'
NEXT_PUBLIC_BLOCKCHAIN_WS_URL=ws://demiurge-node:9944
NEXT_PUBLIC_BLOCKCHAIN_RPC_URL=http://demiurge-node:9933
EOF
"
```

Then restart services:
```bash
ssh pleroma "cd ~/demiurge/docker && docker compose restart hub qor-auth"
```

### 5. Generate Chain Spec (Optional, for Production)
```bash
ssh pleroma "docker run --rm demiurge-node:latest build-spec --dev > chain-spec-dev.json"
```

---

## 📋 Service Ports

| Service | Port | Type | URL |
|---------|------|------|-----|
| **PostgreSQL** | 5432 | TCP | `postgresql://localhost:5432/qor_auth` |
| **Redis** | 6379 | TCP | `redis://localhost:6379` |
| **Blockchain WS** | 9944 | WS | `ws://localhost:9944` |
| **Blockchain RPC** | 9933 | HTTP | `http://localhost:9933` |
| **P2P** | 30333 | TCP | (internal) |
| **Metrics** | 9615 | HTTP | `http://localhost:9615/metrics` |
| **Hub** | 3000 | HTTP | `http://localhost:3000` |
| **QOR Auth** | 8080 | HTTP | `http://localhost:8080` |

---

## 🐛 Troubleshooting

### Build Failed or Stuck?
1. Check container logs:
   ```bash
   ssh pleroma "docker ps -a | grep builder"
   docker logs <builder_container_id>
   ```

2. Restart build:
   ```bash
   ssh pleroma "docker build --no-cache -t demiurge-node:latest -f ~/demiurge/blockchain/Dockerfile ~/demiurge"
   ```

3. Check disk space:
   ```bash
   ssh pleroma "df -h"
   ```

### Services Won't Start?
```bash
# Check overall docker status
ssh pleroma "docker system info"

# Clean up orphaned containers
ssh pleroma "docker compose -f ~/demiurge/docker/docker-compose.yml down --remove-orphans"

# Restart fresh
ssh pleroma "cd ~/demiurge/docker && docker compose up -d"
```

### RPC Not Responding?
```bash
# Check if node is running
ssh pleroma "docker ps | grep demiurge-node"

# Check logs for sync errors
ssh pleroma "docker logs demiurge-node | tail -100 | grep -i 'error\|sync'"

# Verify port is bound
ssh pleroma "netstat -tulpn 2>/dev/null | grep 9933"
```

---

## 📂 File Locations on Server

- **Repo**: `~/demiurge`
- **Blockchain**: `~/demiurge/blockchain`
- **Docker Config**: `~/demiurge/docker`
- **Docker Env**: `~/demiurge/docker/.env`
- **Node Override Compose**: `~/demiurge/docker/docker-compose.node.yml` (NEW)
- **Data Volumes**: `/var/lib/docker/volumes/demiurge-*`

---

## 🔗 Resources

- **Local Docs**:
  - `~/demiurge/docker/README.md` - Docker setup guide
  - `~/demiurge/docker/BLOCKCHAIN_NODE.md` - Node deployment options
  - `~/demiurge/blockchain/BUILD.md` - Blockchain build details
  - `~/demiurge/PALLET_BUILD_STATUS.md` - Pallet compilation status (11/12 success)

- **GitHub**: https://github.com/ALaustrup/Demiurge-Blockchain

---

## 📝 Notes

- The blockchain node build uses a multi-stage Docker build (compiler → runtime) to minimize final image size
- All services run in the `demiurge-network` Docker network for service-to-service communication
- Data persists in named Docker volumes (`demiurge-node-data`, `demiurge-postgres-data`, etc.)
- The `.env` file contains sensitive defaults; update `POSTGRES_PASSWORD`, JWT secrets, etc., before production
- QOR Auth was restarting due to DB schema conflicts from a prior run; fresh build should resolve this

---

**Last Updated**: Jan 20, 2026, 21:38 UTC  
**Next Check**: Monitor blockchain build completion (check in 15-30 minutes)
