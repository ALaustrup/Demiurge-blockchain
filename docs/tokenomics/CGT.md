# Creator God Token (CGT)

The native token of the DEMIURGE blockchain.

## Specifications

| Property | Value |
|----------|-------|
| **Name** | Creator God Token |
| **Symbol** | CGT |
| **Decimals** | 8 |
| **Max Supply** | 369,000,000,000 (369 billion) |
| **Storage** | u128 in smallest units |

---

## Token Economics

### Design Philosophy

CGT is a **utility-first** token designed to:
- Enable platform functionality without feeling extractive
- Fund ecosystem development through sustainable fee distribution
- Reward long-term holders through staking
- Maintain value through balanced inflation/deflation

---

## Fee Structure

### Transaction Fees

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Fee Rate** | 0.1% | Percentage of transaction value |
| **Minimum Fee** | 0.0001 CGT | Prevents dust spam |
| **Maximum Fee** | 100 CGT | Caps fees on large transfers |

```
Fee = max(0.0001 CGT, min(amount × 0.1%, 100 CGT))
```

### Fee Distribution (70/20/10 Split)

All transaction fees are distributed as follows:

| Destination | Share | Purpose |
|-------------|-------|---------|
| **Ecosystem Treasury** | 70% | Development, infrastructure, grants, AbyssID storage upgrades |
| **Token Burn** | 20% | Deflationary pressure, offset staking inflation |
| **Validator Rewards** | 10% | Incentivize network security |

```
┌─────────────────┐
│ Transaction Fee │
└────────┬────────┘
         │
    ┌────┴────┐
    │  Split  │
    └────┬────┘
         │
    ┌────┼────┬────────────┐
    │    │    │            │
    ▼    ▼    ▼            ▼
  70%  20%  10%
   │    │    │
   ▼    ▼    ▼
Treasury Burn Validators
```

---

## Inflation & Deflation

### Inflationary Sources
- **Staking Rewards**: ~5% APY (reduced from 10%)
- **New User Bonus**: 5,000 CGT per registration
- **Mining/Work Rewards**: Variable based on contribution

### Deflationary Sources
- **Fee Burn**: 20% of all transaction fees
- **Premium Purchases**: Subscription fees to treasury
- **NFT Minting**: Partial fee burn

### Target: Net Neutral to Slight Deflation

With moderate network activity, the 20% fee burn is designed to roughly offset staking inflation, creating a stable or slightly deflationary token over time.

---

## Staking

### Parameters

| Parameter | Value |
|-----------|-------|
| **APY** | 5% (500 basis points) |
| **Minimum Stake** | 1 CGT |
| **Maximum Stake** | 10,000,000 CGT per address |
| **Lock Period** | 7 days (for unstaking) |
| **Reward Interval** | 1 hour |

### How It Works

1. **Stake CGT** - Lock tokens to start earning rewards
2. **Earn Rewards** - Rewards accrue every hour based on staked amount
3. **Claim Anytime** - Claim accumulated rewards without unstaking
4. **Request Unstake** - Start 7-day lock period
5. **Complete Unstake** - After lock period, tokens return to balance

---

## Premium Tiers

Users can unlock premium features by paying CGT or staking:

### Tier Structure

| Tier | Monthly Cost | OR Stake | Storage | Features |
|------|-------------|----------|---------|----------|
| **Free** | 0 CGT | - | 2 GB | Standard features |
| **Archon** | 100 CGT | 10,000 CGT | 10 GB | Priority processing, badges, early access |
| **Genesis** | 500 CGT | 100,000 CGT | 100 GB | All Archon features + exclusive themes, governance bonus, custom handle |

### Premium Features

| Feature | Free | Archon | Genesis |
|---------|------|--------|---------|
| AbyssID Storage | 2 GB | 10 GB | 100 GB |
| Transaction Priority | Standard | Priority | Highest |
| Profile Badge | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ✅ | ✅ |
| Early Access | ❌ | ✅ | ✅ |
| Exclusive Themes | ❌ | ❌ | ✅ |
| Governance Bonus | ❌ | ❌ | ✅ |
| Custom Handle | ❌ | ❌ | ✅ |

---

## Token Uses

1. **Transaction Fees** - Pay for on-chain operations
2. **Staking** - Earn rewards by securing the network
3. **Premium Subscriptions** - Unlock enhanced features
4. **Content Delivery** - Reward Fabric seeders (Proof-of-Delivery)
5. **Compute Rewards** - Pay Forge compute workers
6. **Marketplace** - Denominate Abyss marketplace prices
7. **Royalties** - Route creator royalties
8. **Governance** - Vote on treasury spending (future)

---

## Minting

### Authorized Modules

Only these modules can mint CGT:
- `forge` - Block production rewards
- `fabric_manager` - Seeding rewards
- `system` - System operations
- `abyssid_registry` - Level rewards
- `abyssid_level_rewards` - Achievement rewards
- `work_claim` - Mining rewards
- `cgt_staking` - Staking rewards

### New User Bonus
- **Amount:** 5,000 CGT per new AbyssID registration
- **Purpose:** Enable initial platform usage

### Supply Enforcement
- Max supply enforced at mint time
- Minting fails if it would exceed 369 billion CGT

---

## Restrictions

### Send Restriction

New users cannot send CGT until they have:
- Minted a DRC-369 NFT, OR
- Swapped an NFT from another chain

**Rationale:** Encourages engagement, prevents bonus abuse.

---

## Treasury

The ecosystem treasury is funded by:
- 70% of all transaction fees
- Premium subscription payments

Treasury funds are used for:
- Protocol development
- Infrastructure upgrades (servers, storage)
- Community grants
- AbyssID storage expansion
- Security audits

### Governance (Future)

Treasury spending will be governed by CGT holders:
- Submit proposals by staking CGT
- 1 CGT = 1 vote (with quadratic voting option)
- 10% quorum required
- 7-day timelock on approved proposals

---

## Implementation

### Core Files

| File | Description |
|------|-------------|
| `chain/src/runtime/bank_cgt.rs` | Balance tracking, transfers |
| `chain/src/runtime/treasury.rs` | Fee distribution, treasury management |
| `chain/src/runtime/premium.rs` | Premium tier system |
| `chain/src/runtime/cgt_staking.rs` | Staking mechanics |

### Constants

```rust
// Token specs
pub const CGT_MAX_SUPPLY: u128 = 369_000_000_000_00000000;
pub const CGT_DECIMALS: u8 = 8;
pub const CGT_SYMBOL: &str = "CGT";
pub const CGT_NAME: &str = "Creator God Token";

// Fee structure
pub const FEE_RATE_BPS: u64 = 10;           // 0.1%
pub const MIN_FEE: u128 = 10_000;           // 0.0001 CGT
pub const MAX_FEE: u128 = 10_000_000_000;   // 100 CGT

// Fee distribution
pub const TREASURY_SHARE_BPS: u64 = 7000;   // 70%
pub const BURN_SHARE_BPS: u64 = 2000;       // 20%
pub const VALIDATOR_SHARE_BPS: u64 = 1000;  // 10%

// Staking
pub const BASE_APY_BPS: u64 = 500;          // 5%
pub const UNSTAKE_LOCK_PERIOD: u64 = 604800; // 7 days

// Premium tiers
pub const ARCHON_MONTHLY_COST: u128 = 100_00000000;     // 100 CGT
pub const GENESIS_MONTHLY_COST: u128 = 500_00000000;    // 500 CGT
pub const ARCHON_STAKE_REQUIREMENT: u128 = 10_000_00000000;
pub const GENESIS_STAKE_REQUIREMENT: u128 = 100_000_00000000;
```

---

*The flame burns eternal. The code serves the will.*

*Last updated: January 7, 2026*
