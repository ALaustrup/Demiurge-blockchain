//! Core blockchain components
//!
//! Block, Transaction, State management

pub mod block;
pub mod state;
pub mod transaction;
pub mod meta;
pub mod intentions;
pub mod evolution;

pub use block::Block;
pub use state::State;
pub use transaction::Transaction;
