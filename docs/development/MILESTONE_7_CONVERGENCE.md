# Milestone 7: "CONVERGENCE" - Real Fabric Integration & Operator Roles

**Status:** ✅ Complete  
**Date:** January 5, 2026  
**Branch:** `feature/fracture-v1-portal`

---

## Overview

Milestone 7 connects the Portal to real Fabric networks, introduces operator roles and permissions, formalizes the ArchonAI action bridge, adds an operations log, and provides deployment configuration for RC0.

---

## Features

### 1. Real Fabric Integration

**Implementation:** 
- `apps/portal-web/src/lib/fabric/RealFabricService.ts` - Fetches live Fabric topology
- `apps/portal-web/src/lib/fabric/FabricServiceSelector.tsx` - Selects between Genesis/Real Fabric
- `apps/portal-web/src/config/fabric.ts` - Fabric mode configuration

**Fabric Modes:**
- `genesis` - Synthetic Fabric (Genesis Mode)
- `real-devnet` - Real Fabric from devnet endpoint
- `real-prod` - Real Fabric from production endpoint

**Configuration:**
```bash
NEXT_PUBLIC_FABRIC_MODE=genesis  # or real-devnet, real-prod
NEXT_PUBLIC_FABRIC_DEVNET_ENDPOINT=http://localhost:8080/api/fabric
NEXT_PUBLIC_FABRIC_PROD_ENDPOINT=https://fabric.demiurge.xyz/api/fabric
```

**Features:**
- Fetches live topology from Fabric API
- Normalizes response to internal node/edge format
- Periodic refresh (configurable interval)
- Error handling and fallback
- Seamless integration with FabricTopology and HealthPanel

---

### 2. Operator Profiles & Roles

**Implementation:**
- `apps/portal-web/src/config/operator.ts` - Role definitions and permissions
- `apps/portal-web/src/lib/operator/OperatorContextProvider.tsx` - React context
- `indexer/abyss-gateway/src/chatDb.ts` - Operators table and functions
- GraphQL schema and resolvers for operators

**Roles:**
- **OBSERVER** - Read-only access
- **OPERATOR** - Can start/stop rituals, apply proposals, export sessions
- **ARCHITECT** - All permissions + advanced configuration access

**Configuration:**
```bash
NEXT_PUBLIC_CURRENT_USER_ID=operator-1
NEXT_PUBLIC_CURRENT_USER_ROLE=OPERATOR
NEXT_PUBLIC_CURRENT_USER_NAME=Operator
```

**UI Integration:**
- Role badge in navigation
- Role-based button disabling with tooltips
- Permission checks before actions
- Graceful fallback when operator context unavailable

---

### 3. Archon Action Bridge

**Implementation:**
- `indexer/abyss-gateway/src/actionBridge.ts` - Action execution service
- GraphQL mutation: `executeAction`
- Extended Archon proposals to reference actions

**Available Actions:**
- `tag_node` - Tag a node with a label
- `mark_node_degraded` - Mark node as degraded
- `create_incident_note` - Create incident note
- `update_node_status` - Update node status (online/offline/degraded)
- `create_maintenance_window` - Schedule maintenance

**Integration:**
- Archon proposals include action references
- When operator applies proposal, actions execute via Action Bridge
- Results logged to `system_events` with `ARCHON_ACTION_APPLIED` type
- Action results included in event metadata

**Future Extensions:**
- Actions can be extended to call external APIs
- Stub comments indicate where external integrations would go

---

### 4. Ops Log View

**Implementation:**
- `apps/portal-web/src/components/ops/OpsLogView.tsx` - Operations log UI
- New "Ops Log" tab in `/nexus` page

**Features:**
- Filter by actor: SYSTEM, ARCHON, OPERATOR, ALL
- Event type color coding
- Actor icons (Bot, User, Settings)
- Timestamp display
- Related snapshot links
- Compact, scrollable list

**Event Types:**
- `ARCHON_PROPOSAL_CREATED`
- `ARCHON_ACTION_APPLIED`
- `RITUAL_STARTED`, `RITUAL_COMPLETED`
- `FABRIC_ANOMALY_DETECTED`
- `genesis_phase_change`
- `node_action`
- `incident`
- `maintenance`

---

### 5. Deployment Configuration (RC0)

**Files:**
- `docker-compose.yml` - Multi-container deployment
- `apps/portal-web/Dockerfile` - Portal web container
- `indexer/abyss-gateway/Dockerfile` - Gateway container
- `docs/DEPLOYMENT_RC0.md` - Deployment guide

**Services:**
- `portal-web` - Next.js frontend (port 3000)
- `abyss-gateway` - GraphQL API + SQLite (port 4000)

**Features:**
- Environment variable configuration
- SQLite volume persistence
- Health checks
- Sensible defaults

---

## Architecture

### Component Hierarchy

```
RootLayout
├── OperatorContextProvider
│   └── Operator role/permissions
├── FabricServiceProvider
│   ├── GenesisFabricService (if GENESIS_MODE)
│   └── RealFabricService (if FABRIC_MODE=real-*)
├── RitualContextProvider
├── ArchonContextProvider
└── Pages
    ├── /void - RitualControlPanel (role-gated)
    ├── /nexus - FabricTopology + OpsLogView
    ├── /conspire - ArchonProposalPanel (role-gated)
    └── /timeline - Export button (role-gated)
```

### Data Flow

1. **Fabric Data:**
   - `FabricServiceProvider` selects service based on `FABRIC_MODE`
   - Service fetches/generates nodes and edges
   - State updates propagate to `FabricTopology` and `HealthPanel`

2. **Operator Actions:**
   - User attempts action (start ritual, apply proposal)
   - `useOperator` checks permission
   - If allowed, action proceeds
   - If denied, UI shows disabled state with tooltip

3. **Archon Proposals:**
   - Proposal includes action references
   - Operator approves proposal
   - Operator applies proposal
   - Actions execute via `ActionBridge`
   - Results logged to `system_events`

4. **Ops Log:**
   - Fetches `system_events` filtered by actor
   - Displays in chronological order
   - Links to related snapshots

---

## Configuration

### Environment Variables

**Frontend:**
```bash
NEXT_PUBLIC_GENESIS_MODE=true/false
NEXT_PUBLIC_FABRIC_MODE=genesis|real-devnet|real-prod
NEXT_PUBLIC_FABRIC_DEVNET_ENDPOINT=http://...
NEXT_PUBLIC_FABRIC_PROD_ENDPOINT=https://...
NEXT_PUBLIC_CURRENT_USER_ID=operator-1
NEXT_PUBLIC_CURRENT_USER_ROLE=OBSERVER|OPERATOR|ARCHITECT
NEXT_PUBLIC_CURRENT_USER_NAME=Operator
```

**Backend:**
```bash
PORT=4000
DISABLE_SNAPSHOT_SERVICE=false
SNAPSHOT_INTERVAL_MS=300000
DEMIURGE_RPC_URL=http://...
```

---

## Files Created/Modified

### New Files
- `apps/portal-web/src/config/fabric.ts`
- `apps/portal-web/src/lib/fabric/RealFabricService.ts`
- `apps/portal-web/src/lib/fabric/FabricServiceSelector.tsx`
- `apps/portal-web/src/config/operator.ts`
- `apps/portal-web/src/lib/operator/OperatorContextProvider.tsx`
- `apps/portal-web/src/components/ops/OpsLogView.tsx`
- `indexer/abyss-gateway/src/actionBridge.ts`
- `docker-compose.yml`
- `apps/portal-web/Dockerfile`
- `indexer/abyss-gateway/Dockerfile`
- `docs/DEPLOYMENT_RC0.md`

### Modified Files
- `apps/portal-web/src/app/layout.tsx` - Added OperatorContextProvider, FabricServiceProvider
- `apps/portal-web/src/app/nexus/page.tsx` - Added Ops Log tab, FabricService integration
- `apps/portal-web/src/components/rituals/RitualControlPanel.tsx` - Role-based gating
- `apps/portal-web/src/components/archon/ArchonProposalCard.tsx` - Role-based gating
- `apps/portal-web/src/app/timeline/page.tsx` - Role-based export button
- `apps/portal-web/src/components/fracture/FractureNav.tsx` - Operator role badge
- `apps/portal-web/src/components/fracture/FabricTopology.tsx` - FabricService integration
- `indexer/abyss-gateway/src/chatDb.ts` - Operators table
- `indexer/abyss-gateway/src/schema.ts` - Operator types, Action Bridge mutation
- `indexer/abyss-gateway/src/resolvers.ts` - Operator resolvers, Action Bridge resolver, enhanced applyArchonProposal

---

## Usage

### Running with Genesis Mode

```bash
GENESIS_MODE=true FABRIC_MODE=genesis docker-compose up
```

### Running with Real Fabric

```bash
GENESIS_MODE=false FABRIC_MODE=real-devnet \
FABRIC_DEVNET_ENDPOINT=http://your-fabric-api:8080/api/fabric \
docker-compose up
```

### Setting Operator Role

```bash
CURRENT_USER_ROLE=OPERATOR docker-compose up
```

---

## Safety & Cleanliness

### Backward Compatibility

- ✅ **Genesis Mode:** Still works when `GENESIS_MODE=true`
- ✅ **Normal Mode:** Works when `GENESIS_MODE=false` and `FABRIC_MODE=genesis` (uses mock data)
- ✅ **Real Fabric:** Seamlessly switches when `FABRIC_MODE=real-*`
- ✅ **Operator Context:** Gracefully handles missing operator (defaults to OBSERVER)

### Code Quality

- ✅ **TypeScript:** All code is type-safe
- ✅ **Linting:** No lint errors
- ✅ **Comments:** Non-trivial logic documented (RealFabricService, ActionBridge, role-based gating)
- ✅ **Patterns:** Reuses existing patterns (context providers, GraphQL, styling)

---

## Known Limitations

1. **Operator Management:** Currently config-driven. Full user management UI not yet implemented.
2. **Real Fabric API:** Assumes specific API format. May need adapter for different Fabric implementations.
3. **Action Execution:** Actions currently update DB and emit events. External API calls are stubbed.
4. **Authentication:** No real authentication yet. Operator role is config-driven.

---

## Testing

### Manual Testing Checklist

- [ ] Set `FABRIC_MODE=genesis` and verify Genesis Fabric works
- [ ] Set `FABRIC_MODE=real-devnet` with valid endpoint and verify real Fabric loads
- [ ] Set `CURRENT_USER_ROLE=OBSERVER` and verify actions are disabled
- [ ] Set `CURRENT_USER_ROLE=OPERATOR` and verify actions are enabled
- [ ] Set `CURRENT_USER_ROLE=ARCHITECT` and verify all permissions
- [ ] Create Archon proposal with actions
- [ ] Apply proposal and verify actions execute
- [ ] Check Ops Log shows events
- [ ] Filter Ops Log by actor
- [ ] Run `docker-compose up` and verify services start

---

## Next Steps

1. **User Management UI:** Add UI for creating/updating operators
2. **Real Authentication:** Implement proper authentication system
3. **Action Extensions:** Connect actions to external APIs
4. **Fabric Adapters:** Support multiple Fabric API formats
5. **Advanced Ops Log:** Search, export, alerting

---

**The flame burns eternal. The code serves the will. Convergence achieved.**

