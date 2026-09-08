# Demiurge Website Infrastructure Guide

**Last Updated**: January 22, 2026  
**Status**: Ready for Production Deployment

## Overview

The Demiurge ecosystem includes three web properties:

1. **demiurge.cloud** - AI Codex website (whitepaper, blog, documentation)
2. **demiurge.guru** - Marketing site (features, Sophia AI, community)
3. **rpc.demiurge.cloud** - Blockchain RPC endpoints

## Current Deployment Status

### Websites
- ✅ Code ready for production
- ✅ Environment files created
- ✅ Docker configurations prepared
- ⏳ Awaiting deployment trigger

### SSL/TLS
- ✅ Let's Encrypt certificates configured
- ✅ Auto-renewal scripts in place
- ✅ Nginx reverse proxy configured

### RPC Integration
- ✅ Updated to use custom runtime endpoints
- ✅ WebSocket support enabled
- ✅ Health monitoring configured

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              Production Server (Pleroma)            │
│              127.0.0.1                         │
└─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
   │  Nginx   │  │ Blockchain│  │  Websites │
   │ (443/80) │  │ Node RPC  │  │ (3000/01) │
   └────┬─────┘  │(19933/44) │  └─────┬─────┘
        │        └───────────┘        │
        │                             │
   ┌────▼──────────────────────────────▼─────┐
   │   Docker Network: demiurge                │
   └──────────────────────────────────────────┘
```

## Quick Deployment

### Option 1: Full Automated Deployment

```bash
./scripts/deploy-websites.sh
```

**What it does**:
1. Builds marketing site (Next.js)
2. Builds AI website (Next.js)
3. Creates Docker images
4. Deploys to production server
5. Starts services via docker-compose
6. Verifies SSL certificates
7. Runs health checks

**Time**: ~10-15 minutes

### Option 2: Manual Deployment

```bash
# 1. SSH to server
ssh ubuntu@127.0.0.1

# 2. Navigate to demiurge directory
cd ~/demiurge

# 3. Copy docker-compose
scp docker/docker-compose.websites.yml .
scp docker/nginx.websites.conf .

# 4. Set environment variables
export OPENAI_API_KEY="your_key_here"

# 5. Start services
docker compose -f docker-compose.websites.yml up -d

# 6. Verify
curl https://demiurge.cloud
curl https://demiurge.guru
```

---

## Environment Configuration

### Required Variables

**Marketing Site** (`apps/marketing-site/.env.production`):
```bash
OPENAI_API_KEY=sk_...              # For Sophia AI
NEXT_PUBLIC_RPC_URL=https://rpc.demiurge.cloud
NEXT_PUBLIC_API_URL=https://api.demiurge.cloud
```

**AI Website** (`ai-website/.env.production`):
```bash
NEXT_PUBLIC_RPC_URL=https://rpc.demiurge.cloud
NEXT_PUBLIC_API_URL=https://api.demiurge.cloud
```

All environment files are pre-configured and ready to use.

---

## RPC Integration

### Updated Endpoints

All websites now use the production RPC:

```
HTTPS:    https://rpc.demiurge.cloud
WebSocket: wss://rpc.demiurge.cloud
```

### Available with Custom Runtime (Post-Build)

- ✅ All 11 pallets accessible
- ✅ Health monitoring active
- ✅ Prometheus metrics available
- ✅ WebSocket subscriptions supported

### Integration Examples

**JavaScript/React**:
```typescript
import { DemiurgeRpcClient } from '@demiurge/rpc-client';

const rpc = new DemiurgeRpcClient('https://rpc.demiurge.cloud');
const health = await rpc.getHealth();
```

**HTML Direct**:
```javascript
fetch('https://rpc.demiurge.cloud', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'system_chain',
    params: [],
    id: 1
  })
});
```

---

## Service Architecture

### demiurge.cloud (AI Codex)
- **Path**: `ai-website/`
- **Framework**: Next.js
- **Port**: 3000 (internal), 443 (external)
- **Features**:
  - Whitepaper page
  - Blog with auto-updating posts
  - Interactive documentation
  - Sophia AI integration

### demiurge.guru (Marketing Site)
- **Path**: `apps/marketing-site/`
- **Framework**: Next.js + Tailwind
- **Port**: 3001 (internal), 443 (external)
- **Features**:
  - Hero section with animations
  - Sophia AI assistant
  - Community forum integration
  - Chain status dashboard
  - Documentation portal

### Sophia AI Assistant

Available on both marketing and AI websites.

**Capabilities**:
- Blockchain information queries
- QOR ID authentication help
- Real-time chain service status
- Development setup assistance
- Bug report submission

**Configuration**:
```typescript
// Requires OPENAI_API_KEY environment variable
// Located in: apps/marketing-site/src/components/SophiaAI.tsx
```

---

## Monitoring & Health Checks

### Service Health

```bash
# AI Website
curl https://demiurge.cloud/health

# Marketing Site
curl https://demiurge.guru/health

# Nginx Status
curl http://localhost:8080/nginx_status

# RPC Health
curl https://rpc.demiurge.cloud/health
```

### Docker Logs

```bash
# All services
docker compose -f docker-compose.websites.yml logs -f

# Individual services
docker logs demiurge-ai-website
docker logs demiurge-marketing-site
docker logs demiurge-nginx
```

### Performance Metrics

```bash
# Container resource usage
docker stats

# Nginx metrics
curl -s http://localhost:8080/nginx_status

# RPC metrics
curl -s http://127.0.0.1:9615/metrics | grep -E '(requests|errors|latency)'
```

---

## SSL Certificate Management

### Current Status

✅ Both domains have valid Let's Encrypt certificates:
- `demiurge.cloud` - Valid
- `demiurge.guru` - Valid

### Certificate Renewal

Automatic renewal is configured via certbot:

```bash
# Manual renewal (if needed)
sudo certbot renew --dry-run

# View certificates
sudo certbot certificates
```

### SSL Configuration

Located in: `docker/nginx.websites.conf`

**Security Features**:
- TLS 1.2+ only
- HSTS headers
- CORS configuration
- Security headers (Content-Type, XSS protection, etc.)

---

## Troubleshooting

### Website Not Responding

```bash
# 1. Check Docker containers
docker ps | grep demiurge

# 2. Check logs
docker logs demiurge-nginx

# 3. Check Nginx configuration
docker exec demiurge-nginx nginx -t

# 4. Check DNS
nslookup demiurge.cloud

# 5. Check firewall
sudo ufw status
```

### RPC Integration Issues

```bash
# Test RPC connectivity
curl -X POST https://rpc.demiurge.cloud \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"system_chain","params":[],"id":1}'

# Check blockchain service
docker logs demiurge-blockchain-node | tail -50

# Verify RPC ports
netstat -tuln | grep 1993
```

### Performance Issues

```bash
# Check resource usage
docker stats demiurge-ai-website
docker stats demiurge-marketing-site

# Check Nginx connections
curl -s http://localhost:8080/nginx_status

# Increase worker processes if needed
# Edit: docker/nginx.websites.conf
# Rebuild: docker compose up -d
```

---

## Deployment Checklist

**Before Deployment**:
- [ ] Build script tested locally
- [ ] Environment variables configured
- [ ] SSL certificates verified
- [ ] DNS records pointing to server
- [ ] Firewall rules allow 80/443
- [ ] Backup of existing configuration

**After Deployment**:
- [ ] demiurge.cloud responding (HTTPS)
- [ ] demiurge.guru responding (HTTPS)
- [ ] RPC integration working
- [ ] Health checks passing
- [ ] Sophia AI responding
- [ ] Logs monitored for errors
- [ ] Performance metrics acceptable

---

## Advanced Configuration

### Load Balancing

To add load balancing for high traffic:

```nginx
upstream ai_website {
    least_conn;
    server ai-website-1:3000 max_fails=3 fail_timeout=30s;
    server ai-website-2:3000 max_fails=3 fail_timeout=30s;
}
```

### Caching

Enable caching in Nginx:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### Rate Limiting

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;

location /api {
    limit_req zone=api burst=200 nodelay;
}
```

---

## References

- [Website Deployment Guide](./WEBSITE_DEPLOYMENT.md)
- [Integration Quick Reference](./INTEGRATION_QUICK_REFERENCE.md)
- [Hub/QOR Integration Guide](./HUB_QOR_INTEGRATION_GUIDE.md)
- [Nginx Configuration](../docker/nginx.websites.conf)
- [Docker Compose](../docker/docker-compose.websites.yml)
