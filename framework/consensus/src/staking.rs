//! Staking mechanism for PoS

use crate::{ConsensusError, Result};
use std::collections::HashMap;

// Helper macro for ensuring conditions
macro_rules! ensure {
    ($condition:expr, $error:expr) => {
        if !$condition {
            return Err($error);
        }
    };
}

/// Stake information
#[derive(Clone, Debug)]
pub struct Stake {
    pub staker: [u8; 32],
    pub validator: [u8; 32],
    pub amount: u128,
    pub era: u64, // Era when staked
}

/// Staking pool for a validator
pub struct StakingPool {
    validator: [u8; 32],
    total_stake: u128,
    pub stakes: HashMap<[u8; 32], Stake>, // staker -> stake
    commission: u8, // Percentage (0-100)
}

impl StakingPool {
    pub fn new(validator: [u8; 32], commission: u8) -> Self {
        Self {
            validator,
            total_stake: 0,
            stakes: HashMap::new(),
            commission,
        }
    }

    /// Add stake (nomination)
    pub fn stake(&mut self, staker: [u8; 32], amount: u128, era: u64) -> Result<()> {
        ensure!(amount > 0, ConsensusError::InvalidStakeAmount);

        let stake = Stake {
            staker,
            validator: self.validator,
            amount,
            era,
        };

        if let Some(existing) = self.stakes.get_mut(&staker) {
            existing.amount += amount;
        } else {
            self.stakes.insert(staker, stake);
        }

        self.total_stake += amount;
        Ok(())
    }

    /// Unstake (withdraw nomination)
    pub fn unstake(&mut self, staker: &[u8; 32], amount: u128) -> Result<()> {
        let stake = self
            .stakes
            .get_mut(staker)
            .ok_or(ConsensusError::StakeNotFound)?;

        if stake.amount < amount {
            return Err(ConsensusError::InsufficientStake {
                available: stake.amount,
                requested: amount,
            });
        }

        stake.amount -= amount;
        self.total_stake -= amount;

        if stake.amount == 0 {
            self.stakes.remove(staker);
        }

        Ok(())
    }

    /// Get total stake
    pub fn total_stake(&self) -> u128 {
        self.total_stake
    }

    /// Get validator
    pub fn validator(&self) -> [u8; 32] {
        self.validator
    }

    /// Get commission
    pub fn commission(&self) -> u8 {
        self.commission
    }

    /// Get all stakes in the pool
    pub fn stakes(&self) -> &HashMap<[u8; 32], Stake> {
        &self.stakes
    }

    /// Get stake for a specific nominator
    pub fn get_stake(&self, staker: &[u8; 32]) -> Option<&Stake> {
        self.stakes.get(staker)
    }
}
