//! Spirit Collective
//!
//! PHASE OMEGA PART III: Swarm intelligence for distributed reasoning

pub mod collective_protocol;
pub mod spirit_alignment;
pub mod distributed_reasoning;

pub use collective_protocol::{CollectiveProtocol, SpiritNode, ReasoningState};
pub use spirit_alignment::{SpiritAlignment, AlignmentResult};
pub use distributed_reasoning::{DistributedReasoning, ReasoningResult};
