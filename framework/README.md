# Demiurge Protocol Framework

**Custom blockchain framework - Zero external dependencies**

**Status:** Local-first development runtime

## Architecture

```
framework/
├── core/           # Core runtime engine
├── storage/        # RocksDB + Merkle trees
├── consensus/      # Hybrid PoS + BFT (< 2s finality)
├── network/        # LibP2P P2P networking
├── primitives/     # Cryptographic primitives (PQC, signatures)
├── rpc/            # JSON-RPC 2.0 + WebSocket
├── node/           # Full node implementation
└── modules/        # Runtime modules
    ├── balances/       # CGT token (1B treasury at Godmode)
    ├── energy/         # Feeless transactions
    ├── session-keys/   # Temporary auth + keypair login
    ├── qor-identity/   # Sovereign identity (DID) + hybrid auth
    ├── drc369/         # Stateful NFTs
    ├── game-assets/    # Multi-asset system
    ├── yield-nfts/     # Passive income NFTs
    ├── cvp/            # Consensus-Verified Polymorphism
    ├── zk/             # Zero-knowledge proofs
    └── agentic/        # AI agents (instant keys + pre-registered)
```

## Status

The framework is now documented and operated as a local-first runtime. The supported default is a
single local node running on the developer machine and exposing RPC on `localhost:9944`.

| Component | Status | Notes |
|-----------|--------|-------|
| Core Runtime | Local-first | Single-node development supported |
| Storage | Local-first | Local RocksDB data dir |
| Consensus | Local-first | 2s block time target |
| Network | Local-first | LibP2P |
| RPC | Local-first | JSON-RPC 2.0 |
| Node | Local-first | Full node |
| All Modules | Local-first | See below |

### Module Status

| Module | Status | Key Features |
|--------|--------|--------------|
| Balances | Ready locally | 1B CGT treasury at Godmode |
| QOR Identity | Ready locally | Hybrid auth (keypair + QOR ID) |
| Agentic | Ready locally | Dual patterns: instant keys + pre-registered |
| DRC-369 | Ready locally | Stateful NFTs with physics |
| CVP | Ready locally | ZK bytecode mutation |

## Quick Start

### Build

```bash
cd framework
cargo build --release
```

### Run Node

```bash
./target/release/demiurge-node \
  --data-dir ./data \
  --rpc-addr 127.0.0.1:9944 \
  --p2p-addr 127.0.0.1:30333 \
  --rpc --p2p
```

### Run Tests

```bash
cargo test --all --features "demiurge-agentic/std"
```

## Key Features

### Consensus
- Hybrid PoS + BFT
- Sub-2-second finality
- Slashing for misbehavior
- Era-based rewards
- Modular Fluidity (hot-swap mechanisms)
- Elastic Sharding (auto-scale)

### Authentication (Hybrid)
- **Keypair Authentication** - Ed25519 keypairs for direct login
- **QOR ID Login** - Human-readable identity (username#0001)
- Decentralized Identifiers (DIDs)
- Multi-key support
- Quantum-safe signatures (Dilithium3)

### NFTs (DRC-369)
- Stateful, mutable metadata
- Physics-ready properties
- Recursive royalties
- Atomic composability

### AI Agents (Agentic Layer)
- **Instant Keys** - Generate agent keypairs on-demand
- **Pre-Registered** - Use existing agent accounts
- Agent DID (sovereign identity)
- Agentic Wallet (self-custodial)
- The Forge (verifiable compute)
- Vector-State Kernel (memory)
- Sentinel Oracle (governance)

### Godmode Administration
- Treasury address: `0x00000000000000000000000000000000DEMIURGE`
- Initial treasury: 1,000,000,000 CGT
- Network governance controls
- Emergency functions

### Security
- CVP (bytecode mutation with ZK proofs)
- Plonky2 circuits
- Post-quantum cryptography
- Signature abstraction layer

## Configuration

### Node Configuration

```toml
[network]
listen_addresses = ["/ip4/0.0.0.0/tcp/30333"]

[rpc]
enabled = true
listen_address = "0.0.0.0:9944"

[validator]
enabled = true

[storage]
path = "./data"
```

## Documentation

- [LOCAL_FIRST.md](../docs/deploy/LOCAL_FIRST.md) - Local-first stack guide
- [DEPLOYMENT.md](../docs/DEPLOYMENT.md) - Historical deployment guide
- [MASTERPLAN.md](../docs/MASTERPLAN.md) - Implementation vectors
- [AGENTIC-LAYER.md](../docs/AGENTIC-LAYER.md) - AI agent architecture
- [DRC-369-SPECIFICATION.md](../docs/DRC-369-SPECIFICATION.md) - NFT standard

## License

Proprietary - Demiurge Protocol
