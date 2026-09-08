# Demiurge Studio

**Your game. Your chain. Your machine.**

Demiurge Studio is the offline-first creator suite built on the Demiurge Protocol. It keeps everything you invested in—**CGT economy**, **local blockchain**, **QOR identity**, **DRC-369 items**, **agents**, and **Unreal integration**—without requiring paid cloud hosting.

The public-internet blockchain platform is retired as the primary product. **Studio mode** is.

---

## What Studio is

| Layer | Role in Studio |
|-------|----------------|
| **Hub** (`localhost:3000`) | Creator shell — projects, economy, items, playtest, docs |
| **demiurge-node** (`localhost:9944`) | Per-game ledger — balances, ownership, events |
| **qor-auth** (`localhost:8080`) | Studio login — creators, playtesters, agents |
| **Postgres + Valkey** (WSL) | Identity and session store (local only) |
| **Wallet / CLI / SDKs** | Dev tools — sign, mint, script, export |
| **Unreal plugin** | Connect gameplay to your local chain |

CGT and Sparks are **in-universe currency**, not a requirement for real-money rails. Stripe, Pinata, and cloud LLMs remain optional add-ons.

---

## Creator happy path

```
New project → Configure economy → Design items (DRC-369)
     → Assign QOR identities → Playtest (Hub + node)
     → Export / open in Unreal (local RPC)
```

### 1. Start the studio stack

```powershell
npm run studio:start
```

This starts WSL infra, node, qor-auth, and Hub (minimized windows), then opens the Projects screen.

Status only:

```powershell
npm run studio
```

Or step by step (four terminals):

```powershell
npm run studio:infra    # WSL Postgres + Valkey
npm run studio:node     # demiurge-node
npm run studio:auth     # qor-auth
npm run studio:hub      # Creator UI
```

Health check:

```powershell
npm run studio:health
```

Open **http://localhost:3000** when Hub is up.

### 2. Create or open a project

Projects live under `projects/` (see [studio/PROJECT_LAYOUT.md](studio/PROJECT_LAYOUT.md)).

```text
projects/
  MyRPG/
    project.json      # name, chain data path, defaults
    chain/            # node data dir (future: per-project genesis)
    assets/           # DRC-369 metadata, art refs
    docs/             # design notes
```

Each project uses `projects/<slug>/chain/` when set active (restart node after switching). CLI: `demiurge studio project list|new|use|active`.

### 3. Design economy (CGT)

- Treasury and godmode account seed at genesis (framework `balances` module).
- Use Hub wallet panel and CLI for transfers, rewards, and shops.
- **100 Sparks = 1 CGT** — same semantics as production docs, scoped to your game.

### 4. Design items (DRC-369)

- Stateful items with history and physics fields for UE.
- Mint and update via Hub **Create** / DRC-369 flows or `@demiurge/drc369-sdk`.
- See [GAME_INTEGRATION.md](GAME_INTEGRATION.md) for engine hooks.

### 5. Identity (QOR)

- Register creators and playtest accounts via qor-auth.
- Agents use keypair or pre-registered patterns (`agent-foundry`, CLI).

### 6. Playtest

- Node + auth + Hub running on localhost.
- Point Unreal at `http://127.0.0.1:9944` (`sdk/unreal/DemiurgeSDK/`).
- Reset or re-seed chain data when iterating (documented in LOCAL_FIRST reboot checklist).

### 7. Ship (offline)

- Export `projects/MyRPG/` (config + assets + README).
- Collaborators run the same stack locally or on LAN (Tailscale optional, $0).
- No Vercel/Fly/Neon required for core gameplay.

---

## What stays in the monorepo

**Core (Studio):** node, framework modules, qor-auth, Hub, wallet-wasm, browser extension, CLI, qor-sdk, drc369-sdk, agent-foundry, Unreal SDK.

**Optional:** Sophia (local Ollama or API keys), marketing-site (showcase only), music/social modules in Hub.

**Out of scope for Studio v1:** public NFT portal, Stripe donations, always-on cloud deploy scripts.

---

## Roadmap

| Phase | Focus | Status |
|-------|--------|--------|
| **A** | Branding, docs, `npm run studio*`, Hub title | **Done** |
| **B** | `projects/` model, Hub Projects, per-project chain | **In progress** |
| **C** | UE playtest preset, export pack, seeded test accounts | Planned |

Full checklist: [studio/ROADMAP.md](studio/ROADMAP.md)

---

## Licensing (CD-keys)

Sell **Creator**, **Pro**, and **Enterprise** editions with offline CD-key activation. See [studio/LICENSING.md](studio/LICENSING.md).

## Related docs

- [deploy/LOCAL_FIRST.md](deploy/LOCAL_FIRST.md) — ports, reboot, limitations
- [studio/PROJECT_LAYOUT.md](studio/PROJECT_LAYOUT.md) — project folder convention
- [GAME_INTEGRATION.md](GAME_INTEGRATION.md) — Unreal / Unity integration
- [framework/README.md](../framework/README.md) — chain modules (balances, drc369, game-assets)

---

## Tagline

*Demiurge Studio — local sovereign game kit for creators who want identity, economy, and persistent assets without renting the internet.*
