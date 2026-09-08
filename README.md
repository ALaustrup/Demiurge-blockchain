# Demiurge Protocol

**The sovereign game-state ledger.** A blockchain that ships inside a game studio's toolchain, runs on the developer's own machine from day one, and federates outward only when the game does.

> Your game. Your chain. Your machine.

**Status: pre-alpha, local-first.** Read [`STATUS.md`](STATUS.md) before anything else. It is the only place completion claims live. The plan is in [`ROADMAP.md`](ROADMAP.md).

---

## What Demiurge is building

| Promise | Mechanism | Phase |
|---------|-----------|-------|
| **Chain in the editor** | `demiurge-node` runs per game project, 2 s blocks, Unreal/Unity/Godot plugins point at `127.0.0.1:9944` | 1–3 |
| **Assets that remember** | DRC-369: on-chain XP, durability, history, physics fields, nesting, rental, multi-resource, cross-world lineage | 1, 5 |
| **No gas, no popups, no seed phrases** | Regenerating energy at mempool admission; capability-scoped session keys; QOR ID (`name#0001`) | 1, 3 |
| **Agents with budgets** | Agent accounts whose spend policies are enforced by transaction admission | 6 |
| **Real consensus** | HotStuff-2 BFT among a small validator set, then per-game public networks settled on Pleroma | 2, 5 |
| **Programmable rules** | Metered WASM contracts with a typed asset ABI, fuel charged to energy | 4 |

## What works today

- Single-validator node that builds on stable Rust and produces blocks.
- Ed25519-signed, SCALE-encoded transactions executed by a module dispatcher: CGT balances with a 13B cap, regenerating energy, session-key storage, and a real DRC-369 NFT core.
- JSON-RPC read API plus `author_submitExtrinsic`.
- `qor-auth` identity service and the Hub creator shell, running locally.

## What does not work yet

Multi-node consensus, replay protection, block signatures, Merkle state, energy at admission, session-key enforcement, paid NFT transfers, staking payouts, a VM. CVP, ZK, sharding and hot-swappable consensus are research code. See `STATUS.md` for the full list.

---

## Demiurge Studio (local stack)

```powershell
npm run studio:start
```

Starts Postgres + Valkey (Docker or WSL), the node, `qor-auth`, and the Hub, then opens http://localhost:3000. Step by step: `studio:infra` → `studio:node` → `studio:auth` → `studio:hub` → `studio:health`.

New game: copy `projects/_template` to `projects/YourGameName`. Guide: [`docs/DEMIURGE_STUDIO.md`](docs/DEMIURGE_STUDIO.md). Ports and reboot checklist: [`docs/deploy/LOCAL_FIRST.md`](docs/deploy/LOCAL_FIRST.md).

### Prerequisites

- Rust stable (`rustup update stable`)
- Node.js 20+ and npm 10+
- Docker Desktop or WSL2 with Postgres 16 and Valkey/Redis

### Build the node

```bash
cd framework
cargo build --release -p demiurge-node
./target/release/demiurge-node --rpc --block-time 2000 --genesis ../config/testnet/genesis.json --validator-key validator.key
```

### Run the auth service

```bash
cd services/qor-auth
cp .env.example .env   # fill in JWT secrets (32+ bytes each) and DATABASE_URL
cargo run --release     # http://localhost:8080
```

### Run the Hub

```bash
npm ci
npm run build:sdk
npm run local:hub       # http://localhost:3000
```

---

## Repository layout

```
framework/          Rust L1: core, storage, consensus, network, rpc, node, primitives
  modules/          balances · energy · session-keys · drc369 (live) · cvp (research)
  research/         unwired research code (zk, agentic, governance, sharding, modular)
services/qor-auth/  identity service (Axum, Postgres, Redis)
apps/hub/           creator shell (Next.js)
apps/wallet-extension/  MV3 wallet (dApp signing disabled until Phase 3)
apps/marketing-site/    showcase site
apps/games/         Phaser sample and integration template
packages/, sdk/, cli/   TypeScript SDKs, Unreal plugin, CLI
client/             Unreal game client
projects/           Studio projects (one chain per game)
config/, docker/, testnet/, scripts/   local-stack configuration and scripts
docs/               specifications (design), guides, and archived claims
archive/            dead code kept for reference; never imported
```

## Token

CGT. 13,000,000,000 fixed supply, 2 decimals, 100 Sparks = 1 CGT. Genesis treasury 10,000,000,000 CGT. Single source of truth: [`docs/specifications/cgt-tokenomics.md`](docs/specifications/cgt-tokenomics.md).

## Contributing and security

See [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`SECURITY.md`](SECURITY.md). Do not run this software with real value at stake before Phase 2 exit criteria are met.

## License

MIT
