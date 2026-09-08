# Critical UI Fixes - Production Issues

**Status:** 🔴 **IN PROGRESS**  
**Priority:** URGENT - Affecting live user experience at https://demiurge.cloud

## Issues Identified

### 1. ✅ Events Modal Overlap (FIXED)
**Status:** Already fixed in previous session
- Reduced modal height to `max-h-[70vh]`
- Added `pt-20` padding to overlay

### 2. 🔴 Mock Data Everywhere (CRITICAL)
**Impact:** Users see fake data instead of real blockchain state

**Pages with Mock Data:**
- `/agents` - Mock AI agents
- `/bounties` - Mock bounties
- `/social` - Mock friends/posts
- `/dashboard` - Mock activity/NFTs
- `/games` - Mock games list

**Action Required:** Replace with real RPC queries to https://rpc.demiurge.cloud

### 3. 🔴 Chain Status Inconsistency (CRITICAL)
**Impact:** Shows "Offline" on some pages, "Live" on others

**Root Cause:** Two different polling systems:
- `chainStore` (Zustand) - 2s interval  
- `BlockchainContext` - 5s interval

**Action Required:** Consolidate to single source of truth (`chainStore`)

### 4. 🔴 QOR ID Display Issues
**Impact:** May show placeholder if API fails

**Current Code:** `{user?.qor_id}@demiurge.cloud`  
**Issue:** If `qor_id` is undefined, shows `undefined@demiurge.cloud`

**Action Required:** Add fallback logic

### 5. 🔴 Forced Logout on Navigation
**Impact:** Users get logged out when clicking links

**Likely Cause:**
- Server-side navigation triggering auth checks
- Missing auth token in requests
- Session expiration

**Action Required:** Review AuthGate and navigation logic

### 6. 🟡 Text Input Visibility
**Impact:** Can't see text when typing in VYB

**Location:** VYB social message input
**Action Required:** Change text color to dark for light backgrounds

## Implementation Plan

### Phase 1: Authentication Stability (URGENT)
1. Fix session persistence across navigation
2. Ensure QOR ID always displays correctly
3. Fix forced logout issues

### Phase 2: Mock Data Removal (HIGH)
1. Create RPC client hook for blockchain data
2. Replace agents page with real data
3. Replace bounties page with real data  
4. Replace dashboard with real data
5. Remove all mock constants

### Phase 3: UI Polish (MEDIUM)
1. Fix text input colors
2. Fix chain status sync
3. Fix remaining visual issues

## Technical Approach

### Real-Time Data Architecture

```typescript
// Create centralized RPC hook
import { DemiurgeClient } from '@demiurge/sdk';

const client = new DemiurgeClient({
  rpcUrl: 'https://rpc.demiurge.cloud'
});

// Use across all pages
const { data, loading } = useBlockchainData();
```

### Chain Status Fix

**Current:** Two contexts polling separately  
**Solution:** Use only `chainStore` everywhere

```typescript
// Remove BlockchainContext usage
// Use chainStore.getState() instead
```

### Session Persistence

```typescript
// Add session validation before auth-required pages
// Preserve token on network errors
// Cache user data in localStorage (already done)
```

## Files to Modify

1. `apps/hub/src/app/agents/page.tsx` - Remove MOCK_AGENTS
2. `apps/hub/src/app/bounties/page.tsx` - Remove MOCK_BOUNTIES  
3. `apps/hub/src/app/dashboard/page.tsx` - Use real blockchain data
4. `apps/hub/src/components/dashboard/*` - Connect to RPC
5. `apps/hub/src/app/social/*` - Remove mock friends/posts
6. `apps/hub/src/contexts/AuthContext.tsx` - Improve session handling
7. `apps/hub/src/store/chainStore.ts` - Ensure consistent polling

## Success Criteria

- ✅ No mock data visible anywhere
- ✅ QOR ID always displays correctly  
- ✅ Chain status consistent across all pages
- ✅ No forced logouts on navigation
- ✅ All text inputs visible
- ✅ Real-time blockchain data everywhere

---

**Next Step:** Begin systematic implementation starting with auth stability
