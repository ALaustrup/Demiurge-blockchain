# Demiurge Protocol Documentation

> The Sovereign Creative Substrate - A Next-Generation Blockchain for Gaming, AI, and the Open Metaverse

**Status:** Pre-alpha, local-first. See [`STATUS.md`](../STATUS.md) for what actually works. | **Target block time:** 2s | **RPC:** `http://127.0.0.1:9944`

**Last Updated:** September 8, 2026

---

## Quick Links

| Resource | URL |
|----------|-----|
| **Local Hub** | http://localhost:3000 (after `npm run studio:start`) |
| **Local RPC** | http://127.0.0.1:9944 |
| **GitHub** | https://github.com/ALaustrup/Demiurge-Blockchain |

---

## Documentation Map

### Getting Started
| Document | Description |
|----------|-------------|
| [Quick Start](./getting-started/quick-start.md) | 5-minute introduction |
| [Installation](./getting-started/installation.md) | Set up development environment |
| [First Transaction](./getting-started/first-transaction.md) | Send your first CGT transfer |

### Architecture
| Document | Description |
|----------|-------------|
| [Overview](./architecture/README.md) | System architecture |
| [Consensus](./architecture/consensus.md) | Hybrid PoS + BFT mechanism |
| [Modules](./architecture/modules.md) | Runtime module system |
| [Network](./architecture/network.md) | LibP2P networking layer |

### Specifications
| Document | Description |
|----------|-------------|
| [DRC-369](./specifications/drc369.md) | Dynamic NFT standard with physics |
| [CGT Tokenomics](./specifications/cgt-tokenomics.md) | Token economics |
| [CVP](./specifications/cvp.md) | Consensus-Verified Polymorphism |
| [QOR ID](./specifications/qor-id.md) | Decentralized identity |
| [Physics Integration](./specifications/physics.md) | Game engine physics metadata |

### Developers
| Document | Description |
|----------|-------------|
| [Developer Guide](./developers/README.md) | Complete developer reference |
| [RPC Reference](./developers/rpc-reference.md) | All RPC methods + WebSocket subscriptions |
| [Wallet Extension](./sdk/WALLET_EXTENSION.md) | Browser wallet development |
| [TypeScript SDK](./sdk/TYPESCRIPT_SDK.md) | `@demiurge/sdk` usage |
| [Validator CLI](./developers/VALIDATOR_CLI.md) | Validator operations |
| [Unreal Engine](./sdk/unreal/) | UE5 integration guides |
| [Unity](./developers/drc-sdk/UNITY_INTEGRATION.md) | Unity integration |

### Operations
| Document | Description |
|----------|-------------|
| [Production Deployment](./deployment/PRODUCTION_DEPLOYMENT.md) | Production deployment guide |
| [Testnet Deployment](./deployment/TESTNET_DEPLOYMENT_GUIDE.md) | Testnet setup |
| [Docker Testnet](./deployment/DOCKER_TESTNET.md) | 4-node Docker testnet |
| [Monitoring](./operations/monitoring.md) | Node monitoring |

### Applications
| Document | Description |
|----------|-------------|
| [SOPHIA](./applications/sophia.md) | AI Assistant integration |
| [VYB](./applications/vyb.md) | Social network features |
| [Hub](./applications/hub.md) | Web platform |

---

## Project Structure

```
Demiurge-Blockchain/
├── framework/              # Rust blockchain core
│   ├── core/              # Runtime engine
│   ├── consensus/         # PoS + BFT consensus
│   ├── network/           # LibP2P networking
│   ├── rpc/               # JSON-RPC server + WebSocket subscriptions
│   ├── storage/           # RocksDB backend
│   └── modules/           # Runtime modules
│       ├── balances/      # CGT token
│       ├── energy/        # Feeless transactions
│       ├── drc369/        # Dynamic NFTs
│       ├── cvp/           # Security mutations
│       └── agentic/       # AI agents
├── apps/
│   ├── hub/               # Next.js web platform + block explorer
│   ├── sophia/            # SOPHIA AI interface
│   ├── wallet-extension/  # Browser wallet (Chrome/Firefox)
│   └── games/             # Game integrations
├── packages/              # TypeScript SDKs
│   ├── qor-sdk/           # Identity SDK
│   ├── drc369-sdk/        # NFT SDK
│   └── agent-foundry/     # Agent SDK
├── sdk/                   # Core protocol SDK (Ed25519, BIP39)
├── cli/                   # Command-line interface + validator commands
├── docker/                # Docker deployment configs
│   └── docker-compose.testnet.yml  # 4-node testnet
├── services/              # Backend services
├── testnet/               # Multi-node testnet
└── docs/                  # This documentation
```

---

## Current Status

### Live Systems
- **Blockchain Node:** Producing blocks every 6 seconds
- **RPC API:** 30+ methods verified and operational
- **WebSocket Subscriptions:** Real-time block/transaction streaming
- **Browser Wallet:** Manifest V3 extension for Chrome/Firefox
- **Web Platform:** https://demiurge.cloud
- **Block Explorer:** Real-time dashboard with WebSocket updates
- **Authentication:** Hybrid keypair + QOR ID

### Verified Functionality (as of February 4, 2026)
| Module | Status | Tests |
|--------|--------|-------|
| Chain Health | Operational | Passing |
| Consensus | Active | Validator staking operational |
| Balances | Operational | Transfer verified |
| Energy | Operational | Regeneration active |
| DRC-369 | Operational | Physics integration complete |
| Session Keys | Operational | Key management working |
| WebSocket | Operational | 5 subscription types |
| Wallet Extension | Ready | Ed25519 + BIP39 |

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.1.0 | Feb 4, 2026 | Browser wallet, WebSocket subscriptions, Validator CLI, Docker testnet |
| 1.0.0 | Feb 1, 2026 | Mainnet v1 launch, fresh genesis |
| 0.9.0 | Jan 2026 | DRC-369 physics integration |
| 0.8.0 | Jan 2026 | CVP security system |
| 0.7.0 | Dec 2025 | Agentic layer complete |

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

**Key Areas:**
- Game engine integrations
- SDK improvements
- Documentation
- Security research

---

**Last Updated:** February 4, 2026  
**Maintainer:** [@ALaustrup](https://github.com/ALaustrup)
