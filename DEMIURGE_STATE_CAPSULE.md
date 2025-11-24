# Demiurge State Capsule (Post–Phase 3+)

**Use this block whenever you need to remind an LLM what Demiurge already is.**

---

## Demiurge Blockchain – Current Implementation Snapshot

### Core Chain (Rust)

- **PoW L1** using Argon2id + SHA-256 ("Forge")
- **RocksDB state**: balances, UrgeID profiles, NFTs, marketplace, etc.
- **JSON-RPC** at `http://127.0.0.1:8545/rpc` via Axum

**Runtime modules:**
- `bank_cgt`: Creator God Token (CGT) with metadata, max supply, u128 balances, total supply, dev faucet.
- `urgeid_registry`: UrgeID profiles, @usernames, Syzygy/leveling, badges, Archon flag, analytics.
- `nft_dgen`: D-GEN NFTs with metadata, fabric_root_hash, royalty_bps, ownership tracking.
- `fabric_manager`: Fabric asset registration + fee pools (P2P integration TODO).
- `abyss_registry`: NFT marketplace (listings, buys, cancels, royalties).

### RPC API (Chain)

**CGT**: `cgt_getBalance`, `cgt_getCgtMetadata`, `cgt_getTotalSupply`, `cgt_transfer`, `cgt_devFaucet`, etc.

**UrgeID**: `urgeid_getProfile`, `urgeid_setUsername`, `urgeid_resolveUsername`, `urgeid_getProgress`, `urgeid_getAnalytics`.

**NFTs**: `cgt_mintDgenNft`, `cgt_getNft`, `cgt_getNftsByOwner`, `cgt_transferNft`.

**Marketplace**: `abyss_getAllListings`, `abyss_getListing`, `abyss_createListing`, `abyss_cancelListing`, `abyss_buyListing`.

**Transactions**: signing + `cgt_sendRawTransaction`, tx history, nonces.

### Abyss Gateway (GraphQL, Node/TS)

- **GraphQL API** for chat & social on top of SQLite (`data/chat.db`).

**Features:**
- World chat, DMs, custom rooms, media entries, basic "music queue".
- **Queries**: `worldChatMessages`, `dmRooms`, `roomMessages`, `customRooms`, `activeUsers`.
- **Mutations**: `sendWorldMessage`, `sendDirectMessage`, `createRoom`, `joinRoom`, `leaveRoom`, `updateRoomSettings`, `uploadMedia`.
- **Subscriptions** currently implemented via polling, not WebSockets.
- **"Seven Archons"**: predefined NPC accounts (Ialdabaoth, Sabaoth, etc.) accessible via DMs.

### Portal Web (Next.js, Tailwind, Framer Motion)

**Pages:**
- `/` – Hero + cinematic intro, live chain status, pillars, roadmap (no Archon/Pantheon cruft).
- `/urgeid` – "My Void": UrgeID generation/login, dashboard, CGT balance, username claim, sending CGT, tx history, NFT gallery + test mint, vault export/import, QR code.
- `/chat` – Full chat UI with world chat, DMs, Seven Archons section, custom rooms, media sharing, music player, context menus, username display.
- `/marketplace` – Abyss NFT marketplace UI.
- `/fabric` – World gallery of on-chain-style assets (currently driven by mock data; backend TBD).
- `/analytics` – User analytics / activity.
- `/docs` – MDX docs: architecture, API, chat, analytics, Archons, etc.

**Styling**: dark synthwave/glassmorphism, animated navbar, responsive grid, custom Fabric header animation.

**Client libs:**
- `lib/rpc.ts`: JSON-RPC client for the chain.
- `lib/graphql.ts`: GraphQL client for Abyss Gateway (polling-based "subscriptions").
- `lib/signing.ts`, `lib/txBuilder.ts`, `lib/transactions.ts`: Ed25519 signing & local tx tracking.
- `lib/urgeid.ts`, `lib/vault.ts`, `lib/archons.ts`, `lib/aeonId.ts`: identity and vault utilities.

### Persistence

- **Chain**: RocksDB (canonical state).
- **Chat**: SQLite (`chat.db`).
- **Client**: localStorage (keys, mute lists, tx history, etc.).

### Known TODOs / Partial

- WebSocket-based real-time for chat (currently polling).
- Fabric backend: tie Fabric UI to `fabric_manager` runtime + P2P network.
- Full signature verification server-side in some flows.
- P2P networking & block production beyond minimal "Forge" scaffolding.
- Advanced marketplace features & deeper analytics.

---

**That's now the "this is reality, don't hallucinate a different architecture" block.**

