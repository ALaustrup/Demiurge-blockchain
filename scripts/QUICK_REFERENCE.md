# Monad Server Quick Reference

## 🚀 Quick Commands

### Service Management
```bash
# SSH to server
ssh pleroma

# Check all services
cd /data/Demiurge-Blockchain
docker compose -f docker/docker-compose.production.yml ps

# View logs
docker compose -f docker/docker-compose.production.yml logs -f [service]

# Restart service
docker compose -f docker/docker-compose.production.yml restart [service]

# Stop all
docker compose -f docker/docker-compose.production.yml down

# Start all
docker compose -f docker/docker-compose.production.yml up -d
```

### Health Checks
```bash
# QOR Auth
curl http://localhost:8080/health

# PostgreSQL
docker exec demiurge-postgres pg_isready -U qor_auth

# Redis
docker exec demiurge-redis redis-cli ping
```

### System Info
```bash
# Resources
htop
free -h
df -h

# Docker
docker stats
docker system df

# Network
netstat -tulpn | grep -E '8080|5432|6379|9944'
```

## 📍 Key Paths

- Repository: `/data/Demiurge-Blockchain`
- Docker config: `/data/Demiurge-Blockchain/docker`
- Environment: `/data/Demiurge-Blockchain/docker/.env`
- Blockchain: `/data/Demiurge-Blockchain/blockchain`
- Rust: `~/.cargo/env` (source before building)

## 🔧 Common Tasks

### Update Code
```bash
cd /data/Demiurge-Blockchain
git pull origin main
docker compose -f docker/docker-compose.production.yml build qor-auth
docker compose -f docker/docker-compose.production.yml up -d qor-auth
```

### Build Blockchain Node
```bash
cd /data/Demiurge-Blockchain/blockchain
source ~/.cargo/env
cargo build --release --bin demiurge-node
```

### Backup Database
```bash
docker exec demiurge-postgres pg_dump -U qor_auth qor_auth > backup_$(date +%Y%m%d).sql
```

---

**Server:** pleroma (127.0.0.1)  
**SSH:** `ssh pleroma`
