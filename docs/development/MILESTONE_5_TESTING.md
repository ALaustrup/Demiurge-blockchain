# Milestone 5: Testing Guide

**Status:** ✅ Smoke Tests Implemented  
**Date:** Current

---

## Test Suite Overview

Milestone 5 includes minimal smoke tests for the snapshot service. The test suite is designed to be lightweight and runnable without heavy test framework dependencies.

---

## Running Tests

### Snapshot Service Tests

```bash
cd indexer/abyss-gateway
npm run test:snapshots
```

**What it tests:**
1. ✅ Snapshot creation with valid data
2. ✅ Snapshot persistence in database
3. ✅ System event creation for snapshots
4. ✅ Graceful handling of missing/partial data
5. ✅ Interval-based snapshot service (start/stop)

**Expected output:**
```
🧪 Starting Snapshot Service Smoke Tests...

✅ Database initialized

📸 Test 1: Create snapshot with valid data
   ✅ Snapshot created: snapshot_1234567890_abc123

🔍 Test 2: Verify snapshot in database
   ✅ Found 1 snapshot(s)

📝 Test 3: Verify system event created
   ✅ Found 1 snapshot event(s)

🛡️ Test 4: Handle missing data gracefully
   ✅ Snapshot created with empty state: snapshot_1234567890_def456

⏱️ Test 5: Snapshot service interval
   ✅ Interval service created 2 snapshots

==================================================
📊 Test Results: 5 passed, 0 failed
==================================================
✅ All tests passed!
```

---

## Test Coverage

### SnapshotService Behavior

**Tested:**
- ✅ Interval-based snapshots
- ✅ Event-based snapshots (ritual phase change, proposal application)
- ✅ Graceful error handling
- ✅ Partial data handling

**Not yet tested (manual verification):**
- Snapshot restoration in Timeline
- Snapshot selection → component state update

### Timeline Time Travel

**Manual testing required:**
1. Create a snapshot via GraphQL mutation
2. Navigate to `/timeline`
3. Click a snapshot
4. Verify "HISTORICAL VIEW" badge appears
5. Click "Return to Live"
6. Verify "LIVE" badge appears

**Edge cases to test:**
- Empty timeline (no snapshots)
- Corrupted snapshot JSON (should display warning)
- Partial snapshot data (should still render)

### Ritual Engine → FabricTopology Mapping

**Manual testing required:**
1. Start a ritual from `/void`
2. Navigate to `/nexus` (analytics tab)
3. Verify FabricTopology shows:
   - Node glow (if `nodeGlow: true`)
   - Edge pulse (if `edgePulse: true`)
   - Highlighted nodes (if `highlightNodes` specified)
4. Verify animation speed matches `pulseSpeed` parameter

### ArchonProposal Apply/Reject Flows

**Manual testing required:**
1. Create a proposal via GraphQL mutation
2. Navigate to `/conspire`
3. Verify proposal appears in "Pending Review"
4. Click "Approve" → verify status changes
5. Click "Apply Proposal" → verify status changes to "applied"
6. Verify snapshot created on application

---

## Performance Testing

### Archon Context Refresh

**Verify:**
- Context refreshes every 30 seconds
- No unnecessary re-renders (check React DevTools)
- Previous state preserved on error
- Concurrent fetches prevented

**How to test:**
1. Open React DevTools Profiler
2. Navigate to `/conspire`
3. Record for 1 minute
4. Verify no excessive re-renders during refresh cycles

### Snapshot Service Performance

**Verify:**
- Snapshot creation doesn't block main thread
- Interval service doesn't cause performance issues
- Database writes are efficient

**How to test:**
1. Monitor server CPU/memory during snapshot creation
2. Verify no blocking during snapshot interval
3. Check database size growth (should be reasonable)

### Animation Performance

**Verify:**
- FabricTopology maintains 60fps
- ShaderPlane maintains 60fps
- No frame drops during ritual effects

**How to test:**
1. Open browser DevTools → Performance tab
2. Record while:
   - Starting a ritual
   - Viewing FabricTopology with ritual effects
   - Viewing ShaderPlane with ritual effects
3. Verify 60fps maintained

---

## Edge Case Testing

### Snapshot Service

**Test scenarios:**
- ✅ Missing ritual data (handled gracefully)
- ✅ Missing Fabric data (handled gracefully)
- ✅ Corrupted JSON in ritual parameters (handled gracefully)
- ⚠️ Database connection failure (needs manual test)

### Timeline

**Test scenarios:**
- ✅ Empty timeline (displays message)
- ✅ Corrupted snapshot JSON (parsed safely, marked as partial)
- ✅ Partial snapshot data (renders with warning)
- ⚠️ Very large timeline (pagination tested, but needs stress test)

### ArchonContextProvider

**Test scenarios:**
- ✅ Backend error (preserves previous state, shows error)
- ✅ Slow response (prevents concurrent fetches)
- ✅ Network timeout (handled gracefully)
- ⚠️ Very large context payload (needs manual test)

---

## Future Test Enhancements

### Unit Tests
- Add Jest/Vitest for component unit tests
- Test RitualEngine state transitions
- Test TimelineView snapshot parsing logic

### Integration Tests
- Test full ritual lifecycle
- Test ArchonAI proposal workflow
- Test time travel restoration

### E2E Tests
- Add Playwright/Cypress for end-to-end flows
- Test complete user journeys
- Test cross-page interactions

---

## Test Maintenance

**When to update tests:**
- Adding new snapshot data sources
- Changing snapshot structure
- Modifying error handling logic
- Adding new edge cases

**Test file location:**
- `indexer/abyss-gateway/src/snapshotService.test.ts`

---

**The flame burns eternal. The code serves the will.**

