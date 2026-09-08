# Multi-Node Demiurge Validator Deployment

Advanced multi-node setup with session key management, load balancing, and production-ready configurations.

## Quick Start: Single Host Multi-Validator

Deploy 3 validators on one server:

```yaml
version: '3.8'

services:
  # Validator Node 1 - Primary
  demiurge-validator-1:
    image: localhost:5000/demiurge-node:latest
    container_name: demiurge-validator-1
    restart: unless-stopped
    ports:
      - "19944:9944"    # HTTP RPC
      - "19933:9933"    # WebSocket RPC  
      - "30333:30333"   # P2P
      - "9615:9615"     # Metrics
    volumes:
      - validator-1-data:/data
      - ./chain-spec-demiurge.json:/chain-spec.json:ro
    environment:
      RUST_LOG: substrate=info,sc_network=debug
    command: >
      --chain /chain-spec.json
      --name "Demiurge-Validator-1"
      --validator
      --unsafe-rpc-external
      --rpc-methods=unsafe
      --rpc-cors=all
      --base-path /data
      --node-key 0x0000000000000000000000000000000000000000000000000000000000000001
      --bootnodes /ip4/127.0.0.1/tcp/30334/p2p/PEER_ID_2
      --prometheus-external
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9933/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: json-file
      options:
        max-size: 100m
        max-file: 10
    networks:
      - demiurge

  # Validator Node 2
  demiurge-validator-2:
    image: localhost:5000/demiurge-node:latest
    container_name: demiurge-validator-2
    restart: unless-stopped
    ports:
      - "29944:9944"
      - "29933:9933"
      - "30334:30333"
      - "9616:9615"
    volumes:
      - validator-2-data:/data
      - ./chain-spec-demiurge.json:/chain-spec.json:ro
    environment:
      RUST_LOG: substrate=info,sc_network=debug
    command: >
      --chain /chain-spec.json
      --name "Demiurge-Validator-2"
      --validator
      --unsafe-rpc-external
      --rpc-methods=unsafe
      --rpc-cors=all
      --base-path /data
      --node-key 0x0000000000000000000000000000000000000000000000000000000000000002
      --bootnodes /ip4/127.0.0.1/tcp/30333/p2p/PEER_ID_1
      --prometheus-external
    depends_on:
      - demiurge-validator-1
    networks:
      - demiurge

  # Validator Node 3
  demiurge-validator-3:
    image: localhost:5000/demiurge-node:latest
    container_name: demiurge-validator-3
    restart: unless-stopped
    ports:
      - "39944:9944"
      - "39933:9933"
      - "30335:30333"
      - "9617:9615"
    volumes:
      - validator-3-data:/data
      - ./chain-spec-demiurge.json:/chain-spec.json:ro
    environment:
      RUST_LOG: substrate=info,sc_network=debug
    command: >
      --chain /chain-spec.json
      --name "Demiurge-Validator-3"
      --validator
      --unsafe-rpc-external
      --rpc-methods=unsafe
      --rpc-cors=all
      --base-path /data
      --node-key 0x0000000000000000000000000000000000000000000000000000000000000003
      --bootnodes /ip4/127.0.0.1/tcp/30333/p2p/PEER_ID_1
      --prometheus-external
    depends_on:
      - demiurge-validator-1
    networks:
      - demiurge

  # RPC Load Balancer
  rpc-lb:
    image: nginx:latest
    container_name: demiurge-rpc-lb
    restart: unless-stopped
    ports:
      - "8080:80"
      - "8443:443"
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - demiurge-validator-1
      - demiurge-validator-2
      - demiurge-validator-3
    networks:
      - demiurge

  # Prometheus Monitoring
  prometheus:
    image: prom/prometheus:latest
    container_name: demiurge-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - --config.file=/etc/prometheus/prometheus.yml
      - --storage.tsdb.path=/prometheus
    networks:
      - demiurge

volumes:
  validator-1-data:
  validator-2-data:
  validator-3-data:
  prometheus-data:

networks:
  demiurge:
    driver: bridge
```

## Session Key Management

### Step 1: Generate Node Keys

For each validator, generate a unique node key:

```bash
# Generate keys for each validator
for i in {1..3}; do
  subkey generate-node-key --file validator-$i.key
  echo "Validator $i key generated"
done

# Extract peer IDs for bootstrap configuration
for i in {1..3}; do
  subkey inspect-node-key --file validator-$i.key
done
```

### Step 2: Rotate Session Keys

**Method 1: Using RPC (Recommended)**

```bash
#!/bin/bash
# Script to rotate session keys for all validators

VALIDATOR_RPCS=(
  "http://localhost:19933"  # Validator 1
  "http://localhost:29933"  # Validator 2
  "http://localhost:39933"  # Validator 3
)

for i in "${!VALIDATOR_RPCS[@]}"; do
  RPC="${VALIDATOR_RPCS[$i]}"
  
  echo "🔄 Rotating session keys for Validator $((i+1))..."
  
  # Call author_rotateKeys RPC method
  curl -X POST \
    -H "Content-Type: application/json" \
    -d '{
      "jsonrpc":"2.0",
      "method":"author_rotateKeys",
      "params":[],
      "id":1
    }' \
    "$RPC"
  
  echo ""
done
```

**Method 2: Using Polkadot.js**

```javascript
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { cryptoWaitReady } = require('@polkadot/util-crypto');

async function rotateSessionKeys(validatorAddress, seedPhrase) {
  await cryptoWaitReady();
  
  const provider = new WsProvider('ws://localhost:19944');
  const api = await ApiPromise.create({ provider });
  
  const keyring = new Keyring({ type: 'sr25519' });
  const account = keyring.addFromMnemonic(seedPhrase);
  
  // Rotate keys
  console.log('🔄 Requesting session key rotation...');
  const keys = await api.rpc.author.rotateKeys();
  console.log('✅ New session keys:', keys.toString());
  
  // Set keys (requires sudo or validator origin)
  const tx = api.tx.sessionKeys.setKeys(keys);
  
  const hash = await tx.signAndSend(account);
  console.log('📝 Transaction sent:', hash.toString());
  
  return keys.toString();
}

// Usage
rotateSessionKeys(
  '5GrwvaEF5zXb26Fz9rcQkQJRP64s19S7syE7aYtV5ptPXqV5',
  'bottom drive obey lake curtain smoke basket hold race lonely fit walk'
);
```

### Step 3: Verify Session Keys

```bash
#!/bin/bash
# Verify session keys for all validators

echo "📋 Verifying session keys..."

VALIDATOR_RPCS=(
  "http://localhost:19933"
  "http://localhost:29933"
  "http://localhost:39933"
)

VALIDATORS=(
  "5GrwvaEF5zXb26Fz9rcQkQJRP64s19S7syE7aYtV5ptPXqV5"
  "5FHneA46xpF1nqMvfU3f8aOMU1j8MKPTM7LSq2tSiUg2rcJj"
  "5FLSigC9HGRKVhB2PDnPj6RS57FtqjS5NAcZB5S74MjAFoLK"
)

for i in "${!VALIDATOR_RPCS[@]}"; do
  RPC="${VALIDATOR_RPCS[$i]}"
  VALIDATOR="${VALIDATORS[$i]}"
  
  echo ""
  echo "Validator $((i+1)): $VALIDATOR"
  
  # Query session keys
  curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{
      \"jsonrpc\":\"2.0\",
      \"method\":\"state_getStorage\",
      \"params\":[
        \"0x5f3e4907f716ac89b6347d926f1be64c3a1d0993652fe2750a9f9c3f2d5f5c3e\",
        \"$VALIDATOR\"
      ],
      \"id\":1
    }" \
    "$RPC" | jq '.result'
done
```

## Cross-Host Multi-Node Setup

Deploy validators across multiple servers for geographic redundancy:

### Architecture

```
                    ┌─ Server 1 (Validator 1)
                    │   - RPC: 127.0.0.1:19933
                    │   - P2P: 127.0.0.1:30333
                    │
Bootstrap Node ─────┼─ Server 2 (Validator 2)
(127.0.0.1)    │   - RPC: 192.168.1.10:19933
                    │   - P2P: 192.168.1.10:30333
                    │
                    └─ Server 3 (Validator 3)
                        - RPC: 192.168.1.20:19933
                        - P2P: 192.168.1.20:30333
```

### Chain Spec Configuration

Update `chain-spec-demiurge.json` with bootstrap nodes:

```json
{
  "name": "Demiurge",
  "id": "demiurge-prod",
  "bootNodes": [
    "/ip4/127.0.0.1/tcp/30333/p2p/12D3KooWH1L5qVDDPP6tVwjT4H3jwbCvvqPZYW3C5XZqHqDi3B7Y",
    "/ip4/192.168.1.10/tcp/30333/p2p/12D3KooWKFCm8b6m8X3F5VxvM8Fv6YPZvYJQPrZLhZtEHDx75eKT",
    "/ip4/192.168.1.20/tcp/30333/p2p/12D3KooWMrP1Vvtm1GqhFyLYVkJkYBTMvDwQvjZBpJHGBbcvXnMy"
  ]
}
```

### SCP Deployment to Multiple Servers

```bash
#!/bin/bash
# Deploy to multiple validator servers

SERVERS=(
  "ubuntu@127.0.0.1"
  "ubuntu@192.168.1.10"
  "ubuntu@192.168.1.20"
)

for server in "${SERVERS[@]}"; do
  echo "📦 Deploying to $server..."
  
  scp docker-compose.multi-validator.yml $server:~/demiurge/
  scp chain-spec-demiurge.json $server:~/demiurge/
  scp scripts/monitor-rpc.sh $server:~/demiurge/scripts/
  
  ssh $server "cd ~/demiurge && docker compose up -d"
  
  echo "✅ Deployment complete for $server"
done
```

## RPC Load Balancing

### Nginx Configuration

```nginx
# nginx-lb.conf
upstream demiurge_http {
  least_conn;
  server demiurge-validator-1:9933 max_fails=3 fail_timeout=30s;
  server demiurge-validator-2:9933 max_fails=3 fail_timeout=30s;
  server demiurge-validator-3:9933 max_fails=3 fail_timeout=30s;
}

upstream demiurge_ws {
  least_conn;
  server demiurge-validator-1:9944 max_fails=3 fail_timeout=30s;
  server demiurge-validator-2:9944 max_fails=3 fail_timeout=30s;
  server demiurge-validator-3:9944 max_fails=3 fail_timeout=30s;
}

server {
  listen 80;
  server_name _;

  # Health check endpoint
  location /health {
    access_log off;
    return 200 "healthy\n";
  }

  # HTTP JSON-RPC
  location / {
    proxy_pass http://demiurge_http;
    proxy_set_header Content-Type application/json;
    proxy_connect_timeout 5s;
    proxy_timeout 10s;
  }

  # WebSocket
  location /ws {
    proxy_pass ws://demiurge_ws;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_read_timeout 86400;
  }
}
```

## Monitoring & Health Checks

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'demiurge-validators'
    metrics_path: '/metrics'
    static_configs:
      - targets:
        - 'demiurge-validator-1:9615'
        - 'demiurge-validator-2:9615'
        - 'demiurge-validator-3:9615'

  - job_name: 'nginx-lb'
    static_configs:
      - targets: ['demiurge-rpc-lb:8080']
```

### Key Metrics to Monitor

```bash
#!/bin/bash
# Query important metrics from Prometheus

echo "📊 Demiurge Validator Metrics"
echo ""

PROMETHEUS="http://localhost:9090/api/v1/query"

# Block height
echo "Block height:"
curl -s "$PROMETHEUS?query=substrate_block_height" | jq '.data.result[] | {instance: .metric.instance, value: .value[1]}'

# Active peers
echo ""
echo "Active peers:"
curl -s "$PROMETHEUS?query=substrate_node_peers" | jq '.data.result[] | {instance: .metric.instance, value: .value[1]}'

# Network traffic
echo ""
echo "Network bytes in:"
curl -s "$PROMETHEUS?query=substrate_network_bytes_in_total" | jq '.data.result[] | {instance: .metric.instance, value: .value[1]}'
```

## Troubleshooting Multi-Node Setup

### Check P2P Connectivity

```bash
#!/bin/bash
# Verify P2P connections between validators

for i in {1..3}; do
  RPC="http://localhost:$((19000 + i * 1000 + 933))"
  
  echo "=== Validator $i ==="
  
  # Get connected peers
  curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"system_peers","params":[],"id":1}' \
    "$RPC" | jq '.result | length'
  
  echo "Peers connected"
done
```

### Sync Status

```bash
#!/bin/bash
# Check block sync status across validators

echo "📊 Validator Sync Status"
echo ""

for i in {1..3}; do
  RPC="http://localhost:$((19000 + i * 1000 + 933))"
  
  BEST=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"chain_getBlock","params":[],"id":1}' \
    "$RPC" | jq -r '.result.block.header.number')
  
  FINALIZED=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"chain_getFinalizedHead","params":[],"id":1}' \
    "$RPC" | jq -r '.result')
  
  echo "Validator $i: Best Block #$BEST"
done
```

## Performance Tuning

### Resource Requirements

| Component | CPU | Memory | Storage |
|-----------|-----|--------|---------|
| Validator | 2+ cores | 4GB+ | 50GB+ SSD |
| RPC Load Balancer | 1 core | 512MB | 10GB |
| Prometheus | 1 core | 1GB | 20GB |

### Optimization Tips

1. **Use SSD storage** for database performance
2. **Tune RocksDB** settings in chain spec
3. **Enable zstd compression** for faster sync
4. **Configure connection pooling** for RPC clients
5. **Use separate networks** for P2P vs RPC traffic

## Maintenance

### Validator Updates

```bash
#!/bin/bash
# Rolling update of validators

SERVERS=("server1" "server2" "server3")

for server in "${SERVERS[@]}"; do
  echo "🔄 Updating $server..."
  
  ssh $server "cd ~/demiurge && \
    docker pull localhost:5000/demiurge-node:latest && \
    docker compose down && \
    docker compose up -d"
  
  # Wait for node to sync
  sleep 60
  
  # Verify health
  ssh $server "docker logs demiurge-validator-1 2>&1 | tail -5"
done
```

### Backup Chain Data

```bash
#!/bin/bash
# Backup validator chain data

BACKUP_DIR="/backups/demiurge-validators"
DATE=$(date +%Y%m%d-%H%M%S)

for i in {1..3}; do
  echo "📦 Backing up Validator $i..."
  
  docker exec demiurge-validator-$i \
    tar czf /data/chain-backup-$DATE.tar.gz /data/chains
  
  docker cp demiurge-validator-$i:/data/chain-backup-$DATE.tar.gz \
    $BACKUP_DIR/validator-$i-$DATE.tar.gz
  
  echo "✅ Backup complete"
done
```

## Deployment Checklist

- [ ] All validators have unique node keys
- [ ] Bootstrap nodes configured in chain spec
- [ ] Session keys rotated for all validators
- [ ] RPC load balancer configured and tested
- [ ] Prometheus monitoring active
- [ ] Health checks passing for all nodes
- [ ] P2P connectivity verified between all validators
- [ ] Block sync verified across all nodes
- [ ] Network firewall rules configured
- [ ] SSL/TLS termination configured (optional)
- [ ] Backup and recovery procedures documented
- [ ] Monitoring alerts configured

## References

- [Substrate Validator Setup](https://docs.substrate.io/tutorials/build-a-blockchain/run-a-node/)
- [Session Keys Documentation](https://docs.substrate.io/maintain/maintain-guides/#session-keys)
- [P2P Networking](https://docs.substrate.io/reference/glossary/#peer-to-peer-p2p)
- [Demiurge Blockchain Deployment](./BLOCKCHAIN_NODE_DEPLOYMENT.md)
- [Hub/QOR Integration](./HUB_QOR_INTEGRATION_GUIDE.md)
