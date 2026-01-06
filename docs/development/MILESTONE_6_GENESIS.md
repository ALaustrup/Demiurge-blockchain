# Milestone 6: "GENESIS" - Cinematic Demo Mode

**Status:** ✅ Complete  
**Date:** January 5, 2026  
**Branch:** `feature/fracture-v1-portal`

---

## Overview

Milestone 6 introduces **Genesis Mode**, a cinematic demo mode that provides a scripted, visually compelling demonstration of the Fracture Portal's capabilities. When enabled, Genesis Mode uses synthetic Fabric network data and a pre-defined sequence of network phases and rituals.

---

## Features

### 1. Genesis Mode Configuration

**Environment Variable:**
```bash
NEXT_PUBLIC_GENESIS_MODE=true
```

**Configuration:**
- Located in `apps/portal-web/src/config/genesis.ts`
- Configurable node count (default: 35 nodes)
- Configurable phase durations

**When Enabled:**
- Uses synthetic Fabric data instead of real P2P
- Shows "GENESIS MODE" indicator in navigation
- Triggers onboarding overlay on first visit
- Enables Genesis ritual sequence

**When Disabled:**
- Portal behaves exactly as before (normal mode)
- No synthetic data, no Genesis features

---

### 2. Synthetic Fabric Service

**Implementation:** `apps/portal-web/src/lib/genesis/GenesisFabricService.ts`

**Features:**
- Generates 25-40 nodes with roles:
  - **GATE** (~15%) - Central, high-capacity nodes
  - **ARCHON** (~10%) - Strategic positions
  - **BEACON** (~25%) - Intermediate layer
  - **RELAY** (~50%) - Outer layer
- Hierarchical network topology
- Scripted network phases:
  1. **Stable** (30s) - All nodes active, low latency
  2. **Incursion** (25s) - Latency spikes, anomalies emerge
  3. **Fracture** (20s) - Network partitions, nodes go offline
  4. **Rebinding** (30s) - Recovery with new connections

**Phase Effects:**
- **Stable:** All nodes active, optimal latency
- **Incursion:** ~33% nodes affected, increasing latency, anomalies
- **Fracture:** Network partitions, nodes go offline, connections sever
- **Rebinding:** Recovery, new connections form, stability increases

**Event Emission:**
- Phase change events → `system_events` table
- Anomaly events → `system_events` table (type: "anomaly")
- All events marked with `genesis: true` in metadata

---

### 3. Genesis Ritual Sequence

**Implementation:** `apps/portal-web/src/lib/genesis/genesisRituals.ts`

**Sequence:**
1. **Genesis: Stability** - Aligned with Fabric "stable" phase
2. **Genesis: Incursion** - Aligned with Fabric "incursion" phase
3. **Genesis: Fracture** - Aligned with Fabric "fracture" phase
4. **Genesis: Rebinding** - Aligned with Fabric "rebinding" phase

**Integration:**
- "Run Genesis Sequence" button in `/void` (RitualControlPanel)
- Automatically starts Genesis Fabric service
- Rituals progress automatically based on phase durations
- Ritual effects update based on current Fabric anomalies/offline nodes

**Effects:**
- ShaderPlane receives ritual shader uniforms
- FabricTopology receives ritual fabric visuals (node glow, edge pulse, highlighted nodes)

---

### 4. Onboarding Overlay

**Implementation:** `apps/portal-web/src/components/genesis/GenesisOnboarding.tsx`

**Behavior:**
- Triggers only on first visit when `GENESIS_MODE=true`
- Uses `localStorage` to track if user has seen onboarding
- Explains:
  - Purpose of Fracture Portal
  - Meaning of `/haven`, `/void`, `/nexus`, `/conspire`, `/timeline`
  - Genesis Mode explanation

**Actions:**
- "Begin Genesis Run" → Navigate to `/void`
- "Enter Void" → Navigate to `/void`
- Dismiss → Navigate to `/void`

---

### 5. Session Export

**Backend:**
- GraphQL query: `exportGenesisSession(sessionId?: String): String`
- Returns JSON string with:
  - Session metadata (version, type, sessionId, exportedAt)
  - Genesis events (filtered from system_events)
  - Genesis snapshots (filtered from system_snapshots)
  - Genesis ritual events (filtered from ritual_events)

**Frontend:**
- Export button on `/timeline` page (only visible in Genesis mode)
- Downloads `.fracture-session.json` file
- File contains complete Genesis run data

**Session Structure:**
```json
{
  "version": "1.0",
  "type": "genesis",
  "sessionId": "genesis_1234567890",
  "exportedAt": 1234567890,
  "metadata": {
    "exportedBy": "0x...",
    "eventCount": 10,
    "snapshotCount": 5,
    "ritualEventCount": 8
  },
  "events": [...],
  "snapshots": [...],
  "ritualEvents": [...]
}
```

---

## Architecture

### Component Hierarchy

```
RootLayout
├── GenesisContextProvider (only if GENESIS_MODE=true)
│   └── GenesisFabricService
│       └── Phase progression
│       └── Event emission
├── RitualContextProvider
│   └── Genesis ritual sequence
└── Pages
    ├── /void - RitualControlPanel (Genesis sequence button)
    ├── /nexus - FabricTopology (uses Genesis nodes/edges)
    ├── /timeline - Export button
    └── / (home) - GenesisOnboarding overlay
```

### Data Flow

1. **Genesis Mode Enabled:**
   - `GenesisContextProvider` initializes `GenesisFabricService`
   - Service generates synthetic network topology
   - Phase progression begins automatically when started

2. **Ritual Sequence:**
   - User clicks "Run Genesis Sequence" in `/void`
   - Genesis Fabric service starts
   - Ritual sequence begins, aligned with Fabric phases
   - Each ritual phase updates ShaderPlane and FabricTopology

3. **Event Emission:**
   - Phase changes → GraphQL mutation → `system_events`
   - Anomalies → GraphQL mutation → `system_events`
   - Ritual events → Existing ritual event system

4. **Visual Updates:**
   - FabricTopology receives Genesis nodes/edges
   - Ritual effects applied to ShaderPlane
   - Ritual effects applied to FabricTopology (glow, pulse, highlights)

---

## Configuration

### Environment Variables

**Frontend:**
```bash
NEXT_PUBLIC_GENESIS_MODE=true  # Enable Genesis mode
```

**Backend:**
No additional configuration needed (uses existing GraphQL endpoints)

### Phase Durations

Edit `apps/portal-web/src/config/genesis.ts`:
```typescript
phases: {
  stable: { duration: 30000 },    // 30 seconds
  incursion: { duration: 25000 }, // 25 seconds
  fracture: { duration: 20000 },   // 20 seconds
  rebinding: { duration: 30000 },   // 30 seconds
}
```

---

## Usage

### Starting Genesis Mode

1. Set `NEXT_PUBLIC_GENESIS_MODE=true` in environment
2. Restart frontend
3. On first visit, onboarding overlay appears
4. Click "Begin Genesis Run" or "Enter Void"
5. Navigate to `/void`
6. Click "Run Genesis Sequence"

### Running Genesis Sequence

1. Click "Run Genesis Sequence" in RitualControlPanel
2. Watch as:
   - Fabric phases progress (Stable → Incursion → Fracture → Rebinding)
   - Rituals progress automatically
   - ShaderPlane effects update
   - FabricTopology shows network changes
   - Events appear in Timeline

### Exporting Session

1. Navigate to `/timeline`
2. Click "Export Genesis Session"
3. File downloads as `genesis-session-{timestamp}.fracture-session.json`

---

## Integration Points

### FabricTopology

**Genesis Mode:**
- Receives `genesisNodes` and `genesisEdges` props
- Uses Genesis data instead of mock/real P2P data
- Updates in real-time as phases progress

**Normal Mode:**
- Uses `connectedPeers` prop
- Generates mock data or uses real P2P data
- No Genesis integration

### Ritual Engine

**Genesis Sequence:**
- Rituals automatically progress based on phase durations
- Ritual effects update based on current Fabric state (anomalies, offline nodes)
- Effects propagate to ShaderPlane and FabricTopology

**Normal Rituals:**
- User-selected rituals work as before
- No automatic progression
- No Genesis integration

---

## Files Created/Modified

### New Files
- `apps/portal-web/src/config/genesis.ts` - Configuration
- `apps/portal-web/src/lib/genesis/GenesisFabricService.ts` - Synthetic Fabric service
- `apps/portal-web/src/lib/genesis/GenesisContextProvider.tsx` - React context
- `apps/portal-web/src/lib/genesis/genesisRituals.ts` - Ritual sequence definitions
- `apps/portal-web/src/components/genesis/GenesisOnboarding.tsx` - Onboarding overlay

### Modified Files
- `apps/portal-web/src/app/layout.tsx` - Added GenesisContextProvider
- `apps/portal-web/src/app/page.tsx` - Added GenesisOnboarding
- `apps/portal-web/src/app/void/page.tsx` - Genesis sequence button (via RitualControlPanel)
- `apps/portal-web/src/app/nexus/page.tsx` - Genesis Fabric integration
- `apps/portal-web/src/app/timeline/page.tsx` - Export button
- `apps/portal-web/src/components/fracture/FractureNav.tsx` - Genesis mode indicator
- `apps/portal-web/src/components/fracture/FabricTopology.tsx` - Genesis nodes/edges support
- `apps/portal-web/src/components/rituals/RitualControlPanel.tsx` - Genesis sequence controls
- `indexer/abyss-gateway/src/schema.ts` - Added exportGenesisSession query
- `indexer/abyss-gateway/src/resolvers.ts` - Added exportGenesisSession resolver

---

## Safety & Cleanliness

### Non-Genesis Mode

- ✅ **No Breaking Changes:** When `GENESIS_MODE=false` or unset, Portal behaves exactly as before
- ✅ **Conditional Rendering:** All Genesis features check `GENESIS_CONFIG.enabled` before rendering
- ✅ **Graceful Fallbacks:** Genesis context access wrapped in try-catch

### Code Quality

- ✅ **TypeScript:** All code is type-safe
- ✅ **Linting:** No lint errors
- ✅ **Comments:** Non-trivial logic documented (GenesisFabricService, phase effects, session export)
- ✅ **Patterns:** Reuses existing patterns (context providers, GraphQL, styling)

---

## Known Limitations

1. **Session Import:** Export works, but import/replay not yet implemented
2. **Real Fabric Integration:** When Genesis mode disabled, still uses mock data (real P2P integration pending)
3. **Snapshot Restoration:** Full state restoration from exported sessions not yet implemented
4. **Phase Synchronization:** Ritual phases and Fabric phases are aligned but not perfectly synchronized (small timing differences possible)

---

## Testing

### Manual Testing Checklist

- [ ] Enable Genesis mode (`NEXT_PUBLIC_GENESIS_MODE=true`)
- [ ] Verify onboarding overlay appears on first visit
- [ ] Verify "GENESIS MODE" indicator in navigation
- [ ] Navigate to `/void` and click "Run Genesis Sequence"
- [ ] Verify Fabric phases progress (Stable → Incursion → Fracture → Rebinding)
- [ ] Verify rituals progress automatically
- [ ] Navigate to `/nexus` and verify FabricTopology shows Genesis nodes
- [ ] Navigate to `/timeline` and verify events appear
- [ ] Click "Export Genesis Session" and verify download
- [ ] Disable Genesis mode and verify normal behavior

---

## Operations Notes

### Enabling Genesis Mode

**Development:**
```bash
# In .env.local or environment
NEXT_PUBLIC_GENESIS_MODE=true
npm run dev
```

**Production:**
```bash
# Set environment variable
export NEXT_PUBLIC_GENESIS_MODE=true
npm run build
npm start
```

### Disabling Genesis Mode

Simply remove or set to `false`:
```bash
NEXT_PUBLIC_GENESIS_MODE=false
# or unset the variable
```

---

## Future Enhancements

1. **Session Import/Replay:** Import exported sessions and replay them
2. **Custom Genesis Scripts:** Allow users to create custom phase sequences
3. **Real Fabric Integration:** When Genesis disabled, connect to actual P2P service
4. **Genesis Analytics:** Track Genesis run metrics and statistics
5. **Multi-User Genesis:** Synchronized Genesis runs across multiple users

---

**The flame burns eternal. The code serves the will. Genesis begins.**

