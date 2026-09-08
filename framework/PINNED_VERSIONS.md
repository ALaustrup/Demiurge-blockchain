# DEMIURGE BLOCKCHAIN — PINNED DEPENDENCY MATRIX

**Last Updated**: 2026-02-07
**Rust Edition**: 2021
**Workspace Resolver**: v2

---

## Direct Dependencies (Exact Pins)

All versions use `=X.Y.Z` exact pins in the workspace root `Cargo.toml`.
Every workspace member inherits via `{ workspace = true }`.

### Serialization
| Crate | Version | Notes |
|-------|---------|-------|
| `serde` | =1.0.228 | With `derive` feature |
| `serde_json` | =1.0.149 | |
| `parity-scale-codec` | =3.7.5 | Aliased as `codec`, with `derive` |
| `scale-info` | =2.11.6 | With `derive` |

### Cryptography
| Crate | Version | Notes |
|-------|---------|-------|
| `blake2` | =0.10.6 | Primary hash function |
| `blake3` | =1.8.3 | Used by agentic module |
| `sha2` | =0.10.9 | SHA-256/SHA-512 |
| `ed25519-dalek` | =2.2.0 | Ed25519 signatures, with `rand_core` |
| `secp256k1` | ^0.28 | Not yet used, reserved |
| `hex` | =0.4.3 | Hex encoding/decoding |
| `rand` | =0.8.5 | RNG (pinned to 0.8.x series) |

### Async Runtime
| Crate | Version | Notes |
|-------|---------|-------|
| `tokio` | =1.49.0 | Full features |
| `futures` | =0.3.31 | |

### Networking
| Crate | Version | Notes |
|-------|---------|-------|
| `libp2p` | =0.53.2 | tcp, dns, noise, yamux, gossipsub, kad, identify |

### Storage
| Crate | Version | Notes |
|-------|---------|-------|
| `rocksdb` | =0.21.0 | Persistent key-value store |

### Logging
| Crate | Version | Notes |
|-------|---------|-------|
| `tracing` | =0.1.44 | Structured logging |
| `tracing-subscriber` | =0.3.22 | With `env-filter` |

### Error Handling
| Crate | Version | Notes |
|-------|---------|-------|
| `thiserror` | =1.0.69 | Derive-based error types |
| `anyhow` | =1.0.100 | Ergonomic error handling |

### RPC
| Crate | Version | Notes |
|-------|---------|-------|
| `jsonrpsee` | =0.20.4 | HTTP + WebSocket server |

### CLI
| Crate | Version | Notes |
|-------|---------|-------|
| `clap` | =4.5.54 | With `derive` feature |

### Testing
| Crate | Version | Notes |
|-------|---------|-------|
| `tempfile` | =3.24.0 | Temp directories for tests |
| `criterion` | =0.5.1 | Benchmarking |

---

## Workspace Crates (Internal)

All use `version = "0.1.0"` inherited from `[workspace.package]`.

| Crate | Path | Description |
|-------|------|-------------|
| `demiurge-primitives` | `primitives/` | Core types, crypto primitives |
| `demiurge-core` | `core/` | Runtime engine, block execution |
| `demiurge-storage` | `storage/` | RocksDB storage layer |
| `demiurge-consensus` | `consensus/` | Hybrid PoS + BFT consensus |
| `demiurge-modules` | `modules/` | Module system (pallet replacement) |
| `demiurge-module-balances` | `modules/balances/` | CGT token management |
| `demiurge-module-drc369` | `modules/drc369/` | DRC-369 NFT standard |
| `demiurge-module-game-assets` | `modules/game-assets/` | Multi-asset game system |
| `demiurge-module-energy` | `modules/energy/` | Regenerating tx costs |
| `demiurge-module-session-keys` | `modules/session-keys/` | Temporary auth keys |
| `demiurge-module-yield-nfts` | `modules/yield-nfts/` | Passive income NFTs |
| `demiurge-module-zk` | `modules/zk/` | ZK private transactions |
| `demiurge-cvp` | `modules/cvp/` | Consensus-Verified Polymorphism |
| `demiurge-qor-identity` | `modules/qor-identity/` | Sovereign identity |
| `demiurge-agentic` | `modules/agentic/` | AI agent integration |
| `demiurge-module-governance` | `modules/governance/` | On-chain governance |
| `demiurge-network` | `network/` | libp2p P2P networking |
| `demiurge-rpc` | `rpc/` | JSON-RPC + WebSocket server |
| `demiurge-node` | `node/` | Full node binary |

### Excluded from Workspace
| Crate | Path | Reason |
|-------|------|--------|
| `demiurge-game-registry` | `modules/game-registry/` | Pre-existing build errors, no dependents |

---

## Known Transitive Duplicates

These are unavoidable without forking upstream crates:

| Crate | Versions | Pulled By |
|-------|----------|-----------|
| `base64` | 0.13, 0.21, 0.22 | libp2p subcrates |
| `rand` | 0.8, 0.9 | Pinned at 0.8; some transitive deps use 0.9 |
| `thiserror` | 1.0, 2.0 | Some transitive deps updated to 2.x |
| `syn` | 1.0, 2.0 | Proc-macro crates (legacy + modern) |
| `digest` | 0.9, 0.10 | Crypto crate compatibility |
| `windows-*` | 0.48, 0.52, 0.53 | Windows platform abstraction layers |

---

## Upgrade Policy

1. **Direct deps**: Only upgrade via workspace root. Run `cargo update` then pin the new exact version.
2. **Transitive deps**: Let Cargo resolve. Only intervene if a CVE is found.
3. **Breaking changes**: Test on a branch first. Update all workspace crates atomically.
4. **ZK deps** (`plonky2`): Pinned per-crate as optional features. Not workspace-managed.

---

## Build Verification

```bash
# Check all workspace crates compile
cargo check

# Full release build
cargo build --release --bin demiurge-node

# Run tests
cargo test --release

# Verify binary
./target/release/demiurge-node --version
```
