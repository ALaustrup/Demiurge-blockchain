# Demiurge Chain - Current Architecture

This document summarizes the existing Demiurge L1 blockchain implementation as of the current state. It describes only what already exists, without proposing changes.

**Last Updated**: January 5, 2026  
**Production Status**: 
- Node0: Live at 51.210.209.112
- RPC: https://rpc.demiurge.cloud/rpc (HTTPS)
- AbyssOS: https://demiurge.cloud (HTTPS)

## Directory Layout

```
chain/
├── Cargo.toml          # Chain crate dependencies
├── src/
│   ├── main.rs         # Node entry point (JSON-RPC server on :8545)
│   ├── config.rs       # Configuration constants (genesis addresses, faucet amounts)
│   ├── node.rs         # Node structure (state, mempool, height tracking)
│   ├── rpc.rs          # JSON-RPC server implementation (Axum)
│   ├── forge.rs        # Proof-of-Work (Forge) implementation
│   ├── core/
│   │   ├── mod.rs
│   │   ├── block.rs    # Block structure (header + body)
│   │   ├── state.rs    # State management (in-memory & RocksDB backends)
│   │   └── transaction.rs  # Transaction structure (module_id, call_id, payload)
│   └── runtime/
│       ├── mod.rs      # Runtime module registry and dispatch
│       ├── bank_cgt.rs # CGT token module (balances, transfers, minting)
│       ├── abyss_registry.rs
│       ├── urgeid_registry.rs
│       ├── nft_dgen.rs
│       ├── fabric_manager.rs
│       ├── developer_registry.rs
│       ├── dev_capsules.rs
│       └── recursion_registry.rs
```

## Main Components

### 1. P2P Networking
- **Status**: Not yet implemented in the current codebase
- **Placeholder**: Architecture supports future P2P integration

### 2. Consensus
- **Forge PoW**: Implemented in `forge.rs`
  - Difficulty-based proof-of-work
  - Block header verification
  - Nonce mining support
- **Block Structure**: Defined in `core/block.rs`
  - Header: height, prev_hash, state_root, timestamp, difficulty_target, nonce
  - Body: vector of transactions

### 3. WASM Runtime
- **Status**: Not yet implemented
- **Current Runtime**: Native Rust modules implementing `RuntimeModule` trait
- **Module System**: Extensible via trait-based dispatch

### 4. Transaction Encoding
- **Location**: `core/transaction.rs`
- **Structure**:
  ```rust
  pub struct Transaction {
      pub from: Address,        // 32-byte address
      pub nonce: u64,           // Replay protection
      pub module_id: String,    // e.g., "bank_cgt"
      pub call_id: String,      // e.g., "transfer"
      pub payload: Vec<u8>,     // Bincode-serialized parameters
      pub fee: u64,             // Transaction fee
      pub signature: Vec<u8>,   // Signature (placeholder)
  }
  ```
- **Serialization**: Bincode for wire format
- **Hash**: SHA-256 of serialized transaction

### 5. RPC Layer
- **Framework**: Axum (async HTTP server)
- **Protocol**: JSON-RPC 2.0
- **Port**: 8545 (default)
- **Endpoints** (existing):
  - `cgt_getChainInfo`: Get chain height
  - `cgt_getBalance`: Get CGT balance by address
  - `cgt_sendRawTransaction`: Submit transaction
  - `cgt_isArchon`: Check Archon status
  - `cgt_getNftsByOwner`: Get NFTs by owner
  - `cgt_getListing`: Get marketplace listing
  - `cgt_getFabricAsset`: Get Fabric asset
  - Various UrgeID, Developer, DevCapsule, Recursion endpoints

## Runtime Module System

### Module Trait
All runtime modules implement `RuntimeModule`:
```rust
pub trait RuntimeModule: Send + Sync {
    fn module_id(&self) -> &'static str;
    fn dispatch(&self, call_id: &str, tx: &Transaction, state: &mut State) -> Result<(), String>;
}
```

### Registered Modules
Currently registered in `Runtime::with_default_modules()`:
1. **BankCgtModule** (`bank_cgt`)
   - `transfer`: Transfer CGT between addresses
   - `mint_to`: Mint CGT (genesis authority only)
   - Functions: `get_balance_cgt`, `cgt_mint_to`, `cgt_burn_from`
   - Constants: `CGT_MAX_SUPPLY`, `CGT_DECIMALS`, `CGT_SYMBOL`

2. **UrgeIDRegistryModule** (`urgeid_registry`)
   - Profile management, username/handle resolution
   - Archon status tracking

3. **NftDgenModule** (`nft_dgen`)
   - D-GEN NFT minting and ownership

4. **FabricManagerModule** (`fabric_manager`)
   - Fabric asset management

5. **AbyssRegistryModule** (`abyss_registry`)
   - Marketplace listings

6. **DeveloperRegistryModule** (`developer_registry`)
   - Developer profiles and projects

7. **DevCapsulesModule** (`dev_capsules`)
   - Development capsule management

8. **RecursionRegistryModule** (`recursion_registry`)
   - Recursion world management

## State Management

### Storage Backend
- **In-Memory**: For testing (`State::in_memory()`)
- **RocksDB**: For production (`State::open_rocksdb(path)`)
- **Abstraction**: `KvBackend` trait allows pluggable backends

### State Keys
- Balance: `bank:balance:{address}`
- Nonce: `bank:nonce:{address}`
- Total Supply: `bank_cgt/total_supply`
- Transactions: `tx:{hash}`
- Genesis Flag: `demiurge/genesis_initialized`

## Block/Transaction Flow

1. **Transaction Submission**: Via `Node::submit_transaction()`
   - Transaction is hashed and stored
   - In dev mode, executed immediately
   - Added to mempool

2. **Block Execution**: Via `State::execute_block()`
   - Verifies Forge PoW
   - Dispatches each transaction to appropriate module
   - Updates state

3. **Genesis Initialization**: Via `init_genesis_state()`
   - Runs automatically on first node start
   - Mints CGT to Genesis Archon address
   - Marks Genesis Archon as Archon
   - Sets initialization flag

## Configuration

### Current Approach
- **Hardcoded Constants**: In `config.rs`
  - `GENESIS_ARCHON_ADDRESS`: `[0xaa; 32]`
  - `GENESIS_ARCHON_INITIAL_BALANCE`: 1M CGT
  - `DEV_FAUCET_AMOUNT`: 10K CGT (debug only)

### Node Startup
- **DB Path**: `.demiurge/data` (default)
- **RPC Address**: `127.0.0.1:8545`
- **Genesis**: Auto-initialized on first run

## Current Limitations

1. **No Config Files**: Genesis and node configs are hardcoded
2. **No P2P**: Single-node operation only
3. **No Block Persistence**: Blocks are not stored (stub implementation)
4. **No Chain Selection**: No fork resolution logic
5. **Dev Mode Execution**: Transactions execute immediately (not via blocks)
6. **No WASM**: Native Rust modules only

## Testing

- Unit tests in module files (e.g., `bank_cgt.rs` has tests)
- In-memory state for test isolation
- Test patterns: `#[cfg(test)]` modules

---

**Note**: This document reflects the state of the codebase as of the current implementation. Future changes will be documented separately.

