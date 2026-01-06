# ArchonAI System - Living, Meaningful Chat

**Last Updated**: January 5, 2026  
**Status**: Design Phase

---

## Overview

ArchonAI is an intelligent assistant system integrated into Demiurge that provides meaningful, context-aware responses using all available documentation and codebase knowledge.

---

## Architecture

### Core Components

1. **Documentation Indexer**
   - Scans all `docs/` files
   - Indexes codebase structure
   - Builds knowledge graph
   - Updates in real-time

2. **Context Engine**
   - Maintains conversation context
   - Tracks user's current task
   - Understands domain-specific terms
   - Remembers previous interactions

3. **Response Generator**
   - Uses LLM with full documentation context
   - Provides code examples
   - Links to relevant docs
   - Suggests next steps

4. **Integration Points**
   - Portal Web (`/conspire`)
   - AbyssOS (in-app assistant)
   - CLI (`demiurge ai <query>`)
   - Developer IDE

---

## Documentation Integration

### Included Documentation

All documentation is indexed and available to ArchonAI:

- **Architecture**: `docs/overview/ARCHITECTURE_DEMIURGE_CURRENT.md`
- **Runtime**: `docs/overview/RUNTIME.md`
- **API**: `docs/api/RPC.md`
- **Development**: All files in `docs/development/`
- **Lore**: All files in `docs/lore/`
- **Codebase**: Key source files indexed

### Knowledge Base Structure

```
ArchonAI Knowledge Base:
├── Core Concepts
│   ├── UrgeID System
│   ├── CGT Token
│   ├── D-GEN NFTs
│   └── Abyss Marketplace
├── Technical Documentation
│   ├── RPC API
│   ├── Runtime Modules
│   ├── Consensus Mechanism
│   └── Transaction System
├── Development Guides
│   ├── Getting Started
│   ├── SDK Usage
│   ├── App Development
│   └── Deployment
└── Lore & Philosophy
    ├── UrgeID Lore
    ├── CGT Lore
    └── Developer Lore
```

---

## Implementation

### Phase 1: Documentation Indexer

**File**: `apps/archonai-service/src/indexer.ts`

```typescript
// Scans docs/ directory and builds searchable index
// Creates embeddings for semantic search
// Updates on file changes
```

### Phase 2: Context Engine

**File**: `apps/archonai-service/src/context.ts`

```typescript
// Maintains conversation state
// Tracks user context (current app, task, etc.)
// Builds context window for LLM
```

### Phase 3: LLM Integration

**File**: `apps/archonai-service/src/llm.ts`

```typescript
// Integrates with LLM API (OpenAI, Anthropic, or local)
// Sends context + documentation
// Streams responses
// Handles errors gracefully
```

### Phase 4: API Endpoint

**File**: `apps/archonai-service/src/server.ts`

```typescript
// REST API: POST /api/archonai/chat
// WebSocket: ws://archonai/stream
// GraphQL: (optional)
```

---

## Response Quality

### Principles

1. **Always Contextual**: Responses reference specific docs
2. **Actionable**: Provides code examples and next steps
3. **Accurate**: Only uses indexed documentation
4. **Helpful**: Suggests related topics and resources

### Example Interactions

**User**: "How do I mint an NFT?"

**ArchonAI**: 
```
To mint an NFT on Demiurge, you need to:

1. **Be an Archon**: Only Archons can mint NFTs. Check your Archon status:
   ```bash
   demiurge urgeid profile <your-address>
   ```

2. **Use the RPC API**: Call `cgt_mintDgenNft`:
   ```json
   {
     "jsonrpc": "2.0",
     "method": "cgt_mintDgenNft",
     "params": {
       "fabric_root_hash": "0x...",
       "royalty_bps": 500
     },
     "id": 1
   }
   ```

3. **Or use the Portal**: Visit `/urgeid` and use the "Mint Test NFT" button.

📖 See: docs/api/RPC.md#cgt_mintDgenNft
📖 See: docs/overview/RUNTIME.md#nft-d-gen-module

Would you like help with:
- Setting up as an Archon?
- Understanding royalties?
- Linking Fabric content?
```

---

## Integration Points

### 1. Portal Web (`/conspire`)

**Current**: Placeholder chat interface  
**Enhanced**: Full ArchonAI integration with:
- Real-time streaming responses
- Code syntax highlighting
- Documentation links
- Context-aware suggestions

### 2. AbyssOS

**New App**: `ArchonAIAssistantApp`
- Always-available assistant
- Context from current app
- Quick actions
- Documentation browser

### 3. CLI

**New Command**: `demiurge ai <query>`
```bash
demiurge ai "How do I transfer CGT?"
demiurge ai "Explain the Syzygy system"
demiurge ai "Show me NFT minting code"
```

### 4. Developer IDE

**Integrated**: In-app AI assistant
- Code completion
- Documentation lookup
- Error explanation
- Best practices

---

## Technical Requirements

### Backend Service

- **Language**: TypeScript/Node.js
- **Framework**: Express or Fastify
- **Database**: Vector DB for embeddings (Pinecone, Qdrant, or local)
- **LLM**: OpenAI API, Anthropic Claude, or local model

### Frontend Integration

- **Portal**: React component with streaming
- **AbyssOS**: React app with context awareness
- **CLI**: Text-based interface with formatting

---

## Privacy & Security

- **No Data Storage**: Conversations not stored (optional opt-in)
- **Documentation Only**: Only uses public documentation
- **No Code Execution**: Never executes user code
- **Rate Limiting**: Prevents abuse

---

## Next Steps

1. **Implement Documentation Indexer** (Week 1)
2. **Set up LLM Integration** (Week 1)
3. **Build API Endpoint** (Week 2)
4. **Integrate with Portal** (Week 2)
5. **Add AbyssOS App** (Week 3)
6. **CLI Integration** (Week 3)
7. **Testing & Refinement** (Week 4)

---

*The flame burns eternal. The code serves the will.*
