# Demiurge Developer Templates

Production-ready starter templates for building on the Demiurge Blockchain.

## Available Templates

### 🟢 Web App Template
**Location:** `templates/web-app/`

Full-featured Next.js + TypeScript dApp with:
- UrgeID generation/login
- CGT balance & transfers
- NFT viewer
- Marketplace integration
- Chat integration
- Fabric gallery example
- Transaction signing

**Quick Start:**
```bash
cd templates/web-app
pnpm install
cp .env.example .env.local
pnpm dev
```

### 🟠 Mobile App Template
**Location:** `templates/mobile-app/`

React Native + Expo mobile app with:
- UrgeID wallet
- CGT transfers
- NFT gallery
- Chat (world channel)
- Mobile-optimized UI

**Quick Start:**
```bash
cd templates/mobile-app
pnpm install
npx expo start
```

### 🔵 Rust Server Template
**Location:** `templates/rust-service/`

Axum-based server backend with:
- UrgeID profile fetching
- NFT operations
- CGT transaction handling
- Fabric metadata integration

**Quick Start:**
```bash
cd templates/rust-service
cargo run
```

### 🟣 Node Bot Template
**Location:** `templates/node-bot/`

Archon-like microservice with:
- GraphQL chat integration
- Auto-responses
- CGT microrewards
- UrgeID username resolution
- On-chain triggers

**Quick Start:**
```bash
cd templates/node-bot
pnpm install
pnpm start
```

### 🟡 Game Engine Template
**Location:** `templates/game-engine/`

Lightweight game client with:
- UrgeID login
- NFT fetching & rendering
- CGT microtransactions
- 3D scene integration

**Quick Start:**
```bash
cd templates/game-engine
mkdir build && cd build
cmake ..
make
./demiurge-game
```

## Prerequisites

All templates require:
- **Demiurge Chain Node** running at `http://127.0.0.1:8545/rpc`
- **Abyss Gateway** running at `http://localhost:4000/graphql` (for chat templates)

## SDK Integration

All templates use the Demiurge SDKs:
- **TypeScript templates**: `@demiurge/ts-sdk` (local path: `../../sdk/ts-sdk`)
- **Rust templates**: `demiurge-rust-sdk` (local path: `../../sdk/rust-sdk`)

## Documentation

See the [Developer Guide](../../docs/developer-guide.md) for detailed documentation on:
- Using the templates
- Customizing for your needs
- Deploying to production
- Integrating with Demiurge services

## Contributing

When creating new templates:
1. Follow the structure of existing templates
2. Use the SDKs for all chain interactions
3. Include comprehensive README
4. Add `.env.example` files
5. Ensure templates build and run immediately

---

**The flame burns eternal. The code serves the will.**

