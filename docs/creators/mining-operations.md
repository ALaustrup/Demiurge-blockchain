# ⛏️ Mining Operations Guide

**Complete guide to mining, staking, and earning rewards on Demiurge**

> *"The ancient ritual of creation rewards those who serve the chain."*

---

## 🎯 Overview

Demiurge uses **Proof of Stake (PoS)** consensus, not traditional mining. Instead, you can:

- **Stake CGT** - Become a validator or nominator
- **Earn Rewards** - Receive staking rewards
- **Run Validator** - Operate a validator node
- **Nominate Validators** - Delegate stake to validators

---

## 💎 Staking Basics

### What is Staking?

Staking is the process of locking CGT tokens to:
- **Secure the network** - Validators produce blocks
- **Earn rewards** - Receive staking rewards
- **Participate in governance** - Vote on proposals

### Staking Roles

1. **Validator** - Produces blocks, requires significant stake
2. **Nominator** - Delegates stake to validators, earns rewards

---

## 🏛️ Becoming a Validator

### Requirements

- **Minimum Stake** - 1,000,000 CGT (100,000,000 Sparks)
- **Technical Setup** - Run validator node 24/7
- **Uptime** - Maintain high uptime (>99%)
- **Commission** - Set commission rate (0-100%)

### Step 1: Set Up Validator Node

```bash
# Build validator node
cd framework
cargo build --release

# Start validator
./target/release/demiurge-node \
  --validator \
  --name "My Validator" \
  --data-dir ~/validator-data \
  --rpc-addr 127.0.0.1:9944 \
  --p2p-addr 0.0.0.0:30333
```

### Step 2: Register as Validator

```typescript
import { DemiurgeRpcClient } from '@demiurge/rpc-client';

const client = new DemiurgeRpcClient('https://rpc.demiurge.cloud');

// Register validator
await client.registerValidator({
  address: '0x1234...',
  stake: '1000000000000000000000000', // 1M CGT
  commission: 5, // 5% commission
  validator_key: '0x...'
});
```

### Step 3: Monitor Performance

```typescript
// Get validator status
const validator = await client.getValidator('0x1234...');
console.log('Stake:', validator.stake);
console.log('Commission:', validator.commission, '%');
console.log('Uptime:', validator.uptime, '%');
console.log('Blocks produced:', validator.blocks_produced);
```

---

## 👥 Becoming a Nominator

### What is Nominating?

Nominating allows you to:
- **Delegate stake** to validators
- **Earn rewards** without running a node
- **Support network** security

### Step 1: Choose Validator

```typescript
// Get all validators
const validators = await client.getValidators();

// Filter by criteria
const goodValidators = validators.filter(v => 
  v.uptime > 99 && 
  v.commission < 10 &&
  v.status === 'active'
);

console.log('Good validators:', goodValidators);
```

### Step 2: Nominate Validator

```typescript
// Nominate validator
await client.nominateValidator({
  nominator: '0x1234...',
  validator: '0x5678...',
  stake: '100000000000000000000000', // 100K CGT
  signature: '0x...'
});
```

### Step 3: Monitor Rewards

```typescript
// Get staking pool
const pool = await client.getStakingPool('0x5678...');
const myStake = pool.nominators.find(n => n.address === '0x1234...');
console.log('My stake:', myStake.stake);
console.log('My share:', (myStake.stake / pool.total_stake) * 100, '%');
```

---

## 💰 Earning Rewards

### Reward Distribution

Rewards are distributed:
- **Per Era** - Every era (approximately 24 hours)
- **Proportional** - Based on stake percentage
- **Automatic** - No claim needed

### Calculate Expected Rewards

```typescript
function calculateRewards(
  totalStake: bigint,
  myStake: bigint,
  eraRewards: bigint,
  validatorCommission: number
): bigint {
  // Calculate share
  const share = (myStake * BigInt(10000)) / totalStake; // Basis points
  
  // Calculate rewards before commission
  const rewardsBeforeCommission = (eraRewards * share) / BigInt(10000);
  
  // Apply validator commission
  const commission = (rewardsBeforeCommission * BigInt(validatorCommission)) / BigInt(100);
  
  // Return rewards after commission
  return rewardsBeforeCommission - commission;
}

const eraRewards = BigInt('1000000000000000000000'); // 10K CGT per era
const myRewards = calculateRewards(
  pool.total_stake,
  myStake.stake,
  eraRewards,
  validator.commission
);

console.log('Expected rewards:', Number(myRewards) / 100, 'CGT');
```

### View Era Rewards

```typescript
// Get current era
const era = await client.getCurrentEra();
console.log('Current era:', era.era);

// Get era rewards
const rewards = await client.getEraRewards(era.era);
console.log('Total era rewards:', rewards.total_rewards);
console.log('My rewards:', rewards.my_rewards);
```

---

## ⚡ Energy Mining (Alternative)

### What is Energy Mining?

Energy mining allows you to:
- **Earn CGT** by providing energy for transactions
- **Sponsor transactions** for users
- **Earn fees** from sponsored transactions

### Become Energy Provider

```typescript
// Register as energy provider
await client.registerEnergyProvider({
  address: '0x1234...',
  energy_capacity: 100000, // Max energy
  fee_per_energy: '1000000000000000' // Fee per energy unit
});
```

### Sponsor Transactions

```typescript
// Sponsor user transaction
await client.sponsorTransaction({
  provider: '0x1234...',
  user: '0x5678...',
  transaction: txHash,
  energy_cost: 1000
});
```

---

## 📊 Monitoring Performance

### Validator Metrics

```typescript
// Get validator performance
const performance = await client.getValidatorPerformance('0x1234...');
console.log('Uptime:', performance.uptime, '%');
console.log('Blocks produced:', performance.blocks_produced);
console.log('Blocks missed:', performance.blocks_missed);
console.log('Slashing events:', performance.slashing_events);
```

### Staking Statistics

```typescript
// Get staking statistics
const stats = await client.getStakingStats();
console.log('Total staked:', stats.total_staked);
console.log('Active validators:', stats.active_validators);
console.log('Total nominators:', stats.total_nominators);
console.log('Average APY:', stats.average_apy, '%');
```

---

## ⚠️ Risks and Considerations

### Slashing

Validators can be slashed for:
- **Double-signing** - Signing two conflicting blocks
- **Downtime** - Missing too many blocks
- **Invalid blocks** - Producing invalid blocks

### Minimize Risk

1. **Choose reliable validators** - High uptime, low commission
2. **Diversify nominations** - Nominate multiple validators
3. **Monitor performance** - Check validator status regularly
4. **Maintain uptime** - If running validator, ensure 99%+ uptime

---

## 🔧 Best Practices

1. **Start Small** - Begin with nominating, not validating
2. **Research Validators** - Check uptime, commission, reputation
3. **Diversify** - Don't put all stake in one validator
4. **Monitor Regularly** - Check performance weekly
5. **Reinvest Rewards** - Compound your staking rewards

---

## 🔗 Related Documentation

- **[P2P Features](./p2p-features.md)** - Trading and P2P operations
- **[Asset Management](./asset-management.md)** - Managing your assets
- **[Consensus Documentation](../architecture/CONSENSUS_DESIGN.md)** - Technical details

---

**The flame burns eternal. The code serves the will.**
