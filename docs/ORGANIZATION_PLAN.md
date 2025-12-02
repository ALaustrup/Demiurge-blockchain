# Documentation Organization Plan

This document outlines the plan for organizing all `.md` files in the Demiurge repository according to the structured `docs/` tree.

## Rules

- All `.md` documentation MUST live inside `docs/` in one of the structured subfolders
- Component-specific READMEs (apps/, cli/, sdk/, templates/) are allowed to stay in their directories
- Root `README.md` stays at root (main project README)
- No random `.md` files at repo root or under src/ unless absolutely necessary

## Files to Keep in Place

### Component READMEs (Keep as-is)
- `apps/desktop-qt/README.md` - Component-specific
- `apps/portal-web/README.md` - Component-specific
- `apps/portal-web/public/media/README.md` - Component-specific
- `cli/README.md` - Component-specific
- `sdk/rust-sdk/README.md` - Component-specific
- `sdk/ts-sdk/README.md` - Component-specific
- `templates/*/README.md` - Component-specific
- `engine/recursion/README.md` - Component-specific

### Root Files (Keep as-is)
- `README.md` - Main project README

### Ignore
- `DEMIURGE/` directory - Nested/duplicate directory, not tracked

## Files to Organize in docs/

### Deployment & Operations (`docs/deployment/` or `docs/operations/`)

**Deployment Guides:**
- `COMPLETE_DEPLOYMENT_INSTRUCTIONS.md` → `docs/deployment/`
- `DEPLOYMENT_GUIDE.md` → `docs/deployment/`
- `DEPLOYMENT_STATUS.md` → `docs/deployment/`
- `DEPLOYMENT_SUMMARY.md` → `docs/deployment/`
- `OVHCLOUD_DEPLOYMENT_GUIDE.md` → `docs/deployment/`
- `QUICK_SERVER_SETUP.md` → `docs/deployment/`
- `SERVER_SETUP_NEXT_STEPS.md` → `docs/deployment/`
- `SERVER_SETUP_OVERVIEW.md` → `docs/deployment/`

**SSH & Infrastructure:**
- `ADD_SSH_KEY_TO_OVHCLOUD.md` → `docs/deployment/`
- `HOW_TO_ADD_SSH_KEY.md` → `docs/deployment/`
- `SSH_SETUP_OVHCLOUD.md` → `docs/deployment/`

**Operations:**
- `AUTOMATED_UPDATES_GUIDE.md` → `docs/operations/`
- `CHAIN_NODE_INFO.md` → `docs/operations/`

### Development & Milestones (`docs/development/` - new directory)

**Milestone Documentation:**
- `MILESTONE1_COMPLETE.md` → `docs/development/`
- `MILESTONE2_PROGRESS.md` → `docs/development/`
- `MILESTONE3_COMPLETE.md` → `docs/development/`
- `MILESTONE4_COMPLETE.md` → `docs/development/`
- `MILESTONE4_DIAGNOSTIC_REPORT.md` → `docs/development/`
- `MILESTONE_5_ARCHITECTURE_DISCOVERY.md` → `docs/development/`
- `MILESTONE_5_AWAKENING.md` → `docs/development/`
- `MILESTONE_5_IMPLEMENTATION_SUMMARY.md` → `docs/development/`
- `MILESTONE_5_IMPROVEMENTS_SUMMARY.md` → `docs/development/`
- `MILESTONE_5_ROUTES.md` → `docs/development/`
- `MILESTONE_5_TESTING.md` → `docs/development/`
- `MILESTONE_6_GENESIS.md` → `docs/development/`
- `MILESTONE_7_CONVERGENCE.md` → `docs/development/`

**Development Status:**
- `DEVELOPMENT_STATUS.md` → `docs/development/`
- `CURRENT_STATUS_AND_ACTION_PLAN.md` → `docs/development/`
- `PROJECT_UTILITY_OVERVIEW.md` → `docs/development/`

**Phase Documentation:**
- `phase4_audio_implementation.md` → `docs/development/`
- `phase5_frontend_update.md` → `docs/development/`
- `PHASE5_COMPLETE.md` → `docs/development/`

### Overview & Architecture (`docs/overview/`)

**Architecture:**
- `architecture.md` → `docs/overview/` (if different from ARCHITECTURE_DEMIURGE_CURRENT.md)
- `SCHEMATIC_POST_PHASE2.md` → `docs/overview/`

**State & Status:**
- `DEMIURGE_STATE_CAPSULE.md` → `docs/overview/`
- `MASTER_PROMPT.md` → `docs/overview/` (or archive)

### Quick Start Guides (`docs/` root or `docs/network/`)

**Quick Start:**
- `QUICK_START.md` → `docs/network/` (or keep in root with redirect)
- `QUICK_START_FRACTURE.md` → `docs/network/`
- `QUICKSTART.md` → `docs/network/` (consolidate with QUICK_START.md)
- `QUICK_CLONE_INSTRUCTIONS.md` → `docs/network/`

### Testing (`docs/operations/` or `docs/development/`)

**Testing Documentation:**
- `TESTING_GUIDE.md` → `docs/operations/`
- `TESTING_PHASE3_CHAT.md` → `docs/development/`
- `TEST_FEATURES.md` → `docs/development/`

### Design & Implementation (`docs/design/`)

**Implementation:**
- `FRACTURE_V1_IMPLEMENTATION.md` → `docs/design/`
- `FRACTURE_V1_IMPLEMENTATION_COMPLETE.md` → `docs/design/`
- `FRACTURE_V1_AUDIT.md` → `docs/design/`
- `FRACTURE_V1_MEDIA_FILES.md` → `docs/design/`

### Media & Setup (`docs/operations/` or archive)

**Media Setup:**
- `MEDIA_FILES_SETUP.md` → `docs/operations/` (or archive if outdated)

### Rituals & Special (`docs/` - archive or special folder)

**Special Documentation:**
- `ABYSSID_RITUAL_IMPLEMENTATION.md` → Archive or special folder
- `RESET_INSTRUCTIONS.md` → `docs/operations/`
- `README-START.md` → Archive (outdated)

## Proposed Directory Structure

```
docs/
├── index.md
├── overview/
│   ├── ARCHITECTURE_DEMIURGE_CURRENT.md
│   ├── RUNTIME.md
│   ├── CONSENSUS.md
│   ├── TOKENS_CGT_DGEN.md
│   ├── architecture.md (if different)
│   ├── SCHEMATIC_POST_PHASE2.md
│   ├── DEMIURGE_STATE_CAPSULE.md
│   └── MASTER_PROMPT.md (or archive)
├── api/
│   ├── RPC.md
│   └── WORK_CLAIM.md
├── network/
│   ├── DEVNET.md
│   ├── TESTNET.md
│   ├── MAINNET.md
│   ├── QUICK_START.md (consolidated)
│   └── QUICK_CLONE_INSTRUCTIONS.md
├── deployment/
│   ├── README_NODE0.md
│   ├── DEPLOYMENT_RC0.md
│   ├── COMPLETE_DEPLOYMENT_INSTRUCTIONS.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── DEPLOYMENT_STATUS.md
│   ├── DEPLOYMENT_SUMMARY.md
│   ├── OVHCLOUD_DEPLOYMENT_GUIDE.md
│   ├── QUICK_SERVER_SETUP.md
│   ├── SERVER_SETUP_NEXT_STEPS.md
│   ├── SERVER_SETUP_OVERVIEW.md
│   ├── ADD_SSH_KEY_TO_OVHCLOUD.md
│   ├── HOW_TO_ADD_SSH_KEY.md
│   └── SSH_SETUP_OVHCLOUD.md
├── modules/
│   ├── BANK_CGT.md
│   ├── WORK_CLAIM_MODULE.md
│   └── (future: URGEID_REGISTRY.md, NFT_DGEN.md, etc.)
├── operations/
│   ├── MONITORING.md
│   ├── SNAPSHOTS_BACKUPS.md
│   ├── AUTOMATED_UPDATES_GUIDE.md
│   ├── CHAIN_NODE_INFO.md
│   ├── TESTING_GUIDE.md
│   ├── MEDIA_FILES_SETUP.md
│   └── RESET_INSTRUCTIONS.md
├── design/
│   ├── ECONOMY_DESIGN.md
│   ├── NFT_ARCHITECTURE_DGEN.md
│   ├── FRACTURE_V1_IMPLEMENTATION.md
│   ├── FRACTURE_V1_IMPLEMENTATION_COMPLETE.md
│   ├── FRACTURE_V1_AUDIT.md
│   └── FRACTURE_V1_MEDIA_FILES.md
└── development/ (new)
    ├── MILESTONE1_COMPLETE.md
    ├── MILESTONE2_PROGRESS.md
    ├── MILESTONE3_COMPLETE.md
    ├── MILESTONE4_COMPLETE.md
    ├── MILESTONE4_DIAGNOSTIC_REPORT.md
    ├── MILESTONE_5_*.md (all milestone 5 docs)
    ├── MILESTONE_6_GENESIS.md
    ├── MILESTONE_7_CONVERGENCE.md
    ├── DEVELOPMENT_STATUS.md
    ├── CURRENT_STATUS_AND_ACTION_PLAN.md
    ├── PROJECT_UTILITY_OVERVIEW.md
    ├── phase4_audio_implementation.md
    ├── phase5_frontend_update.md
    ├── PHASE5_COMPLETE.md
    ├── TESTING_PHASE3_CHAT.md
    └── TEST_FEATURES.md
```

## Next Steps

1. Create `docs/development/` directory
2. Move files according to the plan above
3. Update `docs/index.md` with new structure
4. Archive or remove outdated files (README-START.md, etc.)
5. Consolidate duplicate quick start guides

