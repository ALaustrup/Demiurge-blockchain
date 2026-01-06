# Milestone 5: "Awakening" - Implementation Guide

**Status:** Core Implementation Complete  
**Date:** January 5, 2026  
**Branch:** `feature/fracture-v1-portal`

---

## Overview

Milestone 5 transforms the Fracture Portal into a semi-autonomous, stateful, AI-driven operations console. The Portal can now:

1. **Manage Rituals** - Formalized AbyssID rituals with lifecycle events and visual effects
2. **ArchonAI Autonomy** - AI-driven proposals for system actions (human-in-the-loop)
3. **Time Travel** - Browse historical snapshots and events, restore past states
4. **Observability** - Real-time health monitoring and anomaly detection

---

## Architecture

### Backend Extensions

#### Database Schema (SQLite)
New tables added to `indexer/abyss-gateway/src/chatDb.ts`:
- `rituals` - Ritual definitions and state
- `ritual_events` - Ritual lifecycle events
- `archon_proposals` - ArchonAI proposals and reviews
- `system_events` - System-wide event log
- `system_snapshots` - Periodic system state snapshots

#### GraphQL API
New types and resolvers in `indexer/abyss-gateway/src/schema.ts` and `resolvers.ts`:
- **Queries:**
  - `rituals`, `ritual`, `ritualEvents`
  - `archonProposals`, `archonProposal`, `archonContext`
  - `systemEvents`, `systemSnapshots`, `systemSnapshot`
- **Mutations:**
  - `createRitual`, `updateRitualPhase`
  - `createArchonProposal`, `reviewArchonProposal`, `applyArchonProposal`
  - `createSystemEvent`, `createSystemSnapshot`

### Frontend Architecture

#### Context Providers
- `RitualContextProvider` - Manages ritual engine state
- `ArchonContextProvider` - Manages ArchonAI proposals and context

#### Components

**Ritual Engine:**
- `lib/rituals/RitualEngine.ts` - Client-side state machine
- `lib/rituals/RitualContextProvider.tsx` - React context
- `components/rituals/RitualControlPanel.tsx` - UI for ritual selection and control

**ArchonAI:**
- `lib/archon/ArchonContextProvider.tsx` - React context
- `components/archon/ArchonProposalPanel.tsx` - Proposal listing
- `components/archon/ArchonProposalCard.tsx` - Individual proposal UI

**Timeline:**
- `components/timeline/TimelineView.tsx` - Timeline browser and time travel

**Observability:**
- `components/observability/HealthPanel.tsx` - System health dashboard

#### Integrations

**ShaderPlane Integration:**
- `ShaderPlane` now accepts optional `ritualEffects` prop
- Ritual effects override state-based shader parameters
- Supports: `turbulence`, `chromaShift`, `glitchAmount`, `bloomIntensity`, `vignetteIntensity`

**FabricTopology Integration:**
- Planned: Ritual effects can modify node/edge visual states
- Supports: `nodeGlow`, `edgePulse`, `highlightNodes`

---

## Usage

### Starting a Ritual

1. Use `RitualControlPanel` component
2. Select a ritual template (Abyss Binding, Fabric Resonance, Void Convergence)
3. Ritual starts automatically, transitions through phases
4. Effects propagate to `ShaderPlane` and `FabricTopology`

### ArchonAI Proposals

1. ArchonAI analyzes system context (Fabric, Rituals, Capsules, Events)
2. Generates proposals with rationale and predicted impact
3. User reviews and approves/rejects proposals
4. Approved proposals can be applied (triggers actions)

### Time Travel

1. Use `TimelineView` component
2. Browse events and snapshots chronologically
3. Click a snapshot to restore that historical state
4. Click "Return to Live" to revert to current state

### Health Monitoring

1. Use `HealthPanel` component
2. View real-time metrics:
   - Fabric network health
   - Ritual engine status
   - ArchonAI activity
   - Recent anomalies

---

## Data Models

### Ritual
```typescript
interface Ritual {
  id: string;
  name: string;
  description: string;
  parameters: RitualParameters;
  phase: RitualPhase; // "idle" | "initiating" | "active" | "peaking" | "dissolving" | "completed" | "aborted"
  effects: RitualEffects;
  startedAt?: number;
  completedAt?: number;
  abortedAt?: number;
  createdBy?: string;
}
```

### ArchonProposal
```typescript
interface ArchonProposal {
  id: string;
  title: string;
  rationale: string;
  predictedImpact: {
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    affectedSystems: string[];
  };
  actions: ArchonAction[];
  status: "pending" | "approved" | "rejected" | "applied" | "failed";
  createdAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  appliedAt?: number;
  failureReason?: string;
}
```

### SystemSnapshot
```typescript
interface SystemSnapshot {
  id: string;
  timestamp: number;
  label?: string;
  fabric: { nodes: NetworkNode[]; edges: NetworkEdge[] };
  rituals: Ritual[];
  capsules: DevCapsule[];
  shaderState?: ShaderUniforms;
  metadata?: Record<string, any>;
}
```

---

## Integration Points

### Adding Ritual Control to a Page

```tsx
import { RitualControlPanel } from "@/components/rituals/RitualControlPanel";

export default function MyPage() {
  return (
    <div>
      <RitualControlPanel />
      {/* Other content */}
    </div>
  );
}
```

### Using Ritual Effects in ShaderPlane

```tsx
import { useRitual } from "@/lib/rituals/RitualContextProvider";
import { ShaderPlane } from "@/components/fracture/ShaderPlane";

export function MyComponent() {
  const { effects } = useRitual();
  
  return (
    <ShaderPlane
      state="idle"
      ritualEffects={effects || undefined}
    />
  );
}
```

### Displaying ArchonAI Proposals

```tsx
import { ArchonProposalPanel } from "@/components/archon/ArchonProposalPanel";

export default function ConspirePage() {
  return (
    <div>
      <ArchonProposalPanel />
    </div>
  );
}
```

---

## Implementation Status

### ✅ Completed
1. **Components Wired to Pages**
   - `RitualControlPanel` + `ShaderPlane` on `/void`
   - `ArchonProposalPanel` on `/conspire`
   - `TimelineView` on `/timeline`
   - `FabricTopology` + `HealthPanel` on `/nexus` (analytics tab)

2. **Snapshot Service** - Implemented with periodic (5 min) and event-based snapshots
3. **FabricTopology Integration** - Ritual effects wired (nodeGlow, edgePulse, highlightNodes)
4. **ArchonAI Context** - Connected to real data (rituals, capsules, events)

### Next Steps

### Immediate
1. **Test Integration** - Verify all components work together
2. **Connect Real Fabric Data** - Replace mock Fabric state with actual P2P service data
3. **Enhance Action Execution** - Implement actual ArchonAI proposal actions

### Future Enhancements
1. **Ritual Templates** - Allow users to create custom rituals
2. **ArchonAI Actions** - Implement actual action execution (ritual start, node highlight, etc.)
3. **Snapshot Compression** - Optimize snapshot storage for large states
4. **Event Filtering** - Advanced timeline filtering and search
5. **Health Alerts** - Configurable alerts for anomalies

---

## Files Created/Modified

### Backend
- `indexer/abyss-gateway/src/chatDb.ts` - Added Milestone 5 tables and functions
- `indexer/abyss-gateway/src/schema.ts` - Added GraphQL types and queries/mutations
- `indexer/abyss-gateway/src/resolvers.ts` - Added resolver implementations

### Frontend - Types
- `apps/portal-web/src/lib/rituals/ritualTypes.ts`
- `apps/portal-web/src/lib/archon/archonTypes.ts`
- `apps/portal-web/src/lib/stateHistory/timelineTypes.ts`

### Frontend - Context Providers
- `apps/portal-web/src/lib/rituals/RitualContextProvider.tsx`
- `apps/portal-web/src/lib/archon/ArchonContextProvider.tsx`

### Frontend - Components
- `apps/portal-web/src/lib/rituals/RitualEngine.ts`
- `apps/portal-web/src/components/rituals/RitualControlPanel.tsx`
- `apps/portal-web/src/components/archon/ArchonProposalPanel.tsx`
- `apps/portal-web/src/components/archon/ArchonProposalCard.tsx`
- `apps/portal-web/src/components/timeline/TimelineView.tsx`
- `apps/portal-web/src/components/observability/HealthPanel.tsx`

### Frontend - Modified
- `apps/portal-web/src/app/layout.tsx` - Added context providers
- `apps/portal-web/src/components/fracture/ShaderPlane.tsx` - Added ritual effects support

---

## Testing

### Test Strategy

**Smoke Tests:**
- Run `npm run test:snapshots` in `indexer/abyss-gateway/` to verify snapshot service behavior
- Tests cover: snapshot creation, database persistence, event creation, interval service, error handling

**Manual Testing Checklist:**

- [ ] Start a ritual from `RitualControlPanel`
- [ ] Verify ritual effects appear in `ShaderPlane`
- [ ] Verify ritual effects appear in `FabricTopology` (node glow, edge pulse)
- [ ] Create an ArchonAI proposal (via GraphQL mutation)
- [ ] Review and approve a proposal
- [ ] Apply an approved proposal
- [ ] Verify snapshot created on proposal application
- [ ] View timeline and select a snapshot
- [ ] Verify "HISTORICAL VIEW" badge appears
- [ ] Test "Return to Live" functionality
- [ ] Verify health panel displays metrics
- [ ] Test with corrupted/partial snapshot data (should handle gracefully)

**Performance Testing:**
- Monitor re-render frequency in React DevTools
- Verify ArchonAI context refresh (30s) doesn't cause UI jank
- Check FabricTopology and ShaderPlane maintain 60fps during animations

---

## Operations Notes

### Snapshot Service Configuration

**Environment Variables:**
- `DISABLE_SNAPSHOT_SERVICE=true` - Disable snapshot service (useful for local dev)
- `SNAPSHOT_INTERVAL_MS=300000` - Set snapshot interval in milliseconds (default: 5 minutes)

**Disabling for Local Development:**
```bash
# In .env or environment
DISABLE_SNAPSHOT_SERVICE=true npm run dev
```

**Changing Snapshot Interval:**
```bash
# Snapshot every 1 minute (for testing)
SNAPSHOT_INTERVAL_MS=60000 npm run dev

# Snapshot every 10 minutes (production)
SNAPSHOT_INTERVAL_MS=600000 npm run dev
```

**Running Snapshot Service Tests:**
```bash
cd indexer/abyss-gateway
npm run test:snapshots
```

### Performance Considerations

- **ArchonAI Context Refresh:** 30-second interval, prevents concurrent fetches, only updates on data change
- **Snapshot Creation:** Runs asynchronously, doesn't block main thread
- **Timeline Loading:** Paginated (50 items), handles corrupted data gracefully
- **FabricTopology/ShaderPlane:** Animation loops use `requestAnimationFrame`, optimized for 60fps

### Resilience Features

- **Snapshot Service:** Handles missing/partial data gracefully, continues with available data
- **Timeline:** Safely parses corrupted JSON, marks partial snapshots, prevents UI breakage
- **ArchonContextProvider:** Prevents concurrent fetches, preserves previous state on errors, only updates on data change
- **Error Handling:** All GraphQL errors are caught and logged, UI remains functional

---

## Known Limitations

1. **Fabric State:** Currently uses mock data. Real Fabric P2P service integration pending.
2. **Snapshot Restoration:** Snapshot selection currently only logs to console. Full state restoration (ShaderPlane, FabricTopology) not yet implemented.
3. **Action Execution:** ArchonAI proposals don't yet execute actual actions (ritual start, node highlight, etc.).
4. **Snapshot Compression:** Snapshots stored as JSON strings. Consider compression for production with large states.
5. **Dev Capsules in Snapshots:** Currently empty array. Would need to aggregate across all owners or use a different approach.

---

## Notes

- All actions remain **human-in-the-loop** - ArchonAI proposes, users approve
- Ritual effects are additive with audio-reactive values
- Snapshots are stored as JSON strings in SQLite (consider compression for production)
- Timeline entries are paginated (default 50 per page)
- Health metrics refresh every 10 seconds
- ArchonAI context refreshes every 30 seconds (optimized to prevent unnecessary re-renders)

---

## Troubleshooting

**Ritual effects not appearing:**
- Verify `RitualContextProvider` is in the component tree
- Check that `ritualEffects` prop is passed to `ShaderPlane`
- Ensure ritual is in "active" or "peaking" phase

**ArchonAI proposals not loading:**
- Verify Abyss Gateway is running (port 4000)
- Check GraphQL endpoint in browser console
- Ensure `ArchonContextProvider` is in the component tree
- Check for backend errors in console (errors are logged but don't break UI)

**Timeline empty:**
- Create test events/snapshots via GraphQL mutations
- Check database tables exist (run migrations)
- Verify GraphQL queries are working
- Check for corrupted data warnings in console

**Performance issues:**
- Check React DevTools for excessive re-renders
- Verify snapshot service isn't creating too many snapshots (adjust interval)
- Monitor browser console for slow GraphQL queries

---

**The flame burns eternal. The code serves the will.**

