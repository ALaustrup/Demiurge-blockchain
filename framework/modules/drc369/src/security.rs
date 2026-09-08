//! DRC-369 Security Module
//!
//! Advanced security features for enterprise-grade NFT protection.
//! Includes emergency freeze, multi-sig, rate limiting, and theft protection.

use codec::{Decode, Encode};
use scale_info::TypeInfo;
use serde::{Deserialize, Serialize};
use demiurge_storage::Storage;

use crate::error::{Drc369Error, Result};

// ============================================================================
// STORAGE KEYS
// ============================================================================

pub mod storage_keys {
    pub const FREEZE_STATUS: &[u8] = b"DRC369:Security:Freeze:";
    pub const FREEZE_HISTORY: &[u8] = b"DRC369:Security:FreezeHist:";
    pub const MULTISIG_CONFIG: &[u8] = b"DRC369:Security:MultiSig:";
    pub const TRANSFER_LIMIT: &[u8] = b"DRC369:Security:TransferLimit:";
    pub const TRANSFER_COUNT: &[u8] = b"DRC369:Security:TransferCount:";
    pub const COOLDOWN: &[u8] = b"DRC369:Security:Cooldown:";
    pub const ALLOWLIST: &[u8] = b"DRC369:Security:Allowlist:";
    pub const STOLEN_REGISTRY: &[u8] = b"DRC369:Security:Stolen:";
    pub const RECOVERY_CONFIG: &[u8] = b"DRC369:Security:Recovery:";
}

// ============================================================================
// EMERGENCY FREEZE
// ============================================================================

/// Emergency freeze status for an NFT
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct FreezeStatus {
    /// Is the NFT currently frozen
    pub frozen: bool,
    /// Who froze it
    pub frozen_by: [u8; 32],
    /// When it was frozen
    pub frozen_at: u64,
    /// Freeze expires at (0 = permanent until unfrozen)
    pub expires_at: u64,
    /// Reason for freeze
    pub reason: FreezeReason,
    /// Additional details
    pub details: String,
}

/// Reasons for freezing an NFT
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize, PartialEq)]
#[derive(Default)]
pub enum FreezeReason {
    /// Suspected theft/hack
    SuspectedTheft,
    /// Legal/compliance requirement
    LegalHold,
    /// Suspicious activity detected
    SuspiciousActivity,
    /// Owner-requested freeze
    #[default]
    OwnerRequest,
    /// Marketplace dispute
    Dispute,
    /// Smart contract vulnerability
    SecurityVulnerability,
    /// Custom reason
    Custom(String),
}


/// Freeze event in history
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct FreezeEvent {
    pub action: FreezeAction,
    pub timestamp: u64,
    pub actor: [u8; 32],
    pub reason: FreezeReason,
}

#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize, PartialEq)]
pub enum FreezeAction {
    Frozen,
    Unfrozen,
    Extended,
}

// ============================================================================
// MULTI-SIGNATURE
// ============================================================================

/// Multi-signature configuration for high-value NFTs
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct MultiSigConfig {
    /// NFT ID
    pub nft_id: [u8; 32],
    /// Required signatures for transfer
    pub required_sigs: u8,
    /// List of authorized signers
    pub signers: Vec<[u8; 32]>,
    /// Is multi-sig enabled
    pub enabled: bool,
    /// Pending transfers awaiting signatures
    pub pending_transfers: Vec<PendingTransfer>,
}

impl Default for MultiSigConfig {
    fn default() -> Self {
        Self {
            nft_id: [0; 32],
            required_sigs: 2,
            signers: vec![],
            enabled: false,
            pending_transfers: vec![],
        }
    }
}

/// A pending transfer awaiting multi-sig approval
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct PendingTransfer {
    /// Transfer ID (hash of transfer params)
    pub id: [u8; 32],
    /// Destination address
    pub to: [u8; 32],
    /// Signatures collected
    pub signatures: Vec<[u8; 32]>,
    /// When created
    pub created_at: u64,
    /// Expires at
    pub expires_at: u64,
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/// Transfer rate limit configuration
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct TransferLimit {
    /// Maximum transfers per period
    pub max_transfers: u32,
    /// Period duration in seconds
    pub period_seconds: u64,
    /// Current period start
    pub period_start: u64,
    /// Transfers in current period
    pub current_count: u32,
    /// Is rate limiting enabled
    pub enabled: bool,
}

impl Default for TransferLimit {
    fn default() -> Self {
        Self {
            max_transfers: 10,
            period_seconds: 86400, // 24 hours
            period_start: 0,
            current_count: 0,
            enabled: false,
        }
    }
}

// ============================================================================
// COOLDOWN SYSTEM
// ============================================================================

/// Cooldown after specific actions
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct Cooldown {
    /// Action type
    pub action_type: CooldownAction,
    /// Last action timestamp
    pub last_action: u64,
    /// Cooldown duration in seconds
    pub cooldown_seconds: u64,
}

#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize, PartialEq)]
pub enum CooldownAction {
    Transfer,
    StateUpdate,
    Breeding,
    Battle,
    Crafting,
    Custom(String),
}

// ============================================================================
// ALLOWLIST
// ============================================================================

/// Transfer allowlist configuration
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
#[derive(Default)]
pub struct AllowlistConfig {
    /// Is allowlist enabled (whitelist mode)
    pub enabled: bool,
    /// Allowed addresses for transfer
    pub allowed_addresses: Vec<[u8; 32]>,
    /// Blocked addresses (blacklist)
    pub blocked_addresses: Vec<[u8; 32]>,
    /// Allow transfers to verified contracts only
    pub verified_contracts_only: bool,
}


// ============================================================================
// SOCIAL RECOVERY
// ============================================================================

/// Social recovery configuration for lost keys
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct RecoveryConfig {
    /// NFT ID
    pub nft_id: [u8; 32],
    /// Guardian addresses
    pub guardians: Vec<[u8; 32]>,
    /// Required guardian approvals
    pub required_approvals: u8,
    /// Recovery delay (seconds) after approval
    pub recovery_delay: u64,
    /// Is recovery enabled
    pub enabled: bool,
    /// Pending recovery (if any)
    pub pending_recovery: Option<PendingRecovery>,
}

impl Default for RecoveryConfig {
    fn default() -> Self {
        Self {
            nft_id: [0; 32],
            guardians: vec![],
            required_approvals: 2,
            recovery_delay: 172800, // 48 hours
            enabled: false,
            pending_recovery: None,
        }
    }
}

/// Pending recovery request
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct PendingRecovery {
    /// New owner address
    pub new_owner: [u8; 32],
    /// Guardian approvals received
    pub approvals: Vec<[u8; 32]>,
    /// When initiated
    pub initiated_at: u64,
    /// When it can be executed
    pub executable_at: u64,
}

// ============================================================================
// SECURITY MANAGER
// ============================================================================

/// Manages all security operations
pub struct SecurityManager;

impl SecurityManager {
    // ========== Storage Keys ==========
    
    fn freeze_key(nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::FREEZE_STATUS.to_vec();
        key.extend_from_slice(nft_id);
        key
    }
    
    fn multisig_key(nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::MULTISIG_CONFIG.to_vec();
        key.extend_from_slice(nft_id);
        key
    }
    
    fn limit_key(nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::TRANSFER_LIMIT.to_vec();
        key.extend_from_slice(nft_id);
        key
    }
    
    fn cooldown_key(nft_id: &[u8; 32], action: &CooldownAction) -> Vec<u8> {
        let mut key = storage_keys::COOLDOWN.to_vec();
        key.extend_from_slice(nft_id);
        key.extend_from_slice(&action.encode());
        key
    }
    
    fn allowlist_key(nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::ALLOWLIST.to_vec();
        key.extend_from_slice(nft_id);
        key
    }
    
    // Recovery-config storage is not wired into any operation yet.
    #[allow(dead_code)]
    fn recovery_key(nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::RECOVERY_CONFIG.to_vec();
        key.extend_from_slice(nft_id);
        key
    }
    
    fn stolen_key(nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::STOLEN_REGISTRY.to_vec();
        key.extend_from_slice(nft_id);
        key
    }
    
    // ========== Emergency Freeze ==========
    
    /// Freeze an NFT (owner or creator can freeze)
    pub fn freeze_nft(
        storage: &dyn Storage,
        caller: [u8; 32],
        nft_id: [u8; 32],
        reason: FreezeReason,
        details: String,
        duration_seconds: u64, // 0 = until manually unfrozen
        current_time: u64,
    ) -> Result<FreezeStatus> {
        let expires_at = if duration_seconds == 0 {
            0
        } else {
            current_time + duration_seconds
        };
        
        let status = FreezeStatus {
            frozen: true,
            frozen_by: caller,
            frozen_at: current_time,
            expires_at,
            reason,
            details,
        };
        
        let key = Self::freeze_key(&nft_id);
        storage.put(&key, &status.encode());
        
        Ok(status)
    }
    
    /// Unfreeze an NFT
    pub fn unfreeze_nft(
        storage: &dyn Storage,
        caller: [u8; 32],
        nft_id: [u8; 32],
    ) -> Result<()> {
        let mut status = Self::get_freeze_status(storage, &nft_id)
            .ok_or(Drc369Error::StateUpdateFailed("Not frozen".to_string()))?;
        
        // Only the one who froze or owner can unfreeze
        if status.frozen_by != caller {
            return Err(Drc369Error::NotOwner);
        }
        
        status.frozen = false;
        
        let key = Self::freeze_key(&nft_id);
        storage.put(&key, &status.encode());
        
        Ok(())
    }
    
    /// Get freeze status
    pub fn get_freeze_status(storage: &dyn Storage, nft_id: &[u8; 32]) -> Option<FreezeStatus> {
        let key = Self::freeze_key(nft_id);
        storage.get(&key).and_then(|bytes| FreezeStatus::decode(&mut &bytes[..]).ok())
    }
    
    /// Check if NFT is frozen
    pub fn is_frozen(storage: &dyn Storage, nft_id: &[u8; 32], current_time: u64) -> bool {
        if let Some(status) = Self::get_freeze_status(storage, nft_id) {
            if !status.frozen {
                return false;
            }
            // Check if freeze has expired
            if status.expires_at > 0 && current_time > status.expires_at {
                return false;
            }
            return true;
        }
        false
    }
    
    // ========== Multi-Signature ==========
    
    /// Configure multi-sig for an NFT
    pub fn configure_multisig(
        storage: &dyn Storage,
        _owner: [u8; 32],
        nft_id: [u8; 32],
        signers: Vec<[u8; 32]>,
        required_sigs: u8,
    ) -> Result<MultiSigConfig> {
        if required_sigs as usize > signers.len() || required_sigs == 0 {
            return Err(Drc369Error::StateUpdateFailed("Invalid signer configuration".to_string()));
        }
        
        let config = MultiSigConfig {
            nft_id,
            required_sigs,
            signers,
            enabled: true,
            pending_transfers: vec![],
        };
        
        let key = Self::multisig_key(&nft_id);
        storage.put(&key, &config.encode());
        
        Ok(config)
    }
    
    /// Get multi-sig configuration
    pub fn get_multisig(storage: &dyn Storage, nft_id: &[u8; 32]) -> Option<MultiSigConfig> {
        let key = Self::multisig_key(nft_id);
        storage.get(&key).and_then(|bytes| MultiSigConfig::decode(&mut &bytes[..]).ok())
    }
    
    /// Check if multi-sig is required for transfer
    pub fn requires_multisig(storage: &dyn Storage, nft_id: &[u8; 32]) -> bool {
        Self::get_multisig(storage, nft_id)
            .map(|c| c.enabled && c.required_sigs > 1)
            .unwrap_or(false)
    }
    
    // ========== Rate Limiting ==========
    
    /// Configure transfer rate limit
    pub fn configure_rate_limit(
        storage: &dyn Storage,
        nft_id: [u8; 32],
        max_transfers: u32,
        period_seconds: u64,
    ) -> Result<TransferLimit> {
        let limit = TransferLimit {
            max_transfers,
            period_seconds,
            period_start: 0,
            current_count: 0,
            enabled: true,
        };
        
        let key = Self::limit_key(&nft_id);
        storage.put(&key, &limit.encode());
        
        Ok(limit)
    }
    
    /// Check and update rate limit
    pub fn check_rate_limit(
        storage: &dyn Storage,
        nft_id: &[u8; 32],
        current_time: u64,
    ) -> Result<bool> {
        let key = Self::limit_key(nft_id);
        let mut limit = match storage.get(&key).and_then(|b| TransferLimit::decode(&mut &b[..]).ok()) {
            Some(l) if l.enabled => l,
            _ => return Ok(true), // No limit configured
        };
        
        // Check if we're in a new period
        if current_time >= limit.period_start + limit.period_seconds {
            limit.period_start = current_time;
            limit.current_count = 0;
        }
        
        // Check limit
        if limit.current_count >= limit.max_transfers {
            return Ok(false);
        }
        
        // Increment and save
        limit.current_count += 1;
        storage.put(&key, &limit.encode());
        
        Ok(true)
    }
    
    // ========== Cooldown ==========
    
    /// Set cooldown for an action
    pub fn set_cooldown(
        storage: &dyn Storage,
        nft_id: [u8; 32],
        action: CooldownAction,
        cooldown_seconds: u64,
        current_time: u64,
    ) -> Cooldown {
        let cooldown = Cooldown {
            action_type: action.clone(),
            last_action: current_time,
            cooldown_seconds,
        };
        
        let key = Self::cooldown_key(&nft_id, &action);
        storage.put(&key, &cooldown.encode());
        
        cooldown
    }
    
    /// Check if action is on cooldown
    pub fn is_on_cooldown(
        storage: &dyn Storage,
        nft_id: &[u8; 32],
        action: &CooldownAction,
        current_time: u64,
    ) -> bool {
        let key = Self::cooldown_key(nft_id, action);
        if let Some(cooldown) = storage.get(&key).and_then(|b| Cooldown::decode(&mut &b[..]).ok()) {
            return current_time < cooldown.last_action + cooldown.cooldown_seconds;
        }
        false
    }
    
    /// Get remaining cooldown time
    pub fn remaining_cooldown(
        storage: &dyn Storage,
        nft_id: &[u8; 32],
        action: &CooldownAction,
        current_time: u64,
    ) -> u64 {
        let key = Self::cooldown_key(nft_id, action);
        if let Some(cooldown) = storage.get(&key).and_then(|b| Cooldown::decode(&mut &b[..]).ok()) {
            let end_time = cooldown.last_action + cooldown.cooldown_seconds;
            if current_time < end_time {
                return end_time - current_time;
            }
        }
        0
    }
    
    // ========== Allowlist ==========
    
    /// Configure allowlist
    pub fn configure_allowlist(
        storage: &dyn Storage,
        nft_id: [u8; 32],
        config: AllowlistConfig,
    ) -> Result<()> {
        let key = Self::allowlist_key(&nft_id);
        storage.put(&key, &config.encode());
        Ok(())
    }
    
    /// Check if address is allowed
    pub fn is_transfer_allowed(
        storage: &dyn Storage,
        nft_id: &[u8; 32],
        to: &[u8; 32],
    ) -> bool {
        let key = Self::allowlist_key(nft_id);
        let config = match storage.get(&key).and_then(|b| AllowlistConfig::decode(&mut &b[..]).ok()) {
            Some(c) => c,
            None => return true, // No config = all allowed
        };
        
        // Check blacklist first
        if config.blocked_addresses.contains(to) {
            return false;
        }
        
        // If whitelist mode enabled, check whitelist
        if config.enabled && !config.allowed_addresses.contains(to) {
            return false;
        }
        
        true
    }
    
    // ========== Stolen Asset Registry ==========
    
    /// Mark an NFT as stolen
    pub fn mark_stolen(
        storage: &dyn Storage,
        nft_id: [u8; 32],
        reported_by: [u8; 32],
        current_time: u64,
    ) -> Result<()> {
        let key = Self::stolen_key(&nft_id);
        let report = StolenReport {
            nft_id,
            reported_by,
            reported_at: current_time,
            verified: false,
        };
        storage.put(&key, &report.encode());
        Ok(())
    }
    
    /// Check if NFT is reported stolen
    pub fn is_reported_stolen(storage: &dyn Storage, nft_id: &[u8; 32]) -> bool {
        let key = Self::stolen_key(nft_id);
        storage.get(&key).is_some()
    }
    
    // ========== Comprehensive Security Check ==========
    
    /// Run all security checks before a transfer
    pub fn pre_transfer_check(
        storage: &dyn Storage,
        nft_id: &[u8; 32],
        to: &[u8; 32],
        current_time: u64,
    ) -> Result<()> {
        // Check freeze
        if Self::is_frozen(storage, nft_id, current_time) {
            return Err(Drc369Error::TransferFailed("NFT is frozen".to_string()));
        }
        
        // Check stolen
        if Self::is_reported_stolen(storage, nft_id) {
            return Err(Drc369Error::TransferFailed("NFT is reported stolen".to_string()));
        }
        
        // Check allowlist
        if !Self::is_transfer_allowed(storage, nft_id, to) {
            return Err(Drc369Error::TransferFailed("Recipient not allowed".to_string()));
        }
        
        // Check rate limit
        if !Self::check_rate_limit(storage, nft_id, current_time)? {
            return Err(Drc369Error::TransferFailed("Rate limit exceeded".to_string()));
        }
        
        // Check cooldown
        if Self::is_on_cooldown(storage, nft_id, &CooldownAction::Transfer, current_time) {
            return Err(Drc369Error::TransferFailed("Transfer on cooldown".to_string()));
        }
        
        Ok(())
    }
}

/// Stolen asset report
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct StolenReport {
    pub nft_id: [u8; 32],
    pub reported_by: [u8; 32],
    pub reported_at: u64,
    pub verified: bool,
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_freeze_reason_default() {
        let reason = FreezeReason::default();
        assert_eq!(reason, FreezeReason::OwnerRequest);
    }
    
    #[test]
    fn test_multisig_config() {
        let config = MultiSigConfig {
            nft_id: [1; 32],
            required_sigs: 2,
            signers: vec![[2; 32], [3; 32], [4; 32]],
            enabled: true,
            pending_transfers: vec![],
        };
        
        assert_eq!(config.required_sigs, 2);
        assert_eq!(config.signers.len(), 3);
    }
    
    #[test]
    fn test_transfer_limit_default() {
        let limit = TransferLimit::default();
        assert_eq!(limit.max_transfers, 10);
        assert_eq!(limit.period_seconds, 86400);
        assert!(!limit.enabled);
    }
}
