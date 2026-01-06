# Demiurge Blockchain - Complete Project Overview

> **The flame burns eternal. The code serves the will.**

**Last Updated**: January 5, 2026  
**Production Status**: ✅ Live at https://demiurge.cloud

---

## Executive Summary

**Demiurge** is a sovereign L1 blockchain ecosystem designed specifically for creators, gamers, musicians, developers, and artists. It combines a custom Proof-of-Work chain (Forge), a content-addressed P2P network (Fabric), and a decentralized marketplace (Abyss) into a unified creative economy powered by the Creator God Token (CGT).

### Core Value Proposition

- **For Creators**: Sovereign identity, NFT minting, decentralized marketplace, content distribution, and direct creator-to-consumer transactions
- **For Users**: True ownership, unified marketplace, social layer, and portable identity
- **For Developers**: Creator-focused features, low-cost transactions, and extensible runtime

---

## Production Deployment

### Live Infrastructure

**Node0 Server** (OVHCloud)
- **IP**: 51.210.209.112
- **OS**: Ubuntu 24.04
- **Status**: ✅ Operational

**Services Running**:
1. **Demiurge Chain Node**
   - Service: `demiurge-node0.service` (systemd)
   - Binary: `/opt/demiurge/target/release/demiurge-chain`
   - RPC: `https://rpc.demiurge.cloud/rpc` (HTTPS, CORS enabled)
   - Database: RocksDB at `/opt/demiurge/.demiurge/data`
   - Config: Devnet configuration

2. **AbyssOS Portal**
   - URL: `https://demiurge.cloud` (HTTPS, Let's Encrypt)
   - Path: `/var/www/abyssos-portal`
   - Status: ✅ Live and deployed

3. **Nginx Reverse Proxy**
   - Config: `/etc/nginx/sites-available/demiurge.cloud`
   - Domains: `demiurge.cloud`, `www.demiurge.cloud`, `rpc.demiurge.cloud`
   - SSL: All domains with valid Let's Encrypt certificates

---

## Architecture Overview

### Layer 1: Blockchain Core (`chain/`)

**Technology**: Rust, custom Proof-of-Work (Forge)

**Components**:
- **Block Structure**: Header, transactions, state root
- **Transaction System**: Ed25519 signing, nonce management, fee calculation
- **State Management**: RocksDB persistence, in-memory state for tests
- **Consensus**: Forge PoW (memory-hard proof-of-work)
- **RPC Layer**: JSON-RPC 2.0 server on port 8545

**Runtime Modules**:
- `bank_cgt` - Creator God Token operations (mint, transfer, balance)
- `work_claim` - Work-claim mining module
- `urgeid_registry` - Identity system with profiles, handles, Syzygy scores
- `nft_dgen` - D-GEN NFT standard (flexible NFT standard)
- `abyss_registry` - Marketplace registry
- `fabric_manager` - P2P network management
- `developer_registry` - Developer profiles
- `recursion_registry` - Recursive computation registry
- `dev_capsules` - Development capsules

**RPC Methods**:
- `cgt_getChainInfo` - Chain status, height, block info
- `cgt_getBalance` - CGT balance for address
- `cgt_getTransactionsByAddress` - Transaction history
- `sendRawTransaction` - Submit signed transaction
- `getNetworkInfo` - Network status
- `submitWorkClaim` - Submit work-claim for mining rewards

### Layer 2: Applications

#### 1. AbyssOS Portal (`apps/abyssos-portal/`)

**Technology**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Zustand

**Status**: ✅ Production-ready, deployed at https://demiurge.cloud

**Core Features**:
- **Boot Screen**: Animated "A B Y S S OS" intro with glitch effects
- **AbyssID Authentication**: Login/signup flow with local account management
- **Desktop Environment**: Full-screen desktop with glassmorphism UI
- **Circular Dock**: App launcher with drag-and-drop reordering
- **Window Management**: Draggable, resizable windows for apps
- **Chain Status**: Real-time Demiurge blockchain status and metrics
- **Mobile Optimized**: 60 FPS, dynamic viewport height, touch-optimized

**Apps Implemented**:
1. **Chain Ops** - Network status, RPC endpoint, chain height
2. **AbyssBrowser** - Web3-aware browser with `abyss://` protocol support
3. **AbyssTorrent** - File publisher/seeder UI
4. **OnChainFiles** - DRC-369 asset gallery/marketplace
5. **AbyssWallet** - Wallet with CGT balance, transactions, send CGT
6. **DRC369 Studio** - Asset creation and preview
7. **Block Explorer** - Navigate blocks, transactions, accounts
8. **AbyssDNS** - DNS lookup console with chain integration
9. **AWE Console** - Autonomous World Engine simulation control
10. **World Atlas** - Browse local, on-chain, and grid worlds
11. **Cognitive Fabric Console** - Neural mesh visualization
12. **Genesis Console** - Lineage tree and reproductive events
13. **Temporal Observatory** - Timeline and branching futures visualization

**Advanced Systems**:
- **AbyssID SDK**: Identity layer with local/remote modes
- **DRC-369 Standard**: Multi-chain NFT compatibility (Ethereum, Solana, Bitcoin adapters)
- **Web3 Bridge**: `window.abyss` injection for dApps
- **Block Listener**: Real-time block updates via WebSocket/long-poll
- **Virtual Filesystem (VFS)**: IndexedDB-backed filesystem
- **WASM Runtime**: Sandboxed WebAssembly execution
- **AbyssVM**: Global deterministic execution VM
- **AbyssGrid Protocol**: Peer-to-peer compute and storage
- **Autonomous World Engine (AWE)**: Procedural universe simulator
- **DNS Intelligence Layer**: Chain-anchored DNS resolution

**State Management**:
- `authStore` - AbyssID authentication state
- `desktopStore` - Window management, app state
- `walletStore` - Wallet state and transactions

**Theming**:
- Glassmorphism design with backdrop blur
- Multiple theme options (ABYSS_GLASS, OBSIDIAN_CORE, IRIDESCENT_WAVE)
- Neon cyan/magenta/purple accents
- Dark blue/black backgrounds

#### 2. Fracture Portal (`apps/portal-web/`)

**Technology**: Next.js 14, TypeScript, React, Tailwind CSS

**Status**: ✅ Functional (legacy portal)

**Features**:
- UrgeID Dashboard (profile, balance, Syzygy, leveling)
- Marketplace (browse, create listings, buy NFTs)
- Chat system (world chat, DMs, custom rooms)
- Media sharing (images, videos, NFT collections)
- Archon AI integration
- Fabric visualization

#### 3. AbyssID Service (`apps/abyssid-service/`)

**Technology**: Node.js, TypeScript, Express, SQLite, Zod

**Status**: ✅ Backend service for identity management

**Features**:
- Username availability checking
- Identity registration
- Session management
- DRC-369 asset management
- Chain signing integration
- Compute market (staking, slashing)
- Mining rewards

**API Endpoints**:
- `GET /api/abyssid/username-available` - Check username
- `POST /api/abyssid/register` - Register identity
- `POST /api/abyssid/session/init` - Init session
- `POST /api/abyssid/session/confirm` - Confirm session
- `GET /api/abyssid/me` - Get current user
- `GET /api/drc369/assets/owned` - Get owned assets
- `POST /api/drc369/assets/native` - Mint native DRC-369
- `POST /api/drc369/assets/import` - Import external asset

#### 4. DNS Service (`apps/dns-service/`)

**Technology**: Node.js, TypeScript, Express, SQLite

**Status**: ✅ DNS resolution service

**Features**:
- Multi-source resolver (DRC-369, cache, Unbound, upstream)
- TTL-based caching
- Chain DNS record lookup
- Grid DNS resolution
- Trace mode for debugging

**API Endpoints**:
- `GET /api/dns/lookup` - DNS lookup
- `GET /api/dns/record` - Get all records
- `GET /api/dns/cache/:domain` - Cache inspection
- `POST /api/dns/cache/flush` - Clear cache
- `GET /api/dns/onchain/:domain` - On-chain DNS record

#### 5. Abyss Gateway (`indexer/abyss-gateway/`)

**Technology**: Node.js, TypeScript, GraphQL

**Status**: ✅ GraphQL gateway and indexer

**Features**:
- GraphQL API for blockchain data
- Block indexing
- Transaction indexing
- Real-time subscriptions

---

## Advanced Systems & Phases

### Phase 1-7: Foundation & Convergence

**Milestone 1-4**: Core blockchain, runtime modules, portal web
**Milestone 5**: Fracture Portal, chat system, Archon AI
**Milestone 6**: Genesis mode, snapshot system, ritual framework
**Milestone 7**: Real Fabric integration, operator roles, Action Bridge

### Phase 8-14: AbyssOS Evolution

**Phase 8**: ZK Compute, Staked Execution, Resident AI Agents
- Zero-knowledge WASM verification
- Compute market with staking/slashing
- Abyss Spirits (persistent AI agents)

**Phase 9**: The Demiurge Cognitive Fabric
- Global Neural Mesh (GNM) - distributed vector store
- Embedded Models (local GGUF + grid hybrid)
- Compute Mining (Proof-of-Thought)
- Emergent Intelligence Layer

**Phase 10**: The Demiurge Singularity Kernel
- Autopoietic Engine (self-generating runtimes)
- Evolutionary Agent Swarms
- Meta-Compiler (self-writing code)
- Singularity Kernel (self-directed growth)

**Phase 11**: The Genesis Epoch
- Reproductive Engine (self-cloning)
- Lineage System (multi-generational tracking)
- SwarmMind (collective cognition)
- Chain Bifurcation + Merge Protocol
- Treaty System (inter-agent governance)
- External Ecosystem Migration

**Phase 12**: The Temporal Ascension Layer
- Temporal Memory Engine
- Retrocausal Reasoning Engine
- Multiverse Execution Engine
- Quantum Heuristics Layer
- Temporal Spirit Evolution

**Phase 13**: DNS Intelligence Layer
- Backend DNS microservice
- AbyssOS DNS Console
- WASM Runtime DNS API
- Grid Protocol DNS Extension
- DRC-369 On-Chain DNS Anchoring

**Phase 14**: Autonomous World Engine (AWE)
- AWE Core (simulation engine)
- AWE Manager (supervisor layer)
- World Console App
- Grid-Powered Distributed Simulation
- WASM Runtime Integration
- DRC-369 World NFT Standard
- World Atlas App

---

## Token Economy

### CGT (Creator God Token)

**Specifications**:
- **Name**: Creator God Token
- **Symbol**: CGT
- **Decimals**: 8 (smallest unit: 10^-8 CGT)
- **Max Supply**: 369,000,000,000 CGT (369 billion)
- **Storage**: `u128` in smallest units

**Uses**:
- Gas/fee payments
- Fabric seeding rewards (Proof-of-Delivery)
- Forge compute worker payments
- Abyss marketplace pricing
- Creator royalties
- Transfers between UrgeIDs

### DRC-369 Standard

**Multi-Chain NFT Standard**:
- Universal NFT format compatible with Ethereum, Solana, Bitcoin
- On-chain metadata with royalties, provenance, transfers
- Burn support
- Extended metadata (mime, dimensions, duration)
- DNS record anchoring
- World NFT support (AWE worlds)

---

## Identity System

### UrgeID

**Sovereign Identity**:
- Single Ed25519 keypair per user
- UrgeID Address (32-byte hex) = wallet address + identity handle
- On-chain profile: display name, bio, handle, Syzygy score, badges
- No separate "creator wallet" - one identity with role flags

**Features**:
- Username-based identity (@username)
- Syzygy tracking (contribution score)
- Leveling system (automatic level-ups based on Syzygy)
- Badges (achievement markers)
- Role flags (Archon status)

### AbyssID

**AbyssOS Identity Layer**:
- Username + public key identity
- Local/remote modes (localStorage or backend)
- Session management
- Deterministic key derivation for Demiurge chain
- Wallet integration

---

## Development Milestones

### Completed Milestones

✅ **Milestone 1**: Repository bootstrap, tooling, website skeleton  
✅ **Milestone 2**: Chain skeleton, blocks, transactions  
✅ **Milestone 3**: Persistence (RocksDB), PoW (Forge), JSON-RPC  
✅ **Milestone 4**: Core runtime (CGT, D-GEN NFTs, UrgeID)  
✅ **Milestone 5**: Fracture Portal, chat system, Archon AI  
✅ **Milestone 6**: Genesis mode, snapshots, rituals  
✅ **Milestone 7**: Real Fabric integration, operator roles, Action Bridge  

### Development Phases

✅ **Phase 0**: Repo bootstrap  
✅ **Phase 1**: Chain skeleton  
✅ **Phase 2**: Persistence & PoW  
✅ **Phase 3**: Core runtime  
✅ **Phase 4**: Fabric & Abyss  
✅ **Phase 5**: UX Layer (Portal web, Qt console)  
✅ **Phase 6**: Docker & Deployment  
✅ **Phase 7-14**: AbyssOS evolution (8 phases of advanced features)

---

## Repository Structure

```
DEMIURGE/
├── chain/                    # Rust L1 blockchain node
│   ├── src/
│   │   ├── main.rs          # Entry point, RPC server
│   │   ├── node.rs          # Node state management
│   │   ├── forge.rs         # Proof-of-Work
│   │   ├── core/            # Block, Transaction, State
│   │   └── runtime/         # Runtime modules (bank_cgt, urgeid_registry, etc.)
│   └── configs/             # Devnet configurations
├── apps/
│   ├── abyssos-portal/      # ⭐ AbyssOS desktop environment (PRODUCTION)
│   ├── portal-web/          # Fracture Portal (legacy)
│   ├── abyssid-service/     # Identity backend service
│   ├── dns-service/         # DNS resolution service
│   └── desktop-qt/          # Qt desktop app
├── indexer/
│   └── abyss-gateway/       # GraphQL gateway + indexer
├── sdk/                     # TypeScript & Rust SDKs
├── deploy/
│   └── node0/               # Node0 deployment scripts
├── other/                   # Legacy code and experimental features
│   └── legacy-runtime-stubs/ # Legacy placeholder runtime crates (superseded)
└── docs/                    # Comprehensive documentation
```

---

## Technology Stack

### Blockchain Core
- **Language**: Rust
- **Database**: RocksDB
- **Consensus**: Custom PoW (Forge)
- **RPC**: JSON-RPC 2.0

### Frontend (AbyssOS)
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State**: Zustand
- **WASM**: WebAssembly runtime

### Backend Services
- **Language**: TypeScript/Node.js
- **Framework**: Express
- **Database**: SQLite
- **Validation**: Zod

### Infrastructure
- **Web Server**: Nginx
- **SSL**: Let's Encrypt
- **Process Manager**: systemd
- **Deployment**: SSH + scripts

---

## Current Status

### Production Services

✅ **Demiurge Chain Node**: Running on Node0 (51.210.209.112)  
✅ **AbyssOS Portal**: Live at https://demiurge.cloud  
✅ **RPC Endpoint**: https://rpc.demiurge.cloud/rpc  
✅ **HTTPS**: All services with valid SSL certificates  

### Recent Deployments

✅ **AbyssID Signup Fixes** (December 5, 2024):
- Real-time username availability checking
- Backup confirmation flow fix
- Build error resolution

✅ **Phase 14 Deployment** (AWE - Autonomous World Engine):
- World simulation engine
- World Atlas app
- Grid integration
- DRC-369 World NFTs

### Codebase Statistics

- **Total Files**: 200+ TypeScript/TSX files in AbyssOS
- **Services**: 5+ backend services
- **Runtime Modules**: 9+ chain modules
- **Apps**: 13+ AbyssOS applications
- **Documentation**: 80+ markdown files

---

## Key Features by Category

### Blockchain Features
- ✅ Custom Proof-of-Work (Forge)
- ✅ Modular runtime system
- ✅ CGT token (Creator God Token)
- ✅ Ed25519 transaction signing
- ✅ RocksDB state persistence
- ✅ JSON-RPC 2.0 API
- ✅ Work-claim mining

### Identity & Authentication
- ✅ UrgeID (on-chain identity)
- ✅ AbyssID (AbyssOS identity)
- ✅ Username system
- ✅ Syzygy tracking
- ✅ Leveling system
- ✅ Badge system

### NFT & Assets
- ✅ DRC-369 standard (multi-chain)
- ✅ NFT minting
- ✅ NFT transfers
- ✅ Royalties
- ✅ Provenance tracking
- ✅ Burn support
- ✅ World NFTs (AWE)

### Applications
- ✅ AbyssOS desktop environment
- ✅ Wallet application
- ✅ Block explorer
- ✅ DNS console
- ✅ World simulator (AWE)
- ✅ Cognitive fabric console
- ✅ Temporal observatory

### Advanced Systems
- ✅ WASM runtime
- ✅ AbyssVM (global execution VM)
- ✅ AbyssGrid (P2P compute/storage)
- ✅ Neural mesh (distributed AI)
- ✅ Autopoietic engine (self-modification)
- ✅ Temporal reasoning
- ✅ Quantum heuristics

---

## Documentation

All documentation is organized in `/docs`:

- **[Documentation Index](index.md)** - Complete navigation
- **[Current State](CURRENT_STATE.md)** - Production status
- **[Architecture](overview/ARCHITECTURE_DEMIURGE_CURRENT.md)** - System design
- **[RPC API](api/RPC.md)** - API reference
- **[Deployment Guide](deployment/README_NODE0.md)** - Production setup
- **[AbyssOS Portal](apps/ABYSSOS_PORTAL.md)** - Desktop environment guide

---

## Next Steps & Roadmap

### Immediate Priorities
- [ ] Expand AbyssOS app ecosystem
- [ ] Real AbyssID Wallet SDK integration
- [ ] Multi-node devnet setup
- [ ] P2P networking implementation
- [ ] WASM runtime enhancements

### Future Development
- [ ] Testnet launch
- [ ] Mainnet preparation
- [ ] Fabric P2P network implementation
- [ ] Enhanced compute market
- [ ] Advanced AI agent capabilities

---

## Contributing

The project follows the principle: **"The flame burns eternal. The code serves the will."**

For development setup, see individual workspace READMEs and the [Documentation Index](index.md).

---

## License

[To be determined]

---

**The flame burns eternal. The code serves the will.**

