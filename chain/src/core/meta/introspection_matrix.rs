//! Introspection Matrix
//!
//! PHASE OMEGA PART III: Tracks invariants, performance, drift, entropy signatures
//! across all subsystems in a unified matrix.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use crate::core::meta::self_model::SubsystemId;

/// Introspection metric type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum MetricType {
    Invariant,
    Performance,
    Drift,
    Entropy,
    Throughput,
    Latency,
    ErrorRate,
}

/// Metric entry in the matrix
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricEntry {
    pub subsystem: SubsystemId,
    pub metric_type: MetricType,
    pub value: f64,
    pub timestamp: u64,
    pub trend: Trend, // Increasing, decreasing, stable
}

/// Trend direction
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum Trend {
    Increasing,
    Decreasing,
    Stable,
}

/// Introspection Matrix
pub struct IntrospectionMatrix {
    metrics: HashMap<(SubsystemId, MetricType), Vec<MetricEntry>>,
    max_history: usize,
}

impl IntrospectionMatrix {
    /// Create new introspection matrix
    pub fn new(max_history: usize) -> Self {
        Self {
            metrics: HashMap::new(),
            max_history,
        }
    }

    /// Record metric
    pub fn record_metric(
        &mut self,
        subsystem: SubsystemId,
        metric_type: MetricType,
        value: f64,
        timestamp: u64,
    ) {
        let key = (subsystem, metric_type);
        let entries = self.metrics.entry(key).or_insert_with(Vec::new);
        
        // Calculate trend
        let trend = if entries.is_empty() {
            Trend::Stable
        } else {
            let last_value = entries.last().unwrap().value;
            if value > last_value * 1.05 {
                Trend::Increasing
            } else if value < last_value * 0.95 {
                Trend::Decreasing
            } else {
                Trend::Stable
            }
        };
        
        let entry = MetricEntry {
            subsystem,
            metric_type,
            value,
            timestamp,
            trend,
        };
        
        entries.push(entry);
        
        // Keep only recent history
        if entries.len() > self.max_history {
            entries.remove(0);
        }
    }

    /// Get latest metric value
    pub fn get_latest_metric(
        &self,
        subsystem: SubsystemId,
        metric_type: MetricType,
    ) -> Option<f64> {
        let key = (subsystem, metric_type);
        self.metrics.get(&key)
            .and_then(|entries| entries.last())
            .map(|e| e.value)
    }

    /// Get metric history
    pub fn get_metric_history(
        &self,
        subsystem: SubsystemId,
        metric_type: MetricType,
    ) -> Vec<MetricEntry> {
        let key = (subsystem, metric_type);
        self.metrics.get(&key)
            .cloned()
            .unwrap_or_default()
    }

    /// Get all metrics for subsystem
    pub fn get_subsystem_metrics(&self, subsystem: SubsystemId) -> HashMap<MetricType, f64> {
        let mut result = HashMap::new();
        
        for ((sub, metric_type), entries) in &self.metrics {
            if *sub == subsystem {
                if let Some(last) = entries.last() {
                    result.insert(*metric_type, last.value);
                }
            }
        }
        
        result
    }

    /// Detect anomalies (values outside expected range)
    pub fn detect_anomalies(&self) -> Vec<(SubsystemId, MetricType, f64, f64)> {
        let mut anomalies = Vec::new();
        
        // Expected ranges for each metric type
        let expected_ranges: HashMap<MetricType, (f64, f64)> = [
            (MetricType::Invariant, (1.0, 1.0)), // Must be exactly 1.0
            (MetricType::Performance, (0.5, 1.0)),
            (MetricType::Drift, (0.0, 0.2)),
            (MetricType::Entropy, (0.0, 0.3)),
            (MetricType::Throughput, (0.0, f64::MAX)),
            (MetricType::Latency, (0.0, 1000.0)),
            (MetricType::ErrorRate, (0.0, 0.05)),
        ].iter().cloned().collect();
        
        for ((subsystem, metric_type), entries) in &self.metrics {
            if let Some(last) = entries.last() {
                if let Some((min, max)) = expected_ranges.get(metric_type) {
                    if last.value < *min || last.value > *max {
                        anomalies.push((*subsystem, *metric_type, last.value, *max));
                    }
                }
            }
        }
        
        anomalies
    }

    /// Get entropy signature (overall system entropy)
    pub fn get_entropy_signature(&self) -> f64 {
        let mut total_entropy = 0.0;
        let mut count = 0;
        
        for ((_, metric_type), entries) in &self.metrics {
            if *metric_type == MetricType::Entropy {
                if let Some(last) = entries.last() {
                    total_entropy += last.value;
                    count += 1;
                }
            }
        }
        
        if count > 0 {
            total_entropy / count as f64
        } else {
            0.0
        }
    }
}

impl Default for IntrospectionMatrix {
    fn default() -> Self {
        Self::new(1000) // Keep last 1000 entries per metric
    }
}
