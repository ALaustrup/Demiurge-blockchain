//! Transaction pool

use crate::Result;
use demiurge_core::Transaction;
use codec::Encode;
use std::collections::{HashMap, VecDeque};

/// Transaction pool for pending transactions
pub struct TransactionPool {
    transactions: HashMap<[u8; 32], Transaction>, // tx_hash -> transaction
    ordered: VecDeque<[u8; 32]>, // Ordered by priority
    max_size: usize,
}

impl TransactionPool {
    /// Create a new transaction pool
    pub fn new(max_size: usize) -> Self {
        Self {
            transactions: HashMap::new(),
            ordered: VecDeque::new(),
            max_size,
        }
    }

    /// Add a transaction to the pool
    pub fn add(&mut self, tx: Transaction) -> Result<()> {
        // Calculate transaction hash
        let tx_hash = self.calculate_hash(&tx);

        // Check if already exists
        if self.transactions.contains_key(&tx_hash) {
            return Ok(()); // Already in pool
        }

        // Check pool size
        if self.transactions.len() >= self.max_size {
            // Remove oldest transaction
            if let Some(oldest_hash) = self.ordered.pop_front() {
                self.transactions.remove(&oldest_hash);
            }
        }

        // Add transaction
        self.transactions.insert(tx_hash, tx);
        self.ordered.push_back(tx_hash);

        Ok(())
    }

    /// Get transactions for block production
    pub fn get_transactions(&self, limit: usize) -> Vec<Transaction> {
        self.ordered
            .iter()
            .take(limit)
            .filter_map(|hash| self.transactions.get(hash).cloned())
            .collect()
    }

    /// Remove transactions (after they're included in a block)
    pub fn remove(&mut self, tx_hashes: &[[u8; 32]]) {
        for hash in tx_hashes {
            self.transactions.remove(hash);
            self.ordered.retain(|h| h != hash);
        }
    }

    /// Calculate transaction hash
    fn calculate_hash(&self, tx: &Transaction) -> [u8; 32] {
        use blake2::{Blake2b512, Digest};
        let encoded = tx.encode();
        let hash = Blake2b512::digest(&encoded);
        let mut result = [0u8; 32];
        result.copy_from_slice(&hash[..32]);
        result
    }

    /// Get pool size
    pub fn size(&self) -> usize {
        self.transactions.len()
    }
}
