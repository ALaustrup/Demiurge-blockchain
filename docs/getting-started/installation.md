# Installation Guide

Set up your Demiurge development environment.

---

## SDK Installation (Recommended)

### TypeScript/JavaScript

```bash
# Core SDK
npm install @demiurge/sdk

# Identity SDK
npm install @demiurge/qor-sdk

# NFT SDK
npm install @demiurge/drc369-sdk

# Agent SDK
npm install @demiurge/agent-foundry

# CLI
npm install -g @demiurge/cli
```

### Rust

Add to your `Cargo.toml`:
```toml
[dependencies]
demiurge-sdk = { git = "https://github.com/ALaustrup/Demiurge-Blockchain", path = "sdk" }
```

---

## Running a Local Node

### Prerequisites

- Rust 1.70+ (`rustup update`)
- RocksDB dependencies
- 4GB RAM minimum

### Build from Source

```bash
# Clone repository
git clone https://github.com/ALaustrup/Demiurge-Blockchain.git
cd Demiurge-Blockchain

# Build the node
cd framework
cargo build --release

# Run the node
./target/release/demiurge-node \
  --rpc-addr 0.0.0.0:9944 \
  --p2p-addr 0.0.0.0:30333 \
  --data-dir /var/lib/demiurge/data
```

### Configuration Options

| Flag | Description | Default |
|------|-------------|---------|
| `--rpc-addr` | RPC listen address | `127.0.0.1:9944` |
| `--p2p-addr` | P2P listen address | `0.0.0.0:30333` |
| `--data-dir` | Data directory | `./data` |
| `--validator-key` | Validator key file | None |
| `--genesis` | Genesis configuration | Built-in |
| `--log-level` | Logging level | `info` |

---

## Running the Web Platform

```bash
cd apps/hub

# Install dependencies
npm install

# Development mode
npm run dev
# Opens http://localhost:3000

# Production build
npm run build
npm start
```

### Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_RPC_URL=https://rpc.demiurge.cloud:9944
NEXT_PUBLIC_API_URL=https://demiurge.cloud/api/v1
```

---

## Running QOR Auth Service

The authentication service requires PostgreSQL.

```bash
# Install PostgreSQL
sudo apt install postgresql

# Create database
createdb demiurge_auth

# Run the service
cd services/qor-auth
cargo run --release
# Listens on http://localhost:8080
```

---

## Testnet Setup

For multi-node testing:

```bash
cd testnet

# Deploy 4-validator testnet
sudo bash scripts/deploy.sh

# Monitor network
./scripts/monitor.sh

# Manage validators
./scripts/manage.sh status
```

See [Testnet Guide](../operations/testnet.md) for details.

---

## Verify Installation

### Test RPC Connection

```bash
# Using CLI
demiurge dev test-rpc

# Using curl
curl -s -X POST http://localhost:9944 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"chain_getHealth","params":[]}' | jq
```

Expected response:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "connected": true,
    "block_number": 277,
    "block_time_ms": 6000
  },
  "id": 1
}
```

---

## System Requirements

### Minimum (Development)
- 4GB RAM
- 2 CPU cores
- 20GB SSD
- Ubuntu 22.04+ / macOS 12+ / Windows 10+

### Recommended (Production)
- 16GB RAM
- 4 CPU cores
- 100GB SSD
- Ubuntu 24.04 LTS

---

## Troubleshooting

### "cargo: command not found"
```bash
source ~/.cargo/env
```

### RocksDB build errors
```bash
# Ubuntu/Debian
sudo apt install libclang-dev

# macOS
brew install llvm
```

### Permission denied on data directory
```bash
sudo chown -R $USER:$USER /var/lib/demiurge
```

---

**Next:** [First Transaction](./first-transaction.md)
