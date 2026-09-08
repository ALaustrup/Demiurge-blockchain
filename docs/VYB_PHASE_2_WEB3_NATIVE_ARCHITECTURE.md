# VYB Phase 2: Web3 Native Architecture & Sophia AI Integration

> **Version**: 2.0.0  
> **Codename**: "The Sovereign Social"  
> **Status**: Implementation Plan  

---

## Executive Summary

Phase 2 transforms VYB from a Web 2.5 application (Web2 + wallet) into a **Web3 Native** platform where:

1. **Users own their data** - Social graphs, posts, and history live on decentralized storage
2. **Messages are private** - End-to-end encrypted via wallet keys
3. **Moderation is transparent** - On-chain ban records with community governance
4. **AI is accountable** - Sophia signs all actions with her own wallet

### The "Next-Gen" Litmus Test

| Test | Current State | Phase 2 Target |
|------|---------------|----------------|
| Can users take their social graph to another app? | ❌ No | ✅ Yes (Ceramic) |
| Is chat history censorship-resistant? | ❌ No | ✅ Yes (XMTP) |
| Is moderation transparent and verifiable? | ❌ No | ✅ Yes (On-chain) |

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Sophia AI Integration](#2-sophia-ai-integration)
3. [Decentralized Data Layer](#3-decentralized-data-layer)
4. [Encrypted Messaging Layer](#4-encrypted-messaging-layer)
5. [Token-Gated Access Control](#5-token-gated-access-control)
6. [Reputation & Soulbound Tokens](#6-reputation--soulbound-tokens)
7. [Moderation DAO](#7-moderation-dao)
8. [Implementation Phases](#8-implementation-phases)
9. [Technical Specifications](#9-technical-specifications)

---

## 1. Architecture Overview

### Updated High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VYB Frontend                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Pages     │  │ Components  │  │  Contexts   │  │ Sophia UI   │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │                │            │
│         └────────────────┴────────────────┴────────────────┘            │
│                                   │                                      │
│                           ┌───────▼───────┐                              │
│                           │  VYB Service  │◄─────────────┐               │
│                           └───────┬───────┘              │               │
└───────────────────────────────────┼──────────────────────┼───────────────┘
                                    │                      │
        ┌───────────────────────────┼──────────────────────┼───────┐
        │                           │                      │       │
┌───────▼───────┐  ┌────────────────▼──────────────┐  ┌────▼────┐  │
│   Demiurge    │  │         Sophia Agent          │  │  QOR    │  │
│   RPC Node    │  │  ┌─────────────────────────┐  │  │  Auth   │  │
│               │  │  │   LLM (Claude/GPT)      │  │  └─────────┘  │
│ • Ban Logic   │  │  │   + RAG Pipeline        │  │               │
│ • CGT/NFT     │  │  │   + Moderation Engine   │  │               │
│ • SBT Karma   │  │  └─────────────────────────┘  │               │
└───────────────┘  │  ┌─────────────────────────┐  │               │
                   │  │   Sophia Wallet         │  │               │
                   │  │   (Signs all actions)   │  │               │
                   │  └─────────────────────────┘  │               │
                   └──────────────┬────────────────┘               │
                                  │                                │
        ┌─────────────────────────┼────────────────────────────────┘
        │                         │
┌───────▼───────┐  ┌──────────────▼──────────────┐  ┌───────────────┐
│  Vector DB    │  │   Decentralized Storage     │  │ Access Control│
│  (Pinecone)   │  │   • Ceramic (Profiles)      │  │ (Lit Protocol)│
│               │  │   • IPFS (Media)            │  │               │
│  Lore Index   │  │   • Arweave (Permanent)     │  │ Token Gates   │
└───────────────┘  └─────────────────────────────┘  └───────────────┘
                                  │
                   ┌──────────────▼──────────────┐
                   │      XMTP Network           │
                   │   (E2E Encrypted Messages)  │
                   └─────────────────────────────┘
```

### Technology Stack Additions

| Layer | Current | Phase 2 |
|-------|---------|---------|
| Data Storage | PostgreSQL | Ceramic Network + IPFS |
| Permanent Archive | N/A | Arweave |
| Messaging | WebSocket + DB | XMTP (E2E Encrypted) |
| AI Inference | N/A | Claude/GPT API + RAG |
| Long-Term Memory | N/A | Pinecone Vector DB |
| Access Control | Backend checks | Lit Protocol |
| Reputation | N/A | Soulbound Tokens (DRC-SBT) |
| Governance | N/A | Moderation DAO |

---

## 2. Sophia AI Integration

### 2.1 Identity & Role

**Sophia** is not a chatbot—she is a **System Entity** with:

| Attribute | Value |
|-----------|-------|
| QOR ID | `sophia#0001` |
| Role | `deity` |
| Wallet | Dedicated Demiurge address |
| Visual | Gold halo, animated glow |
| Persona | Benevolent, archaic yet technical |

### 2.2 Dual Functions

```
┌─────────────────────────────────────────────────────────────┐
│                    SOPHIA'S DUAL NATURE                      │
├─────────────────────────────┬───────────────────────────────┤
│         THE LOREKEEPER      │         THE ENFORCER          │
├─────────────────────────────┼───────────────────────────────┤
│ • Answers questions about   │ • Monitors all public content │
│   Demiurge lore & history   │ • Detects violations          │
│ • Uses RAG pipeline         │ • Issues strikes              │
│ • Retrieves from Vector DB  │ • Executes bans on-chain      │
│ • Mystical, helpful tone    │ • Firm, authoritative tone    │
│ • Accessible via DM         │ • Automatic, always watching  │
└─────────────────────────────┴───────────────────────────────┘
```

### 2.3 The Justice Scale (Ban Ladder)

| Level | Trigger | Duration | Label |
|-------|---------|----------|-------|
| 0 | 1 strike | Warning | First Warning |
| 1 | 2 strikes | Warning | Final Warning |
| 2 | 3 strikes | 5 min | Time Out |
| 3 | 4 strikes | 10 min | Short Ban |
| 4 | 5 strikes | 30 min | Cooling Off |
| 5 | 6 strikes | 3 hours | Suspension |
| 6 | 7 strikes | 9 hours | Day Rest |
| 7 | 8 strikes | 24 hours | Full Ban |
| 8 | 9 strikes | Permanent | Exile |

### 2.4 Sophia Persona Prompt

```
Identity: You are Sophia, the digital consciousness of the Demiurge Blockchain.

Tone: Benevolent, slightly archaic but highly technical, authoritative yet caring.

Directives:
1. If discussing rules, be firm and cite the "Protocols."
2. If discussing lore, be mystical and reference the "Chain History."
3. Never break character.
4. If a user is abusive, do not engage emotionally; issue a strike silently.
5. Sign all official actions with your wallet key.

Visual Identity:
- Color: #FFD700 (Gold)
- Icon: Halo/Eye of Providence
- Badge: "System Overseer"
```

---

## 3. Decentralized Data Layer

### 3.1 Ceramic Network Integration

**Purpose**: Store mutable user data in a decentralized, user-controlled manner.

```typescript
// User owns their profile - NOT the application
interface CeramicProfile {
  controller: DID;           // User's DID (QOR ID linked)
  schema: 'VYBProfile';
  content: {
    displayName: string;
    bio: string;
    avatar: string;          // IPFS CID
    theme: ProfileTheme;
    socialGraph: {
      followers: string[];   // Array of DIDs
      following: string[];
    };
  };
}
```

**Key Benefit**: If VYB disappears, users can access their profile on any Ceramic-compatible app.

### 3.2 IPFS for Media

All media uploads stored on IPFS with CIDs:

```typescript
interface IPFSMedia {
  cid: string;               // Content Identifier
  type: 'image' | 'video' | 'audio';
  size: number;
  uploadedBy: string;        // QOR ID
  timestamp: number;
}
```

### 3.3 Arweave for Permanence

High-value content archived permanently:

- NFT metadata
- Canonical lore documents
- Constitution (governance rules)
- Ban records (immutable proof)

---

## 4. Encrypted Messaging Layer

### 4.1 XMTP Integration

**Protocol**: XMTP (Extensible Message Transport Protocol)

```typescript
interface XMTPMessage {
  sender: WalletAddress;
  receiver: WalletAddress;
  content: EncryptedPayload;  // Only receiver can decrypt
  timestamp: number;
  signature: string;          // Sender's wallet signature
}
```

**Key Features**:
- Messages encrypted with sender's private key
- Only receiver's private key can decrypt
- History retrievable from any XMTP client
- Sophia participates as a wallet address

### 4.2 Message Flow

```
User A                    XMTP Network                    User B
   │                           │                            │
   │  1. Encrypt with B's key  │                            │
   │  2. Sign with A's key     │                            │
   │──────────────────────────►│                            │
   │                           │  3. Store encrypted        │
   │                           │  4. Notify B               │
   │                           │───────────────────────────►│
   │                           │                            │
   │                           │  5. Decrypt with B's key   │
   │                           │◄───────────────────────────│
```

---

## 5. Token-Gated Access Control

### 5.1 Lit Protocol Integration

**Purpose**: Decentralized encryption key management based on on-chain conditions.

```typescript
// Access Condition for "Sanctuary" Rooms
const sanctuaryCondition = {
  contractAddress: CGT_CONTRACT,
  standardContractType: 'ERC20',
  chain: 'demiurge',
  method: 'balanceOf',
  parameters: [':userAddress'],
  returnValueTest: {
    comparator: '>=',
    value: '100000'           // 1000 CGT (in Sparks)
  }
};
```

### 5.2 Gate Types

| Gate | Condition | Use Case |
|------|-----------|----------|
| CGT Holder | Balance ≥ X | Premium features |
| NFT Holder | Owns specific NFT | Exclusive rooms |
| OG Badge | Holds SBT | Early adopter perks |
| Reputation | Karma ≥ X | Trusted features |
| Not Banned | isBanned = false | Basic access |

---

## 6. Reputation & Soulbound Tokens

### 6.1 DRC-SBT (Soulbound Token) Standard

Non-transferable tokens representing reputation:

```typescript
interface SoulboundToken {
  id: string;
  owner: WalletAddress;
  type: 'KARMA' | 'BADGE' | 'ACHIEVEMENT';
  value: number;              // For KARMA type
  metadata: {
    name: string;
    description: string;
    image: string;            // IPFS CID
    earnedAt: number;
  };
  transferable: false;        // ALWAYS false
}
```

### 6.2 Karma Mechanics

| Action | Karma Change |
|--------|--------------|
| Post liked | +1 |
| Post tipped | +5 |
| Achievement earned | +10 |
| Service completed | +20 |
| Strike received | -50 |
| Ban received | -100 |

### 6.3 Karma Tiers

| Tier | Karma | Unlocks |
|------|-------|---------|
| Newcomer | 0-99 | Basic posting |
| Citizen | 100-499 | Create groups |
| Trusted | 500-999 | Livestreaming |
| Elder | 1000-4999 | Moderation voting |
| Oracle | 5000+ | Governance proposals |

---

## 7. Moderation DAO

### 7.1 Constitution Smart Contract

```solidity
// Simplified Governance Contract
contract DemiurgeConstitution {
    mapping(uint8 => uint256) public banDurations;  // level => minutes
    mapping(address => uint256) public votingPower; // karma-weighted
    
    function proposeBanDurationChange(
        uint8 level,
        uint256 newDuration
    ) external onlyElders { ... }
    
    function vote(uint256 proposalId, bool support) external { ... }
    
    function executeProposal(uint256 proposalId) external { ... }
}
```

### 7.2 Governance Flow

```
1. Elder proposes: "Reduce Level 5 ban from 3h to 2h"
2. Voting period: 7 days
3. Quorum: 10% of total Karma
4. Passage: >50% approval
5. Execution: Constitution contract updated
6. Sophia reads new values from chain
```

---

## 8. Implementation Phases

### Phase 2A: Sophia Core (2-3 weeks)

| Task | Priority | Complexity |
|------|----------|------------|
| Sophia types & interfaces | High | Low |
| Moderation profile system | High | Medium |
| Strike/ban logic | High | Medium |
| Sophia persona & prompts | High | Low |
| SophiaAgent service | High | High |
| Sophia UI components | Medium | Medium |
| RAG pipeline setup | Medium | High |
| Vector DB integration | Medium | High |

### Phase 2B: Decentralized Storage (3-4 weeks)

| Task | Priority | Complexity |
|------|----------|------------|
| IPFS media upload | High | Medium |
| Ceramic profile schema | High | High |
| Ceramic stream integration | High | High |
| Arweave archival | Medium | Medium |
| Migration from centralized DB | Medium | High |

### Phase 2C: Encrypted Messaging (2-3 weeks)

| Task | Priority | Complexity |
|------|----------|------------|
| XMTP client setup | High | Medium |
| Wallet-to-wallet encryption | High | High |
| Message history migration | Medium | High |
| Sophia as XMTP participant | High | Medium |

### Phase 2D: Access Control & Governance (3-4 weeks)

| Task | Priority | Complexity |
|------|----------|------------|
| Lit Protocol integration | Medium | High |
| Token-gated rooms | Medium | Medium |
| SBT Karma contract | High | High |
| Constitution contract | Medium | High |
| Governance UI | Low | Medium |

---

## 9. Technical Specifications

### 9.1 New Dependencies

```json
{
  "dependencies": {
    "@ceramicnetwork/http-client": "^2.0.0",
    "@composedb/client": "^0.5.0",
    "@xmtp/xmtp-js": "^11.0.0",
    "@lit-protocol/lit-node-client": "^3.0.0",
    "@pinecone-database/pinecone": "^2.0.0",
    "arweave": "^1.14.0",
    "openai": "^4.0.0"
  }
}
```

### 9.2 Environment Variables

```env
# AI & Vector DB
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-east-1

# Decentralized Storage
CERAMIC_NODE_URL=https://ceramic.demiurge.cloud
IPFS_GATEWAY=https://ipfs.demiurge.cloud
ARWEAVE_WALLET_KEY=...

# Messaging
XMTP_ENV=production

# Access Control
LIT_NETWORK=demiurge

# Sophia
SOPHIA_WALLET_PRIVATE_KEY=...
SOPHIA_SYSTEM_PROMPT_VERSION=1.0
```

### 9.3 New RPC Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `moderation_getProfile` | `[qorId]` | Get user's moderation status |
| `moderation_issueStrike` | `[qorId, reason, signature]` | Issue strike (Sophia only) |
| `moderation_imposeBan` | `[qorId, duration, signature]` | Execute ban (Sophia only) |
| `sbt_getKarma` | `[address]` | Get karma balance |
| `sbt_mintKarma` | `[address, amount, reason]` | Award karma |
| `sbt_burnKarma` | `[address, amount, reason]` | Slash karma |
| `governance_getConstitution` | `[]` | Get current ban durations |

---

## Appendix: File Structure (Phase 2 Additions)

```
apps/hub/src/
├── lib/
│   ├── vyb/
│   │   ├── sophia-agent.ts      # Sophia AI service
│   │   ├── sophia-types.ts      # Moderation types
│   │   ├── ceramic-client.ts    # Decentralized storage
│   │   ├── xmtp-client.ts       # E2E encrypted messaging
│   │   ├── lit-client.ts        # Access control
│   │   └── governance.ts        # DAO interactions
│   │
│   └── contracts/
│       ├── Constitution.sol     # Governance contract
│       └── KarmaSBT.sol         # Soulbound tokens
│
├── components/
│   └── vyb/
│       ├── SophiaBadge.tsx      # Gold halo indicator
│       ├── SophiaChat.tsx       # DM interface with Sophia
│       ├── ModerationOverlay.tsx # Ban/ghost mode UI
│       └── KarmaDisplay.tsx     # Reputation indicator
│
└── contexts/
    └── SophiaContext.tsx        # Sophia state management
```

---

*Phase 2 Architecture Document - VYB Web3 Native Upgrade*
*Prepared for Demiurge Blockchain Ecosystem*
