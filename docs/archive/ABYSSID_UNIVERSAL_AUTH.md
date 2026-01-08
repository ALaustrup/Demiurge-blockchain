# QOR ID Universal Authentication System

## Overview

QorID is now the **single source of truth** for user identity across all apps and services in QOR OS. When a user signs up or logs in with their QorID, their identity is automatically synchronized across the entire system, ensuring seamless access to:

- **QOR Wallet** - CGT balance, transactions, and wallet operations
- **On-Chain Assets** - DRC-369 NFTs, media files, and other assets
- **All Apps** - Every app automatically has access to the logged-in user's data
- **Real-Time Sync** - User data is automatically synchronized every 30 seconds

## Architecture

### Core Components

1. **QorIDIdentityService** (`services/identity/QorIDIdentityService.ts`)
   - Centralized service managing user identity
   - Automatically derives Demiurge public key from QorID
   - Syncs wallet balance and transactions
   - Manages on-chain assets
   - Provides real-time updates to all subscribers

2. **useQorIDIdentity Hook** (`hooks/useQorIDIdentity.ts`)
   - React hook for accessing user identity
   - Automatically initializes when user logs in
   - Provides `identity`, `username`, `publicKey`, `demiurgePublicKey`

3. **useQorIDUserData Hook** (`hooks/useQorIDIdentity.ts`)
   - React hook for accessing user data (balance, assets)
   - Automatically syncs in real-time
   - Provides `balance`, `assets`, `sync()` function

4. **WalletInitializer Component** (`components/WalletInitializer.tsx`)
   - Ensures wallet is automatically synced with QorID
   - Runs on app startup
   - No manual initialization needed

## How It Works

### Login Flow

1. User logs in via `QorIDLoginForm` or `QorIDSignupModal`
2. Login triggers `QorIDContext.login()` which calls the provider
3. `QorIDIdentityService.initialize()` is automatically called:
   - Derives Demiurge public key from QorID public key
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
import { useQorIDIdentity, useQorIDUserData } from '../hooks/useQorIDIdentity';

function MyApp() {
  const { identity, isAuthenticated, username, demiurgePublicKey } = useQorIDIdentity();
  const { balance, assets, sync } = useQorIDUserData();
  
  // All user data is automatically available!
  // No manual initialization needed
}
```

## Updated Apps

The following apps have been updated to use the unified system:

- ✅ **QOR Wallet** - Auto-populates balance and transactions
- ✅ **OnChainFilesApp** - Auto-loads user's DRC-369 assets
- ✅ **Login/Signup** - Automatically initializes identity service
- ✅ **WalletInitializer** - Ensures wallet sync on startup

## Benefits

1. **Single Source of Truth**: QorID is the master identity
2. **Automatic Sync**: No manual refresh needed
3. **Real-Time Updates**: All apps stay in sync
4. **Seamless UX**: User data appears automatically in all apps
5. **On-Chain Integration**: All on-chain actions are tied to QorID

## Migration Guide

### For App Developers

**Before:**
```typescript
const { session } = useQorID();
const { balance, refreshBalance } = useWalletStore();
// Manual initialization needed
```

**After:**
```typescript
const { identity, demiurgePublicKey } = useQorIDIdentity();
const { balance } = useQorIDUserData();
// Everything is automatic!
```

### Backward Compatibility

The system maintains backward compatibility with:
- `authStore` - Still updated for legacy code
- `walletStore` - Still used internally, but auto-synced
- `useQorID` - Still works, but apps should migrate to `useQorIDIdentity`

## Future Enhancements

- [ ] Asset sync in identity service
- [ ] Cross-app real-time notifications
- [ ] Offline support with sync on reconnect
- [ ] Multi-device synchronization

