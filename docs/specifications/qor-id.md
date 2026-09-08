# QOR ID Specification

QOR ID is Demiurge's decentralized identity system.

---

## Overview

QOR ID provides:
- Human-readable identifiers (username#0001)
- Sovereign identity (user-controlled)
- Multi-device support
- Session key management

---

## Identity Format

```
username#discriminator

Examples:
- alice#0001
- game_master#7777
- demiurge_admin#0000
```

### Rules

| Component | Constraints |
|-----------|-------------|
| Username | 3-32 chars, alphanumeric + underscore |
| Discriminator | 4 digits (0000-9999) |
| Full ID | Globally unique |

---

## DID (Decentralized Identifier)

Each QOR ID maps to a DID:

```
did:demiurge:user:alice#0001

Structure:
did:demiurge:{type}:{identifier}

Types:
- user (human users)
- agent (AI agents)
- contract (smart contracts)
```

---

## Authentication Methods

### 1. Keypair Authentication

Direct Ed25519 keypair login (recommended for agents):

```typescript
import { Wallet, DemiurgeAuth } from '@demiurge/sdk';

// Generate keypair
const wallet = Wallet.generate();

// Authenticate
const auth = new DemiurgeAuth({ authUrl: 'https://demiurge.cloud/api/v1' });
const session = await auth.loginWithKeypair(wallet);
```

### 2. QOR ID Authentication

Human-readable login:

```typescript
// Register QOR ID
await auth.register({
  username: 'alice',
  password: 'secure_password'
});

// Login
const session = await auth.loginWithQorId({
  qorId: 'alice#0001',
  password: 'secure_password'
});
```

### 3. Hybrid Mode

Use either method based on context:

```typescript
// Check which auth method was used
if (session.authMethod === 'keypair') {
  // Direct blockchain access
} else {
  // QOR ID session
}
```

---

## Session Keys

Temporary authorization without exposing main keys:

```rust
pub struct SessionKey {
    /// Session public key
    pub session_key: [u8; 32],
    
    /// Primary account that authorized this key
    pub primary_account: [u8; 32],
    
    /// Expiration timestamp
    pub expires_at: u64,
    
    /// Authorized capabilities
    pub capabilities: Vec<Capability>,
}
```

### Creating Session Keys

```typescript
// Authorize a session key
const sessionKey = await client.authorizeSessionKey({
  primaryAccount: wallet.address,
  sessionPublicKey: sessionWallet.publicKey,
  duration: 3600, // 1 hour
  capabilities: ['transfer', 'nft_mint']
});

// Use session key for transactions
const result = await client.transfer({
  from: wallet.address,
  to: recipient,
  amount: 100,
  wallet: sessionWallet // Uses session key
});
```

### Revoking Session Keys

```typescript
await client.revokeSessionKey({
  primaryAccount: wallet.address,
  sessionPublicKey: sessionWallet.publicKey
});
```

---

## Profile Data

QOR IDs can store profile metadata:

```typescript
interface QorProfile {
  displayName: string;
  avatar: string;       // IPFS hash or URL
  bio: string;
  socialLinks: {
    twitter?: string;
    discord?: string;
    website?: string;
  };
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}
```

---

## RPC Methods

### Query Methods

| Method | Parameters | Returns |
|--------|------------|---------|
| `qorId_resolve` | qor_id | Address |
| `qorId_reverseResolve` | address | QOR ID |
| `qorId_getProfile` | qor_id | Profile data |
| `sessionKeys_getActiveKeys` | address | Active sessions |

### Write Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `qorId_register` | username, pubkey | Register identity |
| `qorId_updateProfile` | profile, sig | Update profile |
| `sessionKeys_authorize` | key, duration, sig | Create session |
| `sessionKeys_revoke` | key, sig | Remove session |

---

## Storage Layout

| Key | Value |
|-----|-------|
| `QorIdentity:Id:{username}#{disc}` | Account address |
| `QorIdentity:Reverse:{address}` | QOR ID string |
| `QorIdentity:Profile:{address}` | Profile JSON |
| `SessionKeys:Key:{primary}:{session}` | Session data |

---

## Security

### Key Management

- Primary keys stored client-side
- Session keys for day-to-day operations
- Hardware wallet support (planned)

### Recovery

- Mnemonic phrase backup
- Social recovery (planned)
- Multi-sig recovery (planned)

### Privacy

- Pseudonymous by default
- Optional profile disclosure
- No KYC required

---

## Agent Identity

AI agents have specialized DIDs:

```
did:demiurge:agent:trading_bot_001

Agent DID Structure:
did:demiurge:agent:{agent_name}
```

### Agent Capabilities

```rust
pub enum AgentCapability {
    Transfer { max_amount: u128 },
    NftMint,
    NftTransfer,
    StateUpdate,
    ContractCall { allowed_contracts: Vec<[u8; 32]> },
}
```

---

## SDK Usage

### TypeScript

```typescript
import { QorClient } from '@demiurge/qor-sdk';

const qor = new QorClient({
  apiUrl: 'https://demiurge.cloud/api/v1',
  rpcUrl: 'https://rpc.demiurge.cloud:9944'
});

// Register
await qor.register({
  username: 'alice',
  password: 'secure_password'
});

// Login
const session = await qor.login({
  qorId: 'alice#0001',
  password: 'secure_password'
});

// Get profile
const profile = await qor.getProfile('alice#0001');

// Resolve address
const address = await qor.resolve('alice#0001');
```

### React Hooks

```typescript
import { useQorId, useSession } from '@demiurge/qor-sdk/react';

function Profile() {
  const { session, login, logout } = useSession();
  const { profile, isLoading } = useQorId(session?.qorId);
  
  if (!session) {
    return <LoginForm onLogin={login} />;
  }
  
  return (
    <div>
      <h1>{profile?.displayName}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## Best Practices

1. **Use session keys** - Don't expose primary keys for routine operations
2. **Set expiration** - Session keys should have reasonable TTL
3. **Minimal capabilities** - Only grant necessary permissions
4. **Backup recovery phrase** - Store securely offline
5. **Verify addresses** - Always confirm before sending

---

## Further Reading

- [Authentication Guide](../getting-started/first-transaction.md)
- [Session Keys](../architecture/modules.md#session-keys)
- [Agent Identity](./agents.md)
