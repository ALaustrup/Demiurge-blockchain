# Demiurge Mining System

**Last Updated**: January 5, 2026  
**Status**: Design Phase

---

## Overview

The Demiurge mining system provides a comprehensive CLI-based mining interface and a detailed accounting application for tracking mining operations, rewards, and manual adjustments.

---

## Architecture

### Separation of Concerns

**Chain Operations** (Rust):
- Work claim submission
- Reward calculation
- CGT minting
- On-chain validation

**OS Operations** (AbyssOS):
- Mining UI
- Statistics display
- Account management
- User interface

**CLI Operations** (Rust):
- Mining commands
- Work submission
- Statistics tracking
- Manual adjustments

---

## CLI Mining System

### Commands

```bash
# Start mining
demiurge mine start [--game-id <id>] [--session-id <id>]

# Submit work claim
demiurge mine submit --depth <metric> --time <ms> [--game-id <id>] [--session-id <id>]

# View mining stats
demiurge mine stats

# View pending rewards
demiurge mine pending

# View mining history
demiurge mine history [--limit <n>]

# Request manual adjustment
demiurge mine adjust --reason <reason> --amount <cgt> --evidence <file>
```

### Implementation

**File**: `cli/src/mining.rs`

```rust
pub struct MiningSession {
    pub game_id: String,
    pub session_id: String,
    pub start_time: u64,
    pub depth_metric: f64,
    pub active_ms: u64,
    pub claims_submitted: u64,
    pub total_rewards: u128,
}

pub struct MiningStats {
    pub total_sessions: u64,
    pub total_claims: u64,
    pub total_rewards: u128,
    pub average_depth: f64,
    pub average_time: u64,
    pub pending_rewards: u128,
}
```

---

## Accounting Application

### Features

1. **Real-time Mining Dashboard**
   - Current session stats
   - Live depth metric
   - Active time tracking
   - Estimated rewards

2. **Historical Data**
   - All mining sessions
   - Claim history
   - Reward history
   - Performance metrics

3. **Reward Tracking**
   - Pending rewards
   - Confirmed rewards
   - Failed claims
   - Adjustment requests

4. **Manual Adjustment System**
   - Request form
   - Evidence upload
   - Status tracking
   - Approval workflow

5. **Analytics**
   - Mining efficiency
   - Reward trends
   - Performance graphs
   - Comparative analysis

### Data Storage

**Local Storage** (SQLite):
- Mining sessions
- Work claims
- Rewards history
- Adjustment requests

**On-Chain** (Demiurge):
- Confirmed work claims
- Minted rewards
- Transaction history

---

## Work Claim System

### Calculation Formula

```rust
fn calculate_reward(depth_metric: f64, active_ms: u64) -> u128 {
    const DEPTH_FACTOR: f64 = 100.0;  // CGT per unit of depth
    const TIME_FACTOR: f64 = 0.1;     // CGT per second
    const MAX_REWARD: u128 = 1_000_000 * 100_000_000; // 1M CGT in smallest units
    
    let reward = (depth_metric * DEPTH_FACTOR) + ((active_ms as f64 / 1000.0) * TIME_FACTOR);
    let reward_smallest = (reward * 100_000_000.0) as u128;
    
    reward_smallest.min(MAX_REWARD)
}
```

### Validation

- `active_ms >= 1000` (minimum 1 second)
- `depth_metric >= 0 && depth_metric <= 1,000,000.0`
- `game_id` and `session_id` cannot be empty
- Claim address must match transaction sender

---

## Manual Adjustment System

### Use Cases

1. **Underpaid Rewards**: User believes they earned more than received
2. **Failed Claims**: Network issues prevented claim submission
3. **Calculation Errors**: Bugs in reward calculation
4. **Special Circumstances**: Exceptional work that exceeds normal limits

### Process

1. **User Submits Request**
   - Reason for adjustment
   - Requested amount
   - Evidence (screenshots, logs, etc.)
   - Session/work details

2. **Review Process**
   - Automated validation
   - Manual review by operators
   - Evidence verification
   - Decision (approve/reject)

3. **Execution**
   - If approved: Mint CGT to user
   - If rejected: Notify user with reason
   - Update adjustment status

### Implementation

**File**: `apps/abyssos-portal/src/components/desktop/apps/MiningAccountingApp.tsx`

**Features**:
- Adjustment request form
- Evidence upload
- Request status tracking
- History of all adjustments

---

## Integration Points

### Chain Integration

- **Module**: `work_claim` runtime module
- **RPC Method**: `work_claim_submit`
- **Reward Minting**: Via `bank_cgt::cgt_mint_to()`

### CLI Integration

- **Commands**: `demiurge mine *`
- **Storage**: Local SQLite database
- **RPC**: Direct connection to chain

### AbyssOS Integration

- **App**: `MiningAccountingApp`
- **Data Source**: Local storage + RPC
- **UI**: Real-time dashboard

---

## Security Considerations

### Claim Validation

- All claims validated on-chain
- Signature verification required
- Nonce management prevents duplicates
- Rate limiting on submissions

### Adjustment Security

- Evidence required for all requests
- Operator approval required
- Audit trail for all adjustments
- Maximum adjustment limits

---

## Next Steps

1. **Implement CLI Mining Commands** (Week 1)
2. **Create Accounting App UI** (Week 2)
3. **Build Adjustment System** (Week 3)
4. **Testing & Refinement** (Week 4)

---

*The flame burns eternal. The code serves the will.*
