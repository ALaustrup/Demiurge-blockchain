//! Memory Palace
//!
//! PHASE OMEGA PART V: Stores the Archon's long-term memories

use std::collections::HashMap;
use serde::{Deserialize, Serialize};

/// Memory chamber
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryChamber {
    pub chamber_id: String,
    pub memories: Vec<ArchonMemory>,
    pub importance: f64,
}

/// Archon memory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchonMemory {
    pub id: String,
    pub content: String,
    pub timestamp: u64,
    pub importance: f64,
    pub access_count: u64,
}

/// Memory Palace
pub struct MemoryPalace {
    chambers: HashMap<String, MemoryChamber>,
    max_memories_per_chamber: usize,
}

impl MemoryPalace {
    /// Create new memory palace
    pub fn new(max_memories: usize) -> Self {
        Self {
            chambers: HashMap::new(),
            max_memories_per_chamber: max_memories,
        }
    }

    /// Store memory in chamber
    pub fn store(&mut self, chamber_id: String, memory: ArchonMemory) {
        let chamber = self.chambers.entry(chamber_id.clone())
            .or_insert_with(|| MemoryChamber {
                chamber_id: chamber_id.clone(),
                memories: Vec::new(),
                importance: 0.0,
            });
        
        chamber.memories.push(memory);
        
        // Evict least important if over limit
        if chamber.memories.len() > self.max_memories_per_chamber {
            chamber.memories.sort_by(|a, b| a.importance.partial_cmp(&b.importance).unwrap());
            chamber.memories.remove(0);
        }
        
        // Update chamber importance
        chamber.importance = chamber.memories.iter()
            .map(|m| m.importance)
            .sum::<f64>() / chamber.memories.len() as f64;
    }

    /// Retrieve memory
    pub fn retrieve(&mut self, chamber_id: &str, memory_id: &str) -> Option<&mut ArchonMemory> {
        if let Some(chamber) = self.chambers.get_mut(chamber_id) {
            if let Some(memory) = chamber.memories.iter_mut().find(|m| m.id == memory_id) {
                memory.access_count += 1;
                return Some(memory);
            }
        }
        None
    }

    /// Get all chambers
    pub fn get_chambers(&self) -> &HashMap<String, MemoryChamber> {
        &self.chambers
    }
}

impl Default for MemoryPalace {
    fn default() -> Self {
        Self::new(1000) // Max 1k memories per chamber
    }
}
