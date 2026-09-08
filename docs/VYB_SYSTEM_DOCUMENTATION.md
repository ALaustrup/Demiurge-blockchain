# VYB Social Platform - Complete System Documentation

> **Version**: 1.1.0  
> **Platform**: Demiurge Blockchain Ecosystem  
> **Framework**: Next.js 14 (React 18)  
> **Language**: TypeScript  
> **State Management**: React Context API  

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Data Models](#3-data-models)
4. [Service Layer](#4-service-layer)
5. [React Context (State Management)](#5-react-context-state-management)
6. [Components Reference](#6-components-reference)
7. [Pages & Routing](#7-pages--routing)
8. [Blockchain Integration](#8-blockchain-integration)
9. [CGT Token Integration](#9-cgt-token-integration)
10. [NFT (DRC-369) Integration](#10-nft-drc-369-integration)
11. [Media System](#11-media-system)
12. [Integration Points](#12-integration-points)
13. [API Reference](#13-api-reference)
14. [File Structure](#14-file-structure)
15. [Sophia AI System](#15-sophia-ai-system)
16. [Phase 2 Web3 Native Roadmap](#16-phase-2-web3-native-roadmap)

---

> **Related Documentation:**
> - [Sophia AI & Phase 2 Architecture](./VYB_PHASE_2_WEB3_NATIVE_ARCHITECTURE.md) - Complete Web3 native upgrade roadmap

---

## 1. System Overview

### What is VYB?

VYB is an on-chain social networking platform built on the Demiurge blockchain. It combines traditional social media features with blockchain-native capabilities:

- **Creator Economy**: Users can earn CGT (Creator God Tokens) through content creation, tips, and engagement
- **NFT Integration**: Media uploads can be minted as DRC-369 NFTs directly from the platform
- **Decentralized Identity**: Users are identified by their QOR ID (Demiurge's identity system)
- **Service Marketplace**: Creators can offer services and get paid in CGT

### Core Principles

1. **On-Chain First**: All meaningful interactions can be recorded on the Demiurge blockchain
2. **Creator Ownership**: Users own their content and can monetize it
3. **Token Utility**: CGT has real utility for tipping, payments, and services
4. **Interoperability**: Designed to integrate with games, NFT marketplace, and other Demiurge apps

### Key Features

| Feature | Description |
|---------|-------------|
| Social Feed | Activity stream with posts, achievements, game scores, NFT mints |
| Messaging | Direct messages with CGT tipping support |
| Media Gallery | Upload and mint media as NFTs (3-month storage, permanent if minted) |
| Creator Profiles | MySpace-style customizable profiles with themes |
| Service Marketplace | Hire creators for art, music, development, design |
| Notifications | Real-time alerts for social interactions |

---

## 2. Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         VYB Frontend                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Pages     │  │ Components  │  │  Contexts   │              │
│  │  /social/*  │  │  vyb/*      │  │ VYBContext  │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│                   ┌──────▼──────┐                                │
│                   │ VYB Service │                                │
│                   │ (lib/vyb)   │                                │
│                   └──────┬──────┘                                │
└──────────────────────────┼──────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌───▼───┐ ┌─────▼─────┐
       │  Demiurge   │ │ QOR   │ │  Media    │
       │  RPC Node   │ │ Auth  │ │  Storage  │
       └─────────────┘ └───────┘ └───────────┘
```

### Data Flow

```
User Action → Component → Context → Service → Backend/Blockchain
     ↑                                              │
     └──────────── State Update ←──────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend Framework | Next.js 14 (App Router) |
| UI Library | React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS + Custom Glass Morphism |
| State Management | React Context API |
| Blockchain | Demiurge Custom Chain (Rust) |
| RPC Protocol | JSON-RPC 2.0 |
| Authentication | QOR Auth (JWT + Session Keys) |

---

## 3. Data Models

### 3.1 User Profile

```typescript
interface VYBProfile {
  qorId: string;              // Unique identifier (e.g., "artist#0042")
  walletAddress: string;      // Blockchain wallet address (32 bytes hex)
  displayName: string;        // User's display name
  bio: string;                // Profile biography
  avatar?: string;            // Avatar image URL
  coverImage?: string;        // Profile cover image URL
  role: UserRole;             // User's primary role
  badges: Badge[];            // Earned achievement badges
  stats: ProfileStats;        // Aggregated statistics
  theme: ProfileTheme;        // Profile customization settings
  createdAt: Date;            // Account creation timestamp
  lastActive: Date;           // Last activity timestamp
  isVerified: boolean;        // Verification status
  socialLinks: SocialLinks;   // External social media links
}

type UserRole = 
  | 'creator'     // General content creator
  | 'developer'   // Software developer
  | 'artist'      // Visual artist
  | 'musician'    // Music producer
  | 'designer'    // UI/UX or graphic designer
  | 'gamer'       // Gaming focused
  | 'collector'   // NFT collector
  | 'user';       // Default role

interface ProfileStats {
  followers: number;          // Number of followers
  following: number;          // Number following
  posts: number;              // Total posts created
  nftsOwned: number;          // NFTs in wallet
  nftsCreated: number;        // NFTs minted by user
  cgtEarned: number;          // Total CGT earned
  gamesPlayed: number;        // Games played count
  achievementsUnlocked: number; // Achievements earned
}

interface ProfileTheme {
  primaryColor: string;       // Hex color (e.g., "#00f5ff")
  secondaryColor: string;     // Hex color
  backgroundColor: string;    // Hex color
  fontStyle: 'modern' | 'retro' | 'grunge' | 'minimal';
  layoutStyle: 'classic' | 'grid' | 'timeline' | 'gallery';
  musicEnabled: boolean;      // Auto-play profile music
  profileSong?: string;       // Music URL
}

interface Badge {
  id: string;
  name: string;
  icon: string;               // Emoji or image URL
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
  earnedAt: Date;
  description: string;
}

interface SocialLinks {
  website?: string;
  twitter?: string;
  discord?: string;
  github?: string;
  youtube?: string;
  twitch?: string;
}
```

### 3.2 Activity Feed

```typescript
interface FeedItem {
  id: string;                 // Unique feed item ID
  type: FeedItemType;         // Type of activity
  author: FeedAuthor;         // Who created this
  content: FeedContent;       // The actual content
  timestamp: Date;            // When it was created
  likes: number;              // Like count
  comments: number;           // Comment count
  tips: number;               // Number of tips received
  tipsAmount: number;         // Total CGT tipped
  isLiked: boolean;           // Current user liked this
  isTipped: boolean;          // Current user tipped this
  visibility: 'public' | 'followers' | 'private';
  txHash?: string;            // Blockchain transaction hash (if on-chain)
}

type FeedItemType =
  | 'post'            // User-created post
  | 'achievement'     // Achievement unlocked
  | 'nft_mint'        // NFT minted
  | 'nft_purchase'    // NFT purchased
  | 'game_score'      // Game high score
  | 'level_up'        // Level up in a game
  | 'reward'          // CGT reward earned
  | 'follow'          // Started following someone
  | 'tip'             // Tipped someone
  | 'service_complete'; // Service order completed

interface FeedAuthor {
  qorId: string;
  displayName: string;
  avatar?: string;
  isVerified: boolean;
  role: UserRole;
}

interface FeedContent {
  text?: string;              // Post text content
  media?: MediaItem[];        // Attached media
  nft?: NFTPreview;           // NFT reference
  achievement?: AchievementPreview;
  game?: GamePreview;
  reward?: RewardPreview;
  mention?: string[];         // Mentioned QOR IDs
}

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;          // Seconds (for video/audio)
  isMinted: boolean;          // Is this an NFT?
  nftId?: string;             // NFT ID if minted
  expiresAt?: Date;           // When media expires (3 months)
}

interface NFTPreview {
  id: string;
  name: string;
  image: string;
  collection?: string;
  price?: number;             // CGT price
}

interface AchievementPreview {
  id: string;
  name: string;
  icon: string;
  tier: string;
  game?: string;
}

interface GamePreview {
  id: string;
  name: string;
  thumbnail: string;
  score?: number;
  leaderboardRank?: number;
}

interface RewardPreview {
  amount: number;             // CGT amount
  reason: string;
  source: 'game' | 'staking' | 'referral' | 'achievement' | 'tip';
}
```

### 3.3 Messaging

```typescript
interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ConversationParticipant {
  qorId: string;
  displayName: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

interface Message {
  id: string;
  conversationId: string;
  sender: string;             // QOR ID
  content: MessageContent;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  replyTo?: string;           // Message ID being replied to
  reactions: MessageReaction[];
}

interface MessageContent {
  text?: string;
  media?: MediaItem[];
  nft?: NFTPreview;           // Shared NFT
  tip?: {
    amount: number;           // CGT amount
    message?: string;
  };
  sharedPost?: string;        // Feed item ID
}

interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];            // QOR IDs who reacted
}
```

### 3.4 Media Gallery

```typescript
interface GalleryItem {
  id: string;
  ownerId: string;            // QOR ID
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  tags: string[];
  uploadedAt: Date;
  expiresAt: Date;            // 3 months from upload
  isMinted: boolean;
  nftId?: string;
  isPublic: boolean;
  views: number;
  likes: number;
}

interface MintRequest {
  mediaId: string;
  name: string;
  description: string;
  royaltyPercent: number;     // 0-50%
  isPublic: boolean;
  collection?: string;
}
```

### 3.5 Service Marketplace

```typescript
interface ServiceListing {
  id: string;
  creatorId: string;          // QOR ID
  creator: FeedAuthor;
  title: string;
  description: string;
  category: ServiceCategory;
  price: number;              // CGT price
  deliveryDays: number;
  rating: number;             // 0-5
  reviewCount: number;
  portfolio: MediaItem[];
  tags: string[];
  isActive: boolean;
}

type ServiceCategory =
  | 'game-design'
  | 'web-design'
  | 'graphics'
  | 'music'
  | 'art'
  | 'animation'
  | '3d-modeling'
  | 'smart-contracts'
  | 'consulting'
  | 'other';

interface ServiceOrder {
  id: string;
  serviceId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'delivered' | 'completed' | 'disputed' | 'cancelled';
  requirements: string;
  deliverables?: MediaItem[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
```

### 3.6 Notifications

```typescript
interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

type NotificationType =
  | 'message'
  | 'follow'
  | 'like'
  | 'comment'
  | 'tip'
  | 'mention'
  | 'achievement'
  | 'reward'
  | 'nft_sold'
  | 'order_update'
  | 'system';
```

---

## 4. Service Layer

### VYB Service (`lib/vyb/service.ts`)

The service layer handles all data operations. Currently uses mock data but designed for easy backend integration.

```typescript
class VYBService {
  // User Management
  setCurrentUser(qorId: string): void
  
  // Profile Operations
  async getProfile(qorId: string): Promise<VYBProfile | null>
  async updateProfile(qorId: string, updates: Partial<VYBProfile>): Promise<VYBProfile>
  async updateTheme(qorId: string, theme: Partial<ProfileTheme>): Promise<ProfileTheme>
  async followUser(targetQorId: string): Promise<boolean>
  async unfollowUser(targetQorId: string): Promise<boolean>
  
  // Feed Operations
  async getFeed(options?: {
    type?: 'global' | 'following' | 'profile';
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<FeedItem[]>
  async createPost(content: { text?: string; media?: string[]; visibility?: string }): Promise<FeedItem>
  async likePost(postId: string): Promise<boolean>
  async tipPost(postId: string, amount: number): Promise<boolean>
  
  // Messaging
  async getConversations(): Promise<Conversation[]>
  async getMessages(conversationId: string): Promise<Message[]>
  async sendMessage(conversationId: string, content: MessageContent): Promise<Message>
  async startConversation(targetQorId: string): Promise<Conversation>
  
  // Media Gallery
  async getGallery(qorId: string): Promise<GalleryItem[]>
  async uploadMedia(file: File): Promise<GalleryItem>
  async mintMedia(mediaId: string, options: MintRequest): Promise<{ success: boolean; nftId?: string; txHash?: string }>
  
  // Notifications
  async getNotifications(): Promise<Notification[]>
  async markNotificationRead(notificationId: string): Promise<void>
  async markAllNotificationsRead(): Promise<void>
  
  // Services Marketplace
  async getServices(category?: string): Promise<ServiceListing[]>
}

// Singleton instance
export const vybService = new VYBService();
```

### Usage Example

```typescript
import { vybService } from '@/lib/vyb/service';

// Set current user after authentication
vybService.setCurrentUser('myuser#1234');

// Get a profile
const profile = await vybService.getProfile('artist#0042');

// Create a post
const post = await vybService.createPost({
  text: 'Hello VYB! 🎨',
  media: ['https://example.com/image.png'],
  visibility: 'public'
});

// Tip a post
await vybService.tipPost(post.id, 10); // Tip 10 CGT

// Send a message with tip
await vybService.sendMessage('conv_123', {
  text: 'Great work!',
  tip: { amount: 5, message: 'Keep creating!' }
});

// Mint media as NFT
const result = await vybService.mintMedia('media_456', {
  name: 'My Artwork',
  description: 'Original digital art',
  royaltyPercent: 10
});
```

---

## 5. React Context (State Management)

### VYBContext (`contexts/VYBContext.tsx`)

Provides global state management for all VYB features.

```typescript
interface VYBContextType {
  // Profile State
  profile: VYBProfile | null;
  isLoadingProfile: boolean;
  updateProfile: (updates: Partial<VYBProfile>) => Promise<void>;
  updateTheme: (theme: Partial<ProfileTheme>) => Promise<void>;

  // Feed State
  feed: FeedItem[];
  isLoadingFeed: boolean;
  refreshFeed: () => Promise<void>;
  createPost: (content: { text?: string; media?: string[] }) => Promise<FeedItem>;
  likePost: (postId: string) => Promise<void>;
  tipPost: (postId: string, amount: number) => Promise<void>;

  // Conversations State
  conversations: Conversation[];
  unreadMessageCount: number;
  refreshConversations: () => Promise<void>;

  // Notifications State
  notifications: Notification[];
  unreadNotificationCount: number;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Gallery State
  gallery: GalleryItem[];
  isLoadingGallery: boolean;
  refreshGallery: () => Promise<void>;
  uploadMedia: (file: File) => Promise<GalleryItem>;
  mintMedia: (mediaId: string, options: MintRequest) => Promise<{ success: boolean; nftId?: string }>;
}
```

### Usage in Components

```typescript
'use client';
import { useVYB } from '@/contexts/VYBContext';

function MyComponent() {
  const { 
    profile, 
    feed, 
    createPost, 
    tipPost,
    unreadMessageCount,
    unreadNotificationCount 
  } = useVYB();

  const handlePost = async () => {
    await createPost({ text: 'Hello world!' });
  };

  return (
    <div>
      <p>Welcome, {profile?.displayName}</p>
      <p>Unread messages: {unreadMessageCount}</p>
      <button onClick={handlePost}>Post</button>
    </div>
  );
}
```

### Provider Setup

The VYBProvider wraps the application in `layout.tsx`:

```typescript
<AuthProvider>
  <BlockchainProvider>
    <VYBProvider>
      <MusicProvider>
        {children}
      </MusicProvider>
    </VYBProvider>
  </BlockchainProvider>
</AuthProvider>
```

---

## 6. Components Reference

### 6.1 Feed Components

#### `<Feed />`
Main feed container with post composer and feed items.

```typescript
// Props: None (uses VYBContext)
// Features:
// - Post composer with media upload buttons
// - Global/Following toggle
// - Refresh button
// - Renders FeedCard for each item
```

#### `<FeedCard item={FeedItem} />`
Renders a single feed item with all interaction buttons.

```typescript
interface FeedCardProps {
  item: FeedItem;
}

// Features:
// - Author info with role icon and verification badge
// - Content rendering based on type (post, achievement, nft_mint, etc.)
// - Like, comment, tip buttons
// - Tip modal with CGT amount input
// - Share button
```

### 6.2 Profile Components

#### `<ProfileCard />`
Compact profile card for sidebar display.

```typescript
// Props: None (uses VYBContext)
// Displays:
// - Avatar and cover
// - Display name, QOR ID, role
// - Bio preview
// - Stats (followers, following, CGT)
// - Quick stats (games, achievements, NFTs)
// - Badges
// - Action buttons (View Profile, Settings)
```

#### `<ProfileCustomizer />`
Modal for customizing profile theme.

```typescript
// Props: None (uses VYBContext)
// Features:
// - Live preview of changes
// - Color preset selection (8 presets)
// - Custom color pickers (primary, secondary)
// - Font style selection
// - Layout style selection
// - Profile music toggle and URL input
// - Save/Cancel actions
```

### 6.3 Media Components

#### `<MediaGallery />`
Full media gallery with upload and mint functionality.

```typescript
// Props: None (uses VYBContext)
// Features:
// - Upload button with file input
// - Info banner about 3-month expiration
// - Grid display of media items
// - Expiration countdown for non-minted items
// - NFT badge on minted items
// - Hover overlay with "Mint This" button
// - Item detail modal
// - Mint modal with name, description, royalty settings
```

### 6.4 Messaging Components

#### `<Messages />`
Full messaging interface.

```typescript
// Props: None (uses VYBContext)
// Features:
// - Conversation list sidebar
// - Online status indicators
// - Unread badges
// - Chat header with user info
// - Message bubbles with status indicators
// - Tip button in chat
// - Message input with attachment button
// - In-chat tipping modal
```

### 6.5 Notification Components

#### `<NotificationsPanel />`
Notification list panel.

```typescript
// Props: None (uses VYBContext)
// Features:
// - Unread count badge
// - Mark all read button
// - Notification items with type-specific icons
// - Time formatting
// - Read/unread visual states
// - Link to full notifications page
```

### 6.6 Marketplace Components

#### `<ServiceMarketplace />`
Creator services marketplace.

```typescript
// Props: None (uses internal state)
// Features:
// - Category filter tabs
// - Service grid with cards
// - Service cards showing creator, title, price, rating
// - Category color coding
// - Service detail modal
// - Message and Order buttons
```

---

## 7. Pages & Routing

### Route Structure

```
/social                           # Main VYB dashboard
/social/profile                   # User's own profile (editable)
/social/profile/[qorId]           # Public profile viewing
```

### Page Details

#### `/social` - Main Dashboard

**Tabs:**
| Tab | Component | Description |
|-----|-----------|-------------|
| Feed | `<Feed />` | Global activity stream |
| Messages | `<Messages />` | Direct messaging |
| Gallery | `<MediaGallery />` | User's media uploads |
| Services | `<ServiceMarketplace />` | Creator marketplace |
| Notifications | `<NotificationsPanel />` | Alerts and updates |

**Sidebar (Feed tab):**
- `<ProfileCard />`
- Weekly stats
- Trending topics
- Suggested creators

#### `/social/profile` - Own Profile

- Full profile view with stats grid
- Editable fields (name, bio, role)
- Badge display
- Social links
- `<MediaGallery />`
- `<ProfileCustomizer />` button

#### `/social/profile/[qorId]` - Public Profile

- Read-only profile view
- Follow/Unfollow button
- Tip CGT button
- Message button
- User's posts feed
- Badge display

---

## 8. Blockchain Integration

### Demiurge RPC Client

VYB integrates with the Demiurge blockchain through the RPC client:

```typescript
// lib/demiurge-rpc.ts
import { demiurgeRpc } from '@/lib/demiurge-rpc';

// Get CGT balance
const balance = await demiurgeRpc.getBalance(walletAddress);

// Transfer CGT (for tips)
await demiurgeRpc.transfer(fromAddress, toAddress, amount, signature);

// Claim starter bonus (new users)
const result = await demiurgeRpc.claimStarterBonus(walletAddress);

// Get consensus status
const status = await demiurgeRpc.getConsensusStatus();
```

### RPC Endpoints Used by VYB

| Method | Purpose |
|--------|---------|
| `balances_getBalance` | Get user's CGT balance |
| `balances_transfer` | Transfer CGT (tips, payments) |
| `balances_claimStarter` | New user starter bonus |
| `chain_getHealth` | Check blockchain connectivity |
| `consensus_getStatus` | Get current era/block info |

### Transaction Flow for Tipping

```
1. User clicks "Tip" on a post
2. VYB shows amount input modal
3. User enters amount and confirms
4. Frontend calls demiurgeRpc.transfer()
5. Transaction is signed with user's session key
6. Transaction submitted to blockchain
7. On success, UI updates to show tip
8. Feed item's tipAmount is incremented
```

---

## 9. CGT Token Integration

### Token Details

- **Name**: Creator God Token (CGT)
- **Smallest Unit**: Spark (1 CGT = 100 Sparks)
- **Total Supply**: 13 billion CGT
- **Block Reward**: 42 CGT per block (~5% annual inflation)

### CGT in VYB

| Feature | CGT Usage |
|---------|-----------|
| Tipping | Users tip posts and creators |
| Messages | In-chat tips during conversations |
| Services | Pay for creator services |
| NFT Minting | Future: minting fees |
| Balance Display | Profile card, chat header |

### Starter Bonus System

New users receive 100 CGT through the faucet:

```typescript
// On first login or welcome modal
const result = await demiurgeRpc.claimStarterBonus(walletAddress);
// Returns: { success: true, amount: "10000", message: "Welcome! You received 100 CGT..." }
```

---

## 10. NFT (DRC-369) Integration

### DRC-369 Standard Features

- Multi-resource NFTs
- Soulbound option
- XP and leveling
- Royalty support
- On-chain metadata

### Minting Flow in VYB

```
1. User uploads media to gallery
2. Media stored with 3-month expiration
3. User hovers over media, clicks "Mint This"
4. Mint modal appears:
   - Name input
   - Description textarea
   - Royalty percentage (0-50%)
5. User confirms mint
6. vybService.mintMedia() is called
7. Backend creates DRC-369 NFT
8. NFT ID returned and stored
9. Media marked as minted (permanent)
10. Notification sent to user
```

### NFT Display in Feed

When an NFT is minted, it creates a feed item:

```typescript
{
  type: 'nft_mint',
  content: {
    text: 'Just minted a new NFT!',
    nft: {
      id: 'nft_12345',
      name: 'My Artwork',
      image: 'ipfs://...',
    }
  }
}
```

---

## 11. Media System

### Storage Architecture

```
┌─────────────────────────────────────────────┐
│              Media Upload Flow               │
├─────────────────────────────────────────────┤
│                                             │
│  User uploads file                          │
│         │                                   │
│         ▼                                   │
│  Frontend creates GalleryItem               │
│         │                                   │
│         ▼                                   │
│  File sent to media storage                 │
│  (S3, IPFS, or local)                       │
│         │                                   │
│         ▼                                   │
│  GalleryItem stored with:                   │
│  - expiresAt = now + 90 days                │
│  - isMinted = false                         │
│         │                                   │
│         ▼                                   │
│  If user mints within 90 days:              │
│  - Upload to IPFS                           │
│  - Create DRC-369 NFT                       │
│  - isMinted = true                          │
│  - Permanent storage                        │
│                                             │
│  If not minted after 90 days:               │
│  - Media deleted from storage               │
│                                             │
└─────────────────────────────────────────────┘
```

### Expiration Logic

```typescript
const getDaysRemaining = (expiresAt: Date) => {
  const now = new Date();
  const diff = new Date(expiresAt).getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Display in UI
if (!item.isMinted && getDaysRemaining(item.expiresAt) <= 14) {
  // Show expiration warning
}
```

### Supported Media Types

| Type | Extensions | Max Size | Notes |
|------|------------|----------|-------|
| Image | jpg, png, gif, webp | 10MB | Thumbnail generated |
| Video | mp4, webm | 100MB | Duration tracked |
| Audio | mp3, wav, ogg | 20MB | Duration tracked |

---

## 12. Integration Points

### 12.1 Authentication Integration

VYB requires QOR Auth:

```typescript
// AuthContext provides:
interface AuthContextType {
  user: {
    qor_id: string;
    wallet_address: string;
    // ...
  } | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// VYB checks auth on protected pages:
useEffect(() => {
  if (!loading && !isAuthenticated) {
    router.push('/login');
  }
}, [loading, isAuthenticated]);
```

### 12.2 Game Integration

Games can post to VYB feed:

```typescript
// From game rewards system
import { gameRewards } from '@/lib/game-rewards';

// Award achievement (creates feed item)
await gameRewards.awardAchievement('ach_001', 'First Victory', 'gold');

// Award leaderboard position (creates feed item)
await gameRewards.awardLeaderboardPosition('cosmic-drift', 1);
```

### 12.3 NFT Marketplace Integration

VYB NFTs appear in marketplace:

```typescript
// When user mints from gallery
const result = await vybService.mintMedia(mediaId, {
  name: 'My Art',
  description: 'Digital artwork',
  royaltyPercent: 10
});

// NFT becomes available in:
// - User's wallet/collection
// - NFT marketplace
// - User's VYB profile
```

### 12.4 Wallet Integration

VYB uses the shared wallet context:

```typescript
// BlockchainContext provides wallet info
const { wallet, balance } = useBlockchain();

// Display in VYB
<span>{balance} CGT</span>
```

### 12.5 Event System

VYB listens to global events:

```typescript
// CGT reward event (from game-rewards.ts)
window.addEventListener('cgt-reward', (event: CustomEvent) => {
  const { amount, type, description } = event.detail;
  // Show notification
});

// Usage for integrations:
window.dispatchEvent(new CustomEvent('cgt-reward', {
  detail: {
    amount: 10,
    type: 'tip',
    description: 'Received tip from @artist#0042'
  }
}));
```

---

## 13. API Reference

### REST API Endpoints (Planned)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vyb/profile/:qorId` | Get user profile |
| PUT | `/api/vyb/profile/:qorId` | Update profile |
| GET | `/api/vyb/feed` | Get activity feed |
| POST | `/api/vyb/posts` | Create new post |
| POST | `/api/vyb/posts/:id/like` | Like a post |
| POST | `/api/vyb/posts/:id/tip` | Tip a post |
| GET | `/api/vyb/conversations` | Get conversations |
| GET | `/api/vyb/conversations/:id/messages` | Get messages |
| POST | `/api/vyb/conversations/:id/messages` | Send message |
| GET | `/api/vyb/gallery/:qorId` | Get user gallery |
| POST | `/api/vyb/gallery/upload` | Upload media |
| POST | `/api/vyb/gallery/:id/mint` | Mint as NFT |
| GET | `/api/vyb/notifications` | Get notifications |
| GET | `/api/vyb/services` | Get services list |

### WebSocket Events (Planned)

| Event | Direction | Payload |
|-------|-----------|---------|
| `message:new` | Server → Client | `{ conversationId, message }` |
| `message:send` | Client → Server | `{ conversationId, content }` |
| `notification:new` | Server → Client | `{ notification }` |
| `feed:update` | Server → Client | `{ feedItem }` |
| `user:online` | Server → Client | `{ qorId, isOnline }` |

### Blockchain RPC Methods

| Method | Parameters | Returns |
|--------|------------|---------|
| `balances_getBalance` | `[address]` | `string` (balance in Sparks) |
| `balances_transfer` | `[from, to, amount, signature]` | `string` (tx hash) |
| `balances_claimStarter` | `[address]` | `{ success, amount, message }` |
| `drc369_mint` | `[owner, metadata, royalty]` | `{ nftId, txHash }` |
| `drc369_transfer` | `[from, to, nftId, signature]` | `string` (tx hash) |

---

## 14. File Structure

```
apps/hub/src/
├── app/
│   └── social/
│       ├── page.tsx                    # Main VYB dashboard
│       └── profile/
│           ├── page.tsx                # Own profile page
│           └── [qorId]/
│               └── page.tsx            # Public profile page
│
├── components/
│   ├── vyb/
│   │   ├── index.ts                    # Component exports
│   │   ├── Feed.tsx                    # Feed container
│   │   ├── FeedCard.tsx                # Single feed item
│   │   ├── ProfileCard.tsx             # Compact profile card
│   │   ├── ProfileCustomizer.tsx       # Theme customization modal
│   │   ├── MediaGallery.tsx            # Gallery with mint feature
│   │   ├── Messages.tsx                # Messaging interface
│   │   ├── NotificationsPanel.tsx      # Notifications list
│   │   └── ServiceMarketplace.tsx      # Creator services
│   │
│   ├── onboarding/
│   │   ├── index.ts
│   │   └── WelcomeModal.tsx            # New user welcome
│   │
│   └── rewards/
│       ├── index.ts
│       └── RewardNotification.tsx      # CGT reward toast
│
├── contexts/
│   └── VYBContext.tsx                  # VYB state management
│
└── lib/
    ├── vyb/
    │   ├── index.ts                    # VYB lib exports
    │   ├── types.ts                    # TypeScript definitions
    │   └── service.ts                  # Data operations
    │
    ├── demiurge-rpc.ts                 # Blockchain RPC client
    └── game-rewards.ts                 # Game reward system
```

---

## Appendix A: Color Presets

| Name | Primary | Secondary |
|------|---------|-----------|
| Neon Cyan | #00f5ff | #bf00ff |
| Hot Pink | #ff00ff | #00ffff |
| Sunset | #ff6b35 | #f7c59f |
| Matrix | #00ff41 | #008f11 |
| Royal | #7b2cbf | #c77dff |
| Ocean | #0096c7 | #90e0ef |
| Fire | #ff4500 | #ff8c00 |
| Midnight | #1a1a2e | #16213e |

---

## Appendix B: Role Icons

| Role | Icon | Color Association |
|------|------|-------------------|
| artist | 🎨 | Pink/Purple |
| musician | 🎵 | Green/Teal |
| developer | 💻 | Blue/Cyan |
| designer | ✨ | Orange/Yellow |
| gamer | 🎮 | Blue |
| creator | 🎬 | Red/Orange |
| collector | 💎 | Diamond Blue |
| user | 👤 | Gray |

---

## Appendix C: Notification Types

| Type | Icon | Color |
|------|------|-------|
| message | 💬 | Blue |
| follow | 👤 | Blue/Cyan |
| like | ❤️ | Pink/Red |
| comment | 💭 | Blue |
| tip | 💰 | Green |
| mention | @ | Blue |
| achievement | 🏆 | Yellow/Orange |
| reward | 🎁 | Green |
| nft_sold | 🖼️ | Purple |
| order_update | 📦 | Gray |
| system | 🔔 | Gray |

---

## 15. Sophia AI System

### Overview

Sophia is the AI system entity of the Demiurge ecosystem, serving dual functions:

1. **Lorekeeper**: Answers questions about Demiurge lore, history, and mechanics using RAG (Retrieval Augmented Generation)
2. **Enforcer**: Moderates content with a progressive discipline system

### Core Components

```typescript
// lib/vyb/sophia-types.ts
interface ModerationProfile {
  qorId: string;
  strikeCount: number;
  banStatus: BanStatus;
  reputationScore: number;  // Karma
}

// Justice Scale (9 levels)
const SOPHIA_JUSTICE_SCALE = [
  { level: 0, triggerStrikeCount: 1, durationMinutes: 0, label: "First Warning" },
  { level: 1, triggerStrikeCount: 2, durationMinutes: 0, label: "Final Warning" },
  { level: 2, triggerStrikeCount: 3, durationMinutes: 5, label: "Time Out" },
  // ... up to level 8: Permanent Exile
];
```

### Karma System

| Tier | Karma Range | Permissions |
|------|-------------|-------------|
| Newcomer | 0-99 | post, comment, like |
| Citizen | 100-499 | + create_groups, tip |
| Trusted | 500-999 | + livestream |
| Elder | 1000-4999 | + vote_moderation |
| Oracle | 5000+ | + propose_governance |

### Sophia Components

| Component | Purpose |
|-----------|---------|
| `<SophiaBadge />` | Golden halo indicator for System Entity |
| `<SophiaChat />` | DM interface to consult the Oracle |
| `<ModerationOverlay />` | Ghost Mode banner during bans |
| `<KarmaDisplay />` | Reputation with tier progress |

### Usage

```typescript
import { sophiaAgent, checkContent, askSophia } from '@/lib/vyb/sophia-agent';

// Check content before posting
const allowed = await checkContent(postContent, userQorId);

// Consult Sophia about lore
const response = await askSophia("What is CGT?", userQorId);
```

### Sophia Identity

```typescript
const SOPHIA_IDENTITY = {
  qorId: 'sophia#0001',
  displayName: 'Sophia',
  role: 'deity',
  primaryColor: '#FFD700',  // Gold
};
```

---

## 16. Phase 2 Web3 Native Roadmap

VYB is designed to evolve into a fully Web3 native platform. See the complete Phase 2 architecture document for details:

**[VYB Phase 2: Web3 Native Architecture](./VYB_PHASE_2_WEB3_NATIVE_ARCHITECTURE.md)**

### Planned Integrations

| Technology | Purpose |
|------------|---------|
| Ceramic Network | Decentralized profile storage |
| XMTP | E2E encrypted messaging |
| Lit Protocol | Token-gated access control |
| Pinecone | Vector DB for Sophia RAG |
| Soulbound Tokens | Non-transferable karma |

### "Next-Gen" Litmus Test

| Test | Current | Phase 2 |
|------|---------|---------|
| Portable social graph | ❌ | ✅ Ceramic |
| Censorship-resistant chat | ❌ | ✅ XMTP |
| Transparent moderation | ❌ | ✅ On-chain |

---

*Documentation generated for Demiurge VYB Social Platform v1.1.0*
