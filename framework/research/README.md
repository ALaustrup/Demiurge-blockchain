# research/ - code moved out of the build (Phase 0)

Everything under this directory was removed from the Cargo workspace in
Phase 0 ("stop the bleeding"). None of it is compiled, tested, or linked into
the node. It is kept for reference only; each item must be re-evaluated on its
own merits before it comes back.

These crates still use `*.workspace = true` inheritance and are not buildable
standalone as-is. To build one, add it back to `framework/Cargo.toml`
`members` (the `path =` deps have been repointed to the new locations).

## research/modules/ (moved from framework/modules/)

| Crate | Why it was moved |
|---|---|
| `zk` | Zero-knowledge module. Nothing in core/node/rpc/consensus depends on it; plonky2 needs nightly, and no proof it produces is checked by consensus. |
| `agentic` | "Agentic integration layer" (agent identities, vector state, PQC feature flags). Only consumer of `qor-identity`; nothing consumes it. Speculative design, no integration point in the runtime. |
| `governance` | On-chain governance module. No dispatch path calls into it; no runtime wiring; orphaned. |
| `game-assets` | Game asset module. Orphaned: not referenced by core, node or rpc. |
| `yield-nfts` | Yield-bearing NFT module. Orphaned: not referenced by core, node or rpc. |
| `game-registry` | Game registry module. Was already commented out of the workspace for pre-existing build errors; still has no dependents. |
| `qor-identity` | Identity module. Only dependent was `agentic` (also moved); nothing in the node uses it. |

Verified before moving: `core`, `node`, `rpc`, `consensus`, `network`,
`modules/drc369`, `modules/cvp`, `modules/balances`, `modules/energy` and
`modules/session-keys` have no `path =` dependency on any of the above, and no
`use` of their crate names. The dependency direction was
`agentic -> drc369 + qor-identity`, never the reverse.

## research/consensus/ (moved from framework/consensus/src/)

| File | Why it was moved |
|---|---|
| `modular.rs` | "Modular Fluidity" hot-swappable consensus mechanisms (`ConsensusOrchestrator`, `PosBftMechanism`, ...). Re-exported from the crate root but never instantiated by `ConsensusEngine`, the node, or RPC. Pure abstraction with no runtime path. |
| `sharding.rs` | "Elastic Sharding" (`ShardCoordinator`, cross-shard messages). Same situation: exported, never used; there is no sharded execution or networking to attach it to. |

Their `pub mod` / `pub use` lines were removed from `consensus/src/lib.rs`
after confirming zero references anywhere else in the workspace.

## Not moved

`framework/modules/cvp` stays in the workspace because `consensus` links
against it, but it is research-grade too. See
`framework/modules/cvp/RESEARCH_STATUS.md` for what it does and does not do.
