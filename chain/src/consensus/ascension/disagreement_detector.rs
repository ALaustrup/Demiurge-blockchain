//! Disagreement Detector
//!
//! PHASE OMEGA PART III: Detects divergence or misalignment

use crate::consensus::ascension::ascension_votes::{AscensionVotes, Vote};

/// Disagreement level
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DisagreementLevel {
    None,
    Low,
    Medium,
    High,
    Critical,
}

/// Disagreement Detector
pub struct DisagreementDetector;

impl DisagreementDetector {
    /// Detect disagreement in votes
    pub fn detect_disagreement(&self, votes: &[crate::consensus::ascension::ascension_votes::AscensionVote]) -> DisagreementLevel {
        if votes.is_empty() {
            return DisagreementLevel::None;
        }
        
        let approve_count = votes.iter().filter(|v| v.vote == Vote::Approve).count();
        let reject_count = votes.iter().filter(|v| v.vote == Vote::Reject).count();
        let total = votes.len();
        
        let approval_rate = approve_count as f64 / total as f64;
        let disagreement_rate = 1.0 - (approval_rate - 0.5).abs() * 2.0;
        
        if disagreement_rate < 0.1 {
            DisagreementLevel::None
        } else if disagreement_rate < 0.3 {
            DisagreementLevel::Low
        } else if disagreement_rate < 0.5 {
            DisagreementLevel::Medium
        } else if disagreement_rate < 0.7 {
            DisagreementLevel::High
        } else {
            DisagreementLevel::Critical
        }
    }

    /// Check for misalignment
    pub fn check_misalignment(&self, votes: &[crate::consensus::ascension::ascension_votes::AscensionVote]) -> bool {
        self.detect_disagreement(votes) >= DisagreementLevel::High
    }
}
