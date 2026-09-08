# Testnet Setup

Guide for running a local or multi-node testnet.

---

## Local Development Node

### Quick Start

```bash
cd framework

# Build
cargo build --release

# Run dev node
./target/release/demiurge-node --dev
```

The `--dev` flag:
- Uses in-memory storage
- Generates ephemeral validator key
- Enables faster block times
- Auto-funds test accounts

### Connect to Local Node

```typescript
const client = new DemiurgeClient({
  rpcUrl: 'http://localhost:9944'
});
```

---

## Multi-Node Testnet

### Directory Structure

```
testnet/
├── configs/
│   ├── node1.toml
│   ├── node2.toml
│   ├── node3.toml
│   └── node4.toml
├── scripts/
│   ├── deploy.sh
│   ├── manage.sh
│   └── monitor.sh
├── systemd/
│   └── demiurge-validator-*.service
└── genesis-multinode.json
```

### Genesis Configuration

Create `testnet/genesis-multinode.json`:

```json
{
  "chain_id": "demiurge-testnet",
  "timestamp": 1706745600,
  "consensus": {
    "block_time_ms": 6000,
    "initial_validators": [
      {"address": "VALIDATOR_1_ADDRESS", "stake": 1000000000},
      {"address": "VALIDATOR_2_ADDRESS", "stake": 1000000000},
      {"address": "VALIDATOR_3_ADDRESS", "stake": 1000000000},
      {"address": "VALIDATOR_4_ADDRESS", "stake": 1000000000}
    ]
  },
  "balances": {
    "0x00000000000000000000000000000000DEMIURGE": 100000000000,
    "VALIDATOR_1_ADDRESS": 1000000000,
    "VALIDATOR_2_ADDRESS": 1000000000,
    "VALIDATOR_3_ADDRESS": 1000000000,
    "VALIDATOR_4_ADDRESS": 1000000000
  }
}
```

### Node Configuration

Create `testnet/configs/node1.toml`:

```toml
[node]
name = "validator-alpha"
data_dir = "/var/lib/demiurge/node1"

[rpc]
addr = "127.0.0.1:9944"

[p2p]
addr = "0.0.0.0:30333"
external_addr = "192.168.1.101:30333"
bootstrap_peers = []

[consensus]
validator_key = "/var/lib/demiurge/node1/validator.key"

[logging]
level = "info"
```

### Deploy Script

```bash
#!/bin/bash
# testnet/scripts/deploy.sh

set -e

NODES=("alpha" "beta" "gamma" "delta")
PORTS=(30333 30334 30335 30336)
RPC_PORTS=(9944 9945 9946 9947)

for i in "${!NODES[@]}"; do
    NODE=${NODES[$i]}
    PORT=${PORTS[$i]}
    RPC=${RPC_PORTS[$i]}
    
    echo "Deploying validator-$NODE..."
    
    # Create data directory
    sudo mkdir -p /var/lib/demiurge/$NODE
    
    # Generate validator key
    demiurge-node keygen --output /var/lib/demiurge/$NODE/validator.key
    
    # Copy genesis
    cp genesis-multinode.json /var/lib/demiurge/$NODE/genesis.json
    
    # Create systemd service
    cat > /etc/systemd/system/demiurge-validator-$NODE.service << EOF
[Unit]
Description=Demiurge Validator $NODE
After=network.target

[Service]
Type=simple
User=ubuntu
ExecStart=/usr/local/bin/demiurge-node \\
  --rpc-addr 127.0.0.1:$RPC \\
  --p2p-addr 0.0.0.0:$PORT \\
  --data-dir /var/lib/demiurge/$NODE \\
  --validator-key /var/lib/demiurge/$NODE/validator.key \\
  --genesis /var/lib/demiurge/$NODE/genesis.json
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable demiurge-validator-$NODE
    sudo systemctl start demiurge-validator-$NODE
done

echo "Testnet deployed!"
```

### Management Script

```bash
#!/bin/bash
# testnet/scripts/manage.sh

NODES=("alpha" "beta" "gamma" "delta")

case "$1" in
    status)
        for NODE in "${NODES[@]}"; do
            echo "=== validator-$NODE ==="
            sudo systemctl status demiurge-validator-$NODE --no-pager
        done
        ;;
    start)
        for NODE in "${NODES[@]}"; do
            sudo systemctl start demiurge-validator-$NODE
        done
        ;;
    stop)
        for NODE in "${NODES[@]}"; do
            sudo systemctl stop demiurge-validator-$NODE
        done
        ;;
    restart)
        for NODE in "${NODES[@]}"; do
            sudo systemctl restart demiurge-validator-$NODE
        done
        ;;
    logs)
        NODE=${2:-alpha}
        sudo journalctl -u demiurge-validator-$NODE -f
        ;;
    *)
        echo "Usage: $0 {status|start|stop|restart|logs [node]}"
        exit 1
        ;;
esac
```

### Monitor Script

```bash
#!/bin/bash
# testnet/scripts/monitor.sh

RPC_PORTS=(9944 9945 9946 9947)
NODES=("alpha" "beta" "gamma" "delta")

while true; do
    clear
    echo "=== DEMIURGE TESTNET MONITOR ==="
    echo "$(date)"
    echo ""
    
    for i in "${!NODES[@]}"; do
        NODE=${NODES[$i]}
        PORT=${RPC_PORTS[$i]}
        
        HEALTH=$(curl -s -X POST http://localhost:$PORT \
          -d '{"jsonrpc":"2.0","id":1,"method":"chain_getHealth","params":[]}' 2>/dev/null)
        
        if [ -n "$HEALTH" ]; then
            BLOCK=$(echo $HEALTH | jq -r '.result.block_number')
            CONNECTED=$(echo $HEALTH | jq -r '.result.connected')
            echo "$NODE: Block $BLOCK (connected: $CONNECTED)"
        else
            echo "$NODE: OFFLINE"
        fi
    done
    
    sleep 5
done
```

---

## Docker Testnet

### Docker Compose

```yaml
# docker/docker-compose.testnet.yml
version: '3.8'

services:
  validator-alpha:
    build: ..
    ports:
      - "9944:9944"
      - "30333:30333"
    volumes:
      - alpha-data:/var/lib/demiurge
    command: >
      --rpc-addr 0.0.0.0:9944
      --p2p-addr 0.0.0.0:30333
      --validator

  validator-beta:
    build: ..
    ports:
      - "9945:9944"
      - "30334:30333"
    volumes:
      - beta-data:/var/lib/demiurge
    command: >
      --rpc-addr 0.0.0.0:9944
      --p2p-addr 0.0.0.0:30333
      --validator
      --bootnodes /dns/validator-alpha/tcp/30333

volumes:
  alpha-data:
  beta-data:
```

### Run Docker Testnet

```bash
cd docker
docker-compose -f docker-compose.testnet.yml up -d
```

---

## Testing

### Test Script

```python
#!/usr/bin/env python3
# scripts/test_testnet.py

import requests
import time

RPC_PORTS = [9944, 9945, 9946, 9947]

def rpc_call(port, method, params=[]):
    response = requests.post(f'http://localhost:{port}', json={
        'jsonrpc': '2.0',
        'id': 1,
        'method': method,
        'params': params
    })
    return response.json()

def main():
    print("Testing Demiurge Testnet")
    print("=" * 40)
    
    # Check all nodes
    blocks = []
    for port in RPC_PORTS:
        try:
            result = rpc_call(port, 'chain_getBlockNumber')
            block = result.get('result', 'error')
            blocks.append(block)
            print(f"Node :{port} - Block {block}")
        except Exception as e:
            print(f"Node :{port} - OFFLINE")
            blocks.append(None)
    
    # Check consensus
    valid_blocks = [b for b in blocks if b is not None]
    if len(set(valid_blocks)) == 1:
        print("\nConsensus: SYNCHRONIZED")
    else:
        print("\nConsensus: OUT OF SYNC")
        print(f"Blocks: {valid_blocks}")
    
    # Test transfer
    print("\nTesting transfer...")
    result = rpc_call(9944, 'balances_transfer', [
        '0' * 64,
        '1' * 64,
        '100',
        'a' * 128
    ])
    print(f"Transfer: {result}")

if __name__ == '__main__':
    main()
```

---

## Cleanup

### Remove Testnet

```bash
# Stop all validators
./scripts/manage.sh stop

# Remove data
sudo rm -rf /var/lib/demiurge/alpha
sudo rm -rf /var/lib/demiurge/beta
sudo rm -rf /var/lib/demiurge/gamma
sudo rm -rf /var/lib/demiurge/delta

# Remove services
sudo rm /etc/systemd/system/demiurge-validator-*.service
sudo systemctl daemon-reload
```

---

## Further Reading

- [Production Deployment](./deployment.md)
- [Architecture](../architecture/README.md)
- [Consensus](../architecture/consensus.md)
