//! # Qor Identity Module
//!
//! Sovereign Identity System for the Demiurge Protocol.
//!
//! ## Core Concepts
//!
//! - **DID (Decentralized Identifier)**: Permanent, immutable identifier
//! - **Handle**: Human-readable name (e.g., `@alice.demiurge`)
//! - **Multi-Key**: Support for multiple signature schemes (Ed25519, Dilithium, Hybrid)
//! - **Key Rotation**: Upgrade security without changing identity

pub mod did;
pub mod handle;
pub mod error;

pub use did::{
    QorIdentity, QorDid, KeyPurpose, LinkedIdentity, ActiveKey,
    QorIdentityCall, create_identity, resolve_identity, resolve_by_address,
    get_identity_count,
};
pub use handle::{HandleRegistry, Handle, HandleRegistration, HandleMetadata};
pub use error::{QorError, Result};
