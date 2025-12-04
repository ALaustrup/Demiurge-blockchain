# Demiurge Documentation

Welcome to the comprehensive documentation for the Demiurge L1 blockchain ecosystem.

## Quick Start

- **New to Demiurge?** Start with the [Documentation Index](index.md)
- **Want to deploy?** See [Node0 Deployment Guide](deployment/README_NODE0.md)
- **Want to use AbyssOS?** See [AbyssOS Portal](apps/ABYSSOS_PORTAL.md)

## Live Services

- **AbyssOS Portal**: https://demiurge.cloud
  - Full-screen desktop environment for Demiurge Blockchain
  - Features: Boot screen, AbyssID auth, Chain Ops, window management
  
- **RPC Endpoint**: https://rpc.demiurge.cloud/rpc
  - JSON-RPC 2.0 API
  - HTTPS enabled with CORS support

## Documentation Structure

### [Overview](overview/)
Core architecture, runtime, consensus, and token documentation.

- [Architecture Overview](overview/ARCHITECTURE_DEMIURGE_CURRENT.md)
- [Runtime Modules](overview/RUNTIME.md)
- [Consensus](overview/CONSENSUS.md)
- [Tokens: CGT & D-GEN](overview/TOKENS_CGT_DGEN.md)

### [Applications](apps/)
User-facing applications and interfaces.

- [AbyssOS Portal](apps/ABYSSOS_PORTAL.md) - Desktop environment

### [API & Protocol](api/)
API documentation and protocol specifications.

- [JSON-RPC API](api/RPC.md)
- [Work Claim API](api/WORK_CLAIM.md)

### [Network](network/)
Network setup and configuration guides.

- [Devnet Setup](network/DEVNET.md)
- [Quick Start Guide](network/QUICK_START.md)
- [Testnet](network/TESTNET.md) *(coming soon)*
- [Mainnet](network/MAINNET.md) *(coming soon)*

### [Deployment](deployment/)
Production deployment guides and server setup.

- [Node0 Deployment Guide](deployment/README_NODE0.md) - **Current production**
- [AbyssOS Deployment](deployment/ABYSSOS_DEPLOYMENT.md) - HTTPS deployment
- [RC0 Deployment](deployment/DEPLOYMENT_RC0.md)
- [Complete Deployment Instructions](deployment/COMPLETE_DEPLOYMENT_INSTRUCTIONS.md)

### [Runtime Modules](modules/)
Detailed documentation for each runtime module.

- [Bank CGT Module](modules/BANK_CGT.md)
- [Work Claim Module](modules/WORK_CLAIM_MODULE.md)

### [Operations](operations/)
Operational guides for node operators.

- [Monitoring & Health Checks](operations/MONITORING.md)
- [Snapshots & Backups](operations/SNAPSHOTS_BACKUPS.md)
- [Automated Updates Guide](operations/AUTOMATED_UPDATES_GUIDE.md)
- [Testing Guide](operations/TESTING_GUIDE.md)

### [Design Documents](design/)
Design specifications and implementation details.

- [Economy & CGT Design](design/ECONOMY_DESIGN.md)
- [DGEN-NFT Architecture](design/NFT_ARCHITECTURE_DGEN.md)
- [Fracture V1 Implementation](design/FRACTURE_V1_IMPLEMENTATION.md)

### [Development](development/)
Development milestones, phases, and status.

- [Development Status](development/DEVELOPMENT_STATUS.md)
- [Milestone 7: Convergence](development/MILESTONE_7_CONVERGENCE.md) - **Latest**
- [Milestone 6: Genesis](development/MILESTONE_6_GENESIS.md)
- [Milestone 5: Awakening](development/MILESTONE_5_AWAKENING.md)

## Current Status

### Production Deployment

- **Node0**: Ubuntu 24.04 server at 51.210.209.112
- **Demiurge Node**: Running via systemd (`demiurge-node0.service`)
- **RPC Server**: Listening on port 8545, proxied via nginx with HTTPS
- **AbyssOS**: Deployed at `/var/www/abyssos-portal` with HTTPS
- **SSL**: Let's Encrypt certificates (auto-renewal enabled)

### Recent Milestones

- **Milestone 7: Convergence** - Real Fabric integration, Operator roles, Archon Action Bridge
- **Milestone 6: Genesis** - Genesis mode, snapshot system, ritual framework
- **Milestone 5: Awakening** - Fracture Portal, chat system, Archon AI

## Contributing

Documentation improvements are welcome! Please ensure:

1. All documentation lives in `docs/` subdirectories
2. Component-specific READMEs stay in their directories
3. Cross-references are updated when moving files
4. Documentation reflects current implementation state

## License

Part of the Demiurge Blockchain ecosystem.
