//! # Demiurge Agentic Integration Layer
//!
//! This module provides the infrastructure for AI Agents as First-Class Citizens
//! in the Demiurge ecosystem.
//!
//! ## Components
//!
//! - **Agent DID**: Sovereign identity for autonomous agents
//! - **Agentic Wallet**: Self-custodial key management with spending limits
//! - **Vector-State Kernel**: Persistent on-chain memory for agents
//! - **The Forge**: Verifiable Compute Proof generation
//!
//! ## Architecture
//!
//! ```text
//! ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
//! │   Agent DID     │────▶│  Agentic Wallet │────▶│  Vector-State   │
//! │   (Identity)    │     │  (Actions)      │     │  (Memory)       │
//! └─────────────────┘     └─────────────────┘     └─────────────────┘
//!          │                      │                       │
//!          └──────────────────────┼───────────────────────┘
//!                                 ▼
//!                    ┌─────────────────────────┐
//!                    │      THE FORGE          │
//!                    │  (Verifiable Compute)   │
//!                    └─────────────────────────┘
//! ```

#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

pub mod agent_did;
pub mod wallet;
pub mod forge;
pub mod memory;
pub mod vcp_circuits;
pub mod sentinel;
pub mod error;

pub use agent_did::{
    AgentDid, AgentDidDocument, AgentMetadata, AutonomyLevel, Capability,
    create_agent_did, verify_agent_did,
};

pub use wallet::{
    AgenticWallet, ActionType, SpendingLimit, WalletConfig,
    create_agentic_wallet, sign_agent_transaction,
};

pub use forge::{
    VerifiableComputeProof, InferenceRequest, InferenceResult,
    ModelAttestation, SentinelAttestation, ForgeRegistry,
};

pub use vcp_circuits::{
    VcpGenerator, VcpPublicInputs, VcpWitness, AttestationWitness,
};

pub use sentinel::{
    SentinelOracle, Bounty, BountyBid, BountySolution,
    BountyCategory, BountyPriority, BountyStatus,
    NetworkMetrics, SentinelAlert, AlertType, AlertSeverity,
    NetworkHealthSummary, HealthStatus, AlertThresholds,
};

pub use memory::{
    VectorMemory, MemoryType, AgentContext, VectorStateKernel,
    store_memory, query_memories, inject_asset_context,
};

pub use error::AgenticError;

/// Agent configuration for creation
#[derive(Debug, Clone)]
pub struct AgentConfig {
    /// Human-readable name
    pub name: alloc::string::String,
    
    /// Model identifier
    pub model_id: [u8; 32],
    
    /// Autonomy level
    pub autonomy: AutonomyLevel,
    
    /// Capabilities
    pub capabilities: alloc::vec::Vec<Capability>,
    
    /// Spending limit per epoch
    pub spending_limit: u128,
    
    /// Controller DID
    pub controller: alloc::vec::Vec<u8>,
    
    /// Mission description
    pub mission: alloc::string::String,
}

/// Create a complete agent with DID, wallet, and memory
pub fn create_agent(config: AgentConfig) -> Result<(AgentDid, AgenticWallet), AgenticError> {
    // Generate agent DID
    let agent_did = create_agent_did(
        &config.controller,
        config.autonomy,
        config.capabilities.clone(),
    )?;
    
    // Create agentic wallet
    let wallet = create_agentic_wallet(
        agent_did.clone(),
        config.controller.clone(),
        config.spending_limit,
        config.capabilities,
        config.autonomy,
    )?;
    
    Ok((agent_did, wallet))
}
