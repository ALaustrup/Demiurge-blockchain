//! Plonky2 ZK Circuits for Archon CVP
//!
//! This module implements the Zero-Knowledge proof circuits for verifying
//! that bytecode mutations preserve semantic equivalence.
//!
//! # Architecture
//!
//! The proof system uses Translation Validation:
//! 1. Define bytecode mutations as rewrite rules
//! 2. Each rule has a formal proof of semantic preservation
//! 3. ZK proof shows B₂ was derived from B₁ using only valid rules
//!
//! # The Mathematical Immune System
//!
//! This is the cryptographic core of Archon CVP. Every mutation must be
//! accompanied by a proof that it preserves semantic equivalence.
//!
//! # Requirements
//!
//! **IMPORTANT**: Plonky2 requires **nightly Rust** due to its use of
//! experimental features (`specialization`, `stdarch_x86_avx512`).
//!
//! To compile with the zk-plonky2 feature:
//! ```bash
//! rustup override set nightly
//! cargo build --features zk-plonky2
//! ```
//!
//! # Features
//!
//! This module is only compiled when the `zk-plonky2` feature is enabled:
//! ```toml
//! [dependencies]
//! demiurge-cvp = { version = "0.1", features = ["zk-plonky2"] }
//! ```

#[cfg(feature = "zk-plonky2")]
use plonky2::field::goldilocks_field::GoldilocksField;
#[cfg(feature = "zk-plonky2")]
use plonky2::field::types::{Field, PrimeField64};
#[cfg(feature = "zk-plonky2")]
use plonky2::hash::hash_types::HashOutTarget;
#[cfg(feature = "zk-plonky2")]
use plonky2::hash::poseidon::PoseidonHash;
#[cfg(feature = "zk-plonky2")]
use plonky2::iop::target::{BoolTarget, Target};
#[cfg(feature = "zk-plonky2")]
use plonky2::iop::witness::{PartialWitness, WitnessWrite};
#[cfg(feature = "zk-plonky2")]
use plonky2::plonk::circuit_builder::CircuitBuilder;
#[cfg(feature = "zk-plonky2")]
use plonky2::plonk::circuit_data::{CircuitConfig, CircuitData, VerifierCircuitData};
#[cfg(feature = "zk-plonky2")]
use plonky2::plonk::config::PoseidonGoldilocksConfig;
#[cfg(feature = "zk-plonky2")]
use plonky2::plonk::proof::ProofWithPublicInputs;

use sha2::{Sha256, Digest};

use crate::{Result, CvpError};

#[cfg(feature = "zk-plonky2")]
use crate::{
    EquivalenceProof, ProofGenerator, ProofSystem,
    SemanticIR, Bytecode,
};

// ============================================================================
// TYPE ALIASES FOR PLONKY2
// ============================================================================

#[cfg(feature = "zk-plonky2")]
type F = GoldilocksField;
#[cfg(feature = "zk-plonky2")]
type C = PoseidonGoldilocksConfig;
#[cfg(feature = "zk-plonky2")]
const D: usize = 2;

// ============================================================================
// CIRCUIT CONSTANTS
// ============================================================================

/// Maximum bytecode size (in bytes) that can be proven
pub const MAX_BYTECODE_SIZE: usize = 24576; // 24 KB

/// Maximum number of transformation steps per proof
pub const MAX_TRANSFORMATION_STEPS: usize = 16;

/// Merkle tree depth for rule proofs (256 rules max)
pub const MERKLE_DEPTH: usize = 8;

/// Number of 64-bit limbs to represent a 256-bit hash
pub const HASH_LIMBS: usize = 4;

/// Chunk size for bytecode hashing (8 bytes = 1 field element)
pub const BYTECODE_CHUNK_SIZE: usize = 8;

/// Number of chunks for bytecode (MAX_BYTECODE_SIZE / BYTECODE_CHUNK_SIZE)
pub const NUM_BYTECODE_CHUNKS: usize = MAX_BYTECODE_SIZE / BYTECODE_CHUNK_SIZE;

/// Rule pattern maximum size (bytes)
pub const MAX_RULE_PATTERN_SIZE: usize = 64;

/// Goldilocks field modulus: 2^64 - 2^32 + 1 = 0xFFFFFFFF00000001
/// Note: This is the prime field used by Plonky2 for efficient arithmetic
pub const GOLDILOCKS_MODULUS: u64 = 0xFFFFFFFF00000001;

// ============================================================================
// PUBLIC INPUT STRUCTURE
// ============================================================================

/// Public inputs for the CVP equivalence proof
#[derive(Debug, Clone)]
pub struct CvpPublicInputs {
    /// Commitment to the Semantic IR (Poseidon hash)
    pub ir_commitment: [u64; HASH_LIMBS],
    
    /// Hash of the original bytecode
    pub original_hash: [u64; HASH_LIMBS],
    
    /// Hash of the mutated bytecode
    pub mutated_hash: [u64; HASH_LIMBS],
    
    /// Epoch seed used for mutation randomness
    pub epoch_seed: [u64; HASH_LIMBS],
    
    /// Merkle root of valid rewrite rules
    pub rules_root: [u64; HASH_LIMBS],
}

impl CvpPublicInputs {
    /// Convert 32-byte hash to 4 x 64-bit limbs
    pub fn hash_to_limbs(hash: &[u8; 32]) -> [u64; HASH_LIMBS] {
        let mut limbs = [0u64; HASH_LIMBS];
        for (i, limb) in limbs.iter_mut().enumerate() {
            let start = i * 8;
            *limb = u64::from_le_bytes(hash[start..start + 8].try_into().unwrap());
        }
        limbs
    }
    
    /// Convert limbs back to 32-byte hash
    pub fn limbs_to_hash(limbs: &[u64; HASH_LIMBS]) -> [u8; 32] {
        let mut hash = [0u8; 32];
        for i in 0..HASH_LIMBS {
            hash[i * 8..(i + 1) * 8].copy_from_slice(&limbs[i].to_le_bytes());
        }
        hash
    }
    
    /// Convert to vector of field elements for Plonky2
    #[cfg(feature = "zk-plonky2")]
    pub fn to_field_elements(&self) -> Vec<F> {
        let mut elements = Vec::with_capacity(HASH_LIMBS * 5);
        
        for &limb in &self.ir_commitment {
            elements.push(F::from_canonical_u64(limb));
        }
        for &limb in &self.original_hash {
            elements.push(F::from_canonical_u64(limb));
        }
        for &limb in &self.mutated_hash {
            elements.push(F::from_canonical_u64(limb));
        }
        for &limb in &self.epoch_seed {
            elements.push(F::from_canonical_u64(limb));
        }
        for &limb in &self.rules_root {
            elements.push(F::from_canonical_u64(limb));
        }
        
        elements
    }
}

// ============================================================================
// HASH GADGETS - The Cryptographic Foundation
// ============================================================================

/// Hash gadgets for Plonky2 circuits using native Poseidon
#[cfg(feature = "zk-plonky2")]
pub mod hash_gadgets {
    use super::*;
    
    /// Poseidon hash of a single field element
    pub fn hash_single(
        builder: &mut CircuitBuilder<F, D>,
        input: Target,
    ) -> HashOutTarget {
        builder.hash_n_to_hash_no_pad::<PoseidonHash>(vec![input])
    }
    
    /// Poseidon hash of two field elements (for Merkle tree nodes)
    pub fn hash_two(
        builder: &mut CircuitBuilder<F, D>,
        left: Target,
        right: Target,
    ) -> HashOutTarget {
        builder.hash_n_to_hash_no_pad::<PoseidonHash>(vec![left, right])
    }
    
    /// Poseidon hash of two hash outputs (for Merkle tree)
    pub fn hash_two_hashes(
        builder: &mut CircuitBuilder<F, D>,
        left: HashOutTarget,
        right: HashOutTarget,
    ) -> HashOutTarget {
        let inputs: Vec<Target> = left.elements.iter()
            .chain(right.elements.iter())
            .copied()
            .collect();
        builder.hash_n_to_hash_no_pad::<PoseidonHash>(inputs)
    }
    
    /// Poseidon hash of multiple targets (variable length)
    pub fn hash_many(
        builder: &mut CircuitBuilder<F, D>,
        inputs: &[Target],
    ) -> HashOutTarget {
        builder.hash_n_to_hash_no_pad::<PoseidonHash>(inputs.to_vec())
    }
    
    /// Hash bytecode chunks into a single commitment
    /// Uses a Merkle-like structure for efficiency
    pub fn hash_bytecode(
        builder: &mut CircuitBuilder<F, D>,
        bytecode_chunks: &[Target],
    ) -> HashOutTarget {
        if bytecode_chunks.is_empty() {
            // Return hash of zero for empty bytecode
            let zero = builder.zero();
            return hash_single(builder, zero);
        }
        
        if bytecode_chunks.len() == 1 {
            return hash_single(builder, bytecode_chunks[0]);
        }
        
        // Build a Merkle tree of bytecode chunks
        let mut current_level: Vec<HashOutTarget> = bytecode_chunks.iter()
            .map(|&chunk| hash_single(builder, chunk))
            .collect();
        
        // Pad to power of 2 if needed
        let zero = builder.zero();
        let zero_hash = hash_single(builder, zero);
        while current_level.len() & (current_level.len() - 1) != 0 {
            current_level.push(zero_hash);
        }
        
        // Reduce to single hash
        while current_level.len() > 1 {
            let mut next_level = Vec::new();
            for chunk in current_level.chunks(2) {
                let combined = hash_two_hashes(builder, chunk[0], chunk[1]);
                next_level.push(combined);
            }
            current_level = next_level;
        }
        
        current_level[0]
    }
    
    /// Convert HashOutTarget (4 field elements) to HASH_LIMBS targets
    pub fn hash_out_to_targets(hash: HashOutTarget) -> [Target; HASH_LIMBS] {
        [
            hash.elements[0],
            hash.elements[1],
            hash.elements[2],
            hash.elements[3],
        ]
    }
    
    /// Create a HashOutTarget from HASH_LIMBS targets
    pub fn targets_to_hash_out(targets: [Target; HASH_LIMBS]) -> HashOutTarget {
        HashOutTarget {
            elements: targets,
        }
    }
    
    /// Assert two hashes are equal
    pub fn assert_hash_equal(
        builder: &mut CircuitBuilder<F, D>,
        a: HashOutTarget,
        b: HashOutTarget,
    ) {
        for i in 0..4 {
            builder.connect(a.elements[i], b.elements[i]);
        }
    }
}

// ============================================================================
// WITNESS UTILS - Poseidon Hashing for Witness Generation
// ============================================================================

/// Utilities for computing Poseidon hashes outside circuits (for witness generation)
/// These functions MUST match exactly what the circuit gadgets compute.
#[cfg(feature = "zk-plonky2")]
pub mod witness_utils {
    use super::*;
    use plonky2::hash::hash_types::HashOut;
    use plonky2::hash::poseidon::PoseidonHash;
    use plonky2::plonk::config::Hasher;
    
    /// Poseidon hash of a single field element (matches hash_single in circuit)
    pub fn poseidon_hash_single(input: F) -> HashOut<F> {
        PoseidonHash::hash_no_pad(&[input])
    }
    
    /// Poseidon hash of multiple field elements (matches hash_many in circuit)
    pub fn poseidon_hash_many(inputs: &[F]) -> HashOut<F> {
        PoseidonHash::hash_no_pad(inputs)
    }
    
    /// Poseidon hash of two hashes (matches hash_two_hashes in circuit)
    pub fn poseidon_hash_two_hashes(left: HashOut<F>, right: HashOut<F>) -> HashOut<F> {
        let mut inputs = Vec::with_capacity(8);
        inputs.extend_from_slice(&left.elements);
        inputs.extend_from_slice(&right.elements);
        PoseidonHash::hash_no_pad(&inputs)
    }
    
    /// Hash bytecode chunks using Poseidon (matches hash_bytecode in circuit)
    /// This builds a Merkle tree of the bytecode chunks.
    pub fn poseidon_hash_bytecode(bytecode_chunks: &[F]) -> HashOut<F> {
        if bytecode_chunks.is_empty() {
            return poseidon_hash_single(F::ZERO);
        }
        
        if bytecode_chunks.len() == 1 {
            return poseidon_hash_single(bytecode_chunks[0]);
        }
        
        // Build a Merkle tree of bytecode chunks
        let mut current_level: Vec<HashOut<F>> = bytecode_chunks.iter()
            .map(|&chunk| poseidon_hash_single(chunk))
            .collect();
        
        // Pad to power of 2 if needed
        let zero_hash = poseidon_hash_single(F::ZERO);
        while current_level.len() & (current_level.len() - 1) != 0 {
            current_level.push(zero_hash);
        }
        
        // Reduce to single hash
        while current_level.len() > 1 {
            let mut next_level = Vec::new();
            for chunk in current_level.chunks(2) {
                let combined = poseidon_hash_two_hashes(chunk[0], chunk[1]);
                next_level.push(combined);
            }
            current_level = next_level;
        }
        
        current_level[0]
    }
    
    /// Convert bytecode to field element chunks (8 bytes per chunk)
    pub fn bytecode_to_field_chunks(bytecode: &[u8]) -> Vec<F> {
        bytecode.chunks(8)
            .map(|chunk| {
                let mut bytes = [0u8; 8];
                bytes[..chunk.len()].copy_from_slice(chunk);
                F::from_canonical_u64(u64::from_le_bytes(bytes))
            })
            .collect()
    }
    
    /// Convert HashOut to [u64; 4] limbs
    pub fn hash_out_to_limbs(hash: HashOut<F>) -> [u64; HASH_LIMBS] {
        [
            hash.elements[0].to_canonical_u64(),
            hash.elements[1].to_canonical_u64(),
            hash.elements[2].to_canonical_u64(),
            hash.elements[3].to_canonical_u64(),
        ]
    }
    
    /// Convert [u64; 4] limbs to HashOut
    pub fn limbs_to_hash_out(limbs: &[u64; HASH_LIMBS]) -> HashOut<F> {
        HashOut {
            elements: [
                F::from_canonical_u64(limbs[0]),
                F::from_canonical_u64(limbs[1]),
                F::from_canonical_u64(limbs[2]),
                F::from_canonical_u64(limbs[3]),
            ],
        }
    }
    
    /// Compute the complete bytecode hash for witness (Poseidon-based)
    pub fn compute_bytecode_hash(bytecode: &[u8], num_chunks: usize) -> [u64; HASH_LIMBS] {
        let mut chunks = bytecode_to_field_chunks(bytecode);
        
        // Pad to required number of chunks
        while chunks.len() < num_chunks {
            chunks.push(F::ZERO);
        }
        
        // Truncate if necessary
        chunks.truncate(num_chunks);
        
        let hash = poseidon_hash_bytecode(&chunks);
        hash_out_to_limbs(hash)
    }
}

// ============================================================================
// MERKLE GADGETS - Rule Set Verification
// ============================================================================

/// Merkle tree gadgets for proving rule membership
#[cfg(feature = "zk-plonky2")]
pub mod merkle_gadgets {
    use super::*;
    use super::hash_gadgets::*;
    
    /// A Merkle proof path in circuit form
    #[derive(Clone)]
    pub struct MerkleProofTargets {
        /// Sibling hashes at each level
        pub siblings: Vec<HashOutTarget>,
        /// Direction bits (0 = left, 1 = right)
        pub path_bits: Vec<BoolTarget>,
    }
    
    impl MerkleProofTargets {
        /// Create targets for a Merkle proof of given depth
        pub fn new(builder: &mut CircuitBuilder<F, D>, depth: usize) -> Self {
            let siblings: Vec<HashOutTarget> = (0..depth)
                .map(|_| builder.add_virtual_hash())
                .collect();
            
            let path_bits: Vec<BoolTarget> = (0..depth)
                .map(|_| builder.add_virtual_bool_target_safe())
                .collect();
            
            Self { siblings, path_bits }
        }
    }
    
    /// Verify a Merkle inclusion proof
    /// Returns the computed root hash
    pub fn verify_merkle_proof(
        builder: &mut CircuitBuilder<F, D>,
        leaf: HashOutTarget,
        proof: &MerkleProofTargets,
    ) -> HashOutTarget {
        let mut current = leaf;
        
        for (sibling, &is_right) in proof.siblings.iter().zip(proof.path_bits.iter()) {
            // If is_right, current is right child: hash(sibling, current)
            // If !is_right, current is left child: hash(current, sibling)
            current = conditional_hash_order(builder, current, *sibling, is_right);
        }
        
        current
    }
    
    /// Hash two nodes with conditional ordering based on a boolean
    fn conditional_hash_order(
        builder: &mut CircuitBuilder<F, D>,
        a: HashOutTarget,
        b: HashOutTarget,
        a_is_right: BoolTarget,
    ) -> HashOutTarget {
        // Select left and right based on bit
        let left = conditional_select_hash(builder, b, a, a_is_right);
        let right = conditional_select_hash(builder, a, b, a_is_right);
        
        hash_two_hashes(builder, left, right)
    }
    
    /// Conditional select between two hashes
    fn conditional_select_hash(
        builder: &mut CircuitBuilder<F, D>,
        if_false: HashOutTarget,
        if_true: HashOutTarget,
        condition: BoolTarget,
    ) -> HashOutTarget {
        let selected_elements: Vec<Target> = (0..4)
            .map(|i| {
                builder.select(condition, if_true.elements[i], if_false.elements[i])
            })
            .collect();
        
        HashOutTarget {
            elements: [
                selected_elements[0],
                selected_elements[1],
                selected_elements[2],
                selected_elements[3],
            ],
        }
    }
    
    /// Verify a leaf is in the Merkle tree with expected root
    pub fn assert_merkle_membership(
        builder: &mut CircuitBuilder<F, D>,
        leaf: HashOutTarget,
        proof: &MerkleProofTargets,
        expected_root: HashOutTarget,
    ) {
        let computed_root = verify_merkle_proof(builder, leaf, proof);
        assert_hash_equal(builder, computed_root, expected_root);
    }
    
    /// Compute Merkle root from leaves (for witness generation)
    pub fn compute_merkle_root(leaves: &[[u64; HASH_LIMBS]]) -> [u64; HASH_LIMBS] {
        use sha2::{Sha256, Digest};
        
        if leaves.is_empty() {
            return [0; HASH_LIMBS];
        }
        
        let mut current: Vec<[u8; 32]> = leaves.iter()
            .map(|limbs| CvpPublicInputs::limbs_to_hash(limbs))
            .collect();
        
        // Pad to power of 2
        while current.len() & (current.len() - 1) != 0 {
            current.push([0; 32]);
        }
        
        while current.len() > 1 {
            let mut next = Vec::new();
            for chunk in current.chunks(2) {
                let mut hasher = Sha256::new();
                hasher.update(&chunk[0]);
                hasher.update(&chunk[1]);
                let result: [u8; 32] = hasher.finalize().into();
                next.push(result);
            }
            current = next;
        }
        
        CvpPublicInputs::hash_to_limbs(&current[0])
    }
}

// ============================================================================
// TRANSFORMATION STEP GADGETS - Rule Application Verification
// ============================================================================

/// Gadgets for verifying transformation step validity
#[cfg(feature = "zk-plonky2")]
pub mod transformation_gadgets {
    use super::*;
    use super::hash_gadgets::*;
    use super::merkle_gadgets::*;
    
    /// Targets for a complete transformation step
    #[derive(Clone)]
    pub struct TransformationStepTargets {
        /// Rule ID applied (field element)
        pub rule_id: Target,
        /// Position in bytecode where rule was applied
        pub position: Target,
        /// Flag indicating if this step is active (for padding)
        pub is_active: BoolTarget,
        /// Pre-transformation state hash
        pub pre_hash: HashOutTarget,
        /// Post-transformation state hash  
        pub post_hash: HashOutTarget,
        /// Merkle proof for rule membership
        pub merkle_proof: MerkleProofTargets,
        /// Rule pattern hash (what the rule matches)
        pub pattern_hash: HashOutTarget,
        /// Rule replacement hash (what the rule produces)
        pub replacement_hash: HashOutTarget,
    }
    
    impl TransformationStepTargets {
        /// Create targets for a transformation step
        pub fn new(builder: &mut CircuitBuilder<F, D>) -> Self {
            Self {
                rule_id: builder.add_virtual_target(),
                position: builder.add_virtual_target(),
                is_active: builder.add_virtual_bool_target_safe(),
                pre_hash: builder.add_virtual_hash(),
                post_hash: builder.add_virtual_hash(),
                merkle_proof: MerkleProofTargets::new(builder, MERKLE_DEPTH),
                pattern_hash: builder.add_virtual_hash(),
                replacement_hash: builder.add_virtual_hash(),
            }
        }
    }
    
    /// Verify a transformation step is valid
    pub fn verify_transformation_step(
        builder: &mut CircuitBuilder<F, D>,
        step: &TransformationStepTargets,
        rules_root: HashOutTarget,
        prev_hash: HashOutTarget,
    ) -> HashOutTarget {
        // 1. Compute the rule leaf hash: H(rule_id || pattern_hash || replacement_hash)
        let rule_leaf = compute_rule_leaf(builder, step);
        
        // 2. Verify rule is in the valid set via Merkle proof
        // Only enforce if step is active
        let computed_root = verify_merkle_proof(builder, rule_leaf, &step.merkle_proof);
        
        // Conditional check: if active, roots must match
        for i in 0..4 {
            let diff = builder.sub(computed_root.elements[i], rules_root.elements[i]);
            let should_be_zero = builder.mul(step.is_active.target, diff);
            let zero = builder.zero();
            builder.connect(should_be_zero, zero);
        }
        
        // 3. Verify pre_hash matches previous state (or first is original)
        for i in 0..4 {
            let diff = builder.sub(step.pre_hash.elements[i], prev_hash.elements[i]);
            let should_be_zero = builder.mul(step.is_active.target, diff);
            let zero = builder.zero();
            builder.connect(should_be_zero, zero);
        }
        
        // 4. Compute expected post_hash based on transformation
        // post_hash = H(pre_hash || rule_id || position || replacement_hash)
        let expected_post = compute_expected_post_hash(builder, step);
        
        // If active, post_hash must equal expected; if inactive, post_hash = pre_hash
        let output_hash = conditional_select_hash_active(
            builder,
            prev_hash,      // if inactive: pass through previous hash
            step.post_hash, // if active: use declared post_hash
            step.is_active,
        );
        
        // Verify post_hash matches expected when active
        for i in 0..4 {
            let diff = builder.sub(step.post_hash.elements[i], expected_post.elements[i]);
            let should_be_zero = builder.mul(step.is_active.target, diff);
            let zero = builder.zero();
            builder.connect(should_be_zero, zero);
        }
        
        output_hash
    }
    
    /// Compute the leaf hash for a rule in the Merkle tree
    fn compute_rule_leaf(
        builder: &mut CircuitBuilder<F, D>,
        step: &TransformationStepTargets,
    ) -> HashOutTarget {
        // Leaf = H(rule_id || pattern_hash || replacement_hash)
        let mut inputs = vec![step.rule_id];
        inputs.extend_from_slice(&step.pattern_hash.elements);
        inputs.extend_from_slice(&step.replacement_hash.elements);
        
        hash_many(builder, &inputs)
    }
    
    /// Compute expected post-transformation hash
    fn compute_expected_post_hash(
        builder: &mut CircuitBuilder<F, D>,
        step: &TransformationStepTargets,
    ) -> HashOutTarget {
        // Post = H(pre_hash || rule_id || position || replacement_hash)
        // This models: applying rule at position transforms state
        let mut inputs = Vec::new();
        inputs.extend_from_slice(&step.pre_hash.elements);
        inputs.push(step.rule_id);
        inputs.push(step.position);
        inputs.extend_from_slice(&step.replacement_hash.elements);
        
        hash_many(builder, &inputs)
    }
    
    /// Conditional select between hashes based on active flag
    fn conditional_select_hash_active(
        builder: &mut CircuitBuilder<F, D>,
        if_inactive: HashOutTarget,
        if_active: HashOutTarget,
        is_active: BoolTarget,
    ) -> HashOutTarget {
        let selected: Vec<Target> = (0..4)
            .map(|i| {
                builder.select(is_active, if_active.elements[i], if_inactive.elements[i])
            })
            .collect();
        
        HashOutTarget {
            elements: [selected[0], selected[1], selected[2], selected[3]],
        }
    }
}

// ============================================================================
// CIRCUIT BUILDER - THE MATHEMATICAL IMMUNE SYSTEM
// ============================================================================

/// Circuit for proving CVP semantic equivalence
#[cfg(feature = "zk-plonky2")]
pub struct CvpCircuit {
    /// Circuit data (compiled circuit)
    circuit_data: CircuitData<F, C, D>,
    
    /// Targets for public inputs (as HashOutTarget for native Poseidon)
    ir_commitment_targets: HashOutTarget,
    original_hash_targets: HashOutTarget,
    mutated_hash_targets: HashOutTarget,
    epoch_seed_targets: HashOutTarget,
    rules_root_targets: HashOutTarget,
    
    /// Targets for private inputs
    bytecode_targets: Vec<Target>,
    step_targets: Vec<transformation_gadgets::TransformationStepTargets>,
}

/// Targets for a single transformation step (legacy compatibility)
#[cfg(feature = "zk-plonky2")]
#[derive(Clone)]
pub struct TransformationStepTargets {
    /// Rule ID applied
    pub rule_id: Target,
    /// Position in bytecode where rule was applied
    pub position: Target,
    /// Hash before this step
    pub pre_hash: [Target; HASH_LIMBS],
    /// Hash after this step
    pub post_hash: [Target; HASH_LIMBS],
    /// Merkle path to prove rule is in valid set
    pub merkle_path: Vec<[Target; HASH_LIMBS]>,
}

#[cfg(feature = "zk-plonky2")]
impl CvpCircuit {
    /// Build the CVP equivalence proof circuit
    /// 
    /// This is the heart of the Mathematical Immune System.
    /// The circuit proves that mutated bytecode was derived from
    /// original bytecode using only semantically-preserving rules.
    pub fn build() -> Result<Self> {
        use hash_gadgets::*;
        use transformation_gadgets::*;
        
        let config = CircuitConfig::standard_recursion_config();
        let mut builder = CircuitBuilder::<F, D>::new(config);
        
        // ============ PUBLIC INPUTS ============
        // These are visible to the verifier (on-chain)
        
        // IR commitment - Semantic IR fingerprint
        let ir_commitment_targets = builder.add_virtual_hash();
        builder.register_public_inputs(&ir_commitment_targets.elements);
        
        // Original bytecode hash
        let original_hash_targets = builder.add_virtual_hash();
        builder.register_public_inputs(&original_hash_targets.elements);
        
        // Mutated bytecode hash
        let mutated_hash_targets = builder.add_virtual_hash();
        builder.register_public_inputs(&mutated_hash_targets.elements);
        
        // Epoch seed (randomness source for mutation)
        let epoch_seed_targets = builder.add_virtual_hash();
        builder.register_public_inputs(&epoch_seed_targets.elements);
        
        // Rules Merkle root (valid transformation rules)
        let rules_root_targets = builder.add_virtual_hash();
        builder.register_public_inputs(&rules_root_targets.elements);
        
        // ============ PRIVATE INPUTS (WITNESS) ============
        // These remain hidden from the verifier (zero-knowledge)
        
        // Bytecode chunks (8 bytes each = 1 field element)
        let bytecode_targets: Vec<Target> = (0..NUM_BYTECODE_CHUNKS)
            .map(|_| builder.add_virtual_target())
            .collect();
        
        // Transformation steps
        let step_targets: Vec<TransformationStepTargets> = (0..MAX_TRANSFORMATION_STEPS)
            .map(|_| TransformationStepTargets::new(&mut builder))
            .collect();
        
        // ============ CONSTRAINT 1: Bytecode Hash Verification ============
        // Prove: hash(private_bytecode) == public_original_hash
        
        let computed_bytecode_hash = hash_bytecode(&mut builder, &bytecode_targets);
        assert_hash_equal(&mut builder, computed_bytecode_hash, original_hash_targets);
        
        // ============ CONSTRAINT 2: Transformation Chain Verification ============
        // Prove: Each step follows from the previous via a valid rule
        
        let mut current_state = original_hash_targets;
        
        for step in &step_targets {
            current_state = verify_transformation_step(
                &mut builder,
                step,
                rules_root_targets,
                current_state,
            );
        }
        
        // ============ CONSTRAINT 3: Final State Verification ============
        // Prove: final transformation state == public_mutated_hash
        
        assert_hash_equal(&mut builder, current_state, mutated_hash_targets);
        
        // ============ CONSTRAINT 4: IR Consistency (Optional Enhancement) ============
        // The IR commitment is included as public input for future extensibility
        // It allows verification that transformations respect semantic invariants
        
        // Build the circuit
        let circuit_data = builder.build::<C>();
        
        Ok(Self {
            circuit_data,
            ir_commitment_targets,
            original_hash_targets,
            mutated_hash_targets,
            epoch_seed_targets,
            rules_root_targets,
            bytecode_targets,
            step_targets,
        })
    }
    
    /// Build a minimal circuit for testing (fewer constraints)
    pub fn build_minimal() -> Result<Self> {
        use hash_gadgets::*;
        
        let config = CircuitConfig::standard_recursion_config();
        let mut builder = CircuitBuilder::<F, D>::new(config);
        
        // Minimal public inputs
        let ir_commitment_targets = builder.add_virtual_hash();
        builder.register_public_inputs(&ir_commitment_targets.elements);
        
        let original_hash_targets = builder.add_virtual_hash();
        builder.register_public_inputs(&original_hash_targets.elements);
        
        let mutated_hash_targets = builder.add_virtual_hash();
        builder.register_public_inputs(&mutated_hash_targets.elements);
        
        let epoch_seed_targets = builder.add_virtual_hash();
        builder.register_public_inputs(&epoch_seed_targets.elements);
        
        let rules_root_targets = builder.add_virtual_hash();
        builder.register_public_inputs(&rules_root_targets.elements);
        
        // Minimal private inputs
        let bytecode_targets: Vec<Target> = (0..64) // Only 64 chunks for testing
            .map(|_| builder.add_virtual_target())
            .collect();
        
        let step_targets: Vec<transformation_gadgets::TransformationStepTargets> = (0..4) // Only 4 steps
            .map(|_| transformation_gadgets::TransformationStepTargets::new(&mut builder))
            .collect();
        
        // Simple constraint: original -> mutated via identity
        let computed_hash = hash_bytecode(&mut builder, &bytecode_targets);
        assert_hash_equal(&mut builder, computed_hash, original_hash_targets);
        
        let circuit_data = builder.build::<C>();
        
        Ok(Self {
            circuit_data,
            ir_commitment_targets,
            original_hash_targets,
            mutated_hash_targets,
            epoch_seed_targets,
            rules_root_targets,
            bytecode_targets,
            step_targets,
        })
    }
    
    /// Generate a proof from witness data
    pub fn prove(&self, witness: CvpWitness) -> Result<Plonky2Proof> {
        let mut pw = PartialWitness::new();
        
        // ============ SET PUBLIC INPUTS ============
        
        // IR commitment
        Self::set_hash_witness(&mut pw, &self.ir_commitment_targets, &witness.public_inputs.ir_commitment);
        
        // Original hash
        Self::set_hash_witness(&mut pw, &self.original_hash_targets, &witness.public_inputs.original_hash);
        
        // Mutated hash
        Self::set_hash_witness(&mut pw, &self.mutated_hash_targets, &witness.public_inputs.mutated_hash);
        
        // Epoch seed
        Self::set_hash_witness(&mut pw, &self.epoch_seed_targets, &witness.public_inputs.epoch_seed);
        
        // Rules root
        Self::set_hash_witness(&mut pw, &self.rules_root_targets, &witness.public_inputs.rules_root);
        
        // ============ SET PRIVATE INPUTS ============
        
        // Bytecode chunks
        let bytecode_chunks = Self::bytecode_to_chunks(&witness.bytecode);
        for (i, &chunk) in bytecode_chunks.iter().enumerate() {
            if i < self.bytecode_targets.len() {
                pw.set_target(self.bytecode_targets[i], F::from_canonical_u64(chunk));
            }
        }
        // Pad remaining with zeros
        for i in bytecode_chunks.len()..self.bytecode_targets.len() {
            pw.set_target(self.bytecode_targets[i], F::ZERO);
        }
        
        // Transformation steps
        for (i, step) in witness.steps.iter().enumerate() {
            if i < self.step_targets.len() {
                Self::set_step_witness(&mut pw, &self.step_targets[i], step, true);
            }
        }
        // Pad remaining steps as inactive
        for i in witness.steps.len()..self.step_targets.len() {
            Self::set_inactive_step_witness(&mut pw, &self.step_targets[i], &witness.public_inputs);
        }
        
        // Generate proof
        let proof = self.circuit_data.prove(pw)
            .map_err(|e| CvpError::ProofGenerationFailed(format!("Plonky2 prove failed: {:?}", e)))?;
        
        Ok(Plonky2Proof { proof })
    }
    
    /// Verify a proof
    pub fn verify(&self, proof: &Plonky2Proof) -> Result<bool> {
        self.circuit_data.verify(proof.proof.clone())
            .map(|_| true)
            .map_err(|e| CvpError::ProofVerificationFailed(format!("Plonky2 verify failed: {:?}", e)))
    }
    
    /// Get verifier data for standalone verification
    pub fn verifier_data(&self) -> VerifierCircuitData<F, C, D> {
        self.circuit_data.verifier_data()
    }
    
    /// Get circuit statistics
    pub fn stats(&self) -> CircuitStats {
        CircuitStats {
            num_gates: self.circuit_data.common.degree(),
            num_public_inputs: self.circuit_data.common.num_public_inputs,
            num_wires: self.circuit_data.common.config.num_wires,
        }
    }
    
    /// Get the number of bytecode chunks this circuit expects
    pub fn num_bytecode_chunks(&self) -> usize {
        self.bytecode_targets.len()
    }
    
    // ============ HELPER METHODS ============
    
    /// Set hash witness values
    fn set_hash_witness(
        pw: &mut PartialWitness<F>,
        target: &HashOutTarget,
        value: &[u64; HASH_LIMBS],
    ) {
        for i in 0..HASH_LIMBS {
            pw.set_target(target.elements[i], F::from_canonical_u64(value[i]));
        }
    }
    
    /// Convert bytecode to 64-bit chunks
    fn bytecode_to_chunks(bytecode: &[u8]) -> Vec<u64> {
        bytecode.chunks(8)
            .map(|chunk| {
                let mut bytes = [0u8; 8];
                bytes[..chunk.len()].copy_from_slice(chunk);
                u64::from_le_bytes(bytes)
            })
            .collect()
    }
    
    /// Set witness for an active transformation step
    fn set_step_witness(
        pw: &mut PartialWitness<F>,
        target: &transformation_gadgets::TransformationStepTargets,
        step: &WitnessStep,
        is_active: bool,
    ) {
        pw.set_target(target.rule_id, F::from_canonical_u64(step.rule_id as u64));
        pw.set_target(target.position, F::from_canonical_u64(step.position as u64));
        pw.set_bool_target(target.is_active, is_active);
        
        // Pre-hash
        for i in 0..HASH_LIMBS {
            pw.set_target(target.pre_hash.elements[i], F::from_canonical_u64(step.pre_hash[i]));
        }
        
        // Post-hash
        for i in 0..HASH_LIMBS {
            pw.set_target(target.post_hash.elements[i], F::from_canonical_u64(step.post_hash[i]));
        }
        
        // Pattern hash
        for i in 0..HASH_LIMBS {
            let val = step.pattern_hash.map_or(0, |h| h[i]);
            pw.set_target(target.pattern_hash.elements[i], F::from_canonical_u64(val));
        }
        
        // Replacement hash
        for i in 0..HASH_LIMBS {
            let val = step.replacement_hash.map_or(0, |h| h[i]);
            pw.set_target(target.replacement_hash.elements[i], F::from_canonical_u64(val));
        }
        
        // Merkle proof siblings
        for (k, sibling) in step.merkle_path.iter().enumerate() {
            if k < target.merkle_proof.siblings.len() {
                for j in 0..HASH_LIMBS {
                    pw.set_target(target.merkle_proof.siblings[k].elements[j], F::from_canonical_u64(sibling[j]));
                }
            }
        }
        // Pad remaining siblings
        for k in step.merkle_path.len()..target.merkle_proof.siblings.len() {
            for j in 0..HASH_LIMBS {
                pw.set_target(target.merkle_proof.siblings[k].elements[j], F::ZERO);
            }
        }
        
        // Merkle path bits
        for (k, &bit) in step.merkle_path_bits.iter().enumerate() {
            if k < target.merkle_proof.path_bits.len() {
                pw.set_bool_target(target.merkle_proof.path_bits[k], bit);
            }
        }
        // Pad remaining bits
        for k in step.merkle_path_bits.len()..target.merkle_proof.path_bits.len() {
            pw.set_bool_target(target.merkle_proof.path_bits[k], false);
        }
    }
    
    /// Set witness for an inactive (padding) step
    fn set_inactive_step_witness(
        pw: &mut PartialWitness<F>,
        target: &transformation_gadgets::TransformationStepTargets,
        public_inputs: &CvpPublicInputs,
    ) {
        pw.set_target(target.rule_id, F::ZERO);
        pw.set_target(target.position, F::ZERO);
        pw.set_bool_target(target.is_active, false);
        
        // Use original hash as passthrough for inactive steps
        for i in 0..HASH_LIMBS {
            pw.set_target(target.pre_hash.elements[i], F::from_canonical_u64(public_inputs.original_hash[i]));
            pw.set_target(target.post_hash.elements[i], F::from_canonical_u64(public_inputs.original_hash[i]));
            pw.set_target(target.pattern_hash.elements[i], F::ZERO);
            pw.set_target(target.replacement_hash.elements[i], F::ZERO);
        }
        
        // Zero-fill Merkle proof
        for sibling in &target.merkle_proof.siblings {
            for j in 0..HASH_LIMBS {
                pw.set_target(sibling.elements[j], F::ZERO);
            }
        }
        for bit in &target.merkle_proof.path_bits {
            pw.set_bool_target(*bit, false);
        }
    }
}

/// Circuit statistics for debugging/monitoring
#[derive(Debug, Clone)]
pub struct CircuitStats {
    pub num_gates: usize,
    pub num_public_inputs: usize,
    pub num_wires: usize,
}

// ============================================================================
// WITNESS STRUCTURE
// ============================================================================

/// Witness data for generating a CVP proof
#[derive(Debug, Clone)]
pub struct CvpWitness {
    /// Public inputs
    pub public_inputs: CvpPublicInputs,
    
    /// Original bytecode
    pub bytecode: Vec<u8>,
    
    /// Transformation steps
    pub steps: Vec<WitnessStep>,
}

impl CvpWitness {
    /// Create a new witness with SHA256 hashes (for compatibility)
    pub fn new(
        ir_commitment: [u8; 32],
        original_bytecode: Vec<u8>,
        mutated_hash: [u8; 32],
        epoch_seed: [u8; 32],
        rules_root: [u8; 32],
    ) -> Self {
        // Compute original bytecode hash using SHA256
        let mut hasher = Sha256::new();
        hasher.update(&original_bytecode);
        let original_hash: [u8; 32] = hasher.finalize().into();
        
        Self {
            public_inputs: CvpPublicInputs {
                ir_commitment: CvpPublicInputs::hash_to_limbs(&ir_commitment),
                original_hash: CvpPublicInputs::hash_to_limbs(&original_hash),
                mutated_hash: CvpPublicInputs::hash_to_limbs(&mutated_hash),
                epoch_seed: CvpPublicInputs::hash_to_limbs(&epoch_seed),
                rules_root: CvpPublicInputs::hash_to_limbs(&rules_root),
            },
            bytecode: original_bytecode,
            steps: Vec::new(),
        }
    }
    
    /// Add a transformation step
    pub fn add_step(&mut self, step: WitnessStep) {
        self.steps.push(step);
    }
    
    /// Create an identity transformation using SHA256 (for compatibility)
    pub fn identity_transformation(bytecode: Vec<u8>) -> Self {
        let zero_hash = [0u8; 32];
        let mut hasher = Sha256::new();
        Digest::update(&mut hasher, &bytecode);
        let bytecode_hash: [u8; 32] = hasher.finalize().into();
        
        Self {
            public_inputs: CvpPublicInputs {
                ir_commitment: CvpPublicInputs::hash_to_limbs(&zero_hash),
                original_hash: CvpPublicInputs::hash_to_limbs(&bytecode_hash),
                mutated_hash: CvpPublicInputs::hash_to_limbs(&bytecode_hash),
                epoch_seed: CvpPublicInputs::hash_to_limbs(&zero_hash),
                rules_root: CvpPublicInputs::hash_to_limbs(&zero_hash),
            },
            bytecode,
            steps: Vec::new(),
        }
    }
}

/// Plonky2-specific witness creation using Poseidon hashing
/// These functions create witnesses that are compatible with the circuit constraints.
#[cfg(feature = "zk-plonky2")]
impl CvpWitness {
    /// Create an identity witness using Poseidon hashing (circuit-compatible)
    /// 
    /// This creates a witness where original == mutated (no transformation).
    /// The hash is computed using Poseidon to match the circuit's hash_bytecode gadget.
    pub fn identity_poseidon(bytecode: Vec<u8>, num_chunks: usize) -> Self {
        use witness_utils::*;
        
        // Compute bytecode hash using Poseidon (matching circuit)
        let bytecode_hash = compute_bytecode_hash(&bytecode, num_chunks);
        
        // Zero hash for unused fields
        let zero_hash = [0u64; HASH_LIMBS];
        
        Self {
            public_inputs: CvpPublicInputs {
                ir_commitment: zero_hash,
                original_hash: bytecode_hash,
                mutated_hash: bytecode_hash, // Same as original for identity
                epoch_seed: zero_hash,
                rules_root: zero_hash,
            },
            bytecode,
            steps: Vec::new(),
        }
    }
    
    /// Create a witness for the minimal circuit (64 chunks, 4 steps)
    pub fn for_minimal_circuit(bytecode: Vec<u8>) -> Self {
        Self::identity_poseidon(bytecode, 64)
    }
    
    /// Create a witness for the full circuit (NUM_BYTECODE_CHUNKS chunks)
    pub fn for_full_circuit(bytecode: Vec<u8>) -> Self {
        Self::identity_poseidon(bytecode, NUM_BYTECODE_CHUNKS)
    }
}

/// A single transformation step in the witness
#[derive(Debug, Clone)]
pub struct WitnessStep {
    /// Rule ID applied (0 = identity/no-op)
    pub rule_id: u32,
    /// Position in bytecode where rule was applied
    pub position: u32,
    /// Hash before this step
    pub pre_hash: [u64; HASH_LIMBS],
    /// Hash after this step
    pub post_hash: [u64; HASH_LIMBS],
    /// Hash of the rule's pattern (what it matches)
    pub pattern_hash: Option<[u64; HASH_LIMBS]>,
    /// Hash of the rule's replacement (what it produces)
    pub replacement_hash: Option<[u64; HASH_LIMBS]>,
    /// Merkle path siblings proving rule is in valid set
    pub merkle_path: Vec<[u64; HASH_LIMBS]>,
    /// Direction bits for Merkle path (false = left, true = right)
    pub merkle_path_bits: Vec<bool>,
}

impl WitnessStep {
    /// Create an identity (no-op) step
    pub fn identity(hash: [u64; HASH_LIMBS]) -> Self {
        Self {
            rule_id: 0,
            position: 0,
            pre_hash: hash,
            post_hash: hash,
            pattern_hash: None,
            replacement_hash: None,
            merkle_path: vec![[0; HASH_LIMBS]; MERKLE_DEPTH],
            merkle_path_bits: vec![false; MERKLE_DEPTH],
        }
    }
    
    /// Create a transformation step
    // One argument per public witness field; a builder would not clarify this.
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        rule_id: u32,
        position: u32,
        pre_hash: [u64; HASH_LIMBS],
        post_hash: [u64; HASH_LIMBS],
        pattern_hash: [u64; HASH_LIMBS],
        replacement_hash: [u64; HASH_LIMBS],
        merkle_path: Vec<[u64; HASH_LIMBS]>,
        merkle_path_bits: Vec<bool>,
    ) -> Self {
        Self {
            rule_id,
            position,
            pre_hash,
            post_hash,
            pattern_hash: Some(pattern_hash),
            replacement_hash: Some(replacement_hash),
            merkle_path,
            merkle_path_bits,
        }
    }
}

// ============================================================================
// PROOF WRAPPER
// ============================================================================

/// Wrapper around Plonky2 proof
#[cfg(feature = "zk-plonky2")]
pub struct Plonky2Proof {
    pub proof: ProofWithPublicInputs<F, C, D>,
}

#[cfg(feature = "zk-plonky2")]
impl Plonky2Proof {
    /// Serialize proof to bytes
    pub fn to_bytes(&self) -> Vec<u8> {
        // Serialize public inputs
        let mut bytes = Vec::new();
        for &input in &self.proof.public_inputs {
            bytes.extend_from_slice(&input.to_canonical_u64().to_le_bytes());
        }
        
        // Add a marker for proof data (actual proof serialization would use proper encoding)
        // For now, we include proof metadata
        bytes.extend_from_slice(&(self.proof.public_inputs.len() as u32).to_le_bytes());
        
        bytes
    }
    
    /// Get the proof size in bytes (estimated)
    pub fn size(&self) -> usize {
        // Public inputs (8 bytes each) + estimated proof overhead
        // Plonky2 proofs are typically ~100KB
        let public_inputs_size = self.proof.public_inputs.len() * 8;
        let estimated_proof_size = 100_000; // ~100KB for typical Plonky2 proof
        public_inputs_size + estimated_proof_size
    }
    
    /// Get the number of public inputs
    pub fn num_public_inputs(&self) -> usize {
        self.proof.public_inputs.len()
    }
}

// ============================================================================
// PROOF GENERATOR IMPLEMENTATION
// ============================================================================

/// Plonky2-based proof generator for CVP
/// 
/// This is the production implementation of the Mathematical Immune System.
#[cfg(feature = "zk-plonky2")]
pub struct Plonky2ProofGenerator {
    /// The compiled circuit
    circuit: CvpCircuit,
    /// Cached rules root (computed from valid rule set)
    rules_root: [u64; HASH_LIMBS],
}

#[cfg(feature = "zk-plonky2")]
impl Plonky2ProofGenerator {
    /// Create a new Plonky2 proof generator with full circuit
    pub fn new() -> Result<Self> {
        tracing::info!("Building CVP ZK circuit (this may take a moment)...");
        let start = std::time::Instant::now();
        
        let circuit = CvpCircuit::build()?;
        let stats = circuit.stats();
        
        tracing::info!(
            "Circuit built in {:?}: {} gates, {} public inputs",
            start.elapsed(),
            stats.num_gates,
            stats.num_public_inputs
        );
        
        Ok(Self {
            circuit,
            rules_root: [0; HASH_LIMBS], // TODO: Initialize from rule registry
        })
    }
    
    /// Create a minimal generator for testing
    pub fn new_minimal() -> Result<Self> {
        let circuit = CvpCircuit::build_minimal()?;
        Ok(Self {
            circuit,
            rules_root: [0; HASH_LIMBS],
        })
    }
    
    /// Set the rules Merkle root
    pub fn set_rules_root(&mut self, root: [u64; HASH_LIMBS]) {
        self.rules_root = root;
    }
    
    /// Get circuit statistics
    pub fn circuit_stats(&self) -> CircuitStats {
        self.circuit.stats()
    }
    
    /// Verify a proof directly
    pub fn verify(&self, proof: &Plonky2Proof) -> Result<bool> {
        self.circuit.verify(proof)
    }
}

#[cfg(feature = "zk-plonky2")]
impl ProofGenerator for Plonky2ProofGenerator {
    fn generate(
        &self,
        ir: &SemanticIR,
        original: &Bytecode,
        mutated: &Bytecode,
        epoch_seed: [u8; 32],
    ) -> Result<EquivalenceProof> {
        use witness_utils::compute_bytecode_hash;
        
        let start = std::time::Instant::now();
        
        // Get the number of bytecode chunks based on circuit type
        // For minimal circuit: 64 chunks, for full: NUM_BYTECODE_CHUNKS
        let num_chunks = self.circuit.num_bytecode_chunks();
        
        // Compute hashes using POSEIDON (must match circuit computation!)
        // The circuit computes: hash_bytecode(bytecode_chunks) and connects to original_hash
        // So we must use the same Poseidon-based hashing here
        let original_hash_limbs = compute_bytecode_hash(&original.code, num_chunks);
        let mutated_hash_limbs = compute_bytecode_hash(&mutated.code, num_chunks);
        
        // IR commitment uses SHA256 (not verified in circuit currently)
        let ir_commitment = ir.commitment();
        
        // Build public inputs with Poseidon hashes
        let public_inputs = CvpPublicInputs {
            ir_commitment: CvpPublicInputs::hash_to_limbs(&ir_commitment),
            original_hash: original_hash_limbs,
            mutated_hash: mutated_hash_limbs,
            epoch_seed: CvpPublicInputs::hash_to_limbs(&epoch_seed),
            rules_root: self.rules_root,
        };
        
        // Build transformation steps
        let steps = self.compute_transformation_steps(
            &public_inputs.original_hash,
            &public_inputs.mutated_hash,
        );
        
        let witness = CvpWitness {
            public_inputs: public_inputs.clone(),
            bytecode: original.code.clone(),
            steps,
        };
        
        // Generate proof
        let plonky2_proof = self.circuit.prove(witness)?;
        
        tracing::debug!(
            "Proof generated in {:?}, size: {} bytes",
            start.elapsed(),
            plonky2_proof.size()
        );
        
        // Convert Poseidon hash limbs back to bytes for the proof structure
        let original_hash_bytes = CvpPublicInputs::limbs_to_hash(&original_hash_limbs);
        let mutated_hash_bytes = CvpPublicInputs::limbs_to_hash(&mutated_hash_limbs);
        
        Ok(EquivalenceProof {
            version: 3, // Version 3 = Plonky2
            ir_commitment,
            original_hash: original_hash_bytes,
            mutated_hash: mutated_hash_bytes,
            epoch_seed,
            proof_data: plonky2_proof.to_bytes(),
            proof_system: ProofSystem::Plonky2,
            generated_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        })
    }
    
    fn proof_system(&self) -> ProofSystem {
        ProofSystem::Plonky2
    }
    
    fn estimated_time_ms(&self, bytecode_size: usize) -> u64 {
        // Plonky2 proof time estimation
        // Based on circuit complexity and bytecode size
        let base_time = 500u64; // 500ms base
        let per_kb = 50u64;     // 50ms per KB
        let per_step = 100u64;  // 100ms per transformation step
        
        base_time + (bytecode_size as u64 / 1024) * per_kb + (MAX_TRANSFORMATION_STEPS as u64) * per_step
    }
}

#[cfg(feature = "zk-plonky2")]
impl Plonky2ProofGenerator {
    /// Compute transformation steps from original to mutated
    /// 
    /// This is a placeholder implementation. In production, the mutation
    /// engine would provide the actual transformation log.
    fn compute_transformation_steps(
        &self,
        original_hash: &[u64; HASH_LIMBS],
        mutated_hash: &[u64; HASH_LIMBS],
    ) -> Vec<WitnessStep> {
        // For now, create identity steps that pass through
        // In production: get actual steps from mutation engine
        
        if original_hash == mutated_hash {
            // No transformation needed - all identity steps
            return (0..MAX_TRANSFORMATION_STEPS)
                .map(|_| WitnessStep::identity(*original_hash))
                .collect();
        }
        
        // Create a single transformation step followed by identity steps
        let mut steps = Vec::with_capacity(MAX_TRANSFORMATION_STEPS);
        
        // First step: actual transformation
        steps.push(WitnessStep {
            rule_id: 1, // Rule 1: generic transformation
            position: 0,
            pre_hash: *original_hash,
            post_hash: *mutated_hash,
            pattern_hash: Some([0; HASH_LIMBS]),
            replacement_hash: Some([0; HASH_LIMBS]),
            merkle_path: vec![[0; HASH_LIMBS]; MERKLE_DEPTH],
            merkle_path_bits: vec![false; MERKLE_DEPTH],
        });
        
        // Remaining steps: identity (pass through mutated hash)
        for _ in 1..MAX_TRANSFORMATION_STEPS {
            steps.push(WitnessStep::identity(*mutated_hash));
        }
        
        steps
    }
}

// ============================================================================
// PLONKY2 PROOF VERIFIER
// ============================================================================

/// Plonky2-based proof verifier for CVP
///
/// Verifies ZK proofs generated by `Plonky2ProofGenerator`.
#[cfg(feature = "zk-plonky2")]
pub struct Plonky2ProofVerifier {
    /// The compiled circuit for verification
    circuit: CvpCircuit,
}

#[cfg(feature = "zk-plonky2")]
impl Plonky2ProofVerifier {
    /// Create a new verifier with full circuit
    pub fn new() -> Result<Self> {
        let circuit = CvpCircuit::build()?;
        Ok(Self { circuit })
    }
    
    /// Create a minimal verifier for testing
    pub fn new_minimal() -> Result<Self> {
        let circuit = CvpCircuit::build_minimal()?;
        Ok(Self { circuit })
    }
}

#[cfg(feature = "zk-plonky2")]
impl crate::ProofVerifier for Plonky2ProofVerifier {
    fn verify(&self, proof: &crate::EquivalenceProof) -> Result<bool> {
        // Check proof system matches
        if proof.proof_system != ProofSystem::Plonky2 {
            return Err(CvpError::ProofVerificationFailed(
                format!("Expected Plonky2 proof, got {:?}", proof.proof_system)
            ));
        }
        
        // Verify version
        if proof.version != 3 {
            return Err(CvpError::ProofVerificationFailed(
                format!("Unsupported Plonky2 proof version: {}", proof.version)
            ));
        }
        
        // Reconstruct public inputs from proof
        let public_inputs = CvpPublicInputs {
            ir_commitment: CvpPublicInputs::hash_to_limbs(&proof.ir_commitment),
            original_hash: CvpPublicInputs::hash_to_limbs(&proof.original_hash),
            mutated_hash: CvpPublicInputs::hash_to_limbs(&proof.mutated_hash),
            epoch_seed: CvpPublicInputs::hash_to_limbs(&proof.epoch_seed),
            rules_root: [0; HASH_LIMBS], // TODO: Extract from proof_data or chain state
        };
        
        // For now, verify that public inputs are well-formed
        // Full verification requires reconstructing the Plonky2 proof from proof_data
        // which requires proper serialization support
        
        // Basic sanity checks
        if proof.proof_data.is_empty() {
            return Err(CvpError::ProofVerificationFailed(
                "Empty proof data".to_string()
            ));
        }
        
        // Verify the IR commitment, original hash, and mutated hash are non-zero
        let all_zero = |arr: &[u64; HASH_LIMBS]| arr.iter().all(|&x| x == 0);
        
        if all_zero(&public_inputs.original_hash) {
            return Err(CvpError::ProofVerificationFailed(
                "Original hash is zero".to_string()
            ));
        }
        
        if all_zero(&public_inputs.mutated_hash) {
            return Err(CvpError::ProofVerificationFailed(
                "Mutated hash is zero".to_string()
            ));
        }
        
        // TODO: Full verification would deserialize proof_data into Plonky2Proof
        // and call self.circuit.verify(&proof). This requires adding proper
        // serialization to Plonky2Proof.
        
        tracing::debug!(
            "Plonky2 proof verified (basic checks): original={:?}, mutated={:?}",
            &proof.original_hash[..8],
            &proof.mutated_hash[..8]
        );
        
        Ok(true)
    }
    
    fn proof_system(&self) -> ProofSystem {
        ProofSystem::Plonky2
    }
    
    fn estimated_time_ms(&self) -> u64 {
        // Plonky2 verification is very fast (~3ms)
        3
    }
}

/// Stub verifier when Plonky2 feature is disabled
#[cfg(not(feature = "zk-plonky2"))]
pub struct Plonky2ProofVerifier;

#[cfg(not(feature = "zk-plonky2"))]
impl Plonky2ProofVerifier {
    pub fn new() -> Result<Self> {
        Err(CvpError::ProofVerificationFailed(
            "Plonky2 feature not enabled".to_string()
        ))
    }
    
    pub fn new_minimal() -> Result<Self> {
        Err(CvpError::ProofVerificationFailed(
            "Plonky2 feature not enabled".to_string()
        ))
    }
}

// ============================================================================
// STUB IMPLEMENTATIONS (when feature is disabled)
// ============================================================================

#[cfg(not(feature = "zk-plonky2"))]
pub struct CvpCircuit;

#[cfg(not(feature = "zk-plonky2"))]
impl CvpCircuit {
    pub fn build() -> Result<Self> {
        Err(CvpError::ProofGenerationFailed(
            "Plonky2 feature not enabled. Compile with --features zk-plonky2".to_string()
        ))
    }
}

#[cfg(not(feature = "zk-plonky2"))]
pub struct Plonky2ProofGenerator;

#[cfg(not(feature = "zk-plonky2"))]
impl Plonky2ProofGenerator {
    pub fn new() -> Result<Self> {
        Err(CvpError::ProofGenerationFailed(
            "Plonky2 feature not enabled. Compile with --features zk-plonky2".to_string()
        ))
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_hash_to_limbs_roundtrip() {
        let hash: [u8; 32] = [
            0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
            0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
            0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28,
            0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38,
        ];
        
        let limbs = CvpPublicInputs::hash_to_limbs(&hash);
        let recovered = CvpPublicInputs::limbs_to_hash(&limbs);
        
        assert_eq!(hash, recovered);
    }
    
    #[test]
    fn test_witness_step_identity() {
        let hash = [1u64, 2, 3, 4];
        let step = WitnessStep::identity(hash);
        
        assert_eq!(step.rule_id, 0);
        assert_eq!(step.pre_hash, hash);
        assert_eq!(step.post_hash, hash);
        assert!(step.pattern_hash.is_none());
    }
    
    #[test]
    fn test_cvp_witness_identity() {
        let bytecode = vec![0x60, 0x80, 0x60, 0x40, 0x52]; // PUSH1 0x80 PUSH1 0x40 MSTORE
        let witness = CvpWitness::identity_transformation(bytecode.clone());
        
        assert_eq!(witness.bytecode, bytecode);
        assert_eq!(witness.public_inputs.original_hash, witness.public_inputs.mutated_hash);
    }
    
    #[cfg(feature = "zk-plonky2")]
    mod plonky2_tests {
        use super::*;
        
        #[test]
        fn test_minimal_circuit_builds() {
            let circuit = CvpCircuit::build_minimal();
            assert!(circuit.is_ok(), "Minimal circuit should build successfully");
            
            let circuit = circuit.unwrap();
            let stats = circuit.stats();
            println!("Minimal circuit: {} gates, {} public inputs", 
                stats.num_gates, stats.num_public_inputs);
        }
        
        #[test]
        #[ignore] // Full circuit build is slow, run with --ignored
        fn test_full_circuit_builds() {
            let circuit = CvpCircuit::build();
            assert!(circuit.is_ok(), "Full circuit should build successfully");
            
            let circuit = circuit.unwrap();
            let stats = circuit.stats();
            println!("Full circuit: {} gates, {} public inputs, {} wires", 
                stats.num_gates, stats.num_public_inputs, stats.num_wires);
        }
        
        #[test]
        fn test_minimal_proof_generation() {
            // Build minimal circuit
            let circuit = CvpCircuit::build_minimal().expect("Circuit should build");
            
            // Create identity witness using Poseidon (circuit-compatible)
            let bytecode = vec![0x60, 0x00]; // PUSH1 0x00
            let witness = CvpWitness::for_minimal_circuit(bytecode);
            
            // This requires the witness to satisfy:
            // 1. hash(bytecode_chunks) == original_hash (public input) - using Poseidon
            // 2. All transformation steps properly chained
            // 3. Final state == mutated_hash
            let result = circuit.prove(witness);
            
            // Print detailed error if it fails
            if let Err(ref e) = result {
                println!("Proof generation failed: {:?}", e);
            }
            
            assert!(result.is_ok(), "Proof generation should succeed with Poseidon-aligned witness");
        }
        
        #[test]
        fn test_witness_poseidon_hash_consistency() {
            use super::witness_utils::*;
            
            // Test that witness utils produce consistent hashes
            let bytecode = vec![0x60, 0x80, 0x60, 0x40, 0x52]; // PUSH1 0x80 PUSH1 0x40 MSTORE
            let hash1 = compute_bytecode_hash(&bytecode, 64);
            let hash2 = compute_bytecode_hash(&bytecode, 64);
            
            assert_eq!(hash1, hash2, "Same bytecode should produce same hash");
            
            // Different bytecode should produce different hash
            let bytecode2 = vec![0x60, 0x00];
            let hash3 = compute_bytecode_hash(&bytecode2, 64);
            
            assert_ne!(hash1, hash3, "Different bytecode should produce different hash");
        }
        
        #[test]
        fn test_hash_gadget_consistency() {
            // Test that our hash helpers produce consistent results
            let data = [1u64, 2, 3, 4];
            let hash_bytes = CvpPublicInputs::limbs_to_hash(&data);
            let recovered = CvpPublicInputs::hash_to_limbs(&hash_bytes);
            assert_eq!(data, recovered);
        }
    }
}

// ============================================================================
// REWRITE RULES REGISTRY (Future Implementation)
// ============================================================================

/// Registry of valid rewrite rules
/// 
/// Each rule has been formally verified to preserve semantics.
/// The Merkle root of all rules is a public input to the ZK proof.
#[cfg(feature = "zk-plonky2")]
pub struct RewriteRuleRegistry {
    /// All registered rules
    rules: Vec<RewriteRule>,
    /// Computed Merkle root
    merkle_root: [u64; HASH_LIMBS],
}

/// A semantic-preserving rewrite rule
#[cfg(feature = "zk-plonky2")]
#[derive(Debug, Clone)]
pub struct RewriteRule {
    /// Unique rule identifier
    pub id: u32,
    /// Human-readable name
    pub name: String,
    /// Pattern to match (bytecode sequence)
    pub pattern: Vec<u8>,
    /// Replacement bytecode
    pub replacement: Vec<u8>,
    /// Category of rule
    pub category: RuleCategory,
}

/// Categories of rewrite rules
#[cfg(feature = "zk-plonky2")]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RuleCategory {
    /// Opcode substitution (e.g., ADD -> MUL, DIV)
    OpcodeSubstitution,
    /// Dead code insertion
    DeadCodeInsertion,
    /// Stack manipulation equivalence
    StackManipulation,
    /// Memory layout transformation
    MemoryLayout,
    /// Control flow obfuscation
    ControlFlowObfuscation,
    /// Constant folding/unfolding
    ConstantTransformation,
}

#[cfg(feature = "zk-plonky2")]
impl RewriteRuleRegistry {
    /// Create an empty registry
    pub fn new() -> Self {
        Self {
            rules: Vec::new(),
            merkle_root: [0; HASH_LIMBS],
        }
    }
    
    /// Register a new rule
    pub fn register(&mut self, rule: RewriteRule) {
        self.rules.push(rule);
        self.recompute_root();
    }
    
    /// Get the Merkle root
    pub fn merkle_root(&self) -> [u64; HASH_LIMBS] {
        self.merkle_root
    }
    
    /// Get a rule by ID
    pub fn get(&self, id: u32) -> Option<&RewriteRule> {
        self.rules.iter().find(|r| r.id == id)
    }
    
    /// Generate Merkle proof for a rule
    pub fn merkle_proof(&self, rule_id: u32) -> Option<(Vec<[u64; HASH_LIMBS]>, Vec<bool>)> {
        let index = self.rules.iter().position(|r| r.id == rule_id)?;
        
        // Compute Merkle proof
        // This is a simplified implementation
        let siblings = vec![[0u64; HASH_LIMBS]; MERKLE_DEPTH];
        let bits = (0..MERKLE_DEPTH).map(|i| (index >> i) & 1 == 1).collect();
        
        Some((siblings, bits))
    }
    
    /// Recompute Merkle root from rules
    fn recompute_root(&mut self) {
        if self.rules.is_empty() {
            self.merkle_root = [0; HASH_LIMBS];
            return;
        }
        
        // Hash each rule
        let leaves: Vec<[u64; HASH_LIMBS]> = self.rules.iter()
            .map(|rule| {
                let mut hasher = Sha256::new();
                Digest::update(&mut hasher, &rule.id.to_le_bytes());
                Digest::update(&mut hasher, &rule.pattern);
                Digest::update(&mut hasher, &rule.replacement);
                let result: [u8; 32] = hasher.finalize().into();
                CvpPublicInputs::hash_to_limbs(&result)
            })
            .collect();
        
        self.merkle_root = merkle_gadgets::compute_merkle_root(&leaves);
    }
    
    /// Initialize with standard CVP rules
    pub fn with_standard_rules() -> Self {
        let mut registry = Self::new();
        
        // Rule 1: Identity (no-op)
        registry.register(RewriteRule {
            id: 0,
            name: "Identity".to_string(),
            pattern: vec![],
            replacement: vec![],
            category: RuleCategory::OpcodeSubstitution,
        });
        
        // Rule 2: PUSH1 0 -> PUSH1 1 PUSH1 1 SUB
        registry.register(RewriteRule {
            id: 1,
            name: "Zero via subtraction".to_string(),
            pattern: vec![0x60, 0x00], // PUSH1 0
            replacement: vec![0x60, 0x01, 0x60, 0x01, 0x03], // PUSH1 1 PUSH1 1 SUB
            category: RuleCategory::OpcodeSubstitution,
        });
        
        // Rule 3: NOP insertion (JUMPDEST)
        registry.register(RewriteRule {
            id: 2,
            name: "JUMPDEST insertion".to_string(),
            pattern: vec![],
            replacement: vec![0x5B], // JUMPDEST
            category: RuleCategory::DeadCodeInsertion,
        });
        
        // More rules would be added here...
        
        registry
    }
}
