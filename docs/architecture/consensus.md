# Consensus Mechanism

Demiurge uses a hybrid Proof-of-Stake (PoS) with Byzantine Fault Tolerance (BFT) consensus.

---

## Overview

| Property | Value |
|----------|-------|
| Block Time | ~6 seconds |
| Finality | Instant (BFT) |
| Fault Tolerance | 1/3 Byzantine validators |
| Minimum Stake | Configurable |

---

## How It Works

### Block Production

1. **Validator Selection**: Round-robin among active validators
2. **Block Building**: Author collects transactions from pool
3. **Execution**: Transactions executed, state updated
4. **Proposal**: Block proposed to network

### Finalization (BFT)

1. **Pre-Vote**: Validators verify and vote
2. **Pre-Commit**: 2/3+ votes triggers pre-commit
3. **Commit**: 2/3+ pre-commits finalizes block
4. **Finality**: Block is irreversible

```
Author → Propose → [Validators] → Pre-Vote
                         ↓
                    Pre-Commit (2/3+)
                         ↓
                      Commit
                         ↓
                   FINALIZED
```

---

## Validator Lifecycle

### Registration

```rust
// Stake CGT to become validator
consensus.register_validator(account, stake_amount);
```

### Active Set

- Validators sorted by stake
- Top N validators are active
- Minimum stake required

### Rewards

- Block authors receive block rewards
- Rewards distributed per era
- APY based on total staked

### Slashing

Penalties for misbehavior:
- **Double signing**: 10% stake slashed
- **Downtime**: 1% per missed block
- **Equivocation**: Full stake slashed

---

## Era System

| Concept | Description |
|---------|-------------|
| Era | ~24 hours of blocks |
| Epoch | ~100 blocks |
| Session | Single validator's turn |

At era boundaries:
- Rewards distributed
- Validator set updated
- Slashing applied

---

## Modular Fluidity

Demiurge supports hot-swapping consensus mechanisms:

### Available Mechanisms

| Mechanism | Use Case |
|-----------|----------|
| PoS+BFT | Default, balanced |
| Pure BFT | High-speed, permissioned |
| Raft | Low-latency, small sets |

### Switching Process

1. Governance proposal
2. Validator vote
3. State migration at block boundary
4. New mechanism activates

```rust
// Governance-triggered switch
consensus.propose_mechanism_change(Mechanism::PureBFT);
```

---

## Configuration

### Node Configuration

```toml
[consensus]
block_time_ms = 6000
finality_timeout_ms = 12000
min_validators = 1
max_validators = 100

[staking]
min_stake = 1000000  # 10,000 CGT
unbonding_period = 604800  # 7 days in seconds
```

### Genesis Configuration

```json
{
  "consensus": {
    "initial_validators": [
      {
        "address": "0x...",
        "stake": 1000000000
      }
    ],
    "block_time_ms": 6000
  }
}
```

---

## RPC Methods

| Method | Description |
|--------|-------------|
| `consensus_getValidators` | List active validators |
| `consensus_getValidator` | Get validator info |
| `consensus_getStatus` | Current consensus state |
| `consensus_getCurrentEra` | Current era info |
| `consensus_getStakingPool` | Staking pool state |

---

## Security Considerations

### Byzantine Fault Tolerance
- Tolerates up to 1/3 malicious validators
- Requires 2/3+ honest for finality
- No probabilistic finality (instant)

### Long-Range Attacks
- Checkpoint-based security
- State snapshots for fast sync
- Historical validator sets stored

### Nothing-at-Stake
- Slashing for equivocation
- Stake locked during unbonding
- Economic penalties for misbehavior

---

## Performance

### Benchmarks (Single Validator)

| Metric | Value |
|--------|-------|
| Block Production | 6s consistent |
| Finality | < 1s after block |
| TPS (peak) | ~1,000 |
| Memory | 150-200 MB |

### Multi-Validator

| Validators | Finality | TPS |
|------------|----------|-----|
| 4 | < 2s | 800 |
| 10 | < 3s | 600 |
| 21 | < 5s | 500 |

---

## Implementation Details

**Location:** `framework/consensus/`

Key files:
- `engine.rs` - Core consensus engine
- `validator.rs` - Validator management
- `staking.rs` - Stake operations
- `slashing.rs` - Penalty system
- `finality.rs` - BFT finalization
- `modular.rs` - Mechanism switching

---

## Further Reading

- [Architecture Overview](./README.md)
- [Staking Guide](../operations/staking.md)
- [Validator Setup](../operations/validator.md)
