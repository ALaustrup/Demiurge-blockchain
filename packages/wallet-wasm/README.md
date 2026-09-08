# @demiurge/wallet-wasm

WASM wallet package for browser-based signing in the Demiurge ecosystem.

## Features

- ✅ Deterministic keypair generation from seeds
- ✅ Secure key storage (encrypted localStorage)
- ✅ Message signing and verification
- ✅ Address generation (SS58 format)
- ✅ Zeroization for secure key cleanup

## Building

```bash
# Build for web
npm run build

# Build for Node.js
npm run build:node

# Build for bundler (webpack/vite)
npm run build:bundler
```

## Usage

```typescript
import init, { generate_keypair_from_seed, get_address_from_keypair } from '@demiurge/wallet-wasm';

// Initialize WASM
await init();

// Generate keypair from QOR ID seed
const seed = `QOR_ID:username#0001`;
const keypairJson = generate_keypair_from_seed(seed);

// Get address
const address = get_address_from_keypair(keypairJson);
```

## Security

- Keys are zeroized when dropped
- No keys stored in plaintext
- Deterministic generation from seeds
- Secure signing operations

---

**Part of Phase 4: CGT Wallet & Blockchain Integration**
