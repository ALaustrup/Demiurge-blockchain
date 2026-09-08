# Roadmap

The strategic thesis: **Demiurge is the sovereign game-state ledger.** A chain that ships inside a game studio's toolchain, runs on the developer's own machine from day one, and federates outward only when the game does. Assets are living objects with physics, memory and lineage. Players never see gas, seed phrases or popups. AI agents are accounts with enforceable budgets.

Each phase has an exit criterion that CI or a reproducible test can check. Phases 0–2 are sequential. `STATUS.md` records which phase is current.

## Phase 0 — Stop the bleeding

Goal: the repository is safe to look at and honest about itself.

- [x] Delete committed SSH key, Vercel link, IDE caches, build artifacts, runtime databases.
- [x] Archive dead apps, packages, pallets, tools and ~90 legacy scripts to `archive/`.
- [x] Archive inflated claim docs to `docs/archive/claims-2026-02/`.
- [x] One tokenomics truth (`docs/specifications/cgt-tokenomics.md`).
- [x] Real CI: Rust check/clippy/test, qor-auth build, TypeScript typecheck, secret scan.
- [x] Scrub production JWT/DB secrets from config; startup refuses placeholder secrets.
- [x] Remove the seeded God account; hashed backup codes; RBAC string fix; revocable sessions.
- [x] Remove every RPC method that writes state without a signed transaction; register `author_submitExtrinsic`.
- [x] Remove username-derived private keys and hard-coded god API keys from the Hub.
- [x] Authenticate VYB/notify/spline routes via qor-auth instead of client headers.
- [x] Wallet extension: per-origin approval flow implemented; domain-tagged signing payloads (node verification lands in Phase 1).
- [x] Workspace builds on stable Rust; non-compiling tests fixed or removed.
- [x] Orphaned modules moved to `framework/research/`.
- [x] `git init` with the sanitized tree as the first commit (2a19631).

**Exit:** CI green on a clean clone; secret scan clean; no RPC method can mutate state without a signed transaction.

## Phase 1 — Make one node correct (≈ 6 weeks)

- Transaction v2: `{chain_id, genesis_hash, nonce, from, session_ref?, energy_limit, call}`; nonce enforced; domain-tagged signing payload shared with the SDK and wallet.
- Block v2: author, proposer signature, Merkle extrinsics root, state root validated on import.
- Single RocksDB with per-block write batches; Jellyfish Merkle tree for state; snapshots.
- Energy checked at mempool admission; per-sender nonce ordering and caps.
- Session-key scope `{module, calls, spend cap, expiry, game}` verified before dispatch.
- Agent accounts as an account type with controller and spend policy enforced at admission.
- DRC-369: authorized mint, paid transfer moves CGT, cycle-safe nesting, XP via `AddXp` only; rental and freeze as extrinsics.
- Staking rewards mint into balances against the cap.
- Property tests for the runtime; integration tests that spin a node and submit over RPC.

**Exit:** 10k signed transfers over RPC; replays rejected; state root reproducible from genesis on a second machine.

## Phase 2 — Make four nodes agree (≈ 8 weeks)

- HotStuff-2: proposal, vote, quorum certificate, commit; view change; signed everything; equivocation evidence persisted.
- Wire block/tx/vote gossip; block request/response and headers-first sync; fork choice by highest committed QC.
- Genesis validators registered; validator set changes via staking epochs; real slashing.
- Adversarial Docker testnet: partition, crash-restart, byzantine proposer, late joiner.
- Subscriptions fire from the block pipeline.

**Exit:** 4-node network survives one byzantine node and one partition with no safety violation across 100k blocks; a fifth node syncs from genesis.

## Phase 3 — Studio 1.0 (≈ 12 weeks, overlaps Phase 2)

- One Rust SDK compiled to wasm → `@demiurge/sdk`; every client (Hub, CLI, extension, Unreal) uses it; delete the others.
- Hub trimmed to the creator loop: Projects → Economy → Items → Identities → Playtest → Export. Other surfaces behind `STUDIO_EXPERIMENTAL`.
- Per-project genesis and chain dir; one-command start without WSL.
- Unreal plugin compiled in CI; Unity and Godot bindings from the same ABI.
- Wallet extension: approval flow, BIP-44 derivation, checksummed addresses, per-origin permissions.
- qor-auth: HttpOnly cookies, rate limits, audit trail.
- Signed Windows installer; CD-key licensing.

**Exit:** A stranger installs Studio on a clean Windows VM, creates a game, mints an item in Unreal, plays a session with no wallet popups. Ten creators in beta.

## Phase 4 — Programmable game logic (≈ 12 weeks)

- wasmtime module with fuel metering charged to energy; deterministic configuration.
- Typed asset ABI; host functions for balances, energy, nesting, XP, events.
- Rust and AssemblyScript templates; "game rules" project type with hot reload.
- Fixed-point physics fields validated by schema.

**Exit:** A crafting system and a loot table as WASM contracts run identically on all validators; fuzzing shows no non-determinism.

## Phase 5 — Pleroma federation (months 8–12)

- Pleroma settlement chain: identity registry, CGT root ledger, validator marketplace.
- Cross-chain asset lineage verified via light-client headers.
- CGT bridge with delayed, challengeable exits.
- Public testnet; first external security audit.

**Exit:** Two independent studios' chains exchange an asset carrying verifiable history from both; audit findings closed.

## Phase 6 — Agent-native economy (months 10–14)

- Agent accounts with spend policies, controller recovery, capability manifests.
- Agent Foundry on the single SDK with a multi-provider interface; Sophia becomes one agent.
- Signed inference receipts (TEE or oracle) referenced by agent actions.

**Exit:** 100 autonomous agents trade in a live game economy for a week; no policy violation admitted.

## Phase 7 — Research tracks, re-earned (month 12+)

- CVP on real WASM with differential-fuzzing equivalence, published before shipped.
- One privacy use case on one proving system.
- Hybrid Ed25519 + ML-DSA accounts, opt-in.
- Intra-chain sharding only if a single game exceeds one chain.

**Exit:** each track has a public benchmark or paper and a feature flag that defaults off.
