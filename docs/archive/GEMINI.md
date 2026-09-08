# GEMINI Project Context: Demiurge-Blockchain

This document provides a comprehensive overview of the `Demiurge-Blockchain` project, designed to give an AI assistant the context needed to understand the codebase, development conventions, and operational procedures.

## 1. Project Overview

**Demiurge-Blockchain** is a revolutionary, gaming-focused L1 blockchain ecosystem built with Substrate (Rust). It's a monorepo containing the blockchain node, multiple frontend applications, backend services, and shared packages.

The project's vision is to create a next-generation gaming platform featuring:
- **Zero-Gas Gaming:** Feeless transactions for players.
- **Stateful & Composable NFTs:** On-chain evolving and nestable assets (DRC-369 standard).
- **Custom Pallets:** Over 10 custom pallets for features like a native DEX, identity system (QOR ID), and regenerating "energy" currencies.
- **Web Hub:** A central web platform (`apps/hub`) built with Next.js and React.
- **Auth Service:** A backend authentication service (`services/qor-auth`) built in Rust (Axum).

The project is ambitious, with a detailed roadmap that includes "Revolutionary Features" like AI-driven NFT evolution, ZK privacy, and session keys to eliminate wallet pop-ups during gameplay.

### Core Technologies
- **Blockchain:** Rust, Substrate Framework
- **Frontend:** TypeScript, Next.js, React
- **Backend Services:** Rust (Axum)
- **Database/Cache:** PostgreSQL, Redis
- **Build & Orchestration:** Docker, `npm` Workspaces, `turbo`

### Key Directories
- `blockchain/`: The Substrate node, runtime, and custom pallets.
- `apps/hub/`: The main Next.js web application.
- `services/qor-auth/`: The identity and authentication backend.
- `packages/`: Shared TypeScript packages (`qor-sdk`, `ui-shared`).
- `docker/`: Docker configurations for local development services.
- `scripts/`: Utility scripts for building, deploying, and testing.
- `docs/`: Extensive documentation, including roadmaps and architecture guides.

## 2. Building and Running the Project

The project uses a combination of `npm`, `cargo`, and `docker` for its development workflow.

### Prerequisites
- **Node.js**: `v18+`
- **npm**: `v9+`
- **Rust**: Latest stable with `wasm32-unknown-unknown` target.
- **Docker**: For running dependent services.

### Step 1: Install Dependencies

Install all Node.js dependencies for the monorepo workspaces.

```bash
npm install
```

### Step 2: Start Backend Services

The project relies on PostgreSQL, Redis, and the `qor-auth` service. These can be started easily using Docker Compose.

```bash
cd docker
docker-compose up -d
```
This command will start all necessary services in the background.

### Step 3: Build and Run the Blockchain Node

Building the Substrate node can be resource-intensive and has known dependency conflicts (`librocksdb-sys`). The recommended approach is to use an external terminal or build script.

**Option A: Using the PowerShell Build Script (Recommended)**
```powershell
./scripts/build-node-release.ps1
```

**Option B: Manual Cargo Build**
```bash
cd blockchain
cargo build --release --bin demiurge-node
```

Once built, run the node in development mode:
```bash
# From the /blockchain directory
./target/release/demiurge-node --dev --rpc-cors=all
```

### Step 4: Run the Frontend Web Hub

The main web application can be started using the root `dev` script, which is managed by `turbo`.

```bash
# From the root directory
npm run dev
```
This will start the Next.js development server for the `hub` application, accessible at `http://localhost:3000`.

## 3. Development Conventions

Adhering to the project's conventions is crucial for maintaining order.

### Naming Conventions
The project uses Gnostic terminology for its modules. Refer to `CONTRIBUTING.md` for the full list.
- **Aeon**: Major features or modules.
- **Archon**: Governance or control systems.
- **Pleroma**: The complete system/network.

### Git Branching Strategy
- **`main`**: Production-ready code.
- **`develop`**: Main integration branch. All feature branches are merged here.
- **`aeon/*`**: For new features (e.g., `aeon/session-keys`).
- **`fix/*`**: For bug fixes (e.g., `fix/login-error`).

### Commit Messages
Commits should follow a conventional format: `[TYPE] Brief description`.
- **`[AEON]`**: A new feature is implemented.
- **`[FIX]`**: A bug is fixed.
- **`[DOCS]`**: Documentation changes.
- **`[REFACTOR]`**: Code cleanup or restructuring without changing functionality.

**Example:** `[AEON] Implement session key generation for game logins`

### Code Standards
- **Rust**: Code must be formatted with `rustfmt` and pass `clippy` checks.
- **TypeScript/JS**: Code is linted with ESLint and formatted with Prettier. Use the `lint` script:
  ```bash
  npm run lint
  ```
