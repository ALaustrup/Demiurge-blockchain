//! # Elastic Sharding - Dynamic Network Scaling
//!
//! This module implements dynamic sharding that automatically scales the blockchain
//! based on network load, without requiring manual intervention or hard forks.
//!
//! ## Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                         Shard Coordinator                               │
//! │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
//! │  │   Monitor    │──│   Analyzer   │──│   Executor   │                  │
//! │  │ (Metrics)    │  │ (Decisions)  │  │ (Operations) │                  │
//! │  └──────────────┘  └──────────────┘  └──────────────┘                  │
//! └─────────────────────────────────────────────────────────────────────────┘
//!                                    │
//!     ┌─────────────┬────────────────┼────────────────┬─────────────┐
//!     ▼             ▼                ▼                ▼             ▼
//! ┌────────┐   ┌────────┐       ┌────────┐       ┌────────┐   ┌────────┐
//! │ Shard  │   │ Shard  │       │ Shard  │       │ Shard  │   │ Shard  │
//! │   0    │   │   1    │  ...  │   N    │  ...  │   N+1  │   │   N+2  │
//! │(Beacon)│   │        │       │        │       │ (New)  │   │ (New)  │
//! └────────┘   └────────┘       └────────┘       └────────┘   └────────┘
//! ```
//!
//! ## Scaling Triggers
//!
//! - **Split**: When shard TPS exceeds threshold
//! - **Merge**: When combined load of adjacent shards is below threshold
//! - **Rebalance**: When transaction distribution is uneven
//!
//! ## Cross-Shard Communication
//!
//! Uses asynchronous message passing with receipts for reliability.

use std::collections::{HashMap, BTreeMap, VecDeque};
use codec::{Encode, Decode};

/// Unique identifier for a shard
pub type ShardId = u32;

/// Configuration for the sharding system
#[derive(Debug, Clone)]
pub struct ShardingConfig {
    /// Initial number of shards
    pub initial_shards: u32,
    /// Maximum number of shards
    pub max_shards: u32,
    /// Minimum number of shards
    pub min_shards: u32,
    /// TPS threshold to trigger split
    pub split_threshold_tps: u32,
    /// TPS threshold to trigger merge
    pub merge_threshold_tps: u32,
    /// Minimum blocks between scaling operations
    pub scaling_cooldown_blocks: u64,
    /// Number of blocks to analyze for metrics
    pub metrics_window_blocks: u64,
    /// Cross-shard message TTL in blocks
    pub cross_shard_ttl: u64,
}

impl Default for ShardingConfig {
    fn default() -> Self {
        Self {
            initial_shards: 1,
            max_shards: 256,
            min_shards: 1,
            split_threshold_tps: 500,  // Split when exceeding 500 TPS per shard
            merge_threshold_tps: 50,   // Merge when combined < 50 TPS
            scaling_cooldown_blocks: 100,
            metrics_window_blocks: 50,
            cross_shard_ttl: 100,
        }
    }
}

/// Metrics for a single shard
#[derive(Debug, Clone, Default)]
pub struct ShardMetrics {
    /// Shard ID
    pub shard_id: ShardId,
    /// Current transactions per second
    pub tps: u32,
    /// Average TPS over window
    pub avg_tps: u32,
    /// Peak TPS in window
    pub peak_tps: u32,
    /// Number of active accounts
    pub active_accounts: u64,
    /// Storage size in bytes
    pub storage_size: u64,
    /// Pending cross-shard messages
    pub pending_cross_shard: u32,
    /// Number of validators assigned
    pub validator_count: u32,
    /// Last block processed
    pub last_block: u64,
}

/// State of a shard
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ShardState {
    /// Shard is active and processing transactions
    Active,
    /// Shard is being created (splitting)
    Splitting,
    /// Shard is being merged into another
    Merging,
    /// Shard is frozen (for migration)
    Frozen,
    /// Shard is inactive/archived
    Inactive,
}

/// Information about a shard
#[derive(Debug, Clone)]
pub struct ShardInfo {
    /// Shard identifier
    pub id: ShardId,
    /// Current state
    pub state: ShardState,
    /// Block number when shard was created
    pub created_at: u64,
    /// Parent shard (if split from another)
    pub parent_shard: Option<ShardId>,
    /// Child shards (if split into others)
    pub child_shards: Vec<ShardId>,
    /// Key range start (for account assignment)
    pub key_range_start: [u8; 32],
    /// Key range end
    pub key_range_end: [u8; 32],
    /// Assigned validators
    pub validators: Vec<[u8; 32]>,
    /// Current metrics
    pub metrics: ShardMetrics,
}

/// A pending shard operation
#[derive(Debug, Clone)]
pub enum ShardOperation {
    /// Split shard into two
    Split {
        source_shard: ShardId,
        new_shard_a: ShardId,
        new_shard_b: ShardId,
        split_key: [u8; 32],
        scheduled_block: u64,
    },
    /// Merge two shards into one
    Merge {
        shard_a: ShardId,
        shard_b: ShardId,
        target_shard: ShardId,
        scheduled_block: u64,
    },
    /// Rebalance validators between shards
    Rebalance {
        from_shard: ShardId,
        to_shard: ShardId,
        validators: Vec<[u8; 32]>,
        scheduled_block: u64,
    },
}

/// Cross-shard message
#[derive(Debug, Clone, Encode, Decode)]
pub struct CrossShardMessage {
    /// Unique message ID
    pub id: [u8; 32],
    /// Source shard
    pub from_shard: ShardId,
    /// Destination shard
    pub to_shard: ShardId,
    /// Block number when message was created
    pub created_at_block: u64,
    /// TTL in blocks
    pub ttl: u64,
    /// Message type
    pub msg_type: CrossShardMessageType,
    /// Payload
    pub payload: Vec<u8>,
    /// Receipt (set when message is processed)
    pub receipt: Option<CrossShardReceipt>,
}

/// Types of cross-shard messages
#[derive(Debug, Clone, Encode, Decode)]
pub enum CrossShardMessageType {
    /// Transfer tokens between shards
    TokenTransfer {
        from: [u8; 32],
        to: [u8; 32],
        amount: u128,
    },
    /// Transfer NFT between shards
    NftTransfer {
        token_id: [u8; 32],
        from: [u8; 32],
        to: [u8; 32],
    },
    /// Contract call across shards
    ContractCall {
        contract: [u8; 32],
        method: Vec<u8>,
        args: Vec<u8>,
    },
    /// State sync for shard operations
    StateSync {
        key: Vec<u8>,
        value: Vec<u8>,
    },
}

/// Receipt for a cross-shard message
#[derive(Debug, Clone, Encode, Decode)]
pub struct CrossShardReceipt {
    /// Whether the message was processed successfully
    pub success: bool,
    /// Block where message was processed
    pub processed_at_block: u64,
    /// Result data (if any)
    pub result: Vec<u8>,
    /// Gas used
    pub gas_used: u64,
}

/// Scaling decision made by the analyzer
#[derive(Debug, Clone)]
pub enum ScalingDecision {
    /// No action needed
    NoAction,
    /// Split a shard
    Split(ShardId),
    /// Merge two shards
    Merge(ShardId, ShardId),
    /// Rebalance validators
    Rebalance,
}

/// The main shard coordinator
pub struct ShardCoordinator {
    /// Configuration
    config: ShardingConfig,
    /// All shards
    shards: BTreeMap<ShardId, ShardInfo>,
    /// Next shard ID to assign
    next_shard_id: ShardId,
    /// Pending operations
    pending_operations: VecDeque<ShardOperation>,
    /// Last scaling operation block
    last_scaling_block: u64,
    /// Cross-shard message queue (by destination shard)
    message_queues: HashMap<ShardId, VecDeque<CrossShardMessage>>,
    /// Historical metrics for analysis
    metrics_history: HashMap<ShardId, Vec<ShardMetrics>>,
}

impl ShardCoordinator {
    /// Create a new shard coordinator
    pub fn new(config: ShardingConfig) -> Self {
        let mut coordinator = Self {
            config: config.clone(),
            shards: BTreeMap::new(),
            next_shard_id: 0,
            pending_operations: VecDeque::new(),
            last_scaling_block: 0,
            message_queues: HashMap::new(),
            metrics_history: HashMap::new(),
        };
        
        // Initialize with beacon shard (shard 0)
        let beacon = coordinator.create_shard(
            None,
            [0u8; 32],
            [255u8; 32],
        );
        coordinator.shards.insert(0, beacon);
        
        // Create additional initial shards if configured
        for i in 1..config.initial_shards {
            let key_start = Self::calculate_key_boundary(i, config.initial_shards);
            let key_end = if i == config.initial_shards - 1 {
                [255u8; 32]
            } else {
                Self::calculate_key_boundary(i + 1, config.initial_shards)
            };
            
            let shard = coordinator.create_shard(Some(0), key_start, key_end);
            coordinator.shards.insert(i, shard);
        }
        
        coordinator
    }
    
    /// Create a new shard
    fn create_shard(
        &mut self,
        parent: Option<ShardId>,
        key_start: [u8; 32],
        key_end: [u8; 32],
    ) -> ShardInfo {
        let id = self.next_shard_id;
        self.next_shard_id += 1;
        
        ShardInfo {
            id,
            state: ShardState::Active,
            created_at: 0, // Will be set on actual creation
            parent_shard: parent,
            child_shards: Vec::new(),
            key_range_start: key_start,
            key_range_end: key_end,
            validators: Vec::new(),
            metrics: ShardMetrics {
                shard_id: id,
                ..Default::default()
            },
        }
    }
    
    /// Calculate key boundary for initial shard distribution
    fn calculate_key_boundary(shard_index: u32, total_shards: u32) -> [u8; 32] {
        let mut key = [0u8; 32];
        let boundary = ((shard_index as u64) * (u64::MAX / total_shards as u64)) as u64;
        key[..8].copy_from_slice(&boundary.to_be_bytes());
        key
    }
    
    /// Get shard for an account/key
    pub fn get_shard_for_key(&self, key: &[u8; 32]) -> Option<ShardId> {
        for (id, shard) in &self.shards {
            if shard.state == ShardState::Active
                && key >= &shard.key_range_start
                && key <= &shard.key_range_end
            {
                return Some(*id);
            }
        }
        None
    }
    
    /// Update metrics for a shard
    pub fn update_metrics(&mut self, shard_id: ShardId, metrics: ShardMetrics) {
        if let Some(shard) = self.shards.get_mut(&shard_id) {
            shard.metrics = metrics.clone();
        }
        
        // Store in history
        let history = self.metrics_history.entry(shard_id).or_insert_with(Vec::new);
        history.push(metrics);
        
        // Keep only last N entries
        let max_history = self.config.metrics_window_blocks as usize;
        if history.len() > max_history {
            history.remove(0);
        }
    }
    
    /// Analyze metrics and decide on scaling
    pub fn analyze(&self, current_block: u64) -> ScalingDecision {
        // Check cooldown
        if current_block < self.last_scaling_block + self.config.scaling_cooldown_blocks {
            return ScalingDecision::NoAction;
        }
        
        // Find shards that need splitting
        for (id, shard) in &self.shards {
            if shard.state != ShardState::Active {
                continue;
            }
            
            // Check if TPS exceeds split threshold
            let avg_tps = self.calculate_avg_tps(*id);
            if avg_tps > self.config.split_threshold_tps && self.shards.len() < self.config.max_shards as usize {
                return ScalingDecision::Split(*id);
            }
        }
        
        // Find shards that can be merged
        if self.shards.len() > self.config.min_shards as usize {
            let shard_ids: Vec<ShardId> = self.shards.keys().copied().collect();
            for i in 0..shard_ids.len() {
                for j in (i + 1)..shard_ids.len() {
                    let shard_a = shard_ids[i];
                    let shard_b = shard_ids[j];
                    
                    // Check if adjacent shards can be merged
                    if self.are_adjacent(shard_a, shard_b) {
                        let combined_tps = self.calculate_avg_tps(shard_a) + self.calculate_avg_tps(shard_b);
                        if combined_tps < self.config.merge_threshold_tps {
                            return ScalingDecision::Merge(shard_a, shard_b);
                        }
                    }
                }
            }
        }
        
        ScalingDecision::NoAction
    }
    
    /// Check if two shards are adjacent
    fn are_adjacent(&self, shard_a: ShardId, shard_b: ShardId) -> bool {
        if let (Some(a), Some(b)) = (self.shards.get(&shard_a), self.shards.get(&shard_b)) {
            a.key_range_end == b.key_range_start || b.key_range_end == a.key_range_start
        } else {
            false
        }
    }
    
    /// Calculate average TPS for a shard
    fn calculate_avg_tps(&self, shard_id: ShardId) -> u32 {
        if let Some(history) = self.metrics_history.get(&shard_id) {
            if history.is_empty() {
                return 0;
            }
            let sum: u32 = history.iter().map(|m| m.tps).sum();
            sum / history.len() as u32
        } else if let Some(shard) = self.shards.get(&shard_id) {
            shard.metrics.avg_tps
        } else {
            0
        }
    }
    
    /// Schedule a split operation
    pub fn schedule_split(&mut self, shard_id: ShardId, execute_at_block: u64) -> Result<(), ShardError> {
        let shard = self.shards.get(&shard_id)
            .ok_or(ShardError::ShardNotFound(shard_id))?;
        
        if shard.state != ShardState::Active {
            return Err(ShardError::InvalidState(shard.state));
        }
        
        // Calculate split point
        let split_key = self.calculate_split_key(&shard.key_range_start, &shard.key_range_end);
        
        let new_shard_a = self.next_shard_id;
        let new_shard_b = self.next_shard_id + 1;
        
        self.pending_operations.push_back(ShardOperation::Split {
            source_shard: shard_id,
            new_shard_a,
            new_shard_b,
            split_key,
            scheduled_block: execute_at_block,
        });
        
        tracing::info!(
            "Scheduled split of shard {} into {} and {} at block {}",
            shard_id, new_shard_a, new_shard_b, execute_at_block
        );
        
        Ok(())
    }
    
    /// Calculate the midpoint key for splitting
    fn calculate_split_key(&self, start: &[u8; 32], end: &[u8; 32]) -> [u8; 32] {
        let mut result = [0u8; 32];
        let mut carry = false;
        
        // Add start and end
        for i in (0..32).rev() {
            let sum = start[i] as u16 + end[i] as u16 + if carry { 1 } else { 0 };
            result[i] = (sum >> 1) as u8;
            carry = sum & 1 == 1;
        }
        
        result
    }
    
    /// Schedule a merge operation
    pub fn schedule_merge(&mut self, shard_a: ShardId, shard_b: ShardId, execute_at_block: u64) -> Result<(), ShardError> {
        let a = self.shards.get(&shard_a)
            .ok_or(ShardError::ShardNotFound(shard_a))?;
        let b = self.shards.get(&shard_b)
            .ok_or(ShardError::ShardNotFound(shard_b))?;
        
        if a.state != ShardState::Active || b.state != ShardState::Active {
            return Err(ShardError::InvalidState(a.state));
        }
        
        if !self.are_adjacent(shard_a, shard_b) {
            return Err(ShardError::NotAdjacent(shard_a, shard_b));
        }
        
        let target_shard = self.next_shard_id;
        
        self.pending_operations.push_back(ShardOperation::Merge {
            shard_a,
            shard_b,
            target_shard,
            scheduled_block: execute_at_block,
        });
        
        tracing::info!(
            "Scheduled merge of shards {} and {} into {} at block {}",
            shard_a, shard_b, target_shard, execute_at_block
        );
        
        Ok(())
    }
    
    /// Execute pending operations at block boundary
    pub fn on_block_finalized(&mut self, block_number: u64) -> Result<Vec<ShardEvent>, ShardError> {
        let mut events = Vec::new();
        
        // Process pending operations scheduled for this block
        loop {
            // Check if there's an operation to process
            let should_process = match self.pending_operations.front() {
                Some(op) => {
                    let scheduled_block = match op {
                        ShardOperation::Split { scheduled_block, .. } => *scheduled_block,
                        ShardOperation::Merge { scheduled_block, .. } => *scheduled_block,
                        ShardOperation::Rebalance { scheduled_block, .. } => *scheduled_block,
                    };
                    scheduled_block <= block_number
                }
                None => false,
            };
            
            if !should_process {
                break;
            }
            
            // Safe to pop now - we know there's an element
            if let Some(op) = self.pending_operations.pop_front() {
                let event = self.execute_operation(op, block_number)?;
                events.push(event);
                self.last_scaling_block = block_number;
            }
        }
        
        // Process expired cross-shard messages
        self.expire_messages(block_number);
        
        Ok(events)
    }
    
    /// Execute a shard operation
    fn execute_operation(&mut self, op: ShardOperation, block_number: u64) -> Result<ShardEvent, ShardError> {
        match op {
            ShardOperation::Split { source_shard, new_shard_a, new_shard_b, split_key, .. } => {
                self.execute_split(source_shard, new_shard_a, new_shard_b, split_key, block_number)
            }
            ShardOperation::Merge { shard_a, shard_b, target_shard, .. } => {
                self.execute_merge(shard_a, shard_b, target_shard, block_number)
            }
            ShardOperation::Rebalance { from_shard, to_shard, validators, .. } => {
                self.execute_rebalance(from_shard, to_shard, validators, block_number)
            }
        }
    }
    
    /// Execute a split operation
    fn execute_split(
        &mut self,
        source: ShardId,
        new_a: ShardId,
        new_b: ShardId,
        split_key: [u8; 32],
        block_number: u64,
    ) -> Result<ShardEvent, ShardError> {
        let source_shard = self.shards.get_mut(&source)
            .ok_or(ShardError::ShardNotFound(source))?;
        
        let key_start = source_shard.key_range_start;
        let key_end = source_shard.key_range_end;
        
        // Mark source as inactive
        source_shard.state = ShardState::Inactive;
        source_shard.child_shards = vec![new_a, new_b];
        
        // Create new shards
        let mut shard_a = ShardInfo {
            id: new_a,
            state: ShardState::Active,
            created_at: block_number,
            parent_shard: Some(source),
            child_shards: Vec::new(),
            key_range_start: key_start,
            key_range_end: split_key,
            validators: Vec::new(), // TODO: Distribute validators
            metrics: ShardMetrics { shard_id: new_a, ..Default::default() },
        };
        
        let shard_b = ShardInfo {
            id: new_b,
            state: ShardState::Active,
            created_at: block_number,
            parent_shard: Some(source),
            child_shards: Vec::new(),
            key_range_start: split_key,
            key_range_end: key_end,
            validators: Vec::new(),
            metrics: ShardMetrics { shard_id: new_b, ..Default::default() },
        };
        
        self.next_shard_id = self.next_shard_id.max(new_b + 1);
        
        self.shards.insert(new_a, shard_a);
        self.shards.insert(new_b, shard_b);
        
        tracing::info!(
            "Shard {} split into {} and {} at block {}",
            source, new_a, new_b, block_number
        );
        
        Ok(ShardEvent::Split {
            source_shard: source,
            new_shards: (new_a, new_b),
            block_number,
        })
    }
    
    /// Execute a merge operation
    fn execute_merge(
        &mut self,
        shard_a: ShardId,
        shard_b: ShardId,
        target: ShardId,
        block_number: u64,
    ) -> Result<ShardEvent, ShardError> {
        let a = self.shards.get(&shard_a)
            .ok_or(ShardError::ShardNotFound(shard_a))?.clone();
        let b = self.shards.get(&shard_b)
            .ok_or(ShardError::ShardNotFound(shard_b))?.clone();
        
        // Determine merged key range
        let key_start = if a.key_range_start < b.key_range_start {
            a.key_range_start
        } else {
            b.key_range_start
        };
        let key_end = if a.key_range_end > b.key_range_end {
            a.key_range_end
        } else {
            b.key_range_end
        };
        
        // Mark old shards as inactive
        if let Some(shard) = self.shards.get_mut(&shard_a) {
            shard.state = ShardState::Inactive;
        }
        if let Some(shard) = self.shards.get_mut(&shard_b) {
            shard.state = ShardState::Inactive;
        }
        
        // Create merged shard
        let merged = ShardInfo {
            id: target,
            state: ShardState::Active,
            created_at: block_number,
            parent_shard: Some(shard_a), // Reference first shard as parent
            child_shards: Vec::new(),
            key_range_start: key_start,
            key_range_end: key_end,
            validators: [a.validators, b.validators].concat(),
            metrics: ShardMetrics { shard_id: target, ..Default::default() },
        };
        
        self.next_shard_id = self.next_shard_id.max(target + 1);
        self.shards.insert(target, merged);
        
        tracing::info!(
            "Shards {} and {} merged into {} at block {}",
            shard_a, shard_b, target, block_number
        );
        
        Ok(ShardEvent::Merge {
            source_shards: (shard_a, shard_b),
            target_shard: target,
            block_number,
        })
    }
    
    /// Execute a rebalance operation
    fn execute_rebalance(
        &mut self,
        from: ShardId,
        to: ShardId,
        validators: Vec<[u8; 32]>,
        block_number: u64,
    ) -> Result<ShardEvent, ShardError> {
        // Remove validators from source
        if let Some(shard) = self.shards.get_mut(&from) {
            shard.validators.retain(|v| !validators.contains(v));
        }
        
        // Add to target
        if let Some(shard) = self.shards.get_mut(&to) {
            shard.validators.extend(validators.clone());
        }
        
        tracing::info!(
            "Rebalanced {} validators from shard {} to {} at block {}",
            validators.len(), from, to, block_number
        );
        
        Ok(ShardEvent::Rebalance {
            from_shard: from,
            to_shard: to,
            validators,
            block_number,
        })
    }
    
    /// Send a cross-shard message
    pub fn send_cross_shard_message(&mut self, message: CrossShardMessage) -> Result<[u8; 32], ShardError> {
        let to_shard = message.to_shard;
        let msg_id = message.id;
        
        if !self.shards.contains_key(&to_shard) {
            return Err(ShardError::ShardNotFound(to_shard));
        }
        
        let queue = self.message_queues.entry(to_shard).or_insert_with(VecDeque::new);
        queue.push_back(message);
        
        Ok(msg_id)
    }
    
    /// Get pending messages for a shard
    pub fn get_pending_messages(&self, shard_id: ShardId) -> Vec<&CrossShardMessage> {
        self.message_queues
            .get(&shard_id)
            .map(|q| q.iter().collect())
            .unwrap_or_default()
    }
    
    /// Mark a message as processed
    pub fn process_message(&mut self, shard_id: ShardId, msg_id: [u8; 32], receipt: CrossShardReceipt) -> Result<(), ShardError> {
        if let Some(queue) = self.message_queues.get_mut(&shard_id) {
            if let Some(msg) = queue.iter_mut().find(|m| m.id == msg_id) {
                msg.receipt = Some(receipt);
                return Ok(());
            }
        }
        Err(ShardError::MessageNotFound(msg_id))
    }
    
    /// Expire old messages
    fn expire_messages(&mut self, current_block: u64) {
        for queue in self.message_queues.values_mut() {
            queue.retain(|msg| {
                let expired = current_block > msg.created_at_block + msg.ttl;
                if expired && msg.receipt.is_none() {
                    tracing::warn!(
                        "Cross-shard message {} expired without processing",
                        hex::encode(&msg.id[..8])
                    );
                }
                !expired || msg.receipt.is_some()
            });
        }
    }
    
    /// Get all active shards
    pub fn active_shards(&self) -> Vec<&ShardInfo> {
        self.shards
            .values()
            .filter(|s| s.state == ShardState::Active)
            .collect()
    }
    
    /// Get shard count
    pub fn shard_count(&self) -> usize {
        self.shards.values().filter(|s| s.state == ShardState::Active).count()
    }
    
    /// Get total TPS across all shards
    pub fn total_tps(&self) -> u32 {
        self.shards
            .values()
            .filter(|s| s.state == ShardState::Active)
            .map(|s| s.metrics.tps)
            .sum()
    }
}

/// Events emitted by shard operations
#[derive(Debug, Clone)]
pub enum ShardEvent {
    /// Shard was split
    Split {
        source_shard: ShardId,
        new_shards: (ShardId, ShardId),
        block_number: u64,
    },
    /// Shards were merged
    Merge {
        source_shards: (ShardId, ShardId),
        target_shard: ShardId,
        block_number: u64,
    },
    /// Validators were rebalanced
    Rebalance {
        from_shard: ShardId,
        to_shard: ShardId,
        validators: Vec<[u8; 32]>,
        block_number: u64,
    },
}

/// Errors from sharding operations
#[derive(Debug, Clone)]
pub enum ShardError {
    /// Shard not found
    ShardNotFound(ShardId),
    /// Invalid shard state for operation
    InvalidState(ShardState),
    /// Shards are not adjacent
    NotAdjacent(ShardId, ShardId),
    /// Cross-shard message not found
    MessageNotFound([u8; 32]),
    /// Maximum shards reached
    MaxShardsReached,
    /// Minimum shards reached
    MinShardsReached,
    /// Operation failed
    OperationFailed(String),
}

impl std::fmt::Display for ShardError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::ShardNotFound(id) => write!(f, "Shard {} not found", id),
            Self::InvalidState(state) => write!(f, "Invalid shard state: {:?}", state),
            Self::NotAdjacent(a, b) => write!(f, "Shards {} and {} are not adjacent", a, b),
            Self::MessageNotFound(id) => write!(f, "Message {} not found", hex::encode(&id[..8])),
            Self::MaxShardsReached => write!(f, "Maximum shard count reached"),
            Self::MinShardsReached => write!(f, "Minimum shard count reached"),
            Self::OperationFailed(msg) => write!(f, "Operation failed: {}", msg),
        }
    }
}

impl std::error::Error for ShardError {}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_shard_creation() {
        let config = ShardingConfig::default();
        let coordinator = ShardCoordinator::new(config);
        
        assert_eq!(coordinator.shard_count(), 1);
        assert!(coordinator.shards.contains_key(&0));
    }
    
    #[test]
    fn test_get_shard_for_key() {
        let config = ShardingConfig { initial_shards: 4, ..Default::default() };
        let coordinator = ShardCoordinator::new(config);
        
        // All keys should map to a shard
        let key_low = [0u8; 32];
        let key_high = [255u8; 32];
        
        assert!(coordinator.get_shard_for_key(&key_low).is_some());
        assert!(coordinator.get_shard_for_key(&key_high).is_some());
    }
    
    #[test]
    fn test_split_scheduling() {
        let config = ShardingConfig::default();
        let mut coordinator = ShardCoordinator::new(config);
        
        let result = coordinator.schedule_split(0, 100);
        assert!(result.is_ok());
        assert_eq!(coordinator.pending_operations.len(), 1);
    }
    
    #[test]
    fn test_cross_shard_message() {
        let config = ShardingConfig::default();
        let mut coordinator = ShardCoordinator::new(config);
        
        let msg = CrossShardMessage {
            id: [1u8; 32],
            from_shard: 0,
            to_shard: 0,
            created_at_block: 0,
            ttl: 100,
            msg_type: CrossShardMessageType::TokenTransfer {
                from: [1u8; 32],
                to: [2u8; 32],
                amount: 1000,
            },
            payload: Vec::new(),
            receipt: None,
        };
        
        let result = coordinator.send_cross_shard_message(msg);
        assert!(result.is_ok());
        
        let pending = coordinator.get_pending_messages(0);
        assert_eq!(pending.len(), 1);
    }
}
