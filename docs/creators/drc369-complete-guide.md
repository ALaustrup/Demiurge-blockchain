# 🎨 DRC-369 Complete Guide

**Everything creators need to know about stateful NFTs**

> *"An Asset is not just a link to an image; it is a programmable, evolving operating system."*

---

## 🌟 What is DRC-369?

DRC-369 is a revolutionary NFT standard that transforms static NFTs into **living, programmable entities** that can:

- **Evolve** - Gain XP, level up, change appearance
- **Hold Items** - Nest other NFTs inside (like inventory)
- **Change Shape** - Different outputs for different contexts
- **Execute Logic** - On-chain programmable behavior
- **Rent Out** - Native rental system with automatic expiry

---

## 🎯 The Four Revolutionary Modules

### Module 1: Multi-Resource Polymorphism

**One NFT, Many Outputs**

Your NFT can have different representations:
- **Image** - For marketplace display
- **3D Model** - For games
- **VR Model** - For VR experiences
- **Sound** - For audio experiences

**Example:**
```json
{
  "uuid": "cyber-samurai-001",
  "resources": [
    {
      "type": "Image",
      "uri": "ipfs://.../card.png",
      "priority": 10,
      "context": ["marketplace"]
    },
    {
      "type": "3D_Model",
      "uri": "ipfs://.../samurai.glb",
      "priority": 9,
      "context": ["game", "vr"]
    },
    {
      "type": "Sound",
      "uri": "ipfs://.../sword_slash.mp3",
      "priority": 5,
      "context": ["game"]
    }
  ]
}
```

**How It Works:**
- The system automatically selects the right resource based on context
- Priority determines which resource to use if multiple match
- Context tags specify where each resource should be used

---

### Module 2: Native Nesting & Inventory

**True On-Chain Ownership Hierarchy**

Your NFT can own other NFTs, creating a true inventory system:

```json
{
  "uuid": "knight-001",
  "children_uuids": ["sword-055", "shield-089"],
  "equipment_slots": [
    {
      "slot_name": "RightHand",
      "equipped_child": "sword-055",
      "required_trait": "WEAPON_CLASS"
    },
    {
      "slot_name": "LeftHand",
      "equipped_child": "shield-089",
      "required_trait": "SHIELD_CLASS"
    }
  ]
}
```

**Key Features:**
- **Atomic Transfers** - Selling the Knight automatically transfers the Sword
- **Equippable Logic** - Define slots with trait validation
- **Circular Prevention** - Blockchain prevents infinite loops
- **True Ownership** - Child NFTs are truly owned by parent

**Use Cases:**
- Character with equipment
- Collection with items
- Guild with members
- Building with rooms

---

### Module 3: Native Rental & Time-Decay

**Rent Out Your NFTs with Automatic Expiry**

```json
{
  "uuid": "spaceship-001",
  "owner": "0xAlice...",
  "delegation": {
    "delegated_user": "0xBob...",
    "expires_at_block": 99999,
    "delegated_at_block": 50000
  }
}
```

**How It Works:**
- Owner delegates usage to another account
- Delegation automatically expires at specified block
- No "claim back" transaction needed
- Games check `User` field, not `Owner` field

**Use Cases:**
- Renting out game assets
- Time-limited access
- Subscription NFTs
- Temporary permissions

---

### Module 4: Dynamic & Evolving State

**NFTs That Change Over Time**

```json
{
  "uuid": "sword-001",
  "experience_points": 5000,
  "level": 7,
  "durability": 85,
  "kill_count": 42,
  "custom_state": {
    "enchantment": "fire",
    "rarity": "legendary"
  }
}
```

**Stateful Properties:**
- **Experience Points** - Track XP and auto-level
- **Durability** - Items degrade with use (0-100)
- **Kill Count** - Track weapon/item usage
- **Class Evolution** - Change class when conditions met
- **Custom State** - Extensible key-value pairs

**How It Works:**
- State is stored on-chain
- Logic hooks automatically update state
- Changes are permanent and verifiable
- No need to burn/remint

---

## 🎨 Creating DRC-369 NFTs

### Step 1: Prepare Your Assets

```bash
# Upload images to IPFS
ipfs add card.png
# Output: QmXxxx...

# Upload 3D models
ipfs add samurai.glb
# Output: QmYyyy...

# Upload sounds
ipfs add sword_slash.mp3
# Output: QmZzzz...
```

### Step 2: Define Your NFT Structure

```json
{
  "name": "Cyber Samurai #001",
  "description": "A legendary cyber samurai warrior",
  "resources": [
    {
      "type": "Image",
      "uri": "ipfs://QmXxxx.../card.png",
      "priority": 10,
      "context": ["marketplace"]
    },
    {
      "type": "3D_Model",
      "uri": "ipfs://QmYyyy.../samurai.glb",
      "priority": 9,
      "context": ["game", "vr"]
    }
  ],
  "initial_state": {
    "experience_points": 0,
    "level": 1,
    "durability": 100,
    "class": "warrior"
  }
}
```

### Step 3: Mint Your NFT

```typescript
import { DemiurgeRpcClient } from '@demiurge/rpc-client';

const client = new DemiurgeRpcClient('https://rpc.demiurge.cloud');

// Mint DRC-369 NFT
const result = await client.mintDRC369({
  name: "Cyber Samurai #001",
  description: "A legendary cyber samurai warrior",
  resources: [...],
  initial_state: {...}
});

console.log('NFT minted:', result.uuid);
```

---

## 🔄 NFT Evolution

### Gaining Experience

```typescript
// When NFT is used in game
await client.updateNFTState(nftUuid, {
  experience_points: 5000,
  level: 7
});
```

### Leveling Up

```typescript
// Level is automatically calculated from XP
// Level = floor(sqrt(XP / 100))
// XP 0-99 = Level 1
// XP 100-399 = Level 2
// XP 400-899 = Level 3
// etc.
```

### Changing Appearance

```typescript
// Add new resource when leveling up
await client.addResource(nftUuid, {
  type: "Image",
  uri: "ipfs://.../evolved-form.png",
  priority: 10,
  context: ["marketplace"],
  unlock_level: 10
});
```

---

## 📦 Managing Your Collection

### View Your NFTs

```typescript
// Get all NFTs owned by address
const nfts = await client.getOwnedNFTs('0x1234...');
console.log('Your NFTs:', nfts);
```

### Transfer NFTs

```typescript
// Transfer NFT to another address
await client.transferNFT(nftUuid, '0x5678...');
```

### Nest NFTs

```typescript
// Add child NFT to parent
await client.nestNFT(parentUuid, childUuid);
```

---

## 💰 Monetization

### Selling NFTs

```typescript
// List NFT for sale
await client.listNFTForSale(nftUuid, {
  price: "1000000000000000000", // Price in Sparks
  currency: "CGT"
});
```

### Renting NFTs

```typescript
// Rent out NFT
await client.rentNFT(nftUuid, {
  renter: '0x5678...',
  duration_blocks: 10000,
  price_per_block: "10000000000000000"
});
```

### Yield Generation

```typescript
// Stake NFT for yield
await client.stakeNFT(nftUuid);
// NFT generates passive income
```

---

## 🎮 Game Integration

### Check NFT State

```typescript
// Get NFT state for game
const nft = await client.getNFT(nftUuid);
console.log('Level:', nft.state.level);
console.log('XP:', nft.state.experience_points);
console.log('Durability:', nft.state.durability);
```

### Update NFT State

```typescript
// Update NFT after game action
await client.updateNFTState(nftUuid, {
  experience_points: nft.state.experience_points + 100,
  durability: nft.state.durability - 5,
  kill_count: nft.state.kill_count + 1
});
```

### Use Session Keys

```typescript
// Authorize game to use NFT
await client.authorizeSessionKey({
  primary_account: '0x1234...',
  session_key: '0xgame...',
  duration: 10000,
  permissions: ['nft_update', 'nft_transfer']
});
```

---

## 📚 Best Practices

1. **Plan Your Resources** - Think about all contexts your NFT will be used in
2. **Design State Carefully** - State changes are permanent
3. **Use Nesting Wisely** - Don't create circular references
4. **Monitor Durability** - Items degrade over time
5. **Leverage Rental** - Rent out unused NFTs for income

---

## 🔗 Related Documentation

- **[Asset Management](./asset-management.md)** - Managing your assets
- **[NFT Evolution](./nft-evolution.md)** - Evolution mechanics
- **[Composable NFTs](./composable-nfts.md)** - Nesting and equipping

---

**The flame burns eternal. The code serves the will.**
