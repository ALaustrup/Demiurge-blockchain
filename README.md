# DEMIURGE

> The flame burns eternal. The code serves the will.

DEMIURGE is a sovereign L1 blockchain ecosystem designed for creators, gamers, musicians, developers, and artists. It combines a custom Proof-of-Work chain (Forge), a content-addressed P2P network (Fabric), and a decentralized marketplace (Abyss) into a unified creative economy powered by the Creator God Token (CGT).

## Core Universe Model

### Identity: UrgeID

**UrgeID** is the sovereign identity system on Demiurge. Every user has an UrgeID that serves as:
- **Wallet Address**: Receive and send CGT
- **Identity Profile**: Display name, bio, handle (@username)
- **Syzygy Tracking**: Contribution score for seeding/serving other creators' content
- **Badges**: Achievement markers (e.g., "Luminary" for high Syzygy scores)

### Roles

**UrgeID Users**
- All users have an UrgeID identity
- Can browse Fabric, buy NFTs, explore worlds, hold CGT and assets
- Can send and receive CGT transfers
- Track Syzygy contributions

**Archons (Creators)**
- UrgeID users who have "ascended" to creator status
- Have all UrgeID abilities plus:
  - Upload to Fabric with revenue hooks
  - Mint D-GEN NFTs
  - List and sell in the Abyss
  - Earn CGT via Fabric seeding and Forge compute

### Identity System

- Single Ed25519 keypair per user
- UrgeID Address (32-byte hex) = wallet address + identity handle
- On-chain profile with display name, bio, handle, Syzygy score, and badges
- No separate "creator wallet". Just one identity, role flags on-chain.

### Economy

**CGT (Creator God Token)** – native L1 token:
- **Name**: Creator God Token
- **Symbol**: CGT
- **Decimals**: 8 (smallest unit: 10^-8 CGT)
- **Max Supply**: 1,000,000,000 CGT (1 billion)
- **Total Supply**: Tracked on-chain, enforced at mint time
- **Uses**:
  - Pays gas/fees
  - Pays Fabric seeders (Proof-of-Delivery)
  - Pays Forge compute workers
  - Denominates Abyss marketplace prices
  - Routes royalties to creators
  - Transferable between UrgeIDs

All CGT amounts are stored as `u128` in smallest units (10^-8 precision). RPC methods return amounts as strings to avoid JavaScript number overflow.

Other tokens (e.g., ETH, USDC) can exist later via bridges/swap modules, but the core protocol and UI are CGT-first.

## Core Systems

- **Demiurge (L1)** – Rust sovereign chain, custom PoW (Forge), modular runtime
- **Forge** – memory-hard PoW for block production + optional zkML/verifiable compute jobs
- **Fabric** – content-addressed P2P network (libp2p), with Proof-of-Delivery rewards in CGT
- **Abyss** – marketplace + dev hub: listing, royalties, licensing (NFT-based), GraphQL API for apps/games
- **D-GEN NFT Standard (D-721)** – single flexible NFT standard with metadata profiles for art/audio, game items/worlds, plugins/tools, code modules
- **UrgeID Registry** – on-chain identity system with profiles, handles, Syzygy scores, and badges
- **Transaction Signing** – Ed25519 client-side signing with transaction hash tracking and status polling

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

