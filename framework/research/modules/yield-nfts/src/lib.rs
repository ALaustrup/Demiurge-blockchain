//! # Yield NFTs Module
//!
//! NFTs that earn passive income through staking and revenue sharing


pub mod yield_nfts;
pub mod error;

pub use yield_nfts::{YieldNftsModule, YieldCall};
pub use error::{YieldNftsError, Result};
