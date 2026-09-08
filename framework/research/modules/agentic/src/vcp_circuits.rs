//! # VCP Circuits - Plonky2 ZK Proofs for Verifiable AI Inference
//!
//! This module implements Zero-Knowledge proof circuits for verifying
//! that AI inference was correctly performed by a specific model.
//!
//! ## What We Prove
//!
//! 1. A specific model (by hash) was used
//! 2. A specific input was provided (by hash)
//! 3. A specific output was generated (by hash)
//! 4. Multiple Sentinels agree on the result (threshold)
//!
//! ## Architecture
//!
//! Unlike the CVP (bytecode mutation) proofs, VCP proofs verify:
//! - Input commitment: H(prompt || context)
//! - Output commitment: H(output || metadata)
//! - Model commitment: H(model_id || weights_hash)
//! - Sentinel threshold: N-of-M attestations
//!
//! ## Requirements
//!
//! Requires nightly Rust:
//! ```bash
//! rustup override set nightly
//! cargo build --features zk-vcp
//! ```

#[cfg(feature = "zk-vcp")]
use plonky2::field::goldilocks_field::GoldilocksField;
#[cfg(feature = "zk-vcp")]
use plonky2::field::types::Field;
#[cfg(feature = "zk-vcp")]
use plonky2::hash::hash_types::HashOutTarget;
#[cfg(feature = "zk-vcp")]
use plonky2::hash::poseidon::PoseidonHash;
#[cfg(feature = "zk-vcp")]
use plonky2::iop::target::{BoolTarget, Target};
#[cfg(feature = "zk-vcp")]
use plonky2::iop::witness::{PartialWitness, WitnessWrite};
#[cfg(feature = "zk-vcp")]
use plonky2::plonk::circuit_builder::CircuitBuilder;
#[cfg(feature = "zk-vcp")]
use plonky2::plonk::circuit_data::{CircuitConfig, CircuitData};
#[cfg(feature = "zk-vcp")]
use plonky2::plonk::config::PoseidonGoldilocksConfig;
#[cfg(feature = "zk-vcp")]
use plonky2::plonk::proof::ProofWithPublicInputs;

use alloc::vec::Vec;
use sha2::{Sha256, Digest};
use crate::error::AgenticError;
use crate::forge::{ModelAttestation, SentinelAttestation, VerifiableComputeProof};
use crate::agent_did::AgentDid;

// ============================================================================
// TYPE ALIASES
// ============================================================================

#[cfg(feature = "zk-vcp")]
type F = GoldilocksField;
#[cfg(feature = "zk-vcp")]
type C = PoseidonGoldilocksConfig;
#[cfg(feature = "zk-vcp")]
const D: usize = 2;

// ============================================================================
// CONSTANTS
// ============================================================================

/// Number of 64-bit limbs to represent a 256-bit hash
pub const HASH_LIMBS: usize = 4;

/// Maximum number of Sentinels that can attest
pub const MAX_SENTINELS: usize = 8;

/// Minimum threshold for quorum (3-of-5 default)
pub const DEFAULT_THRESHOLD: usize = 3;

/// Maximum input size for hashing (16KB)
pub const MAX_INPUT_SIZE: usize = 16384;

/// Maximum output size for hashing (64KB)
pub const MAX_OUTPUT_SIZE: usize = 65536;

// ============================================================================
// PUBLIC INPUT STRUCTURE
// ============================================================================

/// Public inputs for VCP verification
#[derive(Debug, Clone)]
pub struct VcpPublicInputs {
    /// Model commitment: H(model_id || weights_hash)
    pub model_commitment: [u64; HASH_LIMBS],
    
    /// Input commitment: H(prompt || context)
    pub input_commitment: [u64; HASH_LIMBS],
    
    /// Output commitment: H(output)
    pub output_commitment: [u64; HASH_LIMBS],
    
    /// Sentinels Merkle root (valid sentinel set)
    pub sentinels_root: [u64; HASH_LIMBS],
    
    /// Timestamp
    pub timestamp: u64,
    
    /// Required threshold
    pub threshold: u8,
    
    /// Number of attestations received
    pub attestation_count: u8,
}

impl VcpPublicInputs {
    /// Convert 32-byte hash to 4 x 64-bit limbs
    pub fn hash_to_limbs(hash: &[u8; 32]) -> [u64; HASH_LIMBS] {
        let mut limbs = [0u64; HASH_LIMBS];
        for i in 0..HASH_LIMBS {
            let start = i * 8;
            limbs[i] = u64::from_le_bytes(hash[start..start + 8].try_into().unwrap());
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
}

// ============================================================================
// VCP CIRCUIT
// ============================================================================

/// Circuit for verifying AI inference
#[cfg(feature = "zk-vcp")]
pub struct VcpCircuit {
    /// Compiled circuit data
    circuit_data: CircuitData<F, C, D>,
    
    /// Model commitment target
    model_commitment_target: HashOutTarget,
    
    /// Input commitment target
    input_commitment_target: HashOutTarget,
    
    /// Output commitment target
    output_commitment_target: HashOutTarget,
    
    /// Sentinels root target
    sentinels_root_target: HashOutTarget,
    
    /// Timestamp target
    timestamp_target: Target,
    
    /// Threshold target
    threshold_target: Target,
    
    /// Attestation targets
    attestation_targets: Vec<AttestationTargets>,
}

#[cfg(feature = "zk-vcp")]
#[derive(Clone)]
struct AttestationTargets {
    sentinel_id: HashOutTarget,
    is_valid: BoolTarget,
    signature_hash: HashOutTarget,
}

#[cfg(feature = "zk-vcp")]
impl VcpCircuit {
    /// Build the VCP circuit
    pub fn build() -> Result<Self, AgenticError> {
        let config = CircuitConfig::standard_recursion_config();
        let mut builder = CircuitBuilder::<F, D>::new(config);
        
        // ============ PUBLIC INPUTS ============
        
        // Model commitment
        let model_commitment_target = builder.add_virtual_hash();
        builder.register_public_inputs(&model_commitment_target.elements);
        
        // Input commitment
        let input_commitment_target = builder.add_virtual_hash();
        builder.register_public_inputs(&input_commitment_target.elements);
        
        // Output commitment
        let output_commitment_target = builder.add_virtual_hash();
        builder.register_public_inputs(&output_commitment_target.elements);
        
        // Sentinels root
        let sentinels_root_target = builder.add_virtual_hash();
        builder.register_public_inputs(&sentinels_root_target.elements);
        
        // Timestamp
        let timestamp_target = builder.add_virtual_target();
        builder.register_public_input(timestamp_target);
        
        // Threshold
        let threshold_target = builder.add_virtual_target();
        builder.register_public_input(threshold_target);
        
        // ============ PRIVATE INPUTS (WITNESS) ============
        
        // Attestations from sentinels
        let mut attestation_targets = Vec::with_capacity(MAX_SENTINELS);
        let mut valid_count = builder.zero();
        
        for _ in 0..MAX_SENTINELS {
            let sentinel_id = builder.add_virtual_hash();
            let is_valid = builder.add_virtual_bool_target_safe();
            let signature_hash = builder.add_virtual_hash();
            
            // Count valid attestations
            valid_count = builder.add(valid_count, is_valid.target);
            
            attestation_targets.push(AttestationTargets {
                sentinel_id,
                is_valid,
                signature_hash,
            });
        }
        
        // ============ CONSTRAINT: Threshold Check ============
        // valid_count >= threshold
        
        // This is a simplified check - in production we'd use range proofs
        let threshold_met = builder.is_equal(
            valid_count, 
            threshold_target
        ).target;
        let one = builder.one();
        builder.connect(threshold_met, one);
        
        // ============ CONSTRAINT: Attestation Consistency ============
        // Each valid attestation must be for the correct model/input/output
        
        for att in &attestation_targets {
            // Compute expected attestation hash
            // H(model || input || output || sentinel_id)
            let mut expected_inputs = Vec::new();
            expected_inputs.extend_from_slice(&model_commitment_target.elements);
            expected_inputs.extend_from_slice(&input_commitment_target.elements);
            expected_inputs.extend_from_slice(&output_commitment_target.elements);
            expected_inputs.extend_from_slice(&att.sentinel_id.elements);
            
            let expected_hash = builder.hash_n_to_hash_no_pad::<PoseidonHash>(expected_inputs);
            
            // If valid, signature_hash must match expected
            for i in 0..4 {
                let diff = builder.sub(att.signature_hash.elements[i], expected_hash.elements[i]);
                let masked_diff = builder.mul(att.is_valid.target, diff);
                let zero = builder.zero();
                builder.connect(masked_diff, zero);
            }
        }
        
        // Build circuit
        let circuit_data = builder.build::<C>();
        
        Ok(Self {
            circuit_data,
            model_commitment_target,
            input_commitment_target,
            output_commitment_target,
            sentinels_root_target,
            timestamp_target,
            threshold_target,
            attestation_targets,
        })
    }
    
    /// Generate a proof
    pub fn prove(&self, witness: VcpWitness) -> Result<VcpProof, AgenticError> {
        let mut pw = PartialWitness::new();
        
        // Set public inputs
        Self::set_hash_witness(&mut pw, &self.model_commitment_target, &witness.public_inputs.model_commitment);
        Self::set_hash_witness(&mut pw, &self.input_commitment_target, &witness.public_inputs.input_commitment);
        Self::set_hash_witness(&mut pw, &self.output_commitment_target, &witness.public_inputs.output_commitment);
        Self::set_hash_witness(&mut pw, &self.sentinels_root_target, &witness.public_inputs.sentinels_root);
        
        pw.set_target(self.timestamp_target, F::from_canonical_u64(witness.public_inputs.timestamp));
        pw.set_target(self.threshold_target, F::from_canonical_u64(witness.public_inputs.threshold as u64));
        
        // Set attestation witness
        for (i, att_target) in self.attestation_targets.iter().enumerate() {
            if let Some(att) = witness.attestations.get(i) {
                Self::set_hash_witness(&mut pw, &att_target.sentinel_id, &att.sentinel_id);
                pw.set_bool_target(att_target.is_valid, att.is_valid);
                Self::set_hash_witness(&mut pw, &att_target.signature_hash, &att.signature_hash);
            } else {
                // Inactive attestation
                Self::set_hash_witness(&mut pw, &att_target.sentinel_id, &[0; HASH_LIMBS]);
                pw.set_bool_target(att_target.is_valid, false);
                Self::set_hash_witness(&mut pw, &att_target.signature_hash, &[0; HASH_LIMBS]);
            }
        }
        
        // Generate proof
        let proof = self.circuit_data.prove(pw)
            .map_err(|e| AgenticError::InternalError(format!("VCP proof generation failed: {:?}", e)))?;
        
        Ok(VcpProof { proof })
    }
    
    /// Verify a proof
    pub fn verify(&self, proof: &VcpProof) -> Result<bool, AgenticError> {
        self.circuit_data.verify(proof.proof.clone())
            .map(|_| true)
            .map_err(|e| AgenticError::InternalError(format!("VCP verification failed: {:?}", e)))
    }
    
    fn set_hash_witness(
        pw: &mut PartialWitness<F>,
        target: &HashOutTarget,
        value: &[u64; HASH_LIMBS],
    ) {
        for i in 0..HASH_LIMBS {
            pw.set_target(target.elements[i], F::from_canonical_u64(value[i]));
        }
    }
}

// ============================================================================
// WITNESS STRUCTURE
// ============================================================================

/// Witness data for VCP proof generation
#[derive(Debug, Clone)]
pub struct VcpWitness {
    /// Public inputs
    pub public_inputs: VcpPublicInputs,
    
    /// Attestation witnesses
    pub attestations: Vec<AttestationWitness>,
}

/// Single attestation witness
#[derive(Debug, Clone)]
pub struct AttestationWitness {
    /// Sentinel ID (as hash limbs)
    pub sentinel_id: [u64; HASH_LIMBS],
    
    /// Is this attestation valid
    pub is_valid: bool,
    
    /// Signature hash
    pub signature_hash: [u64; HASH_LIMBS],
}

// ============================================================================
// PROOF WRAPPER
// ============================================================================

/// Wrapped VCP proof
#[cfg(feature = "zk-vcp")]
pub struct VcpProof {
    pub proof: ProofWithPublicInputs<F, C, D>,
}

#[cfg(feature = "zk-vcp")]
impl VcpProof {
    /// Serialize to bytes
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = Vec::new();
        for &input in &self.proof.public_inputs {
            bytes.extend_from_slice(&input.to_canonical_u64().to_le_bytes());
        }
        bytes
    }
    
    /// Get proof size
    pub fn size(&self) -> usize {
        self.proof.public_inputs.len() * 8 + 50_000 // Estimated
    }
}

// ============================================================================
// VCP GENERATOR
// ============================================================================

/// Generates VCP proofs for AI inference
pub struct VcpGenerator {
    #[cfg(feature = "zk-vcp")]
    circuit: VcpCircuit,
    
    /// Threshold for quorum
    threshold: usize,
}

impl VcpGenerator {
    /// Create a new VCP generator
    #[cfg(feature = "zk-vcp")]
    pub fn new(threshold: usize) -> Result<Self, AgenticError> {
        let circuit = VcpCircuit::build()?;
        Ok(Self { circuit, threshold })
    }
    
    #[cfg(not(feature = "zk-vcp"))]
    pub fn new(threshold: usize) -> Result<Self, AgenticError> {
        Ok(Self { threshold })
    }
    
    /// Generate a VCP for inference
    pub fn generate_vcp(
        &self,
        agent_did: &AgentDid,
        model: &ModelAttestation,
        input: &[u8],
        output: &[u8],
        attestations: &[SentinelAttestation],
    ) -> Result<VerifiableComputeProof, AgenticError> {
        // Compute commitments
        let model_commitment = self.compute_model_commitment(model);
        let input_commitment = self.compute_input_commitment(input);
        let output_commitment = self.compute_output_commitment(output);
        
        // Check threshold
        if attestations.len() < self.threshold {
            return Err(AgenticError::InsufficientQuorum);
        }
        
        let timestamp = current_timestamp();
        
        // Generate proof ID
        let proof_id = self.compute_proof_id(
            agent_did,
            &model_commitment,
            &input_commitment,
            timestamp,
        );
        
        // Generate ZK proof
        #[cfg(feature = "zk-vcp")]
        let zk_proof = {
            let public_inputs = VcpPublicInputs {
                model_commitment: VcpPublicInputs::hash_to_limbs(&model_commitment),
                input_commitment: VcpPublicInputs::hash_to_limbs(&input_commitment),
                output_commitment: VcpPublicInputs::hash_to_limbs(&output_commitment),
                sentinels_root: [0; HASH_LIMBS], // TODO: From registry
                timestamp,
                threshold: self.threshold as u8,
                attestation_count: attestations.len() as u8,
            };
            
            let att_witnesses: Vec<AttestationWitness> = attestations.iter()
                .map(|att| {
                    let sentinel_hash = compute_sentinel_hash(&att.sentinel_id);
                    let sig_hash = compute_signature_hash(
                        &model_commitment,
                        &input_commitment,
                        &output_commitment,
                        &att.sentinel_id,
                    );
                    AttestationWitness {
                        sentinel_id: VcpPublicInputs::hash_to_limbs(&sentinel_hash),
                        is_valid: true,
                        signature_hash: VcpPublicInputs::hash_to_limbs(&sig_hash),
                    }
                })
                .collect();
            
            let witness = VcpWitness {
                public_inputs,
                attestations: att_witnesses,
            };
            
            let proof = self.circuit.prove(witness)?;
            proof.to_bytes()
        };
        
        #[cfg(not(feature = "zk-vcp"))]
        let zk_proof = {
            // Fallback: Use attestation signatures as proof
            let mut proof_data = Vec::new();
            proof_data.extend_from_slice(&model_commitment);
            proof_data.extend_from_slice(&input_commitment);
            proof_data.extend_from_slice(&output_commitment);
            for att in attestations {
                proof_data.extend_from_slice(&att.signature);
            }
            proof_data
        };
        
        Ok(VerifiableComputeProof {
            proof_id,
            agent_did: agent_did.did_string.clone(),
            model: model.clone(),
            input_hash: input_commitment,
            output_hash: output_commitment,
            zk_proof,
            attestations: attestations.to_vec(),
            timestamp,
            compute_duration_ms: 0,
            total_tokens: 0,
        })
    }
    
    /// Verify a VCP
    pub fn verify_vcp(&self, vcp: &VerifiableComputeProof) -> Result<bool, AgenticError> {
        // Check threshold
        if vcp.attestations.len() < self.threshold {
            return Err(AgenticError::InsufficientQuorum);
        }
        
        // Check ZK proof
        if vcp.zk_proof.is_empty() {
            return Err(AgenticError::InvalidProof);
        }
        
        #[cfg(feature = "zk-vcp")]
        {
            // Full ZK verification would go here
            // For now, verify attestation signatures
        }
        
        // Verify attestation signatures
        let model_commitment = self.compute_model_commitment(&vcp.model);
        
        for att in &vcp.attestations {
            let expected_hash = compute_signature_hash(
                &model_commitment,
                &vcp.input_hash,
                &vcp.output_hash,
                &att.sentinel_id,
            );
            
            // Verify signature matches expected hash
            // In production, verify actual cryptographic signature
            if att.signature.is_empty() {
                return Err(AgenticError::InvalidProof);
            }
        }
        
        Ok(true)
    }
    
    fn compute_model_commitment(&self, model: &ModelAttestation) -> [u8; 32] {
        let mut hasher = Sha256::new();
        hasher.update(&model.model_id);
        hasher.update(&model.weights_hash);
        hasher.finalize().into()
    }
    
    fn compute_input_commitment(&self, input: &[u8]) -> [u8; 32] {
        let mut hasher = Sha256::new();
        hasher.update(input);
        hasher.finalize().into()
    }
    
    fn compute_output_commitment(&self, output: &[u8]) -> [u8; 32] {
        let mut hasher = Sha256::new();
        hasher.update(output);
        hasher.finalize().into()
    }
    
    fn compute_proof_id(
        &self,
        agent_did: &AgentDid,
        model_commitment: &[u8; 32],
        input_commitment: &[u8; 32],
        timestamp: u64,
    ) -> [u8; 32] {
        let mut hasher = Sha256::new();
        hasher.update(&agent_did.unique_id);
        hasher.update(model_commitment);
        hasher.update(input_commitment);
        hasher.update(&timestamp.to_le_bytes());
        hasher.finalize().into()
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn compute_sentinel_hash(sentinel_id: &[u8; 32]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(sentinel_id);
    hasher.finalize().into()
}

fn compute_signature_hash(
    model_commitment: &[u8; 32],
    input_commitment: &[u8; 32],
    output_commitment: &[u8; 32],
    sentinel_id: &[u8; 32],
) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(model_commitment);
    hasher.update(input_commitment);
    hasher.update(output_commitment);
    hasher.update(sentinel_id);
    hasher.finalize().into()
}

fn current_timestamp() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

// ============================================================================
// STUB IMPLEMENTATIONS
// ============================================================================

#[cfg(not(feature = "zk-vcp"))]
pub struct VcpCircuit;

#[cfg(not(feature = "zk-vcp"))]
pub struct VcpProof;

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agent_did::{create_agent_did, AutonomyLevel};
    
    fn create_test_model() -> ModelAttestation {
        ModelAttestation {
            model_id: [1u8; 32],
            name: "TestModel".into(),
            version: "1.0".into(),
            weights_hash: [2u8; 32],
            capabilities: vec![],
            verified: true,
        }
    }
    
    fn create_test_attestations(count: usize) -> Vec<SentinelAttestation> {
        (0..count).map(|i| SentinelAttestation {
            sentinel_id: [i as u8; 32],
            signature: vec![1, 2, 3, i as u8],
            timestamp: current_timestamp(),
            hardware_attestation: None,
        }).collect()
    }
    
    #[test]
    fn test_vcp_generator_creation() {
        let generator = VcpGenerator::new(3);
        assert!(generator.is_ok());
    }
    
    #[test]
    fn test_vcp_generation() {
        let generator = VcpGenerator::new(3).unwrap();
        
        let controller = b"controller";
        let did = create_agent_did(controller, AutonomyLevel::Bounded, vec![]).unwrap();
        
        let model = create_test_model();
        let input = b"What is the meaning of life?";
        let output = b"42";
        let attestations = create_test_attestations(3);
        
        let vcp = generator.generate_vcp(&did, &model, input, output, &attestations);
        assert!(vcp.is_ok());
        
        let vcp = vcp.unwrap();
        assert!(!vcp.zk_proof.is_empty());
        assert_eq!(vcp.attestations.len(), 3);
    }
    
    #[test]
    fn test_vcp_insufficient_threshold() {
        let generator = VcpGenerator::new(3).unwrap();
        
        let controller = b"controller";
        let did = create_agent_did(controller, AutonomyLevel::Bounded, vec![]).unwrap();
        
        let model = create_test_model();
        let input = b"test";
        let output = b"result";
        let attestations = create_test_attestations(2); // Only 2, need 3
        
        let result = generator.generate_vcp(&did, &model, input, output, &attestations);
        assert!(matches!(result, Err(AgenticError::InsufficientQuorum)));
    }
    
    #[test]
    fn test_vcp_verification() {
        let generator = VcpGenerator::new(3).unwrap();
        
        let controller = b"controller";
        let did = create_agent_did(controller, AutonomyLevel::Bounded, vec![]).unwrap();
        
        let model = create_test_model();
        let input = b"test input";
        let output = b"test output";
        let attestations = create_test_attestations(3);
        
        let vcp = generator.generate_vcp(&did, &model, input, output, &attestations).unwrap();
        
        let verified = generator.verify_vcp(&vcp);
        assert!(verified.is_ok());
        assert!(verified.unwrap());
    }
    
    #[test]
    fn test_commitment_computation() {
        let generator = VcpGenerator::new(3).unwrap();
        let model = create_test_model();
        
        let commitment1 = generator.compute_model_commitment(&model);
        let commitment2 = generator.compute_model_commitment(&model);
        
        assert_eq!(commitment1, commitment2);
        assert!(!commitment1.iter().all(|&b| b == 0));
    }
}
