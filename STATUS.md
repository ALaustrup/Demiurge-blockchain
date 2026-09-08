# Project Status

**Last verified:** 2026-09-08 (Phase 0 in progress)
**Rule:** This file is the only place completion claims live. Anything not listed as *Working* here should be assumed unimplemented, regardless of what older docs, comments, or READMEs say.

## Phase

| Phase | Name | State |
|-------|------|-------|
| 0 | Stop the bleeding (secrets, unsafe RPC, CI, honest docs) | **In progress** |
| 1 | Make one node correct (tx v2, nonce, Merkle state, energy at admission, session-key scope) | Not started |
| 2 | Make four nodes agree (HotStuff-2, gossip, sync, fork choice) | Not started |
| 3 | Studio 1.0 (single SDK, trimmed Hub, installer) | Not started |
| 4 | Programmable game logic (metered WASM VM) | Not started |
| 5 | Pleroma federation and public networks | Not started |
| 6 | Agent-native economy | Not started |
| 7 | Research tracks (CVP on real WASM, privacy, PQ) | Not started |

See `ROADMAP.md` for phase contents and exit criteria.

## What works today

- `demiurge-node` builds on stable Rust and runs as a **single validator** producing blocks.
- Transactions are Ed25519-signed, SCALE-encoded, and executed by the runtime module dispatcher.
- Runtime modules on the live path: `balances` (CGT with supply cap), `energy` (regenerating budget, charged at execution), `session-keys` (storage only), `drc369` core (mint, transfer, burn, approve, soulbound, XP/level, resources, nesting, delegation).
- JSON-RPC read API over HTTP and WebSocket; `author_submitExtrinsic` for signed transaction submission.
- `qor-auth` service: username#0001 accounts, Argon2id passwords, JWT sessions, Ed25519 keypair challenge login, agent accounts, Studio CD-key licensing.
- Hub (Next.js) creator shell connected to the local node and qor-auth.
- Local Studio stack via `npm run studio:start` (Postgres + Valkey in Docker/WSL, node, qor-auth, Hub).

## What does not work yet (and is not claimed)

- **Multi-node consensus.** No block, transaction, or vote is gossiped to peers. Finality is a single self-signature. No fork choice, no block sync.
- **Replay protection.** Nonces are not enforced; the signing payload has no chain id.
- **Block authorship.** Blocks carry no author or proposer signature.
- **State commitment.** The state root is a full-database rehash per block, not a Merkle trie; empty blocks carry a zero state root.
- **Energy as anti-spam.** Energy is charged at execution, not at mempool admission.
- **Session key scoping.** Keys are stored but never consulted on the transaction path.
- **DRC-369 payments, rental, fractional, freeze.** Paid transfer moves no CGT; the extra modules are library code with no extrinsics.
- **Staking rewards.** Computed in memory, never minted to balances; nominators are not paid.
- **Smart contracts / VM.** None. All logic is native Rust modules.
- **CVP, ZK, Modular Fluidity, Elastic Sharding, on-chain governance, agentic module.** Research code only. See `framework/research/README.md` and `framework/modules/cvp/RESEARCH_STATUS.md`.
- **Hub write flows.** Send CGT, staking, validator registration, session keys and sponsorship throw `WalletNotUnlocked` until the create/unlock wallet UI is wired, and the direct-write RPC methods they targeted (`balances_transfer`, `drc369_mint`, `consensus_stake`, …) were removed. All writes must move to signed transactions via `author_submitExtrinsic` in Phase 1. Read-only views work.
- **Wallet extension sends.** The extension now signs a domain-tagged payload the node does not yet verify, so extension-originated transfers fail node-side until Phase 1. Popup approval flow works.
- **Tests.** Rust unit tests exist for balances, energy, session-keys, drc369, cvp. No TypeScript tests. No integration tests for consensus or RPC.
- **Public network.** There is no hosted mainnet or testnet. `demiurge.cloud` endpoints in older docs are historical.

## Known bugs (tracked for Phase 1)

- `EXISTENTIAL_DEPOSIT = CGT / 1000` evaluates to 0, so the dust check in `balances` is dead.
- RPC subscription confirmations in `rpc/src/server.rs` are never awaited, so WebSocket subscribers get no ID and no events.
- Proposer selection entropy uses only 16 of 32 seed bytes and is not a VRF.

## Known security debt (tracked for Phase 1)

- Nonce/replay, chain-id binding, block signatures, mempool validation.
- Hub token storage in localStorage (move to HttpOnly cookies in Phase 3).
- Wallet extension key derivation is non-standard (fix in Phase 3).
- Testnet genesis files still use well-known Substrate dev keys (replace in Phase 2).

## Numbers that are true

| Parameter | Value | Enforced by code? |
|-----------|-------|-------------------|
| Total supply | 13,000,000,000 CGT | Yes (`balances` mint cap) |
| Decimals | 2 (100 Sparks = 1 CGT) | Yes |
| Genesis treasury | 10,000,000,000 CGT | Genesis config (verify per project) |
| Target block time | 2 s | Node flag `--block-time 2000`; default is still 1000 ms |
| Max energy / regen | 1000 / 10 per block | Yes |
