# DRC-369: Programmable, Evolving Asset Standard

## Core Philosophy

**"An Asset is not just a link to an image; it is a programmable, evolving operating system."**

DRC-369 transforms static NFTs into living, programmable entities that can hold items, change shape, and execute logic—all on-chain.

## The Four Revolutionary Modules

### Module 1: Multi-Resource Polymorphism (Context Module)

**Problem Solved**: An NFT is usually just one JPG, but games need different outputs for different contexts.

**Solution**: One token, many outputs.

- **Resource Types**: Image (marketplace), 3D Model (game), VR Model (VR headset), Sound (usage)
- **Priority Logic**: Automatically selects the right resource based on context
- **Context Tags**: Tag resources for specific contexts (e.g., "marketplace", "vr", "mobile")

**Example**:
```rust
// A Cyber-Samurai NFT has:
resources: [
    { type: "Image", uri: "ipfs://.../card.png", priority: 10, context: ["marketplace"] },
    { type: "3D_Model", uri: "ipfs://.../samurai.glb", priority: 9, context: ["game", "vr"] },
    { type: "Sound", uri: "ipfs://.../sword_slash.mp3", priority: 5, context: ["game"] }
]
```

### Module 2: Native Nesting & Inventory (Matryoshka Module)

**Problem Solved**: Selling a "Knight" character requires separately selling his "Sword" and "Shield"—a UX nightmare.

**Solution**: True on-chain ownership hierarchy.

- **Parent-Child Entanglement**: A "Knight" NFT owns a "Sword" NFT
- **Atomic Transfers**: Selling the Knight automatically transfers the Sword
- **Equippable Logic**: Define slots (Head, RightHand, Chest) with trait validation
- **Circular Prevention**: Blockchain-level validation prevents infinite loops

**Example**:
```rust
// Knight NFT structure:
{
    uuid: "knight-001",
    children_uuids: ["sword-055", "shield-089"],
    equipment_slots: [
        { slot_name: "RightHand", equipped_child: Some("sword-055"), required_trait: Some(WEAPON_CLASS) },
        { slot_name: "LeftHand", equipped_child: Some("shield-089"), required_trait: Some(SHIELD_CLASS) }
    ]
}
```

### Module 3: Native Rental & Time-Decay (Leasing Module)

**Problem Solved**: Renting assets requires complex escrow contracts or "wrapping" NFTs, breaking utility.

**Solution**: Owner vs User roles with automatic expiry.

- **Delegation**: Owner can delegate usage to another account
- **Time-Lock Expiry**: Delegation automatically expires at a specific block
- **Automatic Revocation**: No "claim back" transaction needed
- **Game Integration**: Games check User field, not Owner field

**Example**:
```rust
// Rental structure:
{
    uuid: "spaceship-001",
    owner: "0xAlice...",
    delegation: {
        delegated_user: Some("0xBob..."),
        expires_at_block: Some(99999),  // Auto-revokes at block 99999
        delegated_at_block: 50000
    }
}
// At block 99999, delegation automatically expires, Bob loses access
```

### Module 4: Dynamic & Evolving State (DNA Module)

**Problem Solved**: Metadata on Ethereum is static JSON on IPFS. If a sword gets "dulled" or a character levels up, you have to burn/remint or rely on centralized databases.

**Solution**: Mutable on-chain storage with logic hooks.

- **Experience Points**: Track XP and auto-level
- **Durability**: Items degrade with use (0-100)
- **Kill Count**: Track weapon/item usage
- **Class Evolution**: Change class when conditions are met
- **Custom State**: Extensible key-value pairs for game-specific data
- **Logic Hooks**: Automatic state updates via Substrate hooks

**Example**:
```rust
// Stateful NFT:
{
    uuid: "sword-001",
    experience_points: 5000,
    level: 7,  // Auto-calculated from XP
    durability: 75,  // Decreases with use
    kill_count: 42,
    class_id: 1,  // Can evolve to class_id: 2 at level 50
    custom_state: [
        ("enchanted", "true"),
        ("element", "fire")
    ]
}
```

## Technical Architecture

### Storage Structure

```rust
pub struct Drc369Metadata<T: Config> {
    // Core fields
    uuid: [u8; 32],
    name: BoundedVec<u8, MAX_NAME_LENGTH>,
    creator_account: T::AccountId,
    
    // Module 1: Multi-Resource
    resources: BoundedVec<Resource, MAX_RESOURCES_PER_NFT>,
    
    // Module 2: Nesting
    parent_uuid: Option<[u8; 32]>,
    equipment_slots: BoundedVec<EquipmentSlot, MAX_EQUIPMENT_SLOTS>,
    children_uuids: BoundedVec<[u8; 32], MAX_NESTED_CHILDREN>,
    
    // Module 3: Delegation
    delegation: Option<DelegationInfo<T>>,
    
    // Module 4: Stateful
    experience_points: u64,
    level: u32,
    durability: u8,
    kill_count: u32,
    class_id: u32,
    custom_state: BoundedVec<(BoundedVec<u8, 32>, BoundedVec<u8, 256>), 20>,
}
```

### Key Extrinsics

#### Module 1: Multi-Resource
- `add_resource()` - Add a resource (2D icon, 3D model, sound, etc.)
- `remove_resource()` - Remove a resource

#### Module 2: Nesting
- `nest_nft()` - Nest a child NFT inside a parent (atomic ownership transfer)
- `unnest_nft()` - Remove a child from its parent
- `equip_nft()` - Equip a child NFT to a specific slot
- `unequip_nft()` - Unequip a child from a slot
- `add_equipment_slot()` - Define a new equipment slot

#### Module 3: Delegation
- `delegate_nft()` - Delegate usage to another account (with optional expiry)
- `revoke_delegation()` - Owner reclaims usage

#### Module 4: Stateful
- `add_experience()` - Add XP (auto-levels)
- `update_durability()` - Modify durability
- `increment_kill_count()` - Track kills
- `evolve_class()` - Change class when conditions met

## Why This Dominates

### Zero-Integration for Games
Game devs don't need to write code to "check if the player has the sword." They just query the Parent NFT.

### Liquidity Efficiency
Players sell bundles (Full Character Builds), not just loose items. This increases average transaction value (ATV).

### Cross-Chain "Soul" Preservation
Using XCM (Cross-Consensus Messaging), you can teleport this entire complex object to other Polkadot parachains.

### On-Chain Logic Execution
Unlike EVM NFTs that require external contracts, DRC-369 executes logic natively in Rust at near-native speed.

## Comparison: DRC-369 vs ERC-721 vs RMRK

| Feature | ERC-721 | RMRK | DRC-369 |
|---------|---------|------|---------|
| **Nesting** | ❌ No | ✅ Yes | ✅ Yes (with circular prevention) |
| **Multi-Resource** | ❌ No | ✅ Yes | ✅ Yes (with priority logic) |
| **On-Chain State** | ❌ Static | ⚠️ Limited | ✅ Full (XP, durability, custom) |
| **Rental/Delegation** | ❌ Requires wrapper | ⚠️ Complex | ✅ Native with auto-expiry |
| **Equippable Logic** | ❌ No | ✅ Yes | ✅ Yes (with trait validation) |
| **Execution Speed** | Slow (VM) | Medium | Fast (Native Rust) |
| **Gas Costs** | High | Medium | Low (Substrate) |

## Implementation Status

✅ **All Four Modules Implemented**
- Multi-Resource Polymorphism
- Native Nesting & Inventory
- Rental & Time-Decay Delegation
- Dynamic & Evolving State

✅ **Storage & Events**
- All storage structures defined
- All events emitted
- Error handling complete

✅ **Extrinsics**
- All 16+ extrinsics implemented
- Atomic transfer logic for nested children
- Circular nesting prevention
- Automatic delegation expiry checks

⏳ **Pending**
- Off-Chain Workers (OCW) for real-world game data
- Integration with pallet-scheduler for automatic triggers
- Benchmarking and weight calculation
- Comprehensive testing

## Next Steps

1. **OCW Integration**: Add off-chain workers to fetch real-time game data
2. **Scheduler Integration**: Use pallet-scheduler for automatic state updates
3. **Testing**: Comprehensive test suite for all modules
4. **Documentation**: API documentation and usage examples
5. **Frontend SDK**: JavaScript/TypeScript SDK for easy integration
