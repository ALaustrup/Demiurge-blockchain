# DRC-369: Demiurge Request for Comment #369

> **The Universal Standard for Phygital Assets in the Pleroma**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [The Phygital Concept](#the-phygital-concept)
3. [Item Schema (JSON)](#item-schema-json)
4. [Pallet Architecture](#pallet-architecture)
5. [Trading Mechanics](#trading-mechanics)
6. [UE5 Integration](#ue5-integration)
7. [Implementation Status](#implementation-status)

---

## Overview

**DRC-369** defines the on-chain standard for all **items**, **assets**, and **creations** within the Demiurge ecosystem. Unlike traditional NFT standards (ERC-721, ERC-1155), DRC-369 is purpose-built for **3D world integration** where the blockchain state directly drives the visual representation in Unreal Engine 5.

### Core Principles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         DRC-369 DESIGN PILLARS                              │
│                                                                             │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐              │
│  │   PHYGITAL    │    │  UE5 NATIVE   │    │  ZERO-COST    │              │
│  │               │    │               │    │   RECEIVES    │              │
│  │ Physical +    │    │ Asset paths   │    │ Free-to-      │              │
│  │ Digital       │    │ baked into    │    │ accept trades │              │
│  │ Unity         │    │ chain data    │    │               │              │
│  └───────────────┘    └───────────────┘    └───────────────┘              │
│                                                                             │
│  ┌───────────────┐    ┌───────────────┐                                    │
│  │  CYBER GLASS  │    │   CREATOR     │                                    │
│  │               │    │   ROYALTIES   │                                    │
│  │ Visual style  │    │ Perpetual     │                                    │
│  │ metadata on   │    │ commission    │                                    │
│  │ chain         │    │ on resales    │                                    │
│  └───────────────┘    └───────────────┘                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The Phygital Concept

**Phygital = Physical + Digital**

In traditional blockchain systems, NFTs represent *ownership* of assets, but the asset itself (image, 3D model) lives off-chain. DRC-369 inverts this:

**The Chain is the Source of Truth for:**
- Asset paths (where UE5 loads the mesh)
- Material assignments (Cyber Glass variants)
- VFX socket positions (particle effects)
- Trading rules (soulbound status, royalties)

**The Game Client (UE5) reads the chain state and renders the item accordingly.**

### Example: "Chronos Glaive"

| Attribute | Value | Purpose |
|-----------|-------|---------|
| **Name** | "Chronos Glaive" | Display name in inventory |
| **UUID** | `0x7a1f...9f2e` | Unique item hash |
| **Creator Qor ID** | `Q7A1:9F2` | Original creator's visual key |
| **UE5 Asset Path** | `StaticMesh'/Game/Assets/Weapons/Glaive/SM_ChronosGlaive'` | Where UE5 loads the mesh |
| **Glass Material** | `MaterialInstance'/Game/Glass/MI_DarkVoid.MI_DarkVoid'` | Cyber Glass shader variant |
| **VFX Socket** | `socket_blade_tip` | Where particles spawn |
| **Is Soulbound** | `false` | Can be traded |
| **Royalty Fee** | `2.5%` | Creator gets 2.5% on each resale |

---

## Item Schema (JSON)

### The DRC-369 JSON Structure

```json
{
  "drc369_version": "1.0.0",
  "identity": {
    "uuid": "7a1f9c3e8b2d4f6a5e9c1d8b7a3f2e5c",
    "name": "Chronos Glaive",
    "description": "A weapon that bends time around its blade.",
    "creator_qor_id": "Q7A1:9F2",
    "creation_block": 12345,
    "rarity": "legendary"
  },
  "attributes": {
    "category": "weapon",
    "subcategory": "glaive",
    "level": 50,
    "stats": {
      "attack": 150,
      "speed": 1.8,
      "durability": 1000
    },
    "enchantments": [
      {
        "name": "Temporal Rift",
        "effect": "Slows enemies in a 5m radius by 30%",
        "cooldown": 60
      }
    ]
  },
  "visuals": {
    "ue5_asset_path": "StaticMesh'/Game/Assets/Weapons/Glaive/SM_ChronosGlaive'",
    "glass_material": "MaterialInstance'/Game/Glass/MI_DarkVoid.MI_DarkVoid'",
    "glow_color_hex": "#00FFFF",
    "vfx_socket": "socket_blade_tip",
    "vfx_asset": "ParticleSystem'/Game/VFX/PS_TimeDistortion'"
  },
  "trading": {
    "is_soulbound": false,
    "royalty_fee_percent": 2.5,
    "minimum_price_cgt": 100,
    "max_supply": 1000,
    "current_edition": 42
  },
  "provenance": {
    "mint_transaction": "0xabc123...",
    "current_owner": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
    "previous_owners": [
      "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty"
    ],
    "transfer_count": 1
  }
}
```

### Rust Struct Representation

```rust
use codec::{Decode, Encode};
use scale_info::TypeInfo;
use sp_runtime::RuntimeDebug;
use sp_std::prelude::*;

/// DRC-369 Item Metadata (stored on-chain as serialized JSON)
#[derive(Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, TypeInfo, MaxEncodedLen)]
pub struct Drc369Metadata {
    /// Unique item identifier (blake2_256 hash)
    pub uuid: [u8; 32],
    
    /// Item name (max 64 bytes)
    pub name: BoundedVec<u8, ConstU32<64>>,
    
    /// Creator's Qor Key (e.g., "Q7A1:9F2")
    pub creator_qor_id: BoundedVec<u8, ConstU32<10>>,
    
    /// UE5 asset path for loading the mesh
    pub ue5_asset_path: BoundedVec<u8, ConstU32<256>>,
    
    /// Material instance path (Cyber Glass variant)
    pub glass_material: BoundedVec<u8, ConstU32<256>>,
    
    /// VFX socket name for particle effects
    pub vfx_socket: BoundedVec<u8, ConstU32<64>>,
    
    /// Is this item soulbound (cannot be traded)?
    pub is_soulbound: bool,
    
    /// Royalty fee percentage (0-100, where 25 = 2.5%)
    pub royalty_fee_percent: u8,
    
    /// Full JSON metadata (for extensibility)
    pub full_metadata: BoundedVec<u8, ConstU32<4096>>,
}
```

---

## Pallet Architecture

### `pallet-drc369` Structure

```rust
// Future implementation in: blockchain/pallets/pallet-drc369/src/lib.rs

#[frame_support::pallet]
pub mod pallet {
    use super::*;
    
    #[pallet::config]
    pub trait Config: frame_system::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        type Currency: Currency<Self::AccountId>;
        type WeightInfo: WeightInfo;
    }
    
    /// Storage: Items by UUID
    #[pallet::storage]
    pub type Items<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        [u8; 32],  // UUID
        Drc369Metadata,
        OptionQuery,
    >;
    
    /// Storage: Owner of each item
    #[pallet::storage]
    pub type ItemOwners<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        [u8; 32],  // UUID
        T::AccountId,
        OptionQuery,
    >;
    
    /// Storage: Items owned by each account
    #[pallet::storage]
    pub type OwnerItems<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::AccountId,
        BoundedVec<[u8; 32], ConstU32<1000>>,  // Max 1000 items per account
        ValueQuery,
    >;
    
    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config> {
        /// Item minted [uuid, owner, creator]
        ItemMinted {
            uuid: [u8; 32],
            owner: T::AccountId,
            creator: T::AccountId,
        },
        
        /// Item transferred [uuid, from, to]
        ItemTransferred {
            uuid: [u8; 32],
            from: T::AccountId,
            to: T::AccountId,
        },
        
        /// Trade offer created [offer_id, initiator, receiver, item_uuid]
        TradeOfferCreated {
            offer_id: [u8; 32],
            initiator: T::AccountId,
            receiver: T::AccountId,
            item_uuid: [u8; 32],
        },
        
        /// Trade accepted [offer_id, item_uuid, from, to]
        TradeAccepted {
            offer_id: [u8; 32],
            item_uuid: [u8; 32],
            from: T::AccountId,
            to: T::AccountId,
        },
        
        /// Royalty paid [item_uuid, creator, amount]
        RoyaltyPaid {
            item_uuid: [u8; 32],
            creator: T::AccountId,
            amount: BalanceOf<T>,
        },
    }
    
    #[pallet::error]
    pub enum Error<T> {
        /// Item already exists
        ItemAlreadyExists,
        /// Item not found
        ItemNotFound,
        /// Not the item owner
        NotItemOwner,
        /// Item is soulbound (cannot be transferred)
        ItemIsSoulbound,
        /// Invalid UE5 asset path
        InvalidAssetPath,
        /// Royalty fee too high (max 10%)
        RoyaltyFeeTooHigh,
        /// Trade offer not found
        TradeOfferNotFound,
        /// Not authorized to accept trade
        NotAuthorizedToAcceptTrade,
    }
    
    #[pallet::call]
    impl<T: Config> Pallet<T> {
        /// Mint a new DRC-369 item
        #[pallet::call_index(0)]
        #[pallet::weight(50_000)]
        pub fn mint_item(
            origin: OriginFor<T>,
            metadata: Drc369Metadata,
        ) -> DispatchResult {
            let creator = ensure_signed(origin)?;
            
            // Validate metadata
            ensure!(
                !Items::<T>::contains_key(&metadata.uuid),
                Error::<T>::ItemAlreadyExists
            );
            ensure!(
                metadata.royalty_fee_percent <= 100, // Max 10%
                Error::<T>::RoyaltyFeeTooHigh
            );
            
            // Store item
            Items::<T>::insert(&metadata.uuid, &metadata);
            ItemOwners::<T>::insert(&metadata.uuid, &creator);
            
            // Add to creator's inventory
            OwnerItems::<T>::mutate(&creator, |items| {
                let _ = items.try_push(metadata.uuid);
            });
            
            Self::deposit_event(Event::ItemMinted {
                uuid: metadata.uuid,
                owner: creator.clone(),
                creator,
            });
            
            Ok(())
        }
        
        /// Initiate a trade offer (free for receiver to accept)
        #[pallet::call_index(1)]
        #[pallet::weight(30_000)]
        pub fn initiate_trade(
            origin: OriginFor<T>,
            item_uuid: [u8; 32],
            receiver: T::AccountId,
        ) -> DispatchResult {
            let initiator = ensure_signed(origin)?;
            
            // Verify ownership
            let owner = ItemOwners::<T>::get(&item_uuid)
                .ok_or(Error::<T>::ItemNotFound)?;
            ensure!(owner == initiator, Error::<T>::NotItemOwner);
            
            // Check soulbound
            let item = Items::<T>::get(&item_uuid)
                .ok_or(Error::<T>::ItemNotFound)?;
            ensure!(!item.is_soulbound, Error::<T>::ItemIsSoulbound);
            
            // Create trade offer
            let offer_id = sp_io::hashing::blake2_256(
                &[&item_uuid[..], &initiator.encode()[..]].concat()
            );
            
            // Store offer...
            // (Implementation continues)
            
            Self::deposit_event(Event::TradeOfferCreated {
                offer_id,
                initiator,
                receiver,
                item_uuid,
            });
            
            Ok(())
        }
        
        /// Accept a trade offer (FREE - no cost to receiver)
        #[pallet::call_index(2)]
        #[pallet::weight(30_000)]
        pub fn accept_trade(
            origin: OriginFor<T>,
            offer_id: [u8; 32],
        ) -> DispatchResult {
            let receiver = ensure_signed(origin)?;
            
            // Verify offer exists and receiver matches
            // (Implementation continues)
            
            // Transfer ownership atomically
            // Pay royalty to creator if applicable
            
            Self::deposit_event(Event::TradeAccepted {
                offer_id,
                item_uuid: [0u8; 32], // placeholder
                from: receiver.clone(),
                to: receiver,
            });
            
            Ok(())
        }
    }
}
```

---

## Trading Mechanics

### Two-Way Handshake Protocol

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DRC-369 TRADE FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INITIATOR (Alice)                    RECEIVER (Bob)                        │
│  ──────────────                       ────────────                          │
│                                                                             │
│  1. initiate_trade()                                                        │
│     ├─ Item UUID: 0x7a1f...                                                │
│     ├─ To: Bob                                                              │
│     └─ Fee: 0 CGT (from Bob)          ◄─────────── FREE RECEIVE            │
│                                                                             │
│  2. Offer Created                                                           │
│     └─ Offer ID: 0xabc1...                                                 │
│                                       3. Bob sees notification              │
│                                          in UE5 UI                          │
│                                                                             │
│                                       4. accept_trade()                     │
│                                          ├─ Offer ID: 0xabc1...             │
│                                          └─ No payment required             │
│                                                                             │
│  5. State Update (Atomic)                                                   │
│     ├─ Transfer ownership: Alice → Bob                                      │
│     ├─ Pay royalty: Bob → Creator (2.5% CGT)                               │
│     └─ Update inventories                                                   │
│                                                                             │
│  6. Event: TradeAccepted                                                    │
│     └─ UE5 Client renders item in Bob's inventory                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Features

1. **Zero-Cost Receives**: Bob doesn't need to send anything to accept
2. **Atomic Execution**: Ownership transfer happens in one transaction
3. **Automatic Royalties**: Creator gets % on every resale
4. **Soulbound Respect**: Cannot initiate trades for soulbound items

---

## UE5 Integration

### Blueprint Flow

```cpp
// UE5 C++ Example: Loading a DRC-369 Item

void ADemiurgeInventory::LoadItemFromChain(const FString& ItemUUID)
{
    // 1. Query chain for item metadata
    FDrc369Metadata Metadata = ChainRPC->GetItemMetadata(ItemUUID);
    
    // 2. Parse UE5 asset path
    FString AssetPath = Metadata.UE5AssetPath;
    // e.g., "StaticMesh'/Game/Assets/Weapons/Glaive/SM_ChronosGlaive'"
    
    // 3. Load the mesh
    UStaticMesh* ItemMesh = Cast<UStaticMesh>(
        StaticLoadObject(UStaticMesh::StaticClass(), nullptr, *AssetPath)
    );
    
    // 4. Apply Cyber Glass material
    FString MaterialPath = Metadata.GlassMaterial;
    UMaterialInstance* GlassMat = Cast<UMaterialInstance>(
        StaticLoadObject(UMaterialInstance::StaticClass(), nullptr, *MaterialPath)
    );
    
    // 5. Spawn actor with material
    FActorSpawnParameters SpawnParams;
    AItemActor* Item = GetWorld()->SpawnActor<AItemActor>(SpawnParams);
    Item->SetStaticMesh(ItemMesh);
    Item->SetMaterial(0, GlassMat);
    
    // 6. Attach VFX to socket
    FString VFXSocket = Metadata.VFXSocket;
    // Spawn particle system at socket...
}
```

### The "Visual Chain"

In the Pleroma, **the blockchain state is the 3D world**:
- Each item's metadata directly controls its visual representation
- Changing the `glass_material` on-chain updates the in-game appearance
- The UE5 client is a real-time renderer of chain state

---

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| **JSON Schema** | ✅ Defined | Complete spec above |
| **Rust Structs** | ✅ Defined | `Drc369Metadata` ready |
| **Pallet Scaffolding** | 🚧 Pending | To be implemented |
| **Trade Offers Storage** | 🚧 Pending | Requires atomic swap logic |
| **Royalty System** | 🚧 Pending | Auto-deduct on transfer |
| **UE5 RPC Integration** | 🚧 Pending | Chain query from blueprints |
| **Cyber Glass Materials** | 🚧 Pending | Material library in UE5 |

### Next Steps

1. **Create `pallet-drc369`** in `blockchain/pallets/`
2. **Implement `mint_item()` extrinsic** with full metadata validation
3. **Build trade offer system** with atomic swap guarantees
4. **Integrate with runtime** via `construct_runtime!`
5. **Test mint + transfer** on dev chain
6. **Build UE5 RPC client** to query item metadata
7. **Create Cyber Glass material library** with variants

---

## Rationale: Why DRC-369?

### Traditional NFTs (ERC-721)
- **Data**: Token ID + Off-chain URI
- **Ownership**: On-chain
- **Visuals**: Off-chain (IPFS, server)
- **Game Integration**: Requires separate metadata server

### DRC-369 (Demiurge Standard)
- **Data**: Full 3D asset paths on-chain
- **Ownership**: On-chain
- **Visuals**: On-chain metadata → UE5 direct load
- **Game Integration**: Chain is the asset database

**Result:** The blockchain becomes the "Asset Store" for the game world.

---

*Last Updated: January 12, 2026*  
*Document Version: 1.0*  
*Maintainer: Alaustrup*
