//! # Modular Fluidity - Hot-Swappable Consensus Mechanisms
//!
//! This module provides an abstraction layer that allows consensus mechanisms
//! to be swapped at runtime without requiring hard forks.
//!
//! ## Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────┐
//! │                     ConsensusOrchestrator                       │
//! │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
//! │  │  Mechanism   │  │  Mechanism   │  │  Mechanism   │          │
//! │  │   Registry   │──│   Switcher   │──│   Monitor    │          │
//! │  └──────────────┘  └──────────────┘  └──────────────┘          │
//! └─────────────────────────────────────────────────────────────────┘
//!                              │
//!          ┌───────────────────┼───────────────────┐
//!          ▼                   ▼                   ▼
//! ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
//! │  PoS + BFT      │ │  Pure BFT       │ │  Raft/PBFT      │
//! │  (Default)      │ │  (High Speed)   │ │  (Enterprise)   │
//! └─────────────────┘ └─────────────────┘ └─────────────────┘
//! ```
//!
//! ## Switching Process
//!
//! 1. Governance proposal for mechanism switch
//! 2. Validators download new mechanism bytecode
//! 3. At designated block, orchestrator atomically swaps
//! 4. Fallback to previous mechanism on failure

use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use codec::{Encode, Decode};
use demiurge_core::{Block, Transaction};

/// Unique identifier for a consensus mechanism
pub type MechanismId = [u8; 32];

/// Version of a consensus mechanism
#[derive(Debug, Clone, Copy, Encode, Decode, PartialEq, Eq)]
pub struct MechanismVersion {
    pub major: u16,
    pub minor: u16,
    pub patch: u16,
}

impl MechanismVersion {
    pub fn new(major: u16, minor: u16, patch: u16) -> Self {
        Self { major, minor, patch }
    }
}

impl Default for MechanismVersion {
    fn default() -> Self {
        Self::new(1, 0, 0)
    }
}

impl std::fmt::Display for MechanismVersion {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}.{}.{}", self.major, self.minor, self.patch)
    }
}

/// Metadata about a consensus mechanism
#[derive(Debug, Clone, Encode, Decode)]
pub struct MechanismMetadata {
    /// Unique identifier
    pub id: MechanismId,
    /// Human-readable name
    pub name: String,
    /// Version
    pub version: MechanismVersion,
    /// Description
    pub description: String,
    /// Author/maintainer
    pub author: String,
    /// Minimum validators required
    pub min_validators: u32,
    /// Maximum TPS capability
    pub max_tps: u32,
    /// Finality time in milliseconds
    pub finality_ms: u64,
    /// Whether mechanism supports instant finality
    pub instant_finality: bool,
    /// Required features (e.g., "bft", "pos", "poa")
    pub features: Vec<String>,
}

/// Result of block validation by a consensus mechanism
#[derive(Debug, Clone)]
pub enum ValidationResult {
    /// Block is valid
    Valid,
    /// Block is invalid with reason
    Invalid(String),
    /// Need more information to decide
    Pending,
}

/// Result of consensus finalization
#[derive(Debug, Clone)]
pub enum FinalityResult {
    /// Block is finalized
    Finalized,
    /// Not enough signatures/votes
    NotEnoughVotes { required: u32, received: u32 },
    /// Finalization failed with error
    Failed(String),
}

/// Trait that all consensus mechanisms must implement
pub trait ConsensusMechanism: Send + Sync {
    /// Get mechanism metadata
    fn metadata(&self) -> &MechanismMetadata;
    
    /// Initialize the mechanism with storage
    fn initialize(&mut self, config: MechanismConfig) -> Result<(), MechanismError>;
    
    /// Select the next block proposer
    fn select_proposer(&self, block_number: u64) -> Result<[u8; 32], MechanismError>;
    
    /// Validate a proposed block
    fn validate_block(&self, block: &Block, proposer: [u8; 32]) -> ValidationResult;
    
    /// Collect votes/signatures and attempt finalization
    fn finalize_block(
        &mut self,
        block: &Block,
        votes: Vec<Vote>,
    ) -> Result<FinalityResult, MechanismError>;
    
    /// Handle epoch/era transitions
    fn on_epoch_boundary(&mut self, epoch: u64) -> Result<(), MechanismError>;
    
    /// Get current mechanism state
    fn state(&self) -> MechanismState;
    
    /// Gracefully shutdown (prepare for switch)
    fn prepare_shutdown(&mut self) -> Result<(), MechanismError>;
    
    /// Export state for migration
    fn export_state(&self) -> Result<Vec<u8>, MechanismError>;
    
    /// Import state from previous mechanism
    fn import_state(&mut self, state: Vec<u8>) -> Result<(), MechanismError>;
}

/// Configuration for a consensus mechanism
#[derive(Debug, Clone)]
pub struct MechanismConfig {
    /// Block time in milliseconds
    pub block_time_ms: u64,
    /// Era/epoch length in blocks
    pub era_length: u64,
    /// Minimum stake for validators
    pub min_stake: u128,
    /// BFT threshold (e.g., 67 for 2/3+1)
    pub bft_threshold: u8,
    /// Custom parameters
    pub custom: HashMap<String, Vec<u8>>,
}

impl Default for MechanismConfig {
    fn default() -> Self {
        Self {
            block_time_ms: 2000,
            era_length: 1000,
            min_stake: 1000,
            bft_threshold: 67,
            custom: HashMap::new(),
        }
    }
}

/// Current state of a mechanism
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MechanismState {
    /// Not initialized
    Uninitialized,
    /// Ready to produce/validate blocks
    Active,
    /// Preparing for shutdown
    ShuttingDown,
    /// Stopped
    Stopped,
    /// Error state
    Error,
}

/// Vote for block finalization
#[derive(Debug, Clone, Encode, Decode)]
pub struct Vote {
    pub validator: [u8; 32],
    pub block_hash: [u8; 32],
    pub signature: [u8; 64],
    pub timestamp: u64,
}

/// Errors from consensus mechanisms
#[derive(Debug, Clone)]
pub enum MechanismError {
    /// Not initialized
    NotInitialized,
    /// Invalid configuration
    InvalidConfig(String),
    /// Proposer selection failed
    ProposerSelectionFailed(String),
    /// Finalization failed
    FinalizationFailed(String),
    /// State export/import failed
    StateMigrationFailed(String),
    /// Already shutdown
    AlreadyShutdown,
    /// Generic error
    Other(String),
}

impl std::fmt::Display for MechanismError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::NotInitialized => write!(f, "Mechanism not initialized"),
            Self::InvalidConfig(msg) => write!(f, "Invalid config: {}", msg),
            Self::ProposerSelectionFailed(msg) => write!(f, "Proposer selection failed: {}", msg),
            Self::FinalizationFailed(msg) => write!(f, "Finalization failed: {}", msg),
            Self::StateMigrationFailed(msg) => write!(f, "State migration failed: {}", msg),
            Self::AlreadyShutdown => write!(f, "Mechanism already shutdown"),
            Self::Other(msg) => write!(f, "{}", msg),
        }
    }
}

impl std::error::Error for MechanismError {}

/// Orchestrates consensus mechanism switching
pub struct ConsensusOrchestrator {
    /// Currently active mechanism
    active: Arc<RwLock<Box<dyn ConsensusMechanism>>>,
    /// Registry of available mechanisms
    registry: HashMap<MechanismId, Arc<dyn Fn() -> Box<dyn ConsensusMechanism> + Send + Sync>>,
    /// Pending switch (scheduled)
    pending_switch: Option<ScheduledSwitch>,
    /// History of switches
    switch_history: Vec<SwitchRecord>,
    /// Current config
    config: MechanismConfig,
}

/// A scheduled consensus switch
#[derive(Debug, Clone)]
pub struct ScheduledSwitch {
    /// Target mechanism ID
    pub target_id: MechanismId,
    /// Block number to switch at
    pub switch_at_block: u64,
    /// Governance proposal ID that approved this
    pub proposal_id: Option<[u8; 32]>,
    /// Number of validators ready
    pub validators_ready: usize,
    /// Required validators for switch
    pub required_validators: usize,
}

/// Record of a past switch
#[derive(Debug, Clone)]
pub struct SwitchRecord {
    /// Previous mechanism ID
    pub from_id: MechanismId,
    /// New mechanism ID
    pub to_id: MechanismId,
    /// Block number where switch occurred
    pub block_number: u64,
    /// Timestamp of switch
    pub timestamp: u64,
    /// Whether switch was successful
    pub success: bool,
    /// Error message if failed
    pub error: Option<String>,
}

impl ConsensusOrchestrator {
    /// Create a new orchestrator with an initial mechanism
    pub fn new(
        initial: Box<dyn ConsensusMechanism>,
        config: MechanismConfig,
    ) -> Self {
        Self {
            active: Arc::new(RwLock::new(initial)),
            registry: HashMap::new(),
            pending_switch: None,
            switch_history: Vec::new(),
            config,
        }
    }
    
    /// Register a mechanism factory
    pub fn register_mechanism<F>(&mut self, id: MechanismId, factory: F)
    where
        F: Fn() -> Box<dyn ConsensusMechanism> + Send + Sync + 'static,
    {
        self.registry.insert(id, Arc::new(factory));
    }
    
    /// Get the active mechanism
    pub fn active(&self) -> Arc<RwLock<Box<dyn ConsensusMechanism>>> {
        self.active.clone()
    }
    
    /// Get metadata of active mechanism
    pub fn active_metadata(&self) -> MechanismMetadata {
        self.active.read().unwrap().metadata().clone()
    }
    
    /// List all registered mechanisms
    pub fn list_mechanisms(&self) -> Vec<MechanismId> {
        self.registry.keys().copied().collect()
    }
    
    /// Schedule a switch to a different mechanism
    pub fn schedule_switch(
        &mut self,
        target_id: MechanismId,
        switch_at_block: u64,
        proposal_id: Option<[u8; 32]>,
        required_validators: usize,
    ) -> Result<(), MechanismError> {
        // Verify mechanism exists
        if !self.registry.contains_key(&target_id) {
            return Err(MechanismError::InvalidConfig(
                "Target mechanism not registered".to_string()
            ));
        }
        
        self.pending_switch = Some(ScheduledSwitch {
            target_id,
            switch_at_block,
            proposal_id,
            validators_ready: 0,
            required_validators,
        });
        
        tracing::info!(
            "Consensus switch scheduled: target={} at block={}",
            hex::encode(&target_id[..8]),
            switch_at_block
        );
        
        Ok(())
    }
    
    /// Schedule a governance-approved switch
    /// 
    /// This method should be called when a governance proposal for consensus
    /// switching has passed and been executed. It validates the proposal_id
    /// is provided and schedules the switch.
    pub fn schedule_governance_switch(
        &mut self,
        target_id: MechanismId,
        switch_at_block: u64,
        proposal_id: [u8; 32],
        required_validators: usize,
    ) -> Result<(), MechanismError> {
        // Validate proposal_id is non-zero (governance approved)
        if proposal_id == [0u8; 32] {
            return Err(MechanismError::InvalidConfig(
                "Governance-triggered switch requires valid proposal ID".to_string()
            ));
        }
        
        tracing::info!(
            "Governance-approved consensus switch: proposal={}",
            hex::encode(&proposal_id[..8])
        );
        
        // Use the standard schedule_switch with the proposal ID
        self.schedule_switch(target_id, switch_at_block, Some(proposal_id), required_validators)
    }
    
    /// Check if a pending switch is governance-approved
    pub fn is_switch_governance_approved(&self) -> bool {
        self.pending_switch
            .as_ref()
            .map(|s| s.proposal_id.is_some())
            .unwrap_or(false)
    }
    
    /// Get the governance proposal ID for the pending switch
    pub fn pending_switch_proposal_id(&self) -> Option<[u8; 32]> {
        self.pending_switch.as_ref().and_then(|s| s.proposal_id)
    }
    
    /// Signal that a validator is ready for the switch
    pub fn validator_ready(&mut self, _validator: [u8; 32]) {
        if let Some(ref mut switch) = self.pending_switch {
            switch.validators_ready += 1;
            tracing::info!(
                "Validator ready for switch: {}/{}",
                switch.validators_ready,
                switch.required_validators
            );
        }
    }
    
    /// Check if we should switch at this block
    pub fn should_switch(&self, current_block: u64) -> bool {
        if let Some(ref switch) = self.pending_switch {
            current_block >= switch.switch_at_block
                && switch.validators_ready >= switch.required_validators
        } else {
            false
        }
    }
    
    /// Execute the switch
    pub fn execute_switch(&mut self, current_block: u64) -> Result<(), MechanismError> {
        let switch = self.pending_switch.take()
            .ok_or_else(|| MechanismError::Other("No pending switch".to_string()))?;
        
        let target_id = switch.target_id;
        let factory = self.registry.get(&target_id)
            .ok_or_else(|| MechanismError::InvalidConfig(
                "Target mechanism not registered".to_string()
            ))?
            .clone();
        
        // Export state from current mechanism
        let state_export = {
            let active = self.active.read().unwrap();
            active.export_state()?
        };
        
        // Prepare current mechanism for shutdown
        {
            let mut active = self.active.write().unwrap();
            active.prepare_shutdown()?;
        }
        
        // Get current mechanism ID for history
        let from_id = {
            let active = self.active.read().unwrap();
            active.metadata().id
        };
        
        // Create new mechanism
        let mut new_mechanism = factory();
        
        // Initialize new mechanism
        new_mechanism.initialize(self.config.clone())?;
        
        // Import state
        new_mechanism.import_state(state_export)?;
        
        // Atomic swap
        *self.active.write().unwrap() = new_mechanism;
        
        // Record switch
        self.switch_history.push(SwitchRecord {
            from_id,
            to_id: target_id,
            block_number: current_block,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            success: true,
            error: None,
        });
        
        tracing::info!(
            "Consensus mechanism switched: {} -> {} at block {}",
            hex::encode(&from_id[..8]),
            hex::encode(&target_id[..8]),
            current_block
        );
        
        Ok(())
    }
    
    /// Rollback to previous mechanism on failure
    pub fn rollback(&mut self, _reason: &str) -> Result<(), MechanismError> {
        // In a real implementation, we'd keep the previous mechanism around
        // until the new one is confirmed working
        tracing::error!("Rollback requested: {}", _reason);
        
        // For now, just log - in production we'd restore the backup
        Err(MechanismError::Other("Rollback not implemented".to_string()))
    }
    
    /// Get switch history
    pub fn switch_history(&self) -> &[SwitchRecord] {
        &self.switch_history
    }
    
    /// On block finalized callback
    pub fn on_block_finalized(&mut self, block: &Block) -> Result<(), MechanismError> {
        let block_number = block.header.block_number;
        
        // Check if we should execute a switch
        if self.should_switch(block_number) {
            self.execute_switch(block_number)?;
        }
        
        // Handle epoch boundaries
        // (epoch detection would be based on config)
        let era_length = self.config.era_length;
        if block_number > 0 && block_number % era_length == 0 {
            let epoch = block_number / era_length;
            let mut active = self.active.write().unwrap();
            active.on_epoch_boundary(epoch)?;
        }
        
        Ok(())
    }
}

/// Built-in PoS + BFT mechanism (the current default)
pub struct PosBftMechanism {
    metadata: MechanismMetadata,
    state: MechanismState,
    validators: Vec<([u8; 32], u128)>, // (account, stake)
    current_epoch: u64,
}

impl PosBftMechanism {
    pub fn new() -> Self {
        let mut id = [0u8; 32];
        id[..8].copy_from_slice(b"pos_bft_");
        
        Self {
            metadata: MechanismMetadata {
                id,
                name: "Hybrid PoS + BFT".to_string(),
                version: MechanismVersion::new(1, 0, 0),
                description: "Proof-of-Stake with Byzantine Fault Tolerance for fast finality".to_string(),
                author: "Demiurge Protocol".to_string(),
                min_validators: 4,
                max_tps: 1000,
                finality_ms: 2000,
                instant_finality: true,
                features: vec!["pos".to_string(), "bft".to_string(), "slashing".to_string()],
            },
            state: MechanismState::Uninitialized,
            validators: Vec::new(),
            current_epoch: 0,
        }
    }
}

impl Default for PosBftMechanism {
    fn default() -> Self {
        Self::new()
    }
}

impl ConsensusMechanism for PosBftMechanism {
    fn metadata(&self) -> &MechanismMetadata {
        &self.metadata
    }
    
    fn initialize(&mut self, _config: MechanismConfig) -> Result<(), MechanismError> {
        self.state = MechanismState::Active;
        Ok(())
    }
    
    fn select_proposer(&self, block_number: u64) -> Result<[u8; 32], MechanismError> {
        if self.validators.is_empty() {
            return Err(MechanismError::ProposerSelectionFailed(
                "No validators".to_string()
            ));
        }
        
        // Weighted random selection based on stake
        let total_stake: u128 = self.validators.iter().map(|(_, s)| s).sum();
        let seed = block_number % total_stake as u64;
        
        let mut cumulative = 0u128;
        for (account, stake) in &self.validators {
            cumulative += stake;
            if seed < cumulative as u64 {
                return Ok(*account);
            }
        }
        
        Ok(self.validators[0].0)
    }
    
    fn validate_block(&self, block: &Block, proposer: [u8; 32]) -> ValidationResult {
        // Verify proposer is in validator set
        if !self.validators.iter().any(|(a, _)| *a == proposer) {
            return ValidationResult::Invalid("Unknown proposer".to_string());
        }
        
        // Basic validation
        if block.transactions.len() > 10000 {
            return ValidationResult::Invalid("Too many transactions".to_string());
        }
        
        ValidationResult::Valid
    }
    
    fn finalize_block(
        &mut self,
        _block: &Block,
        votes: Vec<Vote>,
    ) -> Result<FinalityResult, MechanismError> {
        let total = self.validators.len();
        let required = (total * 2) / 3 + 1;
        let received = votes.len();
        
        if received >= required {
            Ok(FinalityResult::Finalized)
        } else {
            Ok(FinalityResult::NotEnoughVotes {
                required: required as u32,
                received: received as u32,
            })
        }
    }
    
    fn on_epoch_boundary(&mut self, epoch: u64) -> Result<(), MechanismError> {
        self.current_epoch = epoch;
        tracing::info!("PoS+BFT: Epoch transition to {}", epoch);
        Ok(())
    }
    
    fn state(&self) -> MechanismState {
        self.state
    }
    
    fn prepare_shutdown(&mut self) -> Result<(), MechanismError> {
        self.state = MechanismState::ShuttingDown;
        Ok(())
    }
    
    fn export_state(&self) -> Result<Vec<u8>, MechanismError> {
        // Export validators and epoch
        let mut state = Vec::new();
        state.extend_from_slice(&self.current_epoch.to_le_bytes());
        state.extend_from_slice(&(self.validators.len() as u32).to_le_bytes());
        for (account, stake) in &self.validators {
            state.extend_from_slice(account);
            state.extend_from_slice(&stake.to_le_bytes());
        }
        Ok(state)
    }
    
    fn import_state(&mut self, state: Vec<u8>) -> Result<(), MechanismError> {
        if state.len() < 12 {
            return Err(MechanismError::StateMigrationFailed(
                "State too short".to_string()
            ));
        }
        
        let mut cursor = 0;
        
        // Read epoch
        let mut epoch_bytes = [0u8; 8];
        epoch_bytes.copy_from_slice(&state[cursor..cursor + 8]);
        self.current_epoch = u64::from_le_bytes(epoch_bytes);
        cursor += 8;
        
        // Read validator count
        let mut count_bytes = [0u8; 4];
        count_bytes.copy_from_slice(&state[cursor..cursor + 4]);
        let count = u32::from_le_bytes(count_bytes) as usize;
        cursor += 4;
        
        // Read validators
        self.validators.clear();
        for _ in 0..count {
            if cursor + 48 > state.len() {
                break;
            }
            let mut account = [0u8; 32];
            account.copy_from_slice(&state[cursor..cursor + 32]);
            cursor += 32;
            
            let mut stake_bytes = [0u8; 16];
            stake_bytes.copy_from_slice(&state[cursor..cursor + 16]);
            let stake = u128::from_le_bytes(stake_bytes);
            cursor += 16;
            
            self.validators.push((account, stake));
        }
        
        Ok(())
    }
}

/// Pure BFT mechanism for high-speed scenarios
pub struct PureBftMechanism {
    metadata: MechanismMetadata,
    state: MechanismState,
    validators: Vec<[u8; 32]>,
    leader_index: usize,
}

impl PureBftMechanism {
    pub fn new() -> Self {
        let mut id = [0u8; 32];
        id[..8].copy_from_slice(b"pure_bft");
        
        Self {
            metadata: MechanismMetadata {
                id,
                name: "Pure BFT".to_string(),
                version: MechanismVersion::new(1, 0, 0),
                description: "High-speed BFT for permissioned networks".to_string(),
                author: "Demiurge Protocol".to_string(),
                min_validators: 4,
                max_tps: 10000,
                finality_ms: 500,
                instant_finality: true,
                features: vec!["bft".to_string(), "leader-rotation".to_string()],
            },
            state: MechanismState::Uninitialized,
            validators: Vec::new(),
            leader_index: 0,
        }
    }
}

impl Default for PureBftMechanism {
    fn default() -> Self {
        Self::new()
    }
}

impl ConsensusMechanism for PureBftMechanism {
    fn metadata(&self) -> &MechanismMetadata {
        &self.metadata
    }
    
    fn initialize(&mut self, _config: MechanismConfig) -> Result<(), MechanismError> {
        self.state = MechanismState::Active;
        Ok(())
    }
    
    fn select_proposer(&self, _block_number: u64) -> Result<[u8; 32], MechanismError> {
        if self.validators.is_empty() {
            return Err(MechanismError::ProposerSelectionFailed(
                "No validators".to_string()
            ));
        }
        Ok(self.validators[self.leader_index % self.validators.len()])
    }
    
    fn validate_block(&self, block: &Block, proposer: [u8; 32]) -> ValidationResult {
        if !self.validators.contains(&proposer) {
            return ValidationResult::Invalid("Unknown proposer".to_string());
        }
        
        if block.transactions.len() > 50000 {
            return ValidationResult::Invalid("Too many transactions".to_string());
        }
        
        ValidationResult::Valid
    }
    
    fn finalize_block(
        &mut self,
        _block: &Block,
        votes: Vec<Vote>,
    ) -> Result<FinalityResult, MechanismError> {
        let total = self.validators.len();
        let required = (total * 2) / 3 + 1;
        let received = votes.len();
        
        if received >= required {
            // Rotate leader after successful finalization
            self.leader_index = (self.leader_index + 1) % total;
            Ok(FinalityResult::Finalized)
        } else {
            Ok(FinalityResult::NotEnoughVotes {
                required: required as u32,
                received: received as u32,
            })
        }
    }
    
    fn on_epoch_boundary(&mut self, epoch: u64) -> Result<(), MechanismError> {
        tracing::info!("Pure BFT: Epoch transition to {}", epoch);
        Ok(())
    }
    
    fn state(&self) -> MechanismState {
        self.state
    }
    
    fn prepare_shutdown(&mut self) -> Result<(), MechanismError> {
        self.state = MechanismState::ShuttingDown;
        Ok(())
    }
    
    fn export_state(&self) -> Result<Vec<u8>, MechanismError> {
        let mut state = Vec::new();
        state.extend_from_slice(&(self.leader_index as u32).to_le_bytes());
        state.extend_from_slice(&(self.validators.len() as u32).to_le_bytes());
        for v in &self.validators {
            state.extend_from_slice(v);
        }
        Ok(state)
    }
    
    fn import_state(&mut self, state: Vec<u8>) -> Result<(), MechanismError> {
        if state.len() < 8 {
            return Err(MechanismError::StateMigrationFailed("State too short".to_string()));
        }
        
        let mut cursor = 0;
        
        let mut leader_bytes = [0u8; 4];
        leader_bytes.copy_from_slice(&state[cursor..cursor + 4]);
        self.leader_index = u32::from_le_bytes(leader_bytes) as usize;
        cursor += 4;
        
        let mut count_bytes = [0u8; 4];
        count_bytes.copy_from_slice(&state[cursor..cursor + 4]);
        let count = u32::from_le_bytes(count_bytes) as usize;
        cursor += 4;
        
        self.validators.clear();
        for _ in 0..count {
            if cursor + 32 > state.len() {
                break;
            }
            let mut v = [0u8; 32];
            v.copy_from_slice(&state[cursor..cursor + 32]);
            self.validators.push(v);
            cursor += 32;
        }
        
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_mechanism_registration() {
        let initial = Box::new(PosBftMechanism::new());
        let mut orchestrator = ConsensusOrchestrator::new(initial, MechanismConfig::default());
        
        // Register Pure BFT
        let mut bft_id = [0u8; 32];
        bft_id[..8].copy_from_slice(b"pure_bft");
        orchestrator.register_mechanism(bft_id, || Box::new(PureBftMechanism::new()));
        
        assert!(orchestrator.list_mechanisms().contains(&bft_id));
    }
    
    #[test]
    fn test_mechanism_metadata() {
        let mechanism = PosBftMechanism::new();
        let meta = mechanism.metadata();
        
        assert_eq!(meta.name, "Hybrid PoS + BFT");
        assert!(meta.instant_finality);
        assert_eq!(meta.min_validators, 4);
    }
    
    #[test]
    fn test_state_export_import() {
        let mut mechanism = PosBftMechanism::new();
        mechanism.validators = vec![
            ([1u8; 32], 1000),
            ([2u8; 32], 2000),
        ];
        mechanism.current_epoch = 42;
        
        let state = mechanism.export_state().unwrap();
        
        let mut new_mechanism = PosBftMechanism::new();
        new_mechanism.import_state(state).unwrap();
        
        assert_eq!(new_mechanism.current_epoch, 42);
        assert_eq!(new_mechanism.validators.len(), 2);
        assert_eq!(new_mechanism.validators[0].1, 1000);
        assert_eq!(new_mechanism.validators[1].1, 2000);
    }
}
