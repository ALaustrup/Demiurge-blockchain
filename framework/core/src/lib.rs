//! # Demiurge Core Runtime Engine
//!
//! The heart of our blockchain. No Substrate bullshit. Just clean, fast execution.

pub mod runtime;
pub mod transaction;
pub mod block;
pub mod error;
mod serde_helpers;

pub use runtime::Runtime;
pub use transaction::{Transaction, TransactionData};
pub use block::{Block, BlockHeader};
pub use error::{Error, Result};
