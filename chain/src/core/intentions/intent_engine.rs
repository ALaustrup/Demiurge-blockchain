//! Intention Engine
//!
//! PHASE OMEGA PART III: Converts system goals into actionable plans
//! and maintains an "Intention Stack"

use std::collections::VecDeque;
use serde::{Deserialize, Serialize};

/// Intention priority
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum IntentionPriority {
    Critical = 0,
    High = 1,
    Medium = 2,
    Low = 3,
}

/// System intention
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Intention {
    pub id: String,
    pub goal: String,
    pub priority: IntentionPriority,
    pub created_at: u64,
    pub status: IntentionStatus,
    pub parameters: HashMap<String, String>,
}

/// Intention status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum IntentionStatus {
    Pending,
    Active,
    Resolved,
    Failed,
    Cancelled,
}

use std::collections::HashMap;

/// Intention Engine
pub struct IntentionEngine {
    intention_stack: VecDeque<Intention>,
    active_intentions: HashMap<String, Intention>,
    max_stack_size: usize,
}

impl IntentionEngine {
    /// Create new intention engine
    pub fn new(max_stack_size: usize) -> Self {
        Self {
            intention_stack: VecDeque::new(),
            active_intentions: HashMap::new(),
            max_stack_size,
        }
    }

    /// Add intention to stack
    pub fn add_intention(&mut self, intention: Intention) {
        // Insert in priority order
        let mut inserted = false;
        for (i, existing) in self.intention_stack.iter().enumerate() {
            if intention.priority < existing.priority {
                self.intention_stack.insert(i, intention.clone());
                inserted = true;
                break;
            }
        }
        
        if !inserted {
            self.intention_stack.push_back(intention.clone());
        }
        
        // Keep stack size limit
        while self.intention_stack.len() > self.max_stack_size {
            self.intention_stack.pop_back();
        }
        
        // Add to active if not resolved
        if intention.status == IntentionStatus::Pending || intention.status == IntentionStatus::Active {
            self.active_intentions.insert(intention.id.clone(), intention);
        }
    }

    /// Get next intention to process
    pub fn get_next_intention(&mut self) -> Option<Intention> {
        // Find highest priority pending intention
        for i in 0..self.intention_stack.len() {
            if let Some(intention) = self.intention_stack.get_mut(i) {
                if intention.status == IntentionStatus::Pending {
                    intention.status = IntentionStatus::Active;
                    return Some(intention.clone());
                }
            }
        }
        None
    }

    /// Mark intention as resolved
    pub fn resolve_intention(&mut self, intention_id: &str) {
        if let Some(intention) = self.active_intentions.get_mut(intention_id) {
            intention.status = IntentionStatus::Resolved;
        }
        
        for intention in &mut self.intention_stack {
            if intention.id == intention_id {
                intention.status = IntentionStatus::Resolved;
                break;
            }
        }
        
        self.active_intentions.remove(intention_id);
    }

    /// Mark intention as failed
    pub fn fail_intention(&mut self, intention_id: &str) {
        if let Some(intention) = self.active_intentions.get_mut(intention_id) {
            intention.status = IntentionStatus::Failed;
        }
        
        for intention in &mut self.intention_stack {
            if intention.id == intention_id {
                intention.status = IntentionStatus::Failed;
                break;
            }
        }
        
        self.active_intentions.remove(intention_id);
    }

    /// Get intention stack
    pub fn get_intention_stack(&self) -> Vec<Intention> {
        self.intention_stack.iter().cloned().collect()
    }

    /// Get active intentions
    pub fn get_active_intentions(&self) -> Vec<Intention> {
        self.active_intentions.values().cloned().collect()
    }

    /// Clear resolved intentions
    pub fn clear_resolved(&mut self) {
        self.intention_stack.retain(|i| i.status != IntentionStatus::Resolved);
    }
}

impl Default for IntentionEngine {
    fn default() -> Self {
        Self::new(100) // Max 100 intentions in stack
    }
}
