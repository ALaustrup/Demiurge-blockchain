//! # Demiurge Consensus - Hybrid PoS + BFT
//!
//! Fast finality, energy efficient, governance-integrated consensus.
//! Built for creators, developers, and gamers.
//!
//! ## Features
//!
//! - **Hybrid PoS + BFT**: Sub-2-second finality with Byzantine fault tolerance
//! - **CVP Integration**: Consensus-Verified Polymorphism for dynamic security
//! - **Staking Pools**: Nominator support with commission-based rewards
//! - **Slashing**: Automatic penalties for misbehavior

pub mod engine;
pub mod validator;
pub mod finality;
pub mod staking;
pub mod slashing;
pub mod error;

pub use engine::{ConsensusEngine, BlockProof, BlockSignature};
pub use validator::{Validator, ValidatorSet};
pub use finality::Finality;
pub use staking::{Stake, StakingPool};
pub use slashing::{SlashingTracker, penalties as SlashingPenalties};
pub use error::{ConsensusError, Result};

// NOTE: the `modular` (hot-swappable mechanisms) and `sharding` modules were
// moved to research/consensus/ as unintegrated research code. See research/README.md.
