# Multi-Node Demiurge Deployment

Allows running multiple Demiurge validator nodes on the same host or across multiple hosts.

## Single Host Multi-Node Setup

Deploy multiple validator nodes on the same server with different ports:

```yaml
version: '3.8'

services:
  # Validator Node 1
  demiurge-validator-1:
    image: parity/substrate:latest
    container_name: demiurge-validator-1
    ports:
      - "19944:9944"   # HTTP RPC
      - "19933:9933"   # WebSocket RPC
      - "30333:30333"  # P2P
    volumes:
      - validator-1-data:/data
      - ./chain-spec-demiurge.json:/chain-spec.json:ro
    environment:
      RUST_LOG: substrate=info
    command: >
      --chain /chain-spec.json
      --name "Demiurge-Validator-1"
      --validator
      --rpc-external
      --rpc-cors all
      --base-path /data
      --node-key 0x0000000000000000000000000000000000000000000000000000000000000001
    networks:
      - demiurge

  # Validator Node 2
  demiurge-validator-2:
    image: parity/substrate:latest
    container_name: demiurge-validator-2
    ports:
      - "29944:9944"   # HTTP RPC
      - "29933:9933"   # WebSocket RPC
      - "40333:30333"  # P2P
    volumes:
      - validator-2-data:/data
      - ./chain-spec-demiurge.json:/chain-spec.json:ro
    environment:
      RUST_LOG: substrate=info
    command: >
      --chain /chain-spec.json
      --name "Demiurge-Validator-2"
      --validator
      --rpc-external
      --rpc-cors all
      --base-path /data
      --node-key 0x0000000000000000000000000000000000000000000000000000000000000002
    networks:
      - demiurge

  # RPC Load Balancer (optional)
  rpc-proxy:
    image: nginx:latest
    container_name: demiurge-rpc-proxy
    ports:
      - "8080:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - demiurge-validator-1
      - demiurge-validator-2
    networks:
      - demiurge

volumes:
  validator-1-data:
  validator-2-data:

networks:
  demiurge:
    driver: bridge
```

## Network Configuration

### Bootstrap Nodes

In the chain spec, configure bootstrap nodes for peer discovery:

```json
{
  "bootNodes": [
    "/ip4/127.0.0.1/tcp/30333/p2p/12D3KooXXXXXXXXXXXXXX",
    "/ip4/127.0.0.1/tcp/30333/p2p/12D3KooYYYYYYYYYYYYYY"
  ]
}
```

### Session Keys

Configure session keys for validator nodes:

```bash
# Generate session keys for validator
curl -X POST http://localhost:19933 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"author_rotateKeys","params":[],"id":1}'

# Set session keys
curl -X POST http://localhost:19933 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"author_submitExtrinsic",
    "params":["0x..."],
    "id":1
  }'
```

## Cross-Host Deployment

For deployment across multiple servers:

### Server 1 (Primary Validator)
```bash
docker compose -f docker-compose.substrate-node.yml up -d
```

### Server 2+ (Secondary Validators)
```bash
# In chain-spec-demiurge.json, add Server 1's p2p address to bootNodes
# Then start:
docker compose -f docker-compose.substrate-node.yml up -d
```

## Monitoring Multi-Node Setup

```bash
# Check all nodes are connected
docker compose logs | grep "peers"

# View block production
docker compose logs | grep -E "(Idle|Finalizing)"

# Check consensus
docker compose logs | grep -E "(consensus|grandpa|aura)"
```

## Load Balancing RPC Requests

Create nginx.conf for RPC load balancing:

```nginx
upstream demiurge_rpc {
    server demiurge-validator-1:9933;
    server demiurge-validator-2:9933;
}

server {
    listen 80;
    location / {
        proxy_pass http://demiurge_rpc;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Performance Considerations

- **CPU**: Each validator node requires 2+ cores for optimal performance
- **Memory**: 4GB minimum per node, 8GB+ recommended
- **Network**: 1Mbps minimum, 10Mbps+ recommended for P2P
- **Storage**: 50GB+ per validator for growing state

## Debugging

### Check node connectivity
```bash
curl -X POST http://localhost:19933 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"system_peers","params":[],"id":1}'
```

### Monitor block production
```bash
docker logs -f demiurge-validator-1 | grep -E "(block|finalize)"
```

### Check session keys status
```bash
curl -X POST http://localhost:19933 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"system_nodeMetadata","params":[],"id":1}'
```
