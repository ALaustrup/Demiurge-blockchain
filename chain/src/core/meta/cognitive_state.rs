//! Cognitive State
//!
//! PHASE OMEGA PART III: Unified cognitive state representation
//! that integrates all subsystem observations into a single truth.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use crate::core::meta::self_model::{SelfModel, SubsystemId};
use crate::core::meta::introspection_matrix::{IntrospectionMatrix, MetricType};

/// Cognitive state snapshot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CognitiveState {
    pub timestamp: u64,
    pub global_health: f64,
    pub global_entropy: f64,
    pub subsystem_health: HashMap<SubsystemId, f64>,
    pub invariant_status: HashMap<SubsystemId, bool>,
    pub performance_metrics: HashMap<SubsystemId, f64>,
    pub drift_metrics: HashMap<SubsystemId, f64>,
    pub entropy_signature: f64,
    pub anomalies: Vec<(SubsystemId, MetricType, f64, f64)>,
}

/// Cognitive State Manager
pub struct CognitiveStateManager {
    self_model: SelfModel,
    introspection_matrix: IntrospectionMatrix,
}

impl CognitiveStateManager {
    /// Create new cognitive state manager
    pub fn new() -> Self {
        Self {
            self_model: SelfModel::new(),
            introspection_matrix: IntrospectionMatrix::default(),
        }
    }

    /// Get current cognitive state
    pub fn get_current_state(&self) -> CognitiveState {
        let all_states = self.self_model.get_all_states();
        
        let subsystem_health: HashMap<SubsystemId, f64> = all_states.iter()
            .map(|(id, state)| (*id, state.health))
            .collect();
        
        let invariant_status: HashMap<SubsystemId, bool> = all_states.iter()
            .map(|(id, state)| (*id, state.invariants_held))
            .collect();
        
        let performance_metrics: HashMap<SubsystemId, f64> = all_states.iter()
            .map(|(id, state)| (*id, state.performance))
            .collect();
        
        let drift_metrics: HashMap<SubsystemId, f64> = all_states.iter()
            .map(|(id, state)| (*id, state.drift))
            .collect();
        
        let anomalies = self.introspection_matrix.detect_anomalies();
        let entropy_signature = self.introspection_matrix.get_entropy_signature();
        
        CognitiveState {
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            global_health: self.self_model.get_global_health(),
            global_entropy: self.self_model.get_global_entropy(),
            subsystem_health,
            invariant_status,
            performance_metrics,
            drift_metrics,
            entropy_signature,
            anomalies,
        }
    }

    /// Update subsystem observation
    pub fn update_subsystem(
        &mut self,
        subsystem: SubsystemId,
        health: f64,
        performance: f64,
        drift: f64,
        invariants_held: bool,
        metrics: HashMap<String, f64>,
    ) {
        use crate::core::meta::self_model::SubsystemState;
        
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let state = SubsystemState {
            subsystem,
            health,
            performance,
            drift,
            invariants_held,
            last_updated: timestamp,
            metrics,
        };
        
        self.self_model.observe_subsystem(state);
        
        // Record metrics in introspection matrix
        self.introspection_matrix.record_metric(
            subsystem,
            MetricType::Performance,
            performance,
            timestamp,
        );
        self.introspection_matrix.record_metric(
            subsystem,
            MetricType::Drift,
            drift,
            timestamp,
        );
        self.introspection_matrix.record_metric(
            subsystem,
            MetricType::Entropy,
            drift, // Using drift as entropy proxy
            timestamp,
        );
        self.introspection_matrix.record_metric(
            subsystem,
            MetricType::Invariant,
            if invariants_held { 1.0 } else { 0.0 },
            timestamp,
        );
    }

    /// Get self-model reference
    pub fn get_self_model(&self) -> &SelfModel {
        &self.self_model
    }

    /// Get introspection matrix reference
    pub fn get_introspection_matrix(&self) -> &IntrospectionMatrix {
        &self.introspection_matrix
    }

    /// Check if system is healthy
    pub fn is_system_healthy(&self) -> bool {
        let state = self.get_current_state();
        state.global_health > 0.7 && 
        state.global_entropy < 0.3 &&
        state.anomalies.is_empty() &&
        self.self_model.all_invariants_held()
    }
}

impl Default for CognitiveStateManager {
    fn default() -> Self {
        Self::new()
    }
}
