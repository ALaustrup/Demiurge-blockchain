# DEMIURGE BLOCKCHAIN - CUSTOM DEPENDENCY FORK STRATEGY
## Complete Plan to Control Our Supply Chain

**Status**: Strategic Initiative  
**Duration**: ~5-7 days for full implementation  
**Outcome**: Self-contained, version-locked blockchain build system  

---

## PART 1: DEPENDENCY ANALYSIS & INVENTORY

### Critical Dependencies Causing Conflicts

The blockchain relies on these Substrate crates that have incompatible versions:

**Group A: SC-Network (HIGHEST PRIORITY)**
- `sc-network` versions: 0.37.0, 0.38.0, 0.39.0, 0.40.0, 0.41.0
- **Issue**: Codec enum index collisions across all versions
- **Root Cause**: Parity changed enum variants without proper versioning
- **Solution**: Create single unified `demiurge-sc-network` v0.1.0 that works with our stack

**Group B: Frame System**
- `frame-executive`, `frame-support`, `frame-system`
- Versions: 39.0.0, 40.0.0, 43.0.0 (conflicting)
- **Issue**: Version mismatch between pallets and runtime
- **Solution**: Pin to single compatible version across all

**Group C: SP Primitives**
- `sp-api`, `sp-core`, `sp-runtime`, `sp-consensus`, etc.
- Versions: 39.0.0, 40.0.0, 43.0.0+ (multiple versions)
- **Issue**: Trait boundaries differ between versions
- **Solution**: Create `demiurge-sp-primitives` wrapper

**Group D: SC Consensus**
- `sc-consensus`, `sc-consensus-aura`, `sc-consensus-grandpa`
- Multiple versions pulling in different sc-network versions
- **Solution**: Create `demiurge-consensus` that pins transitive deps

**Group E: libp2p Integration**
- `libp2p` v0.51.4, v0.52.4, v0.54.1 simultaneously
- `sc-network` and `libp2p` have breaking trait changes
- **Solution**: Create compatibility wrapper

---

## PART 2: FORK & MODIFY STRATEGY

### Step 1: Fork on GitHub (Days 1-2)

Create organization account (if needed) or use Demiurge:

```bash
# Create forks for each critical crate:
1. Fork paritytech/substrate -> Demiurge-Blockchain/substrate-custom
2. Fork libp2p/rust-libp2p -> Demiurge-Blockchain/libp2p-custom
3. Create fresh: Demiurge-Blockchain/demiurge-consensus
4. Create fresh: Demiurge-Blockchain/demiurge-network
```

### Step 2: Extract & Consolidate (Days 2-3)

**For sc-network**: Extract the latest 0.41.0 version and make it canonical

```bash
# In demiurge-network repo
mkdir -p demiurge-network/src

# Copy sc-network 0.41.0 source and modify:
# - Fix ALL enum codec indices in one pass
# - Remove version conflicts
# - Make it a single unified crate
# - Lock all transitive dependencies to known-good versions

# Structure:
demiurge-network/
  Cargo.toml           # Single version: 0.1.0-demiurge
  src/
    lib.rs
    protocol/
      message.rs       # FIXED with proper codec indices
    service.rs         # FIXED libp2p compatibility
  patches/
    codec-fix.md       # Document all changes
```

**For frame system**: Create wrapper that re-exports with version pinning

```bash
# In substrate-custom repo
demiurge-frame/
  Cargo.toml           # Depends on specific Substrate versions
  src/
    lib.rs             # Re-exports frame-* with version locking
```

### Step 3: Lock All Transitive Dependencies (Day 3-4)

Create `demiurge-deps.lock` strategy:

```toml
# In main blockchain/Cargo.toml

[patch.crates-io]
# All Substrate crates locked to v39.0.0 (known working)
frame-executive = { version = "39.0.0" }
frame-support = { version = "39.0.0" }
frame-system = { version = "39.0.0" }
sp-api = { version = "39.0.0" }
sp-core = { version = "39.0.0" }
sp-runtime = { version = "39.0.0" }
# ... all 20+ sp-* and frame-* crates

# Custom network crate (replaces all sc-network versions)
sc-network = { path = "../../demiurge-network", version = "0.1.0" }
sc-network-common = { path = "../../demiurge-network/common", version = "0.1.0" }
sc-network-sync = { path = "../../demiurge-network/sync", version = "0.1.0" }

# libp2p compatibility layer
libp2p = { git = "https://github.com/Demiurge-Blockchain/libp2p-custom.git", version = "0.54.1" }
```

---

## PART 3: IMPLEMENTATION ROADMAP

### Phase 1: Quick Fix for THIS Build (Today - 2 hours)

**Goal**: Get blockchain compiling with minimal changes

```bash
# Step 1: Create comprehensive codec index patch for ALL sc-network versions
# File: scripts/comprehensive-codec-fix.py

# Scan all sc-network versions in ~/.cargo/registry
# For each version found:
#   1. Read message.rs
#   2. Find all enum variants
#   3. Add explicit #[codec(index = N)] for indices 0-20
#   4. Verify no duplicates
#   5. Write back

# Step 2: Create Cargo.patch that explicitly pins libp2p version
# Add to blockchain/Cargo.toml:

[patch.crates-io]
libp2p = { version = "=0.51.4" }  # Single explicit version
sc-network = { version = "0.39.0", default-features = false }
# ... pin everything

# Step 3: Regenerate Cargo.lock with fresh resolver
cargo update --aggressive

# Step 4: Build
cargo build --release
```

### Phase 2: Create Demiurge Custom Dependencies (Days 2-3)

**Repository Structure**:

```
demiurge-deps/
├── demiurge-network/          # Replaces sc-network
│   ├── Cargo.toml
│   ├── src/
│   │   ├── lib.rs
│   │   ├── protocol/
│   │   │   └── message.rs     # FIXED codec indices
│   │   └── service.rs         # FIXED libp2p traits
│   └── Cargo.lock             # Pinned deps
│
├── demiurge-consensus/        # Wraps sc-consensus
│   ├── Cargo.toml             # Pins versions
│   └── src/lib.rs
│
├── demiurge-frame/            # Wraps frame-*
│   ├── Cargo.toml
│   └── src/lib.rs
│
└── demiurge-sp/               # Wraps sp-* primitives
    ├── Cargo.toml
    └── src/lib.rs
```

### Phase 3: Integration Into Blockchain (Days 4-5)

Update `blockchain/Cargo.toml`:

```toml
[dependencies]
# Use ONLY our custom versions
demiurge-network = { path = "../demiurge-deps/demiurge-network", version = "0.1.0" }
demiurge-consensus = { path = "../demiurge-deps/demiurge-consensus", version = "0.1.0" }
demiurge-frame = { path = "../demiurge-deps/demiurge-frame", version = "0.1.0" }
demiurge-sp = { path = "../demiurge-deps/demiurge-sp", version = "0.1.0" }

# Everything else: explicitly pinned versions
sp-api = { version = "=39.0.0" }
frame-support = { version = "=39.0.0" }
# ... explicit versions for everything
```

### Phase 4: Testing & Validation (Days 5-7)

```bash
# Unit tests
cargo test --release

# Integration tests
cargo test --release --test '*'

# Binary build verification
cargo build --release --bin demiurge-node

# Size check
ls -lh target/release/demiurge-node

# Runtime test
./target/release/demiurge-node --version
./target/release/demiurge-node export-genesis-wasm
```

---

## PART 4: IMMEDIATE ACTION PLAN (Next 2 Hours)

### Task 1: Comprehensive Codec Fix Script

Create Python script that patches ALL sc-network versions exhaustively:

```python
# scripts/fix-all-sc-network-final.py

import glob
import os
import re
from pathlib import Path

def fix_sc_network_file(file_path):
    """Fix codec indices in sc-network message.rs"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Remove ALL existing codec indices
    content = re.sub(r'\s*#\[codec\(index = \d+\)\]\n', '', content)
    
    # Define proper indices for all known variants
    variants = {
        'Status': 0,
        'BlockRequest': 1,
        'BlockResponse': 2,
        'BlockAnnounce': 3,
        'Consensus': 6,  # Note: MUST be 6 per Parity's design
        'RemoteCallRequest': 7,
        'RemoteCallResponse': 8,
        'RemoteReadRequest': 9,
        'RemoteReadResponse': 10,
        'RemoteExecRequest': 11,
        'RemoteExecResponse': 12,
        'ConsensusBatch': 17,
    }
    
    # Add codec indices in correct order
    lines = content.split('\n')
    result = []
    for i, line in enumerate(lines):
        # Check if this line has an enum variant
        for variant, index in variants.items():
            if f'{variant}(' in line and 'enum' not in line:
                # Add codec index before this variant
                indent = len(line) - len(line.lstrip())
                result.append(' ' * indent + f'#[codec(index = {index})]')
                break
        result.append(line)
    
    new_content = '\n'.join(result)
    
    with open(file_path, 'w') as f:
        f.write(new_content)
    
    return True

# Apply to all sc-network versions
registry_path = Path.home() / '.cargo' / 'registry' / 'src'
for version in ['0.37.0', '0.38.0', '0.39.0', '0.40.0', '0.41.0']:
    files = list(registry_path.glob(f'*/sc-network-{version}/src/protocol/message.rs'))
    for file_path in files:
        print(f"Fixing {file_path}")
        fix_sc_network_file(str(file_path))
        print(f"  ✓ Fixed")
```

### Task 2: Create Version Lock Patch

Update `blockchain/Cargo.toml` to force single versions:

**Changes**:
1. Lock ALL Substrate crates to 39.0.0
2. Lock libp2p to 0.51.4
3. Remove version ranges, use `=X.Y.Z` (exact versions)

### Task 3: Clean Rebuild

```bash
ssh pleroma "cd ~/demiurge/blockchain && \
  rm -f Cargo.lock && \
  python3 ~/fix-all-sc-network-final.py && \
  /home/ubuntu/.cargo/bin/cargo clean && \
  /home/ubuntu/.cargo/bin/cargo update --aggressive && \
  nohup /home/ubuntu/.cargo/bin/cargo build --release > build.log 2>&1 &"
```

---

## PART 5: LONG-TERM STRATEGY (5-7 Days)

### Create demiurge-deps Monorepo

**Repository**: `https://github.com/Demiurge-Blockchain/demiurge-deps`

This becomes the SOURCE OF TRUTH for all our dependencies:

```bash
# Day 1: Fork & Setup
git clone --mirror https://github.com/paritytech/substrate.git
git clone --mirror https://github.com/libp2p/rust-libp2p.git
# Create thin wrappers that re-export with our modifications

# Day 2-3: Create demiurge-network (sc-network replacement)
# - Copy sc-network 0.41.0 as baseline
# - Apply comprehensive codec index fixes
# - Test all message types
# - Pin libp2p to 0.51.4
# - Create Cargo.lock

# Day 4: Create demiurge-consensus (consensus wrapper)
# - Thin wrapper re-exporting sc-consensus
# - Pins sc-network to demiurge-network
# - Pins all sp-* to 39.0.0

# Day 5: Create demiurge-frame (frame wrapper)  
# - Thin wrapper re-exporting frame-*
# - Pins all frame-* to 39.0.0
# - Adds comprehensive tests

# Day 6: Integration testing
# - Build blockchain against all new deps
# - Run test suite
# - Generate documentation

# Day 7: Release v0.1.0
# - Tag releases
# - Publish to crates.io (if public)
# - Document architecture
```

### Version Lock Strategy for demiurge-deps

**File**: `demiurge-deps/PINNED_VERSIONS.md`

```
DEMIURGE BLOCKCHAIN DEPENDENCY MATRIX

Core Substrate Version: 39.0.0
libp2p Version: 0.51.4
Rust Edition: 2021
MSRV: 1.74

Pinned Versions:
- frame-executive: =39.0.0
- frame-support: =39.0.0
- frame-system: =39.0.0
- sp-api: =39.0.0
- sp-core: =39.0.0
- sp-runtime: =39.0.0
- sp-consensus: =0.39.0
- sp-consensus-aura: =0.39.0
- sp-consensus-grandpa: =20.0.0
- sc-consensus: =0.39.0
- sc-network: =0.1.0 (demiurge-custom)
- sc-service: =0.39.0
- libp2p: =0.51.4

All other dependencies resolved from these cores.
```

---

## PART 6: BENEFITS OF THIS APPROACH

✅ **Complete Control**: No more upstream version conflicts  
✅ **Reproducible**: Pinned Cargo.lock = identical builds everywhere  
✅ **Auditable**: All dependencies in our repo with changes documented  
✅ **Maintainable**: Single source of truth for versions  
✅ **Scalable**: Can add custom patches to any dependency instantly  
✅ **Production-Ready**: Used by many blockchain projects (Polkadot does this)  
✅ **Future-Proof**: Can fork new Substrate versions as they release  

---

## PART 7: ESTIMATED TIMELINE

**URGENT (Next 2 hours)**:
- [ ] Apply comprehensive codec fix to all sc-network versions
- [ ] Update Cargo.toml with explicit version pins
- [ ] Attempt rebuild

**Short-term (Today - Tomorrow)**:
- [ ] If build succeeds: Document what worked, create Cargo.lock reference
- [ ] If build fails: Proceed with Phase 2

**Medium-term (Days 2-5)**:
- [ ] Create demiurge-deps monorepo
- [ ] Develop demiurge-network crate
- [ ] Integrate into blockchain

**Long-term (Days 5-7)**:
- [ ] Full testing suite
- [ ] Documentation
- [ ] Release v0.1.0

---

## NEXT IMMEDIATE STEP

**Should I proceed with the comprehensive codec fix and version lock strategy RIGHT NOW?**

I can:
1. Create the final codec fix script
2. Update Cargo.toml with exact version pins
3. Deploy to server and attempt rebuild within 30 minutes

**Or should we go straight to starting the demiurge-deps monorepo?**

Your call - but either way, this ends the 3-day cycle of patch attempts.
