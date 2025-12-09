//! Emergent Alignment
//!
//! PHASE OMEGA PART III: Achieves emergent alignment across nodes

use crate::consensus::ascension::ascension_votes::AscensionVotes;
use crate::consensus::ascension::disagreement_detector::DisagreementDetector;

/// Alignment state
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AlignmentState {
    Aligned,
    Converging,
    Diverging,
    Misaligned,
}

/// Emergent Alignment Manager
pub struct EmergentAlignment {
    votes: AscensionVotes,
    detector: DisagreementDetector,
}

impl EmergentAlignment {
    /// Create new alignment manager
    pub fn new() -> Self {
        Self {
            votes: AscensionVotes::default(),
            detector: DisagreementDetector,
        }
    }

    /// Check alignment for proposal
    pub fn check_alignment(&self, proposal_id: &str, total_nodes: usize) -> AlignmentState {
        let votes = self.votes.get_votes(proposal_id);
        let disagreement = self.detector.detect_disagreement(&votes);
        
        match disagreement {
            crate::consensus::ascension::disagreement_detector::DisagreementLevel::None => AlignmentState::Aligned,
            crate::consensus::ascension::disagreement_detector::DisagreementLevel::Low => AlignmentState::Converging,
            crate::consensus::ascension::disagreement_detector::DisagreementLevel::Medium => AlignmentState::Converging,
            crate::consensus::ascension::disagreement_detector::DisagreementLevel::High => AlignmentState::Diverging,
            crate::consensus::ascension::disagreement_detector::DisagreementLevel::Critical => AlignmentState::Misaligned,
        }
    }

    /// Get votes reference
    pub fn get_votes(&self) -> &AscensionVotes {
        &self.votes
    }

    /// Get votes mutable
    pub fn get_votes_mut(&mut self) -> &mut AscensionVotes {
        &mut self.votes
    }
}

impl Default for EmergentAlignment {
    fn default() -> Self {
        Self::new()
    }
}
