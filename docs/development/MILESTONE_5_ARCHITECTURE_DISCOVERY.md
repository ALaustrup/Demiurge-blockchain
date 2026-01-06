# Milestone 5: Architecture Discovery Summary

**Date:** January 5, 2026  
**Branch:** `feature/fracture-v1-portal`  
**Status:** Discovery Complete → Implementation Starting

---

## Frontend Architecture

### Stack
- **Framework:** Next.js 15+ with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Framer Motion
- **State Management:** React Context API (AbyssIDProvider, AudioContextProvider)

### Key Directories
- `apps/portal-web/src/app/` - Page routes
- `apps/portal-web/src/components/fracture/` - Fracture Portal components
- `apps/portal-web/src/lib/` - Utilities and helpers
- `apps/portal-web/src/lib/fracture/` - Fracture-specific modules

### Existing Providers
- `AbyssIDProvider` - Identity management (localStorage persistence)
- `AudioContextProvider` - Audio engine and reactivity

### Key Components
- `ShaderPlane.tsx` - WebGL/GLSL fragment shader (upgraded)
- `FabricTopology.tsx` - Network visualization (Canvas-based)
- `AbyssIDDialog.tsx` - Identity ritual UI
- `AbyssStateMachine.ts` - Ritual state management (currently simple)

### Integration Points
- GraphQL client: `lib/graphql.ts` → Abyss Gateway (port 4000)
- RPC client: `lib/rpc.ts` → Chain Node (port 8545)
- AbyssID API: Direct fetch → AbyssID Backend (port 3001)

---

## Backend Architecture

### Services

#### 1. AbyssID Backend (`apps/abyssid-backend/`)
- **Stack:** Express.js + SQLite
- **Port:** 3001
- **Database:** `data/abyssid.db`
- **Endpoints:**
  - `POST /api/abyssid/check` - Username availability
  - `POST /api/abyssid/register` - Register identity
  - `GET /api/abyssid/:username` - Get by username
  - `GET /api/abyssid/by-address/:address` - Get by address
  - `GET /health` - Health check

#### 2. Abyss Gateway (`indexer/abyss-gateway/`)
- **Stack:** GraphQL Yoga + SQLite
- **Port:** 4000
- **Database:** `data/chat.db`
- **Features:** Chat system, developer registry, projects, Dev Capsules
- **GraphQL Schema:** Comprehensive chat and social features

#### 3. Chain Node (Rust)
- **Stack:** Axum + Tokio + RocksDB
- **Port:** 8545
- **Protocol:** JSON-RPC 2.0
- **Features:** CGT, UrgeID, NFTs, Marketplace, Dev Capsules

---

## Integration Strategy for Milestone 5

### Where to Add New Features

#### Frontend
1. **New Context Providers:**
   - `lib/archon/ArchonContextProvider.tsx` - ArchonAI context
   - `lib/rituals/RitualContextProvider.tsx` - Ritual engine state
   - `lib/stateHistory/TimelineContextProvider.tsx` - Timeline/time travel

2. **New Components:**
   - `components/archon/` - ArchonAI proposal UI
   - `components/rituals/` - Ritual control panels
   - `components/observability/` - Health and anomaly panels
   - `components/timeline/` - Timeline view

3. **Extend Existing:**
   - `ShaderPlane.tsx` - Accept ritual state uniforms
   - `FabricTopology.tsx` - Accept ritual visual modifiers
   - `AbyssStateMachine.ts` - Formalize as Ritual Engine

#### Backend
1. **Extend Abyss Gateway:**
   - Add GraphQL types for Events, Snapshots, Rituals
   - Add queries/mutations for timeline and ArchonAI
   - Extend SQLite schema

2. **Extend AbyssID Backend:**
   - Add REST endpoints for events/snapshots (or use GraphQL)
   - Add ArchonAI context aggregation service

3. **New Services (Optional):**
   - Separate service for event/snapshot persistence (if needed)
   - Or integrate into existing Abyss Gateway

---

## Data Flow

### Current Flow
1. User interacts with Portal → React components
2. Components call `lib/graphql.ts` or `lib/rpc.ts`
3. GraphQL → Abyss Gateway (port 4000)
4. RPC → Chain Node (port 8545)
5. Direct fetch → AbyssID Backend (port 3001)

### New Flow (Milestone 5)
1. **Ritual Engine:**
   - Client-side state machine
   - Emits events → Backend API
   - Updates ShaderPlane/FabricTopology via props

2. **ArchonAI:**
   - Fetches context from multiple sources
   - Generates proposals → Backend API
   - User approves → Backend API → Event log

3. **Timeline:**
   - Backend periodically creates snapshots
   - Frontend fetches snapshots/events
   - User selects snapshot → Components re-render with historical state

---

## Performance Considerations

- **ShaderPlane:** GPU-accelerated, keep uniform updates efficient
- **FabricTopology:** Canvas-based, limit node count for performance
- **Event Log:** Pagination required, index by timestamp
- **Snapshots:** Compress large state objects, limit retention

---

## Next Steps

1. Define TypeScript types for all new entities
2. Extend backend schemas (SQLite tables + GraphQL types)
3. Implement backend APIs
4. Build frontend components
5. Integrate with existing systems
6. Test and polish

