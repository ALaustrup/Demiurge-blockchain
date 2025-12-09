//! Meta-Cognitive Self-Model
//!
//! PHASE OMEGA PART III: Single source of internal truth for all subsystem states

pub mod self_model;
pub mod introspection_matrix;
pub mod cognitive_state;

pub use self_model::{SelfModel, SubsystemId, SubsystemState, CognitiveNode};
pub use introspection_matrix::{IntrospectionMatrix, MetricType, MetricEntry, Trend};
pub use cognitive_state::{CognitiveState, CognitiveStateManager};
