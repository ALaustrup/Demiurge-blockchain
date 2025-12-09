//! Celestial Governance Layer
//!
//! PHASE OMEGA PART IV: Multi-node governance with intent-weighted voting

pub mod celestial_votes;
pub mod multi_node_governance;
pub mod cosmic_quorum;

pub use celestial_votes::{CelestialVotes, CelestialVote};
pub use multi_node_governance::{MultiNodeGovernance, GovernanceProposal, ProposalStatus};
pub use cosmic_quorum::{CosmicQuorum, QuorumState};
