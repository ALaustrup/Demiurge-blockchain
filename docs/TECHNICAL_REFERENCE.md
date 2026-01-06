# Demiurge Blockchain - Complete Technical Reference

> **For LLM Development Assistance**  
> This document provides comprehensive technical information about the Demiurge codebase to assist LLMs in understanding and developing the system.

**Last Updated**: January 5, 2026  
**Repository**: DEMIURGE  
**Status**: Production (Live at https://demiurge.cloud)

---

## Table of Contents

1. [Tech Stack Overview](#tech-stack-overview)
2. [Repository Structure](#repository-structure)
3. [Core Architecture](#core-architecture)
4. [Runtime Modules](#runtime-modules)
5. [RPC API Reference](#rpc-api-reference)
6. [State Management](#state-management)
7. [Transaction System](#transaction-system)
8. [Consensus & Mining](#consensus--mining)
9. [Build System](#build-system)
10. [Development Workflows](#development-workflows)
11. [Key Concepts & Patterns](#key-concepts--patterns)
12. [Dependencies](#dependencies)
13. [Configuration](#configuration)
14. [Testing](#testing)

---

## Tech Stack Overview

### Blockchain Core (Rust)
- **Language**: Rust (Edition 2021)
- **Runtime**: Tokio (async runtime)
- **HTTP Server**: Axum 0.8
- **Database**: RocksDB 0.22
- **Serialization**: Bincode, Serde
- **Cryptography**: Ed25519-dalek, SHA-256, Argon2
- **Logging**: Tracing + tracing-subscriber

### Frontend Applications

#### AbyssOS Portal (Production)
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.5.3
- **Build Tool**: Vite 5.4.21
- **Styling**: Tailwind CSS 3.4.4
- **State Management**: Zustand 4.5.0
- **Animations**: Framer Motion 11.0.8
- **Crypto**: @noble/curves, @noble/hashes

#### Portal Web (Legacy)
- **Framework**: Next.js 16.0.7
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4
- **Crypto**: @noble/ed25519, @noble/hashes

### Backend Services

#### AbyssID Service
- **Runtime**: Node.js 20+
- **Framework**: Express
- **Database**: SQLite
- **Validation**: Zod
- **Crypto**: @noble/curves, @noble/hashes

#### DNS Service
- **Runtime**: Node.js 20+
- **Framework**: Express
- **Database**: SQLite
- **DNS**: Unbound integration

#### Abyss Gateway (GraphQL)
- **Runtime**: Node.js 20+
- **Framework**: GraphQL
- **Purpose**: Block indexing and GraphQL API

### Package Management
- **Node.js**: pnpm 9.15.0 (workspace-based)
- **Rust**: Cargo (workspace-based)
- **Build System**: Turbo (monorepo orchestration)

### Infrastructure
- **Web Server**: Nginx
- **SSL**: Let's Encrypt
- **Process Manager**: systemd
- **Containerization**: Docker

---

## Repository Structure

```
DEMIURGE/
├── chain/                          # Rust L1 blockchain node
│   ├── Cargo.toml                  # Chain crate dependencies
│   ├── src/
│   │   ├── main.rs                 # Entry point, RPC server initialization
│   │   ├── node.rs                 # Node state management, mempool, height
│   │   ├── rpc.rs                  # JSON-RPC 2.0 implementation (3000+ lines)
│   │   ├── forge.rs                # Proof-of-Work (Forge) implementation
│   │   ├── config.rs               # Configuration constants
│   │   ├── config_loader.rs        # TOML config loading
│   │   ├── core/                   # Core blockchain types
│   │   │   ├── block.rs            # BlockHeader, Block structures
│   │   │   ├── transaction.rs      # Transaction structure and serialization
│   │   │   ├── state.rs            # State management (RocksDB/InMemory)
│   │   │   ├── archon/            # Archon cognitive system
│   │   │   ├── evolution/         # System evolution engine
│   │   │   ├── forecasting/       # Future simulation
│   │   │   ├── intentions/        # Intent classification and resolution
│   │   │   ├── memory/            # Memory systems
│   │   │   ├── meta/              # Meta-cognitive systems
│   │   │   └── noosphere/         # Global consciousness layer
│   │   ├── runtime/               # Runtime modules (implemented)
│   │   │   ├── mod.rs             # Runtime registry and dispatch
│   │   │   ├── bank_cgt.rs        # CGT token operations
│   │   │   ├── urgeid_registry.rs # Identity system
│   │   │   ├── nft_dgen.rs        # D-GEN NFT standard
│   │   │   ├── abyss_registry.rs  # Marketplace
│   │   │   ├── fabric_manager.rs  # P2P network management
│   │   │   ├── developer_registry.rs # Developer profiles
│   │   │   ├── dev_capsules.rs    # Development capsules
│   │   │   ├── recursion_registry.rs # Recursion worlds
│   │   │   ├── work_claim.rs      # Work-claim mining
│   │   │   └── version.rs         # Runtime version integrity
│   │   ├── archon/                # Archon daemon and state
│   │   ├── consensus/             # Consensus mechanisms
│   │   ├── governance/            # Governance systems
│   │   └── [many advanced subsystems]
│   └── configs/                   # Node configuration files
│       └── node.devnet.toml        # Devnet configuration
│
├── apps/
│   ├── abyssos-portal/            # ⭐ Production desktop environment
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── src/                   # React components, stores, services
│   ├── portal-web/                # Legacy Next.js portal
│   ├── abyssid-service/           # Identity backend service
│   ├── abyssid-backend/           # AbyssID backend
│   ├── dns-service/               # DNS resolution service
│   ├── desktop/                   # QML desktop app
│   └── desktop-qt/                # Qt Widgets desktop app
│
├── indexer/
│   ├── abyss-gateway/             # GraphQL gateway + block indexer
│   │   ├── package.json
│   │   └── src/                   # GraphQL schema, resolvers, indexing
│   └── ingestor-rs/               # Rust block ingestor
│       ├── Cargo.toml
│       └── src/                   # Block drift detection, canonical chain
│
├── sdk/
│   ├── rust-sdk/                  # Rust SDK for Demiurge
│   │   ├── Cargo.toml
│   │   └── src/                   # Client, types, signing, modules
│   ├── ts-sdk/                    # TypeScript SDK
│   │   ├── package.json
│   │   └── src/                   # Client, types, signing, modules
│   └── schema/                    # JSON schemas (AbyssID, DRC-369, etc.)
│
├── cli/                           # Command-line tools
│   ├── Cargo.toml
│   └── src/                       # Keygen, utilities
│
├── deploy/                        # Deployment scripts
│   ├── node0/                     # Node0 deployment automation
│   ├── systemd/                   # systemd service files
│   └── nginx/                     # Nginx configurations
│
├── docker/                        # Dockerfiles
├── scripts/                       # Operational scripts
├── docs/                          # Comprehensive documentation
├── other/                         # Legacy code
│   └── legacy-runtime-stubs/      # Superseded placeholder crates
│
├── Cargo.toml                     # Rust workspace definition
├── package.json                   # Root package.json (pnpm workspace)
├── pnpm-workspace.yaml            # pnpm workspace config
├── turbo.json                     # Turbo build config
└── start-all.ps1                  # Start all services script
```

---

## Core Architecture

### Blockchain Node (`chain/`)

The Demiurge chain is a sovereign L1 blockchain with:

1. **Custom Proof-of-Work**: "Forge" uses Argon2id + SHA-256
2. **Modular Runtime**: Extensible runtime module system
3. **JSON-RPC 2.0**: HTTP API for interaction
4. **RocksDB Persistence**: Persistent state storage
5. **Ed25519 Signing**: Transaction signature verification

### Node Structure (`chain/src/node.rs`)

```rust
pub struct Node {
    state: Arc<Mutex<State>>,              // Thread-safe state
    db_path: PathBuf,                      // RocksDB path
    mempool: Arc<Mutex<Vec<Transaction>>>, // Pending transactions
    height: Arc<Mutex<u64>>,               // Current chain height
    archon_last_state: Arc<RwLock<ArchonStateVector>>, // Archon state
}
```

### State Management (`chain/src/core/state.rs`)

**Backend Abstraction**:
- `KvBackend` trait for pluggable storage
- `InMemoryBackend` for testing (HashMap-based)
- `RocksDbBackend` for production (RocksDB)

**State Operations**:
- `get_raw(key)` - Get value by key
- `put_raw(key, value)` - Set key-value pair
- `execute_block(block)` - Execute block transactions

**Storage Keys**:
- `bank:balance:{address}` - CGT balance
- `bank:nonce:{address}` - Transaction nonce
- `bank_cgt/total_supply` - Total CGT supply
- `urgeid:profile:{address}` - UrgeID profile
- `nft:{nft_id}` - NFT metadata
- `tx:{hash}` - Transaction storage

### Block Structure (`chain/src/core/block.rs`)

```rust
pub struct BlockHeader {
    pub height: u64,                    // Block height
    pub prev_hash: [u8; 32],            // Previous block hash
    pub state_root: [u8; 32],          // State Merkle root
    pub timestamp: u64,                 // Unix timestamp
    pub difficulty_target: u128,        // PoW difficulty
    pub nonce: u64,                     // PoW solution
}

pub struct Block {
    pub header: BlockHeader,
    pub body: Vec<Transaction>,
}
```

### Transaction Structure (`chain/src/core/transaction.rs`)

```rust
pub struct Transaction {
    pub from: Address,                  // 32-byte sender address
    pub nonce: u64,                     // Replay protection
    pub module_id: String,               // e.g., "bank_cgt"
    pub call_id: String,                // e.g., "transfer"
    pub payload: Vec<u8>,               // Bincode-serialized params
    pub fee: u64,                       // Transaction fee (CGT)
    pub signature: Vec<u8>,             // Ed25519 signature
}

pub type Address = [u8; 32];
pub type Signature = Vec<u8>;
```

**Transaction Methods**:
- `to_bytes()` - Serialize transaction
- `from_bytes(bytes)` - Deserialize transaction
- `hash()` - Compute SHA-256 hash
- `serialize_for_signing()` - Serialize without signature for signing

---

## Runtime Modules

All runtime modules implement the `RuntimeModule` trait:

```rust
pub trait RuntimeModule: Send + Sync {
    fn module_id(&self) -> &'static str;
    fn dispatch(&self, call_id: &str, tx: &Transaction, state: &mut State) -> Result<(), String>;
}
```

### Registered Modules (in order)

1. **BankCgtModule** (`bank_cgt`)
   - **Functions**: `get_balance_cgt`, `cgt_mint_to`, `cgt_burn_from`, `get_cgt_total_supply`, `get_nonce_cgt`
   - **Calls**: `transfer`, `mint_to`
   - **Constants**: `CGT_MAX_SUPPLY` (1B * 10^8), `CGT_DECIMALS` (8), `CGT_SYMBOL` ("CGT")

2. **UrgeIDRegistryModule** (`urgeid_registry`)
   - **Functions**: `create_urgeid_profile`, `get_urgeid_profile`, `set_username`, `set_handle`, `is_archon`, `record_syzygy`, `get_address_by_username`, `get_address_by_handle`
   - **Calls**: `create_profile`, `set_username`, `set_handle`, `record_syzygy`
   - **Profile Structure**: `UrgeIDProfile` with username, handle, display_name, bio, syzygy_score, level, badges, role

3. **NftDgenModule** (`nft_dgen`)
   - **Functions**: `get_nft`, `get_nfts_by_owner`, `system_mint_dev_nft`
   - **Calls**: `mint_dgen`, `transfer_nft`
   - **NFT Classes**: `Art`, `Audio`, `GameItem`, `World`, `Plugin`, `CodeModule`, `DevBadge`

4. **FabricManagerModule** (`fabric_manager`)
   - **Functions**: `get_fabric_asset`
   - **Calls**: `register_fabric_asset`, `reward_seeder`
   - **Purpose**: P2P content-addressed network management

5. **AbyssRegistryModule** (`abyss_registry`)
   - **Functions**: `get_listing`, `get_all_active_listings`
   - **Calls**: `create_listing`, `cancel_listing`, `buy_listing`
   - **Purpose**: NFT marketplace and listings

6. **DeveloperRegistryModule** (`developer_registry`)
   - **Functions**: `register_developer`, `get_developer_profile`, `get_developer_by_username`, `get_all_developers`, `add_project`, `get_project_maintainers`
   - **Calls**: `register`, `add_project`
   - **Purpose**: Developer profiles and project management

7. **DevCapsulesModule** (`dev_capsules`)
   - **Functions**: `create_capsule`, `get_capsule`, `list_capsules_by_owner`, `list_capsules_by_project`, `update_capsule_status`, `update_capsule_notes`
   - **Calls**: `create`, `update_status`, `update_notes`
   - **Status**: `Draft`, `Active`, `Archived`, `Deprecated`

8. **RecursionRegistryModule** (`recursion_registry`)
   - **Functions**: `create_world`, `get_world`, `list_worlds_by_owner`
   - **Calls**: `create_world`
   - **Purpose**: Recursive computation world registry

9. **WorkClaimModule** (`work_claim`)
   - **Functions**: `calculate_reward`
   - **Calls**: `submit`
   - **Purpose**: Work-claim mining rewards (e.g., Mandelbrot game)
   - **Reward Formula**: `(depth_metric * DEPTH_FACTOR + (active_ms / 1000.0) * TIME_FACTOR).min(MAX_REWARD_PER_CLAIM)`
   - **Constants**: `DEPTH_FACTOR` (100.0), `TIME_FACTOR` (0.1), `MAX_REWARD_PER_CLAIM` (1M CGT)

### Runtime Registration

Modules are registered deterministically in `Runtime::with_default_modules()`:
- Order is enforced by `version.rs` integrity checks
- `RUNTIME_VERSION` constant tracks version
- Module count and IDs are verified at runtime

---

## RPC API Reference

### Endpoint
- **URL**: `http://127.0.0.1:8545/rpc` (default)
- **Protocol**: JSON-RPC 2.0
- **Content-Type**: `application/json`
- **CORS**: Enabled

### Request Format
```json
{
  "jsonrpc": "2.0",
  "method": "method_name",
  "params": { ... },
  "id": 1
}
```

### Core Methods

#### `cgt_getChainInfo`
Get current chain status.

**Response**:
```json
{
  "jsonrpc": "2.0",
  "result": { "height": 12345 },
  "id": 1
}
```

#### `cgt_getBalance`
Get CGT balance for an address.

**Params**:
```json
{ "address": "hex-encoded-32-byte-address" }
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "result": { "balance": "100000000000000" },
  "id": 1
}
```

#### `cgt_sendRawTransaction`
Submit a signed transaction.

**Params**:
```json
{
  "tx": "hex-encoded-transaction-bytes"
}
```

#### `cgt_getTransactionsByAddress`
Get transaction history for an address.

**Params**:
```json
{
  "address": "hex-encoded-address",
  "limit": 100
}
```

### UrgeID Methods

- `cgt_isArchon` - Check Archon status
- `cgt_getUrgeIDProfile` - Get UrgeID profile
- `cgt_getAddressByUsername` - Resolve username to address
- `cgt_getAddressByHandle` - Resolve handle to address
- `cgt_createUrgeIDProfile` - Create new profile
- `cgt_setUsername` - Set username
- `cgt_setHandle` - Set handle
- `cgt_recordSyzygy` - Record Syzygy contribution

### NFT Methods

- `cgt_getNft` - Get NFT by ID
- `cgt_getNftsByOwner` - List NFTs owned by address
- `cgt_mintDgen` - Mint D-GEN NFT (Archon only)

### Marketplace Methods

- `cgt_getListing` - Get marketplace listing
- `cgt_getAllActiveListings` - List all active listings
- `cgt_createListing` - Create NFT listing
- `cgt_buyListing` - Purchase NFT from listing

### Developer Methods

- `cgt_registerDeveloper` - Register developer
- `cgt_getDeveloperProfile` - Get developer profile
- `cgt_getDeveloperByUsername` - Get developer by username
- `cgt_getAllDevelopers` - List all developers
- `cgt_addProject` - Add project to developer

### Dev Capsules Methods

- `cgt_createCapsule` - Create dev capsule
- `cgt_getCapsule` - Get capsule by ID
- `cgt_listCapsulesByOwner` - List capsules by owner
- `cgt_listCapsulesByProject` - List capsules by project
- `cgt_updateCapsuleStatus` - Update capsule status
- `cgt_updateCapsuleNotes` - Update capsule notes

### Recursion Methods

- `cgt_createWorld` - Create recursion world
- `cgt_getWorld` - Get world by ID
- `cgt_listWorldsByOwner` - List worlds by owner

### Work Claim Methods

- `submitWorkClaim` - Submit work claim for mining rewards

**Params**:
```json
{
  "address": "hex-encoded-address",
  "game_id": "mandelbrot",
  "session_id": "unique-session-id",
  "depth_metric": 10.5,
  "active_ms": 5000,
  "extra": "optional-metadata"
}
```

### Network Methods

- `getNetworkInfo` - Get network information

**Response**:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "chain_id": 77701,
    "name": "Demiurge Devnet",
    "height": 12345
  },
  "id": 1
}
```

### Archon Methods

- `cgt_getArchonStateVector` - Get current Archon State Vector
- `cgt_getArchonIdentity` - Get Archon identity information

---

## Consensus & Mining

### Forge Proof-of-Work (`chain/src/forge.rs`)

**Algorithm**: Argon2id (memory-hard) + SHA-256

**Process**:
1. Serialize block header (without nonce)
2. Combine header bytes + nonce
3. Run Argon2id with configurable parameters
4. Hash Argon2id output with SHA-256
5. Check if hash meets difficulty target

**Configuration** (`ForgeConfig`):
- `memory_kib`: 16 * 1024 (16 MiB per attempt)
- `time_cost`: 3 iterations
- `lanes`: 1 (parallelism)

**Difficulty Check**:
- First 16 bytes of hash interpreted as big-endian u128
- Hash meets difficulty if value <= `difficulty_target`

**Functions**:
- `forge_hash(header_bytes, nonce, config)` - Compute Forge hash
- `meets_difficulty(hash, target)` - Check if hash meets target

---

## Build System

### Rust Workspace (`Cargo.toml`)

**Members**:
- `chain` - Main blockchain node
- `indexer/ingestor-rs` - Block ingestor
- `sdk/rust-sdk` - Rust SDK
- `cli` - CLI tools

**Build Commands**:
```bash
cargo build                    # Debug build
cargo build --release          # Release build
cargo check                    # Check without building
cargo test                     # Run tests
cargo run -p demiurge-chain    # Run chain node
```

### Node.js Workspace (`pnpm-workspace.yaml`)

**Packages**:
- `apps/*` - All apps
- `indexer/abyss-gateway` - GraphQL gateway
- `sdk/ts-sdk` - TypeScript SDK

**Build Commands**:
```bash
pnpm install                   # Install dependencies
pnpm build                     # Build all packages (via Turbo)
pnpm dev                       # Start dev servers (via Turbo)
pnpm run start:all            # Start all services (PowerShell script)
```

### Turbo Configuration (`turbo.json`)

**Tasks**:
- `build` - Build with dependencies
- `dev` - Development mode (persistent, no cache)
- `lint` - Linting
- `clean` - Clean build artifacts

---

## Development Workflows

### Starting the Chain Node

**Default (no config)**:
```bash
cargo run --release -p demiurge-chain
# Uses: .demiurge/data, http://0.0.0.0:8545
```

**With Config**:
```bash
# Config priority:
# 1. /opt/demiurge/configs/node.toml (production)
# 2. ./configs/node.devnet.toml (devnet)
# 3. Defaults (fallback)
```

### Starting All Services

**PowerShell**:
```powershell
.\start-all.ps1
```

**Starts**:
1. Demiurge Chain (RPC on :8545)
2. Abyss Gateway (GraphQL on :4000)
3. Portal Web (Next.js on :3000)

### Development Mode

**AbyssOS Portal**:
```bash
cd apps/abyssos-portal
pnpm install
pnpm dev  # Vite dev server
```

**Portal Web**:
```bash
cd apps/portal-web
pnpm install
pnpm dev  # Next.js dev server
```

### Testing

**Rust Tests**:
```bash
cargo test                     # All tests
cargo test -p demiurge-chain  # Chain tests only
```

**TypeScript Tests**:
```bash
pnpm test                      # Run all tests
```

---

## Key Concepts & Patterns

### Address Format
- **Type**: `[u8; 32]` (32-byte array)
- **Display**: Hex-encoded (64 hex characters)
- **Usage**: Wallet addresses, identity addresses, NFT owners

### CGT Token
- **Name**: Creator God Token
- **Symbol**: CGT
- **Decimals**: 8
- **Max Supply**: 369,000,000,000 CGT (369 billion)
- **Storage**: `u128` in smallest units (10^-8 precision)
- **RPC Returns**: String to avoid JavaScript number overflow

### UrgeID System
- **Single Identity**: One Ed25519 keypair = wallet + identity
- **Profile**: Username, handle (@username), display_name, bio, syzygy_score, level, badges
- **Roles**: UrgeID User (default), Archon (creator status)
- **Syzygy**: Contribution score for seeding/serving content
- **Leveling**: Automatic level-ups based on Syzygy thresholds

### Archon Status
- **Meaning**: Creator status ("ascended" users)
- **Capabilities**: 
  - Upload to Fabric with revenue hooks
  - Mint D-GEN NFTs
  - List and sell in Abyss marketplace
  - Earn CGT via Fabric seeding and Forge compute

### D-GEN NFT Standard
- **Format**: D-721 (flexible NFT standard)
- **Classes**: Art, Audio, GameItem, World, Plugin, CodeModule, DevBadge
- **Metadata**: fabric_root_hash, royalties, provenance, transfers
- **Storage**: On-chain metadata with off-chain content (Fabric)

### Transaction Flow
1. **Create**: Client creates transaction with module_id, call_id, payload
2. **Sign**: Client signs with Ed25519 private key
3. **Submit**: Send via `cgt_sendRawTransaction` RPC
4. **Mempool**: Transaction added to mempool
5. **Execution**: Transaction executed immediately (dev mode) or in block
6. **State Update**: Runtime module updates state

### State Storage Pattern
- **Key Prefixes**: Module-specific prefixes (e.g., `bank:balance:`, `urgeid:profile:`)
- **Serialization**: Bincode for Rust types
- **Access**: Via `State::get_raw()` / `State::put_raw()`
- **Thread Safety**: `Arc<Mutex<State>>` for concurrent access

### Runtime Module Pattern
1. **Module Struct**: Implements `RuntimeModule` trait
2. **Module ID**: Static string identifier
3. **Dispatch**: Routes `call_id` to handler function
4. **State Access**: Mutable `State` reference for reads/writes
5. **Error Handling**: Returns `Result<(), String>`

---

## Dependencies

### Rust (chain/Cargo.toml)

**Core**:
- `serde` (derive) - Serialization
- `serde_json` - JSON handling
- `bincode` - Binary serialization
- `anyhow` - Error handling
- `thiserror` - Error types

**Storage**:
- `rocksdb` - Persistent key-value store

**Async**:
- `tokio` (full) - Async runtime

**HTTP**:
- `axum` (json) - HTTP server framework
- `tower` - Middleware
- `tower-http` (cors) - CORS middleware

**Crypto**:
- `ed25519-dalek` (rand_core) - Ed25519 signatures
- `sha2` - SHA-256 hashing
- `argon2` - Argon2id PoW

**Utilities**:
- `hex` - Hex encoding/decoding
- `log` - Logging facade
- `tracing` - Structured logging
- `tracing-subscriber` - Logging subscriber
- `toml` - TOML parsing
- `rand` - Random number generation

### TypeScript (apps/abyssos-portal/package.json)

**Core**:
- `react` ^18.3.1
- `react-dom` ^18.3.1
- `typescript` ^5.5.3

**Build**:
- `vite` ^5.4.21
- `@vitejs/plugin-react` ^4.7.0

**Styling**:
- `tailwindcss` ^3.4.4
- `postcss` ^8.4.38
- `autoprefixer` ^10.4.19

**State & UI**:
- `zustand` ^4.5.0
- `framer-motion` ^11.0.8

**Crypto**:
- `@noble/curves` ^1.2.0
- `@noble/hashes` ^2.0.1

---

## Configuration

### Node Configuration (`chain/configs/node.devnet.toml`)

```toml
[node]
db_path = ".demiurge/data"
rpc_addr = "0.0.0.0:8545"

[genesis]
genesis_config = "genesis.devnet.toml"
```

### Genesis Configuration

**Genesis Archon**:
- Address: `[0xaa; 32]` (hardcoded)
- Initial Balance: 1,000,000 CGT (1M * 10^8 smallest units)

**Genesis Initialization**:
- Runs automatically on first node start
- Mints CGT to Genesis Archon
- Marks Genesis Archon as Archon
- Sets initialization flag: `demiurge/genesis_initialized`

### Environment Variables

**Logging**:
- `RUST_LOG` - Log level (e.g., `info`, `debug`, `trace`)

**Node**:
- `DEMIURGE_DB_PATH` - Override database path
- `DEMIURGE_RPC_ADDR` - Override RPC address

---

## Testing

### Rust Tests

**Unit Tests**:
- Located in `#[cfg(test)]` modules
- Use `State::in_memory()` for isolation
- Test patterns: serialization, state operations, module dispatch

**Example**:
```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_transfer() {
        let mut state = State::in_memory();
        // Test logic
    }
}
```

### Integration Tests

**RPC Tests**:
- Test JSON-RPC endpoints
- Use `cargo test --test integration`

**State Tests**:
- Test RocksDB persistence
- Test state transitions

---

## Advanced Systems

### Archon System (`chain/src/archon/`)

**Components**:
- `ArchonStateVector` - State representation
- `ArchonDaemon` - Background daemon
- `ArchonConsensus` - Consensus integration
- `ArchonCommands` - Command processing
- `ArchonDiagnostics` - Diagnostic tools

**Purpose**: Cognitive AI system integrated into blockchain

### Meta-Cognitive Systems (`chain/src/core/meta/`)

**Components**:
- `SelfModel` - Self-awareness model
- `IntrospectionMatrix` - System introspection
- `CognitiveState` - Unified cognitive state

**Purpose**: Self-observing and self-improving systems

### Evolution Engine (`chain/src/core/evolution/`)

**Components**:
- `EvolutionKernel` - Core evolution logic
- `DeltaOptimizer` - Optimization engine
- `SystemImprovementHeuristics` - Improvement rules

**Purpose**: Self-improving blockchain system

### Intent System (`chain/src/core/intentions/`)

**Components**:
- `IntentEngine` - Intent processing
- `IntentClassifier` - Intent classification
- `IntentResolver` - Intent resolution

**Purpose**: Understand and execute system intents

---

## Production Deployment

### Node0 Server
- **IP**: 51.210.209.112
- **OS**: Ubuntu 24.04
- **Service**: `demiurge-node0.service` (systemd)
- **Binary**: `/opt/demiurge/target/release/demiurge-chain`
- **Database**: `/opt/demiurge/.demiurge/data`
- **RPC**: `https://rpc.demiurge.cloud/rpc` (HTTPS, CORS)

### AbyssOS Portal
- **URL**: `https://demiurge.cloud`
- **Path**: `/var/www/abyssos-portal`
- **SSL**: Let's Encrypt (auto-renewal)

### Nginx Configuration
- **Config**: `/etc/nginx/sites-available/demiurge.cloud`
- **Domains**: `demiurge.cloud`, `www.demiurge.cloud`, `rpc.demiurge.cloud`
- **SSL**: All domains with valid certificates

---

## Key Files for LLM Reference

### Essential Reading
1. `chain/src/main.rs` - Entry point and initialization
2. `chain/src/node.rs` - Node structure and operations
3. `chain/src/rpc.rs` - All RPC endpoints (3000+ lines)
4. `chain/src/runtime/mod.rs` - Runtime module registry
5. `chain/src/core/state.rs` - State management
6. `chain/src/core/transaction.rs` - Transaction structure
7. `chain/src/core/block.rs` - Block structure
8. `chain/src/forge.rs` - Proof-of-Work implementation

### Runtime Modules
- `chain/src/runtime/bank_cgt.rs` - CGT token operations
- `chain/src/runtime/urgeid_registry.rs` - Identity system
- `chain/src/runtime/nft_dgen.rs` - NFT standard
- `chain/src/runtime/work_claim.rs` - Mining rewards

### Configuration
- `chain/configs/node.devnet.toml` - Devnet config
- `Cargo.toml` - Rust workspace
- `package.json` - Node.js workspace
- `pnpm-workspace.yaml` - pnpm workspace

---

## Common Development Tasks

### Adding a New Runtime Module

1. **Create Module File**: `chain/src/runtime/my_module.rs`
2. **Implement Trait**: `impl RuntimeModule for MyModule`
3. **Register**: Add to `chain/src/runtime/mod.rs`
4. **Add to Runtime**: Update `Runtime::with_default_modules()`
5. **Add RPC**: Add endpoints in `chain/src/rpc.rs`
6. **Update Version**: Increment `RUNTIME_VERSION` in `version.rs`

### Adding a New RPC Method

1. **Add Handler**: Add match arm in `handle_rpc()` in `rpc.rs`
2. **Add Params Struct**: Define parameter structure
3. **Implement Logic**: Call node methods or runtime functions
4. **Return Response**: Format JSON-RPC 2.0 response

### Modifying State Storage

1. **Define Keys**: Use consistent prefix pattern
2. **Serialize**: Use `bincode::serialize()` for Rust types
3. **Store**: Use `state.put_raw(key, value)`
4. **Retrieve**: Use `state.get_raw(key)` and deserialize

---

## Important Notes for LLMs

1. **Runtime Module Order**: Module registration order is enforced and must not change without version bump
2. **State Thread Safety**: State is wrapped in `Arc<Mutex<>>` for concurrent access
3. **Transaction Signing**: Transactions must be signed with Ed25519 before submission
4. **CGT Precision**: All CGT amounts are stored as `u128` in smallest units (10^-8)
5. **Address Format**: Always use `[u8; 32]` internally, hex-encode for RPC
6. **Error Handling**: Runtime modules return `Result<(), String>` for errors
7. **Genesis**: Automatically initialized on first node start
8. **Config Priority**: Production config > devnet config > defaults
9. **RPC Protocol**: Always JSON-RPC 2.0 format
10. **Build System**: Use `cargo` for Rust, `pnpm` for Node.js

---

**End of Technical Reference**

*The flame burns eternal. The code serves the will.*
