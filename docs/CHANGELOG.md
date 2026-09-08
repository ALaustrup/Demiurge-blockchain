# Changelog

All notable changes to the Demiurge Protocol.

---

## [1.1.0] - 2026-02-04

### Production Suite Release

**Browser Wallet Extension**
- Manifest V3 Chrome/Firefox extension
- Secure key management with Ed25519 + PBKDF2/AES-256-GCM encryption
- BIP39 mnemonic support (12/24 word recovery phrases)
- Complete popup UI: create, import, unlock, send, approve screens
- `window.demiurge` provider injection for dApp integration
- Auto-lock security with configurable timeout
- Multi-network support (mainnet, testnet, devnet)

**WebSocket Subscriptions**
- Real-time blockchain event streaming
- `chain_subscribeNewBlocks` - Live block notifications
- `chain_subscribeFinalizedBlocks` - Finalized block events
- `chain_subscribeNewPendingTransactions` - Transaction pool updates
- `consensus_subscribeValidatorStatus` - Validator state changes
- `cvp_subscribeThreats` - CVP threat detection alerts
- Subscription manager with broadcast channels

**Validator CLI Commands**
- `demiurge validator list` - List all validators
- `demiurge validator info <address>` - Validator details
- `demiurge validator register` - Register as validator
- `demiurge validator stake <amount>` - Stake CGT
- `demiurge validator unstake <amount>` - Unstake CGT
- `demiurge validator claim-rewards` - Claim pending rewards
- `demiurge validator set-commission <rate>` - Update commission

**New RPC Methods**
- `consensus_registerValidator` - Register validator on-chain
- `consensus_claimRewards` - Claim staking rewards
- `consensus_getPendingRewards` - Query pending rewards
- `consensus_getStakingStatus` - Get staking information
- `consensus_updateCommission` - Update validator commission
- `consensus_stake` - Stake CGT to validator
- `consensus_unstake` - Unstake CGT from validator

**Docker Testnet Deployment**
- 4-node Docker Compose testnet configuration
- Nginx RPC load balancer with WebSocket support
- Prometheus metrics collection
- Grafana monitoring dashboards
- Health checks and automatic restart

**SDK Enhancements**
- Ed25519 cryptographic signatures via `@noble/ed25519`
- BIP39 mnemonic generation via `@scure/bip39`
- Wallet class with generate, import, sign, verify methods
- Async signing support for browser environments

**Block Explorer Enhancements**
- Real-time block/transaction subscriptions
- Live TPS and block time statistics
- WebSocket connection status indicator
- Toggle between real-time and polling modes

---

## [1.0.0] - 2026-02-01

### Mainnet v1 Launch

**Core Infrastructure**
- Fresh genesis with clean state
- Block production every 6 seconds
- Hybrid PoS + BFT consensus
- 22+ verified RPC methods

**Modules**
- Balances: CGT transfers, starter bonus, minting
- Energy: Feeless transaction system
- DRC-369: Dynamic NFTs with physics integration
- Session Keys: Temporary authorization
- CVP: Consensus-Verified Polymorphism (security)
- Agentic: AI agent system

**New Features**
- Physics properties for DRC-369 NFTs
- Game engine integration (UE5, Unity)
- Interior mutability storage pattern
- Balance transfer RPC with verification

**Infrastructure**
- RPC endpoint: rpc.demiurge.cloud:9944
- Web platform: demiurge.cloud
- Testnet deployment scripts

---

## [0.9.0] - 2026-01-25

### DRC-369 Physics Integration

- Added physics storage key to DRC-369
- Implemented get_physics, set_physics, has_physics
- Added RPC methods for physics operations
- Created physics validation system

---

## [0.8.0] - 2026-01-20

### CVP Security System

- Bytecode mutation engine
- ZK equivalence proofs
- Attack pattern detection
- Emergency mutation triggers

---

## [0.7.0] - 2025-12-15

### Agentic Layer

- Agent DID system
- Capability-based permissions
- Agent Foundry SDK
- Dual registration patterns (instant keys + pre-registered)

---

## [0.6.0] - 2025-11-01

### Identity System

- QOR ID specification
- Session key management
- Hybrid authentication (keypair + QOR ID)
- Profile management

---

## [0.5.0] - 2025-10-01

### NFT Standard

- DRC-369 specification
- Dynamic state storage
- Nested composition
- Soulbound tokens

---

## [0.4.0] - 2025-09-01

### Token Economics

- CGT token implementation
- Energy-based fee system
- Staking mechanism
- Reward distribution

---

## [0.3.0] - 2025-08-01

### Consensus Engine

- Hybrid PoS + BFT
- Validator registration
- Slashing conditions
- Era-based rewards

---

## [0.2.0] - 2025-07-01

### Network Layer

- LibP2P integration
- Gossipsub messaging
- Kademlia discovery
- Transaction pool

---

## [0.1.0] - 2025-06-01

### Initial Release

- Core runtime engine
- RocksDB storage
- Basic RPC server
- Block production

---

## Upgrade Notes

### Migrating to 1.0.0

1. Update SDK packages:
   ```bash
   npm install @demiurge/sdk@latest
   ```

2. Update RPC endpoint:
   ```typescript
   const client = new DemiurgeClient({
     rpcUrl: 'https://rpc.demiurge.cloud:9944' // Note: port 9944
   });
   ```

3. Physics API (new):
   ```typescript
   const physics = await client.drc369.getPhysics(tokenId);
   ```

---

## Versioning

This project uses [Semantic Versioning](https://semver.org/):
- **MAJOR**: Incompatible API changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)
