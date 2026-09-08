# demiurge.cloud / demiurge.guru Deployment Guide

## Current Status

**Services**: Not currently running (blockchain-focused deployment)  
**Domains**: Configured and SSL-ready  
**RPC Endpoint**: Updated to custom runtime (post-build)

## Quick Deployment

### 1. Update Environment Files

**apps/marketing-site/.env**
```bash
OPENAI_API_KEY=your_api_key_here
NEXT_PUBLIC_QOR_AUTH_URL=https://qor-auth.demiurge.cloud
NEXT_PUBLIC_RPC_URL=https://rpc.demiurge.cloud
NEXT_PUBLIC_DEMIURGE_RPC_URL=https://rpc.demiurge.cloud
BUG_REPORT_EMAIL=dev@demiurge.cloud
NEXT_PUBLIC_API_URL=https://api.demiurge.cloud
```

**ai-website/.env**
```bash
NEXT_PUBLIC_RPC_URL=https://rpc.demiurge.cloud
NEXT_PUBLIC_API_URL=https://api.demiurge.cloud
NEXT_PUBLIC_SITE_URL=https://demiurge.cloud
```

### 2. Deploy to Production

```bash
# Build marketing site
cd apps/marketing-site
npm install
npm run build

# Build AI website
cd ../../ai-website
npm install
npm run build

# Deploy via Vercel (if configured)
vercel --prod
```

### 3. Deploy via Docker (if self-hosted)

```bash
# Create docker-compose for websites
docker-compose -f docker/docker-compose.websites.yml up -d
```

## New RPC Integration

All websites now connect to:
```
Production: https://rpc.demiurge.cloud (with all 11 pallets)
WebSocket: wss://rpc.demiurge.cloud
```

## SSL Status

✅ Both demiurge.cloud and demiurge.guru have Let's Encrypt certificates  
✅ Auto-renewal configured  
✅ Ready for production

## Sophia AI Assistant

Located in: `apps/marketing-site/src/components/SophiaAI.tsx`

Capabilities:
- Blockchain information queries
- QOR ID authentication assistance
- Real-time chain service status
- Development setup help
- Bug report submission

## Next Steps

1. Configure environment variables on deployment server
2. Build and deploy both websites
3. Update DNS records (already configured)
4. Run SSL verification
5. Test all RPC integrations

See [DEPLOYMENT.md](../docs/deployment/DEPLOYMENT.md) for production procedures.
