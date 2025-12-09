//! Improvement Journal
//!
//! PHASE OMEGA PART III: Journals every change with Merkle receipts

use crate::improvement_pipeline::improvement_executor::ExecutionResult;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use hex;

/// Journal entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JournalEntry {
    pub entry_id: String,
    pub artifact_id: String,
    pub execution_result: ExecutionResult,
    pub timestamp: u64,
    pub merkle_receipt: String, // Merkle proof hash
    pub previous_hash: Option<String>, // Previous entry hash for chain
}

/// Improvement Journal
pub struct ImprovementJournal {
    entries: Vec<JournalEntry>,
    merkle_root: String,
}

impl ImprovementJournal {
    /// Create new journal
    pub fn new() -> Self {
        Self {
            entries: Vec::new(),
            merkle_root: "genesis".to_string(),
        }
    }

    /// Journal execution result
    pub fn journal_execution(&mut self, result: ExecutionResult, artifact_id: String) -> String {
        let entry_id = format!("entry_{}", 
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        );
        
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let previous_hash = self.entries.last()
            .map(|e| self.hash_entry(e))
            .or_else(|| Some(self.merkle_root.clone()));
        
        let entry = JournalEntry {
            entry_id: entry_id.clone(),
            artifact_id,
            execution_result: result,
            timestamp,
            merkle_receipt: self.compute_merkle_receipt(&entry_id, timestamp),
            previous_hash,
        };
        
        self.entries.push(entry.clone());
        self.update_merkle_root();
        
        entry_id
    }

    /// Compute Merkle receipt
    fn compute_merkle_receipt(&self, entry_id: &str, timestamp: u64) -> String {
        let mut hasher = Sha256::new();
        hasher.update(entry_id.as_bytes());
        hasher.update(&timestamp.to_le_bytes());
        if let Some(last) = self.entries.last() {
            hasher.update(last.merkle_receipt.as_bytes());
        }
        let hash = hasher.finalize();
        hex::encode(hash)
    }

    /// Hash journal entry
    fn hash_entry(&self, entry: &JournalEntry) -> String {
        let mut hasher = Sha256::new();
        hasher.update(entry.entry_id.as_bytes());
        hasher.update(entry.artifact_id.as_bytes());
        hasher.update(&entry.timestamp.to_le_bytes());
        hasher.update(entry.merkle_receipt.as_bytes());
        let hash = hasher.finalize();
        hex::encode(hash)
    }

    /// Update Merkle root
    fn update_merkle_root(&mut self) {
        if self.entries.is_empty() {
            return;
        }
        
        // Simple Merkle root: hash of all entry hashes
        let mut hasher = Sha256::new();
        for entry in &self.entries {
            hasher.update(self.hash_entry(entry).as_bytes());
        }
        let root = hasher.finalize();
        self.merkle_root = hex::encode(root);
    }

    /// Get journal entries
    pub fn get_entries(&self) -> &[JournalEntry] {
        &self.entries
    }

    /// Get Merkle root
    pub fn get_merkle_root(&self) -> &str {
        &self.merkle_root
    }

    /// Verify journal integrity
    pub fn verify_integrity(&self) -> bool {
        // Verify chain of hashes
        for i in 1..self.entries.len() {
            let prev_hash = self.hash_entry(&self.entries[i - 1]);
            if let Some(expected) = &self.entries[i].previous_hash {
                if prev_hash != *expected {
                    return false;
                }
            }
        }
        true
    }
}

impl Default for ImprovementJournal {
    fn default() -> Self {
        Self::new()
    }
}
