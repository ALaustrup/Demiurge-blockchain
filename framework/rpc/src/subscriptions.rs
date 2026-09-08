//! WebSocket subscription system for real-time blockchain events
//!
//! This module provides subscription management for:
//! - New blocks (chain_subscribeNewBlocks)
//! - New finalized blocks (chain_subscribeFinalizedBlocks)
//! - New pending transactions (chain_subscribeNewPendingTransactions)
//! - Account balance changes (chain_subscribeAccountBalance)
//! - Validator status changes (consensus_subscribeValidatorStatus)

use crate::RpcError;
use demiurge_core::{Block, Transaction};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use tokio::sync::broadcast;
use tokio::sync::RwLock;

/// Maximum number of events to buffer before dropping old ones
const CHANNEL_CAPACITY: usize = 1024;

/// Subscription types
#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub enum SubscriptionType {
    /// Subscribe to all new blocks
    NewBlocks,
    /// Subscribe to finalized blocks only
    FinalizedBlocks,
    /// Subscribe to new pending transactions
    NewPendingTransactions,
    /// Subscribe to balance changes for a specific account
    AccountBalance([u8; 32]),
    /// Subscribe to validator status changes
    ValidatorStatus(Option<[u8; 32]>),
    /// Subscribe to CVP threat events
    CvpThreats,
}

/// Block notification event
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BlockNotification {
    /// Block number
    pub number: u64,
    /// Block hash (hex)
    pub hash: String,
    /// Parent hash (hex)
    pub parent_hash: String,
    /// Block timestamp
    pub timestamp: u64,
    /// Number of transactions in block
    pub transaction_count: usize,
    /// Block author/validator (hex)
    pub author: String,
    /// Whether the block is finalized
    pub is_finalized: bool,
}

impl From<&Block> for BlockNotification {
    fn from(block: &Block) -> Self {
        BlockNotification {
            number: block.header.block_number,
            hash: hex::encode(block.hash()),
            parent_hash: hex::encode(block.header.parent_hash),
            timestamp: block.header.timestamp,
            transaction_count: block.transactions.len(),
            author: String::from("0x00"), // Author resolved at consensus layer
            is_finalized: false, // Updated separately
        }
    }
}

/// Transaction notification event
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TransactionNotification {
    /// Transaction hash (hex)
    pub hash: String,
    /// Sender address (hex)
    pub from: String,
    /// Receiver address (hex, if applicable)
    pub to: Option<String>,
    /// Transaction nonce
    pub nonce: u64,
    /// Status: pending, included, finalized
    pub status: String,
    /// Block number (if included)
    pub block_number: Option<u64>,
}

/// Balance change notification
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BalanceNotification {
    /// Account address (hex)
    pub account: String,
    /// New balance
    pub balance: String,
    /// Previous balance
    pub previous_balance: String,
    /// Change amount (positive or negative)
    pub change: String,
    /// Block number when change occurred
    pub block_number: u64,
    /// Transaction hash that caused the change (if applicable)
    pub tx_hash: Option<String>,
}

/// Validator status notification
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ValidatorNotification {
    /// Validator address (hex)
    pub validator: String,
    /// Event type: registered, activated, deactivated, jailed, unjailed, slashed
    pub event_type: String,
    /// Total stake after event
    pub stake: String,
    /// Block number
    pub block_number: u64,
    /// Additional details
    pub details: Option<String>,
}

/// CVP threat notification
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CvpThreatNotification {
    /// Block number where threat was detected
    pub block_number: u64,
    /// Threat type
    pub threat_type: String,
    /// Severity level
    pub severity: String,
    /// Description
    pub description: String,
    /// Target contract (hex)
    pub target_contract: Option<String>,
    /// Whether reactive mutation was triggered
    pub mutation_triggered: bool,
}

/// Generic subscription event
#[derive(Clone, Debug)]
pub enum SubscriptionEvent {
    NewBlock(BlockNotification),
    FinalizedBlock(BlockNotification),
    NewPendingTransaction(TransactionNotification),
    BalanceChange(BalanceNotification),
    ValidatorStatus(ValidatorNotification),
    CvpThreat(CvpThreatNotification),
}

/// Active subscription info
#[derive(Clone, Debug)]
pub struct Subscription {
    /// Unique subscription ID
    pub id: u64,
    /// Subscription type
    pub sub_type: SubscriptionType,
    /// Connection ID (for tracking)
    pub connection_id: String,
    /// Created timestamp
    pub created_at: u64,
}

/// Subscription manager for WebSocket events
pub struct SubscriptionManager {
    /// Active subscriptions by ID
    subscriptions: RwLock<HashMap<u64, Subscription>>,
    /// Event broadcaster for blocks
    block_sender: broadcast::Sender<BlockNotification>,
    /// Event broadcaster for finalized blocks
    finalized_block_sender: broadcast::Sender<BlockNotification>,
    /// Event broadcaster for transactions
    transaction_sender: broadcast::Sender<TransactionNotification>,
    /// Event broadcaster for balance changes
    balance_sender: broadcast::Sender<BalanceNotification>,
    /// Event broadcaster for validator events
    validator_sender: broadcast::Sender<ValidatorNotification>,
    /// Event broadcaster for CVP threats
    cvp_threat_sender: broadcast::Sender<CvpThreatNotification>,
    /// Next subscription ID
    next_id: AtomicU64,
}

impl SubscriptionManager {
    /// Create a new subscription manager
    pub fn new() -> Self {
        let (block_sender, _) = broadcast::channel(CHANNEL_CAPACITY);
        let (finalized_block_sender, _) = broadcast::channel(CHANNEL_CAPACITY);
        let (transaction_sender, _) = broadcast::channel(CHANNEL_CAPACITY);
        let (balance_sender, _) = broadcast::channel(CHANNEL_CAPACITY);
        let (validator_sender, _) = broadcast::channel(CHANNEL_CAPACITY);
        let (cvp_threat_sender, _) = broadcast::channel(CHANNEL_CAPACITY);

        Self {
            subscriptions: RwLock::new(HashMap::new()),
            block_sender,
            finalized_block_sender,
            transaction_sender,
            balance_sender,
            validator_sender,
            cvp_threat_sender,
            next_id: AtomicU64::new(1),
        }
    }

    /// Subscribe to new blocks
    pub async fn subscribe_new_blocks(&self, connection_id: String) -> (u64, broadcast::Receiver<BlockNotification>) {
        let id = self.next_id.fetch_add(1, Ordering::SeqCst);
        let receiver = self.block_sender.subscribe();
        
        let subscription = Subscription {
            id,
            sub_type: SubscriptionType::NewBlocks,
            connection_id,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
        };
        
        self.subscriptions.write().await.insert(id, subscription);
        (id, receiver)
    }

    /// Subscribe to finalized blocks
    pub async fn subscribe_finalized_blocks(&self, connection_id: String) -> (u64, broadcast::Receiver<BlockNotification>) {
        let id = self.next_id.fetch_add(1, Ordering::SeqCst);
        let receiver = self.finalized_block_sender.subscribe();
        
        let subscription = Subscription {
            id,
            sub_type: SubscriptionType::FinalizedBlocks,
            connection_id,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
        };
        
        self.subscriptions.write().await.insert(id, subscription);
        (id, receiver)
    }

    /// Subscribe to new pending transactions
    pub async fn subscribe_pending_transactions(&self, connection_id: String) -> (u64, broadcast::Receiver<TransactionNotification>) {
        let id = self.next_id.fetch_add(1, Ordering::SeqCst);
        let receiver = self.transaction_sender.subscribe();
        
        let subscription = Subscription {
            id,
            sub_type: SubscriptionType::NewPendingTransactions,
            connection_id,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
        };
        
        self.subscriptions.write().await.insert(id, subscription);
        (id, receiver)
    }

    /// Subscribe to balance changes for an account
    pub async fn subscribe_account_balance(&self, account: [u8; 32], connection_id: String) -> (u64, broadcast::Receiver<BalanceNotification>) {
        let id = self.next_id.fetch_add(1, Ordering::SeqCst);
        let receiver = self.balance_sender.subscribe();
        
        let subscription = Subscription {
            id,
            sub_type: SubscriptionType::AccountBalance(account),
            connection_id,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
        };
        
        self.subscriptions.write().await.insert(id, subscription);
        (id, receiver)
    }

    /// Subscribe to validator status changes
    pub async fn subscribe_validator_status(&self, validator: Option<[u8; 32]>, connection_id: String) -> (u64, broadcast::Receiver<ValidatorNotification>) {
        let id = self.next_id.fetch_add(1, Ordering::SeqCst);
        let receiver = self.validator_sender.subscribe();
        
        let subscription = Subscription {
            id,
            sub_type: SubscriptionType::ValidatorStatus(validator),
            connection_id,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
        };
        
        self.subscriptions.write().await.insert(id, subscription);
        (id, receiver)
    }

    /// Subscribe to CVP threat events
    pub async fn subscribe_cvp_threats(&self, connection_id: String) -> (u64, broadcast::Receiver<CvpThreatNotification>) {
        let id = self.next_id.fetch_add(1, Ordering::SeqCst);
        let receiver = self.cvp_threat_sender.subscribe();
        
        let subscription = Subscription {
            id,
            sub_type: SubscriptionType::CvpThreats,
            connection_id,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
        };
        
        self.subscriptions.write().await.insert(id, subscription);
        (id, receiver)
    }

    /// Unsubscribe from a subscription
    pub async fn unsubscribe(&self, subscription_id: u64) -> Result<bool, RpcError> {
        let mut subs = self.subscriptions.write().await;
        Ok(subs.remove(&subscription_id).is_some())
    }

    /// Get subscription info
    pub async fn get_subscription(&self, subscription_id: u64) -> Option<Subscription> {
        self.subscriptions.read().await.get(&subscription_id).cloned()
    }

    /// Get active subscription count
    pub async fn subscription_count(&self) -> usize {
        self.subscriptions.read().await.len()
    }

    /// Get all subscriptions for a connection
    pub async fn subscriptions_for_connection(&self, connection_id: &str) -> Vec<Subscription> {
        self.subscriptions
            .read()
            .await
            .values()
            .filter(|s| s.connection_id == connection_id)
            .cloned()
            .collect()
    }

    /// Remove all subscriptions for a connection (on disconnect)
    pub async fn remove_connection(&self, connection_id: &str) {
        let mut subs = self.subscriptions.write().await;
        subs.retain(|_, sub| sub.connection_id != connection_id);
    }

    // ========== Event Publishing Methods ==========

    /// Notify all subscribers of a new block
    pub fn notify_new_block(&self, block: &Block) {
        let notification = BlockNotification::from(block);
        // Ignore send errors (no subscribers)
        let _ = self.block_sender.send(notification);
    }

    /// Notify all subscribers of a finalized block
    pub fn notify_finalized_block(&self, block: &Block) {
        let mut notification = BlockNotification::from(block);
        notification.is_finalized = true;
        let _ = self.finalized_block_sender.send(notification);
    }

    /// Notify all subscribers of a new pending transaction
    pub fn notify_new_pending_transaction(&self, tx: &Transaction) {
        let notification = TransactionNotification {
            hash: hex::encode(tx.hash()),
            from: hex::encode(tx.from),
            to: None, // Extract from tx data if available
            nonce: tx.nonce,
            status: "pending".to_string(),
            block_number: None,
        };
        let _ = self.transaction_sender.send(notification);
    }

    /// Notify all subscribers of a transaction included in a block
    pub fn notify_new_transaction(&self, tx: &Transaction, block_number: u64) {
        let notification = TransactionNotification {
            hash: hex::encode(tx.hash()),
            from: hex::encode(tx.from),
            to: None,
            nonce: tx.nonce,
            status: "included".to_string(),
            block_number: Some(block_number),
        };
        let _ = self.transaction_sender.send(notification);
    }

    /// Notify subscribers of a balance change
    pub fn notify_balance_change(&self, notification: BalanceNotification) {
        let _ = self.balance_sender.send(notification);
    }

    /// Notify subscribers of a validator status change
    pub fn notify_validator_status(&self, notification: ValidatorNotification) {
        let _ = self.validator_sender.send(notification);
    }

    /// Notify subscribers of a CVP threat
    pub fn notify_cvp_threat(&self, notification: CvpThreatNotification) {
        let _ = self.cvp_threat_sender.send(notification);
    }
}

impl Default for SubscriptionManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Thread-safe subscription manager
pub type SharedSubscriptionManager = Arc<SubscriptionManager>;

/// Create a new shared subscription manager
pub fn create_subscription_manager() -> SharedSubscriptionManager {
    Arc::new(SubscriptionManager::new())
}
