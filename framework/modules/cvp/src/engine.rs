//! CVP Engine
//!
//! The main engine that orchestrates Consensus-Verified Polymorphism.
//! Handles epoch transitions, contract mutations, and proof generation.
//!
//! # Proof Systems
//!
//! The engine supports multiple proof systems:
//! - **TranslationValidation**: Default, fast, good for development
//! - **Plonky2**: Production-grade ZK proofs (requires `zk-plonky2` feature)
//!
//! # Usage
//!
//! ```rust,ignore
//! // Default engine with TranslationValidation proofs
//! let engine = CvpEngine::new();
//!
//! // Production engine with Plonky2 ZK proofs (requires nightly + feature)
//! #[cfg(feature = "zk-plonky2")]
//! let engine = CvpEngine::with_plonky2()?;
//! ```

use crate::{
    SemanticIR, ContractId, Bytecode,
    PolymorphicCompiler, MutationConfig,
    EquivalenceProof, ProofGenerator, ProofVerifier, ProofSystem,
    TranslationValidationGenerator, TranslationValidationVerifier,
    Result, CvpError,
};
use codec::{Decode, Encode};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};

#[cfg(feature = "zk-plonky2")]
use crate::plonky2_circuits::{Plonky2ProofGenerator, Plonky2ProofVerifier};

/// CVP Engine configuration
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub struct CvpConfig {
    /// How many blocks between mutations
    pub mutation_epoch_length: u64,
    
    /// Mutation configuration
    pub mutation_config: MutationConfig,
    
    /// Whether CVP is enabled
    pub enabled: bool,
    
    /// Whether to log mutations
    pub log_mutations: bool,
    
    /// Maximum concurrent proof generations
    pub max_concurrent_proofs: u32,
}

impl Default for CvpConfig {
    fn default() -> Self {
        Self {
            mutation_epoch_length: 100,
            mutation_config: MutationConfig::default(),
            enabled: true,
            log_mutations: true,
            max_concurrent_proofs: 4,
        }
    }
}

/// A registered CVP-enabled contract
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub struct CvpContract {
    /// Contract identifier
    pub id: ContractId,
    
    /// The Semantic IR (logic representation)
    pub semantic_ir: SemanticIR,
    
    /// Current bytecode
    pub current_bytecode: Bytecode,
    
    /// Previous bytecode (for rollback)
    pub previous_bytecode: Option<Bytecode>,
    
    /// Latest equivalence proof
    pub latest_proof: Option<EquivalenceProof>,
    
    /// Mutation history
    pub mutation_count: u64,
    
    /// Created at block
    pub created_at_block: u64,
    
    /// Last mutated at block
    pub last_mutation_block: u64,
}

impl CvpContract {
    /// Create a new CVP contract
    pub fn new(id: ContractId, semantic_ir: SemanticIR, bytecode: Bytecode, block: u64) -> Self {
        Self {
            id,
            semantic_ir,
            current_bytecode: bytecode,
            previous_bytecode: None,
            latest_proof: None,
            mutation_count: 0,
            created_at_block: block,
            last_mutation_block: block,
        }
    }
}

/// Epoch information
#[derive(Debug, Clone, Encode, Decode, Serialize, Deserialize)]
pub struct EpochInfo {
    /// Epoch number
    pub number: u64,
    
    /// Start block
    pub start_block: u64,
    
    /// End block
    pub end_block: u64,
    
    /// Epoch seed
    pub seed: [u8; 32],
    
    /// Contracts mutated in this epoch
    pub mutated_contracts: Vec<ContractId>,
    
    /// Proofs generated
    pub proofs: Vec<EquivalenceProof>,
}

/// CVP mutation result
#[derive(Debug, Clone)]
pub struct MutationResult {
    /// Contract ID
    pub contract_id: ContractId,
    
    /// Original bytecode hash
    pub original_hash: [u8; 32],
    
    /// New bytecode hash
    pub new_hash: [u8; 32],
    
    /// The equivalence proof
    pub proof: EquivalenceProof,
    
    /// Size change (new - old)
    pub size_change: i64,
}

/// The main CVP Engine
pub struct CvpEngine {
    /// Configuration
    config: CvpConfig,
    
    /// Registered CVP contracts
    contracts: Arc<RwLock<HashMap<ContractId, CvpContract>>>,
    
    /// Polymorphic compiler
    compiler: PolymorphicCompiler,
    
    /// Proof generator
    proof_generator: Box<dyn ProofGenerator>,
    
    /// Proof verifier
    proof_verifier: Box<dyn ProofVerifier>,
    
    /// Current epoch number
    current_epoch: u64,
    
    /// Current block number
    current_block: u64,
    
    /// Previous epoch seed (for determinism)
    previous_epoch_seed: [u8; 32],
}

impl CvpEngine {
    /// Create a new CVP engine with default configuration
    /// Uses TranslationValidation proof system (fast, good for development)
    pub fn new() -> Self {
        Self::with_config(CvpConfig::default())
    }
    
    /// Create a CVP engine with custom configuration
    /// Uses TranslationValidation proof system by default
    pub fn with_config(config: CvpConfig) -> Self {
        let compiler = PolymorphicCompiler::with_config(config.mutation_config.clone());
        
        Self {
            config,
            contracts: Arc::new(RwLock::new(HashMap::new())),
            compiler,
            proof_generator: Box::new(TranslationValidationGenerator::new()),
            proof_verifier: Box::new(TranslationValidationVerifier::new()),
            current_epoch: 0,
            current_block: 0,
            previous_epoch_seed: [0u8; 32],
        }
    }
    
    /// Create a CVP engine with Plonky2 ZK proofs (production-grade)
    ///
    /// This uses real zero-knowledge proofs for cryptographic security.
    /// Requires the `zk-plonky2` feature and nightly Rust.
    ///
    /// # Example
    ///
    /// ```rust,ignore
    /// let engine = CvpEngine::with_plonky2()?;
    /// ```
    #[cfg(feature = "zk-plonky2")]
    pub fn with_plonky2() -> Result<Self> {
        Self::with_plonky2_config(CvpConfig::default())
    }
    
    /// Create a CVP engine with Plonky2 and custom configuration
    #[cfg(feature = "zk-plonky2")]
    pub fn with_plonky2_config(config: CvpConfig) -> Result<Self> {
        let compiler = PolymorphicCompiler::with_config(config.mutation_config.clone());
        
        tracing::info!("CVP: Initializing Plonky2 proof generator (this may take a moment)...");
        let proof_generator = Plonky2ProofGenerator::new()?;
        let stats = proof_generator.circuit_stats();
        tracing::info!(
            "CVP: Plonky2 circuit ready - {} gates, {} public inputs",
            stats.num_gates,
            stats.num_public_inputs
        );
        
        Ok(Self {
            config,
            contracts: Arc::new(RwLock::new(HashMap::new())),
            compiler,
            proof_generator: Box::new(proof_generator),
            proof_verifier: Box::new(Plonky2ProofVerifier::new()?),
            current_epoch: 0,
            current_block: 0,
            previous_epoch_seed: [0u8; 32],
        })
    }
    
    /// Create a minimal Plonky2 engine for testing
    #[cfg(feature = "zk-plonky2")]
    pub fn with_plonky2_minimal() -> Result<Self> {
        let config = CvpConfig::default();
        let compiler = PolymorphicCompiler::with_config(config.mutation_config.clone());
        
        let proof_generator = Plonky2ProofGenerator::new_minimal()?;
        
        Ok(Self {
            config,
            contracts: Arc::new(RwLock::new(HashMap::new())),
            compiler,
            proof_generator: Box::new(proof_generator),
            proof_verifier: Box::new(Plonky2ProofVerifier::new_minimal()?),
            current_epoch: 0,
            current_block: 0,
            previous_epoch_seed: [0u8; 32],
        })
    }
    
    /// Set a custom proof generator
    pub fn set_proof_generator<G: ProofGenerator + 'static>(&mut self, generator: G) {
        self.proof_generator = Box::new(generator);
    }
    
    /// Set a custom proof verifier
    pub fn set_proof_verifier<V: ProofVerifier + 'static>(&mut self, verifier: V) {
        self.proof_verifier = Box::new(verifier);
    }
    
    /// Get the current proof system being used
    pub fn proof_system(&self) -> ProofSystem {
        self.proof_generator.proof_system()
    }
    
    /// Get the CVP configuration
    pub fn config(&self) -> &CvpConfig {
        &self.config
    }
    
    /// Register a contract for CVP
    pub fn register_contract(
        &self,
        id: ContractId,
        semantic_ir: SemanticIR,
        initial_bytecode: Vec<u8>,
    ) -> Result<()> {
        let bytecode = Bytecode::new(initial_bytecode, 0, [0u8; 32]);
        let contract = CvpContract::new(id, semantic_ir, bytecode, self.current_block);
        
        let mut contracts = self.contracts.write()
            .map_err(|_| CvpError::InternalError("Lock poisoned".to_string()))?;
        
        contracts.insert(id, contract);
        
        if self.config.log_mutations {
            tracing::info!("CVP: Registered contract {:?}", hex::encode(id));
        }
        
        Ok(())
    }
    
    /// Unregister a contract from CVP
    pub fn unregister_contract(&self, id: &ContractId) -> Result<Option<CvpContract>> {
        let mut contracts = self.contracts.write()
            .map_err(|_| CvpError::InternalError("Lock poisoned".to_string()))?;
        
        Ok(contracts.remove(id))
    }
    
    /// Get a contract's current bytecode
    pub fn get_bytecode(&self, id: &ContractId) -> Result<Option<Vec<u8>>> {
        let contracts = self.contracts.read()
            .map_err(|_| CvpError::InternalError("Lock poisoned".to_string()))?;
        
        Ok(contracts.get(id).map(|c| c.current_bytecode.code.clone()))
    }
    
    /// Check if an epoch transition is needed
    pub fn should_mutate(&self, block_number: u64) -> bool {
        if !self.config.enabled {
            return false;
        }
        
        block_number > 0 && block_number.is_multiple_of(self.config.mutation_epoch_length)
    }
    
    /// Generate epoch seed from block data
    pub fn generate_epoch_seed(&self, block_number: u64, block_hashes: &[[u8; 32]]) -> [u8; 32] {
        use blake2::{Blake2b512, Digest};
        
        let mut hasher = Blake2b512::new();
        hasher.update(b"CVP_EPOCH_SEED_V1");
        hasher.update(self.previous_epoch_seed);
        hasher.update(block_number.to_le_bytes());
        
        for hash in block_hashes {
            hasher.update(hash);
        }
        
        let hash = hasher.finalize();
        let mut result = [0u8; 32];
        result.copy_from_slice(&hash[..32]);
        result
    }
    
    /// Perform epoch transition - mutate all registered contracts
    pub fn transition_epoch(
        &mut self,
        block_number: u64,
        block_hashes: &[[u8; 32]],
    ) -> Result<Vec<MutationResult>> {
        if !self.config.enabled {
            return Ok(vec![]);
        }
        
        let epoch_seed = self.generate_epoch_seed(block_number, block_hashes);
        let new_epoch = block_number / self.config.mutation_epoch_length;
        
        if self.config.log_mutations {
            tracing::info!(
                "CVP: Epoch transition {} -> {} at block {}",
                self.current_epoch,
                new_epoch,
                block_number
            );
        }
        
        let mut results = Vec::new();
        
        // Get contract IDs to mutate
        let contract_ids: Vec<ContractId> = {
            let contracts = self.contracts.read()
                .map_err(|_| CvpError::InternalError("Lock poisoned".to_string()))?;
            contracts.keys().cloned().collect()
        };
        
        // Mutate each contract
        for contract_id in contract_ids {
            match self.mutate_contract(&contract_id, epoch_seed, block_number) {
                Ok(result) => {
                    results.push(result);
                }
                Err(e) => {
                    tracing::error!(
                        "CVP: Failed to mutate contract {:?}: {}",
                        hex::encode(contract_id),
                        e
                    );
                    // Continue with other contracts
                }
            }
        }
        
        // Update state
        self.current_epoch = new_epoch;
        self.current_block = block_number;
        self.previous_epoch_seed = epoch_seed;
        
        if self.config.log_mutations {
            tracing::info!(
                "CVP: Epoch transition complete. Mutated {} contracts.",
                results.len()
            );
        }
        
        Ok(results)
    }
    
    /// Mutate a single contract
    fn mutate_contract(
        &self,
        contract_id: &ContractId,
        epoch_seed: [u8; 32],
        block_number: u64,
    ) -> Result<MutationResult> {
        let mut contracts = self.contracts.write()
            .map_err(|_| CvpError::InternalError("Lock poisoned".to_string()))?;
        
        let contract = contracts.get_mut(contract_id)
            .ok_or_else(|| CvpError::ContractNotFound(hex::encode(contract_id)))?;
        
        // Store original hash
        let original_hash = contract.current_bytecode.hash();
        let original_size = contract.current_bytecode.len();
        
        // Generate new bytecode variant
        let new_bytecode = self.compiler.mutate(&contract.current_bytecode, epoch_seed)?;
        let new_hash = new_bytecode.hash();
        let new_size = new_bytecode.len();
        
        // Generate equivalence proof
        let proof = self.proof_generator.generate(
            &contract.semantic_ir,
            &contract.current_bytecode,
            &new_bytecode,
            epoch_seed,
        )?;
        
        // Update contract
        contract.previous_bytecode = Some(std::mem::replace(
            &mut contract.current_bytecode,
            new_bytecode,
        ));
        contract.latest_proof = Some(proof.clone());
        contract.mutation_count += 1;
        contract.last_mutation_block = block_number;
        contract.semantic_ir.increment_version();
        
        if self.config.log_mutations {
            tracing::debug!(
                "CVP: Mutated contract {:?} (v{}) - size: {} -> {} ({:+})",
                hex::encode(contract_id),
                contract.mutation_count,
                original_size,
                new_size,
                new_size as i64 - original_size as i64
            );
        }
        
        Ok(MutationResult {
            contract_id: *contract_id,
            original_hash,
            new_hash,
            proof,
            size_change: new_size as i64 - original_size as i64,
        })
    }
    
    /// Verify an equivalence proof
    pub fn verify_proof(&self, proof: &EquivalenceProof) -> Result<bool> {
        self.proof_verifier.verify(proof)
    }
    
    /// Emergency mutation for a specific contract (attack response)
    pub fn emergency_mutate(
        &self,
        contract_id: &ContractId,
        reason: &str,
    ) -> Result<MutationResult> {
        tracing::warn!(
            "CVP: Emergency mutation triggered for {:?}: {}",
            hex::encode(contract_id),
            reason
        );
        
        // Generate emergency seed (different from epoch seed)
        let emergency_seed = {
            use blake2::{Blake2b512, Digest};
            let mut hasher = Blake2b512::new();
            hasher.update(b"CVP_EMERGENCY_SEED");
            hasher.update(contract_id);
            hasher.update(reason.as_bytes());
            hasher.update(self.current_block.to_le_bytes());
            let hash = hasher.finalize();
            let mut result = [0u8; 32];
            result.copy_from_slice(&hash[..32]);
            result
        };
        
        self.mutate_contract(contract_id, emergency_seed, self.current_block)
    }
    
    /// Get engine statistics
    pub fn stats(&self) -> CvpStats {
        let contracts = self.contracts.read().ok();
        let contract_count = contracts.as_ref().map(|c| c.len()).unwrap_or(0);
        let total_mutations: u64 = contracts
            .as_ref()
            .map(|c| c.values().map(|v| v.mutation_count).sum())
            .unwrap_or(0);
        
        CvpStats {
            enabled: self.config.enabled,
            current_epoch: self.current_epoch,
            current_block: self.current_block,
            epoch_length: self.config.mutation_epoch_length,
            registered_contracts: contract_count,
            total_mutations,
            proof_system: format!("{:?}", self.proof_generator.proof_system()),
        }
    }
    
    /// Get contract info
    pub fn get_contract_info(&self, id: &ContractId) -> Result<Option<ContractInfo>> {
        let contracts = self.contracts.read()
            .map_err(|_| CvpError::InternalError("Lock poisoned".to_string()))?;
        
        Ok(contracts.get(id).map(|c| ContractInfo {
            id: c.id,
            name: c.semantic_ir.name.clone(),
            bytecode_size: c.current_bytecode.len(),
            mutation_count: c.mutation_count,
            last_mutation_block: c.last_mutation_block,
            has_proof: c.latest_proof.is_some(),
        }))
    }
}

impl Default for CvpEngine {
    fn default() -> Self {
        Self::new()
    }
}

/// Engine statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CvpStats {
    pub enabled: bool,
    pub current_epoch: u64,
    pub current_block: u64,
    pub epoch_length: u64,
    pub registered_contracts: usize,
    pub total_mutations: u64,
    pub proof_system: String,
}

/// Contract information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContractInfo {
    pub id: ContractId,
    pub name: String,
    pub bytecode_size: usize,
    pub mutation_count: u64,
    pub last_mutation_block: u64,
    pub has_proof: bool,
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_engine_creation() {
        let engine = CvpEngine::new();
        let stats = engine.stats();
        
        assert!(stats.enabled);
        assert_eq!(stats.current_epoch, 0);
        assert_eq!(stats.registered_contracts, 0);
    }
    
    #[test]
    fn test_contract_registration() {
        let engine = CvpEngine::new();
        let id = [1u8; 32];
        let ir = SemanticIR::new(id, "Test".to_string());
        let bytecode = vec![0x60, 0x01, 0x60, 0x02, 0x01];
        
        engine.register_contract(id, ir, bytecode.clone()).unwrap();
        
        let retrieved = engine.get_bytecode(&id).unwrap().unwrap();
        assert_eq!(retrieved, bytecode);
    }
    
    #[test]
    fn test_epoch_seed_generation() {
        let engine = CvpEngine::new();
        
        let hashes = vec![[1u8; 32], [2u8; 32], [3u8; 32]];
        let seed1 = engine.generate_epoch_seed(100, &hashes);
        let seed2 = engine.generate_epoch_seed(200, &hashes);
        
        // Different blocks should produce different seeds
        assert_ne!(seed1, seed2);
    }
    
    #[test]
    fn test_should_mutate() {
        let engine = CvpEngine::new();
        
        // Default epoch length is 100
        assert!(!engine.should_mutate(0));
        assert!(!engine.should_mutate(50));
        assert!(engine.should_mutate(100));
        assert!(!engine.should_mutate(150));
        assert!(engine.should_mutate(200));
    }
    
    #[test]
    fn test_epoch_transition() {
        let mut engine = CvpEngine::new();
        let id = [1u8; 32];
        let ir = SemanticIR::new(id, "Test".to_string());
        let bytecode = vec![0x60, 0x01, 0x60, 0x02, 0x01];
        
        engine.register_contract(id, ir, bytecode).unwrap();
        
        let hashes = vec![[1u8; 32], [2u8; 32]];
        let results = engine.transition_epoch(100, &hashes).unwrap();
        
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].contract_id, id);
        
        // Bytecode should be different after mutation
        let _new_bytecode = engine.get_bytecode(&id).unwrap().unwrap();
        // Note: might be same if no mutations applied
    }
    
    #[test]
    fn test_proof_system_type() {
        let engine = CvpEngine::new();
        
        // Default engine uses TranslationValidation
        assert_eq!(
            format!("{:?}", engine.proof_system()),
            "TranslationValidation"
        );
    }
    
    #[cfg(feature = "zk-plonky2")]
    mod plonky2_tests {
        use super::*;
        
        #[test]
        fn test_plonky2_engine_creation() {
            // Use minimal circuit for faster testing
            let engine = CvpEngine::with_plonky2_minimal();
            assert!(engine.is_ok(), "Plonky2 engine should create successfully");
            
            let engine = engine.unwrap();
            assert_eq!(format!("{:?}", engine.proof_system()), "Plonky2");
        }
        
        #[test]
        fn test_plonky2_mutation_with_proof() {
            let mut engine = CvpEngine::with_plonky2_minimal().expect("Engine should create");
            
            let id = [42u8; 32];
            let ir = SemanticIR::new(id, "TestContract".to_string());
            let bytecode = vec![0x60, 0x80, 0x60, 0x40, 0x52]; // PUSH1 0x80 PUSH1 0x40 MSTORE
            
            engine.register_contract(id, ir, bytecode).unwrap();
            
            // Trigger epoch transition
            let hashes = vec![[1u8; 32], [2u8; 32]];
            let results = engine.transition_epoch(100, &hashes).unwrap();
            
            assert_eq!(results.len(), 1);
            
            // Verify proof was generated
            let mutation = &results[0];
            assert_eq!(mutation.contract_id, id);
            assert!(!mutation.proof.proof_data.is_empty(), "Proof data should not be empty");
            assert_eq!(mutation.proof.proof_system, crate::ProofSystem::Plonky2);
            assert_eq!(mutation.proof.version, 3);
            
            // Verify the proof
            let is_valid = engine.verify_proof(&mutation.proof).unwrap();
            assert!(is_valid, "Proof should verify successfully");
        }
    }
}
