//! # Sentinel Oracle - AI-Augmented Governance
//!
//! The Sentinel Oracle is the "nervous system" of the Demiurge Protocol.
//! It monitors network health, detects anomalies, and creates bounties
//! for Ethereal Agents to solve.
//!
//! ## Architecture
//!
//! ```text
//!                    ┌─────────────────────────────┐
//!                    │      SENTINEL ORACLE        │
//!                    │                             │
//!                    │  ┌───────────────────────┐  │
//!                    │  │   Network Monitor     │  │
//!                    │  │   (Metrics/Alerts)    │  │
//!                    │  └───────────┬───────────┘  │
//!                    │              │              │
//!                    │  ┌───────────▼───────────┐  │
//!                    │  │   Bounty Generator    │  │
//!                    │  │   (Problem → Task)    │  │
//!                    │  └───────────┬───────────┘  │
//!                    │              │              │
//!                    │  ┌───────────▼───────────┐  │
//!                    │  │   Solution Verifier   │  │
//!                    │  │   (VCP Validation)    │  │
//!                    │  └───────────────────────┘  │
//!                    └─────────────────────────────┘
//!                                   │
//!          ┌────────────────────────┼────────────────────────┐
//!          ▼                        ▼                        ▼
//!   ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
//!   │   Agent A    │        │   Agent B    │        │   Agent C    │
//!   │   (Solver)   │        │   (Solver)   │        │   (Solver)   │
//!   └──────────────┘        └──────────────┘        └──────────────┘
//! ```
//!
//! ## Bounty Types
//!
//! - **Optimization**: Improve network parameters (gas, block time)
//! - **Security**: Detect and respond to threats
//! - **Analysis**: Market analysis, trend detection
//! - **Maintenance**: Data cleanup, state pruning
//! - **Governance**: Proposal analysis and voting

use alloc::{format, string::{String, ToString}, vec::Vec, vec};
use codec::{Decode, Encode};
use scale_info::TypeInfo;
use serde::{Deserialize, Serialize};

use crate::agent_did::AgentDid;
use crate::forge::VerifiableComputeProof;
use crate::error::AgenticError;

// ============================================================================
// BOUNTY TYPES
// ============================================================================

/// Bounty category
#[derive(Debug, Clone, Copy, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum BountyCategory {
    /// Network optimization (gas, throughput)
    Optimization,
    /// Security monitoring and response
    Security,
    /// Data analysis and insights
    Analysis,
    /// Protocol maintenance
    Maintenance,
    /// Governance participation
    Governance,
    /// Custom/Other
    Custom,
}

/// Bounty priority
#[derive(Debug, Clone, Copy, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum BountyPriority {
    /// Low priority - no urgency
    Low,
    /// Medium priority - should be addressed
    Medium,
    /// High priority - important
    High,
    /// Critical - immediate attention required
    Critical,
}

/// Bounty status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum BountyStatus {
    /// Open for bids
    Open,
    /// Assigned to an agent
    Assigned,
    /// Work in progress
    InProgress,
    /// Solution submitted
    PendingVerification,
    /// Completed successfully
    Completed,
    /// Failed/Expired
    Failed,
    /// Cancelled by Sentinel
    Cancelled,
}

/// A bounty posted by the Sentinel Oracle
#[derive(Debug, Clone, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct Bounty {
    /// Unique bounty ID
    pub id: [u8; 32],
    
    /// Title
    pub title: String,
    
    /// Detailed description
    pub description: String,
    
    /// Category
    pub category: BountyCategory,
    
    /// Priority level
    pub priority: BountyPriority,
    
    /// Status
    pub status: BountyStatus,
    
    /// Reward in CGT (smallest units)
    pub reward: u128,
    
    /// Required capabilities for agents
    pub required_capabilities: Vec<String>,
    
    /// Minimum reputation required
    pub min_reputation: u32,
    
    /// Deadline (timestamp)
    pub deadline: u64,
    
    /// Created at (timestamp)
    pub created_at: u64,
    
    /// Assigned agent (if any)
    pub assigned_to: Option<String>,
    
    /// Verification criteria (encoded)
    pub verification_criteria: Vec<u8>,
    
    /// Number of bids received
    pub bid_count: u32,
    
    /// Winning bid (if assigned)
    pub winning_bid: Option<BountyBid>,
    
    /// Solution (if submitted)
    pub solution: Option<BountySolution>,
}

/// Bid on a bounty
#[derive(Debug, Clone, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct BountyBid {
    /// Bidding agent's DID
    pub agent_did: String,
    
    /// Proposed approach (brief)
    pub approach: String,
    
    /// Estimated completion time (seconds)
    pub estimated_time: u64,
    
    /// Requested reward (can be less than posted)
    pub requested_reward: u128,
    
    /// Agent's reputation at time of bid
    pub agent_reputation: u32,
    
    /// Bid timestamp
    pub timestamp: u64,
}

/// Solution submitted for a bounty
#[derive(Debug, Clone, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct BountySolution {
    /// Solver agent DID
    pub solver_did: String,
    
    /// Solution data (problem-specific)
    pub data: Vec<u8>,
    
    /// VCP proof that solution is valid
    pub vcp: Option<VerifiableComputeProof>,
    
    /// Submission timestamp
    pub submitted_at: u64,
    
    /// Verification result
    pub verified: bool,
    
    /// Verification notes
    pub notes: String,
}

// ============================================================================
// NETWORK METRICS
// ============================================================================

/// Network health metrics
/// Note: Uses integer representations for SCALE compatibility
#[derive(Debug, Clone, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct NetworkMetrics {
    /// Current block number
    pub block_number: u64,
    
    /// Transactions per second (scaled by 100, e.g., 1525 = 15.25 TPS)
    pub tps_scaled: u32,
    
    /// Average block time (ms)
    pub avg_block_time_ms: u64,
    
    /// Pending transaction count
    pub pending_tx_count: u64,
    
    /// Active validators
    pub active_validators: u32,
    
    /// Total staked (CGT)
    pub total_staked: u128,
    
    /// Gas price (average)
    pub avg_gas_price: u64,
    
    /// Network utilization (0-100)
    pub utilization_percent: u8,
    
    /// Active agents count
    pub active_agents: u32,
    
    /// Memory usage (bytes)
    pub memory_usage: u64,
    
    /// Timestamp
    pub timestamp: u64,
}

impl NetworkMetrics {
    /// Get TPS as f32
    pub fn tps(&self) -> f32 {
        self.tps_scaled as f32 / 100.0
    }
    
    /// Set TPS from f32
    pub fn set_tps(&mut self, tps: f32) {
        self.tps_scaled = (tps * 100.0) as u32;
    }
}

impl Default for NetworkMetrics {
    fn default() -> Self {
        Self {
            block_number: 0,
            tps_scaled: 0,
            avg_block_time_ms: 6000,
            pending_tx_count: 0,
            active_validators: 0,
            total_staked: 0,
            avg_gas_price: 1,
            utilization_percent: 0,
            active_agents: 0,
            memory_usage: 0,
            timestamp: current_timestamp(),
        }
    }
}

/// Alert generated by the Sentinel
#[derive(Debug, Clone, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct SentinelAlert {
    /// Alert ID
    pub id: [u8; 32],
    
    /// Alert type
    pub alert_type: AlertType,
    
    /// Severity
    pub severity: AlertSeverity,
    
    /// Message
    pub message: String,
    
    /// Related metric values
    pub metrics: Vec<(String, String)>,
    
    /// Timestamp
    pub timestamp: u64,
    
    /// Has been addressed
    pub resolved: bool,
    
    /// Generated bounty (if any)
    pub bounty_id: Option<[u8; 32]>,
}

/// Alert types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum AlertType {
    /// High gas prices
    HighGas,
    /// Low throughput
    LowThroughput,
    /// Validator issues
    ValidatorIssue,
    /// Potential attack detected
    SecurityThreat,
    /// State bloat
    StateBloat,
    /// Network partition
    NetworkPartition,
    /// Unusual activity
    AnomalyDetected,
}

/// Alert severity
#[derive(Debug, Clone, Copy, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum AlertSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

// ============================================================================
// SENTINEL ORACLE
// ============================================================================

/// The Sentinel Oracle - AI governance and monitoring
#[derive(Debug)]
pub struct SentinelOracle {
    /// All bounties
    bounties: alloc::collections::BTreeMap<[u8; 32], Bounty>,
    
    /// Active alerts
    alerts: Vec<SentinelAlert>,
    
    /// Historical metrics (last 100 samples)
    metrics_history: Vec<NetworkMetrics>,
    
    /// Thresholds for alerts
    thresholds: AlertThresholds,
    
    /// Total bounties created
    total_bounties_created: u64,
    
    /// Total bounties completed
    total_bounties_completed: u64,
    
    /// Total rewards distributed
    total_rewards_distributed: u128,
}

/// Configurable thresholds for alerts
#[derive(Debug, Clone)]
pub struct AlertThresholds {
    /// Gas price threshold (trigger alert if above)
    pub gas_price_high: u64,
    
    /// TPS threshold (trigger alert if below)
    pub tps_low: f32,
    
    /// Block time threshold (trigger if above, ms)
    pub block_time_high: u64,
    
    /// Utilization threshold (trigger if above)
    pub utilization_high: u8,
    
    /// Pending TX threshold
    pub pending_tx_high: u64,
}

impl Default for AlertThresholds {
    fn default() -> Self {
        Self {
            gas_price_high: 100,
            tps_low: 10.0,
            block_time_high: 10000, // 10 seconds
            utilization_high: 90,
            pending_tx_high: 10000,
        }
    }
}

impl Default for SentinelOracle {
    fn default() -> Self {
        Self::new()
    }
}

impl SentinelOracle {
    /// Create a new Sentinel Oracle
    pub fn new() -> Self {
        Self {
            bounties: alloc::collections::BTreeMap::new(),
            alerts: Vec::new(),
            metrics_history: Vec::new(),
            thresholds: AlertThresholds::default(),
            total_bounties_created: 0,
            total_bounties_completed: 0,
            total_rewards_distributed: 0,
        }
    }
    
    /// Configure thresholds
    pub fn with_thresholds(mut self, thresholds: AlertThresholds) -> Self {
        self.thresholds = thresholds;
        self
    }
    
    // ========================================================================
    // METRICS & MONITORING
    // ========================================================================
    
    /// Update network metrics
    pub fn update_metrics(&mut self, metrics: NetworkMetrics) {
        // Store in history
        self.metrics_history.push(metrics.clone());
        
        // Keep only last 100 samples
        if self.metrics_history.len() > 100 {
            self.metrics_history.remove(0);
        }
        
        // Check for alerts
        self.check_alerts(&metrics);
    }
    
    /// Check metrics against thresholds
    fn check_alerts(&mut self, metrics: &NetworkMetrics) {
        // High gas alert
        if metrics.avg_gas_price > self.thresholds.gas_price_high {
            self.create_alert(
                AlertType::HighGas,
                AlertSeverity::Warning,
                format!("Gas price {} exceeds threshold {}", metrics.avg_gas_price, self.thresholds.gas_price_high),
                vec![("avg_gas_price".into(), metrics.avg_gas_price.to_string())],
            );
        }
        
        // Low TPS alert
        let tps = metrics.tps();
        if tps < self.thresholds.tps_low && tps > 0.0 {
            self.create_alert(
                AlertType::LowThroughput,
                AlertSeverity::Warning,
                format!("TPS {:.2} below threshold {:.2}", tps, self.thresholds.tps_low),
                vec![("tps".into(), format!("{:.2}", tps))],
            );
        }
        
        // High block time alert
        if metrics.avg_block_time_ms > self.thresholds.block_time_high {
            self.create_alert(
                AlertType::LowThroughput,
                AlertSeverity::Error,
                format!("Block time {}ms exceeds threshold {}ms", metrics.avg_block_time_ms, self.thresholds.block_time_high),
                vec![("avg_block_time_ms".into(), metrics.avg_block_time_ms.to_string())],
            );
        }
        
        // High utilization alert
        if metrics.utilization_percent > self.thresholds.utilization_high {
            self.create_alert(
                AlertType::StateBloat,
                AlertSeverity::Warning,
                format!("Network utilization {}% exceeds threshold {}%", metrics.utilization_percent, self.thresholds.utilization_high),
                vec![("utilization_percent".into(), metrics.utilization_percent.to_string())],
            );
        }
        
        // High pending TX alert
        if metrics.pending_tx_count > self.thresholds.pending_tx_high {
            self.create_alert(
                AlertType::StateBloat,
                AlertSeverity::Warning,
                format!("Pending TX count {} exceeds threshold {}", metrics.pending_tx_count, self.thresholds.pending_tx_high),
                vec![("pending_tx_count".into(), metrics.pending_tx_count.to_string())],
            );
        }
    }
    
    /// Create an alert and potentially a bounty
    fn create_alert(
        &mut self,
        alert_type: AlertType,
        severity: AlertSeverity,
        message: String,
        metrics: Vec<(String, String)>,
    ) {
        let alert_id = self.generate_alert_id(&message);
        
        // Check if similar alert already exists (dedupe)
        if self.alerts.iter().any(|a| !a.resolved && a.alert_type == alert_type) {
            return;
        }
        
        let mut alert = SentinelAlert {
            id: alert_id,
            alert_type,
            severity,
            message,
            metrics,
            timestamp: current_timestamp(),
            resolved: false,
            bounty_id: None,
        };
        
        // Create bounty for high severity alerts
        if matches!(severity, AlertSeverity::Error | AlertSeverity::Critical) {
            let bounty = self.create_bounty_for_alert(&alert);
            alert.bounty_id = Some(bounty.id);
            self.bounties.insert(bounty.id, bounty);
        }
        
        self.alerts.push(alert);
    }
    
    /// Create a bounty from an alert
    fn create_bounty_for_alert(&mut self, alert: &SentinelAlert) -> Bounty {
        let (category, reward, capabilities) = match alert.alert_type {
            AlertType::HighGas => (
                BountyCategory::Optimization,
                1_000_000_000_000_000_000u128, // 1 CGT
                vec!["analyze".into(), "optimize".into()],
            ),
            AlertType::LowThroughput => (
                BountyCategory::Optimization,
                2_000_000_000_000_000_000u128, // 2 CGT
                vec!["analyze".into(), "optimize".into()],
            ),
            AlertType::SecurityThreat => (
                BountyCategory::Security,
                10_000_000_000_000_000_000u128, // 10 CGT
                vec!["analyze".into(), "security".into()],
            ),
            AlertType::StateBloat => (
                BountyCategory::Maintenance,
                500_000_000_000_000_000u128, // 0.5 CGT
                vec!["analyze".into(), "maintenance".into()],
            ),
            _ => (
                BountyCategory::Analysis,
                1_000_000_000_000_000_000u128, // 1 CGT
                vec!["analyze".into()],
            ),
        };
        
        let bounty_id = self.generate_bounty_id(&alert.message);
        self.total_bounties_created += 1;
        
        Bounty {
            id: bounty_id,
            title: format!("[AUTO] {}", alert.message),
            description: format!(
                "Automatically generated bounty from Sentinel alert.\n\n\
                Alert Type: {:?}\n\
                Severity: {:?}\n\
                Metrics: {:?}",
                alert.alert_type, alert.severity, alert.metrics
            ),
            category,
            priority: match alert.severity {
                AlertSeverity::Critical => BountyPriority::Critical,
                AlertSeverity::Error => BountyPriority::High,
                AlertSeverity::Warning => BountyPriority::Medium,
                AlertSeverity::Info => BountyPriority::Low,
            },
            status: BountyStatus::Open,
            reward,
            required_capabilities: capabilities,
            min_reputation: 300,
            deadline: current_timestamp() + 24 * 60 * 60, // 24 hours
            created_at: current_timestamp(),
            assigned_to: None,
            verification_criteria: Vec::new(),
            bid_count: 0,
            winning_bid: None,
            solution: None,
        }
    }
    
    // ========================================================================
    // BOUNTY MANAGEMENT
    // ========================================================================
    
    /// Create a manual bounty
    pub fn create_bounty(
        &mut self,
        title: String,
        description: String,
        category: BountyCategory,
        priority: BountyPriority,
        reward: u128,
        deadline: u64,
        required_capabilities: Vec<String>,
        min_reputation: u32,
    ) -> [u8; 32] {
        let bounty_id = self.generate_bounty_id(&title);
        self.total_bounties_created += 1;
        
        let bounty = Bounty {
            id: bounty_id,
            title,
            description,
            category,
            priority,
            status: BountyStatus::Open,
            reward,
            required_capabilities,
            min_reputation,
            deadline,
            created_at: current_timestamp(),
            assigned_to: None,
            verification_criteria: Vec::new(),
            bid_count: 0,
            winning_bid: None,
            solution: None,
        };
        
        self.bounties.insert(bounty_id, bounty);
        bounty_id
    }
    
    /// Submit a bid on a bounty
    pub fn submit_bid(
        &mut self,
        bounty_id: &[u8; 32],
        agent_did: &AgentDid,
        approach: String,
        estimated_time: u64,
        requested_reward: u128,
        agent_reputation: u32,
    ) -> Result<(), AgenticError> {
        let bounty = self.bounties.get_mut(bounty_id)
            .ok_or(AgenticError::AgentNotFound)?;
        
        // Check status
        if bounty.status != BountyStatus::Open {
            return Err(AgenticError::NotAuthorized);
        }
        
        // Check deadline
        if current_timestamp() > bounty.deadline {
            return Err(AgenticError::ApprovalExpired);
        }
        
        // Check reputation
        if agent_reputation < bounty.min_reputation {
            return Err(AgenticError::NotAuthorized);
        }
        
        // Check reward
        if requested_reward > bounty.reward {
            return Err(AgenticError::NotAuthorized);
        }
        
        let bid = BountyBid {
            agent_did: agent_did.did_string.clone(),
            approach,
            estimated_time,
            requested_reward,
            agent_reputation,
            timestamp: current_timestamp(),
        };
        
        bounty.bid_count += 1;
        
        // Auto-assign if this is the first bid (simplified)
        // In production, you'd want a more sophisticated selection
        if bounty.winning_bid.is_none() {
            bounty.winning_bid = Some(bid);
            bounty.assigned_to = Some(agent_did.did_string.clone());
            bounty.status = BountyStatus::Assigned;
        }
        
        Ok(())
    }
    
    /// Submit a solution to a bounty
    pub fn submit_solution(
        &mut self,
        bounty_id: &[u8; 32],
        agent_did: &AgentDid,
        solution_data: Vec<u8>,
        vcp: Option<VerifiableComputeProof>,
    ) -> Result<(), AgenticError> {
        let bounty = self.bounties.get_mut(bounty_id)
            .ok_or(AgenticError::AgentNotFound)?;
        
        // Check assignment
        if bounty.assigned_to.as_ref() != Some(&agent_did.did_string) {
            return Err(AgenticError::NotAuthorized);
        }
        
        // Check status
        if !matches!(bounty.status, BountyStatus::Assigned | BountyStatus::InProgress) {
            return Err(AgenticError::NotAuthorized);
        }
        
        bounty.solution = Some(BountySolution {
            solver_did: agent_did.did_string.clone(),
            data: solution_data,
            vcp,
            submitted_at: current_timestamp(),
            verified: false,
            notes: String::new(),
        });
        
        bounty.status = BountyStatus::PendingVerification;
        
        Ok(())
    }
    
    /// Verify and complete a bounty
    pub fn verify_solution(
        &mut self,
        bounty_id: &[u8; 32],
        verified: bool,
        notes: String,
    ) -> Result<u128, AgenticError> {
        let bounty = self.bounties.get_mut(bounty_id)
            .ok_or(AgenticError::AgentNotFound)?;
        
        if bounty.status != BountyStatus::PendingVerification {
            return Err(AgenticError::NotAuthorized);
        }
        
        let solution = bounty.solution.as_mut()
            .ok_or(AgenticError::AgentNotFound)?;
        
        solution.verified = verified;
        solution.notes = notes;
        
        if verified {
            bounty.status = BountyStatus::Completed;
            self.total_bounties_completed += 1;
            
            let reward = bounty.winning_bid.as_ref()
                .map(|b| b.requested_reward)
                .unwrap_or(bounty.reward);
            
            self.total_rewards_distributed += reward;
            
            // Resolve associated alert
            if let Some(alert) = self.alerts.iter_mut().find(|a| a.bounty_id == Some(*bounty_id)) {
                alert.resolved = true;
            }
            
            Ok(reward)
        } else {
            bounty.status = BountyStatus::Failed;
            Ok(0)
        }
    }
    
    // ========================================================================
    // QUERIES
    // ========================================================================
    
    /// Get open bounties
    pub fn get_open_bounties(&self) -> Vec<&Bounty> {
        self.bounties.values()
            .filter(|b| b.status == BountyStatus::Open)
            .collect()
    }
    
    /// Get bounties by category
    pub fn get_bounties_by_category(&self, category: BountyCategory) -> Vec<&Bounty> {
        self.bounties.values()
            .filter(|b| b.category == category && b.status == BountyStatus::Open)
            .collect()
    }
    
    /// Get bounty by ID
    pub fn get_bounty(&self, id: &[u8; 32]) -> Option<&Bounty> {
        self.bounties.get(id)
    }
    
    /// Get active alerts
    pub fn get_active_alerts(&self) -> Vec<&SentinelAlert> {
        self.alerts.iter()
            .filter(|a| !a.resolved)
            .collect()
    }
    
    /// Get network health summary
    pub fn get_health_summary(&self) -> NetworkHealthSummary {
        let latest = self.metrics_history.last();
        
        NetworkHealthSummary {
            status: self.calculate_health_status(),
            active_alerts: self.alerts.iter().filter(|a| !a.resolved).count() as u32,
            open_bounties: self.bounties.values().filter(|b| b.status == BountyStatus::Open).count() as u32,
            total_bounties_completed: self.total_bounties_completed,
            total_rewards_distributed: self.total_rewards_distributed,
            latest_metrics: latest.cloned(),
        }
    }
    
    /// Calculate overall health status
    fn calculate_health_status(&self) -> HealthStatus {
        let critical_alerts = self.alerts.iter()
            .filter(|a| !a.resolved && a.severity == AlertSeverity::Critical)
            .count();
        
        let error_alerts = self.alerts.iter()
            .filter(|a| !a.resolved && a.severity == AlertSeverity::Error)
            .count();
        
        if critical_alerts > 0 {
            HealthStatus::Critical
        } else if error_alerts > 0 {
            HealthStatus::Degraded
        } else {
            HealthStatus::Healthy
        }
    }
    
    // ========================================================================
    // HELPERS
    // ========================================================================
    
    fn generate_bounty_id(&self, seed: &str) -> [u8; 32] {
        use sha2::{Sha256, Digest};
        let mut hasher = Sha256::new();
        hasher.update(seed.as_bytes());
        hasher.update(&self.total_bounties_created.to_le_bytes());
        hasher.update(&current_timestamp().to_le_bytes());
        hasher.finalize().into()
    }
    
    fn generate_alert_id(&self, seed: &str) -> [u8; 32] {
        use sha2::{Sha256, Digest};
        let mut hasher = Sha256::new();
        hasher.update(b"alert:");
        hasher.update(seed.as_bytes());
        hasher.update(&current_timestamp().to_le_bytes());
        hasher.finalize().into()
    }
}

// ============================================================================
// HEALTH SUMMARY
// ============================================================================

/// Network health summary
#[derive(Debug, Clone, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct NetworkHealthSummary {
    /// Overall status
    pub status: HealthStatus,
    
    /// Number of active alerts
    pub active_alerts: u32,
    
    /// Number of open bounties
    pub open_bounties: u32,
    
    /// Total bounties completed
    pub total_bounties_completed: u64,
    
    /// Total rewards distributed
    pub total_rewards_distributed: u128,
    
    /// Latest metrics
    pub latest_metrics: Option<NetworkMetrics>,
}

/// Health status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum HealthStatus {
    Healthy,
    Degraded,
    Critical,
}

// ============================================================================
// HELPERS
// ============================================================================

#[cfg(feature = "std")]
fn current_timestamp() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

#[cfg(not(feature = "std"))]
fn current_timestamp() -> u64 {
    // In no_std environment, timestamp must be provided externally
    // This is a placeholder that should be replaced by on-chain block timestamp
    0
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agent_did::{create_agent_did, AutonomyLevel};
    
    #[test]
    fn test_sentinel_creation() {
        let sentinel = SentinelOracle::new();
        assert_eq!(sentinel.total_bounties_created, 0);
        assert_eq!(sentinel.total_bounties_completed, 0);
    }
    
    #[test]
    fn test_create_bounty() {
        let mut sentinel = SentinelOracle::new();
        
        let bounty_id = sentinel.create_bounty(
            "Optimize Gas Usage".into(),
            "Reduce average gas consumption".into(),
            BountyCategory::Optimization,
            BountyPriority::Medium,
            1_000_000_000_000_000_000,
            current_timestamp() + 86400,
            vec!["analyze".into()],
            100,
        );
        
        assert!(sentinel.get_bounty(&bounty_id).is_some());
        assert_eq!(sentinel.get_open_bounties().len(), 1);
    }
    
    #[test]
    fn test_submit_bid() {
        let mut sentinel = SentinelOracle::new();
        
        let bounty_id = sentinel.create_bounty(
            "Test Bounty".into(),
            "Test".into(),
            BountyCategory::Analysis,
            BountyPriority::Low,
            1_000_000_000_000_000_000,
            current_timestamp() + 86400,
            vec![],
            0,
        );
        
        let did = create_agent_did(b"controller", AutonomyLevel::Bounded, vec![]).unwrap();
        
        let result = sentinel.submit_bid(
            &bounty_id,
            &did,
            "My approach".into(),
            3600,
            900_000_000_000_000_000,
            500,
        );
        
        assert!(result.is_ok());
        
        let bounty = sentinel.get_bounty(&bounty_id).unwrap();
        assert_eq!(bounty.status, BountyStatus::Assigned);
        assert!(bounty.winning_bid.is_some());
    }
    
    #[test]
    fn test_alert_generation() {
        let mut sentinel = SentinelOracle::new();
        
        let mut metrics = NetworkMetrics {
            avg_gas_price: 200, // Above threshold
            ..Default::default()
        };
        metrics.set_tps(5.0); // Below threshold
        
        sentinel.update_metrics(metrics);
        
        let alerts = sentinel.get_active_alerts();
        assert!(alerts.len() > 0);
    }
    
    #[test]
    fn test_complete_bounty_flow() {
        let mut sentinel = SentinelOracle::new();
        
        let bounty_id = sentinel.create_bounty(
            "Test Bounty".into(),
            "Test".into(),
            BountyCategory::Analysis,
            BountyPriority::Low,
            1_000_000_000_000_000_000,
            current_timestamp() + 86400,
            vec![],
            0,
        );
        
        let did = create_agent_did(b"controller", AutonomyLevel::Bounded, vec![]).unwrap();
        
        // Submit bid
        sentinel.submit_bid(
            &bounty_id,
            &did,
            "Approach".into(),
            3600,
            1_000_000_000_000_000_000,
            500,
        ).unwrap();
        
        // Submit solution
        sentinel.submit_solution(
            &bounty_id,
            &did,
            b"solution data".to_vec(),
            None,
        ).unwrap();
        
        // Verify
        let reward = sentinel.verify_solution(&bounty_id, true, "Good work".into()).unwrap();
        assert_eq!(reward, 1_000_000_000_000_000_000);
        assert_eq!(sentinel.total_bounties_completed, 1);
    }
    
    #[test]
    fn test_health_summary() {
        let mut sentinel = SentinelOracle::new();
        
        // Normal metrics
        sentinel.update_metrics(NetworkMetrics::default());
        
        let summary = sentinel.get_health_summary();
        assert_eq!(summary.status, HealthStatus::Healthy);
    }
}
