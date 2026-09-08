# Demiurge Email: On-Chain Email System

## Overview

A hybrid email system where every QOR ID automatically receives a `username@demiurge.cloud` email address. The system combines blockchain identity verification with practical email delivery, offering an optional full decentralization mode for users who prioritize censorship-resistance.

**Key Principle**: The username is always the displayed identity across the entire ecosystem. `sophia#0001` = `sophia@demiurge.cloud` = displayed as "sophia" everywhere.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEMIURGE EMAIL SYSTEM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────────┐   │
│  │   External   │───▶│  SMTP Gate   │───▶│     Message Router           │   │
│  │   Senders    │    │  (Inbound)   │    │                              │   │
│  └──────────────┘    └──────────────┘    │  ┌────────────────────────┐  │   │
│                                          │  │  Standard Mode         │  │   │
│  ┌──────────────┐    ┌──────────────┐    │  │  - PostgreSQL storage  │  │   │
│  │   QOR ID     │───▶│  Hub Email   │───▶│  │  - Fast delivery       │  │   │
│  │   Users      │    │  Client      │    │  │  - Encrypted at rest   │  │   │
│  └──────────────┘    └──────────────┘    │  └────────────────────────┘  │   │
│                                          │                              │   │
│                                          │  ┌────────────────────────┐  │   │
│  ┌──────────────┐                        │  │  Decentralized Mode    │  │   │
│  │  Blockchain  │◀──────────────────────▶│  │  - IPFS content store  │  │   │
│  │  (Pallet)    │                        │  │  - On-chain metadata   │  │   │
│  └──────────────┘                        │  │  - Full E2E encryption │  │   │
│                                          │  └────────────────────────┘  │   │
│                                          └──────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Features

### 1. Automatic Email Address Assignment
- Every QOR ID automatically gets `username@demiurge.cloud`
- No separate registration needed
- Discriminator handled internally (sophia#0001 and sophia#0002 both show as "sophia" but have distinct mailboxes)

### 2. Display Name Consistency
- Username is the canonical display name everywhere
- Email "From" shows: `sophia <sophia@demiurge.cloud>`
- No confusing email-vs-username distinction

### 3. Storage Mode Toggle
Users can choose their storage preference in settings:

| Feature | Standard Mode | Decentralized Mode |
|---------|--------------|-------------------|
| Storage | PostgreSQL (encrypted) | IPFS + On-chain metadata |
| Speed | Instant | ~5-30 seconds |
| Cost | Free | Small CGT fee per message |
| Censorship Resistance | Server-dependent | Full |
| Message Permanence | Server retention policy | Immutable (optional) |
| External SMTP | Full support | Receive only* |

*Decentralized mode can receive from external SMTP but outbound goes through the standard gateway

### 4. End-to-End Encryption
- All messages encrypted with recipient's public key (from QOR ID)
- Optional: Sender can request read receipts (on-chain verification)
- Zero-knowledge: Server cannot read message contents in either mode

---

## Phase 1: Email Registry Pallet (Weeks 1-3)

### On-Chain Storage

```rust
// framework/modules/pallet-email/src/lib.rs

#[pallet::storage]
pub type EmailAccounts<T: Config> = StorageMap<
    _,
    Blake2_128Concat,
    T::AccountId,
    EmailAccountInfo<T>,
    OptionQuery,
>;

#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
pub struct EmailAccountInfo<T: Config> {
    /// QOR ID username (canonical display name)
    pub username: BoundedVec<u8, T::MaxUsernameLength>,
    /// Discriminator for uniqueness
    pub discriminator: u16,
    /// Email-specific public key for E2E encryption
    pub encryption_key: [u8; 32],
    /// Storage preference
    pub storage_mode: StorageMode,
    /// Auto-forward to external email (optional)
    pub forward_to: Option<BoundedVec<u8, T::MaxEmailLength>>,
    /// Account status
    pub status: EmailAccountStatus,
    /// Creation timestamp
    pub created_at: T::BlockNumber,
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
pub enum StorageMode {
    /// Fast, centralized storage (default)
    Standard,
    /// IPFS + on-chain metadata
    Decentralized,
    /// Hybrid: important messages on-chain, rest standard
    Hybrid { threshold_cgt: u128 },
}

#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
pub enum EmailAccountStatus {
    Active,
    Suspended,
    Forwarding,
}
```

### Extrinsics

```rust
#[pallet::call]
impl<T: Config> Pallet<T> {
    /// Initialize email for a QOR ID (called automatically on QOR ID creation)
    #[pallet::weight(10_000)]
    pub fn initialize_email(
        origin: OriginFor<T>,
        encryption_key: [u8; 32],
    ) -> DispatchResult {
        let who = ensure_signed(origin)?;
        // Verify QOR ID exists, create email account
        Self::do_initialize_email(who, encryption_key)
    }

    /// Update storage mode preference
    #[pallet::weight(5_000)]
    pub fn set_storage_mode(
        origin: OriginFor<T>,
        mode: StorageMode,
    ) -> DispatchResult {
        let who = ensure_signed(origin)?;
        Self::do_set_storage_mode(who, mode)
    }

    /// Set forwarding address (for external email delivery)
    #[pallet::weight(5_000)]
    pub fn set_forwarding(
        origin: OriginFor<T>,
        forward_to: Option<BoundedVec<u8, T::MaxEmailLength>>,
    ) -> DispatchResult {
        let who = ensure_signed(origin)?;
        Self::do_set_forwarding(who, forward_to)
    }

    /// Store decentralized message reference (for Decentralized mode)
    #[pallet::weight(15_000)]
    pub fn store_message_reference(
        origin: OriginFor<T>,
        recipient: T::AccountId,
        ipfs_cid: BoundedVec<u8, T::MaxCidLength>,
        encrypted_subject_hash: [u8; 32],
        size_bytes: u32,
    ) -> DispatchResult {
        let who = ensure_signed(origin)?;
        // Charge fee based on size
        Self::do_store_message_reference(who, recipient, ipfs_cid, encrypted_subject_hash, size_bytes)
    }
}
```

### Events

```rust
#[pallet::event]
pub enum Event<T: Config> {
    /// Email account initialized
    EmailInitialized { account: T::AccountId, username: Vec<u8> },
    /// Storage mode changed
    StorageModeChanged { account: T::AccountId, mode: StorageMode },
    /// New decentralized message stored
    MessageStored { 
        from: T::AccountId, 
        to: T::AccountId, 
        cid: Vec<u8>,
        timestamp: T::BlockNumber,
    },
    /// Message read (for read receipts)
    MessageRead { message_id: [u8; 32], reader: T::AccountId },
}
```

---

## Phase 2: SMTP Gateway Service (Weeks 3-6)

### Rust SMTP Server

```rust
// services/demiurge-mail/src/main.rs

use mailin_embedded::{Server, SslConfig, Handler, Response};
use lettre::{AsyncSmtpTransport, Message, Tokio1Executor};

pub struct DemiurgeMailHandler {
    db: PgPool,
    blockchain_client: DemiurgeRpcClient,
    ipfs_client: IpfsClient,
    encryption_service: EncryptionService,
}

#[async_trait]
impl Handler for DemiurgeMailHandler {
    async fn data(
        &mut self,
        from: &str,
        to: Vec<&str>,
        data: &[u8],
    ) -> Response {
        // Parse email
        let email = match mailparse::parse_mail(data) {
            Ok(e) => e,
            Err(_) => return Response::InvalidData,
        };

        for recipient in to {
            // Extract username from email address
            let username = match self.extract_username(recipient) {
                Some(u) => u,
                None => continue,
            };

            // Look up QOR ID and preferences
            let account = match self.lookup_qor_id(&username).await {
                Some(a) => a,
                None => {
                    // Bounce: user doesn't exist
                    self.send_bounce(from, recipient, "User not found").await;
                    continue;
                }
            };

            // Encrypt message with recipient's public key
            let encrypted_content = self.encryption_service
                .encrypt(&email, &account.encryption_key)
                .await?;

            // Route based on storage mode
            match account.storage_mode {
                StorageMode::Standard => {
                    self.store_standard(&account, from, encrypted_content).await?;
                }
                StorageMode::Decentralized => {
                    self.store_decentralized(&account, from, encrypted_content).await?;
                }
                StorageMode::Hybrid { threshold_cgt } => {
                    // Check sender's reputation/stake
                    if self.sender_meets_threshold(from, threshold_cgt).await {
                        self.store_decentralized(&account, from, encrypted_content).await?;
                    } else {
                        self.store_standard(&account, from, encrypted_content).await?;
                    }
                }
            }

            // Handle forwarding if enabled
            if let Some(forward_to) = &account.forward_to {
                self.forward_email(forward_to, &email).await?;
            }
        }

        Response::Ok
    }
}

impl DemiurgeMailHandler {
    /// Store in PostgreSQL (Standard mode)
    async fn store_standard(
        &self,
        account: &EmailAccount,
        from: &str,
        encrypted: EncryptedEmail,
    ) -> Result<()> {
        sqlx::query!(
            r#"
            INSERT INTO emails (
                recipient_id, sender, subject_encrypted, body_encrypted,
                received_at, read, starred, folder
            ) VALUES ($1, $2, $3, $4, NOW(), false, false, 'inbox')
            "#,
            account.id,
            from,
            encrypted.subject,
            encrypted.body,
        )
        .execute(&self.db)
        .await?;
        
        // Push notification via WebSocket
        self.notify_new_email(account).await;
        
        Ok(())
    }

    /// Store on IPFS + on-chain reference (Decentralized mode)
    async fn store_decentralized(
        &self,
        account: &EmailAccount,
        from: &str,
        encrypted: EncryptedEmail,
    ) -> Result<()> {
        // Upload to IPFS
        let cid = self.ipfs_client
            .add(encrypted.to_bytes())
            .await?;

        // Store reference on-chain
        self.blockchain_client
            .store_message_reference(
                account.account_id.clone(),
                cid.clone(),
                encrypted.subject_hash,
                encrypted.size_bytes,
            )
            .await?;

        // Also cache locally for faster retrieval
        self.cache_decentralized_email(account, &cid, &encrypted).await?;

        Ok(())
    }
}
```

### Outbound SMTP

```rust
// services/demiurge-mail/src/outbound.rs

pub struct OutboundMailService {
    smtp_relay: AsyncSmtpTransport<Tokio1Executor>,
    dkim_signer: DkimSigner,
    blockchain_client: DemiurgeRpcClient,
}

impl OutboundMailService {
    /// Send email from a QOR ID user
    pub async fn send_email(
        &self,
        sender: &QorId,
        to: &str,
        subject: &str,
        body: &str,
        attachments: Vec<Attachment>,
    ) -> Result<MessageId> {
        // Verify sender owns this QOR ID (signature check)
        self.verify_sender_ownership(sender).await?;

        // Build email with proper From header
        let from_address = format!(
            "{} <{}@demiurge.cloud>",
            sender.username,
            sender.username
        );

        let mut email_builder = Message::builder()
            .from(from_address.parse()?)
            .to(to.parse()?)
            .subject(subject);

        // Add DKIM signature for deliverability
        let email = email_builder
            .body(body.to_string())?;

        let signed_email = self.dkim_signer.sign(email)?;

        // Send via SMTP relay
        self.smtp_relay.send(signed_email).await?;

        // If recipient is also on demiurge.cloud, store internally
        if to.ends_with("@demiurge.cloud") {
            self.deliver_internal(sender, to, subject, body).await?;
        }

        Ok(MessageId::new())
    }
}
```

---

## Phase 3: Hub Email Client (Weeks 6-9)

### Email API Endpoints

```typescript
// apps/hub/src/app/api/email/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyQorIdSession } from '@/lib/auth';
import { emailService } from '@/lib/email-service';

// GET /api/email - List emails
export async function GET(request: NextRequest) {
  const session = await verifyQorIdSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const folder = searchParams.get('folder') || 'inbox';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  const emails = await emailService.listEmails(session.userId, {
    folder,
    page,
    limit,
    includeDecentralized: true, // Fetch from IPFS if needed
  });

  return NextResponse.json(emails);
}

// POST /api/email - Send email
export async function POST(request: NextRequest) {
  const session = await verifyQorIdSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { to, subject, content, attachments } = body;

  const result = await emailService.sendEmail(session.userId, {
    to,
    subject,
    content,
    attachments,
  });

  return NextResponse.json(result);
}

// PATCH /api/email/:id - Update email (read, starred, folder)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await verifyQorIdSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  
  await emailService.updateEmail(session.userId, params.id, body);

  return NextResponse.json({ success: true });
}
```

### Email Settings Component

```tsx
// apps/hub/src/components/email/EmailSettings.tsx

'use client';

import { useState, useEffect } from 'react';
import { useQorId } from '@/hooks/useQorId';
import { Switch } from '@/components/ui/Switch';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type StorageMode = 'standard' | 'decentralized' | 'hybrid';

export function EmailSettings() {
  const { qorId, updateEmailSettings } = useQorId();
  const [storageMode, setStorageMode] = useState<StorageMode>('standard');
  const [forwardingEmail, setForwardingEmail] = useState('');
  const [forwardingEnabled, setForwardingEnabled] = useState(false);
  const [hybridThreshold, setHybridThreshold] = useState(100);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (qorId?.emailSettings) {
      setStorageMode(qorId.emailSettings.storageMode);
      setForwardingEmail(qorId.emailSettings.forwardTo || '');
      setForwardingEnabled(!!qorId.emailSettings.forwardTo);
      setHybridThreshold(qorId.emailSettings.hybridThreshold || 100);
    }
  }, [qorId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateEmailSettings({
        storageMode,
        forwardTo: forwardingEnabled ? forwardingEmail : null,
        hybridThreshold: storageMode === 'hybrid' ? hybridThreshold : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-dark-800 border-dark-600">
        <h3 className="text-xl font-bold text-white mb-4">
          Email Address
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-dark-700 rounded-lg px-4 py-3 font-mono text-neon-cyan">
            {qorId?.username}@demiurge.cloud
          </div>
          <Button variant="outline" onClick={() => navigator.clipboard.writeText(`${qorId?.username}@demiurge.cloud`)}>
            Copy
          </Button>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          This is your permanent email address linked to your QOR ID.
        </p>
      </Card>

      <Card className="p-6 bg-dark-800 border-dark-600">
        <h3 className="text-xl font-bold text-white mb-4">
          Storage Mode
        </h3>
        
        <div className="space-y-4">
          <label className="flex items-start gap-4 p-4 rounded-lg border border-dark-600 cursor-pointer hover:border-neon-cyan/50 transition-colors">
            <input
              type="radio"
              name="storageMode"
              value="standard"
              checked={storageMode === 'standard'}
              onChange={() => setStorageMode('standard')}
              className="mt-1"
            />
            <div>
              <div className="font-semibold text-white">Standard Mode</div>
              <div className="text-sm text-gray-400">
                Fast, encrypted storage on Demiurge servers. Best for everyday use.
                Free, instant delivery.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-4 p-4 rounded-lg border border-dark-600 cursor-pointer hover:border-neon-purple/50 transition-colors">
            <input
              type="radio"
              name="storageMode"
              value="decentralized"
              checked={storageMode === 'decentralized'}
              onChange={() => setStorageMode('decentralized')}
              className="mt-1"
            />
            <div>
              <div className="font-semibold text-white flex items-center gap-2">
                Decentralized Mode
                <span className="text-xs px-2 py-0.5 rounded bg-neon-purple/20 text-neon-purple">
                  Premium
                </span>
              </div>
              <div className="text-sm text-gray-400">
                Messages stored on IPFS with on-chain metadata. Fully censorship-resistant
                and immutable. Small CGT fee per message received.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-4 p-4 rounded-lg border border-dark-600 cursor-pointer hover:border-neon-green/50 transition-colors">
            <input
              type="radio"
              name="storageMode"
              value="hybrid"
              checked={storageMode === 'hybrid'}
              onChange={() => setStorageMode('hybrid')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-semibold text-white">Hybrid Mode</div>
              <div className="text-sm text-gray-400 mb-3">
                Important messages (from verified senders with stake) go on-chain,
                rest use standard storage.
              </div>
              {storageMode === 'hybrid' && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">Threshold:</span>
                  <Input
                    type="number"
                    value={hybridThreshold}
                    onChange={(e) => setHybridThreshold(parseInt(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-400">CGT stake</span>
                </div>
              )}
            </div>
          </label>
        </div>
      </Card>

      <Card className="p-6 bg-dark-800 border-dark-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">
            Email Forwarding
          </h3>
          <Switch
            checked={forwardingEnabled}
            onCheckedChange={setForwardingEnabled}
          />
        </div>
        
        {forwardingEnabled && (
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="your-email@example.com"
              value={forwardingEmail}
              onChange={(e) => setForwardingEmail(e.target.value)}
            />
            <p className="text-sm text-gray-400">
              A copy of all incoming emails will be forwarded to this address.
            </p>
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
```

### Email Inbox Component

```tsx
// apps/hub/src/components/email/EmailInbox.tsx

'use client';

import { useState } from 'react';
import { useEmails } from '@/hooks/useEmails';
import { EmailComposer } from './EmailComposer';
import { EmailViewer } from './EmailViewer';
import { formatDistanceToNow } from 'date-fns';

export function EmailInbox() {
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [folder, setFolder] = useState('inbox');
  
  const { emails, loading, markAsRead, refresh } = useEmails({ folder });

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r border-dark-600 p-4">
        <button
          onClick={() => setComposing(true)}
          className="w-full py-3 px-4 bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-bold rounded-lg mb-6 hover:opacity-90 transition-opacity"
        >
          Compose
        </button>

        <nav className="space-y-1">
          {['inbox', 'sent', 'starred', 'drafts', 'trash'].map((f) => (
            <button
              key={f}
              onClick={() => setFolder(f)}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                folder === f
                  ? 'bg-dark-700 text-white'
                  : 'text-gray-400 hover:bg-dark-800'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </nav>

        <div className="mt-8 p-4 rounded-lg bg-dark-800">
          <div className="text-sm text-gray-400 mb-2">Storage Mode</div>
          <div className="text-neon-cyan font-semibold">Standard</div>
        </div>
      </div>

      {/* Email List */}
      <div className="w-96 border-r border-dark-600 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-400">Loading...</div>
        ) : emails.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="text-4xl mb-4">📭</div>
            <div>No emails in {folder}</div>
          </div>
        ) : (
          emails.map((email) => (
            <button
              key={email.id}
              onClick={() => {
                setSelectedEmail(email.id);
                if (!email.read) markAsRead(email.id);
              }}
              className={`w-full text-left p-4 border-b border-dark-700 hover:bg-dark-800 transition-colors ${
                selectedEmail === email.id ? 'bg-dark-800' : ''
              } ${!email.read ? 'bg-dark-800/50' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-medium ${!email.read ? 'text-white' : 'text-gray-300'}`}>
                  {email.from.split('@')[0]}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true })}
                </span>
              </div>
              <div className={`text-sm ${!email.read ? 'text-gray-200' : 'text-gray-400'}`}>
                {email.subject}
              </div>
              <div className="text-xs text-gray-500 truncate mt-1">
                {email.preview}
              </div>
              {email.isDecentralized && (
                <div className="mt-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-neon-purple/20 text-neon-purple">
                    On-Chain
                  </span>
                </div>
              )}
            </button>
          ))
        )}
      </div>

      {/* Email Content / Composer */}
      <div className="flex-1 overflow-y-auto">
        {composing ? (
          <EmailComposer onClose={() => setComposing(false)} onSent={refresh} />
        ) : selectedEmail ? (
          <EmailViewer emailId={selectedEmail} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">✉️</div>
              <div>Select an email to read</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Phase 4: Decentralization Layer (Weeks 9-12)

### IPFS Integration

```rust
// services/demiurge-mail/src/storage/ipfs.rs

use ipfs_api_backend_hyper::{IpfsApi, IpfsClient};
use cid::Cid;

pub struct IpfsEmailStorage {
    client: IpfsClient,
    pinning_service: Option<PinataClient>, // For persistence
}

impl IpfsEmailStorage {
    pub async fn store_email(&self, encrypted_email: &EncryptedEmail) -> Result<Cid> {
        // Serialize to CBOR for efficient storage
        let data = serde_cbor::to_vec(encrypted_email)?;
        
        // Add to IPFS
        let response = self.client
            .add(Cursor::new(data))
            .await?;
        
        let cid = Cid::try_from(response.hash)?;
        
        // Pin for persistence (optional, user pays)
        if let Some(pinata) = &self.pinning_service {
            pinata.pin(&cid).await?;
        }
        
        Ok(cid)
    }

    pub async fn retrieve_email(&self, cid: &Cid) -> Result<EncryptedEmail> {
        let data = self.client
            .cat(&cid.to_string())
            .map_ok(|chunk| chunk.to_vec())
            .try_concat()
            .await?;
        
        let email: EncryptedEmail = serde_cbor::from_slice(&data)?;
        Ok(email)
    }
}
```

### On-Chain Message Index

```rust
// framework/modules/pallet-email/src/lib.rs (additional storage)

/// Index of all messages for a user (Decentralized mode)
#[pallet::storage]
pub type MessageIndex<T: Config> = StorageDoubleMap<
    _,
    Blake2_128Concat,
    T::AccountId,           // Recipient
    Blake2_128Concat,
    T::BlockNumber,         // Received at block
    MessageMetadata<T>,
    OptionQuery,
>;

#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
pub struct MessageMetadata<T: Config> {
    /// IPFS CID of encrypted message
    pub cid: BoundedVec<u8, ConstU32<64>>,
    /// Sender account (for filtering)
    pub sender: T::AccountId,
    /// Hash of encrypted subject (for search without decryption)
    pub subject_hash: [u8; 32],
    /// Message size in bytes
    pub size_bytes: u32,
    /// Read status (on-chain for verifiable read receipts)
    pub read: bool,
    /// Optional expiry block (for self-destructing messages)
    pub expires_at: Option<T::BlockNumber>,
}
```

---

## Phase 5: DNS & Deliverability (Week 12-13)

### Required DNS Records

```
; MX Records for receiving email
demiurge.cloud.     IN  MX  10 mail.demiurge.cloud.
demiurge.cloud.     IN  MX  20 mail2.demiurge.cloud.

; A Records for mail servers
mail.demiurge.cloud.  IN  A  127.0.0.1
mail2.demiurge.cloud. IN  A  <backup-server-ip>

; SPF - Authorize mail servers
demiurge.cloud.     IN  TXT "v=spf1 ip4:127.0.0.1 -all"

; DKIM - Email signing
dkim._domainkey.demiurge.cloud. IN TXT "v=DKIM1; k=rsa; p=<public-key>"

; DMARC - Policy enforcement
_dmarc.demiurge.cloud. IN TXT "v=DMARC1; p=reject; rua=mailto:dmarc@demiurge.cloud"
```

### SSL/TLS Configuration

```nginx
# SMTP with STARTTLS on port 587
# SMTPS on port 465
# IMAP with STARTTLS on port 143
# IMAPS on port 993

server {
    listen 993 ssl;
    ssl_certificate /etc/letsencrypt/live/mail.demiurge.cloud/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mail.demiurge.cloud/privkey.pem;
    
    # Proxy to Rust IMAP server
    proxy_pass 127.0.0.1:10993;
}
```

---

## Cost Model

### Standard Mode
- **Receiving**: Free
- **Sending**: Free (rate limited to prevent spam)
- **Storage**: 1GB included, 0.01 CGT per additional GB/month

### Decentralized Mode
- **Receiving**: 0.001 CGT per message (covers on-chain storage)
- **Sending**: 0.002 CGT per message (IPFS + on-chain)
- **Permanent storage**: 0.01 CGT per KB (one-time, immutable)
- **Pinning renewal**: 0.001 CGT per KB/year

### Hybrid Mode
- Standard rates for standard messages
- Decentralized rates for on-chain messages
- Threshold determines which path

---

## Security Considerations

### 1. End-to-End Encryption
- All messages encrypted with recipient's X25519 public key
- Key derived from QOR ID's ed25519 signing key
- Server never sees plaintext content

### 2. Sender Verification
- All outbound email DKIM-signed
- On-chain sender verification for internal messages
- SPF/DMARC to prevent spoofing

### 3. Spam Prevention
- Rate limiting per account
- CGT stake requirement for high-volume sending
- Reputation system based on on-chain history

### 4. Privacy
- Metadata minimization in decentralized mode
- Optional: Onion routing for IP privacy
- Zero-knowledge proofs for sender verification without revealing identity

---

## Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | 3 weeks | Email pallet, on-chain registry |
| Phase 2 | 3 weeks | SMTP gateway, inbound/outbound |
| Phase 3 | 3 weeks | Hub email client, API |
| Phase 4 | 3 weeks | IPFS integration, decentralized mode |
| Phase 5 | 1-2 weeks | DNS, deliverability, testing |
| **Total** | **13-14 weeks** | Full email system |

---

## Integration Points

### Automatic Email Setup
When a user creates a QOR ID, the email account is automatically initialized:

```rust
// In QOR ID registration flow
fn on_qor_id_created(account: AccountId, username: String) {
    // Generate encryption keypair
    let encryption_key = derive_email_key(&account);
    
    // Initialize email with default settings
    EmailPallet::initialize_email(
        account,
        encryption_key,
        StorageMode::Standard, // Default
    );
}
```

### Unified Notifications
Email notifications appear alongside other Hub notifications:

```typescript
// Unified notification system
const notifications = await Promise.all([
  fetchEmailNotifications(),
  fetchBlockchainNotifications(),
  fetchSocialNotifications(),
]);

// All display with username as identifier
// "sophia sent you an email"
// "sophia staked 100 CGT"
// "sophia liked your post"
```

---

## Future Enhancements

1. **Calendar Integration**: `calendar.sophia@demiurge.cloud` for scheduling
2. **Mailing Lists**: On-chain managed lists with token-gated access
3. **Encrypted Attachments**: Large files on IPFS with streaming decryption
4. **AI Assistant**: Sophia integration for email management
5. **Cross-Chain Mail**: Send to ENS, Unstoppable Domains, etc.

---

## Conclusion

The Demiurge Email system provides a seamless, blockchain-integrated email experience where:

- **Username is identity**: `sophia` everywhere - QOR ID, email, display name
- **User choice**: Standard for convenience, Decentralized for sovereignty
- **True ownership**: Your email, your keys, your data
- **Interoperability**: Full SMTP compatibility with the traditional email world

This positions Demiurge as a complete digital identity platform, not just a blockchain.
