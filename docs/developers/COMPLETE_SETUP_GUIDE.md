# Complete Development Setup Guide

**Last Updated:** February 4, 2026

This guide covers the complete setup process for developing with the Demiurge Protocol, from prerequisites to running a local node.

---

## Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 8 GB | 16 GB |
| Storage | 50 GB SSD | 100 GB NVMe |
| CPU | 4 cores | 8+ cores |
| OS | Windows 10/Ubuntu 20.04/macOS 12 | Latest LTS |

### Required Software

#### 1. Rust (for blockchain development)

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add to PATH
source $HOME/.cargo/env

# Verify installation
rustc --version  # Should be 1.75+
cargo --version
```

#### 2. Node.js (for frontend/SDK development)

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Verify installation
node --version  # Should be 20+
npm --version
```

#### 3. Git

```bash
# Ubuntu
sudo apt install git

# macOS
brew install git

# Windows
# Download from https://git-scm.com/download/win

# Verify
git --version
```

---

## Clone the Repository

```bash
git clone https://github.com/ALaustrup/Demiurge-Blockchain.git
cd Demiurge-Blockchain
```

---

## Component Setup

### 1. Blockchain Framework (Rust)

```bash
cd framework

# Build all modules
cargo build --release

# Run tests
cargo test

# Build the node binary
cargo build --release -p demiurge-node

# Verify binary
./target/release/demiurge-node --version
```

### 2. TypeScript SDK

```bash
cd sdk

# Install dependencies
npm install

# Build SDK
npm run build

# Run tests
npm test
```

### 3. CLI Tool

```bash
cd cli

# Install dependencies
npm install

# Build CLI
npm run build

# Link globally (optional)
npm link

# Verify
demiurge --version
```

### 4. Browser Wallet Extension

```bash
cd apps/wallet-extension

# Install dependencies
npm install

# Build for development
npm run dev

# Build for production
npm run build
```

**Loading in Chrome:**
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `apps/wallet-extension/dist`

### 5. Hub (Web Platform)

```bash
cd apps/hub

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your RPC URL
# NEXT_PUBLIC_DEMIURGE_RPC_URL=http://localhost:9944

# Start development server
npm run dev
```

---

## Running a Local Node

### Option 1: Direct Binary

```bash
cd framework

# Start node with default settings
./target/release/demiurge-node \
  --data-dir ./data \
  --rpc-addr 127.0.0.1:9944 \
  --p2p-addr 0.0.0.0:30333

# Verify node is running
curl -X POST http://localhost:9944 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"chain_getHealth","params":[]}'
```

### Option 2: Docker Testnet

```bash
cd docker

# Start 4-node testnet
docker compose -f docker-compose.testnet.yml up -d

# Check status
docker compose -f docker-compose.testnet.yml ps

# View logs
docker compose -f docker-compose.testnet.yml logs -f node1

# Stop testnet
docker compose -f docker-compose.testnet.yml down
```

---

## Development Workflow

### 1. Making Changes to the Blockchain

```bash
cd framework

# Edit modules in framework/modules/
# Example: framework/modules/balances/src/lib.rs

# Rebuild
cargo build --release

# Run tests
cargo test -p demiurge-balances

# Restart node to apply changes
```

### 2. Making Changes to the SDK

```bash
cd sdk

# Edit TypeScript files in sdk/src/
# Example: sdk/src/wallet.ts

# Rebuild
npm run build

# Run tests
npm test

# Use in other projects
npm link
```

### 3. Making Changes to the Wallet Extension

```bash
cd apps/wallet-extension

# Edit React components in popup/
# Example: popup/screens/MainScreen.tsx

# Rebuild (with hot reload)
npm run dev

# Reload extension in Chrome
# Click the refresh icon in chrome://extensions
```

---

## Environment Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# RPC Configuration
DEMIURGE_RPC_URL=http://localhost:9944
DEMIURGE_WS_URL=ws://localhost:9944

# Network
DEMIURGE_NETWORK=devnet
DEMIURGE_CHAIN_ID=demiurge-devnet-1

# Development
LOG_LEVEL=debug
RUST_LOG=info,demiurge=debug
```

### Node Configuration (TOML)

Create `config/node.toml`:

```toml
[network]
listen_addresses = ["/ip4/0.0.0.0/tcp/30333"]
bootnodes = []
max_peers = 50

[rpc]
enabled = true
listen_address = "127.0.0.1:9944"
cors = ["*"]
ws_enabled = true

[validator]
enabled = false

[storage]
path = "./data"
cache_size_mb = 256

[logging]
level = "info"
```

---

## Verification Checklist

After setup, verify each component:

| Component | Command | Expected Result |
|-----------|---------|-----------------|
| Node | `curl http://localhost:9944 -d '{"jsonrpc":"2.0","id":1,"method":"chain_getHealth","params":[]}'` | `{"result":{"connected":true,...}}` |
| SDK | `npm test` (in sdk/) | All tests pass |
| CLI | `demiurge chain status` | Shows chain info |
| Wallet | Load in Chrome | Extension icon appears |
| Hub | `npm run dev` (in apps/hub) | Opens at localhost:3000 |

---

## Troubleshooting

### Common Issues

**Rust build fails:**
```bash
# Update Rust
rustup update

# Clean and rebuild
cargo clean
cargo build --release
```

**Node.js version mismatch:**
```bash
# Use nvm to switch versions
nvm use 20
```

**Port already in use:**
```bash
# Find process using port
lsof -i :9944
# or on Windows
netstat -ano | findstr :9944

# Kill process
kill <PID>
```

**Docker issues:**
```bash
# Reset Docker
docker system prune -f
docker compose down -v
docker compose up -d
```

---

## Next Steps

- [RPC Reference](./rpc-reference.md) - All available RPC methods
- [Wallet Extension Development](../sdk/WALLET_EXTENSION.md) - dApp integration
- [Validator CLI](./VALIDATOR_CLI.md) - Run a validator
- [Docker Testnet](../deployment/DOCKER_TESTNET.md) - Multi-node setup

---

**Need help?** Open an issue on [GitHub](https://github.com/ALaustrup/Demiurge-Blockchain/issues)
