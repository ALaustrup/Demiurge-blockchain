# Demiurge Blockchain - Current State

**Last Updated**: January 5, 2026

## Production Deployment

### Node0 Server

- **Location**: 51.210.209.112 (OVHCloud)
- **OS**: Ubuntu 24.04
- **Status**: ✅ Operational

### Services Running

1. **Demiurge Chain Node**
   - Service: `demiurge-node0.service` (systemd)
   - Binary: `/opt/demiurge/target/release/demiurge-chain`
   - RPC Port: 8545 (localhost)
   - Public RPC: https://rpc.demiurge.cloud/rpc (HTTPS, CORS enabled)
   - Database: RocksDB at `/opt/demiurge/.demiurge/data`
   - Config: `/opt/demiurge/chain/configs/node.devnet.toml`
   - Status: ✅ Live

2. **AbyssOS Portal**
   - URL: https://demiurge.cloud
   - Path: `/var/www/abyssos-portal`
   - SSL: Let's Encrypt (auto-renewal enabled)
   - Status: ✅ Live

3. **Abyss Gateway (GraphQL)**
   - URL: http://localhost:4000/graphql (internal)
   - Status: ✅ Running (integrated with portal-web)

4. **AbyssID Backend**
   - URL: http://localhost:3001/api/abyssid
   - Database: SQLite3
   - Status: ✅ Running (for local development)

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
│   │   ├── forge.rs        # Proof-of-Work (Forge)
│   │   ├── rpc.rs          # JSON-RPC 2.0 server (Axum)
│   │   ├── core/           # Block, Transaction, State
│   │   │   ├── block.rs    # Block structure
│   │   │   ├── state.rs    # State management (RocksDB/in-memory)
│   │   │   └── transaction.rs  # Transaction structure
│   │   └── runtime/        # Runtime modules (9 modules)
│   │       ├── mod.rs      # Module registry
│   │       ├── version.rs  # Runtime versioning
│   │       ├── bank_cgt.rs
│   │       ├── urgeid_registry.rs
│   │       ├── nft_dgen.rs
│   │       ├── fabric_manager.rs
│   │       ├── abyss_registry.rs
│   │       ├── developer_registry.rs
│   │       ├── dev_capsules.rs
│   │       ├── recursion_registry.rs
│   │       └── work_claim.rs
│   └── configs/            # Devnet configurations
├── apps/
│   ├── portal-web/         # Next.js Fracture Portal
│   │   ├── src/app/        # Pages (nexus, chat, fabric, etc.)
│   │   ├── src/components/ # React components
│   │   └── src/lib/        # Utilities, RPC client, GraphQL
│   ├── abyssos-portal/     # AbyssOS desktop environment
│   │   ├── src/routes/     # BootScreen, LoginScreen, Desktop
│   │   ├── src/components/ # UI components
│   │   └── src/state/      # Zustand stores
│   ├── abyssid-backend/    # AbyssID backend service (SQLite)
│   ├── abyssid-service/    # AbyssID service (TypeScript)
│   └── desktop-qt/         # Qt desktop app
├── indexer/
│   └── abyss-gateway/      # GraphQL gateway + indexer
│       ├── src/schema.ts   # GraphQL schema
│       └── src/resolvers.ts # GraphQL resolvers
├── sdk/                    # TypeScript & Rust SDKs
│   ├── ts-sdk/             # TypeScript SDK
│   └── rust-sdk/           # Rust SDK
├── deploy/
│   └── node0/              # Node0 deployment scripts
├── other/                  # Legacy code and experimental features
│   └── legacy-runtime-stubs/ # Legacy placeholder runtime crates (superseded)
└── docs/                   # Documentation
```

## Key Features Implemented

### Blockchain Core

- ✅ Custom Proof-of-Work (Forge) - Memory-hard PoW using Argon2id + SHA-256
- ✅ Modular runtime system - 9 runtime modules with versioned registration
- ✅ JSON-RPC 2.0 API - 40+ RPC methods
- ✅ CGT token (Creator God Token) - 8 decimals, 369B max supply
- ✅ Transaction signing (Ed25519) - Client-side signing support
- ✅ State management (RocksDB) - Production-ready persistent storage
- ✅ Transaction nonce management - Replay protection
- ✅ Transaction history tracking - Per-address transaction logs

### Runtime Modules (9 Total)

All runtime modules are implemented in `chain/src/runtime/`:

1. ✅ `bank_cgt` - CGT token operations (balance, transfer, mint, burn, supply)
2. ✅ `urgeid_registry` - Identity system (profiles, usernames, handles, Syzygy, leveling, badges)
3. ✅ `nft_dgen` - D-GEN NFT standard (D-721, minting, transfers, royalties, DEV Badges)
4. ✅ `fabric_manager` - P2P Fabric asset management (registration, fee pools, seeder rewards)
5. ✅ `abyss_registry` - Marketplace listings (create, cancel, buy, royalties)
6. ✅ `developer_registry` - Developer profiles and projects (registration, reputation, auto-mint DEV Badge)
7. ✅ `dev_capsules` - Development capsule management (draft, live, paused, archived)
8. ✅ `recursion_registry` - Recursion world management (world creation, ownership, Fabric linking)
9. ✅ `work_claim` - Work-claim mining rewards (arcade miners, Mandelbrot, CGT rewards)

See [Runtime Modules Documentation](overview/RUNTIME.md) for complete details.

### Applications

- ✅ **Fracture Portal** (`portal-web`) - Next.js 15+ web portal
  - UrgeID onboarding and profile management
  - Chat system (World Chat, DMs, custom rooms)
  - Marketplace browsing
  - Fabric visualization
  - Developer registry
  - Nexus (Fabric topology)
  - Timeline view
  - Archon AI integration
  - GraphQL integration with Abyss Gateway

- ✅ **AbyssOS** (`abyssos-portal`) - Full-screen desktop environment
  - Boot screen with glitch effects
  - AbyssID authentication (login/signup with seed phrase recovery)
  - Desktop environment with circular dock
  - Window management (drag, resize, minimize, maximize)
  - Chain Ops app (real-time blockchain status)
  - CRAFT IDE (Creator's Advanced Framework & Tools) - Monaco Editor, AI integration, templates, drag-and-drop, GitHub integration, Rig system
  - Abyss Wallet integration
  - File storage (500GB per user)
  - NFT minting and swapping
  - NEON Player (media playback)
  - Document editor
  - System menu with categorized apps

- 🔄 **Desktop Qt** (`desktop-qt`) - Qt 6.10 desktop app (in development)

### Infrastructure

- ✅ Node0 deployment automation
- ✅ Systemd service configuration
- ✅ Nginx reverse proxy with HTTPS
- ✅ SSL certificate management (Let's Encrypt)
- ✅ CORS support for RPC endpoint
- ✅ Docker Compose for local development

### Identity Systems

- ✅ **UrgeID** - On-chain identity system
  - Globally unique usernames (3-32 chars, lowercase alphanumeric + dots/underscores)
  - Display names and bios
  - Syzygy score tracking
  - Leveling system (level = 1 + syzygy_score / 1000)
  - CGT rewards for level-ups
  - Badge system (Luminary at 10,000 syzygy)
  - Archon status tracking

- ✅ **AbyssID** - Off-chain authentication system
  - Username-based authentication
  - Seed phrase generation and recovery
  - Deterministic key derivation (Ed25519)
  - Public key verification
  - SQLite backend for identity storage
  - Login flow for existing users
  - Signup flow for new users

### APIs

- ✅ **JSON-RPC 2.0** - 40+ methods
  - Chain info and metadata
  - CGT operations (balance, transfer, mint)
  - UrgeID operations (create, get, set username, resolve)
  - NFT operations (mint, transfer, query)
  - Marketplace operations (listings, buy, cancel)
  - Developer operations (register, projects, capsules)
  - Recursion world operations
  - Work claim submission
  - Transaction building and signing
  - Transaction history

- ✅ **GraphQL** (Abyss Gateway)
  - Chat system queries and mutations
  - User profiles
  - Developer data
  - Operator context

See [RPC API Documentation](api/RPC.md) and [GraphQL API Documentation](api/GRAPHQL.md) for complete details.

## Recent Milestones

### Current Version (January 5, 2026)

- ✅ Complete runtime module system (9 modules)
- ✅ Comprehensive RPC API (40+ methods)
- ✅ UrgeID identity system with leveling
- ✅ AbyssID authentication with seed phrase recovery
- ✅ Fracture Portal with full feature set
- ✅ AbyssOS desktop environment
- ✅ GraphQL gateway for chat and social features
- ✅ Developer registry with auto-mint DEV Badge NFTs
- ✅ Work claim mining system
- ✅ Recursion world registry

### Milestone 7: Convergence

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

- Rust (via rustup) - Latest stable
- Node.js 18+ and pnpm 9+
- Qt 6.10 (for desktop app, optional)
- Docker (for localnet, optional)

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
   - Initializes RocksDB at `.demiurge/data`
   - Genesis Archon receives 1M CGT
   - RPC server starts on `http://127.0.0.1:8545/rpc`

4. **Start Portal Web (dev):**
   ```bash
   cd apps/portal-web
   pnpm install
   pnpm dev
   ```
   - Portal available at `http://localhost:3000`

5. **Start Abyss Gateway (dev):**
   ```bash
   cd indexer/abyss-gateway
   pnpm install
   pnpm dev
   ```
   - GraphQL API at `http://localhost:4000/graphql`

6. **Start AbyssID Backend (dev):**
   ```bash
   cd apps/abyssid-backend
   npm install
   node src/server.js
   ```
   - API at `http://localhost:3001/api/abyssid`

### Using PowerShell Scripts (Windows)

```powershell
# Start all services
.\start-all.ps1

# Stop all services
.\stop-all.ps1
```

## Documentation

All documentation is organized in `docs/`:

- [Documentation Index](index.md) - Complete navigation
- [Architecture](overview/ARCHITECTURE_DEMIURGE_CURRENT.md) - System design
- [Runtime Modules](overview/RUNTIME.md) - Complete module documentation
- [RPC API](api/RPC.md) - JSON-RPC method reference
- [GraphQL API](api/GRAPHQL.md) - GraphQL schema and queries
- [Deployment](deployment/README_NODE0.md) - Production setup
- [AbyssOS](apps/ABYSSOS_PORTAL.md) - Desktop environment guide
- [AbyssID](ABYSSID_UNIVERSAL_AUTH.md) - Authentication system

## Next Steps

### Immediate

- [ ] Complete GraphQL API documentation
- [ ] Expand AbyssOS apps (Mandelbrot Miner integration)
- [ ] Multi-node devnet setup
- [ ] Enhanced transaction indexing

### Future

- [ ] P2P networking implementation (libp2p)
- [ ] WASM runtime for smart contracts
- [ ] Testnet launch
- [ ] Mainnet preparation
- [ ] Cross-chain bridges
- [ ] Mobile SDK

## Support

- **Documentation**: See [docs/index.md](index.md)
- **RPC Endpoint**: https://rpc.demiurge.cloud/rpc
- **AbyssOS Portal**: https://demiurge.cloud
- **GraphQL Endpoint**: http://localhost:4000/graphql (dev)

---

*The flame burns eternal. The code serves the will.*
