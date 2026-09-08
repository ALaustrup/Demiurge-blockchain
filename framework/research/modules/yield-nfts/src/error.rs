//! Yield NFTs module errors

use thiserror::Error;

/// Result type
pub type Result<T> = std::result::Result<T, YieldNftsError>;

/// Yield NFTs errors
#[derive(Error, Debug)]
pub enum YieldNftsError {
    #[error("NFT not found")]
    NftNotFound,

    #[error("NFT not staked")]
    NotStaked,

    #[error("Not owner")]
    NotOwner,

    #[error("Invalid duration")]
    InvalidDuration,

    #[error("Staking failed")]
    StakingFailed,
}
