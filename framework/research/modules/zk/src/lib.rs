//! # Zero-Knowledge Module
//!
//! Private transactions, anonymous voting, and privacy-preserving features.
//! The ultimate privacy for creators and gamers.


pub mod private_transfer;
pub mod anonymous_vote;
pub mod private_nft;
pub mod proofs;
pub mod error;

pub use private_transfer::PrivateTransfer;
pub use anonymous_vote::AnonymousVote;
pub use private_nft::PrivateNftTransfer;
pub use proofs::{ProofGenerator, ProofVerifier};
pub use error::{ZkError, Result};
