# DEMIURGE Documentation

> **Genesis** — The flame burns eternal. The code serves the will.

Welcome to the official documentation for **DEMIURGE**, a sovereign Layer 1 blockchain ecosystem built for creators.

## 🚀 Quick Links

| Section | Description |
|---------|-------------|
| [Quick Start](getting-started/QUICKSTART.md) | Get started in 5 minutes |
| [Architecture](architecture/OVERVIEW.md) | System design and components |
| [API Reference](api/RPC.md) | JSON-RPC API specification |
| [Tokenomics](tokenomics/CGT.md) | Creator God Token (CGT) |
| [Deployment](deployment/NODE_SETUP.md) | Production deployment guide |
| [Applications](applications/ABYSSOS.md) | AbyssOS Portal documentation |

## 🌊 Live Services

| Service | URL | Status |
|---------|-----|--------|
| **Genesis Portal** | https://demiurge.guru | 🚧 Coming Soon |
| **AbyssOS Portal** | https://demiurge.cloud | ✅ Live |
| **GraphQL API** | https://api.demiurge.cloud/graphql | ✅ Live |
| **RPC Endpoint** | https://rpc.demiurge.cloud/rpc | ✅ Live |

## 🔥 Core Components

### Demiurge Chain
Sovereign Layer 1 blockchain built in Rust with custom **Forge Proof-of-Work** consensus.

**Key Features:**
- 3-second block time
- Custom runtime modules
- On-chain identity (AbyssID)
- Native NFT support (DRC-369)
- P2P asset distribution (Fabric)

### Runtime Modules

| Module | Purpose |
|--------|---------|
| `bank_cgt` | Creator God Token (CGT) operations |
| `abyssid_registry` | On-chain identity system |
| `drc369` | DRC-369 NFT standard |
| `fabric_manager` | P2P asset distribution |
| `marketplace` | Asset trading |
| `developer_registry` | Developer profiles |
| `dev_capsules` | Development environments |
| `recursion_registry` | Game worlds |
| `work_claim` | Mining rewards |

### Applications

**Desktop:**
- **Genesis Launcher** - Unified entry point (Qt/QML)
- **QØЯ Desktop** - Native desktop suite (Qt/QML)
- **AbyssOS Portal** - Full web-based OS environment

**Web:**
- **Portal Web** - Information and landing page
- **Demiurge.Guru** - Official portal (planned)

**Services:**
- **AbyssID Service** - Identity and authentication API
- **Abyss Gateway** - GraphQL indexer
- **Archon AI** - AI-powered assistance

## 📚 Documentation Structure

```
docs/
├── README.md              # This file
├── getting-started/       # Quick start guides
│   └── QUICKSTART.md      # 5-minute setup
├── architecture/          # System architecture
│   └── OVERVIEW.md        # Technical design
├── api/                   # API references
│   └── RPC.md             # JSON-RPC API
├── tokenomics/            # Token economics
│   └── CGT.md             # CGT specification
├── deployment/            # Deployment guides
│   ├── NODE_SETUP.md      # Production node setup
│   ├── RPC_TROUBLESHOOTING.md # RPC debugging
│   └── DEMIURGE_GURU.md   # Demiurge.Guru deployment
├── applications/          # App documentation
│   └── ABYSSOS.md         # AbyssOS Portal
└── archive/               # Historical documentation
```

## 🎨 Genesis Theme

The entire Demiurge ecosystem uses the unified **Genesis Launcher Theme**:

**Colors:**
- Void: `#050505` (primary background)
- Flame Orange: `#FF3D00` (primary accent)
- Cipher Cyan: `#00FFC8` (secondary accent)
- Glass: `#0A0A0A` (containers)

See [Genesis Theme Documentation](../apps/abyssos-portal/GENESIS_THEME.md) for details.

## 🛠️ Development

### Prerequisites
- **Rust** 1.70+
- **Node.js** 20+ with **pnpm** 9+
- **Git**

### Build Chain
```bash
cargo build --release -p demiurge-chain
```

### Start Services
```bash
# Chain node
./target/release/demiurge-chain

# Frontend applications
cd apps/abyssos-portal && pnpm dev  # Port 5173
cd apps/portal-web && pnpm dev       # Port 3000
```

## 🔗 Related Repositories

- **Main**: https://github.com/Alaustrup/DEMIURGE
- **SDK**: TypeScript/Rust SDKs in `/sdk`
- **Templates**: Game/app templates in `/templates`

## 📮 Support

- **Documentation Issues**: Check the [Archive](archive/) for historical context
- **RPC Issues**: See [RPC Troubleshooting](deployment/RPC_TROUBLESHOOTING.md)
- **Server Setup**: See [Node Setup](deployment/NODE_SETUP.md)
- **Deployment**: See [Demiurge.Guru Guide](deployment/DEMIURGE_GURU.md)

---

**Last updated: January 8, 2026**  
**Theme: Genesis Launcher v1.0**

*The void awaits. Build with purpose.*
