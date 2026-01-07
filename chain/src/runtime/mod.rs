//! Runtime module registry and dispatch system.
//!
//! This module provides the infrastructure for routing transactions to
//! runtime modules. In Phase 3, concrete modules (bank_cgt, nft_dgen, etc.)
//! are registered here and handle transaction execution.
//!
//! PHASE OMEGA: Runtime registration is now deterministic and versioned.
//! Module order must remain consistent. See version.rs for integrity checks.

use crate::core::state::State;
use crate::core::transaction::Transaction;

pub mod version;

pub mod abyss_registry;
pub mod abyssid_registry;
pub mod activity_log;
pub mod bank_cgt;
pub mod cgt_staking;
pub mod fabric_manager;
pub mod nft_dgen;
pub mod developer_registry;
pub mod dev_capsules;
pub mod premium;
pub mod recursion_registry;
pub mod treasury;
pub mod work_claim;

pub use abyss_registry::{get_all_active_listings, get_listing, AbyssRegistryModule, ListingId};
pub use abyssid_registry::{
    create_abyssid_profile, get_address_by_handle, get_address_by_username, get_abyssid_profile,
    is_archon, record_syzygy, set_handle, set_username,
    AbyssIDRegistryModule,
};
pub use bank_cgt::{
    cgt_mint_to, get_balance_cgt, get_cgt_total_supply, get_nonce_cgt, CGT_DECIMALS,
    CGT_MAX_SUPPLY, CGT_NAME, CGT_SYMBOL, BankCgtModule,
};
pub use fabric_manager::{get_fabric_asset, FabricManagerModule, FabricRootHash};
pub use nft_dgen::{get_nft, get_nfts_by_owner, NftDgenModule, NftId};
pub use developer_registry::{
    add_project, get_all_developers, get_developer_by_username, get_developer_profile,
    get_project_maintainers, register_developer, DeveloperProfile,
    DeveloperRegistryModule,
};
pub use dev_capsules::{
    create_capsule, get_capsule, list_capsules_by_owner,
    update_capsule_status, CapsuleStatus, DevCapsulesModule,
};
pub use recursion_registry::{
    create_world, get_world, list_worlds_by_owner, RecursionRegistryModule,
};
pub use work_claim::WorkClaimModule;
pub use activity_log::ActivityLogModule;
pub use cgt_staking::CgtStakingModule;
pub use treasury::{
    calculate_fee, calculate_fee_distribution, distribute_fees, get_treasury_balance,
    get_treasury_stats, TreasuryModule, TreasuryStats, FeeDistribution,
    TREASURY_ADDRESS, BURN_ADDRESS, FEE_RATE_BPS, MIN_FEE, MAX_FEE,
    TREASURY_SHARE_BPS, BURN_SHARE_BPS, VALIDATOR_SHARE_BPS,
};
pub use premium::{
    get_effective_tier, get_premium_status, get_stake_tier, get_subscription,
    can_use_storage, PremiumModule, PremiumTier, PremiumFeature, PremiumStatus,
    FREE_STORAGE, ARCHON_STORAGE, GENESIS_STORAGE,
    ARCHON_MONTHLY_COST, GENESIS_MONTHLY_COST,
    ARCHON_STAKE_REQUIREMENT, GENESIS_STAKE_REQUIREMENT,
};

/// Trait that all runtime modules must implement.
///
/// Runtime modules handle specific domains of functionality:
/// - `bank_cgt`: CGT token balances and transfers
/// - `nft_dgen`: D-GEN NFT minting and transfers
/// - `urgeid_registry`: UrgeID profiles and Syzygy tracking
pub trait RuntimeModule: Send + Sync {
    /// Returns the unique identifier for this module (e.g., "bank_cgt").
    fn module_id(&self) -> &'static str;

    /// Dispatches a call to this module.
    ///
    /// # Arguments
    /// - `call_id`: The specific function to call (e.g., "transfer", "mint_dgen")
    /// - `tx`: The full transaction (modules can access tx.from, tx.fee, etc.)
    /// - `state`: Mutable reference to chain state for reading/writing
    ///
    /// # Returns
    /// - `Ok(())` if the call succeeded
    /// - `Err(String)` with an error message if the call failed
    fn dispatch(&self, call_id: &str, tx: &Transaction, state: &mut State) -> Result<(), String>;
}

/// Runtime registry that holds all registered modules.
///
/// The Runtime is created fresh for each block execution in Phase 3.
/// In later phases, this may be stored in Node for reuse.
pub struct Runtime {
    /// List of registered runtime modules.
    modules: Vec<Box<dyn RuntimeModule>>,
}

impl Runtime {
    /// Create a new empty runtime registry.
    pub fn new() -> Self {
        Self {
            modules: Vec::new(),
        }
    }

    /// Add a module to the runtime registry.
    pub fn with_module(mut self, module: Box<dyn RuntimeModule>) -> Self {
        self.modules.push(module);
        self
    }

    /// Create a runtime with all default modules registered.
    ///
    /// PHASE OMEGA: Module registration order is deterministic and must not change
    /// without incrementing RUNTIME_VERSION. See version.rs for integrity checks.
    pub fn with_default_modules() -> Self {
        let runtime = Self::new()
            .with_module(Box::new(BankCgtModule::new()))
            .with_module(Box::new(AbyssIDRegistryModule::new()))
            .with_module(Box::new(NftDgenModule::new()))
            .with_module(Box::new(FabricManagerModule::new()))
            .with_module(Box::new(AbyssRegistryModule::new()))
            .with_module(Box::new(DeveloperRegistryModule::new()))
            .with_module(Box::new(DevCapsulesModule::new()))
            .with_module(Box::new(RecursionRegistryModule::new()))
            .with_module(Box::new(WorkClaimModule::new()))
            .with_module(Box::new(ActivityLogModule::new()))
            .with_module(Box::new(CgtStakingModule::new()))
            .with_module(Box::new(TreasuryModule::new()))
            .with_module(Box::new(PremiumModule::new()));
        
        // PHASE OMEGA: Verify integrity in debug builds
        // In debug builds, fail fast if integrity check fails
        // In release builds, log warning but continue
        #[cfg(debug_assertions)]
        {
            if let Err(e) = version::verify_runtime_integrity(&runtime) {
                log::error!("Runtime integrity check failed: {}", e);
                panic!("Runtime integrity check failed: {}", e);
            }
        }
        #[cfg(not(debug_assertions))]
        {
            if let Err(e) = version::verify_runtime_integrity(&runtime) {
                log::warn!("Runtime integrity check failed in release build: {}", e);
            }
        }
        
        runtime
    }

    /// Dispatch a transaction to the appropriate runtime module.
    ///
    /// Looks up the module by `module_id` and calls its `dispatch` method
    /// with the transaction's `call_id` and the full transaction.
    ///
    /// # Returns
    /// - `Ok(())` if the transaction was successfully dispatched and executed
    /// - `Err(String)` if the module was not found or execution failed
    pub fn dispatch_tx(&mut self, tx: &Transaction, state: &mut State) -> Result<(), String> {
        let module = self
            .modules
            .iter()
            .find(|m| m.module_id() == tx.module_id)
            .ok_or_else(|| format!("Unknown module: {}", tx.module_id))?;

        module.dispatch(&tx.call_id, tx, state)
    }
}

impl Default for Runtime {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::state::State;
    use crate::core::transaction::{Address, Transaction};

    #[test]
    fn test_runtime_with_default_modules() {
        let runtime = Runtime::with_default_modules();
        assert_eq!(runtime.modules.len(), 13); // Including treasury and premium
    }

    #[test]
    fn test_dispatch_unknown_module() {
        let mut runtime = Runtime::with_default_modules();
        let mut state = State::in_memory();
        let tx = Transaction {
            from: [0; 32],
            nonce: 0,
            module_id: "unknown_module".to_string(),
            call_id: "test".to_string(),
            payload: vec![],
            fee: 0,
            signature: vec![],
        };

        let result = runtime.dispatch_tx(&tx, &mut state);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Unknown module"));
    }
}
