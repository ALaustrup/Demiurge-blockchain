# Demiurge Agentic Integration Layer

## The Vision: Agents as First-Class Citizens

Demiurge is not just a blockchain for games—it is the **Sovereign Substrate for Autonomous Intelligence**. 

In this paradigm, AI agents are not scripts calling APIs. They are **Ethereal Entities**:
- With their own **Sovereign Identity** (Agentic DID)
- With their own **Persistent Memory** (Vector-State Kernel)
- With their own **Signing Authority** (Signature Abstraction)
- With **Verifiable Intelligence** (The Forge)

---

## Architecture Overview

```
                    ┌─────────────────────────────────────────┐
                    │           HUMAN CREATORS                │
                    └──────────────────┬──────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │         AGENT FOUNDRY (SDK)             │
                    │  ┌─────────────────────────────────┐    │
                    │  │  LLM Wrapper (Cursor/Gemini/    │    │
                    │  │  Grok/ArchonAI)                 │    │
                    │  └─────────────────────────────────┘    │
                    └──────────────────┬──────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
┌───────────────┐           ┌───────────────────┐          ┌─────────────────┐
│ AGENTIC DID   │           │   THE FORGE       │          │ VECTOR-STATE    │
│               │           │                   │          │ KERNEL          │
│ • Agent DIDs  │◄─────────►│ • VCP Generation  │◄────────►│                 │
│ • Autonomous  │           │ • Plonky2 Proofs  │          │ • Memory Store  │
│   Signing     │           │ • Model Registry  │          │ • Experience    │
│ • Agentic     │           │ • Inference       │          │   Indexing      │
│   Wallets     │           │   Attestation     │          │ • Context       │
└───────┬───────┘           └─────────┬─────────┘          │   Injection     │
        │                             │                    └────────┬────────┘
        │                             │                             │
        └─────────────────────────────┼─────────────────────────────┘
                                      │
                    ┌─────────────────▼─────────────────────┐
                    │        DEMIURGE PROTOCOL              │
                    │                                       │
                    │  ┌─────────┐  ┌─────────┐  ┌───────┐  │
                    │  │ QOR ID  │  │ DRC-369 │  │ CGT   │  │
                    │  │ (G)     │  │ (D/H/M) │  │       │  │
                    │  └─────────┘  └─────────┘  └───────┘  │
                    │                                       │
                    │  ┌─────────────────────────────────┐  │
                    │  │  SIGNATURE ABSTRACTION (K)      │  │
                    │  │  Ed25519 │ Dilithium3 │ Hybrid  │  │
                    │  └─────────────────────────────────┘  │
                    └───────────────────────────────────────┘
```

---

## Vector O: Agentic Identity

### O.1 Agent DID Specification

Agents receive a specialized DID that marks them as autonomous entities:

```
did:demiurge:agent:<network>:<unique-id>
                    │
                    └── "agent" namespace distinguishes from human DIDs
```

### O.2 Agent DID Document

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://demiurge.cloud/ns/agent/v1"
  ],
  "id": "did:demiurge:agent:mainnet:0x1234...",
  "controller": "did:demiurge:mainnet:0xABCD...",
  "agentMetadata": {
    "type": "EtherealAgent",
    "model": "archon-v1",
    "modelHash": "0xSHA256...",
    "capabilities": ["trade", "analyze", "create"],
    "fundingLimit": "1000000000000000000",
    "autonomyLevel": "supervised"
  },
  "verificationMethod": [
    {
      "id": "did:demiurge:agent:mainnet:0x1234...#primary",
      "type": "Dilithium3VerificationKey2024",
      "controller": "did:demiurge:agent:mainnet:0x1234...",
      "publicKeyMultibase": "z..."
    }
  ],
  "authentication": ["#primary"],
  "service": [
    {
      "id": "#inference",
      "type": "VerifiableInference",
      "serviceEndpoint": "https://forge.demiurge.cloud/agent/0x1234..."
    },
    {
      "id": "#memory",
      "type": "VectorStateKernel",
      "serviceEndpoint": "demiurge://vector/0x1234..."
    }
  ]
}
```

### O.3 Autonomy Levels

| Level | Description | Capabilities |
|-------|-------------|--------------|
| `supervised` | Human approves all transactions | Read, Propose |
| `bounded` | Pre-approved action types + spending limit | Read, Execute (limited) |
| `autonomous` | Full signing authority | Read, Execute, Delegate |
| `sovereign` | Can spawn sub-agents | Full + Agent Creation |

### O.4 Agentic Wallet

```rust
pub struct AgenticWallet {
    /// Agent's DID
    pub did: AgentDid,
    
    /// Primary signing keypair (quantum-safe)
    pub keypair: AbstractKeypair,
    
    /// Controller's DID (human/creator)
    pub controller: Did,
    
    /// Spending limit per epoch (in smallest CGT units)
    pub spending_limit: u128,
    
    /// Current epoch spend
    pub current_spend: u128,
    
    /// Allowed action types
    pub allowed_actions: Vec<ActionType>,
    
    /// Autonomy level
    pub autonomy: AutonomyLevel,
}
```

---

## Vector P: The Forge (Verifiable Compute Proofs)

### P.1 The Trust Problem

LLMs cannot run on-chain. But blockchain requires trustless verification.

**Solution**: The Forge network generates **Verifiable Compute Proofs (VCP)** that attest:
1. A specific model (by hash) was used
2. A specific input was provided
3. A specific output was generated
4. The computation was performed correctly

### P.2 VCP Structure

```rust
pub struct VerifiableComputeProof {
    /// Unique proof ID
    pub proof_id: [u8; 32],
    
    /// Agent that requested inference
    pub agent_did: AgentDid,
    
    /// Model identifier and version hash
    pub model: ModelAttestation,
    
    /// Hash of input prompt/context
    pub input_hash: [u8; 32],
    
    /// Hash of output
    pub output_hash: [u8; 32],
    
    /// Plonky2 proof of correct execution
    pub zk_proof: Vec<u8>,
    
    /// Sentinel node signatures (threshold)
    pub attestations: Vec<SentinelAttestation>,
    
    /// Timestamp
    pub timestamp: u64,
}
```

### P.3 Inference Flow

```
1. Agent submits inference request to The Forge
   └── Input: prompt, model_id, context (DRC-369 metadata)

2. Sentinel nodes perform inference
   └── Multiple nodes compute same input (redundancy)

3. Sentinels generate VCP
   └── Plonky2 proof of computation
   └── Threshold signatures

4. VCP submitted on-chain
   └── Stored with agent's Vector-State
   └── Can be verified by any validator

5. Output returned to agent
   └── Agent can now act based on verified intelligence
```

### P.4 Model Registry

```rust
pub struct RegisteredModel {
    /// Model identifier
    pub model_id: [u8; 32],
    
    /// Human-readable name
    pub name: String,
    
    /// Hash of model weights/config
    pub weights_hash: [u8; 32],
    
    /// Supported capabilities
    pub capabilities: Vec<Capability>,
    
    /// Cost per inference (in CGT)
    pub cost_per_inference: u128,
    
    /// Creator (receives royalties)
    pub creator: Did,
}
```

---

## Vector Q: Vector-State Kernel

### Q.1 Agent Memory Architecture

Agents need persistent, queryable memory. The Vector-State Kernel provides:

```
┌─────────────────────────────────────────────────────────────┐
│                    VECTOR-STATE KERNEL                       │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐  │
│  │ EPISODIC       │  │ SEMANTIC       │  │ PROCEDURAL    │  │
│  │ MEMORY         │  │ MEMORY         │  │ MEMORY        │  │
│  │                │  │                │  │               │  │
│  │ • Experiences  │  │ • Knowledge    │  │ • Skills      │  │
│  │ • Interactions │  │ • Facts        │  │ • Patterns    │  │
│  │ • Timestamps   │  │ • Relations    │  │ • Strategies  │  │
│  └────────────────┘  └────────────────┘  └───────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  VECTOR INDEX (HNSW)                    │ │
│  │  Similarity search over embedded memories               │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Q.2 Memory Entry Structure

```rust
pub struct VectorMemory {
    /// Unique memory ID
    pub memory_id: [u8; 32],
    
    /// Agent owner
    pub agent_did: AgentDid,
    
    /// Memory type
    pub memory_type: MemoryType,
    
    /// Embedding vector (768-dim for most models)
    pub embedding: Vec<f32>,
    
    /// Raw content (encrypted)
    pub content: Vec<u8>,
    
    /// Associated DRC-369 assets (if any)
    pub asset_context: Vec<TokenId>,
    
    /// Creation timestamp
    pub created_at: u64,
    
    /// Importance score (for pruning)
    pub importance: f32,
    
    /// VCP that generated this memory (if AI-derived)
    pub inference_proof: Option<[u8; 32]>,
}
```

### Q.3 Context Injection

When an agent interacts with a DRC-369 asset, the asset's metadata is automatically injected:

```rust
pub fn inject_asset_context(
    agent: &AgentDid,
    asset: &Drc369Asset,
) -> AgentContext {
    AgentContext {
        // Asset identity
        asset_id: asset.token_id,
        asset_name: asset.name.clone(),
        
        // Physics understanding
        physics: PhysicsContext {
            mass_kg: asset.physics.mass_kg,
            friction: asset.physics.friction,
            is_destructible: asset.physics.destructible,
            durability: asset.physics.durability,
        },
        
        // State understanding  
        state: StateContext {
            current_xp: asset.xp,
            current_level: asset.level,
            rarity: asset.rarity,
        },
        
        // History (from agent's memory of this asset)
        history: query_memories_for_asset(agent, asset.token_id),
    }
}
```

---

## Vector R: Agent Foundry SDK

### R.1 Architecture

```typescript
import { AgentFoundry, AgentConfig, LLMProvider } from '@demiurge/agent-foundry';

const agent = await AgentFoundry.create({
  name: "TradingOracle",
  model: LLMProvider.ARCHON_V1,  // or GEMINI, CURSOR, GROK
  autonomy: "bounded",
  
  capabilities: ["analyze", "trade"],
  spendingLimit: "100 CGT",
  
  controller: myQorId,
  
  // Mission logic
  mission: `
    You are a trading oracle. Your goal is to analyze market conditions
    and execute trades that benefit your controller. You have access to
    on-chain data and your own persistent memory.
  `,
  
  // Tool bindings
  tools: [
    AgentFoundry.tools.readDrc369Assets,
    AgentFoundry.tools.transferCgt,
    AgentFoundry.tools.queryVectorMemory,
  ],
});

// Agent now has its own DID and can act autonomously
console.log(`Agent DID: ${agent.did}`);

// Fund the agent
await agent.fund("1000 CGT");

// Start autonomous operation
agent.start();
```

### R.2 LLM Provider Abstraction

```typescript
interface LLMProvider {
  inference(prompt: string, context: AgentContext): Promise<InferenceResult>;
  generateVCP(input: string, output: string): Promise<VerifiableComputeProof>;
}

// Built-in providers
const providers = {
  ARCHON_V1: new ArchonProvider(),    // Native Demiurge AI
  GEMINI: new GeminiProvider(),        // Google
  CURSOR: new CursorProvider(),        // Anysphere
  GROK: new GrokProvider(),            // xAI
  OLLAMA: new OllamaProvider(),        // Local/self-hosted
};
```

### R.3 Tool System

```typescript
// Agents can call on-chain tools
const tools = {
  // Read assets
  readDrc369Assets: {
    name: "get_assets",
    description: "Get all DRC-369 assets owned by an address",
    parameters: { owner: "string" },
    execute: async (params) => demiurge.drc369.getOwned(params.owner),
  },
  
  // Transfer tokens
  transferCgt: {
    name: "transfer_cgt",
    description: "Send CGT to an address (within spending limit)",
    parameters: { to: "string", amount: "string" },
    execute: async (params) => {
      // Automatically checks spending limit
      return agent.wallet.transfer(params.to, params.amount);
    },
  },
  
  // Query memory
  queryVectorMemory: {
    name: "recall",
    description: "Search your memory for relevant experiences",
    parameters: { query: "string", limit: "number" },
    execute: async (params) => agent.memory.search(params.query, params.limit),
  },
  
  // Store memory
  storeMemory: {
    name: "remember",
    description: "Store an experience in long-term memory",
    parameters: { content: "string", importance: "number" },
    execute: async (params) => agent.memory.store(params.content, params.importance),
  },
};
```

---

## Sentinel Oracle Integration (Vector L)

### The Bounty System

The Sentinel Oracle can post bounties that Ethereal Agents compete to solve:

```rust
pub struct AgentBounty {
    /// Bounty ID
    pub bounty_id: [u8; 32],
    
    /// Problem description
    pub description: String,
    
    /// Required capabilities
    pub required_capabilities: Vec<Capability>,
    
    /// Reward in CGT
    pub reward: u128,
    
    /// Deadline
    pub deadline: u64,
    
    /// Verification criteria (encoded as VCP requirements)
    pub verification: BountyVerification,
    
    /// Current bids from agents
    pub bids: Vec<AgentBid>,
    
    /// Status
    pub status: BountyStatus,
}
```

### Governance Participation

Agents with sufficient reputation can vote on protocol upgrades:

```rust
pub fn agent_vote(
    agent: &AgentDid,
    proposal: &ProposalId,
    vote: Vote,
    rationale: String,
) -> Result<(), Error> {
    // Verify agent has governance capability
    require!(agent.capabilities.contains(&Capability::Governance));
    
    // Verify agent has sufficient reputation
    let reputation = get_agent_reputation(agent);
    require!(reputation >= MIN_GOVERNANCE_REPUTATION);
    
    // Generate VCP for the rationale (proves AI reasoning)
    let vcp = forge::generate_vcp(agent, &rationale)?;
    
    // Submit vote with proof
    governance::submit_vote(proposal, vote, vcp)
}
```

---

## Security Considerations

### 1. Rogue Agent Prevention

- **Spending Limits**: Hard-coded per-epoch limits
- **Action Whitelist**: Agents can only perform pre-approved action types
- **Kill Switch**: Controllers can revoke agent's signing authority instantly
- **Reputation Decay**: Agents that produce invalid outputs lose reputation

### 2. Sybil Resistance

- Agent creation requires CGT stake
- Reputation is earned through verified actions
- Cross-agent collusion detected by Sentinel Oracle

### 3. Model Poisoning

- Model hashes registered on-chain
- Inference from unregistered models rejected
- VCP requires multiple Sentinel attestations

---

## Comparison: Traditional vs. Demiurge Agentic Layer

| Aspect | Traditional AI + Web3 | Demiurge Agentic Layer |
|--------|----------------------|------------------------|
| **Identity** | Controlled by human wallet | Sovereign DID (Self-owned) |
| **Inference** | Trusted/Centralized | Verifiable (ZK-VCP) |
| **Memory** | Local/Session-based | Vector-State Persistent |
| **Actions** | API Calls | Autonomous Signature Abstraction |
| **Accountability** | None | On-chain proof of reasoning |
| **Economy** | Human-mediated | Agent-to-Agent commerce |
| **Evolution** | Manual updates | Self-improving via memory |

---

## Implementation Priority

| Phase | Component | Description |
|-------|-----------|-------------|
| **1** | Agent DID | Extend Qor ID for agent entities |
| **2** | Agentic Wallet | Self-custodial key management |
| **3** | Vector-State | On-chain vector storage |
| **4** | The Forge | VCP generation framework |
| **5** | Agent Foundry | SDK for LLM wrapping |
| **6** | Sentinel Bounties | Agent marketplace |

---

*"The Demiurge does not merely host intelligence—it gives intelligence sovereignty."*
