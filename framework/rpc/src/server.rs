//! RPC server implementation

use crate::{RpcError, Result, RpcMethods};
use crate::error::invalid_params;
use crate::subscriptions::{
    SharedSubscriptionManager, create_subscription_manager,
};
use demiurge_storage::Storage;
use jsonrpsee::{
    server::{ServerBuilder, ServerHandle},
    RpcModule,
    types::ErrorObjectOwned,
    SubscriptionMessage,
};
use std::net::SocketAddr;
use std::sync::Arc;
use hex;
use tokio::sync::broadcast;

/// RPC server with subscription support
pub struct RpcServer<S: Storage> {
    handle: Option<ServerHandle>,
    address: SocketAddr,
    _methods: Option<Arc<RpcMethods<S>>>,
    subscriptions: SharedSubscriptionManager,
}

impl<S: Storage + Send + Sync + 'static> RpcServer<S> {
    /// Create a new RPC server
    pub fn new(address: SocketAddr) -> Self {
        Self {
            handle: None,
            address,
            _methods: None,
            subscriptions: create_subscription_manager(),
        }
    }

    /// Get the subscription manager for publishing events
    pub fn subscription_manager(&self) -> SharedSubscriptionManager {
        self.subscriptions.clone()
    }

    /// Start the RPC server
    pub async fn start(&mut self, methods: Arc<RpcMethods<S>>) -> Result<()> {
        self._methods = Some(methods.clone());

        let module = Self::build_module(methods, self.subscriptions.clone())?;

        // Configure server to support both HTTP and WebSocket
        // ServerBuilder::default() should support both, but we ensure HTTP is enabled
        // This allows curl (HTTP POST) for testing AND WebSocket for UI clients
        let server = ServerBuilder::default()
            .build(self.address)
            .await
            .map_err(|e| RpcError::ServerError(format!("Failed to build RPC server: {}", e)))?;

        // Start the server - start() returns ServerHandle directly
        // The server runs in the background automatically
        let handle = server.start(module);
        self.handle = Some(handle);

        Ok(())
    }

    /// Build the JSON-RPC module with every method this server exposes.
    ///
    /// Every method that ends up in the module must also be listed in
    /// [`registered_methods`]; the two are cross-checked here so the static
    /// list (which the safety tests inspect) cannot drift from reality.
    pub fn build_module(
        methods: Arc<RpcMethods<S>>,
        subscriptions: SharedSubscriptionManager,
    ) -> Result<RpcModule<Arc<RpcMethods<S>>>> {
        let mut module = RpcModule::new(methods);

        // Register chain methods
        Self::register_chain_methods(&mut module)?;

        // Register author methods (signed transaction submission)
        Self::register_author_methods(&mut module)?;

        // Register network methods
        Self::register_network_methods(&mut module)?;

        // Register balance methods
        Self::register_balance_methods(&mut module)?;

        // Register consensus methods
        Self::register_consensus_methods(&mut module)?;

        // Register energy methods
        Self::register_energy_methods(&mut module)?;

        // Register session keys methods
        Self::register_session_keys_methods(&mut module)?;

        // Register DRC-369 NFT methods
        Self::register_drc369_methods(&mut module)?;

        // Register CVP (Consensus-Verified Polymorphism) methods
        Self::register_cvp_methods(&mut module)?;

        // Register subscription methods
        Self::register_subscription_methods(&mut module, subscriptions)?;

        // Cross-check the static method list against what was actually registered.
        let mut actual: Vec<&'static str> = module.method_names().collect();
        actual.sort_unstable();
        let mut expected = registered_methods();
        expected.sort_unstable();
        if actual != expected {
            return Err(RpcError::ServerError(format!(
                "registered_methods() is out of sync with the RPC module. registered: {:?}, listed: {:?}",
                actual, expected
            )));
        }

        Ok(module)
    }

    /// Register author RPC methods (the only way to mutate chain state via RPC).
    ///
    /// All of these take a hex-encoded, SCALE-serialized, *signed* `Transaction`
    /// and hand it to the transaction pool after `Transaction::validate()`.
    /// No RPC method writes to storage directly.
    fn register_author_methods(module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // author_submitExtrinsic - submit a signed transaction (hex SCALE bytes)
        module.register_async_method("author_submitExtrinsic", |params, ctx| async move {
            let tx_hex: String = params.one()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Expected: [tx_hex]") })?;
            let tx_hex = tx_hex.strip_prefix("0x").unwrap_or(&tx_hex).to_string();
            ctx.author_submit_extrinsic(tx_hex).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register author_submitExtrinsic: {}", e)))?;

        // chain_submitTransaction - alias of author_submitExtrinsic
        module.register_async_method("chain_submitTransaction", |params, ctx| async move {
            let tx_hex: String = params.one()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Expected: [tx_hex]") })?;
            let tx_hex = tx_hex.strip_prefix("0x").unwrap_or(&tx_hex).to_string();
            ctx.author_submit_extrinsic(tx_hex).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register chain_submitTransaction: {}", e)))?;

        // author_pendingExtrinsics - current pool contents (hex SCALE bytes)
        module.register_async_method("author_pendingExtrinsics", |_params, ctx| async move {
            ctx.author_pending_extrinsics().await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register author_pendingExtrinsics: {}", e)))?;

        Ok(())
    }

    /// Register chain RPC methods
    fn register_chain_methods(module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // chain_getHealth
        module.register_async_method("chain_getHealth", |_params, ctx| async move {
            ctx.chain_get_health().await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register chain_getHealth: {}", e)))?;

        // chain_getBlockNumber
        module.register_async_method("chain_getBlockNumber", |_params, ctx| async move {
            ctx.chain_get_block_number().await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register chain_getBlockNumber: {}", e)))?;

        // chain_getBlock
        module.register_async_method("chain_getBlock", |params, ctx| async move {
            let block_number: u64 = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid block number") })?;
            ctx.chain_get_block_by_number(block_number).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register chain_getBlock: {}", e)))?;

        // chain_getLatestBlock
        module.register_async_method("chain_getLatestBlock", |_params, ctx| async move {
            ctx.chain_get_latest_block().await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register chain_getLatestBlock: {}", e)))?;

        // chain_getTransaction
        module.register_async_method("chain_getTransaction", |params, ctx| async move {
            let hash_str: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid hash") })?;
            let hash = hex::decode(hash_str)
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid hash hex") })?
                .try_into()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Hash must be 32 bytes") })?;
            ctx.chain_get_transaction(hash).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register chain_getTransaction: {}", e)))?;

        // chain_getTransactionHistory
        module.register_async_method("chain_getTransactionHistory", |params, ctx| async move {
            let (address_str, limit): (String, Option<u64>) = params.parse().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid params") })?;
            let address = hex::decode(address_str)
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid address hex") })?
                .try_into()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Address must be 32 bytes") })?;
            let limit = limit.unwrap_or(50);
            ctx.chain_get_transaction_history(address, limit).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register chain_getTransactionHistory: {}", e)))?;

        Ok(())
    }

    /// Register balance RPC methods
    fn register_balance_methods(module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // balances_getBalance
        module.register_async_method("balances_getBalance", |params, ctx| async move {
            let address_str: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid address") })?;
            let address = hex::decode(address_str)
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid address hex") })?
                .try_into()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Address must be 32 bytes") })?;
            ctx.balances_get_balance(address).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register balances_getBalance: {}", e)))?;

        // balances_hasClaimedStarter - Check if user already claimed starter bonus
        module.register_async_method("balances_hasClaimedStarter", |params, ctx| async move {
            let address_str: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid address") })?;
            let address = hex::decode(address_str)
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid address hex") })?
                .try_into()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Address must be 32 bytes") })?;
            ctx.balances_has_claimed_starter(address).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register balances_hasClaimedStarter: {}", e)))?;

        Ok(())
    }

    /// Register consensus RPC methods
    fn register_consensus_methods(module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // consensus_getCurrentEra
        module.register_async_method("consensus_getCurrentEra", |_params, ctx| async move {
            ctx.consensus_get_current_era().await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register consensus_getCurrentEra: {}", e)))?;

        // consensus_getValidators
        module.register_async_method("consensus_getValidators", |_params, ctx| async move {
            ctx.consensus_get_validators().await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register consensus_getValidators: {}", e)))?;

        // consensus_getValidator
        module.register_async_method("consensus_getValidator", |params, ctx| async move {
            let account_str: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid account") })?;
            let account = hex::decode(account_str)
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid account hex") })?
                .try_into()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Account must be 32 bytes") })?;
            ctx.consensus_get_validator(account).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register consensus_getValidator: {}", e)))?;

        // consensus_getStakingPool
        module.register_async_method("consensus_getStakingPool", |params, ctx| async move {
            let validator_str: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid validator") })?;
            let validator = hex::decode(validator_str)
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid validator hex") })?
                .try_into()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Validator must be 32 bytes") })?;
            ctx.consensus_get_staking_pool(validator).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register consensus_getStakingPool: {}", e)))?;

        // consensus_getStatus
        module.register_async_method("consensus_getStatus", |_params, ctx| async move {
            ctx.consensus_get_status().await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register consensus_getStatus: {}", e)))?;

        // consensus_getPendingRewards
        module.register_async_method("consensus_getPendingRewards", |params, ctx| async move {
            let (address, validator): (String, Option<String>) = params.parse()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Expected [address, validator?]") })?;
            ctx.consensus_get_pending_rewards(address, validator).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register consensus_getPendingRewards: {}", e)))?;

        // consensus_getStakingStatus
        module.register_async_method("consensus_getStakingStatus", |params, ctx| async move {
            let address: String = params.one()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid address") })?;
            ctx.consensus_get_staking_status(address).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register consensus_getStakingStatus: {}", e)))?;

        // consensus_getValidatorInfo (combines getValidator + getStakingPool for CLI)
        module.register_async_method("consensus_getValidatorInfo", |params, ctx| async move {
            let account_str: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid account") })?;
            let account = hex::decode(&account_str)
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid account hex") })?
                .try_into()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Account must be 32 bytes") })?;
            let validator = ctx.consensus_get_validator(account).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))?;
            let pool = ctx.consensus_get_staking_pool(account).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))?;
            let status = validator.as_ref().map(|v| if v.active { "active" } else { "inactive" }).unwrap_or("inactive");
            let nominators = pool.as_ref().map(|p| p.nominators.len()).unwrap_or(0);
            Ok::<serde_json::Value, ErrorObjectOwned>(serde_json::json!({
                "address": account_str,
                "stake": validator.as_ref().map(|v| v.stake.clone()).unwrap_or_else(|| "0".to_string()),
                "commission": validator.as_ref().map(|v| v.commission).unwrap_or(0),
                "status": status,
                "nominators": nominators,
                "rewardsEarned": "0",
                "blocksProduced": 0
            }))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register consensus_getValidatorInfo: {}", e)))?;

        Ok(())
    }

    /// Register network RPC methods
    fn register_network_methods(module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // network_getPeers - P2P mesh verification
        module.register_async_method("network_getPeers", |_params, ctx| async move {
            ctx.network_get_peers().await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register network_getPeers: {}", e)))?;

        Ok(())
    }

    /// Register energy RPC methods
    fn register_energy_methods(module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // energy_getEnergy
        module.register_async_method("energy_getEnergy", |params, ctx| async move {
            let address_str: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid address") })?;
            let address = hex::decode(address_str)
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid address hex") })?
                .try_into()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Address must be 32 bytes") })?;
            ctx.energy_get_energy(address).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register energy_getEnergy: {}", e)))?;

        Ok(())
    }

    /// Register session keys RPC methods
    fn register_session_keys_methods(module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // sessionKeys_getActiveKeys
        module.register_async_method("sessionKeys_getActiveKeys", |params, ctx| async move {
            let address_str: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid address") })?;
            let address = hex::decode(address_str)
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid address hex") })?
                .try_into()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Address must be 32 bytes") })?;
            ctx.session_keys_get_active_keys(address).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register sessionKeys_getActiveKeys: {}", e)))?;

        Ok(())
    }

    /// Register DRC-369 NFT RPC methods
    fn register_drc369_methods(module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // drc369_ownerOf
        module.register_async_method("drc369_ownerOf", |params, ctx| async move {
            let token_id: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid token_id") })?;
            ctx.drc369_owner_of(token_id).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_ownerOf: {}", e)))?;

        // drc369_balanceOf
        module.register_async_method("drc369_balanceOf", |params, ctx| async move {
            let owner: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid owner") })?;
            ctx.drc369_balance_of(owner).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_balanceOf: {}", e)))?;

        // drc369_tokenURI
        module.register_async_method("drc369_tokenURI", |params, ctx| async move {
            let token_id: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid token_id") })?;
            ctx.drc369_token_uri(token_id).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_tokenURI: {}", e)))?;

        // drc369_isSoulbound
        module.register_async_method("drc369_isSoulbound", |params, ctx| async move {
            let token_id: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid token_id") })?;
            ctx.drc369_is_soulbound(token_id).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_isSoulbound: {}", e)))?;

        // drc369_getDynamicState
        module.register_async_method("drc369_getDynamicState", |params, ctx| async move {
            let (token_id, state_key): (String, String) = params.parse().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid params") })?;
            ctx.drc369_get_dynamic_state(token_id, state_key).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_getDynamicState: {}", e)))?;

        // drc369_getTokenInfo
        module.register_async_method("drc369_getTokenInfo", |params, ctx| async move {
            let token_id: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid token_id") })?;
            ctx.drc369_get_token_info(token_id).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_getTokenInfo: {}", e)))?;

        // drc369_totalSupply
        module.register_async_method("drc369_totalSupply", |_params, ctx| async move {
            ctx.drc369_total_supply().await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_totalSupply: {}", e)))?;

        // drc369_getPhysics - Get physics properties for game engines
        module.register_async_method("drc369_getPhysics", |params, ctx| async move {
            let token_id: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid token_id") })?;
            ctx.drc369_get_physics(token_id).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_getPhysics: {}", e)))?;

        // drc369_hasPhysics - Check if token has physics
        module.register_async_method("drc369_hasPhysics", |params, ctx| async move {
            let token_id: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid token_id") })?;
            ctx.drc369_has_physics(token_id).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_hasPhysics: {}", e)))?;

        // drc369_getRoyalty - Get royalty configuration
        module.register_async_method("drc369_getRoyalty", |params, ctx| async move {
            let token_id: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid token_id") })?;
            ctx.drc369_get_royalty(token_id).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_getRoyalty: {}", e)))?;

        // drc369_hasRoyalty - Check if token has royalty
        module.register_async_method("drc369_hasRoyalty", |params, ctx| async move {
            let token_id: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid token_id") })?;
            ctx.drc369_has_royalty(token_id).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_hasRoyalty: {}", e)))?;

        // drc369_calculateRoyalty - Calculate royalty for sale price
        module.register_async_method("drc369_calculateRoyalty", |params, ctx| async move {
            let (token_id, sale_price): (String, String) = params.parse()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Expected: [token_id, sale_price]") })?;
            ctx.drc369_calculate_royalty(token_id, sale_price).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_calculateRoyalty: {}", e)))?;

        // drc369_getCreator - Get original creator of token
        module.register_async_method("drc369_getCreator", |params, ctx| async move {
            let token_id: String = params.one().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid token_id") })?;
            ctx.drc369_get_creator(token_id).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_getCreator: {}", e)))?;

        // drc369_getStateBatch
        module.register_async_method("drc369_getStateBatch", |params, ctx| async move {
            let (token_id, paths): (String, Vec<String>) = params.parse().map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid params") })?;
            ctx.drc369_get_state_batch(token_id, paths).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register drc369_getStateBatch: {}", e)))?;

        Ok(())
    }

    /// Register CVP (Consensus-Verified Polymorphism) RPC methods
    fn register_cvp_methods(module: &mut RpcModule<Arc<RpcMethods<S>>>) -> Result<()> {
        // cvp_getStatus - Get CVP system status
        module.register_async_method("cvp_getStatus", |_params, ctx| async move {
            ctx.cvp_get_status().await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register cvp_getStatus: {}", e)))?;

        // cvp_getBlockProof - Get CVP proof for a block
        module.register_async_method("cvp_getBlockProof", |params, ctx| async move {
            let block_number: u64 = params.one()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid block number") })?;
            ctx.cvp_get_block_proof(block_number).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register cvp_getBlockProof: {}", e)))?;

        // cvp_getBytecode - Get CVP-protected bytecode for a contract
        module.register_async_method("cvp_getBytecode", |params, ctx| async move {
            let contract_id: String = params.one()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid contract_id") })?;
            ctx.cvp_get_bytecode(contract_id).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register cvp_getBytecode: {}", e)))?;

        // cvp_getContractInfo - Get contract info including CVP protection status
        module.register_async_method("cvp_getContractInfo", |params, ctx| async move {
            let contract_id: String = params.one()
                .map_err(|_| -> ErrorObjectOwned { invalid_params("Invalid contract_id") })?;
            ctx.cvp_get_contract_info(contract_id).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register cvp_getContractInfo: {}", e)))?;

        // cvp_getThreats - Get detected threat events
        module.register_async_method("cvp_getThreats", |params, ctx| async move {
            let query: Option<crate::methods::CvpThreatQuery> = params.one().ok();
            ctx.cvp_get_threats(query).await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register cvp_getThreats: {}", e)))?;

        // cvp_getThreatStats - Get aggregated threat statistics
        module.register_async_method("cvp_getThreatStats", |_params, ctx| async move {
            ctx.cvp_get_threat_stats().await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register cvp_getThreatStats: {}", e)))?;

        // cvp_getScheduledMutations - Get pending scheduled mutations
        module.register_async_method("cvp_getScheduledMutations", |_params, ctx| async move {
            ctx.cvp_get_scheduled_mutations().await
                .map_err(|e: RpcError| ErrorObjectOwned::from(e))
        }).map_err(|e| RpcError::ServerError(format!("Failed to register cvp_getScheduledMutations: {}", e)))?;

        Ok(())
    }

    /// Register subscription RPC methods (WebSocket only)
    fn register_subscription_methods(
        module: &mut RpcModule<Arc<RpcMethods<S>>>,
        subscriptions: SharedSubscriptionManager,
    ) -> Result<()> {
        // chain_subscribeNewBlocks
        let subs = subscriptions.clone();
        module.register_subscription(
            "chain_subscribeNewBlocks",
            "chain_newBlock",
            "chain_unsubscribeNewBlocks",
            move |_params, pending, _ctx| {
                let subs = subs.clone();
                async move {
                    let sink = pending.accept().await.map_err(|_| "Failed to accept subscription")?;
                    let connection_id = format!("conn_{}", std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_nanos());

                    let (sub_id, mut receiver) = subs.subscribe_new_blocks(connection_id.clone()).await;

                    // Send subscription ID first
                    drop(sink.send(SubscriptionMessage::from_json(&sub_id).unwrap()));

                    // Stream blocks to subscriber
                    tokio::spawn(async move {
                        loop {
                            match receiver.recv().await {
                                Ok(block) => {
                                    if sink.send(SubscriptionMessage::from_json(&block).unwrap()).await.is_err() {
                                        break;
                                    }
                                }
                                Err(broadcast::error::RecvError::Closed) => break,
                                Err(broadcast::error::RecvError::Lagged(_)) => continue,
                            }
                        }
                        let _ = subs.unsubscribe(sub_id).await;
                    });

                    Ok(())
                }
            },
        ).map_err(|e| RpcError::ServerError(format!("Failed to register chain_subscribeNewBlocks: {}", e)))?;

        // chain_subscribeFinalizedBlocks
        let subs = subscriptions.clone();
        module.register_subscription(
            "chain_subscribeFinalizedBlocks",
            "chain_finalizedBlock",
            "chain_unsubscribeFinalizedBlocks",
            move |_params, pending, _ctx| {
                let subs = subs.clone();
                async move {
                    let sink = pending.accept().await.map_err(|_| "Failed to accept subscription")?;
                    let connection_id = format!("conn_{}", std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_nanos());

                    let (sub_id, mut receiver) = subs.subscribe_finalized_blocks(connection_id).await;
                    drop(sink.send(SubscriptionMessage::from_json(&sub_id).unwrap()));

                    tokio::spawn(async move {
                        loop {
                            match receiver.recv().await {
                                Ok(block) => {
                                    if sink.send(SubscriptionMessage::from_json(&block).unwrap()).await.is_err() {
                                        break;
                                    }
                                }
                                Err(broadcast::error::RecvError::Closed) => break,
                                Err(broadcast::error::RecvError::Lagged(_)) => continue,
                            }
                        }
                        let _ = subs.unsubscribe(sub_id).await;
                    });

                    Ok(())
                }
            },
        ).map_err(|e| RpcError::ServerError(format!("Failed to register chain_subscribeFinalizedBlocks: {}", e)))?;

        // chain_subscribeNewPendingTransactions
        let subs = subscriptions.clone();
        module.register_subscription(
            "chain_subscribeNewPendingTransactions",
            "chain_pendingTransaction",
            "chain_unsubscribePendingTransactions",
            move |_params, pending, _ctx| {
                let subs = subs.clone();
                async move {
                    let sink = pending.accept().await.map_err(|_| "Failed to accept subscription")?;
                    let connection_id = format!("conn_{}", std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_nanos());

                    let (sub_id, mut receiver) = subs.subscribe_pending_transactions(connection_id).await;
                    drop(sink.send(SubscriptionMessage::from_json(&sub_id).unwrap()));

                    tokio::spawn(async move {
                        loop {
                            match receiver.recv().await {
                                Ok(tx) => {
                                    if sink.send(SubscriptionMessage::from_json(&tx).unwrap()).await.is_err() {
                                        break;
                                    }
                                }
                                Err(broadcast::error::RecvError::Closed) => break,
                                Err(broadcast::error::RecvError::Lagged(_)) => continue,
                            }
                        }
                        let _ = subs.unsubscribe(sub_id).await;
                    });

                    Ok(())
                }
            },
        ).map_err(|e| RpcError::ServerError(format!("Failed to register chain_subscribeNewPendingTransactions: {}", e)))?;

        // consensus_subscribeValidatorStatus
        let subs = subscriptions.clone();
        module.register_subscription(
            "consensus_subscribeValidatorStatus",
            "consensus_validatorStatus",
            "consensus_unsubscribeValidatorStatus",
            move |_params, pending, _ctx| {
                let subs = subs.clone();
                async move {
                    let sink = pending.accept().await.map_err(|_| "Failed to accept subscription")?;
                    let connection_id = format!("conn_{}", std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_nanos());

                    let (sub_id, mut receiver) = subs.subscribe_validator_status(None, connection_id).await;
                    drop(sink.send(SubscriptionMessage::from_json(&sub_id).unwrap()));

                    tokio::spawn(async move {
                        loop {
                            match receiver.recv().await {
                                Ok(event) => {
                                    if sink.send(SubscriptionMessage::from_json(&event).unwrap()).await.is_err() {
                                        break;
                                    }
                                }
                                Err(broadcast::error::RecvError::Closed) => break,
                                Err(broadcast::error::RecvError::Lagged(_)) => continue,
                            }
                        }
                        let _ = subs.unsubscribe(sub_id).await;
                    });

                    Ok(())
                }
            },
        ).map_err(|e| RpcError::ServerError(format!("Failed to register consensus_subscribeValidatorStatus: {}", e)))?;

        // cvp_subscribeThreats
        let subs = subscriptions.clone();
        module.register_subscription(
            "cvp_subscribeThreats",
            "cvp_threat",
            "cvp_unsubscribeThreats",
            move |_params, pending, _ctx| {
                let subs = subs.clone();
                async move {
                    let sink = pending.accept().await.map_err(|_| "Failed to accept subscription")?;
                    let connection_id = format!("conn_{}", std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_nanos());

                    let (sub_id, mut receiver) = subs.subscribe_cvp_threats(connection_id).await;
                    drop(sink.send(SubscriptionMessage::from_json(&sub_id).unwrap()));

                    tokio::spawn(async move {
                        loop {
                            match receiver.recv().await {
                                Ok(threat) => {
                                    if sink.send(SubscriptionMessage::from_json(&threat).unwrap()).await.is_err() {
                                        break;
                                    }
                                }
                                Err(broadcast::error::RecvError::Closed) => break,
                                Err(broadcast::error::RecvError::Lagged(_)) => continue,
                            }
                        }
                        let _ = subs.unsubscribe(sub_id).await;
                    });

                    Ok(())
                }
            },
        ).map_err(|e| RpcError::ServerError(format!("Failed to register cvp_subscribeThreats: {}", e)))?;

        Ok(())
    }

    /// Stop the RPC server
    pub async fn stop(&mut self) -> Result<()> {
        if let Some(handle) = self.handle.take() {
            handle.stop().map_err(|e| RpcError::ServerError(e.to_string()))?;
        }
        Ok(())
    }
}

/// Every JSON-RPC method name this server registers (including subscription
/// subscribe/unsubscribe names). Kept in sync with `build_module` by a
/// runtime cross-check and by the tests below.
///
/// Invariant: apart from `author_submitExtrinsic` / `chain_submitTransaction`
/// (which only enqueue a signed, validated transaction), every method here is
/// read-only. There is no RPC path that writes storage directly.
pub fn registered_methods() -> Vec<&'static str> {
    vec![
        // chain
        "chain_getHealth",
        "chain_getBlockNumber",
        "chain_getBlock",
        "chain_getLatestBlock",
        "chain_getTransaction",
        "chain_getTransactionHistory",
        // author (signed tx submission)
        "author_submitExtrinsic",
        "chain_submitTransaction",
        "author_pendingExtrinsics",
        // network
        "network_getPeers",
        // balances
        "balances_getBalance",
        "balances_hasClaimedStarter",
        // consensus
        "consensus_getCurrentEra",
        "consensus_getValidators",
        "consensus_getValidator",
        "consensus_getStakingPool",
        "consensus_getStatus",
        "consensus_getPendingRewards",
        "consensus_getStakingStatus",
        "consensus_getValidatorInfo",
        // energy
        "energy_getEnergy",
        // session keys
        "sessionKeys_getActiveKeys",
        // drc369
        "drc369_ownerOf",
        "drc369_balanceOf",
        "drc369_tokenURI",
        "drc369_isSoulbound",
        "drc369_getDynamicState",
        "drc369_getTokenInfo",
        "drc369_totalSupply",
        "drc369_getPhysics",
        "drc369_hasPhysics",
        "drc369_getRoyalty",
        "drc369_hasRoyalty",
        "drc369_calculateRoyalty",
        "drc369_getCreator",
        "drc369_getStateBatch",
        // cvp
        "cvp_getStatus",
        "cvp_getBlockProof",
        "cvp_getBytecode",
        "cvp_getContractInfo",
        "cvp_getThreats",
        "cvp_getThreatStats",
        "cvp_getScheduledMutations",
        // subscriptions (subscribe + unsubscribe names)
        "chain_subscribeNewBlocks",
        "chain_unsubscribeNewBlocks",
        "chain_subscribeFinalizedBlocks",
        "chain_unsubscribeFinalizedBlocks",
        "chain_subscribeNewPendingTransactions",
        "chain_unsubscribePendingTransactions",
        "consensus_subscribeValidatorStatus",
        "consensus_unsubscribeValidatorStatus",
        "cvp_subscribeThreats",
        "cvp_unsubscribeThreats",
    ]
}

#[cfg(test)]
mod tests {
    use super::*;
    use demiurge_storage::MemoryStorage;

    /// The only methods allowed to change chain state: they enqueue a signed,
    /// validated transaction into the pool. Everything else must be read-only.
    const ALLOWED_WRITERS: &[&str] = &["author_submitExtrinsic", "chain_submitTransaction"];

    /// Does `name` look like a state-mutating method?
    /// Equivalent to the regex `transfer|mint|stake|register|set[A-Z]|authorize|insert|rotate`
    /// (word matches are case-insensitive; `set[A-Z]` is exact).
    fn looks_like_writer(name: &str) -> bool {
        let lower = name.to_ascii_lowercase();
        for word in ["transfer", "mint", "stake", "register", "authorize", "insert", "rotate"] {
            if lower.contains(word) {
                return true;
            }
        }
        name.as_bytes()
            .windows(4)
            .any(|w| &w[..3] == b"set" && w[3].is_ascii_uppercase())
    }

    #[test]
    fn no_unsigned_state_mutation_methods_are_registered() {
        let offenders: Vec<&str> = registered_methods()
            .into_iter()
            .filter(|m| looks_like_writer(m) && !ALLOWED_WRITERS.contains(m))
            .collect();
        assert!(
            offenders.is_empty(),
            "RPC exposes methods that mutate state without a signed transaction: {:?}",
            offenders
        );
    }

    #[test]
    fn signed_submission_path_is_registered() {
        let methods = registered_methods();
        for m in ALLOWED_WRITERS {
            assert!(methods.contains(m), "missing {}", m);
        }
    }

    #[test]
    fn registered_methods_has_no_duplicates() {
        let mut methods = registered_methods();
        let n = methods.len();
        methods.sort_unstable();
        methods.dedup();
        assert_eq!(n, methods.len(), "duplicate entries in registered_methods()");
    }

    #[test]
    fn registered_methods_matches_built_module() {
        let methods = Arc::new(RpcMethods::new(Arc::new(MemoryStorage::new())));
        let module = RpcServer::<MemoryStorage>::build_module(methods, create_subscription_manager())
            .expect("module builds and matches registered_methods()");
        let mut actual: Vec<&str> = module.method_names().collect();
        actual.sort_unstable();
        let mut expected = registered_methods();
        expected.sort_unstable();
        assert_eq!(actual, expected);
    }

    #[test]
    fn writer_heuristic_catches_the_removed_methods() {
        for removed in [
            "balances_transfer", "balances_claimStarter_mint", "admin_mint_cgt", "drc369_mint",
            "drc369_transfer", "drc369_setPhysics", "drc369_setRoyalty", "drc369_setStateOptimistic",
            "consensus_registerValidator", "consensus_stake", "consensus_unstake",
            "consensus_updateCommission_stake", "author_rotate_keys", "author_insert_key",
            "session_keys_authorize",
        ] {
            assert!(looks_like_writer(removed), "{} should be flagged", removed);
        }
        for ok in ["chain_getBlock", "consensus_getStakingPool", "drc369_getStateBatch", "cvp_getThreatStats"] {
            assert!(!looks_like_writer(ok), "{} should not be flagged", ok);
        }
    }
}
