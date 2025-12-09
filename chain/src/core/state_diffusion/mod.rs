//! Divine State Diffusion (Layer 1)
//!
//! PHASE OMEGA PART IV: Spreads local knowledge across the God-Net

pub mod state_diffuser;
pub mod gradient_flow;
pub mod distributed_snapshot;

pub use state_diffuser::{StateDiffuser, StateUpdate};
pub use gradient_flow::{GradientFlow, GradientVector};
pub use distributed_snapshot::{DistributedSnapshot, FieldStateSnapshot, NodeState, GlobalState};
