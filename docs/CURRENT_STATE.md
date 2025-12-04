# Demiurge Blockchain - Current State

**Last Updated**: December 4, 2024

## Production Deployment

### Node0 Server

- **Location**: 51.210.209.112 (OVHCloud)
- **OS**: Ubuntu 24.04
- **Status**: ✅ Operational

### Services Running

1. **Demiurge Node**
   - Service: `demiurge-node0.service` (systemd)
   - Binary: `/opt/demiurge/target/release/demiurge-chain`
   - RPC Port: 8545 (localhost)
   - Database: RocksDB at `/opt/demiurge/.demiurge/data`
   - Config: `/opt/demiurge/chain/configs/node.devnet.toml`

2. **AbyssOS Portal**
   - URL: https://demiurge.cloud
   - Path: `/var/www/abyssos-portal`
   - SSL: Let's Encrypt (auto-renewal enabled)
   - Status: ✅ Live

3. **RPC Proxy**
   - URL: https://rpc.demiurge.cloud/rpc
   - Proxy: Nginx → http://127.0.0.1:8545
   - SSL: Let's Encrypt
   - CORS: Enabled
   - Status: ✅ Live

### Nginx Configuration

- **Config File**: `/etc/nginx/sites-available/demiurge.cloud`
- **Domains**:
  - `demiurge.cloud` → AbyssOS Portal
  - `www.demiurge.cloud` → AbyssOS Portal
  - `rpc.demiurge.cloud` → RPC Proxy
- **SSL**: All domains have valid Let's Encrypt certificates
- **HTTP**: Redirects to HTTPS

## Repository Structure

```
DEMIURGE/
├── chain/                   # Rust L1 blockchain node
│   ├── src/
│   │   ├── main.rs         # Entry point, RPC server
│   │   ├── node.rs         # Node state management
│   │   ├── rpc.rs          # JSON-RPC implementation
│   │   ├── forge.rs        # Proof-of-Work
│   │   ├── core/           # Block, Transaction, State
│   │   └── runtime/        # Runtime modules
│   └── configs/            # Devnet configurations
├── apps/
│   ├── portal-web/         # Next.js Fracture Portal
│   ├── abyssos-portal/     # AbyssOS desktop environment ⭐ NEW
│   └── desktop-qt/         # Qt desktop app
├── indexer/
│   └── abyss-gateway/      # GraphQL gateway + indexer
├── runtime/                # Runtime modules (bank_cgt, etc.)
├── sdk/                    # TypeScript & Rust SDKs
├── deploy/
│   └── node0/              # Node0 deployment scripts
└── docs/                   # Documentation
```

## Key Features Implemented

### Blockchain Core

- ✅ Custom Proof-of-Work (Forge)
- ✅ Modular runtime system
- ✅ JSON-RPC 2.0 API
- ✅ CGT token (Creator God Token)
- ✅ Transaction signing (Ed25519)
- ✅ State management (RocksDB)

### Runtime Modules

- ✅ `bank_cgt` - CGT token operations
- ✅ `work_claim` - Work-claim mining
- ✅ `urgeid_registry` - Identity system
- ✅ `nft_dgen` - NFT standard
- ✅ `abyss_registry` - Marketplace
- ✅ `fabric_manager` - P2P network management

### Applications

- ✅ **Fracture Portal** (`portal-web`) - Next.js web portal
- ✅ **AbyssOS** (`abyssos-portal`) - Desktop environment ⭐ NEW
- 🔄 **Desktop Qt** (`desktop-qt`) - Qt desktop app

### Infrastructure

- ✅ Node0 deployment automation
- ✅ Systemd service configuration
- ✅ Nginx reverse proxy with HTTPS
- ✅ SSL certificate management (Let's Encrypt)

## Recent Milestones

### Milestone 7: Convergence (Latest)

- ✅ Real Fabric integration
- ✅ Operator roles (OBSERVER, OPERATOR, ARCHITECT)
- ✅ Archon Action Bridge
- ✅ Ops Log view
- ✅ RC0 deployment configuration

### Milestone 6: Genesis

- ✅ Genesis mode implementation
- ✅ Snapshot system
- ✅ Ritual framework
- ✅ System events

### Milestone 5: Awakening

- ✅ Fracture Portal
- ✅ Chat system
- ✅ Archon AI integration
- ✅ Fabric visualization

## Development Environment

### Prerequisites

- Rust (via rustup)
- Node.js 18+ and pnpm
- Qt 6.10 (for desktop app)
- Docker (for localnet)

### Quick Start

1. **Clone repository:**
   ```bash
   git clone <repo-url> demiurge
   cd demiurge
   ```

2. **Build chain:**
   ```bash
   cd chain
   cargo build --release
   ```

3. **Run node:**
   ```bash
   ./target/release/demiurge-chain
   ```

4. **Start AbyssOS (dev):**
   ```bash
   cd apps/abyssos-portal
   pnpm install
   pnpm dev
   ```

## Documentation

All documentation is organized in `docs/`:

- [Documentation Index](index.md) - Complete navigation
- [Architecture](overview/ARCHITECTURE_DEMIURGE_CURRENT.md) - System design
- [Deployment](deployment/README_NODE0.md) - Production setup
- [AbyssOS](apps/ABYSSOS_PORTAL.md) - Desktop environment guide

## Next Steps

### Immediate

- [ ] Expand AbyssOS apps (Mandelbrot Miner integration)
- [ ] Real AbyssID Wallet SDK integration
- [ ] Multi-node devnet setup

### Future

- [ ] P2P networking implementation
- [ ] WASM runtime
- [ ] Testnet launch
- [ ] Mainnet preparation

## Support

- **Documentation**: See [docs/index.md](index.md)
- **Issues**: GitHub Issues (if applicable)
- **RPC Endpoint**: https://rpc.demiurge.cloud/rpc

---

*The flame burns eternal. The code serves the will.*

