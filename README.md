# DEMIURGE

> The flame burns eternal. The code serves the will.

DEMIURGE is a sovereign L1 blockchain ecosystem designed for creators, gamers, musicians, developers, and artists. It combines a custom Proof-of-Work chain (Forge), a content-addressed P2P network (Fabric), and a decentralized marketplace (Abyss) into a unified creative economy powered by the Creator God Token (CGT).

## Core Universe Model

### Roles

**Nomad**
- Any user with a Demiurge address
- Can browse Fabric, buy NFTs, explore worlds, hold CGT and assets

**Archon**
- A Nomad who has "ascended" to creator status
- Has all Nomad abilities plus:
  - Upload to Fabric with revenue hooks
  - Mint D-GEN NFTs
  - List and sell in the Abyss
  - Earn CGT via Fabric seeding and Forge compute

### Identity

- Single keypair per user (ed25519)
- Demiurge Address (Nostr-style human-encoded pubkey) = identity handle + wallet address + system-wide user ID
- No separate "creator wallet". Just one identity, role flags on-chain.

### Economy

**CGT (Creator God Token)** – native L1 token:
- Pays gas/fees
- Pays Fabric seeders (Proof-of-Delivery)
- Pays Forge compute workers
- Denominates Abyss marketplace prices
- Routes royalties to creators

Other tokens (e.g., ETH, USDC) can exist later via bridges/swap modules, but the core protocol and UI are CGT-first.

## Core Systems

- **Demiurge (L1)** – Rust sovereign chain, custom PoW (Forge), modular runtime
- **Forge** – memory-hard PoW for block production + optional zkML/verifiable compute jobs
- **Fabric** – content-addressed P2P network (libp2p), with Proof-of-Delivery rewards in CGT
- **Abyss** – marketplace + dev hub: listing, royalties, licensing (NFT-based), GraphQL API for apps/games
- **D-GEN NFT Standard (D-721)** – single flexible NFT standard with metadata profiles for art/audio, game items/worlds, plugins/tools, code modules
- **Avatars / Archon Sigils** – optional identity NFTs to denote Archon status and show off style

## Repository Structure

```
DEMIURGE/
├── docs/                    # Documentation
├── chain/                   # Rust L1 node (Archon node), Forge PoW, RPC
├── runtime/                 # Rust runtime modules
├── indexer/                 # Block ingestor + GraphQL gateway
├── sdk/                     # TypeScript & Rust SDKs
├── apps/
│   ├── portal-web/          # Next.js website + creator dashboard
│   └── desktop-qt/          # Qt 6.10 Pantheon Console
└── infra/                   # Docker, k8s, devcontainer configs
```

## Getting Started

### Prerequisites

- Rust (via rustup)
- Node.js 18+ and pnpm
- Qt 6.10 (for desktop app)
- Docker (for localnet)

### Development

See individual workspace READMEs for specific setup instructions.

## License

[To be determined]

## Contributing

[To be determined]

