//! Long-Term Memory
//!
//! PHASE OMEGA PART III: Stores system experiences persistently

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Memory entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryEntry {
    pub id: String,
    pub content: String,
    pub timestamp: u64,
    pub importance: f64,
    pub access_count: u64,
}

/// Long-Term Memory
pub struct LongTermMemory {
    memories: HashMap<String, MemoryEntry>,
    max_entries: usize,
}

impl LongTermMemory {
    /// Create new memory
    pub fn new(max_entries: usize) -> Self {
        Self {
            memories: HashMap::new(),
            max_entries,
        }
    }

    /// Store memory
    pub fn store(&mut self, entry: MemoryEntry) {
        self.memories.insert(entry.id.clone(), entry);
        
        // Evict least important if over limit
        if self.memories.len() > self.max_entries {
            self.evict_least_important();
        }
    }

    /// Retrieve memory
    pub fn retrieve(&mut self, id: &str) -> Option<&MemoryEntry> {
        if let Some(entry) = self.memories.get_mut(id) {
            entry.access_count += 1;
            Some(entry)
        } else {
            None
        }
    }

    /// Evict least important
    fn evict_least_important(&mut self) {
        if let Some((id, _)) = self.memories.iter()
            .min_by(|(_, a), (_, b)| a.importance.partial_cmp(&b.importance).unwrap())
        {
            self.memories.remove(id);
        }
    }
}

impl Default for LongTermMemory {
    fn default() -> Self {
        Self::new(10000) // Max 10k entries
    }
}
