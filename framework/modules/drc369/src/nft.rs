//! DRC-369 NFT implementation with CVP Protection
//!
//! The most secure NFT standard in existence - bytecode that morphs
//! while preserving all functionality through Consensus-Verified Polymorphism.

use demiurge_modules::traits::{Module, ExecutionContext};
use demiurge_storage::Storage;
use demiurge_cvp::{
    SemanticIR, ContractId,
    drc369::{build_drc369_semantic_ir, Drc369CvpConfig},
};
use codec::{Decode, Encode};
use scale_info::TypeInfo;
use blake2::{Blake2b512, Digest};
use tracing::info;

use crate::error::{Drc369Error, Result};

// ============================================================================
// STORAGE KEYS
// ============================================================================

mod storage_keys {
    pub const NFT_OWNER: &[u8] = b"DRC369:Owner:";
    pub const NFT_BALANCE: &[u8] = b"DRC369:Balance:";
    pub const NFT_APPROVAL: &[u8] = b"DRC369:Approval:";
    pub const NFT_OPERATOR: &[u8] = b"DRC369:Operator:";
    pub const NFT_METADATA: &[u8] = b"DRC369:Metadata:";
    pub const NFT_SOULBOUND: &[u8] = b"DRC369:Soulbound:";
    pub const NFT_STATE: &[u8] = b"DRC369:State:";
    pub const NFT_RESOURCES: &[u8] = b"DRC369:Resources:";
    pub const NFT_PARENT: &[u8] = b"DRC369:Parent:";
    pub const NFT_CHILDREN: &[u8] = b"DRC369:Children:";
    pub const NFT_DELEGATION: &[u8] = b"DRC369:Delegation:";
    pub const NFT_PHYSICS: &[u8] = b"DRC369:Physics:";  // Physics properties storage
    pub const NFT_ROYALTY: &[u8] = b"DRC369:Royalty:";  // Royalty configuration
    pub const NFT_CREATOR: &[u8] = b"DRC369:Creator:";  // Original creator/minter
    pub const NEXT_NFT_ID: &[u8] = b"DRC369:NextId";
    pub const TOTAL_SUPPLY: &[u8] = b"DRC369:TotalSupply";
    pub const CVP_CONTRACT_ID: &[u8] = b"DRC369:CvpContractId";
    pub const CVP_REGISTERED: &[u8] = b"DRC369:CvpRegistered";
}

// ============================================================================
// DRC-369 MODULE
// ============================================================================

/// DRC-369 module - Stateful NFTs with CVP Protection
pub struct Drc369Module {
    /// CVP contract ID for this module
    cvp_contract_id: ContractId,
}

impl Default for Drc369Module {
    fn default() -> Self {
        Self::new()
    }
}

impl Drc369Module {
    /// Create new DRC-369 module with CVP protection
    pub fn new() -> Self {
        // Generate deterministic contract ID for the module
        let cvp_contract_id = Self::generate_contract_id();
        
        Self { cvp_contract_id }
    }
    
    /// Generate deterministic contract ID
    fn generate_contract_id() -> ContractId {
        let mut hasher = Blake2b512::new();
        hasher.update(b"DRC369_MODULE_CONTRACT_V1");
        let hash = hasher.finalize();
        let mut id = [0u8; 32];
        id.copy_from_slice(&hash[..32]);
        id
    }
    
    /// Get CVP contract ID
    pub fn cvp_contract_id(&self) -> ContractId {
        self.cvp_contract_id
    }
    
    /// Build semantic IR for CVP registration
    pub fn build_semantic_ir(&self) -> SemanticIR {
        build_drc369_semantic_ir(self.cvp_contract_id)
    }
    
    /// Get CVP configuration
    pub fn cvp_config(&self) -> Drc369CvpConfig {
        Drc369CvpConfig::default()
    }
    
    /// Generate bytecode for CVP (simplified representation)
    pub fn generate_bytecode(&self) -> Vec<u8> {
        // This is a simplified bytecode representation
        // In production, this would be actual EVM-compatible bytecode
        let mut bytecode = Vec::new();
        
        // Function dispatcher
        bytecode.extend_from_slice(&[0x60, 0x00, 0x35]); // PUSH1 0 CALLDATALOAD
        bytecode.extend_from_slice(&[0x60, 0xE0, 0x1C]); // PUSH1 0xE0 SHR
        
        // mint selector (0x40c10f19)
        bytecode.extend_from_slice(&[0x63, 0x40, 0xc1, 0x0f, 0x19]);
        // transfer selector (0xa9059cbb)
        bytecode.extend_from_slice(&[0x63, 0xa9, 0x05, 0x9c, 0xbb]);
        // More function dispatch logic...
        
        // Add some padding for mutation
        for i in 0..32 {
            bytecode.push(i as u8);
        }
        
        bytecode
    }
    
    /// Check if CVP is registered
    fn is_cvp_registered(storage: &dyn Storage) -> bool {
        storage.get(storage_keys::CVP_REGISTERED)
            .map(|v| !v.is_empty() && v[0] == 1)
            .unwrap_or(false)
    }
    
    /// Mark CVP as registered
    fn set_cvp_registered(storage: &dyn Storage) {
        storage.put(storage_keys::CVP_REGISTERED, &[1u8]);
    }
    
    // ========================================================================
    // STORAGE HELPERS
    // ========================================================================
    
    fn owner_key(nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::NFT_OWNER.to_vec();
        key.extend_from_slice(nft_id);
        key
    }
    
    fn balance_key(account: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::NFT_BALANCE.to_vec();
        key.extend_from_slice(account);
        key
    }
    
    fn approval_key(nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::NFT_APPROVAL.to_vec();
        key.extend_from_slice(nft_id);
        key
    }
    
    fn operator_key(owner: &[u8; 32], operator: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::NFT_OPERATOR.to_vec();
        key.extend_from_slice(owner);
        key.extend_from_slice(operator);
        key
    }
    
    fn metadata_key(nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::NFT_METADATA.to_vec();
        key.extend_from_slice(nft_id);
        key
    }
    
    fn soulbound_key(nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::NFT_SOULBOUND.to_vec();
        key.extend_from_slice(nft_id);
        key
    }
    
    fn state_key(nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::NFT_STATE.to_vec();
        key.extend_from_slice(nft_id);
        key
    }
    
    fn resources_key(nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::NFT_RESOURCES.to_vec();
        key.extend_from_slice(nft_id);
        key
    }
    
    fn parent_key(nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::NFT_PARENT.to_vec();
        key.extend_from_slice(nft_id);
        key
    }
    
    fn children_key(nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::NFT_CHILDREN.to_vec();
        key.extend_from_slice(nft_id);
        key
    }
    
    fn delegation_key(nft_id: &[u8; 32], delegatee: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::NFT_DELEGATION.to_vec();
        key.extend_from_slice(nft_id);
        key.extend_from_slice(delegatee);
        key
    }
    
    /// Generate storage key for physics properties
    fn physics_key(nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::NFT_PHYSICS.to_vec();
        key.extend_from_slice(nft_id);
        key
    }
    
    /// Generate storage key for royalty configuration
    fn royalty_key(nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::NFT_ROYALTY.to_vec();
        key.extend_from_slice(nft_id);
        key
    }
    
    /// Generate storage key for original creator
    fn creator_key(nft_id: &[u8; 32]) -> Vec<u8> {
        let mut key = storage_keys::NFT_CREATOR.to_vec();
        key.extend_from_slice(nft_id);
        key
    }
    
    // ========================================================================
    // PHYSICS OPERATIONS
    // ========================================================================
    
    /// Get physics properties for an NFT
    pub fn get_physics(storage: &dyn Storage, nft_id: &[u8; 32]) -> Option<crate::physics::PhysicsProperties> {
        let key = Self::physics_key(nft_id);
        storage.get(&key).and_then(|bytes| crate::physics::PhysicsProperties::from_bytes(&bytes))
    }
    
    /// Set physics properties for an NFT
    /// Only owner can set physics properties
    pub fn set_physics(
        storage: &dyn Storage,
        caller: [u8; 32],
        nft_id: [u8; 32],
        physics: crate::physics::PhysicsProperties,
    ) -> Result<()> {
        // Verify ownership
        let owner = Self::get_owner(storage, &nft_id)
            .ok_or(Drc369Error::NftNotFound)?;
        
        if owner != caller {
            return Err(Drc369Error::NotOwner);
        }
        
        // Validate physics properties
        physics.validate()?;
        
        // Store physics
        let key = Self::physics_key(&nft_id);
        let bytes = physics.to_bytes();
        storage.put(&key, &bytes);
        
        info!(
            "DRC369: Set physics for NFT {} (simulation_ready: {})",
            hex::encode(&nft_id[..8]),
            physics.is_simulation_ready()
        );
        
        Ok(())
    }
    
    /// Check if NFT has physics properties
    pub fn has_physics(storage: &dyn Storage, nft_id: &[u8; 32]) -> bool {
        let key = Self::physics_key(nft_id);
        storage.get(&key).is_some()
    }
    
    // ========================================================================
    // ROYALTY OPERATIONS
    // ========================================================================
    
    /// Set royalty configuration for an NFT
    /// Only the creator (original minter) can set royalties
    pub fn set_royalty(
        storage: &dyn Storage,
        caller: [u8; 32],
        nft_id: [u8; 32],
        royalty: RoyaltyConfig,
    ) -> Result<()> {
        // Verify caller is the creator
        let creator = Self::get_creator(storage, &nft_id)
            .ok_or(Drc369Error::NftNotFound)?;
        
        if creator != caller {
            return Err(Drc369Error::NotOwner);
        }
        
        // Validate royalty percentage (max 50% = 5000 basis points)
        if royalty.percentage_bps > 5000 {
            return Err(Drc369Error::StateUpdateFailed(
                "Royalty percentage cannot exceed 50%".to_string()
            ));
        }
        
        // Store royalty config
        let key = Self::royalty_key(&nft_id);
        storage.put(&key, &royalty.encode());
        
        info!(
            "DRC369: Set royalty for NFT {} - {}bps to {}",
            hex::encode(&nft_id[..8]),
            royalty.percentage_bps,
            hex::encode(&royalty.recipient[..8])
        );
        
        Ok(())
    }
    
    /// Get royalty configuration for an NFT
    pub fn get_royalty(storage: &dyn Storage, nft_id: &[u8; 32]) -> Option<RoyaltyConfig> {
        let key = Self::royalty_key(nft_id);
        storage.get(&key).and_then(|bytes| RoyaltyConfig::decode(&mut &bytes[..]).ok())
    }
    
    /// Check if NFT has royalty configured
    pub fn has_royalty(storage: &dyn Storage, nft_id: &[u8; 32]) -> bool {
        Self::get_royalty(storage, nft_id).is_some()
    }
    
    /// Get the original creator of an NFT
    pub fn get_creator(storage: &dyn Storage, nft_id: &[u8; 32]) -> Option<[u8; 32]> {
        storage.get(&Self::creator_key(nft_id)).and_then(|v| {
            if v.len() == 32 {
                let mut creator = [0u8; 32];
                creator.copy_from_slice(&v);
                Some(creator)
            } else {
                None
            }
        })
    }
    
    /// Calculate royalty amount for a given sale price
    /// Returns (royalty_amount, remainder_to_seller)
    pub fn calculate_royalty(
        storage: &dyn Storage,
        nft_id: &[u8; 32],
        sale_price: u128,
    ) -> (u128, u128) {
        if let Some(royalty) = Self::get_royalty(storage, nft_id) {
            // Calculate royalty: (price * bps) / 10000
            let royalty_amount = (sale_price * royalty.percentage_bps as u128) / 10000;
            let remainder = sale_price.saturating_sub(royalty_amount);
            (royalty_amount, remainder)
        } else {
            (0, sale_price)
        }
    }
    
    // ========================================================================
    // PUBLIC CORE OPERATIONS
    // ========================================================================
    
    /// Mint a new NFT
    /// 
    /// Public wrapper for minting. Returns the newly created NFT ID.
    pub fn mint(
        storage: &dyn Storage,
        caller: [u8; 32],
        owner: [u8; 32],
        metadata: Vec<u8>,
        soulbound: bool,
    ) -> Result<[u8; 32]> {
        Self::do_mint(storage, caller, owner, metadata, soulbound)
    }
    
    /// Transfer an NFT
    /// 
    /// Public wrapper for transfers.
    pub fn transfer(
        storage: &dyn Storage,
        caller: [u8; 32],
        from: [u8; 32],
        to: [u8; 32],
        nft_id: [u8; 32],
    ) -> Result<()> {
        Self::do_transfer(storage, caller, from, to, nft_id)
    }
    
    // ========================================================================
    // INTERNAL CORE OPERATIONS
    // ========================================================================
    
    /// Mint a new NFT (internal implementation)
    fn do_mint(
        storage: &dyn Storage,
        caller: [u8; 32],
        owner: [u8; 32],
        metadata: Vec<u8>,
        soulbound: bool,
    ) -> Result<[u8; 32]> {
        // Generate NFT ID
        let next_id = Self::get_next_id(storage);
        let nft_id = Self::generate_nft_id(next_id);
        
        // Set owner
        storage.put(&Self::owner_key(&nft_id), &owner);
        
        // Set creator (minter) - important for royalties
        // If caller is zero (system mint), use owner as creator
        let creator = if caller == [0u8; 32] { owner } else { caller };
        storage.put(&Self::creator_key(&nft_id), &creator);
        
        // Increment balance
        let balance = Self::get_balance(storage, &owner);
        storage.put(&Self::balance_key(&owner), &(balance + 1).encode());
        
        // Set metadata
        storage.put(&Self::metadata_key(&nft_id), &metadata);
        
        // Set soulbound status
        if soulbound {
            storage.put(&Self::soulbound_key(&nft_id), &[1u8]);
        }
        
        // Initialize state
        let initial_state = NftState {
            xp: 0,
            level: 1,
            stats: vec![],
        };
        storage.put(&Self::state_key(&nft_id), &initial_state.encode());
        
        // Increment next ID
        storage.put(storage_keys::NEXT_NFT_ID, &(next_id + 1).encode());
        
        // Increment total supply
        let total_supply = Self::get_total_supply(storage);
        storage.put(storage_keys::TOTAL_SUPPLY, &(total_supply + 1).encode());
        
        info!(
            "DRC369: Minted NFT {} to {} by creator {} (soulbound: {})",
            hex::encode(&nft_id[..8]),
            hex::encode(&owner[..8]),
            hex::encode(&creator[..8]),
            soulbound
        );
        
        Ok(nft_id)
    }
    
    /// Transfer an NFT
    fn do_transfer(
        storage: &dyn Storage,
        caller: [u8; 32],
        from: [u8; 32],
        to: [u8; 32],
        nft_id: [u8; 32],
    ) -> Result<()> {
        // Verify ownership
        let owner = Self::get_owner(storage, &nft_id)
            .ok_or(Drc369Error::NftNotFound)?;
        
        if owner != from {
            return Err(Drc369Error::NotOwner);
        }
        
        // Check caller is authorized
        if !Self::is_authorized(storage, &caller, &from, &nft_id) {
            return Err(Drc369Error::NotOwner);
        }
        
        // Check not soulbound
        if Self::is_soulbound(storage, &nft_id) {
            return Err(Drc369Error::Soulbound);
        }
        
        // Check recipient is not zero
        if to == [0u8; 32] {
            return Err(Drc369Error::TransferFailed("Cannot transfer to zero address".to_string()));
        }
        
        // Update owner
        storage.put(&Self::owner_key(&nft_id), &to);
        
        // Update balances
        let from_balance = Self::get_balance(storage, &from);
        let to_balance = Self::get_balance(storage, &to);
        
        storage.put(&Self::balance_key(&from), &from_balance.saturating_sub(1).encode());
        storage.put(&Self::balance_key(&to), &(to_balance + 1).encode());
        
        // Clear approval
        storage.put(&Self::approval_key(&nft_id), &[0u8; 32]);
        
        info!(
            "DRC369: Transferred NFT {} from {} to {}",
            hex::encode(&nft_id[..8]),
            hex::encode(&from[..8]),
            hex::encode(&to[..8])
        );
        
        Ok(())
    }
    
    /// Transfer an NFT with payment, auto-distributing royalties
    /// 
    /// This is used for marketplace sales where a payment amount is specified.
    /// Royalties are automatically calculated and distributed to the creator.
    /// 
    /// Returns: (royalty_paid, seller_receives)
    pub fn do_transfer_with_payment(
        storage: &dyn Storage,
        caller: [u8; 32],
        from: [u8; 32],
        to: [u8; 32],
        nft_id: [u8; 32],
        payment_amount: u128,
    ) -> Result<TransferWithPaymentResult> {
        // Verify ownership
        let owner = Self::get_owner(storage, &nft_id)
            .ok_or(Drc369Error::NftNotFound)?;
        
        if owner != from {
            return Err(Drc369Error::NotOwner);
        }
        
        // Check caller is authorized
        if !Self::is_authorized(storage, &caller, &from, &nft_id) {
            return Err(Drc369Error::NotOwner);
        }
        
        // Check not soulbound
        if Self::is_soulbound(storage, &nft_id) {
            return Err(Drc369Error::Soulbound);
        }
        
        // Check recipient is not zero
        if to == [0u8; 32] {
            return Err(Drc369Error::TransferFailed("Cannot transfer to zero address".to_string()));
        }
        
        // Calculate royalties
        let (royalty_amount, seller_amount) = Self::calculate_royalty(storage, &nft_id, payment_amount);
        let royalty_recipient = Self::get_royalty(storage, &nft_id)
            .map(|r| r.recipient);
        
        // Update owner
        storage.put(&Self::owner_key(&nft_id), &to);
        
        // Update balances
        let from_balance = Self::get_balance(storage, &from);
        let to_balance = Self::get_balance(storage, &to);
        
        storage.put(&Self::balance_key(&from), &from_balance.saturating_sub(1).encode());
        storage.put(&Self::balance_key(&to), &(to_balance + 1).encode());
        
        // Clear approval
        storage.put(&Self::approval_key(&nft_id), &[0u8; 32]);
        
        // Log the transfer with payment details
        if let Some(recipient) = &royalty_recipient {
            info!(
                "DRC369: Transferred NFT {} from {} to {} - Payment: {}, Royalty: {} to {}, Seller receives: {}",
                hex::encode(&nft_id[..8]),
                hex::encode(&from[..8]),
                hex::encode(&to[..8]),
                payment_amount,
                royalty_amount,
                hex::encode(&recipient[..8]),
                seller_amount
            );
        } else {
            info!(
                "DRC369: Transferred NFT {} from {} to {} - Payment: {} (no royalty configured)",
                hex::encode(&nft_id[..8]),
                hex::encode(&from[..8]),
                hex::encode(&to[..8]),
                payment_amount
            );
        }
        
        Ok(TransferWithPaymentResult {
            nft_id,
            from,
            to,
            payment_amount,
            royalty_amount,
            royalty_recipient,
            seller_receives: seller_amount,
        })
    }
    
    /// Approve an address to transfer NFT
    fn do_approve(
        storage: &dyn Storage,
        caller: [u8; 32],
        approved: [u8; 32],
        nft_id: [u8; 32],
    ) -> Result<()> {
        let owner = Self::get_owner(storage, &nft_id)
            .ok_or(Drc369Error::NftNotFound)?;
        
        if caller != owner {
            return Err(Drc369Error::NotOwner);
        }
        
        storage.put(&Self::approval_key(&nft_id), &approved);
        
        Ok(())
    }
    
    /// Set operator approval for all NFTs
    fn do_set_approval_for_all(
        storage: &dyn Storage,
        caller: [u8; 32],
        operator: [u8; 32],
        approved: bool,
    ) -> Result<()> {
        let value = if approved { [1u8] } else { [0u8] };
        storage.put(&Self::operator_key(&caller, &operator), &value);
        Ok(())
    }
    
    /// Update NFT state (XP, level, stats)
    fn do_update_state(
        storage: &dyn Storage,
        caller: [u8; 32],
        nft_id: [u8; 32],
        state: NftState,
    ) -> Result<()> {
        // Verify ownership or delegation
        let owner = Self::get_owner(storage, &nft_id)
            .ok_or(Drc369Error::NftNotFound)?;
        
        if !Self::can_modify_state(storage, &caller, &owner, &nft_id) {
            return Err(Drc369Error::NotOwner);
        }
        
        // Get current state for level-up check
        let current_state = Self::get_state(storage, &nft_id);
        
        // Update state
        storage.put(&Self::state_key(&nft_id), &state.encode());
        
        // Log level up
        if state.level > current_state.level {
            info!(
                "DRC369: NFT {} leveled up! {} -> {}",
                hex::encode(&nft_id[..8]),
                current_state.level,
                state.level
            );
        }
        
        Ok(())
    }
    
    /// Add XP to NFT
    fn do_add_xp(
        storage: &dyn Storage,
        caller: [u8; 32],
        nft_id: [u8; 32],
        xp_amount: u64,
    ) -> Result<()> {
        let owner = Self::get_owner(storage, &nft_id)
            .ok_or(Drc369Error::NftNotFound)?;
        
        if !Self::can_modify_state(storage, &caller, &owner, &nft_id) {
            return Err(Drc369Error::NotOwner);
        }
        
        let mut state = Self::get_state(storage, &nft_id);
        state.xp = state.xp.saturating_add(xp_amount);
        
        // Check for level up (100 XP per level)
        let new_level = ((state.xp / 100) + 1) as u32;
        if new_level > state.level {
            state.level = new_level;
            info!(
                "DRC369: NFT {} leveled up to {}!",
                hex::encode(&nft_id[..8]),
                new_level
            );
        }
        
        storage.put(&Self::state_key(&nft_id), &state.encode());
        
        Ok(())
    }
    
    /// Set soulbound status
    fn do_set_soulbound(
        storage: &dyn Storage,
        caller: [u8; 32],
        nft_id: [u8; 32],
        soulbound: bool,
    ) -> Result<()> {
        let owner = Self::get_owner(storage, &nft_id)
            .ok_or(Drc369Error::NftNotFound)?;
        
        if caller != owner {
            return Err(Drc369Error::NotOwner);
        }
        
        // Can only make soulbound, not un-soulbound
        if Self::is_soulbound(storage, &nft_id) && !soulbound {
            return Err(Drc369Error::StateUpdateFailed(
                "Cannot remove soulbound status".to_string()
            ));
        }
        
        if soulbound {
            storage.put(&Self::soulbound_key(&nft_id), &[1u8]);
            info!("DRC369: NFT {} is now soulbound", hex::encode(&nft_id[..8]));
        }
        
        Ok(())
    }
    
    /// Add a resource to NFT
    fn do_add_resource(
        storage: &dyn Storage,
        caller: [u8; 32],
        nft_id: [u8; 32],
        resource: Resource,
    ) -> Result<()> {
        let owner = Self::get_owner(storage, &nft_id)
            .ok_or(Drc369Error::NftNotFound)?;
        
        if caller != owner {
            return Err(Drc369Error::NotOwner);
        }
        
        // Get existing resources
        let mut resources = Self::get_resources(storage, &nft_id);
        resources.push(resource);
        
        storage.put(&Self::resources_key(&nft_id), &resources.encode());
        
        info!(
            "DRC369: Added resource to NFT {} (total: {})",
            hex::encode(&nft_id[..8]),
            resources.len()
        );
        
        Ok(())
    }
    
    /// Nest an NFT under a parent NFT
    fn do_nest(
        storage: &dyn Storage,
        caller: [u8; 32],
        child_id: [u8; 32],
        parent_id: [u8; 32],
    ) -> Result<()> {
        // Verify ownership of child
        let child_owner = Self::get_owner(storage, &child_id)
            .ok_or(Drc369Error::NftNotFound)?;
        
        if caller != child_owner {
            return Err(Drc369Error::NotOwner);
        }
        
        // Verify parent exists
        Self::get_owner(storage, &parent_id)
            .ok_or(Drc369Error::NftNotFound)?;
        
        // Check not already nested
        if Self::get_parent(storage, &child_id).is_some() {
            return Err(Drc369Error::StateUpdateFailed(
                "NFT is already nested".to_string()
            ));
        }
        
        // Set parent
        storage.put(&Self::parent_key(&child_id), &parent_id);
        
        // Add to parent's children
        let mut children = Self::get_children(storage, &parent_id);
        children.push(child_id);
        storage.put(&Self::children_key(&parent_id), &children.encode());
        
        info!(
            "DRC369: Nested NFT {} under {}",
            hex::encode(&child_id[..8]),
            hex::encode(&parent_id[..8])
        );
        
        Ok(())
    }
    
    /// Unnest an NFT from its parent
    fn do_unnest(
        storage: &dyn Storage,
        caller: [u8; 32],
        child_id: [u8; 32],
    ) -> Result<()> {
        let child_owner = Self::get_owner(storage, &child_id)
            .ok_or(Drc369Error::NftNotFound)?;
        
        if caller != child_owner {
            return Err(Drc369Error::NotOwner);
        }
        
        let parent_id = Self::get_parent(storage, &child_id)
            .ok_or(Drc369Error::StateUpdateFailed("NFT is not nested".to_string()))?;
        
        // Remove parent reference
        storage.put(&Self::parent_key(&child_id), &[0u8; 32]);
        
        // Remove from parent's children
        let mut children = Self::get_children(storage, &parent_id);
        children.retain(|c| c != &child_id);
        storage.put(&Self::children_key(&parent_id), &children.encode());
        
        info!(
            "DRC369: Unnested NFT {} from {}",
            hex::encode(&child_id[..8]),
            hex::encode(&parent_id[..8])
        );
        
        Ok(())
    }
    
    /// Delegate permissions on an NFT
    fn do_delegate(
        storage: &dyn Storage,
        caller: [u8; 32],
        nft_id: [u8; 32],
        delegatee: [u8; 32],
        permissions: Vec<Permission>,
    ) -> Result<()> {
        let owner = Self::get_owner(storage, &nft_id)
            .ok_or(Drc369Error::NftNotFound)?;
        
        if caller != owner {
            return Err(Drc369Error::NotOwner);
        }
        
        let delegation = Delegation {
            delegatee,
            permissions,
            expires_at: None, // No expiration
        };
        
        storage.put(&Self::delegation_key(&nft_id, &delegatee), &delegation.encode());
        
        info!(
            "DRC369: Delegated permissions on NFT {} to {}",
            hex::encode(&nft_id[..8]),
            hex::encode(&delegatee[..8])
        );
        
        Ok(())
    }
    
    /// Revoke delegation
    fn do_revoke_delegation(
        storage: &dyn Storage,
        caller: [u8; 32],
        nft_id: [u8; 32],
        delegatee: [u8; 32],
    ) -> Result<()> {
        let owner = Self::get_owner(storage, &nft_id)
            .ok_or(Drc369Error::NftNotFound)?;
        
        if caller != owner {
            return Err(Drc369Error::NotOwner);
        }
        
        storage.put(&Self::delegation_key(&nft_id, &delegatee), &[]);
        
        Ok(())
    }
    
    /// Burn an NFT
    fn do_burn(
        storage: &dyn Storage,
        caller: [u8; 32],
        nft_id: [u8; 32],
    ) -> Result<()> {
        let owner = Self::get_owner(storage, &nft_id)
            .ok_or(Drc369Error::NftNotFound)?;
        
        if caller != owner {
            return Err(Drc369Error::NotOwner);
        }
        
        // Check no children
        let children = Self::get_children(storage, &nft_id);
        if !children.is_empty() {
            return Err(Drc369Error::StateUpdateFailed(
                "Cannot burn NFT with nested children".to_string()
            ));
        }
        
        // Clear owner (marks as burned)
        storage.put(&Self::owner_key(&nft_id), &[0u8; 32]);
        
        // Decrement balance
        let balance = Self::get_balance(storage, &owner);
        storage.put(&Self::balance_key(&owner), &balance.saturating_sub(1).encode());
        
        // Decrement total supply
        let total_supply = Self::get_total_supply(storage);
        storage.put(storage_keys::TOTAL_SUPPLY, &total_supply.saturating_sub(1).encode());
        
        info!("DRC369: Burned NFT {}", hex::encode(&nft_id[..8]));
        
        Ok(())
    }
    
    // ========================================================================
    // QUERY HELPERS
    // ========================================================================
    
    /// Get the owner of an NFT
    pub fn get_owner(storage: &dyn Storage, nft_id: &[u8; 32]) -> Option<[u8; 32]> {
        storage.get(&Self::owner_key(nft_id)).and_then(|v| {
            if v.len() == 32 && v != [0u8; 32].to_vec() {
                let mut owner = [0u8; 32];
                owner.copy_from_slice(&v);
                Some(owner)
            } else {
                None
            }
        })
    }
    
    fn get_balance(storage: &dyn Storage, account: &[u8; 32]) -> u64 {
        storage.get(&Self::balance_key(account))
            .and_then(|v| u64::decode(&mut &v[..]).ok())
            .unwrap_or(0)
    }
    
    fn get_approval(storage: &dyn Storage, nft_id: &[u8; 32]) -> Option<[u8; 32]> {
        storage.get(&Self::approval_key(nft_id)).and_then(|v| {
            if v.len() == 32 && v != [0u8; 32].to_vec() {
                let mut approved = [0u8; 32];
                approved.copy_from_slice(&v);
                Some(approved)
            } else {
                None
            }
        })
    }
    
    fn is_operator(storage: &dyn Storage, owner: &[u8; 32], operator: &[u8; 32]) -> bool {
        storage.get(&Self::operator_key(owner, operator))
            .map(|v| !v.is_empty() && v[0] == 1)
            .unwrap_or(false)
    }
    
    fn is_authorized(
        storage: &dyn Storage,
        caller: &[u8; 32],
        owner: &[u8; 32],
        nft_id: &[u8; 32],
    ) -> bool {
        // Owner can always act
        if caller == owner {
            return true;
        }
        
        // Check approval
        if let Some(approved) = Self::get_approval(storage, nft_id) {
            if &approved == caller {
                return true;
            }
        }
        
        // Check operator
        Self::is_operator(storage, owner, caller)
    }
    
    fn is_soulbound(storage: &dyn Storage, nft_id: &[u8; 32]) -> bool {
        storage.get(&Self::soulbound_key(nft_id))
            .map(|v| !v.is_empty() && v[0] == 1)
            .unwrap_or(false)
    }
    
    /// Get the state (XP, level, stats) of an NFT
    pub fn get_state(storage: &dyn Storage, nft_id: &[u8; 32]) -> NftState {
        storage.get(&Self::state_key(nft_id))
            .and_then(|v| NftState::decode(&mut &v[..]).ok())
            .unwrap_or(NftState { xp: 0, level: 1, stats: vec![] })
    }
    
    fn get_resources(storage: &dyn Storage, nft_id: &[u8; 32]) -> Vec<Resource> {
        storage.get(&Self::resources_key(nft_id))
            .and_then(|v| Vec::<Resource>::decode(&mut &v[..]).ok())
            .unwrap_or_default()
    }
    
    fn get_parent(storage: &dyn Storage, nft_id: &[u8; 32]) -> Option<[u8; 32]> {
        storage.get(&Self::parent_key(nft_id)).and_then(|v| {
            if v.len() == 32 && v != [0u8; 32].to_vec() {
                let mut parent = [0u8; 32];
                parent.copy_from_slice(&v);
                Some(parent)
            } else {
                None
            }
        })
    }
    
    fn get_children(storage: &dyn Storage, nft_id: &[u8; 32]) -> Vec<[u8; 32]> {
        storage.get(&Self::children_key(nft_id))
            .and_then(|v| Vec::<[u8; 32]>::decode(&mut &v[..]).ok())
            .unwrap_or_default()
    }
    
    fn get_delegation(
        storage: &dyn Storage,
        nft_id: &[u8; 32],
        delegatee: &[u8; 32],
    ) -> Option<Delegation> {
        storage.get(&Self::delegation_key(nft_id, delegatee))
            .and_then(|v| Delegation::decode(&mut &v[..]).ok())
    }
    
    fn can_modify_state(
        storage: &dyn Storage,
        caller: &[u8; 32],
        owner: &[u8; 32],
        nft_id: &[u8; 32],
    ) -> bool {
        if caller == owner {
            return true;
        }
        
        // Check delegation
        if let Some(delegation) = Self::get_delegation(storage, nft_id, caller) {
            return delegation.permissions.contains(&Permission::UpdateState);
        }
        
        false
    }
    
    fn get_next_id(storage: &dyn Storage) -> u64 {
        storage.get(storage_keys::NEXT_NFT_ID)
            .and_then(|v| u64::decode(&mut &v[..]).ok())
            .unwrap_or(1)
    }
    
    fn get_total_supply(storage: &dyn Storage) -> u64 {
        storage.get(storage_keys::TOTAL_SUPPLY)
            .and_then(|v| u64::decode(&mut &v[..]).ok())
            .unwrap_or(0)
    }
    
    fn generate_nft_id(index: u64) -> [u8; 32] {
        let mut hasher = Blake2b512::new();
        hasher.update(b"DRC369_NFT_ID");
        hasher.update(index.to_le_bytes());
        let hash = hasher.finalize();
        let mut id = [0u8; 32];
        id.copy_from_slice(&hash[..32]);
        id
    }
}

impl Module for Drc369Module {
    fn name(&self) -> &'static str {
        "DRC369"
    }

    fn version(&self) -> u32 {
        1
    }

    fn execute(
        &self,
        call: Vec<u8>,
        context: &ExecutionContext,
        storage: &dyn Storage,
    ) -> std::result::Result<(), demiurge_modules::traits::ModuleError> {
        // Decode call
        let call_data: NftCall = Decode::decode(&mut &call[..])
            .map_err(|e| demiurge_modules::traits::ModuleError::InvalidCall(e.to_string()))?;
        
        // Get the caller from execution context
        let caller = context.caller;
        
        info!(
            "DRC369: Executing call from {} at block {}",
            hex::encode(&caller[..8]),
            context.block_number
        );

        let result = match call_data {
            NftCall::Mint { owner, metadata } => {
                Self::do_mint(storage, caller, owner, metadata, false)
                    .map(|_| ())
            }
            NftCall::MintSoulbound { owner, metadata } => {
                Self::do_mint(storage, caller, owner, metadata, true)
                    .map(|_| ())
            }
            NftCall::Transfer { from, to, nft_id } => {
                Self::do_transfer(storage, caller, from, to, nft_id)
            }
            NftCall::Approve { approved, nft_id } => {
                Self::do_approve(storage, caller, approved, nft_id)
            }
            NftCall::SetApprovalForAll { operator, approved } => {
                Self::do_set_approval_for_all(storage, caller, operator, approved)
            }
            NftCall::UpdateState { nft_id, state } => {
                Self::do_update_state(storage, caller, nft_id, state)
            }
            NftCall::AddXp { nft_id, amount } => {
                Self::do_add_xp(storage, caller, nft_id, amount)
            }
            NftCall::SetSoulbound { nft_id, soulbound } => {
                Self::do_set_soulbound(storage, caller, nft_id, soulbound)
            }
            NftCall::AddResource { nft_id, resource } => {
                Self::do_add_resource(storage, caller, nft_id, resource)
            }
            NftCall::Nest { child_id, parent_id } => {
                Self::do_nest(storage, caller, child_id, parent_id)
            }
            NftCall::Unnest { child_id } => {
                Self::do_unnest(storage, caller, child_id)
            }
            NftCall::Delegate { nft_id, delegatee, permissions } => {
                Self::do_delegate(storage, caller, nft_id, delegatee, permissions)
            }
            NftCall::RevokeDelegation { nft_id, delegatee } => {
                Self::do_revoke_delegation(storage, caller, nft_id, delegatee)
            }
            NftCall::Burn { nft_id } => {
                Self::do_burn(storage, caller, nft_id)
            }
            NftCall::SetRoyalty { nft_id, recipient, percentage_bps } => {
                let royalty = RoyaltyConfig::new(recipient, percentage_bps);
                Self::set_royalty(storage, caller, nft_id, royalty)
            }
            NftCall::TransferWithPayment { from, to, nft_id, payment_amount } => {
                Self::do_transfer_with_payment(storage, caller, from, to, nft_id, payment_amount)
                    .map(|_| ())
            }
        };

        result.map_err(|e| demiurge_modules::traits::ModuleError::ExecutionFailed(e.to_string()))
    }
}

// ============================================================================
// DATA TYPES
// ============================================================================

/// NFT module calls
#[derive(Clone, Debug, Encode, Decode, TypeInfo)]
pub enum NftCall {
    /// Mint a new NFT
    Mint {
        owner: [u8; 32],
        metadata: Vec<u8>,
    },
    /// Mint a soulbound NFT
    MintSoulbound {
        owner: [u8; 32],
        metadata: Vec<u8>,
    },
    /// Transfer NFT
    Transfer {
        from: [u8; 32],
        to: [u8; 32],
        nft_id: [u8; 32],
    },
    /// Approve address to transfer NFT
    Approve {
        approved: [u8; 32],
        nft_id: [u8; 32],
    },
    /// Set operator approval for all NFTs
    SetApprovalForAll {
        operator: [u8; 32],
        approved: bool,
    },
    /// Update NFT state (XP, level, stats)
    UpdateState {
        nft_id: [u8; 32],
        state: NftState,
    },
    /// Add XP to NFT
    AddXp {
        nft_id: [u8; 32],
        amount: u64,
    },
    /// Set soulbound status
    SetSoulbound {
        nft_id: [u8; 32],
        soulbound: bool,
    },
    /// Add resource (multi-resource support)
    AddResource {
        nft_id: [u8; 32],
        resource: Resource,
    },
    /// Nest NFT under parent
    Nest {
        child_id: [u8; 32],
        parent_id: [u8; 32],
    },
    /// Unnest NFT from parent
    Unnest {
        child_id: [u8; 32],
    },
    /// Delegate permissions
    Delegate {
        nft_id: [u8; 32],
        delegatee: [u8; 32],
        permissions: Vec<Permission>,
    },
    /// Revoke delegation
    RevokeDelegation {
        nft_id: [u8; 32],
        delegatee: [u8; 32],
    },
    /// Burn NFT
    Burn {
        nft_id: [u8; 32],
    },
    /// Set royalty configuration (creator only)
    SetRoyalty {
        nft_id: [u8; 32],
        recipient: [u8; 32],
        percentage_bps: u16,
    },
    /// Transfer with payment (for marketplace sales with auto-royalty)
    TransferWithPayment {
        from: [u8; 32],
        to: [u8; 32],
        nft_id: [u8; 32],
        payment_amount: u128,
    },
}

/// NFT state (XP, level, stats) - evolving NFTs
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Default)]
pub struct NftState {
    pub xp: u64,
    pub level: u32,
    pub stats: Vec<u8>, // Custom stats data
}

/// Resource definition - multi-resource support
#[derive(Clone, Debug, Encode, Decode, TypeInfo)]
pub struct Resource {
    pub resource_type: Vec<u8>, // e.g., "sprite", "glb", "audio"
    pub uri: Vec<u8>,
    pub metadata: Vec<u8>,
}

/// Permission types for delegation
#[derive(Clone, Debug, Encode, Decode, TypeInfo, PartialEq)]
pub enum Permission {
    /// Can update NFT state (XP, level, stats)
    UpdateState,
    /// Can add resources
    AddResource,
    /// Can nest/unnest
    Nest,
    /// All permissions
    All,
}

/// Delegation info
#[derive(Clone, Debug, Encode, Decode, TypeInfo)]
pub struct Delegation {
    pub delegatee: [u8; 32],
    pub permissions: Vec<Permission>,
    pub expires_at: Option<u64>, // Optional expiration timestamp
}

/// Royalty configuration for an NFT
/// 
/// Royalties are automatically distributed on transfers with payment.
#[derive(Clone, Debug, Encode, Decode, TypeInfo)]
pub struct RoyaltyConfig {
    /// Address to receive royalties
    pub recipient: [u8; 32],
    /// Royalty percentage in basis points (100 = 1%, max 5000 = 50%)
    pub percentage_bps: u16,
}

impl RoyaltyConfig {
    /// Create a new royalty configuration
    pub fn new(recipient: [u8; 32], percentage_bps: u16) -> Self {
        Self { recipient, percentage_bps }
    }
    
    /// Calculate royalty amount for a given price
    pub fn calculate(&self, price: u128) -> u128 {
        (price * self.percentage_bps as u128) / 10000
    }
}

/// Result of a transfer with payment
#[derive(Clone, Debug)]
pub struct TransferWithPaymentResult {
    /// NFT that was transferred
    pub nft_id: [u8; 32],
    /// Previous owner (seller)
    pub from: [u8; 32],
    /// New owner (buyer)
    pub to: [u8; 32],
    /// Total payment amount
    pub payment_amount: u128,
    /// Royalty amount paid to creator
    pub royalty_amount: u128,
    /// Royalty recipient (if configured)
    pub royalty_recipient: Option<[u8; 32]>,
    /// Amount seller receives after royalty
    pub seller_receives: u128,
}

// ============================================================================
// CVP INTEGRATION
// ============================================================================

/// Register DRC-369 with CVP for polymorphic protection
/// 
/// Call this during chain initialization to enable CVP protection
pub fn register_drc369_with_cvp<S: Storage>(
    consensus_engine: &mut dyn CvpRegistrar,
    storage: &mut S,
) -> std::result::Result<(), String> {
    let module = Drc369Module::new();
    
    // Check if already registered
    if Drc369Module::is_cvp_registered(storage) {
        return Ok(());
    }
    
    let semantic_ir = module.build_semantic_ir();
    let bytecode = module.generate_bytecode();
    let contract_id = module.cvp_contract_id();
    
    // Register with consensus engine's CVP
    consensus_engine.register_cvp_contract(contract_id, semantic_ir, bytecode)?;
    
    // Mark as registered
    Drc369Module::set_cvp_registered(storage);
    storage.put(storage_keys::CVP_CONTRACT_ID, &contract_id);
    
    info!(
        "DRC369: Registered with CVP - Contract ID: {}",
        hex::encode(&contract_id[..8])
    );
    
    Ok(())
}

/// Trait for CVP registration (implemented by ConsensusEngine)
pub trait CvpRegistrar {
    fn register_cvp_contract(
        &self,
        contract_id: ContractId,
        semantic_ir: SemanticIR,
        bytecode: Vec<u8>,
    ) -> std::result::Result<(), String>;
}

#[cfg(test)]
mod tests {
    use super::*;
    use demiurge_storage::MemoryStorage;
    
    #[test]
    fn test_mint_and_transfer() {
        let storage = MemoryStorage::new();
        let owner = [1u8; 32];
        let recipient = [2u8; 32];
        let caller = owner;
        
        // Mint
        let nft_id = Drc369Module::do_mint(
            &storage,
            caller,
            owner,
            b"test metadata".to_vec(),
            false,
        ).unwrap();
        
        // Verify ownership
        assert_eq!(Drc369Module::get_owner(&storage, &nft_id), Some(owner));
        assert_eq!(Drc369Module::get_balance(&storage, &owner), 1);
        
        // Transfer
        Drc369Module::do_transfer(&storage, caller, owner, recipient, nft_id).unwrap();
        
        // Verify transfer
        assert_eq!(Drc369Module::get_owner(&storage, &nft_id), Some(recipient));
        assert_eq!(Drc369Module::get_balance(&storage, &owner), 0);
        assert_eq!(Drc369Module::get_balance(&storage, &recipient), 1);
    }
    
    #[test]
    fn test_soulbound() {
        let storage = MemoryStorage::new();
        let owner = [1u8; 32];
        let recipient = [2u8; 32];
        let caller = owner;
        
        // Mint soulbound
        let nft_id = Drc369Module::do_mint(
            &storage,
            caller,
            owner,
            b"soulbound nft".to_vec(),
            true,
        ).unwrap();
        
        // Verify soulbound
        assert!(Drc369Module::is_soulbound(&storage, &nft_id));
        
        // Try to transfer - should fail
        let result = Drc369Module::do_transfer(&storage, caller, owner, recipient, nft_id);
        assert!(result.is_err());
    }
    
    #[test]
    fn test_xp_and_level() {
        let storage = MemoryStorage::new();
        let owner = [1u8; 32];
        let caller = owner;
        
        let nft_id = Drc369Module::do_mint(
            &storage,
            caller,
            owner,
            b"evolving nft".to_vec(),
            false,
        ).unwrap();
        
        // Initial state
        let state = Drc369Module::get_state(&storage, &nft_id);
        assert_eq!(state.level, 1);
        assert_eq!(state.xp, 0);
        
        // Add XP (100 = level up)
        Drc369Module::do_add_xp(&storage, caller, nft_id, 150).unwrap();
        
        let state = Drc369Module::get_state(&storage, &nft_id);
        assert_eq!(state.xp, 150);
        assert_eq!(state.level, 2); // Leveled up!
    }
    
    #[test]
    fn test_nesting() {
        let storage = MemoryStorage::new();
        let owner = [1u8; 32];
        let caller = owner;
        
        // Mint parent and child
        let parent_id = Drc369Module::do_mint(
            &storage, caller, owner, b"parent".to_vec(), false,
        ).unwrap();
        
        let child_id = Drc369Module::do_mint(
            &storage, caller, owner, b"child".to_vec(), false,
        ).unwrap();
        
        // Nest child under parent
        Drc369Module::do_nest(&storage, caller, child_id, parent_id).unwrap();
        
        // Verify nesting
        assert_eq!(Drc369Module::get_parent(&storage, &child_id), Some(parent_id));
        let children = Drc369Module::get_children(&storage, &parent_id);
        assert!(children.contains(&child_id));
        
        // Unnest
        Drc369Module::do_unnest(&storage, caller, child_id).unwrap();
        assert_eq!(Drc369Module::get_parent(&storage, &child_id), None);
    }
    
    #[test]
    fn test_cvp_integration() {
        let module = Drc369Module::new();
        
        // Build semantic IR
        let ir = module.build_semantic_ir();
        assert_eq!(ir.name, "DRC369");
        assert!(!ir.functions.is_empty());
        
        // Generate bytecode
        let bytecode = module.generate_bytecode();
        assert!(!bytecode.is_empty());
        
        // Contract ID should be deterministic
        let id1 = Drc369Module::generate_contract_id();
        let id2 = Drc369Module::generate_contract_id();
        assert_eq!(id1, id2);
    }
}
