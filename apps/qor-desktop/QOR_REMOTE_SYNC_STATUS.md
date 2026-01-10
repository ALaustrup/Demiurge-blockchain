# QOR Desktop - Remote Server Sync Status

## ✅ Implementation Complete

QOR Desktop now **syncs all accounts to the remote server database** at `51.210.209.112:8082`.

## 🔄 What Changed

### Before (Local Only)
- ❌ Accounts stored only in local `QSettings`
- ❌ No server synchronization
- ❌ Accounts not shared across devices
- ❌ No backup or recovery

### After (Remote + Local)
- ✅ Accounts registered to **remote SQLite database**
- ✅ HTTP POST to `/api/qorid/register`
- ✅ Username availability checking via server
- ✅ Authentication verified against server
- ✅ Local caching for offline access

## 📡 Server Integration

### QorID Service Backend
- **Server**: `51.210.209.112`
- **Port**: `8082`
- **Base URL**: `http://51.210.209.112:8082`
- **Database**: SQLite (`abyssid_users`, `abyssid_keys`, `user_storage`, `user_wallet_balances`)

### API Endpoints Used
```cpp
// Check username availability
GET http://51.210.209.112:8082/api/qorid/username-available?username={username}
Response: { "available": true/false }

// Register new account
POST http://51.210.209.112:8082/api/qorid/register
Body: { "username": "user", "publicKey": "0x..." }
Response: { "user": { "id": 1, "username": "user" }, "session": { ... } }
```

## 🔐 Security Model

### Key Derivation
```cpp
// Deterministic key derivation from username + password
seed = SHA256(username.toLowerCase() + ":" + password)
privateKey = seed
publicKey = SHA256(privateKey)
```

**Important**: Private keys are **never** sent to the server.

Only the **public key** is stored remotely.

### Storage Layers

1. **Remote Database** (Primary - Server)
   - Username
   - Public key
   - Address
   - Creation timestamp
   - Storage quota (500GB)
   - Wallet balance
   - Auto-minted 5000 CGT

2. **Local Keychain** (Cache - Desktop)
   - Username
   - Public key
   - Private key (encrypted)
   - For offline access

## 📊 Account Registration Flow

### Step-by-Step

1. **User enters username + password** in QOR Desktop login screen
2. **QorIDManager derives keypair** from credentials (SHA256)
3. **HTTP POST to server** with username + publicKey
4. **Server validates**:
   - Username not already taken
   - Public key format valid
5. **Server creates account**:
   - Inserts into `abyssid_users` table
   - Creates storage quota (500GB)
   - Initializes wallet balance
   - **Mints 5000 CGT on-chain** 🪙
6. **Server responds** with success
7. **QorIDManager stores** credentials locally
8. **Emits** `registrationSuccess()` signal
9. **UI updates** to logged-in state

## ✅ Verification

### How to Verify Accounts Are Being Saved

1. **Create account** in QOR Desktop
2. **SSH to server**:
   ```bash
   ssh root@51.210.209.112
   ```

3. **Check database**:
   ```bash
   cd /opt/qorid-service/data
   sqlite3 abyssid.sqlite "SELECT * FROM abyssid_users ORDER BY created_at DESC LIMIT 5;"
   ```

4. **Should see**:
   - Your username
   - Public key (hex string)
   - Creation timestamp

### Alternative: Check via API

```bash
curl "http://51.210.209.112:8082/api/qorid/username-available?username=YOUR_USERNAME"
```

If response is `{"available": false}`, account exists on server! ✅

## 🎯 Result

**QOR Desktop accounts are now:**
- ✅ Stored in remote database on `51.210.209.112`
- ✅ Accessible from any device
- ✅ Backed up on server
- ✅ Cached locally for offline use
- ✅ Auto-minted 5000 CGT on creation
- ✅ 500GB storage quota allocated

---

**Date**: January 10, 2026  
**Status**: ✅ REMOTE SYNC ENABLED
