//! CVP Integration Hooks for DRC-369
//!
//! Phase 3 Implementation: Connects DRC-369 NFT operations to the CVP engine
//! for dynamic bytecode protection. Every epoch, the NFT contract bytecode
//! mutates while preserving semantic equivalence.
//!
//! # Security Model
//!
//! ```text
//! ┌─────────────────────────────────────────────────┐
//! │                  CVP Engine                      │
//! │  ┌─────────────────────────────────────────────┐ │
//! │  │ Epoch 1: Bytecode Variant A                 │ │
//! │  │ - Opcode substitution applied               │ │
//! │  │ - Memory layout randomized                  │ │
//! │  └─────────────────────────────────────────────┘ │
//! │                      │                           │
//! │                      ▼ Epoch Transition          │
//! │  ┌─────────────────────────────────────────────┐ │
//! │  │ Epoch 2: Bytecode Variant B                 │ │
//! │  │ - Different opcodes, same semantics         │ │
//! │  │ - Control flow obfuscated                   │ │
//! │  │ - ZK proof: A ≡ B (semantic equivalence)    │ │
//! │  └─────────────────────────────────────────────┘ │
//! └─────────────────────────────────────────────────┘
//! ```

use codec::{Decode, Encode};
use scale_info::TypeInfo;
use serde::{Deserialize, Serialize};
use demiurge_storage::Storage;
use demiurge_cvp::{
    CvpEngine, CvpConfig, ContractId,
    EquivalenceProof, MutationResult,
    drc369::{build_drc369_semantic_ir, Drc369CvpConfig},
};
use tracing::{info, warn, error};
use std::sync::RwLock;

use crate::error::{Drc369Error, Result};

/// Storage keys for CVP integration
mod storage_keys {
    pub const CVP_ENABLED: &[u8] = b"DRC369:CVP:Enabled";
    pub const CVP_CONTRACT_ID: &[u8] = b"DRC369:CVP:ContractId";
    pub const CVP_CURRENT_EPOCH: &[u8] = b"DRC369:CVP:CurrentEpoch";
    pub const CVP_LAST_MUTATION: &[u8] = b"DRC369:CVP:LastMutation";
    pub const CVP_MUTATION_COUNT: &[u8] = b"DRC369:CVP:MutationCount";
    pub const CVP_LATEST_PROOF: &[u8] = b"DRC369:CVP:LatestProof";
}

/// CVP status for DRC-369 module
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct Drc369CvpStatus {
    /// Whether CVP protection is enabled
    pub enabled: bool,
    /// CVP contract ID
    pub contract_id: ContractId,
    /// Current mutation epoch
    pub current_epoch: u64,
    /// Last block where mutation occurred
    pub last_mutation_block: u64,
    /// Total mutations performed
    pub mutation_count: u64,
    /// Proof system in use
    pub proof_system: String,
    /// Whether latest mutation was verified
    pub verified: bool,
}

/// CVP Hook Manager for DRC-369
pub struct CvpHookManager {
    /// CVP engine reference (wrapped for interior mutability)
    engine: RwLock<CvpEngine>,
    /// DRC-369 contract ID
    contract_id: ContractId,
    /// Whether CVP is enabled
    enabled: bool,
    /// Epoch length (blocks)
    epoch_length: u64,
}

impl CvpHookManager {
    /// Create a new CVP hook manager with default config
    pub fn new() -> Self {
        let contract_id = Self::generate_contract_id();
        let config = CvpConfig::default();
        
        Self {
            engine: RwLock::new(CvpEngine::with_config(config)),
            contract_id,
            enabled: true,
            epoch_length: 100,
        }
    }
    
    /// Create with custom CVP configuration
    pub fn with_config(cvp_config: CvpConfig, drc369_config: Drc369CvpConfig) -> Self {
        let contract_id = Self::generate_contract_id();
        
        Self {
            engine: RwLock::new(CvpEngine::with_config(cvp_config)),
            contract_id,
            enabled: true,
            epoch_length: drc369_config.epoch_length,
        }
    }
    
    /// Generate deterministic contract ID for DRC-369
    fn generate_contract_id() -> ContractId {
        use blake2::{Blake2b512, Digest};
        let mut hasher = Blake2b512::new();
        hasher.update(b"DRC369_CVP_CONTRACT_V1");
        hasher.update(b"DEMIURGE_BLOCKCHAIN");
        let hash = hasher.finalize();
        let mut id = [0u8; 32];
        id.copy_from_slice(&hash[..32]);
        id
    }
    
    /// Initialize CVP protection for DRC-369
    pub fn initialize(&self, storage: &dyn Storage, initial_bytecode: Vec<u8>) -> Result<()> {
        // Build semantic IR for DRC-369
        let semantic_ir = build_drc369_semantic_ir(self.contract_id);
        
        // Register with CVP engine
        let engine = self.engine.read()
            .map_err(|_| Drc369Error::CvpMutationFailed("Engine lock poisoned".to_string()))?;
        engine.register_contract(self.contract_id, semantic_ir, initial_bytecode)
            .map_err(|e| Drc369Error::CvpRegistrationFailed(e.to_string()))?;
        
        // Store initial state
        storage.put(storage_keys::CVP_ENABLED, &[1u8]);
        storage.put(storage_keys::CVP_CONTRACT_ID, &self.contract_id);
        storage.put(storage_keys::CVP_CURRENT_EPOCH, &0u64.encode());
        storage.put(storage_keys::CVP_MUTATION_COUNT, &0u64.encode());
        
        info!(
            "DRC369 CVP: Initialized with contract ID {}",
            hex::encode(&self.contract_id[..8])
        );
        
        Ok(())
    }
    
    /// Hook called when a block is finalized
    /// 
    /// This checks if an epoch transition should occur and triggers
    /// bytecode mutation if necessary.
    pub fn on_block_finalized(
        &self,
        storage: &dyn Storage,
        block_number: u64,
        block_hash: [u8; 32],
    ) -> Result<Option<MutationEvent>> {
        if !self.is_enabled(storage) {
            return Ok(None);
        }
        
        let current_epoch = self.get_current_epoch(storage);
        let new_epoch = block_number / self.epoch_length;
        
        // Check if we're transitioning to a new epoch
        if new_epoch > current_epoch {
            // Trigger mutation via epoch transition
            match self.trigger_mutation(block_hash, block_number) {
                Ok(result) => {
                    // Update epoch
                    storage.put(storage_keys::CVP_CURRENT_EPOCH, &new_epoch.encode());
                    storage.put(storage_keys::CVP_LAST_MUTATION, &block_number.encode());
                    
                    // Increment mutation count
                    let count = self.get_mutation_count(storage) + 1;
                    storage.put(storage_keys::CVP_MUTATION_COUNT, &count.encode());
                    
                    // Store latest proof
                    storage.put(storage_keys::CVP_LATEST_PROOF, &result.proof.encode());
                    
                    info!(
                        "DRC369 CVP: Epoch {} -> {} mutation complete (block {})",
                        current_epoch, new_epoch, block_number
                    );
                    
                    return Ok(Some(MutationEvent {
                        epoch: new_epoch,
                        block_number,
                        contract_id: self.contract_id,
                        original_hash: result.original_hash,
                        new_hash: result.new_hash,
                        proof_system: format!("{:?}", result.proof.proof_system),
                        size_change: result.size_change,
                    }));
                }
                Err(e) => {
                    error!("DRC369 CVP: Mutation failed at block {}: {}", block_number, e);
                    return Err(Drc369Error::CvpMutationFailed(e.to_string()));
                }
            }
        }
        
        Ok(None)
    }
    
    /// Derive epoch seed from block hash
    // Only exercised by unit tests so far; no production caller yet.
    #[allow(dead_code)]
    fn derive_epoch_seed(block_hash: &[u8; 32], epoch: u64) -> [u8; 32] {
        use blake2::{Blake2b512, Digest};
        let mut hasher = Blake2b512::new();
        hasher.update(b"CVP_EPOCH_SEED_V1");
        hasher.update(block_hash);
        hasher.update(epoch.to_le_bytes());
        let hash = hasher.finalize();
        let mut seed = [0u8; 32];
        seed.copy_from_slice(&hash[..32]);
        seed
    }
    
    /// Trigger bytecode mutation via epoch transition
    fn trigger_mutation(
        &self,
        block_hash: [u8; 32],
        block_number: u64,
    ) -> std::result::Result<MutationResult, demiurge_cvp::CvpError> {
        let mut engine = self.engine.write()
            .map_err(|_| demiurge_cvp::CvpError::InternalError("Engine lock poisoned".to_string()))?;
        
        // Perform epoch transition (mutates all registered contracts)
        let results = engine.transition_epoch(block_number, &[block_hash])?;
        
        // Return the result for our contract
        results.into_iter()
            .find(|r| r.contract_id == self.contract_id)
            .ok_or_else(|| demiurge_cvp::CvpError::ContractNotFound(
                hex::encode(self.contract_id)
            ))
    }
    
    /// Hook called before NFT transfer
    /// 
    /// This allows CVP to verify the current bytecode state before
    /// executing any transfer logic.
    pub fn pre_transfer_hook(
        &self,
        storage: &dyn Storage,
        _from: [u8; 32],
        _to: [u8; 32],
        _nft_id: [u8; 32],
    ) -> Result<()> {
        if !self.is_enabled(storage) {
            return Ok(());
        }
        
        // Verify CVP state is valid
        if let Some(proof_bytes) = storage.get(storage_keys::CVP_LATEST_PROOF) {
            if let Ok(proof) = EquivalenceProof::decode(&mut &proof_bytes[..]) {
                if !proof.is_well_formed() {
                    warn!("DRC369 CVP: Latest proof is malformed");
                    // Continue anyway - don't block transfers
                }
            }
        }
        
        Ok(())
    }
    
    /// Hook called after NFT transfer
    /// 
    /// This can be used to record transfer events for attack detection.
    pub fn post_transfer_hook(
        &self,
        storage: &dyn Storage,
        from: [u8; 32],
        to: [u8; 32],
        nft_id: [u8; 32],
    ) -> Result<()> {
        if !self.is_enabled(storage) {
            return Ok(());
        }
        
        // Log transfer for attack pattern detection
        info!(
            "DRC369 CVP: Transfer recorded NFT {} from {} to {}",
            hex::encode(&nft_id[..8]),
            hex::encode(&from[..8]),
            hex::encode(&to[..8])
        );
        
        Ok(())
    }
    
    /// Hook called before mint operation
    pub fn pre_mint_hook(
        &self,
        storage: &dyn Storage,
        _caller: [u8; 32],
        _owner: [u8; 32],
    ) -> Result<()> {
        if !self.is_enabled(storage) {
            return Ok(());
        }
        
        // CVP verification before mint (could rate-limit suspicious activity)
        Ok(())
    }
    
    /// Get current CVP status
    pub fn get_status(&self, storage: &dyn Storage) -> Drc369CvpStatus {
        let enabled = self.is_enabled(storage);
        let current_epoch = self.get_current_epoch(storage);
        let last_mutation_block = self.get_last_mutation_block(storage);
        let mutation_count = self.get_mutation_count(storage);
        
        let (proof_system, verified) = if let Some(proof_bytes) = storage.get(storage_keys::CVP_LATEST_PROOF) {
            if let Ok(proof) = EquivalenceProof::decode(&mut &proof_bytes[..]) {
                (format!("{:?}", proof.proof_system), proof.is_well_formed())
            } else {
                ("Unknown".to_string(), false)
            }
        } else {
            ("None".to_string(), false)
        };
        
        Drc369CvpStatus {
            enabled,
            contract_id: self.contract_id,
            current_epoch,
            last_mutation_block,
            mutation_count,
            proof_system,
            verified,
        }
    }
    
    /// Check if CVP is enabled
    pub fn is_enabled(&self, storage: &dyn Storage) -> bool {
        self.enabled && storage.get(storage_keys::CVP_ENABLED)
            .map(|v| !v.is_empty() && v[0] == 1)
            .unwrap_or(false)
    }
    
    /// Get current epoch
    fn get_current_epoch(&self, storage: &dyn Storage) -> u64 {
        storage.get(storage_keys::CVP_CURRENT_EPOCH)
            .and_then(|v| u64::decode(&mut &v[..]).ok())
            .unwrap_or(0)
    }
    
    /// Get last mutation block
    fn get_last_mutation_block(&self, storage: &dyn Storage) -> u64 {
        storage.get(storage_keys::CVP_LAST_MUTATION)
            .and_then(|v| u64::decode(&mut &v[..]).ok())
            .unwrap_or(0)
    }
    
    /// Get total mutation count
    fn get_mutation_count(&self, storage: &dyn Storage) -> u64 {
        storage.get(storage_keys::CVP_MUTATION_COUNT)
            .and_then(|v| u64::decode(&mut &v[..]).ok())
            .unwrap_or(0)
    }
    
    /// Disable CVP protection (admin only)
    pub fn disable(&self, storage: &dyn Storage) -> Result<()> {
        storage.put(storage_keys::CVP_ENABLED, &[0u8]);
        warn!("DRC369 CVP: Protection disabled");
        Ok(())
    }
    
    /// Enable CVP protection
    pub fn enable(&self, storage: &dyn Storage) -> Result<()> {
        storage.put(storage_keys::CVP_ENABLED, &[1u8]);
        info!("DRC369 CVP: Protection enabled");
        Ok(())
    }
    
    /// Force emergency mutation (for detected attacks)
    pub fn emergency_mutate(
        &self,
        storage: &dyn Storage,
        block_number: u64,
        reason: &str,
    ) -> Result<MutationEvent> {
        warn!("DRC369 CVP: Emergency mutation triggered: {}", reason);
        
        // Generate emergency hash from timestamp and reason (used as block hash substitute)
        use blake2::{Blake2b512, Digest};
        let mut hasher = Blake2b512::new();
        hasher.update(b"EMERGENCY_MUTATION");
        hasher.update(block_number.to_le_bytes());
        hasher.update(reason.as_bytes());
        let hash = hasher.finalize();
        let mut emergency_hash = [0u8; 32];
        emergency_hash.copy_from_slice(&hash[..32]);
        
        match self.trigger_mutation(emergency_hash, block_number) {
            Ok(result) => {
                let count = self.get_mutation_count(storage) + 1;
                storage.put(storage_keys::CVP_MUTATION_COUNT, &count.encode());
                storage.put(storage_keys::CVP_LAST_MUTATION, &block_number.encode());
                storage.put(storage_keys::CVP_LATEST_PROOF, &result.proof.encode());
                
                Ok(MutationEvent {
                    epoch: self.get_current_epoch(storage),
                    block_number,
                    contract_id: self.contract_id,
                    original_hash: result.original_hash,
                    new_hash: result.new_hash,
                    proof_system: format!("{:?}", result.proof.proof_system),
                    size_change: result.size_change,
                })
            }
            Err(e) => Err(Drc369Error::CvpMutationFailed(e.to_string())),
        }
    }
}

impl Default for CvpHookManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Event emitted when a CVP mutation occurs
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct MutationEvent {
    /// Epoch number
    pub epoch: u64,
    /// Block number where mutation occurred
    pub block_number: u64,
    /// Contract ID that was mutated
    pub contract_id: ContractId,
    /// Hash of original bytecode
    pub original_hash: [u8; 32],
    /// Hash of new (mutated) bytecode
    pub new_hash: [u8; 32],
    /// Proof system used
    pub proof_system: String,
    /// Size change (new - old)
    pub size_change: i64,
}

#[cfg(test)]
mod tests {
    use super::*;
    use demiurge_storage::MemoryStorage;
    
    fn setup_test_storage() -> MemoryStorage {
        MemoryStorage::new()
    }
    
    #[test]
    fn test_cvp_initialization() {
        let storage = setup_test_storage();
        let manager = CvpHookManager::new();
        
        // Generate test bytecode
        let bytecode = vec![0x60, 0x00, 0x35, 0x60, 0xE0, 0x1C];
        
        let result = manager.initialize(&storage, bytecode);
        assert!(result.is_ok());
        
        // Verify state
        assert!(manager.is_enabled(&storage));
        assert_eq!(manager.get_current_epoch(&storage), 0);
    }
    
    #[test]
    fn test_epoch_seed_derivation() {
        let block_hash = [1u8; 32];
        let epoch = 5;
        
        let seed1 = CvpHookManager::derive_epoch_seed(&block_hash, epoch);
        let seed2 = CvpHookManager::derive_epoch_seed(&block_hash, epoch);
        
        // Same inputs should produce same seed
        assert_eq!(seed1, seed2);
        
        // Different epoch should produce different seed
        let seed3 = CvpHookManager::derive_epoch_seed(&block_hash, epoch + 1);
        assert_ne!(seed1, seed3);
    }
    
    #[test]
    fn test_status_query() {
        let storage = setup_test_storage();
        let manager = CvpHookManager::new();
        
        let status = manager.get_status(&storage);
        
        // Initially disabled (not initialized)
        assert!(!status.enabled);
        assert_eq!(status.current_epoch, 0);
        assert_eq!(status.mutation_count, 0);
    }
}
