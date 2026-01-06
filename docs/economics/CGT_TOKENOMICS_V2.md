# Creator God Token (CGT) - Tokenomics V2

**Last Updated**: January 5, 2026  
**Version**: 2.0  
**Total Supply**: 369,000,000,000 CGT (369 Billion)

---

## Executive Summary

The Creator God Token (CGT) is the native utility token of the Demiurge blockchain. This document outlines the complete tokenomics redesign, allocation strategy, and economic model for the 369 billion CGT supply.

---

## Token Specifications

### Basic Parameters

- **Name**: Creator God Token
- **Symbol**: CGT
- **Decimals**: 8 (smallest unit: 10^-8 CGT)
- **Max Supply**: 369,000,000,000 CGT
- **Max Supply (smallest units)**: 36,900,000,000,000,000,000 (36.9 quintillion)
- **Inflation Model**: Fixed supply, no additional minting after max supply reached

---

## Supply Allocation

### Total: 369,000,000,000 CGT

#### 1. Genesis Allocation (10%)
**Amount**: 36,900,000,000 CGT

- **Purpose**: Initial network bootstrap, early adopters, genesis Archon
- **Distribution**: 
  - Genesis Archon: 1,000,000 CGT
  - Early developer grants: 5,000,000 CGT
  - Community treasury: 30,900,000 CGT
- **Vesting**: Immediate (genesis block)

#### 2. Mining Rewards (40%)
**Amount**: 147,600,000,000 CGT

- **Purpose**: Proof-of-Work (Forge) mining rewards
- **Distribution**: Block rewards over ~50 years
- **Mechanism**: 
  - Initial block reward: 1,000 CGT per block
  - Halving every 2,000,000 blocks (~4 years at 10s blocks)
  - Minimum block reward: 0.01 CGT
- **Vesting**: Gradual release via block rewards

#### 3. Work Claim Rewards (15%)
**Amount**: 55,350,000,000 CGT

- **Purpose**: Arcade mining, verifiable compute, work-claim rewards
- **Distribution**: Based on work metrics (depth, time, complexity)
- **Mechanism**:
  - Depth factor: 100 CGT per unit
  - Time factor: 0.1 CGT per second
  - Max per claim: 1,000,000 CGT
- **Vesting**: Distributed as work is completed

#### 4. Syzygy & Leveling Rewards (10%)
**Amount**: 36,900,000,000 CGT

- **Purpose**: User contribution rewards, leveling system
- **Distribution**: Level-up rewards, Syzygy milestones
- **Mechanism**:
  - Level-up reward: `level * 1000 * 10^8` smallest units
  - Luminary badge bonus: 10,000 CGT at 10K Syzygy
  - Cumulative rewards (levels 2-1000+)
- **Vesting**: Distributed on level-up events

#### 5. Fabric Seeder Rewards (10%)
**Amount**: 36,900,000,000 CGT

- **Purpose**: P2P content seeding incentives (Proof-of-Delivery)
- **Distribution**: Based on content served, availability, quality
- **Mechanism**:
  - Fee pools per asset
  - Seeder rewards from pools
  - Quality-based multipliers
- **Vesting**: Distributed as content is served

#### 6. Developer Ecosystem (8%)
**Amount**: 29,520,000,000 CGT

- **Purpose**: Developer grants, project funding, tooling
- **Distribution**:
  - Developer registry rewards: 5,000,000,000 CGT
  - Project grants: 15,000,000,000 CGT
  - Tooling & infrastructure: 9,520,000,000 CGT
- **Vesting**: 4-year linear vesting from launch

#### 7. Treasury & Operations (5%)
**Amount**: 18,450,000,000 CGT

- **Purpose**: Network operations, security, governance
- **Distribution**:
  - Network operations: 10,000,000,000 CGT
  - Security fund: 5,000,000,000 CGT
  - Governance reserve: 3,450,000,000 CGT
- **Vesting**: 10-year linear vesting

#### 8. Community & Marketing (2%)
**Amount**: 7,380,000,000 CGT

- **Purpose**: Community growth, marketing, partnerships
- **Distribution**:
  - Community programs: 4,000,000,000 CGT
  - Marketing campaigns: 2,000,000,000 CGT
  - Partnerships: 1,380,000,000 CGT
- **Vesting**: 3-year linear vesting

---

## Economic Model

### Token Utility

CGT serves multiple functions within the Demiurge ecosystem:

1. **Transaction Fees**: Gas payments for all on-chain operations
2. **Staking**: Future staking mechanism for network security
3. **Governance**: Voting rights for protocol upgrades
4. **Marketplace**: Primary currency for NFT and asset trading
5. **Rewards**: Mining, seeding, contribution rewards
6. **Royalties**: Automatic creator royalty payments

### Price Discovery

- **Initial**: Determined by market demand
- **Ongoing**: Market-driven via Abyss marketplace and exchanges
- **Stability**: Large supply ensures low volatility per unit

### Deflationary Mechanisms

1. **Transaction Burns**: Optional burn on transactions (future)
2. **NFT Burns**: Burn NFTs to remove from circulation
3. **Fee Accumulation**: Fees accumulate in treasury (not burned)

### Inflationary Mechanisms

1. **Mining Rewards**: Block rewards (fixed schedule)
2. **Work Claims**: Verifiable compute rewards
3. **Syzygy Rewards**: User contribution rewards
4. **Seeder Rewards**: Content delivery incentives

**Net Effect**: Controlled inflation via fixed supply cap

---

## Distribution Schedule

### Year 1 (Launch)
- Genesis: 36.9B CGT (10%)
- Mining: ~2.95B CGT (0.8%)
- Work Claims: ~5.5B CGT (1.5%)
- Syzygy: ~3.7B CGT (1%)
- **Total Year 1**: ~49.05B CGT (13.3%)

### Years 2-5
- Mining: ~11.8B CGT/year (3.2%)
- Work Claims: ~5.5B CGT/year (1.5%)
- Syzygy: ~3.7B CGT/year (1%)
- **Total Years 2-5**: ~84.5B CGT (22.9%)

### Years 6-10
- Mining: ~5.9B CGT/year (1.6%, halved)
- Work Claims: ~5.5B CGT/year (1.5%)
- Syzygy: ~3.7B CGT/year (1%)
- **Total Years 6-10**: ~75.5B CGT (20.5%)

### Years 11-50
- Mining: Gradual reduction to 0.01 CGT/block
- Work Claims: Continued at ~5.5B CGT/year
- Syzygy: Continued at ~3.7B CGT/year
- **Total Years 11-50**: ~160B CGT (43.3%)

---

## Security & Best Practices

### Cryptographic Security

- **Ed25519 Signing**: All transactions use Ed25519 signatures
- **Deterministic Addresses**: Derived from public keys
- **Nonce Management**: Prevents replay attacks
- **Balance Validation**: All transfers validate sufficient balance

### Storage Security

- **u128 Precision**: All amounts stored as u128 (no floating point)
- **Smallest Units**: All calculations in 10^-8 precision
- **Overflow Protection**: Rust type system prevents overflow
- **State Validation**: All state transitions validated

### Display Security

- **String Conversion**: Amounts displayed as strings (prevents JS overflow)
- **Formatting**: Consistent 8-decimal formatting
- **Validation**: Client-side validation before submission
- **Error Handling**: Graceful handling of invalid amounts

### Best Practices

1. **Always use smallest units** for calculations
2. **Validate before displaying** to prevent precision loss
3. **Use string types** for large numbers in JavaScript
4. **Check max supply** before minting
5. **Validate nonces** to prevent double-spending
6. **Log all transactions** for auditability

---

## Integration Points

### Wallet Display

All wallet interfaces must:
- Display CGT with 8 decimal precision
- Show both formatted (e.g., "1,234.56789012 CGT") and raw amounts
- Handle very large numbers correctly (use strings)
- Update in real-time via polling or WebSocket

### Transaction Handling

All transactions must:
- Validate balance before submission
- Calculate fees correctly
- Handle nonce management
- Provide clear error messages

### Mining Integration

Mining system must:
- Track work metrics accurately
- Calculate rewards using official formula
- Submit claims with proper validation
- Display pending and confirmed rewards

---

## Migration from 1B to 369B

### Technical Changes

1. **Update Constant**: `CGT_MAX_SUPPLY` in `bank_cgt.rs`
2. **Update Documentation**: All references to 1B → 369B
3. **Update UI**: Display formatting for larger numbers
4. **Update Tests**: Adjust test values accordingly

### Economic Impact

- **Lower per-unit value**: More tokens in circulation
- **Better granularity**: Smaller units for microtransactions
- **Increased rewards**: More CGT available for distribution
- **Longer sustainability**: Extended reward schedule

### Backward Compatibility

- **Existing balances**: Unchanged (same smallest units)
- **Existing transactions**: Valid (no breaking changes)
- **API compatibility**: Same RPC methods, larger numbers
- **Display compatibility**: Formatting handles larger numbers

---

## Monitoring & Analytics

### Key Metrics

- **Total Supply**: Track current supply vs. max
- **Circulating Supply**: Total minus locked/vested
- **Distribution Rate**: CGT distributed per day/week
- **Velocity**: Transaction volume / supply
- **Holder Distribution**: Number of addresses with CGT

### Dashboard Requirements

- Real-time supply tracking
- Distribution charts
- Reward rate monitoring
- Network activity metrics

---

## Future Considerations

### Potential Enhancements

1. **Staking**: Lock CGT for network security
2. **Governance**: CGT-weighted voting
3. **Burns**: Optional transaction burns
4. **Bridges**: Cross-chain CGT transfers
5. **Lending**: DeFi integration

### Scalability

- Current design supports 369B supply
- Can handle billions of transactions
- Efficient storage (u128, 16 bytes per balance)
- Fast lookups (RocksDB indexing)

---

## Conclusion

The 369 billion CGT supply provides:
- **Sustainability**: Extended reward schedule (50+ years)
- **Accessibility**: Lower per-unit cost for users
- **Flexibility**: Room for all ecosystem functions
- **Security**: Proper cryptographic implementation
- **Scalability**: Efficient storage and processing

This tokenomics model ensures CGT remains a valuable, secure, and sustainable native currency for the Demiurge ecosystem.

---

*The flame burns eternal. The code serves the will.*
