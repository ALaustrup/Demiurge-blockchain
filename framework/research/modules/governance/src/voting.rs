//! Voting types and structures

use super::ProposalId;
use codec::{Decode, Encode};
use serde::{Deserialize, Serialize};

/// A vote on a proposal
#[derive(Clone, Debug, Serialize, Deserialize, Encode, Decode)]
pub struct Vote {
    /// Voter account
    pub voter: [u8; 32],
    /// Proposal being voted on
    pub proposal_id: ProposalId,
    /// Type of vote
    pub vote_type: VoteType,
    /// Voting power used (sqrt of stake)
    pub voting_power: u128,
    /// Block when vote was cast
    pub timestamp_block: u64,
}

/// Type of vote
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, Encode, Decode)]
pub enum VoteType {
    /// Vote in favor
    For,
    /// Vote against
    Against,
    /// Abstain (counts for quorum but not approval)
    Abstain,
}

/// Voting power calculation
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct VotingPower {
    /// Raw stake amount
    pub raw_stake: u128,
    /// Calculated voting power (sqrt of stake)
    pub voting_power: u128,
}

/// Result of casting a vote
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct VotingResult {
    /// Proposal voted on
    pub proposal_id: ProposalId,
    /// Voter account
    pub voter: [u8; 32],
    /// Vote cast
    pub vote_type: VoteType,
    /// Voting power used
    pub voting_power: u128,
    /// Current votes for
    pub current_for: u128,
    /// Current votes against
    pub current_against: u128,
    /// Total voting power used so far
    pub total_power: u128,
}
