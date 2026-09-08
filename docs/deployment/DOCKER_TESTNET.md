# Docker Testnet Deployment Guide

**Last Updated:** February 4, 2026

This guide covers deploying a multi-node Demiurge testnet using Docker Compose.

---

## Overview

The Docker testnet configuration provides:

- **4 Demiurge nodes** with automatic peer discovery
- **Nginx RPC proxy** with load balancing
- **Prometheus** for metrics collection
- **Grafana** for visualization dashboards
- **Health checks** and automatic restart

---

## Prerequisites

### Required Software

```bash
# Docker
docker --version  # 20.10+

# Docker Compose
docker compose version  # 2.0+
```

### System Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 8 GB | 16 GB |
| CPU | 4 cores | 8 cores |
| Storage | 20 GB | 50 GB |

---

## Quick Start

```bash
# Navigate to docker directory
cd docker

# Start the testnet
docker compose -f docker-compose.testnet.yml up -d

# Check status
docker compose -f docker-compose.testnet.yml ps

# View logs
docker compose -f docker-compose.testnet.yml logs -f

# Stop testnet
docker compose -f docker-compose.testnet.yml down
```

---

## Architecture

```
                    ┌──────────────────┐
                    │   Load Balancer  │
                    │   (Nginx:9944)   │
                    └────────┬─────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       │                     │                     │
       ▼                     ▼                     ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│    Node 1    │   │    Node 2    │   │    Node 3    │
│  (Validator) │◄──│  (Validator) │◄──│  (Validator) │
│   :30334     │   │   :30335     │   │   :30336     │
└──────────────┘   └──────────────┘   └──────────────┘
       │                     │                     │
       └──────────────┬──────┴──────────────┬──────┘
                      │                      │
               ┌──────────────┐   ┌──────────────┐
               │  Prometheus  │   │   Grafana    │
               │    :9090     │   │    :3001     │
               └──────────────┘   └──────────────┘
```

---

## Configuration Files

### docker-compose.testnet.yml

Located at `docker/docker-compose.testnet.yml`:

```yaml
version: '3.8'

services:
  node1:
    image: demiurge-node:latest
    build:
      context: ..
      dockerfile: docker/Dockerfile.node
    environment:
      - NODE_NAME=node1
      - NODE_KEY=0x1111...
      - VALIDATOR_ENABLED=true
      - BOOTNODES=
    ports:
      - "30334:30333"
      - "9945:9944"
    volumes:
      - node1-data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9944/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # node2, node3, node4 similar...

  nginx:
    image: nginx:alpine
    ports:
      - "9944:9944"
    volumes:
      - ./testnet/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - node1
      - node2
      - node3
      - node4

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./testnet/prometheus.yml:/etc/prometheus/prometheus.yml:ro

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Nginx Configuration

Located at `docker/testnet/nginx.conf`:

```nginx
upstream demiurge_rpc {
    least_conn;
    server node1:9944;
    server node2:9944;
    server node3:9944;
    server node4:9944;
}

upstream demiurge_ws {
    ip_hash;  # Sticky sessions for WebSocket
    server node1:9944;
    server node2:9944;
    server node3:9944;
    server node4:9944;
}

server {
    listen 9944;

    location / {
        # WebSocket detection
        if ($http_upgrade = "websocket") {
            proxy_pass http://demiurge_ws;
        }
        
        proxy_pass http://demiurge_rpc;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Prometheus Configuration

Located at `docker/testnet/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'demiurge'
    static_configs:
      - targets:
          - node1:9615
          - node2:9615
          - node3:9615
          - node4:9615
    relabel_configs:
      - source_labels: [__address__]
        regex: 'node(\d+):9615'
        replacement: 'Node ${1}'
        target_label: instance
```

---

## Environment Variables

Each node accepts these environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_NAME` | Human-readable node name | `demiurge-node` |
| `NODE_KEY` | Ed25519 private key (hex) | Random |
| `VALIDATOR_ENABLED` | Enable block production | `false` |
| `BOOTNODES` | Comma-separated bootnode addresses | Empty |
| `RPC_CORS` | CORS origins for RPC | `*` |
| `LOG_LEVEL` | Logging verbosity | `info` |
| `DATA_DIR` | Data directory path | `/data` |

---

## Operations

### Starting the Testnet

```bash
# Build images first
docker compose -f docker-compose.testnet.yml build

# Start all services
docker compose -f docker-compose.testnet.yml up -d

# Start specific service
docker compose -f docker-compose.testnet.yml up -d node1
```

### Monitoring

```bash
# View all logs
docker compose -f docker-compose.testnet.yml logs -f

# View specific node logs
docker compose -f docker-compose.testnet.yml logs -f node1

# Check container status
docker compose -f docker-compose.testnet.yml ps

# Check resource usage
docker stats
```

### Accessing Services

| Service | URL | Credentials |
|---------|-----|-------------|
| RPC (load balanced) | http://localhost:9944 | - |
| Node 1 RPC (direct) | http://localhost:9945 | - |
| Prometheus | http://localhost:9090 | - |
| Grafana | http://localhost:3001 | admin/admin |

### Testing RPC

```bash
# Check health
curl -X POST http://localhost:9944 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"chain_getHealth","params":[]}'

# Get block number
curl -X POST http://localhost:9944 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"chain_getBlockNumber","params":[]}'

# Get validators
curl -X POST http://localhost:9944 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"consensus_getValidators","params":[]}'
```

### Stopping the Testnet

```bash
# Stop all services
docker compose -f docker-compose.testnet.yml down

# Stop and remove volumes (clean reset)
docker compose -f docker-compose.testnet.yml down -v

# Stop specific service
docker compose -f docker-compose.testnet.yml stop node1
```

---

## Scaling

### Adding More Nodes

1. Edit `docker-compose.testnet.yml`
2. Add new node service
3. Update nginx upstream
4. Restart

```yaml
# Add to docker-compose.testnet.yml
node5:
  extends:
    service: node1
  environment:
    - NODE_NAME=node5
    - NODE_KEY=0x5555...
  ports:
    - "30338:30333"
    - "9949:9944"
```

### Horizontal Scaling

```bash
# Scale to 6 nodes
docker compose -f docker-compose.testnet.yml up -d --scale node=6
```

---

## Troubleshooting

### Nodes Not Connecting

```bash
# Check if nodes can see each other
docker exec -it docker-node1-1 curl http://node2:9944/health

# Check bootnode configuration
docker logs docker-node1-1 | grep -i bootnode
```

### RPC Not Responding

```bash
# Check nginx logs
docker compose -f docker-compose.testnet.yml logs nginx

# Check node health
docker compose -f docker-compose.testnet.yml exec node1 \
  curl http://localhost:9944/health
```

### Out of Disk Space

```bash
# Check disk usage
docker system df

# Clean up unused images/containers
docker system prune -f

# Remove old volumes
docker volume prune -f
```

### Memory Issues

```bash
# Limit memory per container
docker compose -f docker-compose.testnet.yml up -d \
  --scale node=4 \
  --memory 1g
```

---

## Grafana Dashboards

Import the following dashboards:

1. **Node Overview**: Block height, peers, TPS
2. **Consensus Status**: Validator health, era info
3. **Resource Usage**: CPU, memory, network

Dashboard JSON files are located in `docker/testnet/grafana/`.

---

## Production Considerations

For production deployments:

1. **Use persistent volumes** on fast storage
2. **Enable TLS** for RPC endpoints
3. **Configure proper firewall rules**
4. **Set up monitoring alerts**
5. **Regular backups** of node data
6. **Use unique node keys** (not example keys)

---

## Related Documentation

- [Production Deployment](./PRODUCTION_DEPLOYMENT.md)
- [Testnet Deployment Guide](./TESTNET_DEPLOYMENT_GUIDE.md)
- [Monitoring Guide](../operations/monitoring.md)
