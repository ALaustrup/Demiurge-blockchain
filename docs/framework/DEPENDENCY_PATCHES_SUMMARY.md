# Dependency Patches Summary

**Date**: January 24, 2026  
**Status**: Patches Configured - Ready for Build Verification

---

## Overview

This document summarizes all dependency patches applied to resolve build issues in the Demiurge Blockchain project.

---

## Patches Applied

### 1. sc-network (Codec Index Collision Fix)

**Issue**: Enum variant codec index collision in `sc-network` versions 0.36.0, 0.37.0, and 0.38.0
- Both `Consensus` and `RemoteCallResponse` variants had codec index `6`
- Caused compilation error: `E0080: duplicate codec index`

**Patches Created**:
- `blockchain/patches/sc-network-0.36.0-fixed/`
- `blockchain/patches/sc-network-0.37.0-fixed/`
- `blockchain/patches/sc-network-0.38.0-fixed/`

**Fix Applied**: Added explicit codec indices to all enum variants in `src/protocol/message.rs`:
- `Status`: index 0
- `BlockRequest`: index 1
- `BlockResponse`: index 2
- `BlockAnnounce`: index 3
- `RemoteCallRequest`: index 4
- `Consensus`: index 6 (kept original)
- `RemoteCallResponse`: index 7 (changed from 6)
- `RemoteReadRequest`: index 8
- `RemoteReadResponse`: index 9
- `RemoteHeaderRequest`: index 10
- `RemoteHeaderResponse`: index 11
- `RemoteChangesRequest`: index 12
- `RemoteChangesResponse`: index 13
- `RemoteReadChildRequest`: index 14
- `ConsensusBatch`: index 17

**Configuration**: 
```toml
[patch.crates-io]
sc-network = { path = "patches/sc-network-0.38.0-fixed" }
```

---

### 2. sp-io (Panic Handler Fix)

**Issue**: `#[no_mangle]` attribute conflict with `#[panic_handler]` in sp-io 37.0.0
- Multiple sp-io versions in WASM dependency tree causing panic handler conflicts
- Internal language item conflicts

**Patch Created**:
- `blockchain/patches/sp-io-37.0.0/`

**Fix Applied**: Removed conflicting `#[no_mangle]` attribute from panic function
- Panic handler now uses `#[panic_handler]` attribute only
- Compatible with WASM runtime compilation

**Configuration**:
```toml
[patch.crates-io]
sp-io = { path = "patches/sp-io-37.0.0" }
```

---

### 3. bandersnatch_vrfs (Git Dependency Stub)

**Issue**: Broken git dependency for `bandersnatch_vrfs` from `https://github.com/w3f/ring-vrf`

**Patch Created**:
- `blockchain/stubs/bandersnatch_vrfs/`

**Fix Applied**: Created local stub to prevent Cargo from fetching broken git repo
- Optional dependency (not used in production builds)
- Prevents build failures when git dependency is unavailable

**Configuration**:
```toml
[patch.'https://github.com/w3f/ring-vrf']
bandersnatch_vrfs = { path = "stubs/bandersnatch_vrfs", optional = true }
```

---

## Patch Scripts

### Local Development
- `blockchain/scripts/patch-local-sc-network.py` - Applies patches to local copies

### Server Deployment
- `blockchain/scripts/patch-sc-network.py` - Applies patches to cargo registry (for server builds)
- `scripts/patch-all-sc-network.py` - Patches multiple sc-network versions

---

## Current Configuration

**File**: `blockchain/Cargo.toml`

```toml
[patch.crates-io]
sc-network = { path = "patches/sc-network-0.38.0-fixed" }
sp-io = { path = "patches/sp-io-37.0.0" }

[patch.'https://github.com/w3f/ring-vrf']
bandersnatch_vrfs = { path = "stubs/bandersnatch_vrfs", optional = true }
```

---

## Build Status

### Previous Status (from BUILD_COMPLETION_SUMMARY.md)
- ✅ sc-network codec collision: **RESOLVED**
- ✅ sp-io panic handler: **RESOLVED**
- ⚠️ Multiple sp-io versions: **KNOWN LIMITATION** (pre-existing Substrate v39.0.0 issue)
- ✅ 11/12 pallets building successfully
- ⚠️ pallet-energy: Upstream dependency issue (sp-trie v41.1.0)

### Next Steps
1. Verify patches are correctly applied
2. Run `cargo check --workspace` to verify compilation
3. Run `cargo build --release` for full build
4. Test node execution

---

## Verification Commands

### Check Patches Applied
```powershell
cd blockchain
cargo check --workspace
```

### Build All Pallets
```powershell
cd blockchain
.\build-pallets.ps1
```

### Full Release Build
```powershell
cd blockchain
cargo build --release --bin demiurge-node
```

---

## Files Modified

- `blockchain/Cargo.toml` - Patch configuration
- `blockchain/patches/sc-network-0.38.0-fixed/src/protocol/message.rs` - Codec indices
- `blockchain/patches/sp-io-37.0.0/src/lib.rs` - Panic handler fix
- `blockchain/stubs/bandersnatch_vrfs/` - Git dependency stub

---

**Last Updated**: 2026-01-24  
**Status**: Ready for Build Verification
