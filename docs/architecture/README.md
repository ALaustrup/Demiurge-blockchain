# Demiurge Architecture

Technical architecture overview of the Demiurge Protocol.

---

## System Overview

```
                    ┌─────────────────────────────────────┐
                    │         DEMIURGE PROTOCOL           │
                    │     (The Sovereign Substrate)       │
                    └─────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│  CONSENSUS    │          │   RUNTIME     │          │   NETWORK     │
│  PoS + BFT    │◀────────▶│   Modules     │◀────────▶│   LibP2P      │
└───────────────┘          └───────────────┘          └───────────────┘
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│   STORAGE     │          │     RPC       │          │   CLIENTS     │
│   RocksDB     │          │  JSON-RPC 2.0 │          │  SDK/CLI/Web  │
└───────────────┘          └───────────────┘          └───────────────┘
```

---

## Core Components

### 1. Consensus Engine
**Location:** `framework/consensus/`

Hybrid Proof-of-Stake with Byzantine Fault Tolerance:
- Block time: ~6 seconds
- Instant finality via BFT
- Validator staking and slashing
- Modular consensus (hot-swappable)

See [Consensus](./consensus.md) for details.

### 2. Runtime Engine
**Location:** `framework/core/`

Transaction execution and state management:
- Block production and validation
- Transaction pool management
- Module dispatch system
- Interior mutability pattern for storage

### 3. Storage Layer
**Location:** `framework/storage/`

Persistent state with cryptographic verification:
- RocksDB backend
- Merkle tree state roots
- Prefix-based key organization
- Atomic commits with rollback

### 4. Network Layer
**Location:** `framework/network/`

Peer-to-peer communication:
- LibP2P-based networking
- Gossipsub for block/transaction propagation
- Kademlia for peer discovery
- Transaction pool synchronization

See [Network](./network.md) for details.

### 5. RPC Layer
**Location:** `framework/rpc/`

External API interface:
- JSON-RPC 2.0 over HTTP/WebSocket
- 22+ verified methods
- Async handlers with `jsonrpsee`
- Subscription support

---

## Module System

Runtime modules provide domain-specific functionality:

| Module | Purpose | Storage Prefix |
|--------|---------|----------------|
| `balances` | CGT token transfers | `Balances:` |
| `energy` | Feeless transaction system | `Energy:` |
| `drc369` | Dynamic NFTs with physics | `DRC369:` |
| `session-keys` | Temporary authorization | `SessionKeys:` |
| `cvp` | Security mutations | `CVP:` |
| `agentic` | AI agent system | `Agentic:` |
| `zk` | Zero-knowledge proofs | `ZK:` |

See [Modules](./modules.md) for details.

---

## Data Flow

### Transaction Lifecycle

```
1. Client → RPC: Submit transaction
2. RPC → Pool: Validate and queue
3. Pool → Consensus: Include in block
4. Consensus → Runtime: Execute transaction
5. Runtime → Storage: Update state
6. Consensus → Network: Broadcast block
7. Network → Peers: Propagate
```

### Block Production

```
1. Consensus: Select block author (round-robin)
2. Author: Collect transactions from pool
3. Author: Execute transactions
4. Author: Compute state root
5. Author: Sign and broadcast block
6. Validators: Verify and vote
7. Finality: 2/3 votes = finalized
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Language | Rust | Core blockchain |
| Storage | RocksDB | Persistent state |
| Network | LibP2P | P2P communication |
| Crypto | ed25519-dalek | Signatures |
| RPC | jsonrpsee | API server |
| Hashing | Blake2b | State hashing |
| Encoding | parity-scale-codec | Serialization |

---

## Security Architecture

### CVP (Consensus-Verified Polymorphism)
Runtime bytecode mutation for exploit resistance:
- Code morphing every epoch
- ZK equivalence proofs
- Attack pattern detection
- Emergency mutation triggers

### Storage Security
- Merkle proofs for all state
- Atomic transactions
- Rollback on failure
- Interior mutability with locks

### Network Security
- Peer authentication
- Message signing
- Rate limiting
- Eclipse attack resistance

---

## Scalability

### Current Metrics
- Block time: 6 seconds
- TPS capacity: 500-1,000
- State size: ~4MB/hour growth
- Memory usage: 150-200MB per validator

### Future: Elastic Sharding
- Dynamic shard split/merge
- Cross-shard messaging
- Key-range partitioning
- Zero-downtime scaling

---

## Directory Structure

```
framework/
├── core/              # Runtime engine
│   ├── src/
│   │   ├── lib.rs        # Public API
│   │   ├── runtime.rs    # Block execution
│   │   ├── block.rs      # Block types
│   │   └── transaction.rs # Transaction types
│   └── Cargo.toml
│
├── consensus/         # Consensus mechanism
│   ├── src/
│   │   ├── lib.rs        # Public API
│   │   ├── engine.rs     # Consensus engine
│   │   ├── validator.rs  # Validator logic
│   │   ├── staking.rs    # Stake management
│   │   └── slashing.rs   # Penalty logic
│   └── Cargo.toml
│
├── network/           # P2P networking
│   ├── src/
│   │   ├── lib.rs        # Public API
│   │   ├── service.rs    # Network service
│   │   ├── swarm.rs      # LibP2P swarm
│   │   ├── protocol.rs   # Wire protocol
│   │   └── pool.rs       # Transaction pool
│   └── Cargo.toml
│
├── storage/           # State storage
│   ├── src/
│   │   ├── lib.rs        # Public API
│   │   ├── backend.rs    # RocksDB backend
│   │   └── merkle.rs     # Merkle trees
│   └── Cargo.toml
│
├── rpc/               # RPC server
│   ├── src/
│   │   ├── lib.rs        # Public API
│   │   ├── server.rs     # Method registration
│   │   ├── methods.rs    # RPC implementations
│   │   └── subscriptions.rs # WebSocket subs
│   └── Cargo.toml
│
├── modules/           # Runtime modules
│   ├── balances/
│   ├── energy/
│   ├── drc369/
│   ├── session-keys/
│   ├── cvp/
│   ├── agentic/
│   └── zk/
│
└── node/              # Full node binary
    ├── src/
    │   ├── main.rs       # Entry point
    │   └── service.rs    # Node service
    └── Cargo.toml
```

---

## Further Reading

- [Consensus](./consensus.md) - Detailed consensus mechanism
- [Modules](./modules.md) - Module system deep dive
- [Network](./network.md) - P2P networking details
- [RPC Reference](../developers/rpc-reference.md) - API documentation
