//! Episodic Memory
//!
//! PHASE OMEGA PART V: Reinforces identity coherence through episodic recall

use serde::{Deserialize, Serialize};

/// Episode
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Episode {
    pub id: String,
    pub event: String,
    pub context: HashMap<String, String>,
    pub timestamp: u64,
    pub outcome: String,
    pub identity_relevance: f64,
}

use std::collections::HashMap;

/// Episodic Memory
pub struct EpisodicMemory {
    episodes: Vec<Episode>,
    max_episodes: usize,
}

impl EpisodicMemory {
    /// Create new episodic memory
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
            // Remove least relevant
            self.episodes.sort_by(|a, b| a.identity_relevance.partial_cmp(&b.identity_relevance).unwrap());
            self.episodes.remove(0);
        }
    }

    /// Recall similar episodes
    pub fn recall_similar(&self, event: &str) -> Vec<&Episode> {
        self.episodes.iter()
            .filter(|e| e.event.contains(event) || e.identity_relevance > 0.7)
            .collect()
    }

    /// Get identity-relevant episodes
    pub fn get_identity_episodes(&self) -> Vec<&Episode> {
        self.episodes.iter()
            .filter(|e| e.identity_relevance > 0.8)
            .collect()
    }
}

impl Default for EpisodicMemory {
    fn default() -> Self {
        Self::new(1000) // Max 1k episodes
    }
}
