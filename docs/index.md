# Documentation Index

**Last Updated**: January 5, 2026

## Quick Start

- **[Current State](CURRENT_STATE.md)** - Production status and current features
- **[Features](FEATURES.md)** - Complete feature list for AbyssOS v1.1
- **[Getting Started](network/QUICK_START.md)** - Quick setup guide
- **[Deployment Guide](deployment/README_NODE0.md)** - Server deployment instructions

## Core Documentation

### Architecture
- [Architecture Overview](overview/ARCHITECTURE_DEMIURGE_CURRENT.md) - Current system architecture
- [Runtime Modules](overview/RUNTIME.md) - Complete runtime module documentation (9 modules)
- [Consensus](overview/CONSENSUS.md) - Consensus mechanism details

### Identity & Authentication
- [AbyssID Authentication](ABYSSID_AUTHENTICATION.md) - Username-based auth with seed phrase recovery
- [AbyssID Universal Auth](ABYSSID_UNIVERSAL_AUTH.md) - AbyssOS integration and sync
- [UrgeID System](overview/RUNTIME.md#2-urgeid-registry-module-urgeid_registry) - On-chain identity system

### Tokens & Economics
- [CGT Policy](economics/CGT_POLICY.md) - Creator God Token policy and economics
- [Tokens Overview](overview/TOKENS_CGT_DGEN.md) - CGT and D-GEN NFT standards
- [Bank CGT Module](modules/BANK_CGT.md) - CGT module implementation

### Applications
- [AbyssOS Portal](apps/ABYSSOS_PORTAL.md) - Desktop environment documentation
- [Fracture Portal](PROJECT_OVERVIEW.md#applications) - Web portal features
- [Features](FEATURES.md) - Complete feature list

### API Reference
- [RPC API](api/RPC.md) - JSON-RPC API documentation (40+ methods)
- [GraphQL API](api/GRAPHQL.md) - GraphQL schema and queries (Abyss Gateway)
- [Work Claim API](api/WORK_CLAIM.md) - Work claim module API

### Runtime Modules
- [Runtime Modules Overview](overview/RUNTIME.md) - Complete documentation for all 9 modules
  - [Bank CGT](overview/RUNTIME.md#1-bank-cgt-module-bank_cgt) - Token operations
  - [UrgeID Registry](overview/RUNTIME.md#2-urgeid-registry-module-urgeid_registry) - Identity system
  - [NFT D-GEN](overview/RUNTIME.md#3-nft-d-gen-module-nft_dgen) - NFT standard
  - [Fabric Manager](overview/RUNTIME.md#4-fabric-manager-module-fabric_manager) - P2P asset management
  - [Abyss Registry](overview/RUNTIME.md#5-abyss-registry-module-abyss_registry) - Marketplace
  - [Developer Registry](overview/RUNTIME.md#6-developer-registry-module-developer_registry) - Developer profiles
  - [Dev Capsules](overview/RUNTIME.md#7-dev-capsules-module-dev_capsules) - Development environments
  - [Recursion Registry](overview/RUNTIME.md#8-recursion-registry-module-recursion_registry) - Game worlds
  - [Work Claim](overview/RUNTIME.md#9-work-claim-module-work_claim) - Mining rewards

### Development
- [Development Status](development/DEVELOPMENT_STATUS.md) - Current development status
- [Docker Support](../docker-compose.dev.yml) - Docker Compose for local development
- [Testing Guide](operations/TESTING_GUIDE.md) - Testing procedures
- [Technical Reference](TECHNICAL_REFERENCE.md) - Technical implementation details

### Deployment
- [Server Setup](deployment/SERVER_SETUP_OVERVIEW.md) - Server setup overview
- [Ubuntu 24.04 Deployment](deployment/UBUNTU_24.04_DEPLOYMENT.md) - Ubuntu deployment guide
- [Chain Deployment](deployment/CHAIN_DEPLOYMENT.md) - Chain node deployment
- [AbyssID Deployment](deployment/ABYSSID_DEPLOYMENT.md) - AbyssID service deployment
- [AbyssOS Deployment](deployment/ABYSSOS_DEPLOYMENT.md) - Portal deployment

### Operations
- [Monitoring](operations/MONITORING.md) - System monitoring
- [Chain Node Info](operations/CHAIN_NODE_INFO.md) - Node information
- [Media Files Setup](operations/MEDIA_FILES_SETUP.md) - Media file configuration
- [Expected Log Output](operations/EXPECTED_LOG_OUTPUT.md) - Logging reference

### Network
- [Devnet](network/DEVNET.md) - Development network setup
- [Testnet](network/TESTNET.md) - Test network information
- [Mainnet](network/MAINNET.md) - Main network information

## Live Services

- **AbyssOS Portal**: https://demiurge.cloud
- **RPC Endpoint**: https://rpc.demiurge.cloud/rpc
- **AbyssID API**: https://demiurge.cloud/api/abyssid (production) or http://localhost:3001/api/abyssid (dev)

## Recent Updates (January 5, 2026)

### Documentation Improvements
- ✅ Complete runtime module documentation (all 9 modules)
- ✅ Comprehensive AbyssID authentication guide
- ✅ Updated current state with latest features
- ✅ Enhanced API documentation structure

### New Features
- ✅ AbyssID login flow with seed phrase recovery
- ✅ Complete runtime module system (9 modules)
- ✅ Comprehensive RPC API (40+ methods)
- ✅ GraphQL gateway for chat and social features
- ✅ Developer registry with auto-mint DEV Badge NFTs
- ✅ Work claim mining system
- ✅ Recursion world registry

### Improvements
- ✅ Enhanced identity system (UrgeID + AbyssID)
- ✅ Improved transaction history tracking
- ✅ Better error handling and validation
- ✅ Runtime versioning and integrity checks

## Documentation Structure

```
docs/
├── api/              # API documentation
│   ├── RPC.md       # JSON-RPC API reference
│   ├── GRAPHQL.md   # GraphQL API reference
│   └── WORK_CLAIM.md # Work claim API
├── apps/             # Application documentation
│   └── ABYSSOS_PORTAL.md # AbyssOS desktop environment
├── deployment/      # Deployment guides
│   ├── README_NODE0.md
│   ├── CHAIN_DEPLOYMENT.md
│   ├── ABYSSID_DEPLOYMENT.md
│   └── ABYSSOS_DEPLOYMENT.md
├── development/     # Development guides
│   └── DEVELOPMENT_STATUS.md
├── economics/       # Economic models and policies
│   └── CGT_POLICY.md
├── modules/        # Runtime module documentation
│   └── BANK_CGT.md
├── network/         # Network setup guides
│   ├── DEVNET.md
│   ├── TESTNET.md
│   └── MAINNET.md
├── operations/      # Operational procedures
│   ├── MONITORING.md
│   └── TESTING_GUIDE.md
├── overview/        # High-level overviews
│   ├── ARCHITECTURE_DEMIURGE_CURRENT.md
│   ├── RUNTIME.md  # Complete runtime module docs
│   └── CONSENSUS.md
├── ABYSSID_AUTHENTICATION.md # AbyssID auth guide
├── ABYSSID_UNIVERSAL_AUTH.md # AbyssOS integration
├── CURRENT_STATE.md # Production status
├── FEATURES.md      # Feature list
├── PROJECT_OVERVIEW.md # Project overview
└── TECHNICAL_REFERENCE.md # Technical details
```

## Getting Help

- **Documentation**: Browse this index for comprehensive guides
- **RPC Endpoint**: https://rpc.demiurge.cloud/rpc
- **AbyssOS Portal**: https://demiurge.cloud
- **Issues**: Check GitHub Issues (if applicable)

## Contributing

Documentation improvements are welcome! When updating documentation:

1. Keep information current and accurate
2. Update "Last Updated" dates
3. Link related documentation
4. Include code examples where helpful
5. Follow the existing documentation structure

---

*The flame burns eternal. The code serves the will.*
