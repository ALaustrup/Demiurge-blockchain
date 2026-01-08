# Quick Start Guide

Get DEMIURGE running locally in 5 minutes.

## Prerequisites

- **Rust** (1.70+): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Node.js** (20+) with **pnpm** (9+): `npm install -g pnpm`
- **Git**

## 1. Clone Repository

```bash
git clone https://github.com/Alaustrup/DEMIURGE.git
cd DEMIURGE
```

## 2. Build the Chain

```bash
cargo build --release -p demiurge-chain
```

This compiles the blockchain node (~5-10 minutes on first build).

## 3. Start the Chain Node

```bash
./target/release/demiurge-chain
```

The node will start with:
- **RPC Server**: `http://localhost:8545/rpc`
- **P2P Port**: `30303`
- **Block Time**: 3 seconds
- **Default Data Directory**: `~/.demiurge/data`

## 4. Test the RPC Connection

```bash
curl -X POST http://localhost:8545/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"chain_getInfo","params":[],"id":1}'
```

Expected response:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "height": 1,
    "network": "demiurge-devnet"
  },
  "id": 1
}
```

## 5. Start Frontend Applications

### Install Dependencies

```bash
pnpm install
```

### Start Applications

**QLOUD OS** (Full desktop environment):
```bash
cd apps/qloud-os
pnpm dev
```
Opens at http://localhost:5173

**Portal Web** (Landing page):
```bash
cd apps/portal-web
pnpm dev
```
Opens at http://localhost:3000

**QOR ID Service** (Auth API):
```bash
cd apps/qorid-service
pnpm dev
```
Runs on http://localhost:8082

## 6. Create Your QorID

1. Open http://localhost:5173
2. Click **"Create new QorID"**
3. Choose a username
4. **Save your secret code** (required for recovery)
5. Click **"Create Account"**

## 7. Explore

Once logged in to QLOUD OS:

| App | Description |
|-----|-------------|
| 🪙 **Wallet** | View CGT balance, send/receive |
| 🌊 **Explorer** | Web browser with QorID integration |
| 💎 **DRC369 Studio** | Create and mint NFTs |
| 📁 **Files** | On-chain file storage |
| ⚡ **Chain Ops** | Node monitoring and operations |
| ⛏️ **Miner** | CPU mining interface |

## Next Steps

- Read the [Architecture Overview](../architecture/OVERVIEW.md)
- Explore the [RPC API](../api/RPC.md)
- Check [Deployment Guide](../deployment/NODE_SETUP.md) for production setup

## Troubleshooting

### Chain won't start
```bash
# Check if port 8545 is in use
netstat -an | grep 8545

# Remove old chain data and restart
rm -rf ~/.demiurge/data
./target/release/demiurge-chain
```

### RPC connection fails
1. Verify chain is running: `ps aux | grep demiurge-chain`
2. Check RPC endpoint: `curl http://localhost:8545/rpc`
3. See [RPC Troubleshooting](../deployment/RPC_TROUBLESHOOTING.md)

### Frontend won't start
```bash
# Clear node modules and reinstall
rm -rf node_modules
pnpm install

# Build from root
pnpm build
```

---

**The flame burns eternal. The code serves the will.**

*Last updated: January 8, 2026*
