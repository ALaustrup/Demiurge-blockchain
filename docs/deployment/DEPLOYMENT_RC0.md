# Deployment Guide - Release Candidate 0

**Status:** ✅ Ready for RC0  
**Date:** January 5, 2026

---

## Overview

This guide covers deploying the Fracture Portal with Docker Compose for Release Candidate 0. The deployment includes the portal web app and Abyss Gateway (GraphQL API + SQLite).

---

## Prerequisites

- Docker and Docker Compose installed
- At least 2GB RAM available
- Ports 3000 and 4000 available

---

## Quick Start

### 1. Clone and Setup

```bash
git clone <repo-url>
cd DEMIURGE
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```bash
# Genesis Mode (demo)
GENESIS_MODE=true

# Fabric Mode: genesis | real-devnet | real-prod
FABRIC_MODE=genesis

# Fabric Endpoints (if using real Fabric)
FABRIC_DEVNET_ENDPOINT=http://localhost:8080/api/fabric
FABRIC_PROD_ENDPOINT=https://fabric.demiurge.xyz/api/fabric

# Operator Configuration
CURRENT_USER_ID=operator-1
CURRENT_USER_ROLE=OPERATOR
CURRENT_USER_NAME=Operator

# Snapshot Service
DISABLE_SNAPSHOT_SERVICE=false
SNAPSHOT_INTERVAL_MS=300000  # 5 minutes

# Chain RPC (optional)
DEMIURGE_RPC_URL=http://127.0.0.1:8545/rpc
```

### 3. Build and Run

```bash
docker-compose up -d
```

The portal will be available at:
- **Portal Web:** http://localhost:3000
- **GraphQL API:** http://localhost:4000/graphql
- **GraphiQL:** http://localhost:4000/graphql

---

## Configuration Modes

### Genesis Mode (Demo)

**Environment:**
```bash
GENESIS_MODE=true
FABRIC_MODE=genesis
```

**Features:**
- Synthetic Fabric network (25-40 nodes)
- Scripted network phases
- Genesis ritual sequence
- Onboarding overlay

**Use Case:** Demo, testing, development

---

### Real Fabric - Devnet

**Environment:**
```bash
GENESIS_MODE=false
FABRIC_MODE=real-devnet
FABRIC_DEVNET_ENDPOINT=http://your-devnet-fabric-api:8080/api/fabric
```

**Features:**
- Real Fabric data from devnet endpoint
- Live network topology
- Real-time metrics

**Use Case:** Development with real Fabric

---

### Real Fabric - Production

**Environment:**
```bash
GENESIS_MODE=false
FABRIC_MODE=real-prod
FABRIC_PROD_ENDPOINT=https://fabric.demiurge.xyz/api/fabric
```

**Features:**
- Real Fabric data from production endpoint
- Live network topology
- Real-time metrics

**Use Case:** Production deployment

---

## Operator Roles

### OBSERVER (Read-Only)

**Environment:**
```bash
CURRENT_USER_ROLE=OBSERVER
```

**Permissions:**
- View all data
- Cannot start/stop rituals
- Cannot apply Archon proposals
- Cannot export sessions

---

### OPERATOR

**Environment:**
```bash
CURRENT_USER_ROLE=OPERATOR
```

**Permissions:**
- All OBSERVER permissions
- Start/stop rituals
- Apply Archon proposals
- Export sessions

---

### ARCHITECT

**Environment:**
```bash
CURRENT_USER_ROLE=ARCHITECT
```

**Permissions:**
- All OPERATOR permissions
- Access advanced configuration
- Enable/disable Genesis Mode switches

---

## Key Environment Variables

### Portal Web

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_GENESIS_MODE` | `false` | Enable Genesis demo mode |
| `NEXT_PUBLIC_FABRIC_MODE` | `genesis` | Fabric data source mode |
| `NEXT_PUBLIC_FABRIC_DEVNET_ENDPOINT` | `http://localhost:8080/api/fabric` | Devnet Fabric API endpoint |
| `NEXT_PUBLIC_FABRIC_PROD_ENDPOINT` | `https://fabric.demiurge.xyz/api/fabric` | Production Fabric API endpoint |
| `NEXT_PUBLIC_CURRENT_USER_ID` | `default` | Current operator ID |
| `NEXT_PUBLIC_CURRENT_USER_ROLE` | `OBSERVER` | Current operator role |
| `NEXT_PUBLIC_CURRENT_USER_NAME` | `Observer` | Current operator display name |
| `NEXT_PUBLIC_GRAPHQL_ENDPOINT` | `http://abyss-gateway:4000/graphql` | GraphQL API endpoint |

### Abyss Gateway

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | GraphQL server port |
| `DISABLE_SNAPSHOT_SERVICE` | `false` | Disable snapshot service |
| `SNAPSHOT_INTERVAL_MS` | `300000` | Snapshot interval (5 minutes) |
| `DEMIURGE_RPC_URL` | `http://127.0.0.1:8545/rpc` | Chain RPC endpoint |

---

## Running Locally (Without Docker)

### Portal Web

```bash
cd apps/portal-web
npm install
npm run dev
```

**Environment:**
```bash
NEXT_PUBLIC_GENESIS_MODE=true
NEXT_PUBLIC_FABRIC_MODE=genesis
NEXT_PUBLIC_CURRENT_USER_ROLE=OPERATOR
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:4000/graphql
```

### Abyss Gateway

```bash
cd indexer/abyss-gateway
npm install
npm run dev
```

**Environment:**
```bash
PORT=4000
DISABLE_SNAPSHOT_SERVICE=false
SNAPSHOT_INTERVAL_MS=300000
```

---

## Data Persistence

SQLite database is stored in:
- **Docker:** `./indexer/abyss-gateway/data/chat.db`
- **Local:** `indexer/abyss-gateway/data/chat.db`

**Backup:**
```bash
cp indexer/abyss-gateway/data/chat.db backup/chat-$(date +%Y%m%d).db
```

---

## Troubleshooting

### Portal won't start

1. Check ports 3000 and 4000 are available
2. Verify environment variables are set correctly
3. Check Docker logs: `docker-compose logs portal-web`

### GraphQL errors

1. Verify Abyss Gateway is running: `docker-compose logs abyss-gateway`
2. Check database is initialized: `ls indexer/abyss-gateway/data/chat.db`
3. Verify GraphQL endpoint in portal config

### Fabric data not loading

1. Check `FABRIC_MODE` is set correctly
2. Verify Fabric API endpoint is accessible
3. Check network connectivity to Fabric endpoint
4. Review browser console for errors

### Operator role not working

1. Verify `CURRENT_USER_ROLE` is set correctly (OBSERVER, OPERATOR, ARCHITECT)
2. Check operator exists in database (via GraphQL query)
3. Refresh browser to reload operator context

---

## Production Considerations

### Security

- Use environment variables for sensitive config
- Restrict GraphQL endpoint access
- Use HTTPS in production
- Implement proper authentication (not in RC0)

### Performance

- Adjust `SNAPSHOT_INTERVAL_MS` based on load
- Monitor SQLite database size
- Consider database optimization for large datasets

### Monitoring

- Monitor Docker container health
- Track GraphQL query performance
- Monitor Fabric API response times
- Log system events for audit trail

---

## Next Steps

1. **Authentication:** Implement proper user authentication
2. **Database:** Consider PostgreSQL for production
3. **Caching:** Add Redis for session/query caching
4. **Load Balancing:** Add nginx for load balancing
5. **Monitoring:** Integrate Prometheus/Grafana

---

**The flame burns eternal. The code serves the will.**

