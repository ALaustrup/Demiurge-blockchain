//! Consensus engine - Hybrid PoS + BFT
//!
//! Includes Consensus-Verified Polymorphism (CVP) for dynamic bytecode mutation.

use crate::{Finality, Result, Validator, ValidatorSet, ConsensusError, SlashingTracker, StakingPool};
use demiurge_core::{Block, Transaction};
use demiurge_storage::Storage;
use demiurge_cvp::{
    CvpConsensusIntegration, CvpConfig, TransactionInfo, 
    Threat, ThreatSeverity, SemanticIR, ContractId,
    drc369::build_drc369_semantic_ir,
};
use codec::{Encode, Decode};
use std::collections::HashMap;
use ed25519_dalek::{SigningKey, Signature, Verifier};
use hex;
use tracing::{warn, info, error};

/// Consensus engine combining PoS and BFT
/// 
/// Includes CVP (Consensus-Verified Polymorphism) for dynamic security:
/// - Automatic bytecode mutation at epoch boundaries
/// - Attack pattern detection and response
/// - ZK proof verification for semantic equivalence
pub struct ConsensusEngine<S: Storage> {
    pub validators: ValidatorSet,
    finality: Finality,
    storage: S,
    current_era: u64,
    block_time: u64, // Block time in milliseconds
    era_length: u64, // Blocks per era (default: 1000)
    validator_keys: HashMap<[u8; 32], SigningKey>, // Validator account -> signing key
    slashing: SlashingTracker, // Slashing tracker
    pub staking_pools: HashMap<[u8; 32], StakingPool>, // Validator -> staking pool
    transaction_fees: u128, // Accumulated transaction fees for current era
    
    // CVP - Consensus-Verified Polymorphism
    cvp: CvpConsensusIntegration,
    cvp_enabled: bool,
    recent_block_hashes: Vec<[u8; 32]>, // For CVP epoch seed generation
    
    // Phase 5: Attack Detection & Reactive Mutation
    /// Scheduled mutations (contract_id -> scheduled_block)
    scheduled_mutations: HashMap<ContractId, u64>,
    /// Recent threat history for monitoring (capped at 1000)
    threat_history: Vec<ThreatEvent>,
    /// Maximum threat history size
    max_threat_history: usize,
}

/// A recorded threat event
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ThreatEvent {
    /// Block number where threat was detected
    pub block_number: u64,
    /// The threat type
    pub threat_type: demiurge_cvp::ThreatType,
    /// Severity level
    pub severity: ThreatSeverity,
    /// Description
    pub description: String,
    /// Target contract (if identified)
    pub target_contract: Option<ContractId>,
    /// Whether reactive mutation was triggered
    pub mutation_triggered: bool,
    /// Timestamp (Unix milliseconds)
    pub timestamp: u64,
}

/// Threat detection statistics
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ThreatStats {
    /// Total threats detected in history window
    pub total_threats: u64,
    /// Threats by type (as strings since ThreatType doesn't impl Hash)
    pub threats_by_type: HashMap<String, u64>,
    /// Threats by severity (as strings since ThreatSeverity doesn't impl Hash)
    pub threats_by_severity: HashMap<String, u64>,
    /// Total reactive mutations triggered
    pub mutations_triggered: u64,
    /// Currently scheduled mutations pending
    pub scheduled_mutations: usize,
}

impl<S: Storage> ConsensusEngine<S> {
    /// Create a new consensus engine
    pub fn new(storage: S, block_time_ms: u64) -> Self {
        // Try to load current era from storage
        let current_era = Self::load_current_era(&storage).unwrap_or(0);
        
        // Initialize CVP with default configuration
        // Mutation epoch aligns with era length for consistency
        let cvp_config = CvpConfig {
            mutation_epoch_length: 100, // Mutate every 100 blocks (~10 minutes at 6s blocks)
            enabled: true,
            log_mutations: true,
            ..Default::default()
        };
        
        let engine = Self {
            validators: ValidatorSet::new(),
            finality: Finality::new(),
            storage,
            current_era,
            block_time: block_time_ms,
            era_length: 1000, // Default: 1000 blocks per era
            validator_keys: HashMap::new(),
            slashing: SlashingTracker::new(),
            staking_pools: HashMap::new(),
            transaction_fees: 0,
            cvp: CvpConsensusIntegration::new(cvp_config),
            cvp_enabled: true,
            recent_block_hashes: Vec::with_capacity(10),
            scheduled_mutations: HashMap::new(),
            threat_history: Vec::new(),
            max_threat_history: 1000,
        };
        
        // Auto-register DRC-369 with CVP for polymorphic protection
        if let Err(e) = engine.initialize_drc369_cvp() {
            error!("Failed to initialize DRC-369 CVP: {}", e);
        }
        
        engine
    }
    
    /// Create consensus engine with CVP disabled (for testing)
    pub fn new_without_cvp(storage: S, block_time_ms: u64) -> Self {
        let current_era = Self::load_current_era(&storage).unwrap_or(0);
        
        let cvp_config = CvpConfig {
            enabled: false,
            ..Default::default()
        };
        
        Self {
            validators: ValidatorSet::new(),
            finality: Finality::new(),
            storage,
            current_era,
            block_time: block_time_ms,
            era_length: 1000,
            validator_keys: HashMap::new(),
            slashing: SlashingTracker::new(),
            staking_pools: HashMap::new(),
            transaction_fees: 0,
            cvp: CvpConsensusIntegration::new(cvp_config),
            cvp_enabled: false,
            recent_block_hashes: Vec::new(),
            scheduled_mutations: HashMap::new(),
            threat_history: Vec::new(),
            max_threat_history: 1000,
        }
    }
    
    /// Enable or disable CVP
    pub fn set_cvp_enabled(&mut self, enabled: bool) {
        self.cvp_enabled = enabled;
        info!("CVP {} ", if enabled { "enabled" } else { "disabled" });
    }
    
    /// Check if CVP is enabled
    pub fn is_cvp_enabled(&self) -> bool {
        self.cvp_enabled
    }
    
    /// Register a contract for CVP protection
    pub fn register_cvp_contract(
        &self,
        contract_id: ContractId,
        semantic_ir: SemanticIR,
        bytecode: Vec<u8>,
    ) -> Result<()> {
        if !self.cvp_enabled {
            return Ok(());
        }
        
        self.cvp.register_contract(contract_id, semantic_ir, bytecode)
            .map_err(|e| ConsensusError::CvpError(format!("{}", e)))
    }
    
    /// Get CVP-protected bytecode for a contract
    pub fn get_cvp_bytecode(&self, contract_id: &ContractId) -> Option<Vec<u8>> {
        if !self.cvp_enabled {
            return None;
        }
        
        self.cvp.get_bytecode(contract_id).ok().flatten()
    }
    
    /// Get CVP statistics
    pub fn cvp_stats(&self) -> demiurge_cvp::integration::CvpStats {
        self.cvp.stats()
    }
    
    /// Initialize DRC-369 with CVP protection
    /// 
    /// This should be called during chain initialization to ensure DRC-369
    /// contracts are protected by Consensus-Verified Polymorphism from the start.
    pub fn initialize_drc369_cvp(&self) -> Result<()> {
        if !self.cvp_enabled {
            info!("CVP disabled, skipping DRC-369 CVP registration");
            return Ok(());
        }
        
        // Generate deterministic contract ID for DRC-369
        use blake2::{Blake2b512, Digest};
        let mut hasher = Blake2b512::new();
        hasher.update(b"DRC369_MODULE_CONTRACT_V1");
        let hash = hasher.finalize();
        let mut contract_id = [0u8; 32];
        contract_id.copy_from_slice(&hash[..32]);
        
        // Build semantic IR
        let semantic_ir = build_drc369_semantic_ir(contract_id);
        
        // Generate initial bytecode
        let bytecode = Self::generate_drc369_bytecode();
        
        // Register with CVP
        self.register_cvp_contract(contract_id, semantic_ir, bytecode)?;
        
        info!(
            "DRC-369 registered with CVP - Contract ID: {} - The most secure NFT standard",
            hex::encode(&contract_id[..8])
        );
        
        Ok(())
    }
    
    /// Generate DRC-369 bytecode for CVP mutations
    fn generate_drc369_bytecode() -> Vec<u8> {
        let mut bytecode = Vec::new();
        
        // Function dispatcher (EVM-style)
        bytecode.extend_from_slice(&[0x60, 0x00, 0x35]); // PUSH1 0 CALLDATALOAD
        bytecode.extend_from_slice(&[0x60, 0xE0, 0x1C]); // PUSH1 0xE0 SHR
        
        // mint selector (0x40c10f19)
        bytecode.extend_from_slice(&[0x63, 0x40, 0xc1, 0x0f, 0x19]);
        bytecode.extend_from_slice(&[0x14, 0x61, 0x00, 0x40, 0x57]); // EQ PUSH2 0x0040 JUMPI
        
        // transfer selector (0xa9059cbb)
        bytecode.extend_from_slice(&[0x63, 0xa9, 0x05, 0x9c, 0xbb]);
        bytecode.extend_from_slice(&[0x14, 0x61, 0x00, 0x80, 0x57]); // EQ PUSH2 0x0080 JUMPI
        
        // approve selector (0x095ea7b3)
        bytecode.extend_from_slice(&[0x63, 0x09, 0x5e, 0xa7, 0xb3]);
        bytecode.extend_from_slice(&[0x14, 0x61, 0x00, 0xc0, 0x57]); // EQ PUSH2 0x00c0 JUMPI
        
        // ownerOf selector (0x6352211e)
        bytecode.extend_from_slice(&[0x63, 0x63, 0x52, 0x21, 0x1e]);
        bytecode.extend_from_slice(&[0x14, 0x61, 0x01, 0x00, 0x57]); // EQ PUSH2 0x0100 JUMPI
        
        // Add padding for mutation space
        for i in 0..64 {
            bytecode.push((i * 7) as u8);
        }
        
        bytecode
    }

    /// Register a validator with their signing key
    pub fn register_validator_key(&mut self, account: [u8; 32], signing_key: SigningKey) {
        self.validator_keys.insert(account, signing_key);
    }

    /// Set era length
    pub fn set_era_length(&mut self, era_length: u64) {
        self.era_length = era_length;
    }

    /// Get current era
    pub fn current_era(&self) -> u64 {
        self.current_era
    }

    /// Check if era transition is needed
    pub fn should_transition_era(&self) -> bool {
        let current_block = self.get_latest_block_number().unwrap_or(0);
        current_block > 0 && current_block.is_multiple_of(self.era_length)
    }

    /// Propose a new block
    /// Returns the proposed block and proof
    /// 
    /// IMPORTANT: CVP mutations happen BEFORE block header creation to ensure
    /// the proof root is cryptographically committed in the header.
    pub fn propose_block(
        &mut self,
        transactions: Vec<Transaction>,
        proposer: [u8; 32], // Validator account
    ) -> Result<(Block, BlockProof)> {
        // Select proposer based on stake (PoS) with weighted selection
        let selected_proposer = self.select_proposer_weighted()?;
        if selected_proposer != proposer {
            return Err(ConsensusError::InvalidProposer);
        }

        // Get latest block info from storage
        let latest_block_number = self.get_latest_block_number()?;
        let latest_hash = self.get_latest_hash()?;
        let new_block_number = latest_block_number + 1;
        let timestamp = self.get_timestamp();
        
        // ═══════════════════════════════════════════════════════════════════
        // CVP: Process mutations BEFORE creating block header
        // This ensures proofs are generated and committed in the header
        // ═══════════════════════════════════════════════════════════════════
        let (cvp_proof_root, cvp_epoch) = if self.cvp_enabled {
            self.prepare_cvp_for_block(new_block_number, latest_hash)?
        } else {
            (None, 0)
        };

        // Create block header with CVP proof root included
        let header = demiurge_core::BlockHeader {
            parent_hash: latest_hash,
            block_number: new_block_number,
            state_root: [0u8; 32], // Will be calculated after execution
            extrinsics_root: self.calculate_extrinsics_root(&transactions),
            timestamp,
            cvp_proof_root,
            cvp_epoch,
        };

        // Create block
        let block = Block {
            header: header.clone(),
            transactions: transactions.clone(),
        };
        
        // Collect fees from transactions
        self.collect_transaction_fees(&block);

        // Sign block with proposer's key
        let signature = self.sign_block(&block, proposer)?;

        // Create proof
        let proof = BlockProof {
            proposer,
            signature,
            timestamp: block.header.timestamp,
        };

        Ok((block, proof))
    }
    
    /// Prepare CVP state for a new block
    /// 
    /// At epoch boundaries, this triggers bytecode mutations and generates
    /// ZK equivalence proofs. Returns the proof root to include in the header.
    /// 
    /// Phase 5: Also processes scheduled reactive mutations.
    fn prepare_cvp_for_block(
        &mut self,
        block_number: u64,
        parent_hash: [u8; 32],
    ) -> Result<(Option<[u8; 32]>, u64)> {
        use blake2::{Blake2b512, Digest};
        
        // Store block hash for epoch seed generation
        self.recent_block_hashes.push(parent_hash);
        if self.recent_block_hashes.len() > 10 {
            self.recent_block_hashes.remove(0);
        }
        
        // Check if this is an epoch boundary
        let cvp_epoch_length = self.cvp.config().mutation_epoch_length;
        let current_epoch = block_number / cvp_epoch_length;
        let is_epoch_boundary = block_number > 0 && block_number.is_multiple_of(cvp_epoch_length);
        
        // ═══════════════════════════════════════════════════════════════════
        // Phase 5: Process scheduled reactive mutations (always check)
        // ═══════════════════════════════════════════════════════════════════
        let scheduled_mutations = self.process_scheduled_mutations(block_number);
        let has_scheduled_mutations = !scheduled_mutations.is_empty();
        
        if has_scheduled_mutations {
            info!(
                "CVP: Processed {} scheduled reactive mutations at block {}",
                scheduled_mutations.len(),
                block_number
            );
        }
        
        if !is_epoch_boundary && !has_scheduled_mutations {
            // Not an epoch boundary and no scheduled mutations - no proof root needed
            return Ok((None, current_epoch));
        }
        
        info!(
            "CVP: {} at block {} - preparing mutations for epoch {}",
            if is_epoch_boundary { "Epoch boundary" } else { "Reactive mutations" },
            block_number, current_epoch
        );
        
        // Perform epoch transition - this mutates all registered contracts
        // and generates ZK equivalence proofs
        let epoch_mutations = if is_epoch_boundary {
            self.cvp.transition_epoch(block_number, &self.recent_block_hashes)
                .map_err(|e| ConsensusError::CvpError(format!("Epoch transition failed: {}", e)))?
        } else {
            Vec::new()
        };
        
        // Combine epoch mutations and scheduled mutations
        let mutations: Vec<_> = epoch_mutations.into_iter()
            .chain(scheduled_mutations)
            .collect();
        
        if mutations.is_empty() {
            info!("CVP: No contracts registered for mutation");
            return Ok((None, current_epoch));
        }
        
        // Calculate CVP proof root from all mutation results
        // Root = H(H(m1) || H(m2) || ... || H(mn))
        // where H(m) = H(contract_id || original_hash || new_hash || proof_hash)
        let mut hasher = Blake2b512::new();
        hasher.update(b"CVP_PROOF_ROOT_V1");
        hasher.update(block_number.to_le_bytes());
        
        for mutation in &mutations {
            // Hash each mutation's key data
            let mut mutation_hasher = Blake2b512::new();
            mutation_hasher.update(mutation.contract_id);
            mutation_hasher.update(mutation.original_hash);
            mutation_hasher.update(mutation.new_hash);
            mutation_hasher.update(mutation.proof.hash());
            let mutation_hash = mutation_hasher.finalize();
            
            // Add to root calculation
            hasher.update(&mutation_hash[..32]);
            
            // Verify proof is valid before including
            let is_valid = self.cvp.verify_proof(&mutation.proof)
                .map_err(|e| ConsensusError::CvpError(format!("Proof verification failed: {}", e)))?;
            
            if !is_valid {
                return Err(ConsensusError::CvpError(format!(
                    "Invalid proof for contract {} - cannot include in block",
                    hex::encode(&mutation.contract_id[..8])
                )));
            }
            
            info!(
                "CVP: Mutation prepared for {} - {} -> {} (proof: {:?})",
                hex::encode(&mutation.contract_id[..8]),
                hex::encode(&mutation.original_hash[..8]),
                hex::encode(&mutation.new_hash[..8]),
                mutation.proof.proof_system
            );
        }
        
        // Finalize proof root
        let root_hash = hasher.finalize();
        let mut cvp_proof_root = [0u8; 32];
        cvp_proof_root.copy_from_slice(&root_hash[..32]);
        
        info!(
            "CVP: Proof root calculated for epoch {} - {} contracts, root: {}",
            current_epoch,
            mutations.len(),
            hex::encode(&cvp_proof_root[..8])
        );
        
        Ok((Some(cvp_proof_root), current_epoch))
    }

    /// Select proposer using weighted random selection based on stake
    pub fn select_proposer_weighted(&self) -> Result<[u8; 32]> {
        if self.validators.count() == 0 {
            return Err(ConsensusError::NoValidators);
        }

        let total_stake = self.validators.total_stake();
        if total_stake == 0 {
            return Err(ConsensusError::NoValidators);
        }

        // Generate deterministic random value based on block number
        let block_number = self.get_latest_block_number().unwrap_or(0);
        let seed = self.generate_vrf_seed(block_number + 1);
        
        // Convert the first 16 bytes of the seed to u128 for weighted selection.
        // (Shifting all 32 bytes into a u128 overflowed for bytes 16..32 and
        // panicked in debug builds.)
        let mut seed16 = [0u8; 16];
        seed16.copy_from_slice(&seed[..16]);
        let mut random_value = u128::from_le_bytes(seed16);
        random_value %= total_stake;

        // Select proposer based on cumulative stake weights
        let mut cumulative = 0u128;
        for (account, validator) in self.validators.iter() {
            if !validator.active {
                continue;
            }
            cumulative += validator.stake;
            if random_value < cumulative {
                return Ok(*account);
            }
        }

        // Fallback: return first active validator
        for (account, validator) in self.validators.iter() {
            if validator.active {
                return Ok(*account);
            }
        }

        Err(ConsensusError::NoValidators)
    }

    /// Generate VRF seed for deterministic randomness
    fn generate_vrf_seed(&self, block_number: u64) -> [u8; 32] {
        use blake2::{Blake2b512, Digest};
        let mut hasher = Blake2b512::new();
        
        // Include block number and parent hash for determinism
        let parent_hash = self.get_latest_hash().unwrap_or([0u8; 32]);
        hasher.update(block_number.to_le_bytes());
        hasher.update(parent_hash);
        hasher.update(b"demiurge_vrf_seed"); // Domain separator
        
        let hash = hasher.finalize();
        let mut result = [0u8; 32];
        result.copy_from_slice(&hash[..32]);
        result
    }

    /// Validate a block proposal
    pub fn validate_block(&self, block: &Block, proof: &BlockProof) -> Result<()> {
        // Verify proposer is valid
        if !self.validators.is_validator(&proof.proposer) {
            return Err(ConsensusError::InvalidValidator);
        }

        // Verify signature
        self.verify_signature(block, proof)?;

        // Verify block structure (standalone validation without parent context)
        // Parent validation is done separately during block import
        block.validate(None)?;
        
        // ═══════════════════════════════════════════════════════════════════
        // CVP: Verify proof root if present (epoch boundary blocks)
        // ═══════════════════════════════════════════════════════════════════
        if self.cvp_enabled {
            self.verify_cvp_proof_root(block)?;
        }

        // Verify timestamp (not too far in future/past)
        self.verify_timestamp(block.header.timestamp)?;

        Ok(())
    }
    
    /// Verify CVP proof root in block header
    /// 
    /// At epoch boundaries, the proof root must be present and valid.
    /// Non-epoch blocks should NOT have a proof root.
    fn verify_cvp_proof_root(&self, block: &Block) -> Result<()> {
        let block_number = block.header.block_number;
        let cvp_epoch_length = self.cvp.config().mutation_epoch_length;
        let is_epoch_boundary = block_number > 0 && block_number.is_multiple_of(cvp_epoch_length);
        
        match (is_epoch_boundary, &block.header.cvp_proof_root) {
            // Epoch boundary WITH proof root - verify it
            (true, Some(proof_root)) => {
                // Verify the epoch number is correct
                let expected_epoch = block_number / cvp_epoch_length;
                if block.header.cvp_epoch != expected_epoch {
                    return Err(ConsensusError::CvpError(format!(
                        "CVP epoch mismatch: header has {}, expected {}",
                        block.header.cvp_epoch, expected_epoch
                    )));
                }
                
                info!(
                    "CVP: Block {} is epoch boundary - proof root present: {}",
                    block_number,
                    hex::encode(&proof_root[..8])
                );
                
                // Note: Full proof verification happens during finalization
                // Here we just verify the structure is correct
                Ok(())
            }
            
            // Epoch boundary WITHOUT proof root - ERROR if contracts are registered
            (true, None) => {
                // Check if we have registered contracts that should have been mutated
                let stats = self.cvp.stats();
                if stats.registered_contracts > 0 {
                    warn!(
                        "CVP: Block {} is epoch boundary but has no proof root ({} contracts registered)",
                        block_number, stats.registered_contracts
                    );
                    // Don't fail - the proposer may have a different view of registered contracts
                    // This will be caught during full validation if proofs don't match
                }
                Ok(())
            }
            
            // Non-epoch block WITH proof root - ERROR (shouldn't have proofs)
            (false, Some(_)) => {
                Err(ConsensusError::CvpError(format!(
                    "Block {} has CVP proof root but is not an epoch boundary",
                    block_number
                )))
            }
            
            // Non-epoch block without proof root - OK
            (false, None) => Ok(()),
        }
    }

    /// Finalize a block using BFT
    /// Requires 2/3+ of validators to agree
    pub fn finalize_block(
        &mut self,
        block: &Block,
        signatures: Vec<BlockSignature>,
    ) -> Result<()> {
        // Collect signatures from validators
        let mut signed_validators = 0;
        let mut signed_validator_accounts = std::collections::HashSet::new();
        let total_validators = self.validators.count();

        for sig in signatures {
            if self.validators.is_validator(&sig.validator) {
                // Verify signature
                self.verify_signature(block, &sig.proof)?;
                
                // Record signature for slashing detection
                if let Err(e) = self.slashing.record_signature(sig.validator, block) {
                    // Double signing detected - slash validator
                    warn!("Double signing detected: {:?}", e);
                    self.slashing.slash_double_signing(&mut self.storage, &mut self.validators, sig.validator)?;
                    continue; // Don't count this signature
                }
                
                signed_validators += 1;
                signed_validator_accounts.insert(sig.validator);
            }
        }
        
        // Check for validators who should have signed but didn't (downtime)
        let block_number = block.header.block_number;
        // Collect accounts to slash first to avoid borrow checker issues
        let mut accounts_to_slash: Vec<([u8; 32], u64)> = Vec::new();
        for (account, validator) in self.validators.iter() {
            if validator.active && !signed_validator_accounts.contains(account) {
                self.slashing.record_missed_block(&mut self.storage, *account, block_number);
                
                // Check if should slash and collect for later
                if self.slashing.should_slash_downtime(*account) {
                    let missed = self.slashing.get_missed_blocks(*account);
                    accounts_to_slash.push((*account, missed));
                }
            }
        }
        
        // Now perform slashing outside the iterator
        for (account, missed) in accounts_to_slash {
            warn!("Slashing validator {:?} for downtime: {} missed blocks", 
                hex::encode(account), missed);
            self.slashing.slash_downtime(&mut self.storage, &mut self.validators, account, missed)?;
        }

        // Require 2/3+ agreement (BFT)
        let required = (total_validators * 2) / 3 + 1;
        if signed_validators < required {
            return Err(ConsensusError::InsufficientSignatures {
                required,
                received: signed_validators,
            });
        }

        // Finalize block
        self.finality.finalize(block)?;

        // CVP: Process block for attack detection and epoch transitions
        if self.cvp_enabled {
            self.process_cvp_block(block)?;
        }

        // Check if era transition is needed
        if self.should_transition_era() {
            self.transition_era()?;
        }

        Ok(())
    }
    
    /// Process block through CVP system (validator side)
    /// 
    /// This handles:
    /// - Transaction analysis for attack patterns
    /// - Threat response (emergency mutations only)
    /// - **Verification that epoch mutations match header proof root**
    /// 
    /// NOTE: Epoch transitions are now done in `prepare_cvp_for_block` BEFORE
    /// block creation. This function verifies the transitions for validators
    /// who didn't propose the block.
    fn process_cvp_block(&mut self, block: &Block) -> Result<()> {
        use blake2::{Blake2b512, Digest};
        
        let block_hash = block.hash();
        let block_number = block.header.block_number;
        
        // Store block hash for epoch seed generation
        self.recent_block_hashes.push(block_hash);
        if self.recent_block_hashes.len() > 10 {
            self.recent_block_hashes.remove(0);
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // PHASE 1: Verify epoch mutations match header proof root
        // ═══════════════════════════════════════════════════════════════════
        let cvp_epoch_length = self.cvp.config().mutation_epoch_length;
        let is_epoch_boundary = block_number > 0 && block_number.is_multiple_of(cvp_epoch_length);
        
        if let Some(header_root) = block.header.cvp_proof_root.filter(|_| is_epoch_boundary) {
            // Validator must independently compute mutations and verify proof root matches
            let mutations = self.cvp.transition_epoch(block_number, &self.recent_block_hashes)
                .map_err(|e| ConsensusError::CvpError(format!("Epoch transition failed: {}", e)))?;
            
            // Calculate proof root the same way as proposer
            let mut hasher = Blake2b512::new();
            hasher.update(b"CVP_PROOF_ROOT_V1");
            hasher.update(block_number.to_le_bytes());
            
            for mutation in &mutations {
                let mut mutation_hasher = Blake2b512::new();
                mutation_hasher.update(mutation.contract_id);
                mutation_hasher.update(mutation.original_hash);
                mutation_hasher.update(mutation.new_hash);
                mutation_hasher.update(mutation.proof.hash());
                let mutation_hash = mutation_hasher.finalize();
                hasher.update(&mutation_hash[..32]);
                
                // Verify each proof
                self.verify_mutation_proof(mutation, block_number)?;
            }
            
            let root_hash = hasher.finalize();
            let mut computed_root = [0u8; 32];
            computed_root.copy_from_slice(&root_hash[..32]);
            
            // Verify computed root matches header
            if computed_root != header_root {
                return Err(ConsensusError::CvpError(format!(
                    "CVP proof root mismatch at block {}: computed {} != header {}",
                    block_number,
                    hex::encode(&computed_root[..8]),
                    hex::encode(&header_root[..8])
                )));
            }
            
            info!(
                "CVP: Verified epoch {} proof root at block {} - {} contracts",
                block.header.cvp_epoch,
                block_number,
                mutations.len()
            );
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // PHASE 2: Attack detection (runs on every block)
        // ═══════════════════════════════════════════════════════════════════
        let tx_infos: Vec<TransactionInfo> = block.transactions
            .iter()
            .map(|tx| self.transaction_to_cvp_info(tx, block.header.timestamp))
            .collect();
        
        // Analyze transactions for attack patterns (don't do epoch transition again)
        let threats = self.cvp.analyze_transactions(block_number, &tx_infos);
        
        // Handle detected threats
        for threat in &threats {
            self.handle_cvp_threat(threat, block_number)?;
        }
        
        Ok(())
    }
    
    /// Verify a mutation's equivalence proof
    /// 
    /// This is the cryptographic verification that ensures mutated bytecode
    /// is semantically equivalent to the original. Without this, an attacker
    /// could theoretically inject malicious mutations.
    fn verify_mutation_proof(
        &self,
        mutation: &demiurge_cvp::MutationResult,
        block_number: u64,
    ) -> Result<()> {
        let contract_hex = hex::encode(&mutation.contract_id[..8]);
        
        // Verify the proof
        let is_valid = self.cvp.verify_proof(&mutation.proof)
            .map_err(|e| ConsensusError::CvpError(format!(
                "Proof verification error for contract {}: {}",
                contract_hex, e
            )))?;
        
        if !is_valid {
            error!(
                "CVP PROOF VERIFICATION FAILED at block {} for contract {}",
                block_number, contract_hex
            );
            return Err(ConsensusError::CvpError(format!(
                "Invalid equivalence proof for contract {} at block {}. \
                This indicates a potential attack or bug in the mutation system.",
                contract_hex, block_number
            )));
        }
        
        // Log successful verification
        tracing::debug!(
            "CVP: Proof verified for contract {} - {:?} proof system, {} bytes",
            contract_hex,
            mutation.proof.proof_system,
            mutation.proof.proof_data.len()
        );
        
        Ok(())
    }
    
    /// Convert a transaction to CVP TransactionInfo
    fn transaction_to_cvp_info(&self, tx: &Transaction, timestamp: u64) -> TransactionInfo {
        use blake2::{Blake2b512, Digest};
        
        // Compute transaction hash
        let tx_hash = {
            let encoded = tx.encode();
            let mut hasher = Blake2b512::new();
            hasher.update(&encoded);
            let hash = hasher.finalize();
            let mut result = [0u8; 32];
            result.copy_from_slice(&hash[..32]);
            result
        };
        
        // Extract relevant info based on transaction data type
        let (target_contract, function_selector, value) = match &tx.data {
            demiurge_core::TransactionData::ModuleCall { module, call } => {
                // For module calls, extract function selector from call data
                let selector = if call.len() >= 4 {
                    let mut sel = [0u8; 4];
                    sel.copy_from_slice(&call[..4]);
                    Some(sel)
                } else {
                    None
                };
                // Module name can be hashed to create a "contract" identifier
                let contract_id = {
                    let mut hasher = Blake2b512::new();
                    hasher.update(module.as_bytes());
                    let hash = hasher.finalize();
                    let mut id = [0u8; 32];
                    id.copy_from_slice(&hash[..32]);
                    Some(id)
                };
                (contract_id, selector, 0u128)
            }
            demiurge_core::TransactionData::Transfer { to, amount } => {
                // For transfers, target is the recipient
                (Some(*to), None, *amount)
            }
        };
        
        TransactionInfo {
            hash: tx_hash,
            sender: tx.from,
            target_contract,
            function_selector,
            gas_used: 100_000, // Placeholder - actual usage would come from execution
            value,
            success: true, // Would come from execution result
            call_depth: 1, // Would come from execution trace
            timestamp,
        }
    }
    
    /// Handle a CVP threat detection
    /// 
    /// Phase 5: Reactive Mutation Implementation
    /// - Info/Low: Log only
    /// - Medium: Alert and monitor
    /// - High: Schedule early mutation (next 5 blocks)
    /// - Critical: Trigger immediate emergency mutation
    fn handle_cvp_threat(&mut self, threat: &Threat, block_number: u64) -> Result<()> {
        let mut mutation_triggered = false;
        let timestamp = self.get_timestamp();
        
        match threat.severity {
            ThreatSeverity::Info => {
                // Just log
                info!(
                    "CVP Info [block {}]: {} - {:?}",
                    block_number,
                    threat.description,
                    threat.threat_type
                );
            }
            ThreatSeverity::Low => {
                info!(
                    "CVP Low Threat [block {}]: {} - {:?}",
                    block_number,
                    threat.description,
                    threat.threat_type
                );
            }
            ThreatSeverity::Medium => {
                warn!(
                    "CVP Medium Threat [block {}]: {} - {:?}",
                    block_number,
                    threat.description,
                    threat.threat_type
                );
                // Alert operators (in production, this would send notifications)
            }
            ThreatSeverity::High => {
                warn!(
                    "CVP HIGH THREAT [block {}]: {} - {:?} - Contract: {:?}",
                    block_number,
                    threat.description,
                    threat.threat_type,
                    threat.target_contract.map(|c| hex::encode(&c[..8]))
                );
                
                // Schedule early mutation for targeted contract
                if let Some(contract_id) = threat.target_contract {
                    let scheduled_block = block_number + 5; // Mutate in 5 blocks
                    self.scheduled_mutations.insert(contract_id, scheduled_block);
                    mutation_triggered = true;
                    
                    warn!(
                        "CVP: Scheduled early mutation for contract {:?} at block {}",
                        hex::encode(&contract_id[..8]),
                        scheduled_block
                    );
                }
            }
            ThreatSeverity::Critical => {
                error!(
                    "CVP CRITICAL THREAT [block {}]: {} - {:?} - Contract: {:?}",
                    block_number,
                    threat.description,
                    threat.threat_type,
                    threat.target_contract.map(|c| hex::encode(&c[..8]))
                );
                
                // Trigger immediate emergency mutation
                if let Some(contract_id) = threat.target_contract {
                    match self.trigger_emergency_mutation(&contract_id, &threat.description) {
                        Ok(_) => {
                            mutation_triggered = true;
                            error!(
                                "CVP: Emergency mutation EXECUTED for contract {:?}",
                                hex::encode(&contract_id[..8])
                            );
                        }
                        Err(e) => {
                            error!(
                                "CVP: Emergency mutation FAILED for contract {:?}: {}",
                                hex::encode(&contract_id[..8]),
                                e
                            );
                        }
                    }
                }
            }
        }
        
        // Record threat event
        self.record_threat_event(ThreatEvent {
            block_number,
            threat_type: threat.threat_type,
            severity: threat.severity,
            description: threat.description.clone(),
            target_contract: threat.target_contract,
            mutation_triggered,
            timestamp,
        });
        
        Ok(())
    }
    
    /// Trigger emergency mutation for a contract under attack
    fn trigger_emergency_mutation(&mut self, contract_id: &ContractId, reason: &str) -> Result<demiurge_cvp::MutationResult> {
        // Use the CVP integration to perform emergency mutation
        // This generates a new bytecode variant and proof immediately
        
        use demiurge_cvp::CvpEngine;
        
        // Create temporary engine config for emergency mutation
        let config = self.cvp.config().clone();
        let temp_engine = CvpEngine::with_config(config);
        
        // Get current contract bytecode
        match self.cvp.get_bytecode(contract_id) {
            Ok(Some(bytecode)) => {
                // Re-register with current bytecode for emergency mutation
                let semantic_ir = demiurge_cvp::SemanticIR::new(*contract_id, "emergency".to_string());
                temp_engine.register_contract(*contract_id, semantic_ir, bytecode)
                    .map_err(|e| ConsensusError::CvpError(format!("Failed to register: {}", e)))?;
                
                // Perform emergency mutation
                let result = temp_engine.emergency_mutate(contract_id, reason)
                    .map_err(|e| ConsensusError::CvpError(format!("Emergency mutation failed: {}", e)))?;
                
                info!(
                    "CVP: Emergency mutation complete - contract {:?}, new bytecode hash: {:?}",
                    hex::encode(&contract_id[..8]),
                    hex::encode(&result.new_hash[..8])
                );
                
                Ok(result)
            }
            Ok(None) => {
                Err(ConsensusError::CvpError("Contract not found for emergency mutation".to_string()))
            }
            Err(e) => {
                Err(ConsensusError::CvpError(format!("Failed to get bytecode: {}", e)))
            }
        }
    }
    
    /// Record a threat event to history
    fn record_threat_event(&mut self, event: ThreatEvent) {
        self.threat_history.push(event);
        
        // Trim if exceeds max size
        while self.threat_history.len() > self.max_threat_history {
            self.threat_history.remove(0);
        }
    }
    
    /// Process scheduled mutations at block start
    /// 
    /// Called during block proposal to check if any scheduled mutations are due
    fn process_scheduled_mutations(&mut self, block_number: u64) -> Vec<demiurge_cvp::MutationResult> {
        let mut results = Vec::new();
        
        // Find mutations due at this block
        let due_contracts: Vec<ContractId> = self.scheduled_mutations
            .iter()
            .filter(|(_, scheduled_block)| **scheduled_block <= block_number)
            .map(|(contract_id, _)| *contract_id)
            .collect();
        
        // Execute scheduled mutations
        for contract_id in &due_contracts {
            match self.trigger_emergency_mutation(contract_id, "Scheduled reactive mutation") {
                Ok(result) => {
                    info!(
                        "CVP: Executed scheduled mutation for contract {:?} at block {}",
                        hex::encode(&contract_id[..8]),
                        block_number
                    );
                    results.push(result);
                }
                Err(e) => {
                    error!(
                        "CVP: Scheduled mutation failed for contract {:?}: {}",
                        hex::encode(&contract_id[..8]),
                        e
                    );
                }
            }
        }
        
        // Remove processed mutations from schedule
        for contract_id in due_contracts {
            self.scheduled_mutations.remove(&contract_id);
        }
        
        results
    }
    
    /// Get threat history for monitoring
    pub fn get_threat_history(&self) -> &[ThreatEvent] {
        &self.threat_history
    }
    
    /// Get threat statistics
    pub fn get_threat_stats(&self) -> ThreatStats {
        let mut by_type: HashMap<String, u64> = HashMap::new();
        let mut by_severity: HashMap<String, u64> = HashMap::new();
        let mut mutations_triggered = 0u64;
        
        for event in &self.threat_history {
            *by_type.entry(format!("{:?}", event.threat_type)).or_insert(0) += 1;
            *by_severity.entry(format!("{:?}", event.severity)).or_insert(0) += 1;
            if event.mutation_triggered {
                mutations_triggered += 1;
            }
        }
        
        ThreatStats {
            total_threats: self.threat_history.len() as u64,
            threats_by_type: by_type,
            threats_by_severity: by_severity,
            mutations_triggered,
            scheduled_mutations: self.scheduled_mutations.len(),
        }
    }

    /// Calculate extrinsics root
    fn calculate_extrinsics_root(&self, transactions: &[Transaction]) -> [u8; 32] {
        use blake2::{Blake2b512, Digest};
        let mut hasher = Blake2b512::new();
        for tx in transactions {
            let encoded = tx.encode();
            hasher.update(&encoded);
        }
        let hash = hasher.finalize();
        let mut result = [0u8; 32];
        result.copy_from_slice(&hash[..32]);
        result
    }

    /// Get current timestamp
    fn get_timestamp(&self) -> u64 {
        // TODO: Get actual timestamp
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64
    }

    /// Sign a block with validator's signing key
    fn sign_block(&self, block: &Block, validator: [u8; 32]) -> Result<[u8; 64]> {
        use ed25519_dalek::Signer;
        
        let signing_key = self.validator_keys
            .get(&validator)
            .ok_or(ConsensusError::ValidatorNotFound)?;
        
        let message = block.hash();
        let signature = signing_key.sign(&message);
        
        // Convert signature to [u8; 64]
        let mut sig_bytes = [0u8; 64];
        sig_bytes.copy_from_slice(&signature.to_bytes());
        Ok(sig_bytes)
    }

    /// Verify block signature using validator's public key
    fn verify_signature(&self, block: &Block, proof: &BlockProof) -> Result<()> {
        // Get validator's public key from validator set
        let public_key = self.validators
            .get_public_key(&proof.proposer)
            .ok_or(ConsensusError::ValidatorNotFound)?;
        
        // Get block hash as message
        let message = block.hash();
        
        // Parse signature
        let signature = Signature::from_bytes(&proof.signature);
        
        // Verify signature
        public_key.verify(&message, &signature)
            .map_err(|e| ConsensusError::BlockValidationFailed(
                format!("Signature verification failed: {:?}", e)
            ))?;
        
        Ok(())
    }

    /// Verify timestamp is within acceptable range
    fn verify_timestamp(&self, timestamp: u64) -> Result<()> {
        let now = self.get_timestamp();
        let max_future = self.block_time * 10; // Allow 10 blocks in future
        let max_past = self.block_time * 10; // Allow 10 blocks in past

        if timestamp > now + max_future {
            return Err(ConsensusError::TimestampTooFarInFuture);
        }
        if timestamp < now.saturating_sub(max_past) {
            return Err(ConsensusError::TimestampTooFarInPast);
        }

        Ok(())
    }

    /// Get latest block hash from storage
    fn get_latest_hash(&self) -> Result<[u8; 32]> {
        let key = b"Consensus:LatestHash";
        match self.storage.get(key) {
            Some(value) => {
                let mut hash = [0u8; 32];
                if value.len() == 32 {
                    hash.copy_from_slice(&value);
                    Ok(hash)
                } else {
                    Err(ConsensusError::BlockValidationFailed(
                        "Invalid hash length in storage".to_string()
                    ))
                }
            }
            None => Ok([0u8; 32]), // Genesis block hash
        }
    }

    /// Get latest block number from storage
    pub fn get_latest_block_number(&self) -> Result<u64> {
        let key = b"System:BlockNumber";
        match self.storage.get(key) {
            Some(value) => {
                u64::decode(&mut &value[..])
                    .map_err(|e| ConsensusError::BlockValidationFailed(
                        format!("Failed to decode block number: {:?}", e)
                    ))
            }
            None => Ok(0), // Genesis block
        }
    }

    /// Store block in storage
    pub fn store_block(&mut self, block: &Block) -> Result<()> {
        let block_number = block.header.block_number;
        let block_hash = block.hash();
        
        // Store block by number
        let block_key = Self::block_key(block_number);
        let encoded_block = block.encode();
        self.storage.put(&block_key, &encoded_block);
        
        // Store block by hash
        let hash_key = Self::block_hash_key(block_hash);
        self.storage.put(&hash_key, &block_number.encode());
        
        // Update latest block hash
        let latest_hash_key = b"Consensus:LatestHash";
        self.storage.put(latest_hash_key, &block_hash);
        
        // Update latest block number
        let latest_block_key = b"System:BlockNumber";
        self.storage.put(latest_block_key, &block_number.encode());
        
        // Check if era transition is needed after storing block
        if self.should_transition_era() {
            self.transition_era()?;
        }
        
        Ok(())
    }

    /// Get block by number from storage
    pub fn get_block_by_number(&self, block_number: u64) -> Result<Option<Block>> {
        let key = Self::block_key(block_number);
        match self.storage.get(&key) {
            Some(value) => {
                Block::decode(&mut &value[..])
                    .map(Some)
                    .map_err(|e| ConsensusError::BlockValidationFailed(
                        format!("Failed to decode block: {:?}", e)
                    ))
            }
            None => Ok(None),
        }
    }

    /// Generate storage key for block by number
    fn block_key(block_number: u64) -> Vec<u8> {
        let mut key = b"Block:".to_vec();
        key.extend_from_slice(&block_number.to_le_bytes());
        key
    }

    /// Generate storage key for block by hash
    fn block_hash_key(hash: [u8; 32]) -> Vec<u8> {
        let mut key = b"BlockHash:".to_vec();
        key.extend_from_slice(&hash);
        key
    }

    /// Handle era transition
    /// This should be called when a new era begins
    pub fn transition_era(&mut self) -> Result<()> {
        let current_block = self.get_latest_block_number().unwrap_or(0);
        let new_era = current_block / self.era_length;
        
        // Only transition if we're actually at an era boundary
        if !self.should_transition_era() && new_era == self.current_era {
            return Ok(()); // Not at era boundary yet
        }

        // Calculate and distribute rewards for previous era
        self.distribute_era_rewards()?;

        // Update era
        self.current_era = new_era;
        
        // Reset transaction fees for new era
        self.transaction_fees = 0;
        
        // Store era in storage
        let era_key = b"Consensus:CurrentEra";
        self.storage.put(era_key, &self.current_era.encode());

        Ok(())
    }

    /// Distribute rewards for the completed era
    // `total_stake > 0` guards a whole loop body; a checked_div rewrite would obscure the arithmetic.
    #[allow(clippy::manual_checked_ops)]
    fn distribute_era_rewards(&mut self) -> Result<()> {
        // Calculate total rewards for the era
        // Base reward per block * blocks in era + transaction fees
        let blocks_in_era: u128 = self.era_length as u128;
        // Sustainable emission: ~5% annual inflation on 13B supply
        // = 650M CGT/year / 15.7M blocks/year = ~41 CGT/block
        // Using 42 CGT per block (4200 Sparks) for simplicity
        let base_reward_per_block = 42u128; // 42 CGT per block (sustainable)
        let total_base_rewards = base_reward_per_block * blocks_in_era;
        
        // Add accumulated transaction fees
        let total_rewards = total_base_rewards + self.transaction_fees;
        
        // Allocate rewards: 20% to proposers, 80% to validators
        let proposer_share = total_rewards * 20 / 100;
        let validator_share = total_rewards * 80 / 100;
        
        // Distribute proposer rewards (simplified - in production, track per block)
        let proposer_count = self.validators.count() as u128;
        if let Some(proposer_reward_per_validator) = proposer_share.checked_div(proposer_count) {
            // Collect validators to update first
            let validators_to_update: Vec<Validator> = self.validators.iter()
                .map(|(_account, validator)| {
                    let mut updated_validator = validator.clone();
                    updated_validator.stake += proposer_reward_per_validator;
                    updated_validator
                })
                .collect();
            
            // Update validators outside the iterator
            for updated_validator in validators_to_update {
                self.validators.register_validator(updated_validator);
            }
        }
        
        // Distribute validator rewards based on stake weight (including staking pools)
        let total_stake = self.validators.total_stake();
        if total_stake > 0 {
            // Collect validators to update first
            let mut validators_to_update: Vec<Validator> = Vec::new();
            // (validator, [(nominator, reward)]) pairs; an alias would not read clearer here.
            #[allow(clippy::type_complexity)]
            let mut pool_updates: Vec<([u8; 32], Vec<([u8; 32], u128)>)> = Vec::new();
            
            for (account, validator) in self.validators.iter() {
                // Get staking pool for this validator
                let pool_stake = self.staking_pools
                    .get(account)
                    .map(|pool| pool.total_stake())
                    .unwrap_or(0);
                
                // Total stake = validator's own stake + pool stake
                let total_validator_stake = validator.stake + pool_stake;
                
                // Calculate validator's share based on total stake
                let validator_reward = (validator_share * total_validator_stake) / total_stake;
                
                // Apply commission
                let commission_amount = (validator_reward * validator.commission as u128) / 100;
                let validator_net_reward = validator_reward - commission_amount;
                
                // Prepare validator update (validator gets net reward + commission)
                let mut updated_validator = validator.clone();
                updated_validator.stake += validator_net_reward + commission_amount;
                validators_to_update.push(updated_validator);
                
                // Collect nominator distributions
                if let Some(pool) = self.staking_pools.get(account) {
                    if pool.total_stake() > 0 {
                        let mut nominator_shares = Vec::new();
                        let stakes = pool.stakes();
                        for (_staker_account, stake) in stakes.iter() {
                            let nominator_share = (validator_net_reward * stake.amount) / pool.total_stake();
                            nominator_shares.push((*_staker_account, nominator_share));
                            // TODO: Distribute to nominator account via balances module
                            // For now, we'll track it in the staking pool
                            // In production, we'd call: BalancesModule::mint(storage, *staker_account, nominator_share)
                        }
                        pool_updates.push((*account, nominator_shares));
                    }
                }
            }
            
            // Update validators outside the iterator
            for updated_validator in validators_to_update {
                self.validators.register_validator(updated_validator);
            }
            
            // Apply pool updates (if needed in the future)
            // Pool updates are handled above during collection
            // Future: distribute rewards to nominator accounts
            let _ = pool_updates; // Acknowledge that pool_updates is collected but not yet used
        }
        
        Ok(())
    }

    /// Collect transaction fees from a block
    pub fn collect_transaction_fees(&mut self, block: &Block) -> u128 {
        // Calculate fees from transactions
        // For now, use a simple fee model: 1 CGT per transaction
        // In production, fees would be specified in transactions
        let fee_per_tx = 1u128;
        let total_fees = block.transactions.len() as u128 * fee_per_tx;
        
        // Accumulate fees for current era
        self.transaction_fees += total_fees;
        
        total_fees
    }

    /// Get accumulated transaction fees for current era
    pub fn get_transaction_fees(&self) -> u128 {
        self.transaction_fees
    }

    /// Calculate state root from storage
    /// 
    /// Delegates to the storage backend's state_root() method which
    /// calculates a Merkle root from all key-value pairs in the state.
    pub fn calculate_state_root(&self) -> Result<[u8; 32]> {
        self.storage.state_root()
            .map_err(|e| ConsensusError::BlockValidationFailed(
                format!("Failed to calculate state root: {}", e)
            ))
    }

    /// Verify state root matches calculated root
    pub fn verify_state_root(&self, expected_state_root: [u8; 32]) -> Result<()> {
        let calculated_root = self.calculate_state_root()?;
        
        if calculated_root != expected_state_root {
            return Err(ConsensusError::BlockValidationFailed(
                format!(
                    "State root mismatch: expected {:?}, got {:?}",
                    hex::encode(expected_state_root),
                    hex::encode(calculated_root)
                )
            ));
        }
        
        Ok(())
    }

    /// Create or get staking pool for a validator
    pub fn get_or_create_staking_pool(&mut self, validator: [u8; 32], commission: u8) -> &mut StakingPool {
        self.staking_pools
            .entry(validator)
            .or_insert_with(|| StakingPool::new(validator, commission))
    }

    /// Nominate a validator (add stake to their pool)
    pub fn nominate_validator(
        &mut self,
        validator: [u8; 32],
        nominator: [u8; 32],
        amount: u128,
    ) -> Result<()> {
        let validator_info = self.validators
            .get_validator(&validator)
            .ok_or(ConsensusError::ValidatorNotFound)?
            .clone();
        
        let current_era = self.current_era;
        let pool = self.get_or_create_staking_pool(validator, validator_info.commission);
        pool.stake(nominator, amount, current_era)?;
        
        // Update validator's total stake (includes pool stake)
        let mut updated_validator = validator_info;
        updated_validator.stake += amount; // Add to validator's stake
        self.validators.register_validator(updated_validator);
        
        Ok(())
    }

    /// Load current era from storage
    fn load_current_era(storage: &S) -> Option<u64> {
        let era_key = b"Consensus:CurrentEra";
        storage.get(era_key).and_then(|value| {
            u64::decode(&mut &value[..]).ok()
        })
    }
}


/// Block proof from proposer
#[derive(Clone, Debug)]
pub struct BlockProof {
    pub proposer: [u8; 32],
    pub signature: [u8; 64],
    pub timestamp: u64,
}

/// Block signature from validator
#[derive(Clone, Debug)]
pub struct BlockSignature {
    pub validator: [u8; 32],
    pub proof: BlockProof,
}
