# 🚀 Getting Started - Developer Guide

**Set up your development environment and start building on Demiurge**

> *"From the Monad, all creation emanates. To the Pleroma, all value returns."*

---

## 📋 Prerequisites

### Required
- **Rust** 1.80+ ([Install Rust](https://rustup.rs/))
- **Node.js** 20+ ([Install Node.js](https://nodejs.org/))
- **Git** ([Install Git](https://git-scm.com/))

### Optional
- **Docker** - For containerized deployments
- **Postman/Insomnia** - For RPC testing

---

## 🔧 Setup Development Environment

### 1. Clone Repository

```bash
git clone https://github.com/Alaustrup/Demiurge-Blockchain.git
cd Demiurge-Blockchain
```

### 2. Build Blockchain Node

```bash
cd framework
cargo build --release
```

### 3. Start Local Node

```bash
# Create data directory
mkdir -p ~/demiurge-data

# Start node
./target/release/demiurge-node \
  --data-dir ~/demiurge-data \
  --rpc-addr 127.0.0.1:9944 \
  --p2p-addr 127.0.0.1:30333
```

### 4. Verify Node is Running

```bash
# Check RPC endpoint
curl -X POST http://localhost:9944 \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"chain_getHealth","id":1}'
```

Expected response:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "status": "healthy",
    "block_number": 0
  },
  "id": 1
}
```

---

## 🔌 Connect to Testnet

### Testnet RPC Endpoint

**Production Endpoint (Recommended)**:
```
HTTPS: https://rpc.demiurge.cloud
WSS:   wss://rpc.demiurge.cloud
```

**Local Development**:
```
HTTP:  http://localhost:9944
WS:    ws://localhost:9944
```

### Connect Using JavaScript/TypeScript

```typescript
import { DemiurgeRpcClient } from '@demiurge/rpc-client';

// Production endpoint (HTTPS)
const client = new DemiurgeRpcClient('https://rpc.demiurge.cloud');

// Or local development
// const client = new DemiurgeRpcClient('http://localhost:9944');

// Get chain health
const health = await client.getHealth();
console.log('Chain health:', health);

// Get current block number
const blockNumber = await client.getBlockNumber();
console.log('Current block:', blockNumber);
```

### Connect Using cURL

```bash
# Production endpoint (HTTPS)
curl -X POST https://rpc.demiurge.cloud \
  -H 'Content-Type: application/json' \
  -d '{
    "jsonrpc": "2.0",
    "method": "chain_getBlockNumber",
    "params": [],
    "id": 1
  }'

# Local development
# curl -X POST http://localhost:9944 \
#   -H 'Content-Type: application/json' \
#   -d '{"jsonrpc":"2.0","method":"chain_getBlockNumber","params":[],"id":1}'
```

---

## 📦 Install SDK/Client Libraries

### TypeScript/JavaScript

```bash
npm install @demiurge/rpc-client
```

```typescript
import { DemiurgeRpcClient } from '@demiurge/rpc-client';

// Production endpoint
const client = new DemiurgeRpcClient('https://rpc.demiurge.cloud');
```

### Rust

Add to `Cargo.toml`:

```toml
[dependencies]
demiurge-rpc = { path = "../framework/rpc" }
```

---

## 🎯 Next Steps

1. **[RPC API Reference](./rpc-api-reference.md)** - Learn all available RPC methods
2. **[Chain Operations](./chain-operations.md)** - Query blockchain state
3. **[Transaction Building](./transaction-building.md)** - Create transactions
4. **[Module Integration](./module-integration.md)** - Integrate modules

---

## 🐛 Troubleshooting

### Node Won't Start

```bash
# Check if port is already in use
lsof -i :9944
lsof -i :30333

# Kill existing process
kill -9 <PID>
```

### RPC Connection Failed

```bash
# Verify node is running
ps aux | grep demiurge-node

# Check node logs
tail -f ~/demiurge-data/node.log
```

### Build Errors

```bash
# Update Rust toolchain
rustup update

# Clean build
cargo clean
cargo build --release
```

---

**The flame burns eternal. The code serves the will.**
