//! Governance error types

use super::ProposalId;
use std::fmt;

/// Governance error types
#[derive(Debug)]
pub enum GovernanceError {
    /// Insufficient stake to create proposal
    InsufficientStake {
        required: u128,
        provided: u128,
    },
    /// Proposal not found
    ProposalNotFound(ProposalId),
    /// Proposal is not active
    ProposalNotActive(ProposalId),
    /// Voting period has ended
    VotingEnded(ProposalId),
    /// Voting period has not ended yet
    VotingNotEnded(ProposalId),
    /// Account has already voted on this proposal
    AlreadyVoted(ProposalId, [u8; 32]),
    /// Proposal did not pass
    ProposalNotPassed(ProposalId),
    /// Execution delay not met
    ExecutionDelayNotMet {
        proposal_id: ProposalId,
        ready_at: u64,
        current: u64,
    },
    /// Decoding error
    DecodingError,
    /// Storage error
    StorageError(String),
    /// Not authorized
    NotAuthorized,
    /// Invalid parameter
    InvalidParameter(String),
}

impl fmt::Display for GovernanceError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InsufficientStake { required, provided } => {
                write!(f, "Insufficient stake: required {}, provided {}", required, provided)
            }
            Self::ProposalNotFound(id) => {
                write!(f, "Proposal not found: {}", hex::encode(&id[..8]))
            }
            Self::ProposalNotActive(id) => {
                write!(f, "Proposal not active: {}", hex::encode(&id[..8]))
            }
            Self::VotingEnded(id) => {
                write!(f, "Voting period ended for: {}", hex::encode(&id[..8]))
            }
            Self::VotingNotEnded(id) => {
                write!(f, "Voting period not ended for: {}", hex::encode(&id[..8]))
            }
            Self::AlreadyVoted(id, voter) => {
                write!(f, "Account {} already voted on {}", 
                    hex::encode(&voter[..8]),
                    hex::encode(&id[..8]))
            }
            Self::ProposalNotPassed(id) => {
                write!(f, "Proposal did not pass: {}", hex::encode(&id[..8]))
            }
            Self::ExecutionDelayNotMet { proposal_id, ready_at, current } => {
                write!(f, "Execution delay not met for {}: ready at block {}, current {}",
                    hex::encode(&proposal_id[..8]), ready_at, current)
            }
            Self::DecodingError => write!(f, "Failed to decode data"),
            Self::StorageError(msg) => write!(f, "Storage error: {}", msg),
            Self::NotAuthorized => write!(f, "Not authorized"),
            Self::InvalidParameter(msg) => write!(f, "Invalid parameter: {}", msg),
        }
    }
}

impl std::error::Error for GovernanceError {}
