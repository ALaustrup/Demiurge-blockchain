//! Intention Classifier
//!
//! PHASE OMEGA PART III: Classifies system goals into intention categories

use serde::{Deserialize, Serialize};
use crate::core::intentions::intent_engine::{Intention, IntentionPriority};

/// Intention category
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum IntentionCategory {
    Optimization,
    Stability,
    Security,
    Performance,
    Recovery,
    Evolution,
    Maintenance,
}

/// Intention Classifier
pub struct IntentionClassifier;

impl IntentionClassifier {
    /// Classify goal into intention
    pub fn classify_goal(
        goal: &str,
        category: IntentionCategory,
    ) -> Intention {
        let priority = Self::determine_priority(goal, category);
        
        let id = format!("intent_{}", 
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        );
        
        Intention {
            id,
            goal: goal.to_string(),
            priority,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            status: crate::core::intentions::intent_engine::IntentionStatus::Pending,
            parameters: std::collections::HashMap::new(),
        }
    }

    /// Determine priority based on goal and category
    fn determine_priority(goal: &str, category: IntentionCategory) -> IntentionPriority {
        // Security and stability are always high priority
        match category {
            IntentionCategory::Security => IntentionPriority::Critical,
            IntentionCategory::Stability => IntentionPriority::High,
            IntentionCategory::Recovery => IntentionPriority::Critical,
            IntentionCategory::Performance => {
                if goal.contains("critical") || goal.contains("urgent") {
                    IntentionPriority::High
                } else {
                    IntentionPriority::Medium
                }
            },
            IntentionCategory::Optimization => IntentionPriority::Medium,
            IntentionCategory::Evolution => IntentionPriority::Low,
            IntentionCategory::Maintenance => IntentionPriority::Low,
        }
    }

    /// Extract category from goal text
    pub fn extract_category(goal: &str) -> IntentionCategory {
        let goal_lower = goal.to_lowercase();
        
        if goal_lower.contains("security") || goal_lower.contains("vulnerability") {
            IntentionCategory::Security
        } else if goal_lower.contains("stability") || goal_lower.contains("crash") {
            IntentionCategory::Stability
        } else if goal_lower.contains("recover") || goal_lower.contains("restore") {
            IntentionCategory::Recovery
        } else if goal_lower.contains("performance") || goal_lower.contains("speed") {
            IntentionCategory::Performance
        } else if goal_lower.contains("optimize") || goal_lower.contains("improve") {
            IntentionCategory::Optimization
        } else if goal_lower.contains("evolve") || goal_lower.contains("upgrade") {
            IntentionCategory::Evolution
        } else {
            IntentionCategory::Maintenance
        }
    }
}
