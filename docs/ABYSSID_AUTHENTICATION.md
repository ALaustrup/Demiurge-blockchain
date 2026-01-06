# AbyssID Authentication System

**Last Updated**: January 5, 2026

## Overview

AbyssID is the authentication system used in AbyssOS and the Fracture Portal. It provides username-based authentication with seed phrase recovery, enabling users to securely access their accounts across devices.

## Key Features

- **Username-based authentication** - Users log in with a unique username
- **Seed phrase recovery** - Deterministic key derivation from seed phrases
- **Ed25519 keypairs** - Secure cryptographic keys derived from seed phrases
- **Account recovery** - Users can recover accounts using their saved seed phrase
- **Case-insensitive usernames** - Usernames are normalized (lowercase) for consistency
- **Public key verification** - Login verification via public key matching

## Architecture

### Components

1. **AbyssID Backend** (`apps/abyssid-backend/`)
   - Node.js/Express server
   - SQLite3 database
   - REST API endpoints
   - Username availability checking
   - Identity registration
   - Public key storage

2. **AbyssID Service** (`apps/abyssid-service/`)
   - TypeScript service layer
   - Key derivation utilities
   - Wallet integration
   - Chain signing support

3. **Frontend Integration** (`apps/portal-web/`, `apps/abyssos-portal/`)
   - Login/signup UI components
   - Seed phrase generation
   - Key derivation (client-side)
   - State management

### Database Schema

```sql
CREATE TABLE abyssid_identities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL COLLATE NOCASE,
  public_key TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen INTEGER
)
```

**Key Points:**
- `username` has `COLLATE NOCASE` for case-insensitive comparisons
- `public_key` is stored as hex string (Ed25519 public key)
- `address` is the Demiurge chain address (32-byte hex)
- `created_at` and `last_seen` are Unix timestamps

## Authentication Flow

### Signup Flow

1. **Username Check**
   - User enters desired username
   - Frontend calls `GET /api/abyssid/check?username={username}`
   - Backend checks database for existing username (case-insensitive)
   - Returns `{ available: true/false }`

2. **Seed Phrase Generation**
   - If username is available, frontend generates random 8-word seed phrase
   - Uses word list from `generateKeys.ts`
   - Displays seed phrase to user with backup instructions

3. **Key Derivation**
   - Frontend derives Ed25519 keypair from seed phrase
   - Uses `deriveKeysFromSeed(seedPhrase)` function
   - Generates `publicKey` and `privateKey`

4. **Registration**
   - Frontend calls `POST /api/abyssid/register`
   - Sends: `{ username, publicKey, address }`
   - Backend stores identity in database
   - Returns success confirmation

5. **Account Backup**
   - User must save seed phrase securely
   - Seed phrase is never sent to server
   - Only public key is stored on backend

### Login Flow

1. **Username Entry**
   - User enters username
   - Frontend calls `GET /api/abyssid/check?username={username}`
   - If username exists, proceed to login

2. **Seed Phrase Entry**
   - User enters their saved seed phrase (8 words)
   - Frontend derives keypair from seed phrase
   - Gets `publicKey` from derivation

3. **Verification**
   - Frontend calls `GET /api/abyssid/:username`
   - Backend returns stored `publicKey` for username
   - Frontend compares derived `publicKey` with stored `publicKey`
   - If match, login succeeds
   - If mismatch, show error

4. **Session Management**
   - On successful login, frontend stores session
   - Uses localStorage or sessionStorage
   - Session includes username and derived keys

## API Endpoints

### Check Username Availability

**Endpoint**: `GET /api/abyssid/check`

**Query Parameters**:
- `username` (string, required) - Username to check

**Response**:
```json
{
  "available": true
}
```

**Example**:
```bash
curl "http://localhost:3001/api/abyssid/check?username=oracle"
```

### Register New Identity

**Endpoint**: `POST /api/abyssid/register`

**Request Body**:
```json
{
  "username": "oracle",
  "publicKey": "abc123...",
  "address": "0992f7f1...fc4c"
}
```

**Response**:
```json
{
  "success": true,
  "username": "oracle"
}
```

**Error Response**:
```json
{
  "error": "Username already taken"
}
```

### Get Identity by Username

**Endpoint**: `GET /api/abyssid/:username`

**Response**:
```json
{
  "username": "oracle",
  "address": "0992f7f1...fc4c",
  "publicKey": "abc123...",
  "createdAt": 1704067200
}
```

**Use Case**: Used during login to verify public key

### Debug Endpoints (Development Only)

**List All Identities**: `GET /api/abyssid/debug/list`

**Clear All Identities**: `POST /api/abyssid/debug/clear`

## Key Derivation

### Seed Phrase Format

- **Length**: 8 words
- **Word List**: Custom word list (abyss, void, dark, shadow, fracture, nexus, etc.)
- **Generation**: Random selection using `crypto.getRandomValues()` or `Math.random()` fallback

### Derivation Algorithm

```typescript
async function deriveKeysFromSeed(seedPhrase: string): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  // Normalize seed phrase (lowercase, trim)
  const normalized = seedPhrase.trim().toLowerCase();
  
  // Hash seed phrase using SHA-256
  const hash = await crypto.subtle.digest('SHA-256', 
    new TextEncoder().encode(normalized));
  
  // Use hash as seed for Ed25519 keypair
  // (Implementation uses WebCrypto API or fallback)
  
  return { publicKey, privateKey };
}
```

**Important**: The same seed phrase always produces the same keypair (deterministic).

## Security Considerations

### Seed Phrase Security

- **Never stored on server** - Only public key is stored
- **Client-side only** - Seed phrase never leaves user's device
- **Backup required** - Users must save seed phrase to recover account
- **Word list** - Custom word list for easier memorization

### Username Normalization

- **Case-insensitive** - "Oracle", "oracle", "ORACLE" are treated as same
- **Database collation** - `COLLATE NOCASE` ensures consistent comparisons
- **Frontend normalization** - Usernames are lowercased before API calls

### Public Key Verification

- **Login verification** - Derived public key must match stored public key
- **No password storage** - Only public keys stored (no passwords)
- **Cryptographic security** - Ed25519 provides strong security guarantees

## Integration with Demiurge Chain

### Address Derivation

The Demiurge chain address is derived from the Ed25519 public key:

```typescript
// Public key is 32 bytes (Ed25519)
// Address is the first 32 bytes of the public key
const address = publicKey.slice(0, 32);
```

### Chain Operations

Once logged in, users can:
- Sign transactions using their private key
- Send CGT transfers
- Mint NFTs (if Archon)
- Interact with all chain features

## Frontend Implementation

### React Components

**AbyssIDDialog** (`apps/portal-web/src/components/fracture/AbyssIDDialog.tsx`):
- Handles signup and login UI
- Manages state machine for authentication flow
- Displays seed phrase generation and entry

**AbyssStateMachine** (`apps/portal-web/src/components/fracture/AbyssStateMachine.tsx`):
- State machine for authentication flow
- States: `checking`, `accept`, `login`, `verifying`, `confirm`, `reject`
- Handles username checking, seed phrase generation, and verification

### State Management

```typescript
interface AbyssContext {
  username: string;
  seedPhrase: string;
  isExistingUser: boolean;
  // ... other state
}

// State transitions
"checking" -> "accept" (new user) or "login" (existing user)
"login" -> "verifying" -> "confirm" (success) or "login" (error)
```

## Best Practices

### For Users

1. **Save seed phrase immediately** - Write it down or use password manager
2. **Never share seed phrase** - Anyone with your seed phrase can access your account
3. **Use unique username** - Choose a username that's easy to remember
4. **Test recovery** - Verify you can log in with seed phrase before relying on it

### For Developers

1. **Always normalize usernames** - Use lowercase before API calls
2. **Handle errors gracefully** - Username conflicts, network errors, etc.
3. **Never log seed phrases** - Avoid logging sensitive data
4. **Use HTTPS in production** - Protect API communication
5. **Validate inputs** - Check username format, seed phrase length, etc.

## Troubleshooting

### "Username already in use" Error

- **Cause**: Username exists in database (case-insensitive)
- **Solution**: Try different username or use login flow if you own the username

### "Invalid seed phrase" Error

- **Cause**: Seed phrase doesn't match stored public key
- **Solution**: Verify seed phrase is correct (check for typos, extra spaces)

### "Public key mismatch" Error

- **Cause**: Derived public key doesn't match stored public key
- **Solution**: Ensure seed phrase is correct and derivation algorithm matches

## Future Enhancements

- [ ] Multi-device synchronization
- [ ] Hardware wallet integration
- [ ] Social recovery (trusted contacts)
- [ ] Biometric authentication
- [ ] Two-factor authentication
- [ ] Session management improvements
- [ ] Account migration tools

## Related Documentation

- [AbyssID Universal Auth](ABYSSID_UNIVERSAL_AUTH.md) - AbyssOS integration
- [RPC API](api/RPC.md) - Chain interaction
- [UrgeID Registry](overview/RUNTIME.md#2-urgeid-registry-module-urgeid_registry) - On-chain identity

---

*For technical implementation details, see the source code in `apps/abyssid-backend/` and `apps/portal-web/src/lib/fracture/crypto/`.*
