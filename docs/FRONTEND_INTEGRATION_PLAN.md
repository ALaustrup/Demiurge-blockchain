# 🎨 Frontend Integration Plan - Demiurge Blockchain

**Status**: Implementation in progress  
**Date**: January 2026  
**Branch**: `Epoch1`

---

## 🎯 Overview

Integrating the custom Demiurge blockchain with the Next.js frontend hub, replacing Polkadot API with our custom JSON-RPC client and adding comprehensive consensus features.

---

## ✅ Completed Components

### 1. Custom RPC Client (`demiurge-rpc.ts`) ✅
- JSON-RPC 2.0 client implementation
- Type-safe request/response handling
- Methods for all blockchain operations:
  - Chain queries (blocks, transactions)
  - Balance queries
  - Consensus queries (validators, eras, staking)
  - Energy queries
  - Session keys management

### 2. Consensus UI Components ✅

**ValidatorDashboard** (`components/consensus/ValidatorDashboard.tsx`)
- Current era information display
- Validator list with stake and commission
- Staking pool details
- Nominator information

**StakingPanel** (`components/consensus/StakingPanel.tsx`)
- Validator selection dropdown
- Nomination amount input
- Transaction submission
- Success/error handling

**ConsensusStatus** (`components/consensus/ConsensusStatus.tsx`)
- Real-time consensus status
- Era, block number, validators count
- Total stake display
- Live indicator

### 3. Energy System UI ✅

**EnergyDisplay** (`components/energy/EnergyDisplay.tsx`)
- Current energy level visualization
- Progress bar with color coding
- Regeneration rate display
- Blocks until full calculation

---

## 🚧 Integration Tasks

### High Priority

1. **Update BlockchainContext**
   - Replace Polkadot API with Demiurge RPC client
   - Update all methods to use custom RPC
   - Maintain backward compatibility where possible

2. **Add Staking Page**
   - Create `/staking` route
   - Integrate ValidatorDashboard and StakingPanel
   - Add transaction signing integration

3. **Update Wallet Page**
   - Add EnergyDisplay component
   - Show consensus status
   - Display validator information if user is validator

4. **Transaction Signing**
   - Integrate WASM wallet signing with RPC calls
   - Update transfer methods to use custom RPC
   - Add transaction status tracking

### Medium Priority

5. **Validator Dashboard Page**
   - Create `/validators` route
   - Full validator information
   - Era history
   - Reward distribution history

6. **Energy System Integration**
   - Show energy consumption for transactions
   - Energy regeneration notifications
   - Energy sponsorship UI

7. **Session Keys UI Enhancement**
   - Better visualization
   - Energy consumption tracking
   - Usage statistics

### Low Priority

8. **Analytics Dashboard**
   - Network statistics
   - Validator performance metrics
   - Era rewards history
   - Transaction fee analytics

---

## 📋 Implementation Checklist

### Phase 1: Core Integration
- [x] Create Demiurge RPC client
- [x] Create consensus UI components
- [x] Create energy display component
- [ ] Update BlockchainContext to use Demiurge RPC
- [ ] Update wallet page with new components
- [ ] Test transaction flow with custom RPC

### Phase 2: Staking Features
- [ ] Create staking page (`/staking`)
- [ ] Integrate transaction signing
- [ ] Add nomination confirmation flow
- [ ] Display staking history

### Phase 3: Validator Features
- [ ] Create validators page (`/validators`)
- [ ] Add validator registration UI
- [ ] Display validator performance
- [ ] Show era rewards

### Phase 4: Energy Integration
- [ ] Show energy consumption in transactions
- [ ] Add energy regeneration notifications
- [ ] Implement energy sponsorship UI
- [ ] Add energy usage analytics

---

## 🔧 Technical Details

### RPC Endpoints Required

**Chain Operations**:
- `chain_getHealth` - Health check
- `chain_getBlockNumber` - Latest block number
- `chain_getBlock` - Get block by number
- `chain_getLatestBlock` - Get latest block
- `chain_getTransaction` - Get transaction by hash
- `chain_getTransactionHistory` - Get account transactions
- `chain_submitTransaction` - Submit signed transaction

**Balance Operations**:
- `balances_getBalance` - Get account balance
- `balances_transfer` - Transfer tokens

**Consensus Operations**:
- `consensus_getCurrentEra` - Get current era info
- `consensus_getValidators` - Get validator set
- `consensus_getValidator` - Get validator by account
- `consensus_getStakingPool` - Get staking pool
- `consensus_nominateValidator` - Nominate validator
- `consensus_getStatus` - Get consensus status

**Energy Operations**:
- `energy_getEnergy` - Get energy for account

**Session Keys Operations**:
- `sessionKeys_getActiveKeys` - Get active session keys
- `sessionKeys_authorize` - Authorize session key

### Component Structure

```
apps/hub/src/
├── lib/
│   └── demiurge-rpc.ts          # RPC client
├── components/
│   ├── consensus/
│   │   ├── ValidatorDashboard.tsx
│   │   ├── StakingPanel.tsx
│   │   └── ConsensusStatus.tsx
│   └── energy/
│       └── EnergyDisplay.tsx
└── app/
    ├── staking/
    │   └── page.tsx              # Staking page
    └── validators/
        └── page.tsx              # Validators page
```

---

## 🎨 UX Recommendations

### 1. **Consensus Status Indicator**
- Add to header/navbar
- Show current era and block number
- Color-coded connection status
- Click to expand full details

### 2. **Energy Display**
- Show in wallet page header
- Visual progress bar
- Regeneration timer
- Low energy warnings

### 3. **Staking Flow**
- Simple validator selection
- Clear commission display
- Estimated rewards calculator
- Transaction confirmation modal

### 4. **Validator Dashboard**
- Real-time updates
- Performance metrics
- Historical data visualization
- Filter and search options

### 5. **Transaction Status**
- Real-time transaction tracking
- Block confirmation countdown
- Finality indicator
- Error handling with retry

---

## 🚀 Next Steps

1. **Complete RPC Server Implementation**
   - Implement all required RPC methods in `framework/rpc`
   - Add proper error handling
   - Add request validation

2. **Update BlockchainContext**
   - Migrate from Polkadot API to Demiurge RPC
   - Maintain API compatibility
   - Add new consensus methods

3. **Create Staking Page**
   - Build full staking interface
   - Integrate with wallet signing
   - Add transaction tracking

4. **Enhance Wallet Page**
   - Add energy display
   - Show consensus status
   - Display validator info if applicable

5. **Testing**
   - Test all RPC endpoints
   - Test transaction flows
   - Test UI components
   - Test error handling

---

**Status**: ✅ **Core Components Created**  
**Next**: Update BlockchainContext and integrate with pages

**The flame burns eternal. The code serves the will.**
