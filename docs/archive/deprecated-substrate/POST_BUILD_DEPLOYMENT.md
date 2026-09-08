# Demiurge Blockchain Deployment - Post-Build Instructions

## Build Status

**Build Started**: January 22, 2026, ~08:05 UTC
**Expected Duration**: 30-60 minutes
**Build Log**: `ssh pleroma "tail -f ~/demiurge/build.log"`

### Check Build Progress

```bash
# View real-time build log
ssh pleroma "tail -100 ~/demiurge/build.log"

# Check if build is still running
ssh pleroma "ps aux | grep 'build-on-server.sh'"

# View only warnings/errors
ssh pleroma "grep -E '(error|warning|failed)' ~/demiurge/build.log"
```

## Expected Build Output

Once complete, the build process will produce:

### 1. Custom Docker Image
```
Image: localhost:5000/demiurge-node:latest
Tag: localhost:5000/demiurge-node:20260122-081500
Size: ~200MB
Location: Docker daemon on pleroma
```

### 2. Genesis WASM
```
File: /root/demiurge/genesis.hex
Size: Variable (typically 200KB-500KB hex)
Purpose: Chain specification genesis code
```

### 3. Compiled Binary
```
Binary: /root/demiurge/blockchain/target/release/demiurge-node
Size: ~150MB
Purpose: Standalone node executable (for reference)
```

## Post-Build Deployment Steps

### Step 1: Verify Build Completion (30-60 minutes after start)

```bash
# Check if build completed successfully
ssh pleroma "tail -30 ~/demiurge/build.log | grep -E '(BUILD COMPLETE|failed|error)'"

# If successful, you should see:
# ========================================
# ✅ BUILD COMPLETE
# ========================================
```

### Step 2: Deploy Custom Docker Image

```bash
# Update docker-compose to use custom image
cd ~/Demiurge-Blockchain
sed -i.bak 's|image: parity/substrate:latest|image: localhost:5000/demiurge-node:latest|' \
  docker-compose.substrate-node.yml

# Deploy updated config
scp docker-compose.substrate-node.yml pleroma:~/demiurge/

# Restart validator with custom image
ssh pleroma "cd ~/demiurge && docker compose down && docker compose up -d"

# Wait for container to start
sleep 10

# Verify node is running
ssh pleroma "docker logs demiurge-blockchain-node 2>&1 | tail -20 | grep -E '(Role|Substrate|Block)'"
```

### Step 3: Extract and Encode Genesis WASM

```bash
# Download genesis hex from server
mkdir -p ~/.demiurge
scp pleroma:/root/demiurge/genesis.hex ~/.demiurge/

# View hex size (should be large, typically 200KB+)
wc -c ~/.demiurge/genesis.hex

# Update chain spec with genesis code
python3 << 'EOF'
import json

# Read chain spec
with open('chain-spec-demiurge.json', 'r') as f:
    spec = json.load(f)

# Read genesis hex
with open('~/.demiurge/genesis.hex', 'r') as f:
    genesis_hex = f.read().strip()

# Update spec
spec['genesis']['runtime']['system']['code'] = '0x' + genesis_hex

# Write back
with open('chain-spec-demiurge-updated.json', 'w') as f:
    json.dump(spec, f, indent=2)

print(f"✅ Updated chain spec with {len(genesis_hex)//2} bytes of WASM")
EOF
```

### Step 4: Deploy Custom Chain Specification

```bash
# Deploy updated chain spec
scp chain-spec-demiurge-updated.json pleroma:~/demiurge/chain-spec-demiurge.json

# Update docker-compose to use custom chain spec
sed -i.bak 's|--chain dev|--chain /chain-spec.json|' docker-compose.substrate-node.yml

scp docker-compose.substrate-node.yml pleroma:~/demiurge/

# Restart with custom chain
ssh pleroma "cd ~/demiurge && docker compose restart demiurge-blockchain-node"

# Monitor startup (may take 1-2 minutes for genesis initialization)
sleep 30
ssh pleroma "docker logs demiurge-blockchain-node 2>&1 | tail -50 | grep -E '(Genesis|Block|Role|error)'"
```

### Step 5: Verify Production Deployment

```bash
#!/bin/bash
# Comprehensive verification script

echo "📋 Demiurge Production Deployment Verification"
echo ""

# 1. Container status
echo "1️⃣  Container Status:"
ssh pleroma "docker ps | grep demiurge-blockchain-node"
echo ""

# 2. Node role
echo "2️⃣  Node Role:"
ssh pleroma "docker logs demiurge-blockchain-node 2>&1 | grep 'Role: AUTHORITY' | tail -1"
echo ""

# 3. RPC endpoints
echo "3️⃣  RPC Endpoints:"
echo "   HTTP: http://127.0.0.1:19933"
curl -s -X POST http://127.0.0.1:19933 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"system_chain","params":[],"id":1}' | jq '.result'
echo ""

# 4. Block height
echo "4️⃣  Block Height:"
curl -s -X POST http://127.0.0.1:19933 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"chain_getHeader","params":[],"id":1}' | jq '.result.number'
echo ""

# 5. Connected peers
echo "5️⃣  Connected Peers:"
curl -s -X POST http://127.0.0.1:19933 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"system_peers","params":[],"id":1}' | jq '.result | length'
echo ""

# 6. Storage keys
echo "6️⃣  Storage Available:"
ssh pleroma "du -h ~/demiurge/volumes/demiurge_demiurge-chain-data/ 2>/dev/null | tail -1"
echo ""

echo "✅ Verification complete!"
```

## Multi-Node Setup (Optional)

Once single node is confirmed working with custom image:

```bash
# Deploy multi-validator configuration
scp docs/ADVANCED_MULTI_NODE_DEPLOYMENT.md pleroma:~/demiurge/MULTI_NODE_GUIDE.md

# Review and customize multi-node docker-compose
# Then deploy with:
# ssh pleroma "cd ~/demiurge && docker compose -f docker-compose.multi.yml up -d"
```

## Hub/QOR Integration (Optional)

Connect services to blockchain RPC:

```bash
# Test HTTP RPC connection from Hub service
curl -X POST http://127.0.0.1:19933 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"system_chain",
    "params":[],
    "id":1
  }'

# Should return: {"jsonrpc":"2.0","result":"Demiurge","id":1}
```

See [HUB_QOR_INTEGRATION_GUIDE.md](../docs/HUB_QOR_INTEGRATION_GUIDE.md) for complete integration examples.

## Rollback Plan

If custom build has issues:

```bash
# Revert to official Substrate image
sed -i 's|image: localhost:5000/demiurge-node:latest|image: parity/substrate:latest|' \
  docker-compose.substrate-node.yml

sed -i 's|--chain /chain-spec.json|--chain dev|' docker-compose.substrate-node.yml

# Deploy rollback
scp docker-compose.substrate-node.yml pleroma:~/demiurge/

ssh pleroma "cd ~/demiurge && docker compose down && docker compose up -d"

# Verify
ssh pleroma "docker logs demiurge-blockchain-node 2>&1 | tail -10"
```

## Troubleshooting

### Build Failed
```bash
# View full build log
ssh pleroma "cat ~/demiurge/build.log | tail -100"

# Check disk space
ssh pleroma "df -h"

# Check cargo cache
ssh pleroma "du -sh ~/.cargo"
```

### Custom Image Won't Start
```bash
# View image details
ssh pleroma "docker inspect localhost:5000/demiurge-node:latest"

# Try running manually
ssh pleroma "docker run -it localhost:5000/demiurge-node:latest --version"

# Check image size
ssh pleroma "docker images | grep demiurge"
```

### Chain Spec Validation Errors
```bash
# Validate JSON
python3 -m json.tool chain-spec-demiurge.json > /dev/null

# Check genesis WASM encoding
wc -c ~/.demiurge/genesis.hex
# Should be at least 400KB (200KB in hex = 100KB binary)
```

### RPC Not Responding
```bash
# Check if RPC port is exposed
ssh pleroma "docker port demiurge-blockchain-node | grep 9933"

# Check firewall
ssh pleroma "sudo ufw status"

# Test local connection
ssh pleroma "curl http://localhost:19933 -X POST -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"system_chain\",\"params\":[],\"id\":1}'"
```

## Performance Tuning

After deployment with custom image:

```bash
# Increase RPC worker threads (in docker-compose)
# Add: --rpc-max-connections 1000
# Add: --rpc-max-payload 100

# Monitor metrics
curl -s http://127.0.0.1:9615/metrics | head -50

# Check block production rate
for i in {1..5}; do
  curl -s -X POST http://127.0.0.1:19933 \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"chain_getHeader","params":[],"id":1}' | jq '.result.number'
  sleep 12
done
```

## Next: Load Balancing (For Production)

```bash
# Deploy nginx load balancer (if multi-node)
scp docs/ADVANCED_MULTI_NODE_DEPLOYMENT.md pleroma:~/demiurge/

# Create nginx config for RPC load balancing
cat > ~/demiurge/nginx-rpc-lb.conf << 'EOF'
upstream demiurge_rpc {
  least_conn;
  server demiurge-blockchain-node:9933 max_fails=3 fail_timeout=30s;
}

server {
  listen 80;
  location / {
    proxy_pass http://demiurge_rpc;
  }
}
EOF

# Deploy and test
scp ~/demiurge/nginx-rpc-lb.conf pleroma:~/demiurge/
```

## Deployment Checklist

- [ ] Build script successfully deployed to server
- [ ] Build process started and running
- [ ] Build completes within 60 minutes
- [ ] Custom Docker image created (localhost:5000/demiurge-node:latest)
- [ ] Genesis WASM exported and encoded
- [ ] docker-compose updated with custom image
- [ ] Chain spec updated with genesis WASM
- [ ] Node restarts successfully with custom image
- [ ] Node running as AUTHORITY validator
- [ ] RPC endpoints responding on 19933/19944
- [ ] P2P connectivity established (port 30333)
- [ ] All 11 pallets available in metadata
- [ ] Health monitoring active
- [ ] Performance metrics collected

## References

- [Build on Server Script](../scripts/build-on-server.sh)
- [Blockchain Deployment Guide](../docs/BLOCKCHAIN_NODE_DEPLOYMENT.md)
- [Advanced Multi-Node Deployment](../docs/ADVANCED_MULTI_NODE_DEPLOYMENT.md)
- [Hub/QOR Integration Guide](../docs/HUB_QOR_INTEGRATION_GUIDE.md)
