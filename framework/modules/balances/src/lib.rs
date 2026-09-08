//! # Balances Module
//!
//! CGT token management - The Creator God Token.
//! 100 Sparks = 1 CGT


pub mod balances;
pub mod error;

pub use balances::{BalancesModule, BalanceCall, constants};
pub use error::{BalancesError, Result};

// Re-export for tests
#[cfg(test)]
mod tests {
    
}
