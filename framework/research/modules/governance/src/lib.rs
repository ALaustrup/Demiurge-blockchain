//! Governance Module
//!
//! On-chain governance for the Demiurge Protocol, enabling:
//! - Parameter changes via proposals
//! - Consensus mechanism switching
//! - Treasury management
//! - Module upgrades
//!
//! Voting uses quadratic stake weighting: voting_power = √(staked_amount)

mod proposal;
mod voting;
mod treasury;
mod error;

pub use proposal::{Proposal, ProposalId, ProposalType, ProposalStatus};
pub use voting::{Vote, VoteType, VotingPower, VotingResult};
pub use treasury::{Treasury, TreasurySpend};
pub use error::GovernanceError;

use demiurge_storage::Storage;
use codec::{Decode, Encode};
use serde::{Deserialize, Serialize};
use blake2::{Blake2b512, Digest};
use std::collections::HashMap;

/// Result type for governance operations
pub type Result<T> = std::result::Result<T, GovernanceError>;

/// Configuration for the governance system
#[derive(Clone, Debug, Serialize, Deserialize, Encode, Decode)]
pub struct GovernanceConfig {
    /// Minimum stake required to create a proposal (in Sparks)
    pub min_proposal_stake: u128,
    /// Voting period in blocks
    pub voting_period_blocks: u64,
    /// Quorum percentage (0-100) required for proposal to pass
    pub quorum_percentage: u8,
    /// Approval threshold percentage (0-100) required for proposal to pass
    pub approval_threshold: u8,
    /// Execution delay in blocks after proposal passes
    pub execution_delay_blocks: u64,
    /// Maximum active proposals per account
    pub max_proposals_per_account: u32,
}

impl Default for GovernanceConfig {
    fn default() -> Self {
        Self {
            min_proposal_stake: 1_000_000_000_000_000_000, // 1 CGT
            voting_period_blocks: 100_800, // ~1 week at 2s blocks
            quorum_percentage: 10,
            approval_threshold: 50,
            execution_delay_blocks: 14_400, // ~8 hours at 2s blocks
            max_proposals_per_account: 5,
        }
    }
}

/// Governance engine
pub struct GovernanceEngine<S: Storage> {
    storage: S,
    config: GovernanceConfig,
    /// Cache of active proposals
    proposals: HashMap<ProposalId, Proposal>,
}

impl<S: Storage> GovernanceEngine<S> {
    /// Create a new governance engine
    pub fn new(storage: S) -> Self {
        Self {
            storage,
            config: GovernanceConfig::default(),
            proposals: HashMap::new(),
        }
    }
    
    /// Create with custom configuration
    pub fn with_config(storage: S, config: GovernanceConfig) -> Self {
        Self {
            storage,
            config,
            proposals: HashMap::new(),
        }
    }
    
    /// Get current configuration
    pub fn config(&self) -> &GovernanceConfig {
        &self.config
    }
    
    // ========================================================================
    // Proposal Management
    // ========================================================================
    
    /// Create a new proposal
    pub fn propose(
        &mut self,
        proposer: [u8; 32],
        proposal_type: ProposalType,
        title: String,
        description: String,
        current_block: u64,
        stake_amount: u128,
    ) -> Result<Proposal> {
        // Check minimum stake
        if stake_amount < self.config.min_proposal_stake {
            return Err(GovernanceError::InsufficientStake {
                required: self.config.min_proposal_stake,
                provided: stake_amount,
            });
        }
        
        // Generate proposal ID
        let proposal_id = self.generate_proposal_id(&proposer, current_block);
        
        // Calculate voting deadline
        let voting_deadline = current_block + self.config.voting_period_blocks;
        let execution_block = voting_deadline + self.config.execution_delay_blocks;
        
        let proposal = Proposal {
            id: proposal_id,
            proposer,
            proposal_type,
            title,
            description,
            created_at_block: current_block,
            voting_deadline,
            execution_block,
            votes_for: 0,
            votes_against: 0,
            total_voting_power: 0,
            status: ProposalStatus::Active,
            stake_deposited: stake_amount,
        };
        
        // Store proposal
        self.store_proposal(&proposal)?;
        self.proposals.insert(proposal_id, proposal.clone());
        
        Ok(proposal)
    }
    
    /// Vote on a proposal
    pub fn vote(
        &mut self,
        proposal_id: ProposalId,
        voter: [u8; 32],
        vote_type: VoteType,
        stake: u128,
        current_block: u64,
    ) -> Result<VotingResult> {
        // Get proposal
        let mut proposal = self.get_proposal(&proposal_id)?
            .ok_or(GovernanceError::ProposalNotFound(proposal_id))?;
        
        // Check proposal is active
        if proposal.status != ProposalStatus::Active {
            return Err(GovernanceError::ProposalNotActive(proposal_id));
        }
        
        // Check voting period
        if current_block > proposal.voting_deadline {
            return Err(GovernanceError::VotingEnded(proposal_id));
        }
        
        // Check if already voted
        if self.has_voted(&proposal_id, &voter)? {
            return Err(GovernanceError::AlreadyVoted(proposal_id, voter));
        }
        
        // Calculate voting power (quadratic: sqrt of stake)
        let voting_power = (stake as f64).sqrt() as u128;
        
        // Record vote
        let vote = Vote {
            voter,
            proposal_id,
            vote_type: vote_type.clone(),
            voting_power,
            timestamp_block: current_block,
        };
        
        self.store_vote(&vote)?;
        
        // Update proposal tallies
        match vote_type {
            VoteType::For => proposal.votes_for += voting_power,
            VoteType::Against => proposal.votes_against += voting_power,
            VoteType::Abstain => {} // Counted for quorum but not for/against
        }
        proposal.total_voting_power += voting_power;
        
        self.store_proposal(&proposal)?;
        self.proposals.insert(proposal_id, proposal.clone());
        
        Ok(VotingResult {
            proposal_id,
            voter,
            vote_type,
            voting_power,
            current_for: proposal.votes_for,
            current_against: proposal.votes_against,
            total_power: proposal.total_voting_power,
        })
    }
    
    /// Check if voting has concluded and update proposal status
    pub fn finalize_proposal(
        &mut self,
        proposal_id: ProposalId,
        current_block: u64,
        total_staked: u128,
    ) -> Result<ProposalStatus> {
        let mut proposal = self.get_proposal(&proposal_id)?
            .ok_or(GovernanceError::ProposalNotFound(proposal_id))?;
        
        // Can only finalize active proposals after voting period
        if proposal.status != ProposalStatus::Active {
            return Ok(proposal.status);
        }
        
        if current_block <= proposal.voting_deadline {
            return Err(GovernanceError::VotingNotEnded(proposal_id));
        }
        
        // Calculate quorum (percentage of total staked that voted)
        let quorum_required = (total_staked as f64 * self.config.quorum_percentage as f64 / 100.0).sqrt() as u128;
        let quorum_met = proposal.total_voting_power >= quorum_required;
        
        // Calculate approval
        let total_votes = proposal.votes_for + proposal.votes_against;
        let approval_percentage = if total_votes > 0 {
            (proposal.votes_for * 100) / total_votes
        } else {
            0
        };
        let approval_met = approval_percentage >= self.config.approval_threshold as u128;
        
        // Determine outcome
        proposal.status = if !quorum_met {
            ProposalStatus::QuorumNotMet
        } else if approval_met {
            ProposalStatus::Passed
        } else {
            ProposalStatus::Rejected
        };
        
        self.store_proposal(&proposal)?;
        self.proposals.insert(proposal_id, proposal.clone());
        
        Ok(proposal.status)
    }
    
    /// Execute a passed proposal
    pub fn execute_proposal(
        &mut self,
        proposal_id: ProposalId,
        current_block: u64,
    ) -> Result<Vec<u8>> {
        let mut proposal = self.get_proposal(&proposal_id)?
            .ok_or(GovernanceError::ProposalNotFound(proposal_id))?;
        
        // Check proposal passed
        if proposal.status != ProposalStatus::Passed {
            return Err(GovernanceError::ProposalNotPassed(proposal_id));
        }
        
        // Check execution delay
        if current_block < proposal.execution_block {
            return Err(GovernanceError::ExecutionDelayNotMet {
                proposal_id,
                ready_at: proposal.execution_block,
                current: current_block,
            });
        }
        
        // Generate execution data based on proposal type
        let execution_data = match &proposal.proposal_type {
            ProposalType::ParameterChange { module, param, value } => {
                // Return the parameter change as encoded data
                (module.clone(), param.clone(), value.clone()).encode()
            }
            ProposalType::ConsensusSwitch { mechanism_id, switch_at_block } => {
                // Return consensus switch instruction
                (*mechanism_id, *switch_at_block).encode()
            }
            ProposalType::TreasurySpend { recipient, amount, reason: _ } => {
                // Return treasury spend instruction
                (*recipient, *amount).encode()
            }
            ProposalType::ModuleUpgrade { module, bytecode_hash } => {
                // Return upgrade instruction
                (module.clone(), *bytecode_hash).encode()
            }
        };
        
        // Mark as executed
        proposal.status = ProposalStatus::Executed;
        self.store_proposal(&proposal)?;
        self.proposals.insert(proposal_id, proposal);
        
        Ok(execution_data)
    }
    
    // ========================================================================
    // Query Methods
    // ========================================================================
    
    /// Get a proposal by ID
    pub fn get_proposal(&self, id: &ProposalId) -> Result<Option<Proposal>> {
        // Check cache first
        if let Some(proposal) = self.proposals.get(id) {
            return Ok(Some(proposal.clone()));
        }
        
        // Check storage
        let key = Self::proposal_key(id);
        match self.storage.get(&key) {
            Some(data) => {
                let proposal = Proposal::decode(&mut &data[..])
                    .map_err(|_| GovernanceError::DecodingError)?;
                Ok(Some(proposal))
            }
            None => Ok(None),
        }
    }
    
    /// Get all active proposals
    pub fn get_active_proposals(&self, current_block: u64) -> Vec<Proposal> {
        self.proposals
            .values()
            .filter(|p| p.status == ProposalStatus::Active && current_block <= p.voting_deadline)
            .cloned()
            .collect()
    }
    
    /// Check if an account has voted on a proposal
    pub fn has_voted(&self, proposal_id: &ProposalId, voter: &[u8; 32]) -> Result<bool> {
        let key = Self::vote_key(proposal_id, voter);
        Ok(self.storage.get(&key).is_some())
    }
    
    /// Calculate voting power for an account
    pub fn calculate_voting_power(&self, stake: u128) -> VotingPower {
        VotingPower {
            raw_stake: stake,
            voting_power: (stake as f64).sqrt() as u128,
        }
    }
    
    // ========================================================================
    // Storage Helpers
    // ========================================================================
    
    fn generate_proposal_id(&self, proposer: &[u8; 32], block: u64) -> ProposalId {
        let mut hasher = Blake2b512::new();
        hasher.update(b"Governance:Proposal:");
        hasher.update(proposer);
        hasher.update(&block.to_le_bytes());
        hasher.update(&std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos()
            .to_le_bytes());
        let hash = hasher.finalize();
        let mut id = [0u8; 32];
        id.copy_from_slice(&hash[..32]);
        id
    }
    
    fn store_proposal(&self, proposal: &Proposal) -> Result<()> {
        let key = Self::proposal_key(&proposal.id);
        let data = proposal.encode();
        self.storage.put(&key, &data);
        Ok(())
    }
    
    fn store_vote(&self, vote: &Vote) -> Result<()> {
        let key = Self::vote_key(&vote.proposal_id, &vote.voter);
        let data = vote.encode();
        self.storage.put(&key, &data);
        Ok(())
    }
    
    fn proposal_key(id: &ProposalId) -> Vec<u8> {
        let mut key = b"Governance:Proposal:".to_vec();
        key.extend_from_slice(id);
        key
    }
    
    fn vote_key(proposal_id: &ProposalId, voter: &[u8; 32]) -> Vec<u8> {
        let mut key = b"Governance:Vote:".to_vec();
        key.extend_from_slice(proposal_id);
        key.extend_from_slice(voter);
        key
    }
}

// ============================================================================
// Consensus Integration Types
// ============================================================================

/// Consensus switch command generated by governance
#[derive(Debug, Clone, Serialize, Deserialize, Encode, Decode)]
pub struct ConsensusSwitchCommand {
    /// The proposal ID that authorized this switch
    pub proposal_id: ProposalId,
    /// Target consensus mechanism ID (as registered in ConsensusOrchestrator)
    pub mechanism_id: [u8; 32],
    /// Block number at which the switch should occur
    pub switch_at_block: u64,
    /// Minimum number of validators required to confirm readiness
    pub required_validators: u32,
}

impl ConsensusSwitchCommand {
    /// Create a new consensus switch command from a passed proposal
    pub fn from_proposal(proposal: &Proposal) -> Option<Self> {
        match &proposal.proposal_type {
            ProposalType::ConsensusSwitch { mechanism_id, switch_at_block } => {
                Some(Self {
                    proposal_id: proposal.id,
                    mechanism_id: *mechanism_id,
                    switch_at_block: *switch_at_block,
                    // Default: require 2/3 of validators
                    required_validators: 2,
                })
            }
            _ => None,
        }
    }
    
    /// Create with custom validator requirement
    pub fn with_validators(mut self, required: u32) -> Self {
        self.required_validators = required;
        self
    }
}
