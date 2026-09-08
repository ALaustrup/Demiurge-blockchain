# CGT Tokenomics

CGT (Cogito) is the native token of the Demiurge Protocol.

---

## Token Overview

| Property | Value |
|----------|-------|
| Name | Cogito |
| Symbol | CGT |
| Total Supply | 13,000,000,000 |
| Decimals | 2 (100 Sparks = 1 CGT) |
| Type | Utility + Governance |

---

## Distribution

| Allocation | Amount | Percentage | Purpose |
|------------|--------|------------|---------|
| Treasury | 10,000,000,000 | 77% | Ecosystem development |
| Staking Rewards | 2,000,000,000 | 15% | Validator incentives |
| Team | 650,000,000 | 5% | Core development |
| Community | 350,000,000 | 3% | Airdrops, bounties |

### Treasury Address (Godmode)

```
0x00000000000000000000000000000000DEMIURGE
```

Genesis treasury balance: 10,000,000,000 CGT (1,000,000,000,000 Sparks). The treasury is the only pre-funded account at genesis.

---

## Utility

### 1. Transaction Energy

CGT is used to replenish energy for transactions:
- Energy regenerates automatically (feeless UX)
- Heavy users can stake CGT for faster regeneration

### 2. Staking

Validators stake CGT to participate in consensus:
- Minimum stake: 10,000 CGT
- APY: ~5% (sustainable)
- Unbonding period: 7 days

### 3. Governance

CGT holders can vote on:
- Protocol upgrades
- Parameter changes
- Treasury spending
- Consensus mechanism changes

### 4. NFT Operations

- DRC-369 minting fees (burned)
- Royalty payments
- Marketplace transactions

---

## Energy System

Demiurge uses energy instead of gas fees:

| Property | Value |
|----------|-------|
| Max Energy | 1,000 per account |
| Regeneration | 10 per block |
| Block Time | 2 seconds |
| Full Recharge | 100 blocks (~3.3 minutes) |

### Transaction Costs

| Operation | Energy Cost |
|-----------|-------------|
| CGT Transfer | 1 |
| NFT Mint | 5 |
| NFT Transfer | 2 |
| State Update | 1 |
| Complex Contract | 10 |

**Result:** Users never pay gas fees for normal usage.

---

## Staking Rewards

### Validator Rewards

```
Block Reward = Base Reward + Transaction Fees

Where:
- Base Reward is a chain parameter set so annual emission matches the schedule below (~31.7 CGT per block in year 1 at 2 s blocks)
- Transaction Fees = Sum of fees from included transactions
```

### Reward Distribution

1. Block author receives 80%
2. Remaining validators share 20%

### APY Calculation

```
APY = (Annual Rewards / Total Staked) * 100

Example:
- Total staked: 1,000,000,000 CGT
- Annual rewards: 50,000,000 CGT
- APY = 5%
```

---

## Emission Schedule

Total supply is fixed at 13,000,000,000 CGT. Staking rewards are **not** inflationary: they are paid out of the 2,000,000,000 CGT Staking Rewards allocation until it is exhausted.

| Year | Emitted from Staking bucket | Bucket remaining |
|------|-----------------------------|------------------|
| 1 | 500,000,000 | 1,500,000,000 |
| 2 | 400,000,000 | 1,100,000,000 |
| 3 | 300,000,000 | 800,000,000 |
| 4+ | Governance-set, ≤ 200,000,000 / year | — |

---

## Status

This document is the single source of truth for CGT parameters. Earlier drafts with different allocations are archived under `docs/archive/claims-2026-02/`. Values marked as chain parameters are not yet all enforced by the runtime; see `STATUS.md` at the repository root.
