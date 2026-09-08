//! Proposal types and structures

use codec::{Decode, Encode};
use serde::{Deserialize, Serialize};

/// Unique identifier for a proposal
pub type ProposalId = [u8; 32];

/// A governance proposal
#[derive(Clone, Debug, Serialize, Deserialize, Encode, Decode)]
pub struct Proposal {
    /// Unique proposal ID
    pub id: ProposalId,
    /// Account that created the proposal
    pub proposer: [u8; 32],
    /// Type of proposal
    pub proposal_type: ProposalType,
    /// Human-readable title
    pub title: String,
    /// Detailed description
    pub description: String,
    /// Block when proposal was created
    pub created_at_block: u64,
    /// Block when voting ends
    pub voting_deadline: u64,
    /// Block when proposal can be executed (after passing)
    pub execution_block: u64,
    /// Total voting power in favor
    pub votes_for: u128,
    /// Total voting power against
    pub votes_against: u128,
    /// Total voting power that participated
    pub total_voting_power: u128,
    /// Current status
    pub status: ProposalStatus,
    /// Stake deposited by proposer
    pub stake_deposited: u128,
}

/// Type of governance proposal
#[derive(Clone, Debug, Serialize, Deserialize, Encode, Decode)]
pub enum ProposalType {
    /// Change a protocol parameter
    ParameterChange {
        /// Module name (e.g., "consensus", "balances")
        module: String,
        /// Parameter name (e.g., "block_time", "min_stake")
        param: String,
        /// New value as bytes
        value: Vec<u8>,
    },
    
    /// Switch consensus mechanism
    ConsensusSwitch {
        /// ID of the new consensus mechanism
        mechanism_id: [u8; 32],
        /// Block number to perform the switch
        switch_at_block: u64,
    },
    
    /// Spend from treasury
    TreasurySpend {
        /// Recipient address
        recipient: [u8; 32],
        /// Amount in Sparks
        amount: u128,
        /// Reason for spending
        reason: String,
    },
    
    /// Upgrade a module
    ModuleUpgrade {
        /// Module name to upgrade
        module: String,
        /// Hash of the new bytecode (for verification)
        bytecode_hash: [u8; 32],
    },
}

/// Status of a proposal
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, Encode, Decode)]
pub enum ProposalStatus {
    /// Voting is ongoing
    Active,
    /// Proposal passed and awaiting execution
    Passed,
    /// Proposal was rejected
    Rejected,
    /// Proposal failed to meet quorum
    QuorumNotMet,
    /// Proposal was executed
    Executed,
    /// Proposal was cancelled by proposer
    Cancelled,
}
