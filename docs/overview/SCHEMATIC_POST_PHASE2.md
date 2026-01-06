# Demiurge Post-Phase 2 Implementation Schematic

**Last Updated:** January 5, 2026  
**Purpose:** Comprehensive overview of all implementations since Phase 2 to guide future development

---

## Table of Contents

1. [Phase 2 Baseline](#phase-2-baseline)
2. [Phase 3: Core Runtime & Chat System](#phase-3-core-runtime--chat-system)
3. [Phase 4: Fabric & Abyss (Partial)](#phase-4-fabric--abyss-partial)
4. [UI/UX Enhancements](#uiux-enhancements)
5. [Architecture Overview](#architecture-overview)
6. [File Structure](#file-structure)
7. [Data Flows](#data-flows)
8. [Key Components](#key-components)
9. [Recent Changes (Latest Session)](#recent-changes-latest-session)
10. [Dependencies & Integration Points](#dependencies--integration-points)

---

## Phase 2 Baseline

### What Phase 2 Delivered:
- ✅ **RocksDB Persistence**: State storage backend
- ✅ **Forge PoW**: Memory-hard proof-of-work (Argon2id + SHA-256)
- ✅ **JSON-RPC Server**: Axum-based RPC endpoint at `http://127.0.0.1:8545/rpc`
- ✅ **Basic State Management**: Key-value abstraction over storage
- ✅ **Block Structure**: Basic block and transaction types
- ✅ **Genesis Initialization**: Genesis Archon setup with 1M CGT

### Phase 2 State Storage Keys:
```
bank:balance:{address} → u128 (CGT balance)
bank:total_supply → u128
bank:nonce:{address} → u64
tx:{hash} → Transaction
```

---

## Phase 3: Core Runtime & Chat System

### 3.1 Core Runtime Modules

#### **Bank CGT** (`chain/src/runtime/bank_cgt.rs`)
- **Purpose**: Native token (CGT) management
- **Features**:
  - Balance tracking per address
  - Transfers with Ed25519 signatures
  - Minting (Genesis authority only)
  - Nonce management for replay protection
  - Total/max supply tracking
  - Currency metadata (symbol, decimals)

#### **UrgeID Registry** (`chain/src/runtime/urgeid_registry.rs`)
- **Purpose**: Identity and profile management
- **Features**:
  - UrgeID profile creation and storage
  - Username system (@handle resolution)
  - Syzygy tracking (activity score)
  - Leveling system (10 CGT per level)
  - Badge system
  - Archon flag management
- **Storage Keys**:
  ```
  urgeid/profile:{address} → UrgeIDProfile
  urgeid/handle/{handle} → Address (32 bytes)
  urgeid/archon:{address} → [1u8] or [0u8]
  ```

#### **NFT D-GEN** (`chain/src/runtime/nft_dgen.rs`)
- **Purpose**: D-GEN NFT minting and management
- **Features**:
  - NFT minting (Archon-only)
  - NFT transfers
  - Metadata storage (fabric_root_hash, creator, royalty_bps)
  - Owner tracking
  - NFT counter management
- **Storage Keys**:
  ```
  nft:token:{id} → DGenMetadata
  nft:owner:{address} → Vec<NftId>
  nft:counter → NftId
  ```

#### **Fabric Manager** (`chain/src/runtime/fabric_manager.rs`)
- **Purpose**: Fabric asset registration
- **Status**: Basic structure exists, P2P integration pending
- **Features**:
  - Asset registration
  - Fee pool management

#### **Abyss Registry** (`chain/src/runtime/abyss_registry.rs`)
- **Purpose**: NFT marketplace
- **Features**:
  - Listing creation
  - Listing cancellation
  - NFT purchases
  - Royalty distribution

### 3.2 JSON-RPC API Methods

**Chain Info:**
- `cgt_getChainInfo` - Get chain height, block hash
- `cgt_getCgtMetadata` - Get CGT currency metadata

**CGT Operations:**
- `cgt_getBalance` - Get CGT balance for address
- `cgt_transfer` - Transfer CGT (with signature)
- `cgt_mint` - Mint CGT (Genesis only, dev mode)
- `cgt_getNonce` - Get transaction nonce

**UrgeID Operations:**
- `urgeid_getProfile` - Get UrgeID profile
- `urgeid_setUsername` - Claim/update username
- `urgeid_resolveUsername` - Resolve username to address
- `urgeid_getProgress` - Get Syzygy, level, badges
- `urgeid_getAnalytics` - Get user analytics

**NFT Operations:**
- `cgt_mintDgenNft` - Mint D-GEN NFT (Archon-only)
- `cgt_getNft` - Get NFT metadata
- `cgt_getNftsByOwner` - Get all NFTs owned by address
- `cgt_transferNft` - Transfer NFT

**Archon Operations:**
- `cgt_isArchon` - Check if address is Archon
- `cgt_getArchons` - Get all Archons

**Marketplace Operations:**
- `abyss_getAllListings` - Get all marketplace listings
- `abyss_getListing` - Get specific listing
- `abyss_createListing` - Create NFT listing
- `abyss_cancelListing` - Cancel listing
- `abyss_buyListing` - Purchase NFT from listing

**Transaction Operations:**
- `cgt_signTransaction` - Sign transaction (server-side)
- `cgt_sendRawTransaction` - Submit signed transaction
- `cgt_getTransaction` - Get transaction by hash
- `cgt_getTransactionHistory` - Get transaction history for address

**Dev Operations (Debug builds only):**
- `cgt_devUnsafeTransfer` - Unsafe transfer (no signature)
- `cgt_devFaucet` - Get free CGT for testing

### 3.3 Abyss Gateway (GraphQL API)

**Location**: `indexer/abyss-gateway/`

**Purpose**: GraphQL API for chat and social features

**Schema** (`src/schema.ts`):
- **Queries**:
  - `worldChatMessages(limit: Int)` - Get world chat messages
  - `dmRooms` - Get user's DM rooms
  - `roomMessages(roomId: ID!, limit: Int)` - Get messages in room
  - `customRooms` - Get custom chat rooms
  - `activeUsers(roomId: ID!)` - Get active users in room
- **Mutations**:
  - `sendWorldMessage(content: String!, nftId: String)` - Send world chat message
  - `sendDirectMessage(toUsername: String!, content: String!, nftId: String)` - Send DM
  - `createRoom(name: String!, description: String, slug: String!)` - Create custom room
  - `joinRoom(roomId: ID!)` - Join room
  - `leaveRoom(roomId: ID!)` - Leave room
  - `updateRoomSettings(roomId: ID!, settings: RoomSettingsInput)` - Update room settings
  - `uploadMedia(file: Upload!)` - Upload media file
- **Subscriptions** (Currently polling-based):
  - `worldChatMessages` - Real-time world chat updates
  - `roomMessages(roomId: ID!)` - Real-time room message updates

**Database**: SQLite (`data/chat.db`)
- Tables: `messages`, `dm_rooms`, `room_members`, `custom_rooms`, `media`

**The Seven Archons** (`src/archons.ts`):
- Pre-defined NPC users with special status
- All accessible via DM system
- Usernames: `ialdabaoth`, `sabaoth`, `abrasax`, `yao`, `astaphaios`, `adonaios`, `elaios`

### 3.4 Portal Web - Core Pages

#### **Home Page** (`apps/portal-web/src/app/page.tsx`)
- Live Chain Status (height, block hash)
- Hero section
- Tech pillars section
- Roadmap section
- **Removed**: CGT Supply display, Genesis Archon Dashboard, "Explore Pantheon" and "Become Archon" buttons

#### **UrgeID Dashboard** (`apps/portal-web/src/app/urgeid/page.tsx`)
- **Landing View**: Generate new UrgeID or login
- **Login View**: Enter address to load existing UrgeID
- **Dashboard View**:
  - Profile display (address, username, Syzygy, level, badges)
  - CGT balance
  - Send CGT (with username resolution)
  - Transaction history
  - Vault export/import (password-encrypted)
  - **NFT Gallery**: Carousel-style display of user's D-GEN NFTs
  - **Mint Test NFT**: Circular "+" button (Archon-only, illuminates on hover)
  - QR code for address sharing

#### **Chat Page** (`apps/portal-web/src/app/chat/page.tsx`)
- **Sidebar**:
  - World Chat button
  - Your DMs section
  - The Seven Archons section
  - Custom Rooms section
  - Active users display
- **Main Panel**:
  - Message list with timestamps
  - Message input with NFT ID field
  - Media upload/selector
  - NFT badges (clickable)
  - User avatars and usernames
  - Archon sparkles icon (✨)
- **Features**:
  - Real-time message polling (2-second interval)
  - Context menu (silence user, report, archive DM)
  - Media sharing (images, videos)
  - Blur 4 All moderation
  - Custom room creation
  - Room settings (font, rules, music queue)
  - Music player integration
  - Archived DMs management

#### **Marketplace Page** (`apps/portal-web/src/app/marketplace/page.tsx`)
- Browse all listings
- Create new listing (Archon-only)
- Buy NFTs
- Filter by category
- View listing details
- Transaction status tracking

#### **Analytics Page** (`apps/portal-web/src/app/analytics/page.tsx`)
- User analytics dashboard
- Transaction statistics
- Activity metrics
- Revenue tracking (basic)

#### **Fabric Page** (`apps/portal-web/src/app/fabric/page.tsx`) - **NEW**
- **Purpose**: World gallery for exploring on-chain assets
- **Features**:
  - 20 mock NFT assets (for styling)
  - Dual view modes: Grid and Masonry
  - Three card sizes: Large (4/row), Medium (6/row), Small (9/row)
  - Search functionality
  - Category filters (art, music, game, code, world, plugin)
  - Interactive asset cards with hover effects
  - Detail modal with full asset information
  - Like/unlike functionality
  - Edge-to-edge layout (no padding, reaches screen edges)
  - Responsive grid system
  - Color-shifting "Fabric" header animation

#### **Docs Page** (`apps/portal-web/src/app/docs/page.tsx`)
- Documentation index
- MDX-based documentation pages:
  - Analytics
  - API Reference
  - Archons
  - Chat
  - System Architecture

### 3.5 Portal Web - Components

#### **Layout Components**
- **Navbar** (`components/layout/Navbar.tsx`):
  - Minimalized design (icons only, labels on hover)
  - Synthwave gradient animation on "DEMIURGE" text
  - Responsive icon sizing
  - Active route highlighting
  - **Navigation Items**:
    - UrgeID / My Void
    - Chat
    - Fabric (NEW)
    - Analytics (logged-in only)
    - Abyss (Marketplace)
    - Docs
  - **Removed**: Pantheon, Technology, Creators links

- **Shell** (`components/layout/Shell.tsx`): Wrapper component

#### **Section Components**
- **Hero** (`components/sections/Hero.tsx`): Landing page hero
- **TechPillarsSection** (`components/sections/TechPillarsSection.tsx`): Tech showcase
- **RoadmapSection** (`components/sections/RoadmapSection.tsx`): Phase roadmap
- **CreatorsSection** (`components/sections/CreatorsSection.tsx`): Creators showcase

#### **UI Components**
- **Button** (`components/ui/Button.tsx`): Reusable button
- **Card** (`components/ui/Card.tsx`): Card container
- **MusicPlayer** (`components/chat/MusicPlayer.tsx`): Room music player

### 3.6 Portal Web - Libraries

#### **RPC Client** (`lib/rpc.ts`)
- JSON-RPC wrapper functions
- All chain methods exposed
- Error handling
- Type definitions

#### **Signing** (`lib/signing.ts`)
- Ed25519 signing utilities
- SHA-256 hashing
- Key derivation
- Message signing

#### **Transaction Builder** (`lib/txBuilder.ts`)
- Transaction construction
- Hex encoding/decoding
- Signature attachment (TODO: proper bincode handling)

#### **Transaction History** (`lib/transactions.ts`)
- Local transaction storage
- Status tracking
- History retrieval

#### **UrgeID Utilities** (`lib/urgeid.ts`)
- UrgeID formatting
- Address validation

#### **Vault** (`lib/vault.ts`)
- Password-encrypted key export
- Key import with decryption
- Backup/restore functionality

#### **GraphQL Client** (`lib/graphql.ts`)
- GraphQL query/mutation helpers
- Subscription setup (polling-based)
- Authentication headers

#### **Archons** (`lib/archons.ts`)
- Archon definitions
- Archon data access

#### **AeonID** (`lib/aeonId.ts`)
- Aeon ID utilities

---

## Phase 4: Fabric & Abyss (Partial)

### 4.1 Fabric Implementation

**Status**: UI complete, backend integration pending

**Frontend** (`apps/portal-web/src/app/fabric/page.tsx`):
- Full gallery interface
- Mock data (20 assets)
- Search and filtering
- Responsive grid system
- Asset detail modals

**Backend** (`chain/src/runtime/fabric_manager.rs`):
- Basic structure exists
- Asset registration logic
- P2P network integration pending

### 4.2 Abyss Marketplace

**Status**: Basic functionality complete

**Features**:
- ✅ Listing creation
- ✅ Listing browsing
- ✅ NFT purchases
- ✅ Royalty distribution
- ⚠️ Advanced search (pending)
- ⚠️ Collection management (pending)
- ⚠️ Analytics dashboard (basic exists)

---

## UI/UX Enhancements

### Recent Changes (Latest Session)

#### **Home Page Refinements**
- ❌ Removed CGT Supply display
- ❌ Removed Genesis Archon Dashboard
- ❌ Removed "Explore Pantheon" button
- ❌ Removed "Become Archon" button

#### **Navbar Enhancements**
- ✅ Minimalized design (icons only)
- ✅ Text labels appear on hover
- ✅ Enlarged icons (h-6 w-6)
- ✅ Reduced navbar height (h-14)
- ✅ Added Fabric icon and route
- ✅ Removed Pantheon, Technology, Creators links
- ✅ Synthwave gradient animation on "DEMIURGE" text
  - Colors: cyan-400 → fuchsia-500 → purple-500
  - Letter-by-letter staggered animation (10s cycle, 0.5s delay)
  - No glow effect

#### **Fabric Page Creation**
- ✅ New page at `/fabric`
- ✅ 20 mock NFT assets
- ✅ Three card size options (4/6/9 per row)
- ✅ Search and category filters
- ✅ Grid and Masonry view modes
- ✅ Edge-to-edge layout
- ✅ Responsive design
- ✅ Asset detail modals
- ✅ Like/unlike functionality
- ✅ Color-shifting header animation

#### **My Void (UrgeID) Enhancements**
- ✅ Mint Test NFT moved from home page
- ✅ Circular "+" button with hover illumination
- ✅ NFT carousel gallery
- ✅ Archon status check
- ✅ Username integration in NFT names

#### **Removed Pages**
- ❌ `/pantheon` - Removed
- ❌ `/technology` - Removed
- ❌ `/creators` - Removed

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Demiurge Ecosystem                        │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                       │
        ▼                     ▼                       ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ Chain Node   │      │ Abyss Gateway│      │ Portal Web   │
│ (Rust)       │      │ (Node.js)    │      │ (Next.js)    │
│              │      │              │      │              │
│ Port: 8545   │      │ Port: 4000   │      │ Port: 3000   │
│ JSON-RPC     │      │ GraphQL      │      │ React UI     │
└──────────────┘      └──────────────┘      └──────────────┘
        │                     │                       │
        │                     │                       │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   RocksDB Storage │
                    │   SQLite (Chat)   │
                    └───────────────────┘
```

### Data Flow: NFT Minting

```
User (Portal) → RPC Call → Chain Node → NFT Module → State Storage
                ↓
         Transaction Hash
                ↓
         Status Polling
                ↓
         UI Update
```

### Data Flow: Chat Message

```
User (Portal) → GraphQL Mutation → Abyss Gateway → SQLite DB
                ↓
         Polling Query (2s)
                ↓
         UI Update
```

### Data Flow: CGT Transfer

```
User (Portal) → Build TX → Sign (Ed25519) → RPC Submit → Chain Node
                ↓
         Transaction Hash
                ↓
         Status Polling
                ↓
         Balance Update
```

---

## File Structure

### Chain (`chain/`)
```
chain/
├── src/
│   ├── main.rs              # Node entry point
│   ├── node.rs              # Node orchestration
│   ├── rpc.rs               # JSON-RPC server
│   ├── forge.rs             # PoW implementation
│   ├── config.rs            # Configuration
│   ├── core/
│   │   ├── block.rs         # Block structure
│   │   ├── transaction.rs   # Transaction structure
│   │   ├── state.rs         # State management
│   │   └── mod.rs
│   └── runtime/
│       ├── mod.rs
│       ├── bank_cgt.rs      # CGT token
│       ├── urgeid_registry.rs # Identity
│       ├── nft_dgen.rs      # NFTs
│       ├── fabric_manager.rs # Fabric
│       └── abyss_registry.rs # Marketplace
└── Cargo.toml
```

### Portal Web (`apps/portal-web/`)
```
apps/portal-web/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home
│   │   ├── urgeid/
│   │   │   └── page.tsx          # My Void
│   │   ├── chat/
│   │   │   └── page.tsx          # Chat
│   │   ├── marketplace/
│   │   │   └── page.tsx          # Abyss
│   │   ├── fabric/
│   │   │   └── page.tsx          # Fabric (NEW)
│   │   ├── analytics/
│   │   │   └── page.tsx          # Analytics
│   │   ├── docs/
│   │   │   └── *.mdx            # Documentation
│   │   ├── layout.tsx           # Root layout
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx       # Navigation
│   │   │   └── Shell.tsx
│   │   ├── sections/
│   │   │   ├── Hero.tsx
│   │   │   ├── TechPillarsSection.tsx
│   │   │   ├── RoadmapSection.tsx
│   │   │   └── CreatorsSection.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   └── Card.tsx
│   │   └── chat/
│   │       └── MusicPlayer.tsx
│   └── lib/
│       ├── rpc.ts               # RPC client
│       ├── signing.ts           # Ed25519 signing
│       ├── transaction.ts       # Transaction building
│       ├── transactions.ts      # Transaction history
│       ├── txBuilder.ts         # TX construction
│       ├── urgeid.ts            # UrgeID utils
│       ├── vault.ts             # Key backup/restore
│       ├── graphql.ts           # GraphQL client
│       ├── archons.ts           # Archon data
│       └── aeonId.ts            # AeonID utils
└── package.json
```

### Abyss Gateway (`indexer/abyss-gateway/`)
```
indexer/abyss-gateway/
├── src/
│   ├── index.ts            # Entry point
│   ├── server.ts           # Express server
│   ├── schema.ts           # GraphQL schema
│   ├── resolvers.ts        # GraphQL resolvers
│   ├── chatDb.ts           # SQLite database
│   └── archons.ts          # Archon definitions
├── data/
│   └── chat.db             # SQLite database file
└── package.json
```

---

## Key Components

### State Management

**Chain State (RocksDB)**:
- CGT balances, nonces, supply
- UrgeID profiles, usernames, Syzygy
- NFT metadata, ownership
- Transaction history
- Archon flags

**Chat State (SQLite)**:
- Messages (world, DM, room)
- DM rooms
- Custom rooms
- Media files
- Room settings

**Client State (localStorage)**:
- Wallet address
- Private key (encrypted)
- Silenced users
- Archived DMs
- Transaction records

### Authentication

**Chain Authentication**:
- Ed25519 keypairs
- Address = public key (32 bytes)
- Private key stored client-side (encrypted in vault)

**GraphQL Authentication**:
- Headers: `x-demiurge-address`, `x-demiurge-username`
- Address validation
- Username resolution

### Styling System

**Framework**: TailwindCSS
**Animations**: Framer Motion
**Icons**: Lucide React
**Theme**: Dark (zinc-950 background)
**Effects**: Glassmorphism, gradients, backdrop blur

**Custom CSS** (`globals.css`):
- Custom grid columns (9-15 columns)
- Color shift animations
- Gradient shift animations
- Pulse animations

---

## Recent Changes (Latest Session)

### Files Modified
1. `apps/portal-web/src/app/page.tsx` - Removed CGT Supply, Genesis Dashboard
2. `apps/portal-web/src/app/urgeid/page.tsx` - Added NFT minting, carousel
3. `apps/portal-web/src/components/layout/Navbar.tsx` - Minimalized, animations
4. `apps/portal-web/src/app/fabric/page.tsx` - **NEW FILE** - Complete Fabric gallery
5. `apps/portal-web/src/app/globals.css` - Custom grid classes, animations
6. `apps/portal-web/src/components/sections/Hero.tsx` - Removed links
7. `apps/portal-web/src/app/docs/page.tsx` - Removed creators reference

### Files Deleted
- `apps/portal-web/src/app/pantheon/page.tsx`
- `apps/portal-web/src/app/technology/page.tsx`
- `apps/portal-web/src/app/creators/page.tsx`

### Deployment
- ✅ Committed to Git
- ✅ Pushed to remote
- ✅ Deployed to Vercel (production)

---

## Dependencies & Integration Points

### Chain Node Dependencies
- **Rust**: Latest stable
- **RocksDB**: State persistence
- **Axum**: HTTP/RPC server
- **Tokio**: Async runtime
- **Argon2id**: PoW hashing
- **SHA-256**: Final hash

### Portal Web Dependencies
- **Next.js**: 16.0.3
- **React**: 18+
- **TypeScript**: Latest
- **TailwindCSS**: Utility-first styling
- **Framer Motion**: Animations
- **Lucide React**: Icons
- **react-qr-code**: QR code generation
- **@noble/ed25519**: Ed25519 signing

### Abyss Gateway Dependencies
- **Node.js**: Latest LTS
- **Express**: HTTP server
- **GraphQL**: Apollo Server
- **SQLite3**: Database
- **TypeScript**: Type safety

### Integration Points

**Chain ↔ Portal**:
- JSON-RPC over HTTP
- Endpoint: `http://127.0.0.1:8545/rpc`
- All operations via RPC methods

**Abyss Gateway ↔ Portal**:
- GraphQL over HTTP
- Endpoint: `http://localhost:4000/graphql`
- Chat and social features

**Chain ↔ Abyss Gateway**:
- Currently independent
- Future: Chain events → Gateway indexing

---

## Critical Notes for Future Development

### ⚠️ Breaking Changes to Avoid

1. **State Storage Keys**: Do not change key formats without migration
2. **RPC Method Signatures**: Maintain backward compatibility
3. **GraphQL Schema**: Use deprecation for schema changes
4. **localStorage Keys**: Document and maintain consistency

### 🔧 TODOs Found in Code

1. **`lib/txBuilder.ts`**: Line 42 - "TODO: Implement proper bincode decode/encode or use server RPC"
2. **WebSocket Subscriptions**: Currently polling-based, upgrade planned
3. **Fabric P2P**: Backend integration pending
4. **Signature Verification**: Server-side verification needed

### 🎯 Recommended Next Steps

1. **WebSocket Upgrade**: Replace polling with real-time subscriptions
2. **Fabric Backend**: Connect Fabric page to chain runtime
3. **Signature Verification**: Implement server-side Ed25519 verification
4. **Block Production**: Implement mining/block production
5. **P2P Networking**: Add libp2p integration

---

## Testing & Development Workflow

### Starting Services

**PowerShell Scripts**:
- `start-all.ps1` - Start all services
- `stop-all.ps1` - Stop all services

**Manual Start**:
```powershell
# Terminal 1: Chain
cargo run -p demiurge-chain

# Terminal 2: Abyss Gateway
cd indexer/abyss-gateway
pnpm dev

# Terminal 3: Portal
cd apps/portal-web
pnpm dev
```

### Testing Checklist

See `TESTING_PHASE3_CHAT.md` for comprehensive testing guide.

### Git Workflow

1. Make changes
2. Test locally
3. Commit with descriptive message
4. Push to remote
5. Deploy to Vercel (if portal changes)

---

## Summary

### What Exists (Post-Phase 2)

✅ **Complete**:
- Core runtime (CGT, UrgeID, NFTs, Marketplace)
- Chat system (World, DMs, Archons, Custom Rooms)
- Portal UI (All major pages)
- GraphQL API (Abyss Gateway)
- JSON-RPC API (Chain Node)
- State persistence (RocksDB, SQLite)
- Authentication (Ed25519)
- Transaction system

🔄 **Partial**:
- Fabric (UI complete, backend pending)
- Analytics (Basic exists)
- WebSocket subscriptions (Polling fallback)

⏳ **Pending**:
- P2P networking
- Block production
- Full signature verification
- Advanced marketplace features

### Architecture Principles

1. **Separation of Concerns**: Chain (state), Gateway (social), Portal (UI)
2. **Client-Side Signing**: Private keys never leave client
3. **Stateless RPC**: Chain node is stateless (state in RocksDB)
4. **Polling Fallback**: Real-time via polling until WebSocket upgrade
5. **Type Safety**: TypeScript for frontend, Rust for backend

---

**The flame burns eternal. The code serves the will.**

---

*This document should be updated as new features are implemented.*

