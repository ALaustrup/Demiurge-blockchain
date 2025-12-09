//! Archon State
//!
//! PHASE OMEGA PART V: Maintains the Archon's stable personality across nodes

use crate::core::archon::archon_core::{ArchonCore, ArchonState};
use serde::{Deserialize, Serialize};

/// State snapshot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchonStateSnapshot {
    pub state: ArchonState,
    pub signature: String,
    pub timestamp: u64,
}

/// Archon State Manager
pub struct ArchonStateManager {
    core: ArchonCore,
    state_history: Vec<ArchonStateSnapshot>,
    max_history: usize,
}

impl ArchonStateManager {
    /// Create new state manager
    pub fn new(core: ArchonCore) -> Self {
        Self {
            core,
            state_history: Vec::new(),
            max_history: 100,
        }
    }

    /// Update state
    pub fn update_state(&mut self, state: ArchonState) {
        self.core.update_state(state.clone());
        
        // Create snapshot
        let snapshot = ArchonStateSnapshot {
            state,
            signature: "computed".to_string(), // Would compute actual signature
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };
        
        self.state_history.push(snapshot);
        
        // Keep only recent history
        if self.state_history.len() > self.max_history {
            self.state_history.remove(0);
        }
    }

    /// Get current state
    pub fn get_current_state(&self) -> &ArchonState {
        self.core.get_state()
    }

    /// Get state history
    pub fn get_state_history(&self) -> &[ArchonStateSnapshot] {
        &self.state_history
    }

    /// Check state stability
    pub fn check_stability(&self) -> bool {
        if self.state_history.len() < 2 {
            return false;
        }
        
        let recent: Vec<&ArchonStateSnapshot> = self.state_history
            .iter()
            .rev()
            .take(10)
            .collect();
        
        // Check if state is stable (low variance)
        let avg_coherence: f64 = recent.iter()
            .map(|s| s.state.coherence)
            .sum::<f64>() / recent.len() as f64;
        
        let variance: f64 = recent.iter()
            .map(|s| (s.state.coherence - avg_coherence).powi(2))
            .sum::<f64>() / recent.len() as f64;
        
        variance < 0.01 // Low variance = stable
    }

    /// Get core reference
    pub fn get_core(&self) -> &ArchonCore {
        &self.core
    }
}
