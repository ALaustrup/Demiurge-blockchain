# AbyssID Universal Authentication System

## Overview

AbyssID is now the **single source of truth** for user identity across all apps and services in AbyssOS. When a user signs up or logs in with their AbyssID, their identity is automatically synchronized across the entire system, ensuring seamless access to:

- **Abyss Wallet** - CGT balance, transactions, and wallet operations
- **On-Chain Assets** - DRC-369 NFTs, media files, and other assets
- **All Apps** - Every app automatically has access to the logged-in user's data
- **Real-Time Sync** - User data is automatically synchronized every 30 seconds

## Architecture

### Core Components

1. **AbyssIDIdentityService** (`services/identity/AbyssIDIdentityService.ts`)
   - Centralized service managing user identity
   - Automatically derives Demiurge public key from AbyssID
   - Syncs wallet balance and transactions
   - Manages on-chain assets
   - Provides real-time updates to all subscribers

2. **useAbyssIDIdentity Hook** (`hooks/useAbyssIDIdentity.ts`)
   - React hook for accessing user identity
   - Automatically initializes when user logs in
   - Provides `identity`, `username`, `publicKey`, `demiurgePublicKey`

3. **useAbyssIDUserData Hook** (`hooks/useAbyssIDIdentity.ts`)
   - React hook for accessing user data (balance, assets)
   - Automatically syncs in real-time
   - Provides `balance`, `assets`, `sync()` function

4. **WalletInitializer Component** (`components/WalletInitializer.tsx`)
   - Ensures wallet is automatically synced with AbyssID
   - Runs on app startup
   - No manual initialization needed

## How It Works

### Login Flow

1. User logs in via `AbyssIDLoginForm` or `AbyssIDSignupModal`
2. Login triggers `AbyssIDContext.login()` which calls the provider
3. `AbyssIDIdentityService.initialize()` is automatically called:
   - Derives Demiurge public key from AbyssID public key
   - Updates wallet store with derived key
   - Starts automatic synchronization (every 30 seconds)
   - Notifies all subscribers

### Automatic Synchronization

- **Balance**: Synced every 30 seconds automatically
- **Transactions**: Refreshed when new blocks are detected
- **Assets**: Loaded on-demand when apps request them
- **Real-Time Updates**: All apps using the hooks receive updates automatically

### App Integration

All apps should use the unified hooks:

```typescript
import { useAbyssIDIdentity, useAbyssIDUserData } from '../hooks/useAbyssIDIdentity';

function MyApp() {
  const { identity, isAuthenticated, username, demiurgePublicKey } = useAbyssIDIdentity();
  const { balance, assets, sync } = useAbyssIDUserData();
  
  // All user data is automatically available!
  // No manual initialization needed
}
```

## Updated Apps

The following apps have been updated to use the unified system:

- ✅ **Abyss Wallet** - Auto-populates balance and transactions
- ✅ **OnChainFilesApp** - Auto-loads user's DRC-369 assets
- ✅ **Login/Signup** - Automatically initializes identity service
- ✅ **WalletInitializer** - Ensures wallet sync on startup

## Benefits

1. **Single Source of Truth**: AbyssID is the master identity
2. **Automatic Sync**: No manual refresh needed
3. **Real-Time Updates**: All apps stay in sync
4. **Seamless UX**: User data appears automatically in all apps
5. **On-Chain Integration**: All on-chain actions are tied to AbyssID

## Migration Guide

### For App Developers

**Before:**
```typescript
const { session } = useAbyssID();
const { balance, refreshBalance } = useWalletStore();
// Manual initialization needed
```

**After:**
```typescript
const { identity, demiurgePublicKey } = useAbyssIDIdentity();
const { balance } = useAbyssIDUserData();
// Everything is automatic!
```

### Backward Compatibility

The system maintains backward compatibility with:
- `authStore` - Still updated for legacy code
- `walletStore` - Still used internally, but auto-synced
- `useAbyssID` - Still works, but apps should migrate to `useAbyssIDIdentity`

## Future Enhancements

- [ ] Asset sync in identity service
- [ ] Cross-app real-time notifications
- [ ] Offline support with sync on reconnect
- [ ] Multi-device synchronization

