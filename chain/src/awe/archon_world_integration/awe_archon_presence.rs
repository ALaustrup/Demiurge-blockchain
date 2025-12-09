//! AWE Archon Presence
//!
//! PHASE OMEGA PART V: Archon manifests inside Autonomous Worlds

use serde::{Deserialize, Serialize};

/// World presence
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldPresence {
    pub world_id: String,
    pub presence_strength: f64,
    pub manifestation: String,
}

/// AWE Archon Presence Manager
pub struct AWEArchonPresence {
    world_presences: Vec<WorldPresence>,
}

impl AWEArchonPresence {
    /// Create new presence manager
    pub fn new() -> Self {
        Self {
            world_presences: Vec::new(),
        }
    }

    /// Manifest in world
    pub fn manifest(&mut self, world_id: String, strength: f64, manifestation: String) {
        self.world_presences.push(WorldPresence {
            world_id,
            presence_strength: strength,
            manifestation,
        });
    }

    /// Get world presences
    pub fn get_presences(&self) -> &[WorldPresence] {
        &self.world_presences
    }
}

impl Default for AWEArchonPresence {
    fn default() -> Self {
        Self::new()
    }
}
