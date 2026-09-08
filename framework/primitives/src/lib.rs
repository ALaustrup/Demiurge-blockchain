//! Demiurge Primitives
//!
//! Core types and abstractions for the Demiurge Protocol:
//! - Signature abstraction (quantum-safe ready)
//! - Identity primitives
//! - Physics-ready asset properties

pub mod signature;

pub use signature::{
    AbstractPublicKey, AbstractSignature, KeyRotationEvent, KeyRotationReason,
    SecurityLevel, SignatureScheme,
};

/// Demiurge primitives version
pub const VERSION: &str = "0.1.0";
