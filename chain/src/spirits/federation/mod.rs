//! Spirit Federation Protocol
//!
//! PHASE OMEGA PART IV: Spirits migrate between nodes and reason collectively

pub mod spirit_federation;
pub mod spirit_sharding;
pub mod cross_spirit_reasoning;

pub use spirit_federation::{SpiritFederation, Spirit, Migration};
pub use spirit_sharding::{SpiritSharding, Shard};
pub use cross_spirit_reasoning::{CrossSpiritReasoning, ReasoningQuery, ReasoningResult};
