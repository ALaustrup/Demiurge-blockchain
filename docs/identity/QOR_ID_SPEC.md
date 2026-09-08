# 🔐 QOR ID SPECIFICATION

> *"One identity, infinite emanations."*

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Architecture](#architecture)
4. [Authentication Flow](#authentication-flow)
5. [ZK-Proof Integration](#zk-proof-integration)
6. [Session Management](#session-management)
7. [API Specification](#api-specification)
8. [On-Chain Integration](#on-chain-integration)

---

## Overview

**Qor ID** is the singular, non-dual identity system for the Demiurge ecosystem. It provides a unified authentication layer comparable to Battle.Net's account system, enabling:

- Single sign-on across all Demiurge applications
- Ownership of CGT tokens and NFT assets
- Governance participation
- Cross-platform identity verification

### Identity Model

```
┌─────────────────────────────────────────────────────────────┐
│                        QOR ID                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Unique Identifier: qor:alaustrup#1337                  ││
│  │  Display Name: Alaustrup                                ││
│  │  Discriminator: #1337                                   ││
│  └─────────────────────────────────────────────────────────┘│
│                            │                                 │
│         ┌──────────────────┼──────────────────┐             │
│         ▼                  ▼                  ▼             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │  CGT Wallet │   │ Game Profile│   │ Governance  │       │
│  │  (On-Chain) │   │  (Off-Chain)│   │   (Hybrid)  │       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## Design Principles

### 1. Non-Dual Identity

A user has **one** Qor ID that unifies all interactions:
- No separate accounts per game/service
- Single credential set
- Unified profile and reputation

### 2. Self-Sovereign with Custodial Option

| Mode | Description | Target User |
|------|-------------|-------------|
| **Self-Sovereign** | User controls private keys | Crypto-native users |
| **Custodial** | Demiurge manages keys | Mainstream users |
| **Hybrid** | Social recovery + hardware wallet | Advanced users |

### 3. Privacy by Default

- ZK-proofs for age/region verification without revealing data
- Selective disclosure of profile attributes
- No cross-service tracking without consent

### 4. Battle.Net Inspiration

Borrowed patterns from Blizzard's system:
- `Username#Discriminator` format
- Friend codes and battle tags
- Unified launcher integration

---

## Architecture

### Service Components

```
┌─────────────────────────────────────────────────────────────────┐
│                      QOR AUTH SERVICE                            │
│                    (Rust 2024 + Axum)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Auth API   │  │  Session Mgr │  │  ZK Verifier │          │
│  │  (REST/gRPC) │  │   (Redis)    │  │  (Groth16)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                      │
│                    ┌──────▼───────┐                             │
│                    │  PostgreSQL  │                             │
│                    │     18       │                             │
│                    └──────┬───────┘                             │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   Substrate    │
                    │ pallet-qor-id  │
                    └────────────────┘
```

### Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Backend** | Rust + Axum | 2024 Edition |
| **Database** | PostgreSQL | 18 |
| **Cache/Sessions** | Redis | 7.4+ |
| **ZK Proofs** | Groth16 (snarkjs compatible) | - |
| **Blockchain** | Substrate Pallet | Latest |
| **API** | REST + gRPC + WebSocket | - |

---

## Authentication Flow

### Registration Flow

```
┌──────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│  Client  │     │  Auth API │     │ PostgreSQL│     │ Substrate │
└────┬─────┘     └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
     │                 │                 │                 │
     │ POST /register  │                 │                 │
     │ {email, pass,   │                 │                 │
     │  username}      │                 │                 │
     ├────────────────►│                 │                 │
     │                 │                 │                 │
     │                 │ Validate &      │                 │
     │                 │ Hash Password   │                 │
     │                 │ (Argon2id)      │                 │
     │                 │                 │                 │
     │                 │ Generate        │                 │
     │                 │ Discriminator   │                 │
     │                 │ (#XXXX)         │                 │
     │                 │                 │                 │
     │                 │ INSERT user     │                 │
     │                 ├────────────────►│                 │
     │                 │                 │                 │
     │                 │     OK          │                 │
     │                 │◄────────────────┤                 │
     │                 │                 │                 │
     │                 │ Register        │                 │
     │                 │ On-Chain ID     │                 │
     │                 ├─────────────────┼────────────────►│
     │                 │                 │                 │
     │                 │                 │   Extrinsic     │
     │                 │◄────────────────┼─────────────────┤
     │                 │                 │   Confirmed     │
     │                 │                 │                 │
     │ 201 Created     │                 │                 │
     │ {qor_id, token} │                 │                 │
     │◄────────────────┤                 │                 │
     │                 │                 │                 │
```

### Login Flow (Battle.Net Style)

```
┌──────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│  Client  │     │  Auth API │     │   Redis   │     │ PostgreSQL│
└────┬─────┘     └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
     │                 │                 │                 │
     │ POST /login     │                 │                 │
     │ {email, pass}   │                 │                 │
     ├────────────────►│                 │                 │
     │                 │                 │                 │
     │                 │ Fetch user      │                 │
     │                 ├─────────────────┼────────────────►│
     │                 │                 │                 │
     │                 │                 │     User data   │
     │                 │◄────────────────┼─────────────────┤
     │                 │                 │                 │
     │                 │ Verify password │                 │
     │                 │ (Argon2id)      │                 │
     │                 │                 │                 │
     │                 │ Generate JWT    │                 │
     │                 │ + Refresh Token │                 │
     │                 │                 │                 │
     │                 │ Store session   │                 │
     │                 ├────────────────►│                 │
     │                 │                 │                 │
     │                 │      OK         │                 │
     │                 │◄────────────────┤                 │
     │                 │                 │                 │
     │ 200 OK          │                 │                 │
     │ {access_token,  │                 │                 │
     │  refresh_token, │                 │                 │
     │  qor_id}        │                 │                 │
     │◄────────────────┤                 │                 │
     │                 │                 │                 │
```

---

## ZK-Proof Integration

### Use Cases

| Verification | Data Hidden | Proof |
|--------------|-------------|-------|
| Age ≥ 18 | Actual birthdate | Range proof |
| Region = EU | Exact country | Set membership |
| KYC Complete | Personal documents | Boolean |
| Reputation ≥ X | Full history | Range proof |

### ZK Circuit (Pseudocode)

```rust
// Age verification without revealing birthdate
circuit AgeVerification {
    // Private inputs (hidden)
    private birthdate: Date,
    private current_date: Date,
    
    // Public inputs (visible)
    public minimum_age: u8,
    public result_hash: Hash,
    
    // Constraint: age >= minimum_age
    fn verify() {
        let age = (current_date - birthdate).years();
        assert!(age >= minimum_age);
        
        // Hash commitment for audit
        assert!(hash(birthdate, nonce) == result_hash);
    }
}
```

### Verification Endpoint

```
POST /api/v1/zk/verify
Content-Type: application/json

{
    "proof_type": "age_verification",
    "proof": "<snarkjs_proof_hex>",
    "public_inputs": {
        "minimum_age": 18,
        "result_hash": "0x..."
    }
}
```

---

## Session Management

### Session Token Structure

```rust
#[derive(Serialize, Deserialize)]
pub struct QorSession {
    /// Unique session identifier
    pub session_id: Uuid,
    
    /// Qor ID reference
    pub qor_id: String,  // "username#1337"
    
    /// JWT access token (short-lived: 15 min)
    pub access_token: String,
    
    /// Refresh token (long-lived: 30 days)
    pub refresh_token: String,
    
    /// Device fingerprint
    pub device_id: String,
    
    /// IP address at creation
    pub created_ip: IpAddr,
    
    /// Session expiry
    pub expires_at: DateTime<Utc>,
    
    /// Scopes granted
    pub scopes: Vec<Scope>,
}

#[derive(Serialize, Deserialize)]
pub enum Scope {
    ProfileRead,
    ProfileWrite,
    WalletRead,
    WalletTransact,
    GameAccess,
    GovernanceVote,
}
```

### Redis Session Storage

```
KEY: session:{session_id}
TTL: 86400 (24 hours sliding)
VALUE: {
    "qor_id": "alaustrup#1337",
    "device_id": "xxx",
    "scopes": ["ProfileRead", "GameAccess"],
    "last_activity": "2026-01-12T12:00:00Z"
}

KEY: user_sessions:{qor_id}
TYPE: SET
VALUE: [session_id_1, session_id_2, ...]  # All active sessions
```

### Session Limits (Battle.Net Style)

| Limit | Value |
|-------|-------|
| Max concurrent sessions | 10 |
| Session idle timeout | 24 hours |
| Refresh token lifetime | 30 days |
| Access token lifetime | 15 minutes |

---

## API Specification

### Base URL

```
Production: https://auth.demiurge.io/api/v1
Development: http://localhost:3000/api/v1
```

### Endpoints

#### Registration

```http
POST /register
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "SecureP@ssw0rd!",
    "username": "Alaustrup",
    "region": "EU"
}

Response 201:
{
    "qor_id": "alaustrup#1337",
    "email_verified": false,
    "created_at": "2026-01-12T12:00:00Z"
}
```

#### Login

```http
POST /login
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "SecureP@ssw0rd!",
    "device_id": "optional-device-fingerprint"
}

Response 200:
{
    "access_token": "eyJ...",
    "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
    "expires_in": 900,
    "qor_id": "alaustrup#1337"
}
```

#### Token Refresh

```http
POST /refresh
Content-Type: application/json

{
    "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}

Response 200:
{
    "access_token": "eyJ...",
    "expires_in": 900
}
```

#### Profile

```http
GET /profile
Authorization: Bearer <access_token>

Response 200:
{
    "qor_id": "alaustrup#1337",
    "display_name": "Alaustrup",
    "avatar_url": "https://...",
    "created_at": "2026-01-12T12:00:00Z",
    "on_chain": {
        "address": "5GrwvaEF...",
        "cgt_balance": "1000.00000000"
    }
}
```

---

## On-Chain Integration

### Substrate Pallet Interface

```rust
// pallet-qor-identity
pub trait Config: frame_system::Config {
    type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
    type Currency: Currency<Self::AccountId>;
}

#[pallet::storage]
pub type Identities<T: Config> = StorageMap<
    _,
    Blake2_128Concat,
    QorId,          // "username#1337"
    IdentityInfo<T::AccountId>,
    OptionQuery,
>;

#[pallet::call]
impl<T: Config> Pallet<T> {
    /// Register a new Qor ID linked to an on-chain account
    #[pallet::weight(10_000)]
    pub fn register(
        origin: OriginFor<T>,
        qor_id: QorId,
        proof: ZkProof,  // Proves ownership of off-chain account
    ) -> DispatchResult {
        let who = ensure_signed(origin)?;
        // Verify ZK proof
        // Store mapping
        Ok(())
    }
    
    /// Link additional wallet to existing Qor ID
    #[pallet::weight(10_000)]
    pub fn link_wallet(
        origin: OriginFor<T>,
        qor_id: QorId,
        new_wallet: T::AccountId,
        proof: ZkProof,
    ) -> DispatchResult {
        // ...
        Ok(())
    }
}
```

---

## Security Considerations

### Password Requirements

- Minimum 12 characters
- At least one uppercase, lowercase, number, special character
- Not in common password lists
- Hashed with Argon2id (memory: 64MB, iterations: 3, parallelism: 4)

### Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/register` | 3/hour per IP |
| `/login` | 5/minute per IP |
| `/refresh` | 60/hour per user |
| ZK verification | 10/minute per user |

### Audit Logging

All authentication events logged to immutable audit trail:
- Login attempts (success/failure)
- Session creation/destruction
- Profile changes
- Wallet linking

---

*Last Updated: January 12, 2026*  
*Document Version: 1.0*  
*Maintainer: Alaustrup*
