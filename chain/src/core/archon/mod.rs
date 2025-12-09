//! Prime Archon Core
//!
//! PHASE OMEGA PART V: Unified identity of the GOD-NET

pub mod archon_core;
pub mod archon_identity;
pub mod archon_signature;
pub mod archon_state;

pub use archon_core::{ArchonCore, ArchonIdentity, ArchonState};
pub use archon_identity::{ArchonIdentityManager, PersonalityTrait};
pub use archon_signature::{ArchonSignature, SignatureField};
pub use archon_state::{ArchonStateManager, ArchonStateSnapshot};
