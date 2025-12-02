# Milestone 4: Dev Capsules & Recursion Prelude - COMPLETE

## Summary

Milestone 4 implements two major features:

1. **Dev Capsules**: Project-bound mini execution environments tracked on-chain
2. **Recursion Game Engine Prelude**: Foundation for a chain-native game engine

All changes are **additive** and **backward-compatible** with existing functionality.

---

## Part 1: Dev Capsules (On-Chain Runtime + RPC)

### New Files

- `chain/src/runtime/dev_capsules.rs` - Runtime module for Dev Capsules
  - `DevCapsule` struct (id, owner, project_slug, status, created_at, updated_at, notes)
  - `CapsuleStatus` enum (Draft, Live, Paused, Archived)
  - Storage keys: `capsule:by_id:{id}`, `capsule:by_owner:{address}`, `capsule:by_project:{slug}`, `capsule:counter`
  - Functions: `create_capsule`, `get_capsule`, `list_capsules_by_owner`, `list_capsules_by_project`, `update_capsule_status`, `update_capsule_notes`

### Modified Files

- `chain/src/runtime/mod.rs` - Added `dev_capsules` module and registered `DevCapsulesModule`
- `chain/src/rpc.rs` - Added RPC methods:
  - `devCapsule_create`
  - `devCapsule_get`
  - `devCapsule_listByOwner`
  - `devCapsule_updateStatus`
- `apps/portal-web/src/lib/rpc.ts` - Added TypeScript helpers for Dev Capsule RPC methods

---

## Part 2: Dev Capsules (Abyss Gateway + GraphQL)

### Modified Files

- `indexer/abyss-gateway/src/chatDb.ts`:
  - Added `dev_capsules` SQLite table
  - Added helper functions: `upsertDevCapsule`, `getDevCapsuleById`, `getDevCapsulesByOwner`, `getDevCapsulesByProject`
- `indexer/abyss-gateway/src/schema.ts`:
  - Added `DevCapsule` GraphQL type
  - Added queries: `devCapsulesByOwner`, `devCapsulesByProject`, `devCapsule`
  - Added mutations: `createDevCapsule`, `updateDevCapsuleStatus`
- `indexer/abyss-gateway/src/resolvers.ts`:
  - Implemented all Dev Capsule resolvers with chain RPC integration and SQLite caching

---

## Part 3: Dev Capsules (Portal + CLI)

### Modified Files

- `apps/portal-web/src/app/developers/projects/[slug]/page.tsx`:
  - Added "Capsules" section with list, create, and status update UI
  - Mobile-responsive layout with touch-friendly controls
- `apps/portal-web/src/lib/graphql.ts`:
  - Added Dev Capsule queries and mutations
  - Added helper functions: `getDevCapsulesByProject`, `createDevCapsule`, `updateDevCapsuleStatus`
- `cli/src/main.rs`:
  - Added `CapsuleCommands` enum with `List`, `Create`, `Status` subcommands
  - Implemented CLI handlers for all capsule operations

---

## Part 4: Recursion Game Engine Prelude

### New Files

- `engine/recursion/CMakeLists.txt` - CMake build configuration
- `engine/recursion/src/main.cpp` - Main entry point with tick loop
- `engine/recursion/src/recursion_world.h` - `RecursionWorld` class definition
- `engine/recursion/src/recursion_world.cpp` - `RecursionWorld` implementation
- `engine/recursion/README.md` - Engine documentation

### Modified Files

- `chain/src/runtime/recursion_registry.rs` - New runtime module:
  - `RecursionWorldMeta` struct (world_id, owner, title, description, fabric_root_hash, created_at)
  - Storage keys: `recursion:world:{world_id}`, `recursion:worlds_by_owner:{owner}`
  - Functions: `create_world`, `get_world`, `list_worlds_by_owner`
- `chain/src/runtime/mod.rs` - Registered `RecursionRegistryModule`
- `chain/src/rpc.rs` - Added RPC methods:
  - `recursion_createWorld`
  - `recursion_getWorld`
  - `recursion_listWorldsByOwner`
- `apps/portal-web/src/lib/rpc.ts` - Added TypeScript helpers for Recursion RPC methods
- `apps/portal-web/src/app/developers/projects/[slug]/page.tsx` - Added "Recursion Worlds" section with link to docs

---

## Part 5: Documentation

### New Files

- `apps/portal-web/src/app/docs/developers/dev-capsules.mdx` - Dev Capsules documentation
- `apps/portal-web/src/app/docs/developers/recursion.mdx` - Recursion Engine documentation

### Modified Files

- `apps/portal-web/src/app/docs/page.tsx` - Added links to Dev Capsules and Recursion Engine docs

---

## What Are Dev Capsules?

Dev Capsules are project-bound mini execution environments tracked on-chain. They allow developers to:

- Track execution environments for their projects
- Manage capsule lifecycles (draft, live, paused, archived)
- Store notes and metadata
- Associate capsules with Developer Registry projects

Capsules are stored on-chain and can be queried via RPC, GraphQL, or the Portal UI.

---

## What Is Recursion Prelude?

Recursion Prelude is the foundation for a chain-native game engine. It provides:

- **C++20 skeleton** (`engine/recursion/`) with basic world structure and tick loop
- **On-chain world registry** via `recursion_registry` runtime module
- **RPC integration** for creating and querying worlds
- **Event hooks** for reacting to chain events (NFT mints, CGT transfers, etc.)
- **State snapshot export** for persistence

Future milestones will add GPU rendering, physics, networking, and full Fabric integration.

---

## How to Run / Test

### Prerequisites

- Rust toolchain (for chain, CLI)
- Node.js/pnpm (for Portal, Abyss Gateway)
- CMake 3.20+ and C++20 compiler (for Recursion Engine)

### Running the Chain

```bash
cd chain
cargo run --release
```

The chain will start on `http://127.0.0.1:8545/rpc` by default.

### Running Abyss Gateway

```bash
cd indexer/abyss-gateway
pnpm install
pnpm dev
```

Gateway will start on `http://localhost:4000/graphql`.

### Running Portal

```bash
cd apps/portal-web
pnpm install
pnpm dev
```

Portal will start on `http://localhost:3000`.

### Building Recursion Engine

```bash
cd engine/recursion
mkdir build && cd build
cmake ..
cmake --build .
./recursion
```

### Testing Dev Capsules

**Via CLI:**
```bash
# Create a capsule
demiurge dev capsule create --owner 0x... --project my-project --notes "Test capsule"

# List capsules
demiurge dev capsule list --owner 0x...

# Update status
demiurge dev capsule status --id 1 --status live
```

**Via Portal:**
1. Navigate to `/developers/projects/[slug]`
2. Use the "Capsules" section to create and manage capsules

**Via RPC:**
```bash
curl -X POST http://127.0.0.1:8545/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "devCapsule_create",
    "params": {
      "owner": "0x...",
      "project_slug": "my-project",
      "notes": "Test capsule"
    },
    "id": 1
  }'
```

### Testing Recursion Registry

**Via RPC:**
```bash
curl -X POST http://127.0.0.1:8545/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "recursion_createWorld",
    "params": {
      "owner": "0x...",
      "world_id": "my_world",
      "title": "My Game World",
      "description": "A test world",
      "fabric_root_hash": ""
    },
    "id": 1
  }'
```

### Verification Checklist

- ✅ `cargo check` at repo root succeeds
- ✅ `pnpm install` and `pnpm build` for `indexer/abyss-gateway` succeeds
- ✅ `pnpm install`, `pnpm lint`, `pnpm build` for `apps/portal-web` succeeds
- ✅ No TypeScript errors or unexpected warnings
- ✅ All new RPC methods are accessible
- ✅ GraphQL schema compiles and resolvers work
- ✅ Portal UI renders correctly

---

## Breaking Changes

**None.** All changes are additive and backward-compatible.

---

## Next Steps

Future milestones will extend:

- **Dev Capsules**: Execution environment metadata, deployment tracking, CI/CD integration
- **Recursion Engine**: GPU rendering, physics, networking, full Fabric integration, Recursion Objects

---

## Commit Message

```
feat: Milestone 4 - dev capsules and recursion prelude

- Add Dev Capsules runtime module and RPC methods
- Add Dev Capsules GraphQL schema and resolvers
- Add Dev Capsules Portal UI and CLI commands
- Add Recursion Engine C++ skeleton
- Add Recursion Registry runtime module and RPC methods
- Add Recursion Portal docs and UI hooks
- Add documentation pages for Dev Capsules and Recursion Engine

All changes are additive and backward-compatible.
```

