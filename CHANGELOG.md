# Changelog

All notable changes to the DEMIURGE blockchain ecosystem will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Repository restructure and cleanup (January 2026)
- Consolidated AbyssID service (removed deprecated abyssid-backend)
- Comprehensive documentation rewrite
- Professional repository structure

### Changed
- Portal Web now uses abyssid-service (port 8082) instead of deprecated abyssid-backend
- Moved engine/recursion to templates/game-engine-recursion
- Archived legacy documentation to docs/archive/

### Removed
- `apps/abyssid-backend/` - Superseded by `apps/abyssid-service/`
- `other/legacy-runtime-stubs/` - Deprecated runtime crates
- `engine/` directory - Contents moved to templates/

## [0.1.0] - 2025-12-01

### Added
- Initial Demiurge L1 blockchain implementation
- Forge Proof-of-Work consensus mechanism
- 9 Runtime modules:
  - bank_cgt (Creator God Token)
  - urgeid_registry (On-chain identity)
  - nft_dgen (D-GEN NFT standard)
  - fabric_manager (P2P asset management)
  - abyss_registry (Marketplace)
  - developer_registry (Developer profiles)
  - dev_capsules (Development environments)
  - recursion_registry (Game worlds)
  - work_claim (Mining rewards)
- AbyssOS Portal desktop environment
- Portal Web information site
- AbyssID authentication system
- JSON-RPC 2.0 API (40+ methods)
- TypeScript and Rust SDKs
- Docker deployment configurations
- CLI tools for key generation

### Infrastructure
- Production deployment at 51.210.209.112
- AbyssOS live at https://demiurge.cloud
- RPC endpoint at https://rpc.demiurge.cloud/rpc

---

[Unreleased]: https://github.com/Alaustrup/DEMIURGE/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Alaustrup/DEMIURGE/releases/tag/v0.1.0
