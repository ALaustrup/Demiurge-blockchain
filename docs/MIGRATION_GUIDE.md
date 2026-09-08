# 🔄 Migration Guide: Old Blockchain → New Framework

**Complete guide for migrating from Substrate-based blockchain to custom framework**

---

## 📋 Overview

We're migrating from the Substrate-based blockchain (`blockchain/`) to our custom framework (`framework/`).

**Timeline**: Phased migration over 12 weeks  
**Strategy**: Parallel development, gradual migration

---

## 🗂️ Archive Plan

### Step 1: Archive Old Blockchain

```bash
# Move old blockchain to archive
mv blockchain/ archive/substrate-blockchain/

# Update all references
# Update documentation
# Update CI/CD
```

### Step 2: Keep What Works

**Keep Active**:
- ✅ `services/qor-auth/` - Perfect, keep as-is
- ✅ `apps/` - Web platform, update integration
- ✅ `packages/` - SDKs, update blockchain client
- ✅ `docs/` - Documentation, update references

**Archive**:
- 📦 `blockchain/` - Old Substrate code
- 📦 `substrate/` - Substrate fork (if not needed)

---

## 🔄 Module Migration

### Migration Strategy

1. **Port Module Logic**
   - Extract business logic
   - Adapt to new module trait
   - Update storage calls
   - Test thoroughly

2. **Update Dependencies**
   - Remove Substrate deps
   - Use framework APIs
   - Update types
   - Fix compilation

3. **Integration**
   - Add to module registry
   - Update runtime
   - Test end-to-end
   - Deploy to testnet

---

### Module Migration Checklist

#### ✅ System Module
- [ ] Account management
- [ ] Block production
- [ ] Event system
- [ ] Extrinsic handling

#### ✅ Balances Module
- [ ] CGT token logic
- [ ] Transfer function
- [ ] Balance tracking
- [ ] Reserve system

#### ✅ QOR Identity Module
- [ ] **Status**: Keep as-is (service, not module)
- [ ] Update blockchain integration
- [ ] Maintain API compatibility

#### ✅ DRC-369 Module
- [ ] NFT minting logic
- [ ] Ownership tracking
- [ ] State management
- [ ] Resource system

#### ✅ Game Assets Module
- [ ] Multi-asset logic
- [ ] Feeless transfers
- [ ] Developer controls
- [ ] Cross-game support

#### ✅ Energy Module
- [ ] Regeneration logic
- [ ] Transaction costs
- [ ] Time-based limits
- [ ] Developer sponsorship

#### ✅ Composable NFTs Module
- [ ] Equipment system
- [ ] Nesting logic
- [ ] Slot management
- [ ] Visual composition

#### ✅ DEX Module
- [ ] Liquidity pools
- [ ] Swap logic
- [ ] LP tokens
- [ ] Price discovery

#### ✅ Fractional Assets Module
- [ ] Guild ownership
- [ ] Time scheduling
- [ ] Voting system
- [ ] Share management

#### ✅ Session Keys Module
- [ ] Temporary auth
- [ ] Permission system
- [ ] Auto-expiration
- [ ] Game integration

#### ✅ Yield NFTs Module
- [ ] Staking logic
- [ ] Revenue sharing
- [ ] Time-based rewards
- [ ] Compound interest

#### ✅ Governance Module
- [ ] Voting system
- [ ] Proposal logic
- [ ] Treasury management
- [ ] Upgrade mechanism

#### 🆕 ZK Module
- [ ] Private transactions
- [ ] Anonymous voting
- [ ] Privacy features
- [ ] Proof generation

#### ✅ Off-Chain Workers Module
- [ ] Game data fetching
- [ ] External APIs
- [ ] Scheduled tasks
- [ ] Data aggregation

---

## 🔌 Integration Updates

### QOR Auth Integration

**Current**: REST API service  
**Update**: Add blockchain client for new framework

```rust
// Update blockchain client
use demiurge_rpc::Client;

let client = Client::new("http://localhost:9944");
let result = client.call("balances_transfer", params).await?;
```

### Web Platform Integration

**Current**: Polkadot.js  
**Update**: New SDK for custom framework

```typescript
// New SDK
import { DemiurgeClient } from '@demiurge/sdk';

const client = new DemiurgeClient('ws://localhost:9944');
await client.transfer(to, amount);
```

---

## 📊 Migration Phases

### Phase 1: Foundation (Weeks 1-2)
- ✅ Framework structure
- ✅ Core runtime
- ✅ Storage layer
- ✅ Module system

### Phase 2: Core Modules (Weeks 3-4)
- Migrate System module
- Migrate Balances module
- Migrate DRC-369 module
- Migrate Game Assets module

### Phase 3: Advanced Modules (Weeks 5-6)
- Migrate Energy module
- Migrate Composable NFTs
- Migrate DEX module
- Migrate Fractional Assets

### Phase 4: Revolutionary Features (Weeks 7-8)
- Migrate Session Keys
- Migrate Yield NFTs
- Migrate Governance
- Build ZK module

### Phase 5: Integration (Weeks 9-10)
- Update QOR auth integration
- Update web platform
- Build SDKs
- Update documentation

### Phase 6: Testing & Launch (Weeks 11-12)
- Comprehensive testing
- Testnet deployment
- Bug fixes
- Mainnet launch

---

## 🧪 Testing Strategy

### Unit Tests
- Test each module independently
- Mock dependencies
- Test edge cases
- Verify correctness

### Integration Tests
- Test module interactions
- Test end-to-end flows
- Test error handling
- Test performance

### Migration Tests
- Compare old vs new behavior
- Verify data migration
- Test backward compatibility
- Validate state transitions

---

## 📝 Documentation Updates

### Update These Files
- [ ] `MASTER_ROADMAP.md` - Update blockchain track
- [ ] `README.md` - Update architecture
- [ ] All module docs - Update for new framework
- [ ] API docs - Update endpoints
- [ ] Developer guides - Update examples

### New Documentation
- [x] `ULTIMATE_BLOCKCHAIN_DESIGN.md`
- [x] `COMPONENT_MAP.md`
- [x] `ARCHITECTURE.md`
- [x] `ZK_FEATURES.md`
- [x] `MIGRATION_GUIDE.md` (this file)

---

## ⚠️ Breaking Changes

### API Changes
- RPC endpoints may change
- Transaction format may change
- Storage keys may change
- Event structure may change

### Migration Required
- Update all clients
- Migrate state data
- Update integrations
- Test thoroughly

---

## 🎯 Success Criteria

- [ ] All modules migrated
- [ ] All tests passing
- [ ] Performance targets met
- [ ] Documentation complete
- [ ] SDKs updated
- [ ] Testnet deployed
- [ ] Mainnet ready

---

## 📞 Support

**Questions?** Check:
- `docs/ARCHITECTURE.md` - Technical details
- `docs/COMPONENT_MAP.md` - Component overview
- `framework/README.md` - Framework guide

**Issues?** Create issue with `[Migration]` tag.

---

**Last Updated**: 2024-12-19  
**Status**: Planning Phase
