//! Improvement Queue
//!
//! PHASE OMEGA PART III: Queues validated patches for rollout

use std::collections::VecDeque;
use crate::meta::compiler::AuditedArtifact;
use serde::{Deserialize, Serialize};

/// Queue entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueueEntry {
    pub artifact: AuditedArtifact,
    pub priority: u32,
    pub scheduled_time: u64,
    pub status: QueueStatus,
}

/// Queue status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum QueueStatus {
    Pending,
    Ready,
    Executing,
    Completed,
    Failed,
    RolledBack,
}

/// Improvement Queue
pub struct ImprovementQueue {
    queue: VecDeque<QueueEntry>,
    max_size: usize,
}

impl ImprovementQueue {
    /// Create new queue
    pub fn new(max_size: usize) -> Self {
        Self {
            queue: VecDeque::new(),
            max_size,
        }
    }

    /// Enqueue artifact
    pub fn enqueue(&mut self, artifact: AuditedArtifact, priority: u32) {
        let entry = QueueEntry {
            artifact,
            priority,
            scheduled_time: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            status: QueueStatus::Pending,
        };
        
        // Insert in priority order
        let mut inserted = false;
        for (i, existing) in self.queue.iter().enumerate() {
            if priority > existing.priority {
                self.queue.insert(i, entry);
                inserted = true;
                break;
            }
        }
        
        if !inserted {
            self.queue.push_back(entry);
        }
        
        // Enforce max size
        while self.queue.len() > self.max_size {
            self.queue.pop_back();
        }
    }

    /// Dequeue next ready entry
    pub fn dequeue(&mut self) -> Option<QueueEntry> {
        // Find highest priority ready entry
        for i in 0..self.queue.len() {
            if let Some(entry) = self.queue.get_mut(i) {
                if entry.status == QueueStatus::Ready || entry.status == QueueStatus::Pending {
                    entry.status = QueueStatus::Executing;
                    return self.queue.remove(i);
                }
            }
        }
        None
    }

    /// Mark entry as ready
    pub fn mark_ready(&mut self, index: usize) {
        if let Some(entry) = self.queue.get_mut(index) {
            entry.status = QueueStatus::Ready;
        }
    }

    /// Get queue status
    pub fn get_status(&self) -> QueueStatus {
        if self.queue.is_empty() {
            QueueStatus::Completed
        } else if self.queue.iter().any(|e| e.status == QueueStatus::Ready) {
            QueueStatus::Ready
        } else {
            QueueStatus::Pending
        }
    }

    /// Get queue length
    pub fn len(&self) -> usize {
        self.queue.len()
    }

    /// Check if queue is empty
    pub fn is_empty(&self) -> bool {
        self.queue.is_empty()
    }
}

impl Default for ImprovementQueue {
    fn default() -> Self {
        Self::new(100) // Max 100 entries
    }
}
