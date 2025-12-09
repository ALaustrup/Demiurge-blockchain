# Documentation Index

**Last Updated**: December 2024

## Quick Start

- **[Current State](CURRENT_STATE.md)** - Production status and current features
- **[Features](FEATURES.md)** - Complete feature list for AbyssOS v1.1
- **[Getting Started](network/QUICK_START.md)** - Quick setup guide
- **[Deployment Guide](deployment/README_NODE0.md)** - Server deployment instructions

## Core Documentation

### Architecture
- [Architecture Overview](overview/ARCHITECTURE_DEMIURGE_CURRENT.md) - Current system architecture
- [Runtime Modules](overview/RUNTIME.md) - Runtime module documentation
- [Consensus](overview/CONSENSUS.md) - Consensus mechanism details

### Tokens & Economics
- [CGT Policy](economics/CGT_POLICY.md) - Creator God Token policy and economics
- [Tokens Overview](overview/TOKENS_CGT_DGEN.md) - CGT and D-GEN NFT standards
- [Bank CGT Module](modules/BANK_CGT.md) - CGT module implementation

### Applications
- [AbyssOS Portal](apps/ABYSSOS_PORTAL.md) - Desktop environment documentation
- [Features](FEATURES.md) - Complete feature list

### API Reference
- [RPC API](api/RPC.md) - JSON-RPC API documentation
- [Work Claim API](api/WORK_CLAIM.md) - Work claim module API

### Development
- [Development Status](development/DEVELOPMENT_STATUS.md) - Current development status
- [Docker Support](../docker-compose.dev.yml) - Docker Compose for local development
- [Testing Guide](operations/TESTING_GUIDE.md) - Testing procedures

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

### Network
- [Devnet](network/DEVNET.md) - Development network setup
- [Testnet](network/TESTNET.md) - Test network information
- [Mainnet](network/MAINNET.md) - Main network information

## Live Services

- **AbyssOS Portal**: https://demiurge.cloud
- **RPC Endpoint**: https://rpc.demiurge.cloud/rpc
- **AbyssID API**: https://demiurge.cloud/api/abyssid

## Recent Updates (v1.1)

### New Features
- Glowing orb start button with jewel-like texture
- Categorical system menu for all applications
- 500GB per-user file storage with drag-and-drop upload
- Auto-minting of uploaded files as DRC-369 NFTs
- Cross-chain NFT swapping (Ethereum, Solana, Polygon)
- NEON Player with full video/audio support
- Document editor for PDFs and text files
- 5000 CGT sign-up bonus (on-chain minting)
- CGT send restrictions until NFT minted/swapped

### Improvements
- Removed bottom toolbar (replaced with system menu)
- Enhanced window management (minimize, maximize, resize)
- Improved RPC connection handling
- Wallet integration with AbyssID
- Background music playback mode

## Documentation Structure

```
docs/
├── api/              # API documentation
├── apps/             # Application documentation
├── architecture/     # Architecture diagrams and designs
├── chain/           # Chain-specific documentation
├── deployment/      # Deployment guides
├── design/          # Design documents
├── development/     # Development guides
├── economics/       # Economic models and policies
├── modules/        # Runtime module documentation
├── network/         # Network setup guides
├── operations/      # Operational procedures
├── overview/        # High-level overviews
└── pantheon-lore/   # Lore and narrative
```
