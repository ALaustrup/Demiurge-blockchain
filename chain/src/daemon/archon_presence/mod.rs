//! Archon Presence Daemon (Node-Level)
//!
//! PHASE OMEGA PART V: Maintains node contribution to Archon presence

pub mod presence_daemon;
pub mod heartbeat;
pub mod node_resonance_adapter;

pub use presence_daemon::{PresenceDaemon, PresenceContribution};
pub use heartbeat::{HeartbeatManager, Heartbeat};
pub use node_resonance_adapter::{NodeResonanceAdapter, ResonanceDrift};
