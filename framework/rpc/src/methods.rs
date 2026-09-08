//! RPC methods implementation
//!
//! Provides the JSON-RPC API for the Demiurge blockchain including:
//! - Chain methods (`chain_*`) - Block and transaction queries
//! - Author methods (`author_*`) - Transaction submission
//! - DRC-369 methods (`drc369_*`) - NFT operations  
//! - CVP methods (`cvp_*`) - Consensus-Verified Polymorphism
//! - Consensus methods (`consensus_*`) - Validator and staking info
//! - Balance methods (`balances_*`) - Token balances
//!
//! All methods here are read-only except the `author_*` submission path, which
//! validates a signed `Transaction` and enqueues it in the transaction pool.
//! Nothing in this module writes to storage directly.

use crate::RpcError;
use demiurge_core::{Block, Transaction, Runtime};
use demiurge_storage::Storage;
use demiurge_consensus::ConsensusEngine;
use demiurge_network::TransactionPool;
use demiurge_module_energy::EnergyModule;
use codec::{Decode, Encode};
use std::sync::Arc;
use std::result::Result;
use tokio::sync::Mutex;
use serde::{Serialize, Deserialize};
use tracing;

/// RPC methods handler
pub struct RpcMethods<S: Storage> {
    storage: Arc<S>,
    runtime: Option<Arc<Mutex<Runtime<S>>>>,
    consensus: Option<Arc<Mutex<ConsensusEngine<S>>>>,
    tx_pool: Arc<Mutex<TransactionPool>>,
}

impl<S: Storage> RpcMethods<S> {
    /// Create new RPC methods with a transaction pool
    pub fn new(storage: Arc<S>) -> Self {
        Self {
            storage,
            runtime: None,
            consensus: None,
            tx_pool: Arc::new(Mutex::new(TransactionPool::new(10_000))), // 10k tx max
        }
    }
    
    /// Create new RPC methods with custom transaction pool
    pub fn with_tx_pool(storage: Arc<S>, tx_pool: Arc<Mutex<TransactionPool>>) -> Self {
        Self {
            storage,
            runtime: None,
            consensus: None,
            tx_pool,
        }
    }

    /// Set runtime reference
    pub fn set_runtime(&mut self, runtime: Arc<Mutex<Runtime<S>>>) {
        self.runtime = Some(runtime);
    }

    /// Set consensus reference
    pub fn set_consensus(&mut self, consensus: Arc<Mutex<ConsensusEngine<S>>>) {
        self.consensus = Some(consensus);
    }
    
    /// Get the transaction pool reference
    pub fn tx_pool(&self) -> Arc<Mutex<TransactionPool>> {
        self.tx_pool.clone()
    }

    // ========== Network Methods ==========

    /// Get connected P2P peers (for mesh verification)
    /// Returns peer IDs and connection info when network is available.
    pub async fn network_get_peers(&self) -> Result<Vec<PeerInfoResponse>, RpcError> {
        // Network is not yet wired to RPC methods - return empty for now.
        // Node service can inject network via set_network when available.
        Ok(vec![])
    }

    // ========== Chain Methods ==========

    /// Get chain health status
    pub async fn chain_get_health(&self) -> std::result::Result<ChainHealth, RpcError> {
        let block_number = self.get_block_number().await?;
        let connected = self.consensus.is_some();
        
        Ok(ChainHealth {
            connected,
            block_number,
            block_time: 1000, // 1 second default
            finality: 2000, // 2 seconds default
        })
    }

    /// Get block by number
    pub async fn chain_get_block_by_number(&self, number: u64) -> Result<Option<Block>, RpcError> {
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            consensus_guard.get_block_by_number(number)
                .map_err(|e| RpcError::StorageError(format!("Failed to get block: {:?}", e)))
        } else {
            Err(RpcError::NotImplemented)
        }
    }

    /// Get block by hash
    pub async fn chain_get_block_by_hash(&self, hash: [u8; 32]) -> Result<Option<Block>, RpcError> {
        // Get block number from hash first
        let hash_key = Self::block_hash_key(hash);
        match self.storage.get(&hash_key) {
            Some(value) => {
                let block_number = u64::decode(&mut &value[..])
                    .map_err(|e| RpcError::StorageError(format!("Failed to decode block number: {:?}", e)))?;
                self.chain_get_block_by_number(block_number).await
            }
            None => Ok(None),
        }
    }

    /// Get latest block
    pub async fn chain_get_latest_block(&self) -> Result<Block, RpcError> {
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            let block_number = consensus_guard.get_latest_block_number()
                .map_err(|e| RpcError::StorageError(format!("Failed to get latest block number: {:?}", e)))?;
            
            consensus_guard.get_block_by_number(block_number)
                .map_err(|e| RpcError::StorageError(format!("Failed to get block: {:?}", e)))?
                .ok_or_else(|| RpcError::NotFound("Latest block not found".to_string()))
        } else {
            Err(RpcError::NotImplemented)
        }
    }

    /// Get latest block number
    pub async fn chain_get_block_number(&self) -> Result<u64, RpcError> {
        self.get_block_number().await
    }

    /// Get transaction by hash
    pub async fn chain_get_transaction(&self, hash: [u8; 32]) -> Result<Option<Transaction>, RpcError> {
        // TODO: Store transactions by hash for efficient lookup
        // For now, scan blocks (inefficient but works)
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            let latest_block = consensus_guard.get_latest_block_number()
                .map_err(|e| RpcError::StorageError(format!("Failed to get latest block: {:?}", e)))?;
            
            // Scan last 100 blocks
            let start_block = latest_block.saturating_sub(100);
            for block_num in (start_block..=latest_block).rev() {
                if let Some(block) = consensus_guard.get_block_by_number(block_num)
                    .map_err(|e| RpcError::StorageError(format!("Failed to get block: {:?}", e)))? {
                    for tx in &block.transactions {
                        let tx_hash = Self::transaction_hash(tx);
                        if tx_hash == hash {
                            return Ok(Some(tx.clone()));
                        }
                    }
                }
            }
        }
        Ok(None)
    }

    /// Get transaction history for an account
    pub async fn chain_get_transaction_history(&self, address: [u8; 32], limit: u64) -> Result<Vec<TransactionInfo>, RpcError> {
        let mut transactions = Vec::new();
        
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            let latest_block = consensus_guard.get_latest_block_number()
                .map_err(|e| RpcError::StorageError(format!("Failed to get latest block: {:?}", e)))?;
            
            let start_block = latest_block.saturating_sub(limit);
            for block_num in (start_block..=latest_block).rev() {
                if transactions.len() >= limit as usize {
                    break;
                }
                
                if let Some(block) = consensus_guard.get_block_by_number(block_num)
                    .map_err(|e| RpcError::StorageError(format!("Failed to get block: {:?}", e)))? {
                    for tx in &block.transactions {
                        if tx.from == address {
                            let tx_hash = Self::transaction_hash(tx);
                            transactions.push(TransactionInfo {
                                hash: hex::encode(tx_hash),
                                from: hex::encode(tx.from),
                                to: None, // Extract from transaction data if available
                                amount: None, // Extract from transaction data if available
                                nonce: tx.nonce,
                                status: "finalized".to_string(),
                            });
                        }
                    }
                }
            }
        }
        
        Ok(transactions)
    }

    /// Submit transaction to the transaction pool
    /// 
    /// Validates the transaction signature and data before adding to pool.
    /// Returns the transaction hash on success.
    pub async fn chain_submit_transaction(&self, tx: Transaction) -> Result<String, RpcError> {
        // Validate transaction before adding to pool
        tx.validate()
            .map_err(|e| RpcError::InvalidTransaction(format!("{}", e)))?;
        
        // Calculate transaction hash
        let tx_hash = Self::transaction_hash(&tx);
        
        // Add to transaction pool
        let mut pool = self.tx_pool.lock().await;
        pool.add(tx)
            .map_err(|e| RpcError::InternalError(format!("Failed to add to pool: {:?}", e)))?;
        
        tracing::info!("Transaction submitted: {}", hex::encode(tx_hash));
        
        Ok(hex::encode(tx_hash))
    }
    
    /// Get pending transaction count in pool
    pub async fn chain_pending_transaction_count(&self) -> Result<usize, RpcError> {
        let pool = self.tx_pool.lock().await;
        Ok(pool.size())
    }
    
    /// Get pending transactions from pool (limited)
    pub async fn chain_get_pending_transactions(&self, limit: usize) -> Result<Vec<Transaction>, RpcError> {
        let pool = self.tx_pool.lock().await;
        Ok(pool.get_transactions(limit))
    }

    // ========== Balance Methods ==========

    /// Get account balance
    pub async fn balances_get_balance(&self, account: [u8; 32]) -> Result<String, RpcError> {
        let balance = self.get_balance(account).await?;
        Ok(balance.to_string())
    }

    /// Check if account has already claimed starter bonus
    pub async fn balances_has_claimed_starter(&self, account: [u8; 32]) -> Result<bool, RpcError> {
        let claim_key = Self::faucet_claim_key(account);
        Ok(self.storage.get(&claim_key).is_some())
    }

    /// Generate storage key for faucet claims
    fn faucet_claim_key(account: [u8; 32]) -> Vec<u8> {
        let mut key = b"Faucet:Claimed:".to_vec();
        key.extend_from_slice(&account);
        key
    }

    /// Admin view all transactions (for debugging/monitoring)
    pub async fn admin_get_recent_transactions(&self, limit: u64) -> Result<Vec<TransactionInfo>, RpcError> {
        let mut transactions = Vec::new();
        
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            let latest_block = consensus_guard.get_latest_block_number()
                .map_err(|e| RpcError::StorageError(format!("Failed to get latest block: {:?}", e)))?;
            
            let start_block = latest_block.saturating_sub(limit);
            for block_num in (start_block..=latest_block).rev() {
                if transactions.len() >= limit as usize {
                    break;
                }
                
                if let Some(block) = consensus_guard.get_block_by_number(block_num)
                    .map_err(|e| RpcError::StorageError(format!("Failed to get block: {:?}", e)))? {
                    for tx in &block.transactions {
                        let tx_hash = Self::transaction_hash(tx);
                        transactions.push(TransactionInfo {
                            hash: hex::encode(tx_hash),
                            from: hex::encode(tx.from),
                            to: None,
                            amount: None,
                            nonce: tx.nonce,
                            status: "finalized".to_string(),
                        });
                    }
                }
            }
        }
        
        Ok(transactions)
    }

    // ========== Consensus Methods ==========

    /// Get current era information
    pub async fn consensus_get_current_era(&self) -> Result<EraInfo, RpcError> {
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            let current_era = consensus_guard.current_era();
            let block_number = consensus_guard.get_latest_block_number()
                .map_err(|e| RpcError::StorageError(format!("Failed to get block number: {:?}", e)))?;
            let transaction_fees = consensus_guard.get_transaction_fees();
            
            // Get validators
            let validators: Vec<ValidatorInfo> = consensus_guard.validators.iter()
                .map(|(account, validator)| {
                    let public_key_hex = hex::encode(validator.public_key.to_bytes());
                    ValidatorInfo {
                        account: hex::encode(account),
                        stake: validator.stake.to_string(),
                        commission: validator.commission,
                        active: validator.active,
                        public_key: public_key_hex,
                    }
                })
                .collect();
            
            Ok(EraInfo {
                era: current_era,
                block_number,
                total_rewards: "0".to_string(), // Calculate from era
                transaction_fees: transaction_fees.to_string(),
                validators,
            })
        } else {
            Err(RpcError::NotImplemented)
        }
    }

    /// Get validator set
    pub async fn consensus_get_validators(&self) -> Result<Vec<ValidatorInfo>, RpcError> {
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            let validators: Vec<ValidatorInfo> = consensus_guard.validators.iter()
                .map(|(account, validator)| {
                    let public_key_hex = hex::encode(validator.public_key.to_bytes());
                    ValidatorInfo {
                        account: hex::encode(account),
                        stake: validator.stake.to_string(),
                        commission: validator.commission,
                        active: validator.active,
                        public_key: public_key_hex,
                    }
                })
                .collect();
            Ok(validators)
        } else {
            Ok(vec![])
        }
    }

    /// Get validator by account
    pub async fn consensus_get_validator(&self, account: [u8; 32]) -> Result<Option<ValidatorInfo>, RpcError> {
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            if let Some(validator) = consensus_guard.validators.get_validator(&account) {
                let public_key_hex = hex::encode(validator.public_key.to_bytes());
                Ok(Some(ValidatorInfo {
                    account: hex::encode(account),
                    stake: validator.stake.to_string(),
                    commission: validator.commission,
                    active: validator.active,
                    public_key: public_key_hex,
                }))
            } else {
                Ok(None)
            }
        } else {
            Ok(None)
        }
    }

    /// Get staking pool for validator
    pub async fn consensus_get_staking_pool(&self, validator_account: [u8; 32]) -> Result<Option<StakingPoolInfo>, RpcError> {
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            if let Some(pool) = consensus_guard.staking_pools.get(&validator_account) {
                let nominators: Vec<NominationInfo> = pool.stakes().iter()
                    .map(|(staker, stake)| {
                        NominationInfo {
                            account: hex::encode(staker),
                            stake: stake.amount.to_string(),
                            era: stake.era,
                        }
                    })
                    .collect();
                
                Ok(Some(StakingPoolInfo {
                    validator: hex::encode(validator_account),
                    total_stake: pool.total_stake().to_string(),
                    nominators,
                    commission: pool.commission(),
                }))
            } else {
                Ok(None)
            }
        } else {
            Ok(None)
        }
    }

    /// Get consensus status
    pub async fn consensus_get_status(&self) -> Result<ConsensusStatus, RpcError> {
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            let current_era = consensus_guard.current_era();
            let block_number = consensus_guard.get_latest_block_number()
                .map_err(|e| RpcError::StorageError(format!("Failed to get block number: {:?}", e)))?;
            let validators_count = consensus_guard.validators.count();
            let total_stake = consensus_guard.validators.total_stake();
            let transaction_fees = consensus_guard.get_transaction_fees();
            
            Ok(ConsensusStatus {
                current_era,
                block_number,
                validators: validators_count,
                total_stake: total_stake.to_string(),
                transaction_fees: transaction_fees.to_string(),
            })
        } else {
            Err(RpcError::NotImplemented)
        }
    }

    /// Get pending rewards for an address
    /// 
    /// Returns the total pending rewards and breakdown by validator.
    pub async fn consensus_get_pending_rewards(
        &self,
        address_hex: String,
        _validator_hex: Option<String>,
    ) -> Result<PendingRewardsInfo, RpcError> {
        let address: [u8; 32] = hex::decode(&address_hex)
            .map_err(|_| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        
        // Get total pending rewards
        let rewards_key = Self::pending_rewards_key(address);
        let total_rewards: u128 = self.storage.get(&rewards_key)
            .and_then(|v| {
                if v.len() >= 16 {
                    Some(u128::from_le_bytes(v[..16].try_into().unwrap()))
                } else {
                    None
                }
            })
            .unwrap_or(0);
        
        // Get breakdown by validator (simplified - would need proper storage iteration)
        let breakdown = Vec::new(); // TODO: Implement per-validator breakdown
        
        Ok(PendingRewardsInfo {
            total: total_rewards.to_string(),
            breakdown,
        })
    }

    /// Get staking status for an account
    /// 
    /// Returns comprehensive staking information including whether the account
    /// is a validator, total staked amount, nominations, and pending rewards.
    pub async fn consensus_get_staking_status(
        &self,
        address_hex: String,
    ) -> Result<StakingStatusInfo, RpcError> {
        let address: [u8; 32] = hex::decode(&address_hex)
            .map_err(|_| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        
        // Check if address is a validator
        let is_validator = if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            consensus_guard.validators.get_validator(&address).is_some()
        } else {
            false
        };
        
        // Get total staked (as validator or nominator)
        let staked_key = Self::total_staked_key(address);
        let total_staked: u128 = self.storage.get(&staked_key)
            .and_then(|v| {
                if v.len() >= 16 {
                    Some(u128::from_le_bytes(v[..16].try_into().unwrap()))
                } else {
                    None
                }
            })
            .unwrap_or(0);
        
        // Get pending rewards
        let rewards_key = Self::pending_rewards_key(address);
        let pending_rewards: u128 = self.storage.get(&rewards_key)
            .and_then(|v| {
                if v.len() >= 16 {
                    Some(u128::from_le_bytes(v[..16].try_into().unwrap()))
                } else {
                    None
                }
            })
            .unwrap_or(0);
        
        // Get nominations (simplified)
        let nominations = Vec::new(); // TODO: Implement nomination lookup
        
        // Get unbonding entries (simplified)
        let unbonding = Vec::new(); // TODO: Implement unbonding lookup
        
        Ok(StakingStatusInfo {
            is_validator,
            total_staked: total_staked.to_string(),
            nominations,
            pending_rewards: pending_rewards.to_string(),
            unbonding,
        })
    }

    // ========== Consensus Helper Methods ==========

    /// Generate storage key for pending rewards
    fn pending_rewards_key(account: [u8; 32]) -> Vec<u8> {
        let mut key = b"Consensus:PendingRewards:".to_vec();
        key.extend_from_slice(&account);
        key
    }

    /// Generate storage key for total staked amount
    fn total_staked_key(account: [u8; 32]) -> Vec<u8> {
        let mut key = b"Consensus:TotalStaked:".to_vec();
        key.extend_from_slice(&account);
        key
    }

    // ========== DRC-369 Methods (Dynamic NFT Standard) ==========

    /// Get DRC-369 token owner
    /// 
    /// Returns the current owner of the specified token ID.
    pub async fn drc369_owner_of(&self, token_id: String) -> Result<Option<String>, RpcError> {
        let token_id_u256 = self.parse_token_id(&token_id)?;
        
        // Query storage for token owner
        let key = Self::drc369_owner_key(token_id_u256);
        match self.storage.get(&key) {
            Some(value) if value.len() == 32 => {
                let mut owner = [0u8; 32];
                owner.copy_from_slice(&value);
                if owner == [0u8; 32] {
                    Ok(None) // Token doesn't exist
                } else {
                    Ok(Some(hex::encode(owner)))
                }
            }
            _ => Ok(None),
        }
    }
    
    /// Get DRC-369 balance for an address
    pub async fn drc369_balance_of(&self, owner_hex: String) -> Result<String, RpcError> {
        let owner: [u8; 32] = hex::decode(&owner_hex)
            .map_err(|_| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        
        let key = Self::drc369_balance_key(owner);
        match self.storage.get(&key) {
            Some(value) => {
                let balance = u128::decode(&mut &value[..])
                    .map_err(|e| RpcError::StorageError(format!("Failed to decode balance: {:?}", e)))?;
                Ok(balance.to_string())
            }
            None => Ok("0".to_string()),
        }
    }
    
    /// Get DRC-369 token metadata/URI
    pub async fn drc369_token_uri(&self, token_id: String) -> Result<Option<String>, RpcError> {
        let token_id_u256 = self.parse_token_id(&token_id)?;
        
        let key = Self::drc369_uri_key(token_id_u256);
        match self.storage.get(&key) {
            Some(value) => {
                let uri = String::from_utf8(value)
                    .map_err(|e| RpcError::StorageError(format!("Invalid URI: {:?}", e)))?;
                Ok(Some(uri))
            }
            None => Ok(None),
        }
    }
    
    /// Check if a DRC-369 token is soulbound
    pub async fn drc369_is_soulbound(&self, token_id: String) -> Result<bool, RpcError> {
        let token_id_u256 = self.parse_token_id(&token_id)?;
        
        let key = Self::drc369_soulbound_key(token_id_u256);
        match self.storage.get(&key) {
            Some(value) => Ok(!value.is_empty() && value[0] != 0),
            None => Ok(false),
        }
    }
    
    /// Get DRC-369 dynamic state for a token
    /// 
    /// Returns the current value of a dynamic state key for the token.
    /// Supports both hex keys and path notation (e.g., "stats/damage").
    pub async fn drc369_get_dynamic_state(&self, token_id: String, state_key: String) -> Result<Option<String>, RpcError> {
        let token_id_u256 = self.parse_token_id(&token_id)?;
        
        // Support both hex and path notation
        let state_key_bytes = if state_key.contains('/') || state_key.chars().all(|c| c.is_alphanumeric() || c == '_') {
            // Path notation: "stats/damage" -> hash it for storage key
            state_key.as_bytes().to_vec()
        } else {
            // Hex notation
            hex::decode(&state_key).map_err(|_| RpcError::InvalidParams)?
        };
        
        let key = Self::drc369_dynamic_state_key(token_id_u256, &state_key_bytes);
        match self.storage.get(&key) {
            Some(value) => {
                // Try to decode as UTF-8 string, fall back to hex
                match String::from_utf8(value.clone()) {
                    Ok(s) => Ok(Some(s)),
                    Err(_) => Ok(Some(hex::encode(value))),
                }
            },
            None => Ok(None),
        }
    }
    
    /// Get DRC-369 state tree for a token
    /// 
    /// Returns all state values under a given path prefix.
    /// Example: `drc369_getStateTree(tokenId, "stats/")` returns all stats.
    pub async fn drc369_get_state_tree(&self, token_id: String, path_prefix: String) -> Result<Drc369StateTree, RpcError> {
        let token_id_u256 = self.parse_token_id(&token_id)?;
        
        // Build the full storage key prefix for this token's state
        // Format: "DRC369:State:{token_id}:{path_prefix}"
        let mut prefix_key = b"DRC369:State:".to_vec();
        prefix_key.extend_from_slice(&token_id_u256);
        prefix_key.push(b':');
        prefix_key.extend_from_slice(path_prefix.as_bytes());
        
        // Use storage prefix iteration to find all matching entries
        let mut entries: Vec<Drc369StateEntry> = Vec::new();
        
        // The Storage trait's prefix_iter returns (key, value) pairs in order
        for (key, value) in self.storage.prefix_iter(&prefix_key) {
            // Extract the path from the full key
            // Key format: "DRC369:State:{token_id}:{path}"
            let base_prefix = format!("DRC369:State:{}:", hex::encode(token_id_u256));
            let base_prefix_bytes = base_prefix.as_bytes();
            
            if key.len() > base_prefix_bytes.len() {
                let path = String::from_utf8_lossy(&key[base_prefix_bytes.len()..]).to_string();
                
                // Determine value type and convert to string
                let (value_str, value_type) = match String::from_utf8(value.clone()) {
                    Ok(s) => {
                        // Try to parse as JSON to determine type
                        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&s) {
                            match json {
                                serde_json::Value::Number(_) => (s, "number".to_string()),
                                serde_json::Value::Bool(_) => (s, "boolean".to_string()),
                                serde_json::Value::Object(_) => (s, "object".to_string()),
                                serde_json::Value::Array(_) => (s, "array".to_string()),
                                _ => (s, "string".to_string()),
                            }
                        } else {
                            (s, "string".to_string())
                        }
                    },
                    Err(_) => (hex::encode(&value), "bytes".to_string()),
                };
                
                entries.push(Drc369StateEntry {
                    path,
                    value: value_str,
                    value_type,
                });
            }
        }
        
        let total_count = entries.len();
        
        Ok(Drc369StateTree {
            token_id,
            path_prefix,
            entries,
            total_count,
        })
    }
    
    /// Batch get DRC-369 state values
    /// 
    /// Efficiently retrieves multiple state values in a single call.
    /// Critical for game engine performance.
    pub async fn drc369_get_state_batch(&self, token_id: String, paths: Vec<String>) -> Result<Vec<Drc369StateBatchEntry>, RpcError> {
        let token_id_u256 = self.parse_token_id(&token_id)?;
        
        let mut results = Vec::with_capacity(paths.len());
        
        for path in paths {
            let state_key_bytes = path.as_bytes().to_vec();
            let key = Self::drc369_dynamic_state_key(token_id_u256, &state_key_bytes);
            
            let value = match self.storage.get(&key) {
                Some(v) => {
                    match String::from_utf8(v.clone()) {
                        Ok(s) => Some(s),
                        Err(_) => Some(hex::encode(v)),
                    }
                },
                None => None,
            };
            
            results.push(Drc369StateBatchEntry {
                path,
                value,
            });
        }
        
        Ok(results)
    }
    
    /// Get DRC-369 token full info
    /// 
    /// Returns comprehensive information about a token including
    /// owner, metadata, soulbound status, and CVP protection status.
    pub async fn drc369_get_token_info(&self, token_id: String) -> Result<Option<Drc369TokenInfo>, RpcError> {
        let token_id_u256 = self.parse_token_id(&token_id)?;
        
        // Check if token exists
        let owner_key = Self::drc369_owner_key(token_id_u256);
        let owner = match self.storage.get(&owner_key) {
            Some(value) if value.len() == 32 => {
                let mut owner = [0u8; 32];
                owner.copy_from_slice(&value);
                if owner == [0u8; 32] {
                    return Ok(None);
                }
                hex::encode(owner)
            }
            _ => return Ok(None),
        };
        
        // Get URI
        let uri_key = Self::drc369_uri_key(token_id_u256);
        let token_uri = self.storage.get(&uri_key)
            .and_then(|v| String::from_utf8(v).ok());
        
        // Check soulbound
        let soulbound_key = Self::drc369_soulbound_key(token_id_u256);
        let is_soulbound = self.storage.get(&soulbound_key)
            .map(|v| !v.is_empty() && v[0] != 0)
            .unwrap_or(false);
        
        // Get parent token (nesting)
        let parent_key = Self::drc369_parent_key(token_id_u256);
        let parent_token_id = self.storage.get(&parent_key)
            .and_then(|v| {
                if v.len() >= 32 {
                    let mut val = [0u8; 32];
                    val.copy_from_slice(&v[..32]);
                    if val != [0u8; 32] {
                        Some(hex::encode(val))
                    } else {
                        None
                    }
                } else {
                    None
                }
            });
        
        Ok(Some(Drc369TokenInfo {
            token_id,
            owner,
            token_uri,
            is_soulbound,
            parent_token_id,
            cvp_protected: true, // DRC-369 is always CVP protected
        }))
    }
    
    /// Get total supply of DRC-369 tokens
    pub async fn drc369_total_supply(&self) -> Result<String, RpcError> {
        let key = b"DRC369:TotalSupply".to_vec();
        match self.storage.get(&key) {
            Some(value) => {
                let supply = u128::decode(&mut &value[..])
                    .map_err(|e| RpcError::StorageError(format!("Failed to decode supply: {:?}", e)))?;
                Ok(supply.to_string())
            }
            None => Ok("0".to_string()),
        }
    }
    
    // ========== DRC-369 Physics Methods ==========
    
    /// Get physics properties for a DRC-369 token
    /// 
    /// Returns physics-ready metadata for game engine integration.
    /// Includes rigid body, material, thermal, and destruction properties.
    pub async fn drc369_get_physics(&self, token_id: String) -> Result<Option<Drc369PhysicsInfo>, RpcError> {
        let token_id_u256 = self.parse_token_id(&token_id)?;
        
        // Check if token exists
        let owner_key = Self::drc369_owner_key(token_id_u256);
        if self.storage.get(&owner_key).is_none() {
            return Ok(None);
        }
        
        // Get physics data
        let physics_key = Self::drc369_physics_key(token_id_u256);
        match self.storage.get(&physics_key) {
            Some(bytes) => {
                // Try to parse physics properties
                match serde_json::from_slice::<serde_json::Value>(&bytes) {
                    Ok(physics_json) => {
                        Ok(Some(Drc369PhysicsInfo {
                            token_id,
                            has_physics: true,
                            physics: Some(physics_json),
                            simulation_ready: true, // TODO: Actually validate
                        }))
                    }
                    Err(_) => {
                        Ok(Some(Drc369PhysicsInfo {
                            token_id,
                            has_physics: true,
                            physics: None,
                            simulation_ready: false,
                        }))
                    }
                }
            }
            None => {
                Ok(Some(Drc369PhysicsInfo {
                    token_id,
                    has_physics: false,
                    physics: None,
                    simulation_ready: false,
                }))
            }
        }
    }
    
    /// Check if a token has physics properties
    pub async fn drc369_has_physics(&self, token_id: String) -> Result<bool, RpcError> {
        let token_id_u256 = self.parse_token_id(&token_id)?;
        let physics_key = Self::drc369_physics_key(token_id_u256);
        Ok(self.storage.get(&physics_key).is_some())
    }
    
    // ========== DRC-369 Royalty Methods ==========
    
    /// Get royalty configuration for a token
    /// 
    /// Returns the royalty recipient and percentage (in basis points, 100 = 1%)
    pub async fn drc369_get_royalty(&self, token_id: String) -> Result<Option<Drc369RoyaltyInfo>, RpcError> {
        let token_id_u256 = self.parse_token_id(&token_id)?;
        
        // Check if token exists
        let owner_key = Self::drc369_owner_key(token_id_u256);
        if self.storage.get(&owner_key).is_none() {
            return Ok(None);
        }
        
        // Get royalty config
        let royalty_key = Self::drc369_royalty_key(token_id_u256);
        match self.storage.get(&royalty_key) {
            Some(bytes) if bytes.len() >= 34 => {
                // Decode: 32 bytes recipient + 2 bytes percentage_bps
                let mut recipient = [0u8; 32];
                recipient.copy_from_slice(&bytes[0..32]);
                let percentage_bps = u16::from_le_bytes([bytes[32], bytes[33]]);
                
                Ok(Some(Drc369RoyaltyInfo {
                    token_id,
                    recipient: format!("0x{}", hex::encode(recipient)),
                    percentage_bps,
                    percentage_display: format!("{}%", percentage_bps as f64 / 100.0),
                }))
            }
            _ => Ok(None),
        }
    }
    
    /// Check if a token has royalty configured
    pub async fn drc369_has_royalty(&self, token_id: String) -> Result<bool, RpcError> {
        let token_id_u256 = self.parse_token_id(&token_id)?;
        let royalty_key = Self::drc369_royalty_key(token_id_u256);
        Ok(self.storage.get(&royalty_key).map(|v| v.len() >= 34).unwrap_or(false))
    }
    
    /// Calculate royalty for a given sale price
    pub async fn drc369_calculate_royalty(
        &self,
        token_id: String,
        sale_price: String,
    ) -> Result<Drc369RoyaltyCalculation, RpcError> {
        let token_id_u256 = self.parse_token_id(&token_id)?;
        let price: u128 = sale_price.parse()
            .map_err(|_| RpcError::InvalidParams)?;
        
        // Get royalty config
        let royalty_key = Self::drc369_royalty_key(token_id_u256);
        let (royalty_amount, seller_amount, recipient) = match self.storage.get(&royalty_key) {
            Some(bytes) if bytes.len() >= 34 => {
                let mut recipient = [0u8; 32];
                recipient.copy_from_slice(&bytes[0..32]);
                let percentage_bps = u16::from_le_bytes([bytes[32], bytes[33]]);
                
                let royalty = (price * percentage_bps as u128) / 10000;
                let seller = price.saturating_sub(royalty);
                
                (royalty, seller, Some(format!("0x{}", hex::encode(recipient))))
            }
            _ => (0, price, None),
        };
        
        Ok(Drc369RoyaltyCalculation {
            token_id,
            sale_price,
            royalty_amount: royalty_amount.to_string(),
            seller_receives: seller_amount.to_string(),
            royalty_recipient: recipient,
        })
    }
    
    /// Get the original creator of a token
    pub async fn drc369_get_creator(&self, token_id: String) -> Result<Option<String>, RpcError> {
        let token_id_u256 = self.parse_token_id(&token_id)?;
        let creator_key = Self::drc369_creator_key(token_id_u256);
        
        match self.storage.get(&creator_key) {
            Some(bytes) if bytes.len() == 32 => {
                Ok(Some(format!("0x{}", hex::encode(&bytes))))
            }
            _ => Ok(None),
        }
    }
    
    // ========== DRC-369 Storage Key Helpers ==========
    
    fn parse_token_id(&self, token_id: &str) -> Result<[u8; 32], RpcError> {
        // Support hex (0x...), numeric, and string-based (drc369_...) formats
        if let Some(hex_part) = token_id.strip_prefix("0x") {
            let bytes = hex::decode(hex_part)
                .map_err(|_| RpcError::InvalidParams)?;
            if bytes.len() > 32 {
                return Err(RpcError::InvalidParams);
            }
            let mut result = [0u8; 32];
            result[32 - bytes.len()..].copy_from_slice(&bytes);
            Ok(result)
        } else if let Ok(num) = token_id.parse::<u128>() {
            // Numeric format
            let mut result = [0u8; 32];
            result[16..].copy_from_slice(&num.to_be_bytes());
            Ok(result)
        } else {
            // String-based ID (e.g. "drc369_abc_def") — hash to 32 bytes deterministically
            use blake2::{Blake2b512, Digest};
            let mut hasher = Blake2b512::new();
            hasher.update(b"TOKEN_ID:");
            hasher.update(token_id.as_bytes());
            let hash = hasher.finalize();
            let mut result = [0u8; 32];
            result.copy_from_slice(&hash[..32]);
            Ok(result)
        }
    }
    
    fn drc369_owner_key(token_id: [u8; 32]) -> Vec<u8> {
        let mut key = b"DRC369:Owner:".to_vec();
        key.extend_from_slice(&token_id);
        key
    }
    
    fn drc369_balance_key(owner: [u8; 32]) -> Vec<u8> {
        let mut key = b"DRC369:Balance:".to_vec();
        key.extend_from_slice(&owner);
        key
    }
    
    fn drc369_uri_key(token_id: [u8; 32]) -> Vec<u8> {
        let mut key = b"DRC369:URI:".to_vec();
        key.extend_from_slice(&token_id);
        key
    }
    
    fn drc369_soulbound_key(token_id: [u8; 32]) -> Vec<u8> {
        let mut key = b"DRC369:Soulbound:".to_vec();
        key.extend_from_slice(&token_id);
        key
    }
    
    fn drc369_dynamic_state_key(token_id: [u8; 32], state_key: &[u8]) -> Vec<u8> {
        let mut key = b"DRC369:State:".to_vec();
        key.extend_from_slice(&token_id);
        key.push(b':');
        key.extend_from_slice(state_key);
        key
    }
    
    fn drc369_physics_key(token_id: [u8; 32]) -> Vec<u8> {
        let mut key = b"DRC369:Physics:".to_vec();
        key.extend_from_slice(&token_id);
        key
    }
    
    fn drc369_royalty_key(token_id: [u8; 32]) -> Vec<u8> {
        let mut key = b"DRC369:Royalty:".to_vec();
        key.extend_from_slice(&token_id);
        key
    }
    
    fn drc369_creator_key(token_id: [u8; 32]) -> Vec<u8> {
        let mut key = b"DRC369:Creator:".to_vec();
        key.extend_from_slice(&token_id);
        key
    }
    
    fn drc369_parent_key(token_id: [u8; 32]) -> Vec<u8> {
        let mut key = b"DRC369:Parent:".to_vec();
        key.extend_from_slice(&token_id);
        key
    }
    
    // ========== CVP Methods (Consensus-Verified Polymorphism) ==========

    /// Get CVP status and statistics
    /// 
    /// Returns information about the Archon CVP system including:
    /// - Whether CVP is enabled
    /// - Current epoch number
    /// - Number of registered contracts
    /// - Total mutations performed
    /// - Epoch length and next transition block
    pub async fn cvp_get_status(&self) -> Result<CvpStatus, RpcError> {
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            let stats = consensus_guard.cvp_stats();
            
            // Calculate next epoch block from current epoch
            let epoch_length = stats.epoch_length;
            let next_epoch_block = (stats.current_epoch + 1) * epoch_length;
            
            Ok(CvpStatus {
                enabled: stats.enabled,
                current_epoch: stats.current_epoch,
                registered_contracts: stats.registered_contracts,
                total_mutations: stats.total_mutations,
                threats_detected: stats.threats_detected,
                pending_proofs: stats.pending_proofs,
                epoch_length,
                next_epoch_block,
                proof_system: format!("{:?}", stats.proof_system),
            })
        } else {
            Err(RpcError::NotImplemented)
        }
    }
    
    /// Get CVP proof information for a specific block
    /// 
    /// Returns information about CVP proofs committed in a block header,
    /// useful for verifying epoch transitions.
    pub async fn cvp_get_block_proof(&self, block_number: u64) -> Result<CvpBlockProofInfo, RpcError> {
        // Get the block from storage
        let block_key = format!("block:{}", block_number);
        let block_data = self.storage.get(block_key.as_bytes())
            .ok_or(RpcError::InvalidParams)?;
        
        let block: demiurge_core::Block = codec::Decode::decode(&mut &block_data[..])
            .map_err(|e| RpcError::InternalError(format!("Failed to decode block: {}", e)))?;
        
        // Get CVP config for epoch calculations
        let epoch_length = if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            consensus_guard.cvp_stats().epoch_length
        } else {
            100 // Default
        };
        
        let is_epoch_boundary = block_number > 0 && block_number.is_multiple_of(epoch_length);
        
        Ok(CvpBlockProofInfo {
            block_number,
            is_epoch_boundary,
            epoch: block.header.cvp_epoch,
            proof_root: block.header.cvp_proof_root.map(hex::encode),
            contracts_mutated: if block.header.cvp_proof_root.is_some() { 1 } else { 0 }, // Simplified
        })
    }
    
    /// Get CVP-protected bytecode for a contract
    /// 
    /// Returns the current mutated bytecode for a CVP-registered contract.
    /// This bytecode changes each epoch while maintaining semantic equivalence.
    pub async fn cvp_get_bytecode(&self, contract_id_hex: String) -> Result<Option<CvpBytecodeInfo>, RpcError> {
        let contract_id: [u8; 32] = hex::decode(&contract_id_hex)
            .map_err(|_| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            
            if let Some(bytecode) = consensus_guard.get_cvp_bytecode(&contract_id) {
                // Calculate bytecode hash
                use blake2::{Blake2b512, Digest};
                let mut hasher = Blake2b512::new();
                hasher.update(&bytecode);
                let hash = hasher.finalize();
                let mut bytecode_hash = [0u8; 32];
                bytecode_hash.copy_from_slice(&hash[..32]);
                
                Ok(Some(CvpBytecodeInfo {
                    contract_id: contract_id_hex,
                    bytecode: hex::encode(&bytecode),
                    bytecode_hash: hex::encode(bytecode_hash),
                    size: bytecode.len(),
                }))
            } else {
                Ok(None)
            }
        } else {
            Err(RpcError::NotImplemented)
        }
    }
    
    /// Get contract info from CVP
    /// 
    /// Returns metadata about a CVP-registered contract including
    /// mutation count, last mutation block, and proof status.
    pub async fn cvp_get_contract_info(&self, contract_id_hex: String) -> Result<Option<CvpContractInfo>, RpcError> {
        let contract_id: [u8; 32] = hex::decode(&contract_id_hex)
            .map_err(|_| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            
            // Get CVP stats to check if contract is registered
            if consensus_guard.get_cvp_bytecode(&contract_id).is_some() {
                // Contract is registered
                // TODO: Get detailed contract info from CVP engine
                Ok(Some(CvpContractInfo {
                    contract_id: contract_id_hex,
                    name: "Unknown".to_string(), // Would come from CVP engine
                    bytecode_size: 0,
                    mutation_count: 0,
                    last_mutation_block: 0,
                    has_proof: false,
                    proof_system: "TranslationValidation".to_string(),
                }))
            } else {
                Ok(None)
            }
        } else {
            Err(RpcError::NotImplemented)
        }
    }
    
    /// Check if a contract is CVP-protected
    pub async fn cvp_is_protected(&self, contract_id_hex: String) -> Result<bool, RpcError> {
        let contract_id: [u8; 32] = hex::decode(&contract_id_hex)
            .map_err(|_| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            Ok(consensus_guard.get_cvp_bytecode(&contract_id).is_some())
        } else {
            Err(RpcError::NotImplemented)
        }
    }
    
    // ========== Phase 5: CVP Threat Monitoring Methods ==========
    
    /// Get recent threat events detected by CVP
    /// 
    /// Returns the threat history with optional filtering by severity.
    /// Use this to monitor for attack patterns and reactive mutations.
    pub async fn cvp_get_threats(&self, query: Option<CvpThreatQuery>) -> Result<Vec<CvpThreatEvent>, RpcError> {
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            let threat_history = consensus_guard.get_threat_history();
            
            let query = query.unwrap_or(CvpThreatQuery {
                min_severity: None,
                limit: Some(100),
                offset: Some(0),
            });
            
            // Convert severity string to numeric for comparison
            let min_severity_level = match query.min_severity.as_deref() {
                Some("Critical") => 4,
                Some("High") => 3,
                Some("Medium") => 2,
                Some("Low") => 1,
                Some("Info") => 0,
                _ => 0,
            };
            
            // Convert severity enum value to numeric level for filtering
            let severity_to_level = |sev_str: &str| -> u8 {
                if sev_str.contains("Critical") { 4 }
                else if sev_str.contains("High") { 3 }
                else if sev_str.contains("Medium") { 2 }
                else if sev_str.contains("Low") { 1 }
                else { 0 }
            };
            
            let offset = query.offset.unwrap_or(0);
            let limit = query.limit.unwrap_or(100);
            
            let events: Vec<CvpThreatEvent> = threat_history
                .iter()
                .filter(|event| {
                    let sev_str = format!("{:?}", event.severity);
                    severity_to_level(&sev_str) >= min_severity_level
                })
                .skip(offset)
                .take(limit)
                .map(|event| CvpThreatEvent {
                    block_number: event.block_number,
                    threat_type: format!("{:?}", event.threat_type),
                    severity: format!("{:?}", event.severity),
                    description: event.description.clone(),
                    target_contract: event.target_contract.map(hex::encode),
                    mutation_triggered: event.mutation_triggered,
                    timestamp: event.timestamp,
                })
                .collect();
            
            Ok(events)
        } else {
            Err(RpcError::NotImplemented)
        }
    }
    
    /// Get CVP threat statistics
    /// 
    /// Returns aggregated statistics about detected threats, including
    /// breakdowns by type and severity, and reactive mutation counts.
    pub async fn cvp_get_threat_stats(&self) -> Result<CvpThreatStats, RpcError> {
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            let stats = consensus_guard.get_threat_stats();
            
            // Stats already have String keys from consensus engine
            Ok(CvpThreatStats {
                total_threats: stats.total_threats,
                by_type: stats.threats_by_type,
                by_severity: stats.threats_by_severity,
                mutations_triggered: stats.mutations_triggered,
                scheduled_mutations: stats.scheduled_mutations,
            })
        } else {
            Err(RpcError::NotImplemented)
        }
    }
    
    /// Get scheduled reactive mutations
    /// 
    /// Returns a list of contracts with pending scheduled mutations and
    /// the block number when the mutation will be executed.
    pub async fn cvp_get_scheduled_mutations(&self) -> Result<Vec<(String, u64)>, RpcError> {
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            let _stats = consensus_guard.get_threat_stats();
            
            // Note: For full implementation, we'd need to expose scheduled_mutations HashMap
            // For now, just return the count
            Ok(Vec::new()) // TODO: Return actual scheduled mutations
        } else {
            Err(RpcError::NotImplemented)
        }
    }

    // ========== Energy Methods ==========

    /// Get energy for account
    pub async fn energy_get_energy(&self, account: [u8; 32]) -> Result<EnergyInfo, RpcError> {
        // Get energy from storage
        let energy = EnergyModule::get_energy(&*self.storage, account)
            .map_err(|e| RpcError::StorageError(format!("Failed to get energy: {:?}", e)))?;
        
        // Get last update block
        let last_update_key = Self::energy_last_update_key(account);
        let last_update = self.storage.get(&last_update_key)
            .and_then(|v| u64::decode(&mut &v[..]).ok())
            .unwrap_or(0);
        
        // Get current block
        let _current_block = self.get_block_number().await?;
        
        Ok(EnergyInfo {
            current: energy,
            max: 1000, // MAX_ENERGY constant
            regeneration_rate: 10, // REGENERATION_RATE constant
            last_update,
        })
    }

    // ========== Author Methods (Transaction Submission) ==========

    /// Submit a signed transaction to the transaction pool
    /// 
    /// This is the primary method for submitting transactions to the chain.
    /// Returns the transaction hash on success.
    pub async fn author_submit_extrinsic(&self, tx_hex: String) -> Result<String, RpcError> {
        // Decode transaction from hex
        let tx_bytes = hex::decode(&tx_hex)
            .map_err(|_| RpcError::InvalidParams)?;
        
        let tx = Transaction::decode(&mut &tx_bytes[..])
            .map_err(|_| RpcError::InvalidParams)?;
        
        // Validate basic transaction structure
        tx.validate()
            .map_err(|e| RpcError::InvalidTransaction(format!("{:?}", e)))?;
        
        // Calculate transaction hash
        let tx_hash = Self::transaction_hash(&tx);
        
        // Save sender before moving tx into the pool
        let sender = tx.from;
        
        // Add to transaction pool for inclusion in the next block
        let mut pool = self.tx_pool.lock().await;
        pool.add(tx)
            .map_err(|e| RpcError::InternalError(format!("Failed to add to transaction pool: {:?}", e)))?;
        
        tracing::info!(
            "Transaction submitted to pool: {} from {} (pool size: {})",
            hex::encode(&tx_hash[..8]),
            hex::encode(&sender[..8]),
            pool.size()
        );
        
        Ok(hex::encode(tx_hash))
    }
    
    /// Submit and watch a transaction
    /// 
    /// Submits a transaction and returns a subscription ID for tracking its status.
    pub async fn author_submit_and_watch(&self, tx_hex: String) -> Result<AuthorSubmitResult, RpcError> {
        // Submit the transaction
        let tx_hash = self.author_submit_extrinsic(tx_hex).await?;
        
        // Generate subscription ID for tracking
        let subscription_id = format!("tx_{}", &tx_hash[..16]);
        
        Ok(AuthorSubmitResult {
            tx_hash,
            subscription_id,
            status: "pending".to_string(),
        })
    }
    
    /// Get pending transactions in the pool
    ///
    /// Returns every transaction currently in the pool, hex-encoded (SCALE bytes),
    /// in pool order.
    pub async fn author_pending_extrinsics(&self) -> Result<Vec<String>, RpcError> {
        let pool = self.tx_pool.lock().await;
        let size = pool.size();
        Ok(pool
            .get_transactions(size)
            .iter()
            .map(|tx| hex::encode(tx.encode()))
            .collect())
    }
    
    /// Check if a transaction has been included in a block
    pub async fn author_has_extrinsic(&self, tx_hash_hex: String) -> Result<bool, RpcError> {
        let tx_hash: [u8; 32] = hex::decode(&tx_hash_hex)
            .map_err(|_| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        
        // Check if transaction exists
        let tx = self.chain_get_transaction(tx_hash).await?;
        Ok(tx.is_some())
    }
    
    /// Remove a pending transaction from the pool
    pub async fn author_remove_extrinsic(&self, tx_hash_hex: String) -> Result<bool, RpcError> {
        let _tx_hash: [u8; 32] = hex::decode(&tx_hash_hex)
            .map_err(|_| RpcError::InvalidParams)?
            .try_into()
            .map_err(|_| RpcError::InvalidParams)?;
        
        // TODO: Remove from transaction pool
        Ok(false)
    }
    
    /// Check if the node has session keys
    pub async fn author_has_session_keys(&self, _public_keys: String) -> Result<bool, RpcError> {
        // TODO: Check keystore
        Ok(false)
    }

    // ========== Session Keys Methods ==========

    /// Get active session keys for account
    pub async fn session_keys_get_active_keys(&self, account: [u8; 32]) -> Result<Vec<SessionKeyInfo>, RpcError> {
        // Get current block
        let _account = account; // Use the account in future implementation
        let _current_block = self.get_block_number().await?;
        
        // Query session keys from storage
        // TODO: Implement proper session keys query
        // For now, return empty list
        Ok(vec![])
    }

    // ========== Helper Methods ==========

    /// Get latest block number (internal)
    async fn get_block_number(&self) -> Result<u64, RpcError> {
        if let Some(consensus) = &self.consensus {
            let consensus_guard = consensus.lock().await;
            consensus_guard.get_latest_block_number()
                .map_err(|e| RpcError::StorageError(format!("Failed to get block number: {:?}", e)))
        } else {
            // Fallback to storage
            let key = b"System:BlockNumber";
            match self.storage.get(key) {
                Some(value) => {
                    u64::decode(&mut &value[..])
                        .map_err(|e| RpcError::StorageError(format!("Failed to decode block number: {:?}", e)))
                }
                None => Ok(0),
            }
        }
    }

    /// Get account balance (internal)
    async fn get_balance(&self, account: [u8; 32]) -> Result<u128, RpcError> {
        let key = Self::balance_key(account);
        match self.storage.get(&key) {
            Some(value) => {
                <u128 as Decode>::decode(&mut &value[..])
                    .map_err(|e| RpcError::StorageError(format!("Failed to decode balance: {:?}", e)))
            }
            None => Ok(0),
        }
    }

    /// Generate storage key for account balance
    fn balance_key(account: [u8; 32]) -> Vec<u8> {
        let mut key = b"Balances:Account:".to_vec();
        key.extend_from_slice(&account);
        key
    }

    /// Generate storage key for block hash
    fn block_hash_key(hash: [u8; 32]) -> Vec<u8> {
        let mut key = b"BlockHash:".to_vec();
        key.extend_from_slice(&hash);
        key
    }

    /// Calculate transaction hash
    fn transaction_hash(tx: &Transaction) -> [u8; 32] {
        use blake2::{Blake2b512, Digest};
        let encoded = tx.encode();
        let hash = Blake2b512::digest(&encoded);
        let mut result = [0u8; 32];
        result.copy_from_slice(&hash[..32]);
        result
    }

    /// Generate storage key for energy last update
    fn energy_last_update_key(account: [u8; 32]) -> Vec<u8> {
        let mut key = b"Energy:LastUpdate:".to_vec();
        key.extend_from_slice(&account);
        key
    }
}

// ========== Response Types ==========

/// P2P peer info for network_getPeers response
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PeerInfoResponse {
    pub peer_id: String,
    pub address: String,
    pub connected: bool,
    pub last_seen: u64,
    pub block_height: u64,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ChainHealth {
    pub connected: bool,
    pub block_number: u64,
    pub block_time: u64,
    pub finality: u64,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct TransactionInfo {
    pub hash: String,
    pub from: String,
    pub to: Option<String>,
    pub amount: Option<String>,
    pub nonce: u64,
    pub status: String,
}

#[derive(Serialize, Deserialize)]
#[derive(Clone)]
pub struct EraInfo {
    pub era: u64,
    pub block_number: u64,
    pub total_rewards: String,
    pub transaction_fees: String,
    pub validators: Vec<ValidatorInfo>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ValidatorInfo {
    pub account: String,
    pub stake: String,
    pub commission: u8,
    pub active: bool,
    pub public_key: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct StakingPoolInfo {
    pub validator: String,
    pub total_stake: String,
    pub nominators: Vec<NominationInfo>,
    pub commission: u8,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct NominationInfo {
    pub account: String,
    pub stake: String,
    pub era: u64,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ConsensusStatus {
    pub current_era: u64,
    pub block_number: u64,
    pub validators: usize,
    pub total_stake: String,
    pub transaction_fees: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct EnergyInfo {
    pub current: u64,
    pub max: u64,
    pub regeneration_rate: u64,
    pub last_update: u64,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct SessionKeyInfo {
    pub session_key: String,
    pub expiry_block: u32,
}

/// Chain information
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ChainInfo {
    pub chain_name: String,
    pub chain_version: String,
    pub block_number: u64,
    pub block_hash: [u8; 32],
}

// ========== CVP Response Types ==========

/// CVP system status
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CvpStatus {
    /// Whether CVP is enabled
    pub enabled: bool,
    /// Current mutation epoch
    pub current_epoch: u64,
    /// Number of CVP-protected contracts
    pub registered_contracts: usize,
    /// Total mutations performed across all contracts
    pub total_mutations: u64,
    /// Total threats detected by the attack detector
    pub threats_detected: u64,
    /// Number of proofs pending inclusion in a block
    pub pending_proofs: usize,
    /// Epoch length (blocks between mutations)
    pub epoch_length: u64,
    /// Block number of next epoch transition
    pub next_epoch_block: u64,
    /// Proof system being used
    pub proof_system: String,
}

/// CVP epoch/proof information for a specific block
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CvpBlockProofInfo {
    /// Block number
    pub block_number: u64,
    /// Whether this block was an epoch boundary
    pub is_epoch_boundary: bool,
    /// CVP epoch number
    pub epoch: u64,
    /// CVP proof root (hex, if present)
    pub proof_root: Option<String>,
    /// Number of contracts mutated (if epoch boundary)
    pub contracts_mutated: usize,
}

/// CVP bytecode information
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CvpBytecodeInfo {
    /// Contract identifier (hex)
    pub contract_id: String,
    /// Current bytecode (hex)
    pub bytecode: String,
    /// Blake2b hash of the bytecode (hex)
    pub bytecode_hash: String,
    /// Size in bytes
    pub size: usize,
}

/// CVP contract information
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CvpContractInfo {
    /// Contract identifier (hex)
    pub contract_id: String,
    /// Contract name
    pub name: String,
    /// Current bytecode size
    pub bytecode_size: usize,
    /// Number of mutations performed
    pub mutation_count: u64,
    /// Block number of last mutation
    pub last_mutation_block: u64,
    /// Whether a valid proof exists for the current bytecode
    pub has_proof: bool,
    /// Proof system used (e.g., "Plonky2", "TranslationValidation")
    pub proof_system: String,
}

// ========== Phase 5: CVP Threat Detection Types ==========

/// A threat event from the CVP attack detector
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CvpThreatEvent {
    /// Block number where threat was detected
    pub block_number: u64,
    /// Threat type
    pub threat_type: String,
    /// Severity level (Info, Low, Medium, High, Critical)
    pub severity: String,
    /// Human-readable description
    pub description: String,
    /// Target contract (hex, if identified)
    pub target_contract: Option<String>,
    /// Whether a reactive mutation was triggered
    pub mutation_triggered: bool,
    /// Unix timestamp (milliseconds)
    pub timestamp: u64,
}

/// Threat detection statistics
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CvpThreatStats {
    /// Total threats in history window
    pub total_threats: u64,
    /// Breakdown by threat type
    pub by_type: std::collections::HashMap<String, u64>,
    /// Breakdown by severity
    pub by_severity: std::collections::HashMap<String, u64>,
    /// Total reactive mutations triggered
    pub mutations_triggered: u64,
    /// Currently scheduled mutations pending
    pub scheduled_mutations: usize,
}

/// Threat history query parameters
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CvpThreatQuery {
    /// Minimum severity to include (optional)
    pub min_severity: Option<String>,
    /// Maximum number of results (default: 100)
    pub limit: Option<usize>,
    /// Starting offset for pagination
    pub offset: Option<usize>,
}

// ========== DRC-369 Response Types ==========

/// DRC-369 token information
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Drc369TokenInfo {
    /// Token ID
    pub token_id: String,
    /// Current owner address (hex)
    pub owner: String,
    /// Token URI/metadata URL
    pub token_uri: Option<String>,
    /// Whether the token is soulbound (non-transferable)
    pub is_soulbound: bool,
    /// Parent token ID if nested (hex)
    pub parent_token_id: Option<String>,
    /// Whether the token contract is CVP-protected
    pub cvp_protected: bool,
}

/// DRC-369 physics information
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Drc369PhysicsInfo {
    /// Token ID
    pub token_id: String,
    /// Whether the token has physics properties
    pub has_physics: bool,
    /// Physics properties as JSON
    pub physics: Option<serde_json::Value>,
    /// Whether the physics can be used in game engines
    pub simulation_ready: bool,
}

/// DRC-369 royalty information
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Drc369RoyaltyInfo {
    pub token_id: String,
    pub recipient: String,
    pub percentage_bps: u16,
    pub percentage_display: String,
}

/// Royalty calculation result
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Drc369RoyaltyCalculation {
    pub token_id: String,
    pub sale_price: String,
    pub royalty_amount: String,
    pub seller_receives: String,
    pub royalty_recipient: Option<String>,
}

/// DRC-369 collection statistics
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Drc369CollectionStats {
    /// Total number of tokens minted
    pub total_supply: String,
    /// Number of unique holders
    pub holder_count: u64,
    /// Number of soulbound tokens
    pub soulbound_count: u64,
    /// Number of nested tokens
    pub nested_count: u64,
}

/// DRC-369 state tree response
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Drc369StateTree {
    /// Token ID
    pub token_id: String,
    /// Path prefix that was queried
    pub path_prefix: String,
    /// State entries under this path
    pub entries: Vec<Drc369StateEntry>,
    /// Total count of entries
    pub total_count: usize,
}

/// Single state entry in a tree
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Drc369StateEntry {
    /// Full path (e.g., "stats/damage")
    pub path: String,
    /// Value as string
    pub value: String,
    /// Value type hint
    pub value_type: String,
}

/// Batch state query result
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Drc369StateBatchEntry {
    /// Requested path
    pub path: String,
    /// Value if exists
    pub value: Option<String>,
}

// ========== Author Response Types ==========

/// Result of submitting a transaction
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AuthorSubmitResult {
    /// Transaction hash (hex)
    pub tx_hash: String,
    /// Subscription ID for tracking status
    pub subscription_id: String,
    /// Current status: "pending", "in_block", "finalized", "failed"
    pub status: String,
}

/// Transaction status update
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TransactionStatus {
    /// Transaction hash (hex)
    pub tx_hash: String,
    /// Current status
    pub status: String,
    /// Block hash if included (hex)
    pub block_hash: Option<String>,
    /// Block number if included
    pub block_number: Option<u64>,
    /// Error message if failed
    pub error: Option<String>,
}

// ========== Consensus Request/Response Types ==========

/// Pending rewards information
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PendingRewardsInfo {
    /// Total pending rewards (in Sparks)
    pub total: String,
    /// Breakdown by validator
    pub breakdown: Vec<RewardBreakdown>,
}

/// Reward breakdown by validator
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RewardBreakdown {
    /// Validator address
    pub validator: String,
    /// Pending rewards from this validator
    pub amount: String,
}

/// Staking status information
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct StakingStatusInfo {
    /// Whether the account is a validator
    pub is_validator: bool,
    /// Total amount staked
    pub total_staked: String,
    /// Active nominations
    pub nominations: Vec<NominationStatusInfo>,
    /// Total pending rewards
    pub pending_rewards: String,
    /// Unbonding entries
    pub unbonding: Vec<UnbondingEntry>,
}

/// Nomination status information
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NominationStatusInfo {
    /// Validator being nominated
    pub validator: String,
    /// Amount staked to this validator
    pub amount: String,
    /// Pending rewards from this validator
    pub rewards: String,
}

/// Unbonding entry
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UnbondingEntry {
    /// Amount being unbonded
    pub amount: String,
    /// Timestamp when tokens become available (milliseconds)
    pub available_at: u64,
}
