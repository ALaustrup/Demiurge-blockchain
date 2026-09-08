# 🎯 Consensus Algorithm Design - Hybrid PoS + BFT

**Fast finality for creators, developers, and gamers**

---

## 🏗️ Architecture Overview

### Hybrid Approach: PoS + BFT

**Phase 1: Block Production (PoS)**
- Validators selected based on stake weight
- Weighted random selection using VRF (Verifiable Random Function)
- Sub-second block time (< 1 second)
- Energy efficient (no PoW)

**Phase 2: Block Finality (BFT)**
- 2/3+ validator agreement required
- Fast finality (< 2 seconds)
- Byzantine fault tolerance
- Irreversible blocks after finality

---

## ⚡ Performance Targets

- **Block Time**: < 1 second (target: 500ms)
- **Finality**: < 2 seconds
- **Throughput**: 10,000+ TPS
- **Latency**: < 100ms query time

---

## 🔐 Security Model

### Validator Selection

1. **Minimum Stake Requirement**
   - Validators must stake minimum amount (e.g., 1M CGT)
   - Prevents Sybil attacks
   - Ensures economic security

2. **Weighted Proposer Selection**
   - Probability proportional to stake weight
   - Uses deterministic randomness (VRF)
   - Prevents stake concentration attacks

3. **Era Management**
   - Validator sets updated per era (e.g., every 1000 blocks)
   - Allows stake changes to take effect
   - Prevents long-range attacks

4. **Slashing**
   - Penalties for misbehavior (double-signing, downtime)
   - Protects against Byzantine validators
   - Economic disincentive for attacks

### Finality Guarantees

- **2/3+ Byzantine Fault Tolerance**
  - Requires 2/3+ of validators to agree
  - Can tolerate up to 1/3 Byzantine validators
  - Irreversible after finality

- **Fast Confirmation**
  - Blocks finalized within 2 seconds
  - Safe for high-value transactions
  - No waiting for probabilistic finality

---

## 💰 Staking Mechanism

### For Validators

1. **Stake CGT** to become validator
2. **Earn block rewards** for producing blocks
3. **Commission** on nominations (0-100%)
4. **Slashing risk** for misbehavior

### For Nominators

1. **Nominate validators** to share rewards
2. **Lower risk** than validating
3. **Easy participation** - no technical requirements
4. **Share in rewards** proportional to stake

---

## 🎮 Gaming Optimization

### Fast Finality
- Sub-second blocks
- Instant confirmation
- No waiting for games
- Smooth gameplay

### Low Latency
- < 100ms query time
- Real-time updates
- Responsive UX
- No lag

---

## 🔄 Block Production Flow

### 1. Proposer Selection (PoS)

```
For each block:
  1. Calculate total stake: T = Σ(stake_i)
  2. Generate VRF seed: seed = VRF(block_number, parent_hash)
  3. Calculate weights: w_i = stake_i / T
  4. Select proposer: weighted_random(validators, weights, seed)
  5. Assign block slot to selected proposer
```

### 2. Block Proposal

```
Proposer:
  1. Collect transactions from mempool
  2. Create block header:
     - parent_hash: hash of previous block
     - block_number: previous + 1
     - timestamp: current time
     - extrinsics_root: Merkle root of transactions
     - state_root: (calculated after execution)
  3. Sign block with validator key
  4. Broadcast block + proof
```

### 3. Block Validation

```
Validators:
  1. Verify proposer is valid (check validator set)
  2. Verify proposer was selected correctly (VRF verification)
  3. Verify block signature
  4. Verify block structure (parent_hash, block_number, etc.)
  5. Verify transactions (signatures, nonces, etc.)
  6. Verify timestamp (not too far in future/past)
  7. If valid, sign block and broadcast signature
```

### 4. Block Finalization (BFT)

```
Finalization:
  1. Collect signatures from validators
  2. Count unique validator signatures
  3. Check if 2/3+ validators signed
  4. If yes, finalize block:
     - Mark block as finalized
     - Update finality tracker
     - Trigger rewards distribution
  5. If no, wait for more signatures (timeout after 2 seconds)
```

---

## 📊 Era Management

### Era Definition

- **Era Length**: 1000 blocks (configurable)
- **Era Transition**: Every 1000 blocks
- **Validator Set Update**: At era boundaries

### Era Transition Process

```
At era boundary:
  1. Calculate validator rewards for previous era
  2. Update validator stakes (add rewards, subtract slashes)
  3. Recalculate validator set (based on new stakes)
  4. Update proposer selection weights
  5. Start new era with updated validator set
```

---

## 🔐 Cryptographic Primitives

### Signing

- **Algorithm**: Ed25519 (Edwards-curve Digital Signature Algorithm)
- **Key Size**: 32 bytes (private), 32 bytes (public)
- **Signature Size**: 64 bytes
- **Library**: `ed25519-dalek`

### Hashing

- **Algorithm**: Blake2b-512
- **Output Size**: 32 bytes (truncated from 512 bits)
- **Library**: `blake2`

### VRF (Verifiable Random Function)

- **Purpose**: Deterministic randomness for proposer selection
- **Implementation**: Blake2b-based VRF (simplified)
- **Properties**: Verifiable, unpredictable, non-manipulatable

---

## 🎯 Block Production Schedule

### Slot Assignment

```
For each block:
  - Slot duration: 500ms (configurable)
  - Proposer selected at start of slot
  - Block must be proposed within slot
  - If proposer misses slot, skip to next proposer
```

### Timeout Handling

```
If proposer doesn't produce block:
  1. Wait for timeout (500ms)
  2. Skip to next proposer
  3. Create empty block (or skip block)
  4. Continue with next slot
```

---

## 🚨 Slashing Conditions

### Double Signing

- **Detection**: Same validator signs two different blocks at same height
- **Penalty**: Slash 5% of stake
- **Prevention**: Track signed blocks per validator

### Downtime

- **Detection**: Validator misses N consecutive blocks (e.g., N=10)
- **Penalty**: Slash 0.1% of stake per missed block
- **Prevention**: Monitor validator availability

### Invalid Blocks

- **Detection**: Validator proposes invalid block
- **Penalty**: Slash 1% of stake
- **Prevention**: Validate all blocks before signing

---

## 📈 Validator Rewards

### Block Rewards

```
For each finalized block:
  1. Calculate total reward: R = base_reward + transaction_fees
  2. Allocate to proposer: P = R * proposer_share (e.g., 20%)
  3. Allocate to validators: V = R * validator_share (e.g., 80%)
  4. Distribute V among validators based on stake weight
  5. Apply commission to validator rewards
  6. Distribute remaining to nominators
```

### Reward Distribution

```
For validator v:
  - Validator reward: R_v = (V * stake_v / total_stake) * (1 - commission_v)
  - Commission: C_v = (V * stake_v / total_stake) * commission_v
  - Nominator rewards: distributed proportionally to stake
```

---

## 🔄 Integration Points

### Runtime Integration

- Consensus engine calls runtime to execute transactions
- Runtime provides state root after execution
- Consensus engine finalizes block with state root

### Storage Integration

- Store finalized blocks
- Track validator set
- Track validator stakes
- Track era information

### Network Integration

- Broadcast block proposals
- Broadcast block signatures
- Collect signatures from network
- Propagate finalized blocks

---

## 🎯 Implementation Status

- ✅ Basic consensus engine structure
- ✅ Validator set management
- ✅ Finality tracking
- ✅ Staking pools
- 🚧 Weighted proposer selection (needs VRF)
- 🚧 Cryptographic signing (needs ed25519 integration)
- 🚧 Storage integration (needs block tracking)
- 🚧 Era management (needs era transitions)
- 🚧 Slashing logic (needs misbehavior tracking)
- 🚧 Reward distribution (needs reward calculation)

---

**Status**: 🚧 In Progress  
**Location**: `framework/consensus/`  
**Next Steps**: Implement weighted proposer selection, cryptographic signing, storage integration
