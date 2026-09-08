# @demiurge/qor-sdk

QOR Identity SDK for the Demiurge Protocol - Decentralized identity with human-readable handles.

## Installation

```bash
npm install @demiurge/qor-sdk
# or
yarn add @demiurge/qor-sdk
# or
pnpm add @demiurge/qor-sdk
```

## Features

- **QOR ID** - Human-readable identifiers (e.g., `alice#1234`)
- **Authentication** - Login, registration, password recovery
- **Profile Management** - Avatar, bio, display name
- **Leveling System** - XP and level progression
- **Asset Management** - On-chain asset queries

## Quick Start

```typescript
import { qorAuth, QorAuthClient } from '@demiurge/qor-sdk';

// Use the default singleton
const user = await qorAuth.login('alice#1234', 'password');
console.log('Logged in as:', user.qor_id);

// Or create a custom client
const client = new QorAuthClient('https://your-api.com/api/v1');
```

## API Reference

### Authentication

```typescript
import { qorAuth } from '@demiurge/qor-sdk';

// Register new user
const result = await qorAuth.register({
  username: 'alice',
  password: 'securePassword123',
  email: 'alice@example.com', // optional
});

// Login
const { user, token } = await qorAuth.login('alice#1234', 'password');

// Check authentication
if (qorAuth.isAuthenticated()) {
  const profile = await qorAuth.getProfile();
}

// Logout
await qorAuth.logout();
```

### Profile Management

```typescript
// Get current profile
const profile = await qorAuth.getProfile();

// Update profile
await qorAuth.updateProfile({
  display_name: 'Alice Wonderland',
  bio: 'Blockchain explorer',
});

// Upload avatar (mints as DRC-369 NFT)
const avatarUrl = await qorAuth.uploadAvatar(imageFile, 'alice#1234');
```

### Password Recovery

```typescript
// Request password reset
const result = await qorAuth.forgotPassword('alice#1234');

if (result.requires_backup_code) {
  // Username-only account - use backup code
  await qorAuth.resetPasswordWithBackup('alice', 'BACKUP-CODE', 'newPassword');
} else {
  // Email account - reset via email link
  await qorAuth.resetPasswordWithToken(emailToken, 'newPassword');
}
```

### Leveling System

```typescript
import { getLevelInfo, calculateXpForLevel } from '@demiurge/qor-sdk';

// Get level info from XP
const levelInfo = getLevelInfo(1500);
console.log(levelInfo.level); // Current level
console.log(levelInfo.xpToNextLevel); // XP needed for next level
console.log(levelInfo.progress); // Progress percentage (0-100)

// Calculate XP required for a specific level
const xpNeeded = calculateXpForLevel(10);
```

### Asset Management

```typescript
import { getAssets, type AssetInfo } from '@demiurge/qor-sdk';

// Get user's on-chain assets
const assets = await getAssets(userAddress);
```

## Types

```typescript
import type {
  User,
  QorId,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '@demiurge/qor-sdk';

interface User {
  id: string;
  qor_id: string;
  email: string;
  role: 'user' | 'moderator' | 'admin' | 'god';
  avatar_url?: string;
  display_name?: string;
  bio?: string;
  on_chain?: {
    address: string;
    cgt_balance?: string;
  };
}
```

## Configuration

### Environment Variables

```bash
NEXT_PUBLIC_QOR_AUTH_URL=https://demiurge.cloud/api/v1
```

### Custom API URL

```typescript
import { QorAuthClient } from '@demiurge/qor-sdk';

const client = new QorAuthClient('https://your-api.com/api/v1');
```

## Token Management

The SDK automatically manages JWT tokens:

```typescript
// Tokens are stored in localStorage
qorAuth.setToken(accessToken);
const token = qorAuth.getToken();
qorAuth.clearToken();

// Decode token data (without verification)
const data = qorAuth.getTokenData();
// { qor_id, user_id, role, exp }
```

## Related Packages

- [@demiurge/sdk](https://www.npmjs.com/package/@demiurge/sdk) - Core Protocol SDK
- [@demiurge/drc369-sdk](https://www.npmjs.com/package/@demiurge/drc369-sdk) - NFT SDK
- [@demiurge/agent-foundry](https://www.npmjs.com/package/@demiurge/agent-foundry) - AI Agent SDK

## License

MIT - Demiurge Protocol

## Links

- [Documentation](https://demiurge.cloud/docs)
- [GitHub](https://github.com/ALaustrup/Demiurge-Blockchain)
- [Website](https://demiurge.cloud)
