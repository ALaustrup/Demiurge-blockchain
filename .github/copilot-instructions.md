# Demiurge Protocol — AI agent instructions

Read `STATUS.md` first. It is the only source of truth for what works. Older docs and code comments overstate completeness; do not repeat their claims.

## Architecture

1. **`framework/`** — custom Rust L1 (not Substrate). Crates: `core` (block, transaction, runtime dispatcher), `storage` (RocksDB + memory backends), `consensus` (single-validator block production today; HotStuff-2 planned in Phase 2), `network` (libp2p swarm, gossip not yet wired), `rpc` (jsonrpsee, read methods + `author_submitExtrinsic`), `node` (binary), `primitives`, `modules/` (balances, energy, session-keys, drc369 on the live path; cvp research-only). `framework/research/` holds unwired research code.
2. **`services/qor-auth`** — Axum + Postgres + Redis identity service (username#0001, Argon2id, JWT, Ed25519 keypair login, agents, Studio licensing).
3. **`apps/hub`** — Next.js creator shell. **`apps/wallet-extension`** — MV3 wallet (dApp signing disabled until Phase 3). **`apps/marketing-site`** — showcase. **`packages/`, `sdk/`, `cli/`** — TypeScript SDKs and CLI; Phase 3 consolidates them onto one Rust-to-wasm SDK.
4. **`archive/`** — dead code. Never import from it.

## Conventions

- CGT: 2 decimals, 13B fixed supply, 100 Sparks = 1 CGT. Parameters only in `docs/specifications/cgt-tokenomics.md`.
- Gnostic names (Aeon, Archon, Syzygy, Pleroma, Monad) are allowed for modules; ask before creating new ones.
- Local-first: everything runs on localhost via `npm run studio:start`. No hosted network exists.

## Build

- Rust: stable toolchain. `cd framework && cargo build --workspace && cargo test --workspace`. No dependency patches are required.
- TypeScript: `npm ci && npm run build:sdk`, then `npx tsc --noEmit -p apps/hub/tsconfig.json`.
- CI (`.github/workflows/ci.yml`) runs secret scan, Rust check/clippy/test for `framework` and `services/qor-auth`, and TypeScript typechecks.

## Rules

- No RPC method may write state except via a signed transaction. A test in `framework/rpc` enforces it.
- Never derive keys from usernames. Never hard-code credentials. Never commit `.env`, keys, or databases.
- Every feature lands with a test that would fail without it.
- Update `STATUS.md` in the same change that alters what works.
- Follow `ROADMAP.md` phase order.
