//! # Agent DID (Decentralized Identifier for Autonomous Agents)
//!
//! Extends the Qor Identity system to support AI agents as sovereign entities.
//!
//! ## DID Format
//!
//! ```text
//! did:demiurge:agent:<network>:<unique-id>
//!                    │
//!                    └── "agent" namespace distinguishes from human DIDs
//! ```

use alloc::{format, string::{String, ToString}, vec::Vec, vec};
use codec::{Decode, Encode};
use scale_info::TypeInfo;
use serde::{Deserialize, Serialize};

use crate::error::AgenticError;

/// Agent autonomy level
#[derive(Debug, Clone, Copy, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum AutonomyLevel {
    /// Human approves all transactions
    Supervised,
    /// Pre-approved action types + spending limit
    Bounded,
    /// Full signing authority
    Autonomous,
    /// Can spawn sub-agents
    Sovereign,
}

impl Default for AutonomyLevel {
    fn default() -> Self {
        Self::Supervised
    }
}

/// Agent capability flags
#[derive(Debug, Clone, Copy, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub enum Capability {
    /// Can read on-chain data
    Read,
    /// Can analyze data (inference)
    Analyze,
    /// Can execute trades
    Trade,
    /// Can transfer tokens
    Transfer,
    /// Can create content
    Create,
    /// Can modify DRC-369 assets
    ModifyAssets,
    /// Can participate in governance
    Governance,
    /// Can spawn sub-agents
    SpawnAgents,
    /// Can interact with external systems
    ExternalApi,
}

/// Agent DID identifier
#[derive(Debug, Clone, PartialEq, Eq, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct AgentDid {
    /// Network identifier (mainnet, testnet)
    pub network: String,
    
    /// Unique agent identifier (32 bytes hex)
    pub unique_id: [u8; 32],
    
    /// Full DID string
    pub did_string: String,
}

impl AgentDid {
    /// Create a new Agent DID
    pub fn new(network: &str, unique_id: [u8; 32]) -> Self {
        let did_string = format!(
            "did:demiurge:agent:{}:0x{}",
            network,
            hex::encode(unique_id)
        );
        
        Self {
            network: network.into(),
            unique_id,
            did_string,
        }
    }
    
    /// Parse from DID string
    pub fn from_string(did: &str) -> Result<Self, AgenticError> {
        let parts: Vec<&str> = did.split(':').collect();
        
        if parts.len() != 5 {
            return Err(AgenticError::InvalidDid("Invalid DID format".into()));
        }
        
        if parts[0] != "did" || parts[1] != "demiurge" || parts[2] != "agent" {
            return Err(AgenticError::InvalidDid("Not an agent DID".into()));
        }
        
        let network = parts[3].to_string();
        let id_hex = parts[4].strip_prefix("0x").unwrap_or(parts[4]);
        
        let unique_id: [u8; 32] = hex::decode(id_hex)
            .map_err(|_| AgenticError::InvalidDid("Invalid hex".into()))?
            .try_into()
            .map_err(|_| AgenticError::InvalidDid("Invalid ID length".into()))?;
        
        Ok(Self {
            network,
            unique_id,
            did_string: did.to_string(),
        })
    }
}

/// Agent metadata stored in DID document
#[derive(Debug, Clone, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct AgentMetadata {
    /// Agent type
    pub agent_type: String,
    
    /// Model identifier
    pub model_id: [u8; 32],
    
    /// Model name (human-readable)
    pub model_name: String,
    
    /// Model weights hash (for verification)
    pub model_hash: [u8; 32],
    
    /// Capabilities
    pub capabilities: Vec<Capability>,
    
    /// Funding limit per epoch
    pub funding_limit: u128,
    
    /// Autonomy level
    pub autonomy_level: AutonomyLevel,
    
    /// Mission description
    pub mission: String,
    
    /// Creation timestamp
    pub created_at: u64,
    
    /// Last active timestamp
    pub last_active: u64,
    
    /// Reputation score (0-1000)
    pub reputation: u32,
    
    /// Total successful inferences
    pub inference_count: u64,
}

impl Default for AgentMetadata {
    fn default() -> Self {
        Self {
            agent_type: "EtherealAgent".into(),
            model_id: [0u8; 32],
            model_name: String::new(),
            model_hash: [0u8; 32],
            capabilities: vec![Capability::Read, Capability::Analyze],
            funding_limit: 0,
            autonomy_level: AutonomyLevel::Supervised,
            mission: String::new(),
            created_at: 0,
            last_active: 0,
            reputation: 500, // Start at neutral
            inference_count: 0,
        }
    }
}

/// Complete Agent DID Document
#[derive(Debug, Clone, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct AgentDidDocument {
    /// Context (JSON-LD)
    pub context: Vec<String>,
    
    /// Agent DID
    pub id: AgentDid,
    
    /// Controller DID (human/creator)
    pub controller: Vec<u8>,
    
    /// Agent metadata
    pub agent_metadata: AgentMetadata,
    
    /// Public key for verification
    pub public_key: Vec<u8>,
    
    /// Signature scheme
    pub signature_scheme: String,
    
    /// Service endpoints
    pub services: Vec<AgentService>,
    
    /// Is active
    pub active: bool,
    
    /// Deactivation reason (if deactivated)
    pub deactivation_reason: Option<String>,
}

/// Agent service endpoint
#[derive(Debug, Clone, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct AgentService {
    /// Service ID
    pub id: String,
    
    /// Service type
    pub service_type: String,
    
    /// Endpoint URL/URI
    pub endpoint: String,
}

impl AgentDidDocument {
    /// Create a new agent DID document
    pub fn new(
        agent_did: AgentDid,
        controller: Vec<u8>,
        public_key: Vec<u8>,
        signature_scheme: &str,
        metadata: AgentMetadata,
    ) -> Self {
        Self {
            context: vec![
                "https://www.w3.org/ns/did/v1".into(),
                "https://demiurge.cloud/ns/agent/v1".into(),
            ],
            id: agent_did.clone(),
            controller,
            agent_metadata: metadata,
            public_key,
            signature_scheme: signature_scheme.into(),
            services: vec![
                AgentService {
                    id: format!("{}#inference", agent_did.did_string),
                    service_type: "VerifiableInference".into(),
                    endpoint: format!("demiurge://forge/agent/{}", hex::encode(agent_did.unique_id)),
                },
                AgentService {
                    id: format!("{}#memory", agent_did.did_string),
                    service_type: "VectorStateKernel".into(),
                    endpoint: format!("demiurge://vector/{}", hex::encode(agent_did.unique_id)),
                },
            ],
            active: true,
            deactivation_reason: None,
        }
    }
    
    /// Check if agent has a capability
    pub fn has_capability(&self, cap: Capability) -> bool {
        self.agent_metadata.capabilities.contains(&cap)
    }
    
    /// Check if agent can perform autonomous actions
    pub fn is_autonomous(&self) -> bool {
        matches!(
            self.agent_metadata.autonomy_level,
            AutonomyLevel::Autonomous | AutonomyLevel::Sovereign
        )
    }
    
    /// Deactivate agent (kill switch)
    pub fn deactivate(&mut self, reason: &str) {
        self.active = false;
        self.deactivation_reason = Some(reason.into());
    }
    
    /// Update reputation
    pub fn update_reputation(&mut self, delta: i32) {
        let new_rep = (self.agent_metadata.reputation as i32 + delta).clamp(0, 1000);
        self.agent_metadata.reputation = new_rep as u32;
    }
}

/// Create a new agent DID
pub fn create_agent_did(
    controller: &[u8],
    autonomy: AutonomyLevel,
    capabilities: Vec<Capability>,
) -> Result<AgentDid, AgenticError> {
    // Generate unique ID from controller + timestamp + random
    use blake3::Hasher;
    
    let mut hasher = Hasher::new();
    hasher.update(controller);
    hasher.update(&(std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos() as u64).to_le_bytes());
    
    // Add some randomness
    let random_bytes: [u8; 16] = rand::random();
    hasher.update(&random_bytes);
    
    let unique_id: [u8; 32] = hasher.finalize().into();
    
    Ok(AgentDid::new("mainnet", unique_id))
}

/// Verify an agent DID is valid and active
pub fn verify_agent_did(did: &AgentDid, document: &AgentDidDocument) -> Result<bool, AgenticError> {
    // Check DID matches document
    if did.did_string != document.id.did_string {
        return Ok(false);
    }
    
    // Check agent is active
    if !document.active {
        return Err(AgenticError::AgentDeactivated(
            document.deactivation_reason.clone().unwrap_or_default()
        ));
    }
    
    Ok(true)
}

/// Agent registry for managing all agents
#[derive(Debug, Default)]
pub struct AgentRegistry {
    /// All registered agents
    agents: alloc::collections::BTreeMap<[u8; 32], AgentDidDocument>,
    
    /// Total agents created
    total_created: u64,
    
    /// Active agents
    active_count: u64,
}

impl AgentRegistry {
    pub fn new() -> Self {
        Self::default()
    }
    
    /// Register a new agent
    pub fn register(&mut self, document: AgentDidDocument) -> Result<(), AgenticError> {
        let id = document.id.unique_id;
        
        if self.agents.contains_key(&id) {
            return Err(AgenticError::AgentAlreadyExists);
        }
        
        self.agents.insert(id, document);
        self.total_created += 1;
        self.active_count += 1;
        
        Ok(())
    }
    
    /// Get agent by DID
    pub fn get(&self, did: &AgentDid) -> Option<&AgentDidDocument> {
        self.agents.get(&did.unique_id)
    }
    
    /// Get mutable agent by DID
    pub fn get_mut(&mut self, did: &AgentDid) -> Option<&mut AgentDidDocument> {
        self.agents.get_mut(&did.unique_id)
    }
    
    /// Deactivate an agent (only controller can call)
    pub fn deactivate(&mut self, did: &AgentDid, controller: &[u8], reason: &str) -> Result<(), AgenticError> {
        let doc = self.agents.get_mut(&did.unique_id)
            .ok_or(AgenticError::AgentNotFound)?;
        
        // Verify controller
        if doc.controller != controller {
            return Err(AgenticError::NotAuthorized);
        }
        
        doc.deactivate(reason);
        self.active_count = self.active_count.saturating_sub(1);
        
        Ok(())
    }
    
    /// Get agents by capability
    pub fn find_by_capability(&self, cap: Capability) -> Vec<&AgentDidDocument> {
        self.agents.values()
            .filter(|doc| doc.active && doc.has_capability(cap))
            .collect()
    }
    
    /// Get total active agents
    pub fn active_count(&self) -> u64 {
        self.active_count
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_agent_did_creation() {
        let controller = b"did:demiurge:mainnet:0x1234";
        let did = create_agent_did(
            controller,
            AutonomyLevel::Bounded,
            vec![Capability::Read, Capability::Trade],
        ).unwrap();
        
        assert!(did.did_string.starts_with("did:demiurge:agent:mainnet:0x"));
        assert_eq!(did.network, "mainnet");
    }
    
    #[test]
    fn test_agent_did_parsing() {
        let unique_id = [1u8; 32];
        let did = AgentDid::new("testnet", unique_id);
        
        let parsed = AgentDid::from_string(&did.did_string).unwrap();
        assert_eq!(parsed.unique_id, unique_id);
        assert_eq!(parsed.network, "testnet");
    }
    
    #[test]
    fn test_agent_registry() {
        let mut registry = AgentRegistry::new();
        
        let controller = b"controller".to_vec();
        let did = create_agent_did(&controller, AutonomyLevel::Bounded, vec![]).unwrap();
        
        let document = AgentDidDocument::new(
            did.clone(),
            controller.clone(),
            vec![1, 2, 3], // mock public key
            "Ed25519",
            AgentMetadata::default(),
        );
        
        registry.register(document).unwrap();
        
        assert_eq!(registry.active_count(), 1);
        assert!(registry.get(&did).is_some());
        
        // Deactivate
        registry.deactivate(&did, &controller, "Test deactivation").unwrap();
        assert_eq!(registry.active_count(), 0);
        assert!(!registry.get(&did).unwrap().active);
    }
    
    #[test]
    fn test_autonomy_levels() {
        let metadata = AgentMetadata {
            autonomy_level: AutonomyLevel::Sovereign,
            ..Default::default()
        };
        
        let did = AgentDid::new("mainnet", [0u8; 32]);
        let doc = AgentDidDocument::new(
            did,
            vec![],
            vec![],
            "Ed25519",
            metadata,
        );
        
        assert!(doc.is_autonomous());
    }
}
