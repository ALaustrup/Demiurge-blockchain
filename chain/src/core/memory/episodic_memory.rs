//! Episodic Memory
//!
//! PHASE OMEGA PART III: Stores episodic experiences with temporal context

use serde::{Deserialize, Serialize};

/// Episode
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Episode {
    pub id: String,
    pub event: String,
    pub context: HashMap<String, String>,
    pub timestamp: u64,
    pub outcome: String,
}

use std::collections::HashMap;

/// Episodic Memory
pub struct EpisodicMemory {
    episodes: Vec<Episode>,
    max_episodes: usize,
}

impl EpisodicMemory {
    /// Create new memory
    pub fn new(max_episodes: usize) -> Self {
        Self {
            episodes: Vec::new(),
            max_episodes,
        }
    }

    /// Record episode
    pub fn record(&mut self, episode: Episode) {
        self.episodes.push(episode);
        
        if self.episodes.len() > self.max_episodes {
            self.episodes.remove(0);
        }
    }

    /// Recall similar episodes
    pub fn recall_similar(&self, event: &str) -> Vec<&Episode> {
        self.episodes.iter()
            .filter(|e| e.event.contains(event))
            .collect()
    }
}

impl Default for EpisodicMemory {
    fn default() -> Self {
        Self::new(1000) // Max 1k episodes
    }
}
