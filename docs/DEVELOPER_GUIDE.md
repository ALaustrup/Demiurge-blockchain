# 👨‍💻 Developer Guide - Building on Demiurge

**Everything you need to build dApps and games on Demiurge Blockchain**

> *"From the Monad, all creation emanates. To the Pleroma, all value returns."*

---

## ⚡ Quick Start (5 Minutes)

**No installation needed** - Use our public RPC endpoint:

```typescript
// Install: npm install @demiurge/rpc-client
import { DemiurgeRpcClient } from '@demiurge/rpc-client';

const rpc = new DemiurgeRpcClient('https://rpc.demiurge.cloud');

// Get chain status
const health = await rpc.getHealth();
console.log('Chain:', health);
```

**Full Quick Start**: [`docs/developers/QUICK_START.md`](docs/developers/QUICK_START.md)

---

## 🔌 RPC Endpoint

**Production Endpoint** (Recommended):
- **HTTPS**: `https://rpc.demiurge.cloud`
- **WebSocket**: `wss://rpc.demiurge.cloud`

**Local Development**:
- **HTTP**: `http://localhost:9944`
- **WebSocket**: `ws://localhost:9944`

---

## 📚 Documentation

### For Developers
- **[Quick Start](docs/developers/QUICK_START.md)** ⚡ - Build your first dApp in 5 minutes
- **[Getting Started](docs/developers/getting-started.md)** - Complete setup guide
- **[RPC API Reference](docs/developers/rpc-api-reference.md)** - All available methods
- **[Transaction Building](docs/developers/transaction-building.md)** - Create transactions
- **[Module Integration](docs/developers/module-integration.md)** - Integrate modules

### For Game Developers
- **[Game Integration Guide](docs/GAME_INTEGRATION_GUIDE.md)** - Build blockchain games
- **[Session Keys](docs/SESSION_KEYS_QOR_ID_INTEGRATION.md)** - Seamless UX
- **[NFT Integration](docs/creators/drc369-complete-guide.md)** - Stateful NFTs

### For Creators
- **[DRC-369 Guide](docs/creators/drc369-complete-guide.md)** - Stateful NFTs
- **[Asset Management](docs/creators/asset-management.md)** - Manage assets
- **[Mining Operations](docs/creators/mining-operations.md)** - Staking & rewards

---

## 🎯 What You Can Build

### dApps
- DeFi applications
- NFT marketplaces
- Gaming platforms
- Social networks
- Creator tools

### Games
- On-chain games with true ownership
- Cross-game asset systems
- Feeless transactions
- Session key integration

---

## 🔧 Development Setup

### Option 1: Use Public RPC (Recommended)

No setup needed - just connect to `https://rpc.demiurge.cloud`

### Option 2: Run Local Node

```bash
# Clone repository
git clone https://github.com/Alaustrup/Demiurge-Blockchain.git
cd Demiurge-Blockchain

# Build node
cd framework
cargo build --release

# Run node
./target/release/demiurge-node \
  --data-dir ~/demiurge-data \
  --rpc-addr 127.0.0.1:9944
```

---

## 📦 SDKs & Libraries

### TypeScript/JavaScript
```bash
npm install @demiurge/rpc-client
```

### Python
```bash
pip install demiurge-rpc
```

### Rust
```toml
[dependencies]
demiurge-rpc = { git = "https://github.com/Alaustrup/Demiurge-Blockchain", path = "framework/rpc" }
```

---

## 🎮 Key Features for Developers

- **Fast Finality** - Sub-second block confirmation
- **Feeless Transactions** - Energy-based model
- **Session Keys** - Seamless UX, no wallet popups
- **Stateful NFTs** - NFTs that evolve and level up
- **Cross-Game Assets** - Use items across games
- **True Ownership** - Own your assets as NFTs

---

## 🔗 Resources

- **RPC Endpoint**: `https://rpc.demiurge.cloud`
- **Documentation**: [`docs/`](docs/)
- **GitHub**: `https://github.com/Alaustrup/Demiurge-Blockchain`
- **Issues**: `https://github.com/Alaustrup/Demiurge-Blockchain/issues`

---

## 💡 Examples

### Check Chain Health
```typescript
const health = await rpc.getHealth();
console.log('Connected:', health.connected);
console.log('Block:', health.blockNumber);
```

### Get User Balance
```typescript
const balance = await rpc.getBalance('0x1234...');
console.log(`Balance: ${balance} CGT`);
```

### Query NFT
```typescript
const nft = await rpc.getNFT('0x5678...');
console.log('NFT:', nft);
```

---

## 🤝 Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for contribution guidelines.

---

**Ready to build?** Start with the [Quick Start Guide](docs/developers/QUICK_START.md)!

**The flame burns eternal. The code serves the will.**
