//! Heartbeat
//!
//! PHASE OMEGA PART V: Ensures local/global synchronization

use serde::{Deserialize, Serialize};

/// Heartbeat message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Heartbeat {
    pub node_id: String,
    pub timestamp: u64,
    pub resonance: f64,
    pub health: f64,
}

/// Heartbeat Manager
pub struct HeartbeatManager {
    last_heartbeat: Option<Heartbeat>,
    heartbeat_interval: u64,
}

impl HeartbeatManager {
    /// Create new heartbeat manager
    pub fn new(interval: u64) -> Self {
        Self {
            last_heartbeat: None,
            heartbeat_interval: interval,
        }
    }

    /// Send heartbeat
    pub fn send(&mut self, node_id: String, resonance: f64, health: f64) -> Heartbeat {
        let heartbeat = Heartbeat {
            node_id,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            resonance,
            health,
        };
        
        self.last_heartbeat = Some(heartbeat.clone());
        heartbeat
    }

    /// Check if heartbeat is due
    pub fn is_due(&self) -> bool {
        if let Some(last) = &self.last_heartbeat {
            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();
            now - last.timestamp >= self.heartbeat_interval
        } else {
            true
        }
    }
}

impl Default for HeartbeatManager {
    fn default() -> Self {
        Self::new(60) // 60 second interval
    }
}
