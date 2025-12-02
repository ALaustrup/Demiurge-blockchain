# Demiurge: Developer Superplatform + Recursion Integration

**Master Prompt for Cursor**

---

You are my Principal Engineer and co-architect for the Demiurge Blockchain.

## Ground Truth: Current Demiurge State

Treat the following as FACT. Do not contradict or "simplify" it. Build on it.

- **Chain (Rust)**:
  - L1 with Argon2id + SHA-256 PoW ("Forge").
  - RocksDB state.
  - Runtime modules:
    - `bank_cgt`: CGT token (u128 balances, metadata, max supply, total supply, faucet).
    - `urgeid_registry`: UrgeID profiles, usernames, Syzygy/leveling, badges, Archon flag, analytics.
    - `nft_dgen`: D-GEN NFTs with metadata (including fabric_root_hash, royalties), ownership tracking.
    - `fabric_manager`: Fabric asset registration + fee pools (P2P integration TODO).
    - `abyss_registry`: NFT marketplace (listings, buys, cancels, royalties).
  - JSON-RPC at `http://127.0.0.1:8545/rpc` with CGT, UrgeID, NFT, marketplace, and tx endpoints.

- **Abyss Gateway (Node/TypeScript)**:
  - GraphQL API layered over SQLite (`chat.db`).
  - World chat, DMs, custom rooms, media, music queue, Seven Archons NPC accounts.
  - Queries, mutations, subscriptions already implemented, currently using polling (not WebSockets).

- **Portal Web (Next.js + Tailwind + Framer Motion)**:
  - `/` : Hero + live chain status + pillars + roadmap.
  - `/urgeid` : "My Void" – UrgeID gen/login, dashboard, CGT balance, usernames, tx history, NFT gallery, mint test NFT, vault export/import, QR code.
  - `/chat` : World chat + DMs + rooms + media + Archons, using Abyss Gateway.
  - `/marketplace` : Abyss NFT marketplace UI.
  - `/fabric` : Fabric world gallery with mock assets (UI done, backend TBD).
  - `/analytics`: User analytics and metrics.
  - `/docs` : MDX documentation for architecture, APIs, chat, analytics, etc.

- **Client libraries**:
  - `lib/rpc.ts`, `lib/graphql.ts`, `lib/signing.ts`, `lib/txBuilder.ts`, `lib/transactions.ts`, `lib/urgeid.ts`, `lib/vault.ts`, `lib/archons.ts`, `lib/aeonId.ts`.

- **Persistence**:
  - RocksDB for chain.
  - SQLite for chat.
  - localStorage for client keys/state.

- **Do NOT**:
  - Break existing key formats in RocksDB or `chat.db`.
  - Break existing RPC or GraphQL signatures without adapters.
  - Remove current pages or major flows without replacing them with strict upgrades.

The repo is a Rust monorepo with:
- `chain/`
- `indexer/abyss-gateway/`
- `apps/portal-web/`

and all the structure implied by the above.

I am on Windows with WSL/Fedora and Docker. Commands must work in this environment.

---

## New Objective: Demiurge as the Ultimate Developer Platform + Recursion Engine Integration

Your job now is to evolve Demiurge into the best possible platform for developers and creative engineers, **without redoing or discarding** what already exists.

Think of this as **Phase: Developer Superplatform + Recursion Integration**, built in layered milestones.

### High-Level Goals

1. **Turn Demiurge into a first-class developer platform**:
   - Make it strictly more pleasant and powerful than building on Ethereum, but with Demiurge's own identity.
   - Offer SDKs, templates, CLI tooling, module registry, docs, and safety rails.

2. **Introduce the Recursion Engine**:
   - A next-generation game/experience engine tightly integrated with Demiurge for:
     - On-chain assets (D-GEN NFTs).
     - CGT economy.
     - Fabric content.
     - Real-time multiplayer and world state that can be mirrored on-chain.
   - The engine itself can be its own module / workspace (e.g. `apps/recursion-engine/`), using a modern stack (Rust + ECS + Web/WebGPU or native).
   - It should be IDE- & engine-friendly (e.g. export to web, desktop, potentially plug into Unreal/Unity-like workflows but with Demiurge-native affordances).

3. **Harden security & real-time infrastructure**:
   - Upgrade chat from polling to WebSockets (GraphQL subscriptions over websockets).
   - Add full signature verification where currently TODO.
   - Prepare the P2P + block production path so the dev ecosystem is not built on a toy chain.

---

## Constraints and Style

- **Do NOT** wipe or redesign existing modules. Evolve them.
- Prefer evolutionary changes: adapter layers, new modules, migrations.
- All new Rust code must compile with `cargo check` in the existing workspace layout.
- All new Next.js code must pass `pnpm lint` and `pnpm build` in `apps/portal-web`.
- All new Node/TS code for Abyss Gateway must pass `pnpm lint` and `pnpm build`.
- Respect existing naming: CGT, UrgeID, Abyss, Fabric, etc.

---

## Concrete Milestones

Please structure your work into well-defined phases, each with:
- Files to create/modify.
- Exact code additions.
- Any schema/data migration plans.
- Tests/sanity checks.
- Docs updates (`docs/*.md` or `/docs` pages).

### Milestone 1 – Developer SDK & CLIs

Goal: Make building on Demiurge delightful.

1. Create `sdk/ts-sdk/` (if not already) and flesh it out as a proper NPM library:
   - High-level APIs for:
     - CGT balances and transfers.
     - UrgeID creation, username management.
     - NFT minting and transfers.
     - Marketplace interactions.
   - Handle URL + RPC config, retries, and error wrapping.
   - Typed interfaces for all RPC responses.

2. Create `sdk/rust-sdk/`:
   - For server-side tools, Recursion Engine integration, and future on-chain tools.
   - Wrap RPC calls in ergonomic Rust types.
   - Provide primitives for signing and transaction building.

3. Add a small `cli/` workspace:
   - `demiurge-cli` binary for:
     - Creating UrgeIDs (offline keygen).
     - Viewing balances and NFTs.
     - Managing simple marketplace interactions.
   - Use the SDKs internally.

### Milestone 2 – Developer Templates & Registry

Goal: Give developers plug-and-play project blueprints.

1. Add `templates/` directory with:
   - `template-dapp-basic/`: Minimal web dApp using ts-sdk.
   - `template-game-recursion/`: Skeleton project that will use the Recursion Engine (see Milestone 3).

2. Extend or create a small on-chain **Module/Template Registry** in `runtime`:
   - Register templates and modules as entries associated with:
     - A name/slug.
     - A Fabric asset (where the code lives).
     - License / access info (leveraging existing marketplace if appropriate).
   - Keep it simple and composable with `abyss_registry` (no need for overengineering).

### Milestone 3 – Recursion Engine Integration (First Pass)

Goal: Introduce a playground Recursion Engine that proves the concept but doesn't overcomplicate.

1. Create a new workspace, e.g. `apps/recursion-engine/`:
   - Choose a modern stack:
     - Suggestion: Rust + Bevy or a lightweight ECS + WebGPU for a "Recursion Playground" that runs on desktop or web.
   - Integrate:
     - Loading a user's UrgeID.
     - Pulling their NFTs.
     - Using Fabric asset metadata (initially mocked or partly wired).
     - Using CGT as in-game currency for some demo mechanic.

2. Add a simple **Recursion Playground** route in the portal (`/recursion`):
   - Embed the engine (if web), or act as a control panel / launcher if native.
   - Show:
     - Connected UrgeID.
     - NFTs available in this world.
     - Hooks for future game mechanics.

3. Add docs for developers:
   - `docs/recursion-engine.md` with:
     - Architecture of the engine.
     - How it integrates with Demiurge chain.
     - How to build a new game/world using the engine.

Keep the first iteration focused on **proving the integration**, not building a full AAA engine.

### Milestone 4 – Real-Time Infrastructure Upgrade

Goal: Move beyond polling and prep for serious usage.

1. Upgrade Abyss Gateway:
   - Add proper WebSocket support for GraphQL subscriptions (e.g. graphql-ws).
   - Migrate world chat + room messages to actual subscriptions while optionally keeping polling as a fallback.

2. Add presence and typing indicators:
   - Track active users per room.
   - Provide a minimal presence model in SQLite.

3. Update `/chat` in the portal:
   - Use GraphQL subscriptions where available.
   - Fallback gracefully if WS is not available.

### Milestone 5 – Security Hardening

Goal: Make Demiurge safe to build on.

1. Full signature verification in all critical flows:
   - Audit current TODOs where server-side verification is missing.
   - Validate that all chain-level transactions require valid Ed25519 signatures (except clearly marked dev/debug RPCs).

2. Document security model:
   - Add `docs/security.md` describing:
     - Key handling.
     - Signing model.
     - Threat model for chain, gateway, and portal.

---

## How to Work

For each milestone:

1. Propose a concrete plan with file-level changes.
2. Implement code changes directly (no pseudo-code).
3. Keep diffs minimal and targeted.
4. Update docs `/docs` + `docs/*.md` as needed.
5. Provide me:
   - Commands to run (cargo, pnpm, etc.).
   - How to test the new feature end-to-end.

Remember: you are extending a live, already-implemented system. No rewrites. No renames of core concepts like CGT, UrgeID, Abyss, Fabric, etc., unless you also provide a clean migration or alias layer.

---

**Start with Milestone 1 – Developer SDK & CLIs now.**

