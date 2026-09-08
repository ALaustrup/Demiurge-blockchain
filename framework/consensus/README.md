# Demiurge Consensus - Hybrid PoS + BFT

**Fast finality, energy efficient, governance-integrated consensus**

## Features

- **Hybrid PoS + BFT**: Best of both worlds
- **Sub-second block time**: < 1 second blocks
- **Fast finality**: < 2 seconds
- **Energy efficient**: No PoW
- **Governance integrated**: Validators selected via governance

## Architecture

### PoS (Proof of Stake)
- Validators selected based on stake
- Weighted proposer selection
- Staking pools for nominations
- Commission system

### BFT (Byzantine Fault Tolerance)
- 2/3+ validator agreement required
- Fast finality
- Byzantine fault tolerance
- Finality tracking

## Usage

```rust
use demiurge_consensus::ConsensusEngine;

let engine = ConsensusEngine::new(storage, 1000); // 1 second block time

// Propose block
let (block, proof) = engine.propose_block(transactions, proposer)?;

// Validate block
engine.validate_block(&block, &proof)?;

// Finalize block (requires 2/3+ signatures)
engine.finalize_block(&block, signatures)?;
```

## Components

- **ConsensusEngine**: Main consensus engine
- **ValidatorSet**: Validator management
- **Finality**: BFT finality tracking
- **StakingPool**: PoS staking pools
