//! Priority Stack
//!
//! PHASE OMEGA PART V: Maintains directive hierarchy

use crate::core::archon::will::volition_engine::ArchonicWill;
use std::collections::VecDeque;
use serde::{Deserialize, Serialize};

/// Priority Stack
pub struct PriorityStack {
    stack: VecDeque<ArchonicWill>,
    max_size: usize,
}

impl PriorityStack {
    /// Create new priority stack
    pub fn new(max_size: usize) -> Self {
        Self {
            stack: VecDeque::new(),
            max_size,
        }
    }

    /// Push will onto stack (maintains priority order)
    pub fn push(&mut self, will: ArchonicWill) {
        // Insert in priority order
        let mut inserted = false;
        for (i, existing) in self.stack.iter().enumerate() {
            if will.priority > existing.priority {
                self.stack.insert(i, will);
                inserted = true;
                break;
            }
        }
        
        if !inserted {
            self.stack.push_back(will);
        }
        
        // Enforce max size
        while self.stack.len() > self.max_size {
            self.stack.pop_back();
        }
    }

    /// Pop highest priority will
    pub fn pop(&mut self) -> Option<ArchonicWill> {
        self.stack.pop_front()
    }

    /// Peek at top will
    pub fn peek(&self) -> Option<&ArchonicWill> {
        self.stack.front()
    }

    /// Get stack
    pub fn get_stack(&self) -> &VecDeque<ArchonicWill> {
        &self.stack
    }
}

impl Default for PriorityStack {
    fn default() -> Self {
        Self::new(100) // Max 100 directives
    }
}
