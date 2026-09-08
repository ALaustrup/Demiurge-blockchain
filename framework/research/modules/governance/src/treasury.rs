//! Treasury management

use codec::{Decode, Encode};
use serde::{Deserialize, Serialize};

/// Treasury state
#[derive(Clone, Debug, Serialize, Deserialize, Encode, Decode)]
pub struct Treasury {
    /// Current balance in Sparks
    pub balance: u128,
    /// Total spent via governance
    pub total_spent: u128,
    /// Number of approved spends
    pub spend_count: u64,
}

impl Default for Treasury {
    fn default() -> Self {
        Self {
            balance: 0,
            total_spent: 0,
            spend_count: 0,
        }
    }
}

impl Treasury {
    /// Create a new treasury with initial balance
    pub fn new(initial_balance: u128) -> Self {
        Self {
            balance: initial_balance,
            total_spent: 0,
            spend_count: 0,
        }
    }
    
    /// Deposit funds into treasury
    pub fn deposit(&mut self, amount: u128) {
        self.balance = self.balance.saturating_add(amount);
    }
    
    /// Attempt to spend from treasury
    pub fn spend(&mut self, amount: u128) -> Result<(), &'static str> {
        if amount > self.balance {
            return Err("Insufficient treasury balance");
        }
        
        self.balance = self.balance.saturating_sub(amount);
        self.total_spent = self.total_spent.saturating_add(amount);
        self.spend_count += 1;
        Ok(())
    }
}

/// Record of a treasury spend
#[derive(Clone, Debug, Serialize, Deserialize, Encode, Decode)]
pub struct TreasurySpend {
    /// Proposal that authorized the spend
    pub proposal_id: [u8; 32],
    /// Recipient address
    pub recipient: [u8; 32],
    /// Amount spent
    pub amount: u128,
    /// Block when spend occurred
    pub block_number: u64,
    /// Reason for spend
    pub reason: String,
}
