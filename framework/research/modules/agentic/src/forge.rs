//! # The Forge - Verifiable Compute Proofs (VCP)
//!
//! Enables trustless AI inference by generating ZK proofs that attest
//! to the correct execution of a specific model on specific inputs.
//!
//! ## Flow
//!
//! 1. Agent submits inference request
//! 2. Sentinel nodes perform inference
//! 3. Sentinels generate VCP (Plonky2 proof)
//! 4. VCP submitted on-chain
//! 5. Output returned to agent

use alloc::{string::String, vec::Vec, vec};
use codec::{Decode, Encode};
use scale_info::TypeInfo;
use serde::{Deserialize, Serialize};

use crate::agent_did::AgentDid;
use crate::error::AgenticError;

/// Model capability categories
#[derive(Debug, Clone, Copy, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum ModelCapability {
    /// Text generation
    TextGeneration,
    /// Code generation
    CodeGeneration,
    /// Image understanding
    ImageUnderstanding,
    /// Reasoning
    Reasoning,
    /// Tool use
    ToolUse,
    /// Embeddings
    Embeddings,
    /// Classification
    Classification,
}

/// Model attestation (proof of which model was used)
#[derive(Debug, Clone, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct ModelAttestation {
    /// Model identifier
    pub model_id: [u8; 32],
    
    /// Model name
    pub name: String,
    
    /// Model version
    pub version: String,
    
    /// SHA256 of model weights/config
    pub weights_hash: [u8; 32],
    
    /// Model capabilities
    pub capabilities: Vec<ModelCapability>,
    
    /// Is model verified by Demiurge
    pub verified: bool,
}

/// Sentinel node attestation
#[derive(Debug, Clone, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct SentinelAttestation {
    /// Sentinel node ID
    pub sentinel_id: [u8; 32],
    
    /// Sentinel's signature on the output
    pub signature: Vec<u8>,
    
    /// Timestamp of attestation
    pub timestamp: u64,
    
    /// Hardware attestation (optional)
    pub hardware_attestation: Option<Vec<u8>>,
}

/// Verifiable Compute Proof
#[derive(Debug, Clone, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct VerifiableComputeProof {
    /// Unique proof ID
    pub proof_id: [u8; 32],
    
    /// Agent that requested inference
    pub agent_did: String,
    
    /// Model attestation
    pub model: ModelAttestation,
    
    /// Hash of input prompt/context
    pub input_hash: [u8; 32],
    
    /// Hash of output
    pub output_hash: [u8; 32],
    
    /// Plonky2 ZK proof
    pub zk_proof: Vec<u8>,
    
    /// Sentinel attestations (threshold required)
    pub attestations: Vec<SentinelAttestation>,
    
    /// Inference timestamp
    pub timestamp: u64,
    
    /// Compute duration (ms)
    pub compute_duration_ms: u64,
    
    /// Token count (input + output)
    pub total_tokens: u32,
}

impl VerifiableComputeProof {
    /// Create a new VCP
    pub fn new(
        agent_did: &AgentDid,
        model: ModelAttestation,
        input: &[u8],
        output: &[u8],
    ) -> Self {
        let mut hasher = blake3::Hasher::new();
        hasher.update(&agent_did.unique_id);
        hasher.update(&current_timestamp().to_le_bytes());
        hasher.update(input);
        let proof_id: [u8; 32] = hasher.finalize().into();
        
        let input_hash: [u8; 32] = blake3::hash(input).into();
        let output_hash: [u8; 32] = blake3::hash(output).into();
        
        Self {
            proof_id,
            agent_did: agent_did.did_string.clone(),
            model,
            input_hash,
            output_hash,
            zk_proof: Vec::new(), // Filled by Sentinel
            attestations: Vec::new(),
            timestamp: current_timestamp(),
            compute_duration_ms: 0,
            total_tokens: 0,
        }
    }
    
    /// Add sentinel attestation
    pub fn add_attestation(&mut self, attestation: SentinelAttestation) {
        self.attestations.push(attestation);
    }
    
    /// Check if VCP has sufficient attestations (threshold)
    pub fn has_quorum(&self, threshold: usize) -> bool {
        self.attestations.len() >= threshold
    }
    
    /// Verify the VCP (simplified - full impl uses Plonky2)
    pub fn verify(&self) -> bool {
        // In production:
        // 1. Verify ZK proof with Plonky2
        // 2. Verify all sentinel signatures
        // 3. Check threshold
        
        // Simplified verification
        !self.zk_proof.is_empty() && self.has_quorum(2)
    }
}

/// Inference request from agent
#[derive(Debug, Clone, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct InferenceRequest {
    /// Request ID
    pub request_id: [u8; 32],
    
    /// Requesting agent
    pub agent_did: String,
    
    /// Target model
    pub model_id: [u8; 32],
    
    /// Prompt/input
    pub prompt: String,
    
    /// Context (e.g., DRC-369 asset metadata)
    pub context: Vec<u8>,
    
    /// System prompt
    pub system_prompt: Option<String>,
    
    /// Max tokens
    pub max_tokens: u32,
    
    /// Temperature (stored as u8 0-100 to avoid f32 TypeInfo issue)
    pub temperature: u8,
    
    /// Tools available to the model
    pub tools: Vec<ToolDefinition>,
    
    /// Timestamp
    pub timestamp: u64,
    
    /// Payment (CGT)
    pub payment: u128,
}

impl InferenceRequest {
    /// Create a new inference request
    pub fn new(
        agent_did: &AgentDid,
        model_id: [u8; 32],
        prompt: String,
    ) -> Self {
        let mut hasher = blake3::Hasher::new();
        hasher.update(&agent_did.unique_id);
        hasher.update(&current_timestamp().to_le_bytes());
        hasher.update(prompt.as_bytes());
        let request_id: [u8; 32] = hasher.finalize().into();
        
        Self {
            request_id,
            agent_did: agent_did.did_string.clone(),
            model_id,
            prompt,
            context: Vec::new(),
            system_prompt: None,
            max_tokens: 1024,
            temperature: 70, // 0.7 * 100
            tools: Vec::new(),
            timestamp: current_timestamp(),
            payment: 0,
        }
    }
    
    /// Add context
    pub fn with_context(mut self, context: Vec<u8>) -> Self {
        self.context = context;
        self
    }
    
    /// Add system prompt
    pub fn with_system_prompt(mut self, system: String) -> Self {
        self.system_prompt = Some(system);
        self
    }
    
    /// Add tools
    pub fn with_tools(mut self, tools: Vec<ToolDefinition>) -> Self {
        self.tools = tools;
        self
    }
}

/// Inference result
#[derive(Debug, Clone, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct InferenceResult {
    /// Request ID
    pub request_id: [u8; 32],
    
    /// Output text
    pub output: String,
    
    /// Tool calls made
    pub tool_calls: Vec<ToolCall>,
    
    /// Finish reason
    pub finish_reason: FinishReason,
    
    /// Usage stats
    pub usage: UsageStats,
    
    /// VCP for this inference
    pub proof: VerifiableComputeProof,
}

/// Tool definition for agent use
#[derive(Debug, Clone, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct ToolDefinition {
    /// Tool name
    pub name: String,
    
    /// Description
    pub description: String,
    
    /// Parameters schema (JSON)
    pub parameters: String,
}

/// Tool call made by model
#[derive(Debug, Clone, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct ToolCall {
    /// Tool name
    pub name: String,
    
    /// Arguments (JSON)
    pub arguments: String,
    
    /// Result (filled after execution)
    pub result: Option<String>,
}

/// Inference finish reason
#[derive(Debug, Clone, Copy, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum FinishReason {
    /// Model finished naturally
    Stop,
    /// Max tokens reached
    Length,
    /// Tool call requested
    ToolCall,
    /// Content filter triggered
    ContentFilter,
    /// Error
    Error,
}

/// Usage statistics
#[derive(Debug, Clone, Copy, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct UsageStats {
    /// Input tokens
    pub prompt_tokens: u32,
    
    /// Output tokens
    pub completion_tokens: u32,
    
    /// Total tokens
    pub total_tokens: u32,
    
    /// Inference time (ms)
    pub latency_ms: u64,
}

/// Registered model in the Forge
#[derive(Debug, Clone, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct RegisteredModel {
    /// Model ID
    pub model_id: [u8; 32],
    
    /// Human-readable name
    pub name: String,
    
    /// Model version
    pub version: String,
    
    /// Weights hash
    pub weights_hash: [u8; 32],
    
    /// Capabilities
    pub capabilities: Vec<ModelCapability>,
    
    /// Cost per 1K tokens (CGT)
    pub cost_per_1k_tokens: u128,
    
    /// Creator DID
    pub creator: String,
    
    /// Creator royalty percentage
    pub royalty_percent: u8,
    
    /// Is active
    pub active: bool,
    
    /// Total inferences
    pub total_inferences: u64,
    
    /// Average latency (ms)
    pub avg_latency_ms: u64,
}

/// The Forge Registry
#[derive(Debug, Default)]
pub struct ForgeRegistry {
    /// Registered models
    models: alloc::collections::BTreeMap<[u8; 32], RegisteredModel>,
    
    /// Pending proofs (awaiting quorum)
    pending_proofs: alloc::collections::BTreeMap<[u8; 32], VerifiableComputeProof>,
    
    /// Verified proofs
    verified_proofs: alloc::collections::BTreeMap<[u8; 32], VerifiableComputeProof>,
    
    /// Active sentinels
    sentinels: alloc::collections::BTreeSet<[u8; 32]>,
    
    /// Quorum threshold
    quorum_threshold: usize,
}

impl ForgeRegistry {
    /// Create new Forge registry
    pub fn new(quorum_threshold: usize) -> Self {
        Self {
            quorum_threshold,
            ..Default::default()
        }
    }
    
    /// Register a model
    pub fn register_model(&mut self, model: RegisteredModel) -> Result<(), AgenticError> {
        if self.models.contains_key(&model.model_id) {
            return Err(AgenticError::ModelAlreadyRegistered);
        }
        
        self.models.insert(model.model_id, model);
        Ok(())
    }
    
    /// Get model by ID
    pub fn get_model(&self, model_id: &[u8; 32]) -> Option<&RegisteredModel> {
        self.models.get(model_id)
    }
    
    /// List models by capability
    pub fn find_models(&self, capability: ModelCapability) -> Vec<&RegisteredModel> {
        self.models.values()
            .filter(|m| m.active && m.capabilities.contains(&capability))
            .collect()
    }
    
    /// Register a sentinel node
    pub fn register_sentinel(&mut self, sentinel_id: [u8; 32]) {
        self.sentinels.insert(sentinel_id);
    }
    
    /// Submit a VCP (from sentinel)
    pub fn submit_proof(&mut self, proof: VerifiableComputeProof) -> Result<bool, AgenticError> {
        let proof_id = proof.proof_id;
        
        // Check if we already have this proof
        if let Some(existing) = self.pending_proofs.get_mut(&proof_id) {
            // Add attestations
            for att in &proof.attestations {
                if !existing.attestations.iter().any(|a| a.sentinel_id == att.sentinel_id) {
                    existing.add_attestation(att.clone());
                }
            }
            
            // Check quorum
            if existing.has_quorum(self.quorum_threshold) {
                let verified = self.pending_proofs.remove(&proof_id).unwrap();
                self.verified_proofs.insert(proof_id, verified);
                return Ok(true); // Quorum reached
            }
        } else {
            // New proof
            self.pending_proofs.insert(proof_id, proof);
        }
        
        Ok(false) // Waiting for more attestations
    }
    
    /// Get verified proof
    pub fn get_proof(&self, proof_id: &[u8; 32]) -> Option<&VerifiableComputeProof> {
        self.verified_proofs.get(proof_id)
    }
    
    /// Verify a proof is valid
    pub fn verify_proof(&self, proof_id: &[u8; 32]) -> bool {
        self.verified_proofs.contains_key(proof_id)
    }
    
    /// Calculate inference cost
    pub fn calculate_cost(&self, model_id: &[u8; 32], tokens: u32) -> Option<u128> {
        self.models.get(model_id).map(|m| {
            (m.cost_per_1k_tokens * tokens as u128) / 1000
        })
    }
    
    /// Update model stats after inference
    pub fn record_inference(&mut self, model_id: &[u8; 32], latency_ms: u64) {
        if let Some(model) = self.models.get_mut(model_id) {
            // Update running average
            let total = model.total_inferences;
            model.avg_latency_ms = (model.avg_latency_ms * total + latency_ms) / (total + 1);
            model.total_inferences += 1;
        }
    }
}

/// Helper to get current timestamp
fn current_timestamp() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agent_did::create_agent_did;
    use crate::agent_did::{AutonomyLevel, Capability};
    
    fn create_test_model() -> RegisteredModel {
        RegisteredModel {
            model_id: [1u8; 32],
            name: "TestModel".into(),
            version: "1.0".into(),
            weights_hash: [2u8; 32],
            capabilities: vec![ModelCapability::TextGeneration],
            cost_per_1k_tokens: 1000,
            creator: "did:demiurge:mainnet:0x123".into(),
            royalty_percent: 5,
            active: true,
            total_inferences: 0,
            avg_latency_ms: 0,
        }
    }
    
    #[test]
    fn test_vcp_creation() {
        let controller = b"controller";
        let did = create_agent_did(controller, AutonomyLevel::Bounded, vec![]).unwrap();
        
        let model = ModelAttestation {
            model_id: [1u8; 32],
            name: "TestModel".into(),
            version: "1.0".into(),
            weights_hash: [2u8; 32],
            capabilities: vec![ModelCapability::TextGeneration],
            verified: true,
        };
        
        let vcp = VerifiableComputeProof::new(
            &did,
            model,
            b"Hello, world!",
            b"Response",
        );
        
        assert!(!vcp.proof_id.iter().all(|&b| b == 0));
    }
    
    #[test]
    fn test_forge_registry() {
        let mut registry = ForgeRegistry::new(2);
        
        let model = create_test_model();
        registry.register_model(model).unwrap();
        
        let found = registry.find_models(ModelCapability::TextGeneration);
        assert_eq!(found.len(), 1);
        
        let cost = registry.calculate_cost(&[1u8; 32], 1000).unwrap();
        assert_eq!(cost, 1000);
    }
    
    #[test]
    fn test_quorum_threshold() {
        let mut registry = ForgeRegistry::new(2);
        
        let controller = b"controller";
        let did = create_agent_did(controller, AutonomyLevel::Bounded, vec![]).unwrap();
        
        let model = ModelAttestation {
            model_id: [1u8; 32],
            name: "TestModel".into(),
            version: "1.0".into(),
            weights_hash: [2u8; 32],
            capabilities: vec![],
            verified: true,
        };
        
        let mut vcp = VerifiableComputeProof::new(&did, model, b"input", b"output");
        vcp.zk_proof = vec![1, 2, 3]; // Mock proof
        
        // Add first attestation
        vcp.add_attestation(SentinelAttestation {
            sentinel_id: [1u8; 32],
            signature: vec![1, 2, 3],
            timestamp: 0,
            hardware_attestation: None,
        });
        
        let quorum = registry.submit_proof(vcp.clone()).unwrap();
        assert!(!quorum); // Need 2
        
        // Add second attestation
        vcp.add_attestation(SentinelAttestation {
            sentinel_id: [2u8; 32],
            signature: vec![4, 5, 6],
            timestamp: 0,
            hardware_attestation: None,
        });
        
        let quorum = registry.submit_proof(vcp).unwrap();
        assert!(quorum); // Got 2
    }
}
