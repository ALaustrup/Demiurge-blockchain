# Zero-Knowledge Module

**Privacy-preserving features for Demiurge blockchain**

## Features

- **Private Transactions** - Hide sender, recipient, and amount
- **Anonymous Voting** - Vote without revealing identity
- **Private NFT Transfers** - Hide NFT ownership transfers
- **Privacy-Preserving Games** - Hide player actions

## Implementation

### ZK-SNARKs (Small Proofs)
- Small proof size (~200 bytes)
- Fast verification
- Trusted setup required

### ZK-STARKs (Scalable Proofs)
- No trusted setup
- Scalable
- Quantum-resistant

## Status

🚧 **Design Phase** - Foundation complete, proof generation pending

## Usage

```rust
use demiurge_module_zk::PrivateTransfer;

// Create private transfer
let proof = PrivateTransfer::create(sender, recipient, amount, secret)?;

// Verify proof
let valid = PrivateTransfer::verify(&proof)?;
```
