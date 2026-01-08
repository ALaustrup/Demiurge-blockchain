# Architecture Overview

DEMIURGE is a sovereign Layer 1 blockchain ecosystem for creators.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     DEMIURGE ECOSYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  DEMIURGE CHAIN (L1)                      │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │   │
│  │  │ Forge   │  │  RPC    │  │ Runtime │  │ RocksDB │      │   │
│  │  │  PoW    │  │ :8545   │  │ Modules │  │  State  │      │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │                    APPLICATIONS                            │  │
│  │  ┌─────────────┐  ┌──────┴──────┐  ┌─────────────┐        │  │
│  │  │ Portal Web  │  │   QorID   │  │   QOR OS   │        │  │
│  │  │  (Landing)  │  │   Service   │  │   Portal    │        │  │
│  │  │   :3000     │  │    :8082    │  │    :5173    │        │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Demiurge Chain (`chain/`)

The Layer 1 blockchain written in Rust.

**Key Files:**
- `main.rs` - Entry point, RPC server startup
- `node.rs` - Node state management
- `forge.rs` - Proof-of-Work consensus
- `rpc.rs` - JSON-RPC 2.0 API
- `runtime/` - All runtime modules

**Consensus:** Forge PoW (memory-hard, Argon2-based)

**Storage:** RocksDB for persistent state

### 2. Runtime Modules (`chain/src/runtime/`)

| Module | Purpose |
|--------|---------|
| `bank_cgt` | CGT token balances, transfers, minting |
| `qor_registry` | On-chain identity profiles |
| `nft_dgen` | D-GEN NFT standard |
| `fabric_manager` | P2P content delivery |
| `qor_registry_legacy` | Marketplace listings |
| `developer_registry` | Developer profiles |
| `dev_capsules` | Development environments |
| `recursion_registry` | Game world registry |
| `work_claim` | Mining reward claims |

### 3. QOR ID Service (`apps/qorid-service/`)

TypeScript backend for identity and services.

**Features:**
- User registration and authentication
- DRC-369 NFT management
- File storage (2GB per user)
- Wallet operations
- Chain signing

**Port:** 8082

### 4. Portal Web (`apps/portal-web/`)

Next.js information landing page.

**Features:**
- Project information
- "Enter the Abyss" gateway
- Documentation links

**Port:** 3000

### 5. QLOUD OS (`apps/qloud-os/`)

Full desktop environment in the browser.

**Features:**
- Boot screen with intro video
- QorID login/signup
- Window management
- Multiple built-in apps
- Chain integration

**Port:** 5173

## Data Flow

```
User → Portal Web → "Enter Abyss" → QLOUD OS
                                         │
                                         ▼
                                   QOR ID Service
                                         │
                                         ▼
                                   Demiurge Chain
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Chain | Rust, Axum, RocksDB |
| Backend | TypeScript, Express, SQLite |
| Frontend | React, Vite, Tailwind CSS |
| State | Zustand |
| Build | Turborepo, pnpm |

## Production Deployment

- **Server:** 51.210.209.112 (OVHCloud)
- **RPC:** https://rpc.demiurge.cloud/rpc
- **QOR OS:** https://demiurge.cloud
- **Target:** https://demiurge.guru

See [Deployment Guide](../deployment/NODE_SETUP.md) for setup instructions.
