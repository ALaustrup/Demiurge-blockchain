//! # Agentic Wallet
//!
//! Self-custodial key management for autonomous agents.
//! Implements spending limits, action whitelists, and autonomous signing.

use alloc::{string::ToString, vec::Vec, vec};
use codec::{Decode, Encode};
use scale_info::TypeInfo;
use serde::{Deserialize, Serialize};

use demiurge_primitives::signature::{AbstractKeypair, SignatureScheme};
use crate::agent_did::{AgentDid, AutonomyLevel, Capability};
use crate::error::AgenticError;

/// Action types that agents can perform
#[derive(Debug, Clone, Copy, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum ActionType {
    /// Transfer CGT tokens
    TransferCgt,
    /// Transfer DRC-369 assets
    TransferAsset,
    /// Modify asset state (XP, level)
    ModifyAsset,
    /// Store memory
    StoreMemory,
    /// Query data
    Query,
    /// Submit inference request
    RequestInference,
    /// Vote on governance proposal
    Vote,
    /// Create sub-agent
    SpawnAgent,
    /// Call external API
    ExternalCall,
}

impl ActionType {
    /// Get required capability for this action
    pub fn required_capability(&self) -> Capability {
        match self {
            ActionType::TransferCgt => Capability::Transfer,
            ActionType::TransferAsset => Capability::Transfer,
            ActionType::ModifyAsset => Capability::ModifyAssets,
            ActionType::StoreMemory => Capability::Read,
            ActionType::Query => Capability::Read,
            ActionType::RequestInference => Capability::Analyze,
            ActionType::Vote => Capability::Governance,
            ActionType::SpawnAgent => Capability::SpawnAgents,
            ActionType::ExternalCall => Capability::ExternalApi,
        }
    }
}

/// Spending limit configuration
#[derive(Debug, Clone, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct SpendingLimit {
    /// Maximum CGT per transaction
    pub per_transaction: u128,
    
    /// Maximum CGT per epoch (24 hours)
    pub per_epoch: u128,
    
    /// Maximum transactions per epoch
    pub max_transactions_per_epoch: u32,
    
    /// Current epoch spend
    pub current_epoch_spend: u128,
    
    /// Current epoch transaction count
    pub current_epoch_tx_count: u32,
    
    /// Epoch start timestamp
    pub epoch_start: u64,
}

impl SpendingLimit {
    /// Create new spending limit
    pub fn new(per_transaction: u128, per_epoch: u128, max_tx: u32) -> Self {
        Self {
            per_transaction,
            per_epoch,
            max_transactions_per_epoch: max_tx,
            current_epoch_spend: 0,
            current_epoch_tx_count: 0,
            epoch_start: current_timestamp(),
        }
    }
    
    /// Check if a spend is allowed
    pub fn can_spend(&self, amount: u128) -> bool {
        amount <= self.per_transaction &&
        self.current_epoch_spend + amount <= self.per_epoch &&
        self.current_epoch_tx_count < self.max_transactions_per_epoch
    }
    
    /// Record a spend
    pub fn record_spend(&mut self, amount: u128) {
        self.maybe_reset_epoch();
        self.current_epoch_spend += amount;
        self.current_epoch_tx_count += 1;
    }
    
    /// Reset if new epoch
    fn maybe_reset_epoch(&mut self) {
        let now = current_timestamp();
        let epoch_duration = 24 * 60 * 60; // 24 hours
        
        if now - self.epoch_start >= epoch_duration {
            self.current_epoch_spend = 0;
            self.current_epoch_tx_count = 0;
            self.epoch_start = now;
        }
    }
    
    /// Get remaining budget this epoch
    pub fn remaining_budget(&self) -> u128 {
        self.per_epoch.saturating_sub(self.current_epoch_spend)
    }
}

/// Wallet configuration
#[derive(Debug, Clone)]
pub struct WalletConfig {
    /// Use quantum-safe signatures
    pub quantum_safe: bool,
    
    /// Allowed action types
    pub allowed_actions: Vec<ActionType>,
    
    /// Spending limits
    pub spending_limit: SpendingLimit,
    
    /// Require controller approval for certain actions
    pub require_approval: Vec<ActionType>,
}

impl Default for WalletConfig {
    fn default() -> Self {
        Self {
            quantum_safe: true,
            allowed_actions: vec![ActionType::Query, ActionType::StoreMemory],
            spending_limit: SpendingLimit::new(0, 0, 0),
            require_approval: vec![
                ActionType::TransferCgt,
                ActionType::TransferAsset,
                ActionType::SpawnAgent,
            ],
        }
    }
}

/// Agentic Wallet - Self-custodial key management
pub struct AgenticWallet {
    /// Agent's DID
    pub did: AgentDid,
    
    /// Signing keypair (not serialized for security)
    keypair: AbstractKeypair,
    
    /// Controller's DID
    pub controller: Vec<u8>,
    
    /// Spending limits
    pub spending_limit: SpendingLimit,
    
    /// Allowed action types
    pub allowed_actions: Vec<ActionType>,
    
    /// Autonomy level
    pub autonomy: AutonomyLevel,
    
    /// Actions requiring controller approval
    pub require_approval: Vec<ActionType>,
    
    /// Pending approvals
    pending_approvals: Vec<PendingAction>,
    
    /// Transaction nonce
    nonce: u64,
    
    /// Is wallet locked
    locked: bool,
}

impl core::fmt::Debug for AgenticWallet {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        f.debug_struct("AgenticWallet")
            .field("did", &self.did)
            .field("controller", &self.controller)
            .field("spending_limit", &self.spending_limit)
            .field("allowed_actions", &self.allowed_actions)
            .field("autonomy", &self.autonomy)
            .field("nonce", &self.nonce)
            .field("locked", &self.locked)
            .finish_non_exhaustive()
    }
}

/// Action pending controller approval
#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct PendingAction {
    /// Action ID
    pub id: [u8; 32],
    
    /// Action type
    pub action_type: ActionType,
    
    /// Serialized action data
    pub data: Vec<u8>,
    
    /// Amount (if applicable)
    pub amount: u128,
    
    /// Created at
    pub created_at: u64,
    
    /// Expires at
    pub expires_at: u64,
}

/// Signed agent transaction
#[derive(Debug, Clone, Encode, Decode, TypeInfo)]
pub struct AgentTransaction {
    /// Agent DID
    pub agent_did: Vec<u8>,
    
    /// Action type
    pub action_type: ActionType,
    
    /// Transaction data
    pub data: Vec<u8>,
    
    /// Nonce
    pub nonce: u64,
    
    /// Timestamp
    pub timestamp: u64,
    
    /// Signature
    pub signature: Vec<u8>,
    
    /// Controller approval (if required)
    pub controller_approval: Option<Vec<u8>>,
}

impl AgenticWallet {
    /// Create a new agentic wallet
    pub fn new(
        did: AgentDid,
        controller: Vec<u8>,
        spending_limit: u128,
        allowed_actions: Vec<ActionType>,
        autonomy: AutonomyLevel,
    ) -> Self {
        // Generate quantum-safe keypair by default
        #[cfg(feature = "pqc")]
        let keypair = AbstractKeypair::generate_dilithium3();
        
        #[cfg(not(feature = "pqc"))]
        let keypair = AbstractKeypair::generate_ed25519();
        
        let spending = SpendingLimit::new(
            spending_limit / 10, // Per-tx is 10% of epoch limit
            spending_limit,
            1000, // Max 1000 tx per epoch
        );
        
        Self {
            did,
            keypair,
            controller,
            spending_limit: spending,
            allowed_actions,
            autonomy,
            require_approval: vec![ActionType::TransferAsset, ActionType::SpawnAgent],
            pending_approvals: Vec::new(),
            nonce: 0,
            locked: false,
        }
    }
    
    /// Get public key bytes
    pub fn public_key(&self) -> &[u8] {
        &self.keypair.public_key.key
    }
    
    /// Get signature scheme
    pub fn signature_scheme(&self) -> SignatureScheme {
        self.keypair.public_key.scheme
    }
    
    /// Check if action is allowed
    pub fn can_perform(&self, action: ActionType) -> bool {
        if self.locked {
            return false;
        }
        
        self.allowed_actions.contains(&action)
    }
    
    /// Check if action requires approval
    pub fn requires_approval(&self, action: ActionType) -> bool {
        // Supervised agents always need approval
        if self.autonomy == AutonomyLevel::Supervised {
            return true;
        }
        
        // Bounded agents need approval for certain actions
        if self.autonomy == AutonomyLevel::Bounded {
            return self.require_approval.contains(&action);
        }
        
        // Autonomous and Sovereign don't need approval
        false
    }
    
    /// Sign a transaction
    pub fn sign(&mut self, action: ActionType, data: &[u8], amount: u128) -> Result<AgentTransaction, AgenticError> {
        // Check if locked
        if self.locked {
            return Err(AgenticError::WalletLocked);
        }
        
        // Check if action is allowed
        if !self.can_perform(action) {
            return Err(AgenticError::ActionNotAllowed(action));
        }
        
        // Check spending limit
        if amount > 0 && !self.spending_limit.can_spend(amount) {
            return Err(AgenticError::SpendingLimitExceeded);
        }
        
        // Build transaction
        let timestamp = current_timestamp();
        let tx_data = TransactionData {
            agent_did: self.did.did_string.as_bytes().to_vec(),
            action_type: action,
            data: data.to_vec(),
            nonce: self.nonce,
            timestamp,
        };
        
        let encoded = tx_data.encode();
        
        // Sign
        let signature = self.keypair.sign(&encoded)
            .map_err(|e| AgenticError::SigningFailed(e.to_string()))?;
        
        // Increment nonce
        self.nonce += 1;
        
        // Record spend
        if amount > 0 {
            self.spending_limit.record_spend(amount);
        }
        
        Ok(AgentTransaction {
            agent_did: self.did.did_string.as_bytes().to_vec(),
            action_type: action,
            data: data.to_vec(),
            nonce: tx_data.nonce,
            timestamp,
            signature: signature.signature.clone(),
            controller_approval: None,
        })
    }
    
    /// Request approval for an action
    pub fn request_approval(&mut self, action: ActionType, data: &[u8], amount: u128) -> Result<[u8; 32], AgenticError> {
        let id: [u8; 32] = blake3::hash(&[
            &self.did.unique_id[..],
            &self.nonce.to_le_bytes()[..],
            data,
        ].concat()).into();
        
        let pending = PendingAction {
            id,
            action_type: action,
            data: data.to_vec(),
            amount,
            created_at: current_timestamp(),
            expires_at: current_timestamp() + 24 * 60 * 60, // 24 hour expiry
        };
        
        self.pending_approvals.push(pending);
        
        Ok(id)
    }
    
    /// Approve a pending action (called by controller)
    pub fn approve(&mut self, action_id: [u8; 32], controller_signature: &[u8]) -> Result<AgentTransaction, AgenticError> {
        // Find pending action
        let idx = self.pending_approvals.iter()
            .position(|a| a.id == action_id)
            .ok_or(AgenticError::ApprovalNotFound)?;
        
        let pending = self.pending_approvals.remove(idx);
        
        // Check not expired
        if current_timestamp() > pending.expires_at {
            return Err(AgenticError::ApprovalExpired);
        }
        
        // Sign with approval
        let timestamp = current_timestamp();
        let tx_data = TransactionData {
            agent_did: self.did.did_string.as_bytes().to_vec(),
            action_type: pending.action_type,
            data: pending.data.clone(),
            nonce: self.nonce,
            timestamp,
        };
        
        let encoded = tx_data.encode();
        let signature = self.keypair.sign(&encoded)
            .map_err(|e| AgenticError::SigningFailed(e.to_string()))?;
        
        self.nonce += 1;
        
        if pending.amount > 0 {
            self.spending_limit.record_spend(pending.amount);
        }
        
        Ok(AgentTransaction {
            agent_did: self.did.did_string.as_bytes().to_vec(),
            action_type: pending.action_type,
            data: pending.data,
            nonce: tx_data.nonce,
            timestamp,
            signature: signature.signature.clone(),
            controller_approval: Some(controller_signature.to_vec()),
        })
    }
    
    /// Lock wallet (emergency)
    pub fn lock(&mut self) {
        self.locked = true;
    }
    
    /// Unlock wallet (controller only)
    pub fn unlock(&mut self, _controller_signature: &[u8]) -> Result<(), AgenticError> {
        // In production, verify controller signature
        self.locked = false;
        Ok(())
    }
    
    /// Get remaining budget
    pub fn remaining_budget(&self) -> u128 {
        self.spending_limit.remaining_budget()
    }
    
    /// Get pending approvals
    pub fn pending_approvals(&self) -> &[PendingAction] {
        &self.pending_approvals
    }
}

/// Internal transaction data structure
#[derive(Debug, Clone, Encode, Decode)]
struct TransactionData {
    agent_did: Vec<u8>,
    action_type: ActionType,
    data: Vec<u8>,
    nonce: u64,
    timestamp: u64,
}

/// Create a new agentic wallet
pub fn create_agentic_wallet(
    did: AgentDid,
    controller: Vec<u8>,
    spending_limit: u128,
    capabilities: Vec<Capability>,
    autonomy: AutonomyLevel,
) -> Result<AgenticWallet, AgenticError> {
    // Map capabilities to allowed actions
    let allowed_actions: Vec<ActionType> = capabilities.iter().flat_map(|cap| {
        match cap {
            Capability::Read => vec![ActionType::Query],
            Capability::Analyze => vec![ActionType::RequestInference],
            Capability::Trade => vec![ActionType::TransferCgt],
            Capability::Transfer => vec![ActionType::TransferCgt, ActionType::TransferAsset],
            Capability::Create => vec![ActionType::StoreMemory],
            Capability::ModifyAssets => vec![ActionType::ModifyAsset],
            Capability::Governance => vec![ActionType::Vote],
            Capability::SpawnAgents => vec![ActionType::SpawnAgent],
            Capability::ExternalApi => vec![ActionType::ExternalCall],
        }
    }).collect();
    
    Ok(AgenticWallet::new(
        did,
        controller,
        spending_limit,
        allowed_actions,
        autonomy,
    ))
}

/// Sign an agent transaction
pub fn sign_agent_transaction(
    wallet: &mut AgenticWallet,
    action: ActionType,
    data: &[u8],
    amount: u128,
) -> Result<AgentTransaction, AgenticError> {
    if wallet.requires_approval(action) {
        return Err(AgenticError::ApprovalRequired);
    }
    
    wallet.sign(action, data, amount)
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
    
    fn create_test_wallet() -> AgenticWallet {
        let did = AgentDid::new("testnet", [1u8; 32]);
        AgenticWallet::new(
            did,
            b"controller".to_vec(),
            1000000, // 1M spending limit
            vec![ActionType::Query, ActionType::TransferCgt],
            AutonomyLevel::Bounded,
        )
    }
    
    #[test]
    fn test_wallet_creation() {
        let wallet = create_test_wallet();
        assert!(wallet.can_perform(ActionType::Query));
        assert!(wallet.can_perform(ActionType::TransferCgt));
        assert!(!wallet.can_perform(ActionType::SpawnAgent));
    }
    
    #[test]
    fn test_sign_transaction() {
        let mut wallet = create_test_wallet();
        
        let tx = wallet.sign(ActionType::Query, b"test data", 0).unwrap();
        
        assert_eq!(tx.nonce, 0);
        assert!(!tx.signature.is_empty());
    }
    
    #[test]
    fn test_spending_limit() {
        let mut limit = SpendingLimit::new(100, 1000, 10);
        
        assert!(limit.can_spend(50));
        limit.record_spend(50);
        
        assert!(limit.can_spend(50));
        limit.record_spend(50);
        
        assert_eq!(limit.remaining_budget(), 900);
        
        // Can't spend more than per-tx limit
        assert!(!limit.can_spend(200));
    }
    
    #[test]
    fn test_wallet_lock() {
        let mut wallet = create_test_wallet();
        
        assert!(wallet.sign(ActionType::Query, b"test", 0).is_ok());
        
        wallet.lock();
        
        assert!(wallet.sign(ActionType::Query, b"test", 0).is_err());
    }
    
    #[test]
    fn test_action_not_allowed() {
        let mut wallet = create_test_wallet();
        
        let result = wallet.sign(ActionType::SpawnAgent, b"test", 0);
        assert!(matches!(result, Err(AgenticError::ActionNotAllowed(_))));
    }
}
