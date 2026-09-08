# CVP: Consensus-Verified Polymorphism

Demiurge's runtime security system that uses bytecode mutation to prevent exploits.

---

## Overview

CVP (Consensus-Verified Polymorphism) makes smart contracts self-defending by:
- **Mutating bytecode** at regular intervals
- **Preserving semantics** via ZK proofs
- **Detecting attacks** in real-time
- **Emergency responses** to threats

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    CVP LIFECYCLE                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   [Original Code] ──► [Mutation Engine] ──► [New Code]  │
│         │                    │                  │       │
│         │                    ▼                  │       │
│         │         [ZK Equivalence Proof]        │       │
│         │                    │                  │       │
│         └────────────────────┴──────────────────┘       │
│                              │                          │
│                              ▼                          │
│              [Consensus Verification]                   │
│                              │                          │
│                              ▼                          │
│                   [Deploy New Code]                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Mutation Types

### 1. Structural Mutations

Reorganize code without changing behavior:

```rust
// Before
fn process(x: u32) -> u32 {
    let a = x + 1;
    let b = a * 2;
    b
}

// After (semantically identical)
fn process(x: u32) -> u32 {
    (x + 1) * 2
}
```

### 2. Register Reassignment

Change variable/register allocation:

```assembly
# Before
mov eax, [x]
add eax, 1
mov ebx, eax

# After
mov ecx, [x]
add ecx, 1
mov edx, ecx
```

### 3. Instruction Substitution

Replace instructions with equivalents:

```assembly
# Before
mul eax, 2

# After
shl eax, 1  # Equivalent to multiply by 2
```

### 4. Control Flow Obfuscation

Alter branching patterns:

```rust
// Before
if condition {
    action_a();
} else {
    action_b();
}

// After (opaque predicate insertion)
if (x * x >= 0) && condition {  // x² >= 0 is always true
    action_a();
} else {
    action_b();
}
```

---

## ZK Equivalence Proofs

Every mutation is accompanied by a zero-knowledge proof that the new code is semantically equivalent:

```rust
pub struct EquivalenceProof {
    /// Original bytecode hash
    pub original_hash: [u8; 32],
    
    /// Mutated bytecode hash
    pub mutated_hash: [u8; 32],
    
    /// Plonky2 ZK proof
    pub proof: Vec<u8>,
    
    /// Mutation epoch
    pub epoch: u64,
}
```

### Verification

```rust
// Validators verify equivalence before accepting mutation
fn verify_mutation(
    original: &[u8],
    mutated: &[u8],
    proof: &EquivalenceProof
) -> bool {
    // 1. Hash verification
    let orig_hash = blake2b(original);
    let mut_hash = blake2b(mutated);
    
    if orig_hash != proof.original_hash || mut_hash != proof.mutated_hash {
        return false;
    }
    
    // 2. ZK proof verification
    plonky2::verify(&proof.proof, &orig_hash, &mut_hash)
}
```

---

## Attack Detection

CVP monitors for common exploit patterns:

### Detected Patterns

| Attack | Detection Method | Response |
|--------|------------------|----------|
| Reentrancy | Call depth tracking | Block + mutate |
| Sandwich | Mempool analysis | Front-run protection |
| Flash Loan | Atomic bundle detection | Require collateral |
| Integer Overflow | Range analysis | Bounds checking |
| Access Control | Permission verification | Reject unauthorized |

### Detection Engine

```rust
pub struct AttackDetector {
    /// Historical transaction patterns
    patterns: HashMap<[u8; 32], Pattern>,
    
    /// Known attack signatures
    signatures: Vec<AttackSignature>,
    
    /// Threat level thresholds
    thresholds: ThreatThresholds,
}

impl AttackDetector {
    pub fn analyze(&self, tx: &Transaction) -> ThreatLevel {
        // Pattern matching against known attacks
        // Returns: Safe, Suspicious, or Threat
    }
}
```

---

## Mutation Schedule

| Trigger | Frequency | Scope |
|---------|-----------|-------|
| Epoch boundary | Every 100 blocks | All contracts |
| Threat detected | Immediate | Targeted contract |
| Governance vote | On approval | Specified contracts |
| Emergency | Immediate | Network-wide |

---

## Emergency Mutations

When a critical threat is detected:

1. **Detection**: Attack pattern identified
2. **Alert**: Validators notified
3. **Vote**: Fast BFT vote (< 1 block)
4. **Mutation**: Immediate code change
5. **Proof**: ZK proof generated and verified

```rust
pub fn emergency_mutate(
    contract_id: [u8; 32],
    threat: ThreatLevel,
) -> Result<EquivalenceProof, CvpError> {
    if threat < ThreatLevel::Critical {
        return Err(CvpError::InsufficientThreat);
    }
    
    // Generate defensive mutation
    let mutated = mutation_engine.defensive_mutate(&contract)?;
    
    // Generate proof
    let proof = zk_prover.prove_equivalence(&contract, &mutated)?;
    
    // Deploy immediately
    deploy_mutation(contract_id, mutated, proof)
}
```

---

## RPC Methods

| Method | Description |
|--------|-------------|
| `cvp_getContractInfo` | Get CVP status for contract |
| `cvp_getMutationHistory` | List past mutations |
| `cvp_getEquivalenceProof` | Get proof for epoch |
| `cvp_getThreatLevel` | Current threat assessment |

---

## Storage Layout

| Key | Value |
|-----|-------|
| `CVP:Contract:{id}` | Current bytecode |
| `CVP:Epoch:{id}` | Current mutation epoch |
| `CVP:Proof:{id}:{epoch}` | Equivalence proof |
| `CVP:History:{id}` | Mutation history |
| `CVP:Threats:{id}` | Detected threats |

---

## Benefits

### For Developers

- **Set and forget** - No manual security updates
- **Audit once** - Semantic equivalence preserved
- **Future-proof** - Adapts to new attack vectors

### For Users

- **Trustless security** - ZK proofs verify correctness
- **No downtime** - Mutations happen at block boundaries
- **Transparent** - All mutations on-chain

### For the Network

- **Self-defending** - Automatic threat response
- **Decentralized** - No central security team needed
- **Evolutionary** - Learns from attacks

---

## Limitations

1. **Overhead**: Mutation and proof generation costs
2. **Complexity**: ZK circuits must be carefully designed
3. **Edge cases**: Some optimizations may not preserve all behaviors
4. **Novel attacks**: Unknown patterns may not be detected

---

## Configuration

```toml
[cvp]
# Mutation frequency
epoch_length = 100  # blocks

# Threat detection sensitivity
threat_threshold = 0.8

# Emergency mutation vote threshold
emergency_quorum = 0.67

# Proof generation
zk_circuit = "plonky2"
max_proof_size = 1048576  # 1 MB
```

---

## Further Reading

- [Architecture Overview](../architecture/README.md)
- [Zero-Knowledge Features](./zk.md)
- [Security Best Practices](../developers/security.md)
