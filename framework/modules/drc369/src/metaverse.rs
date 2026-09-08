//! DRC-369 Metaverse Module
//!
//! Universal cross-chain, cross-metaverse NFT infrastructure.
//! This module provides the foundation for true metaversal asset portability.

use codec::{Decode, Encode};
use scale_info::TypeInfo;
use serde::{Deserialize, Serialize};
use blake2::{Blake2b512, Digest};

// ============================================================================
// UNIVERSAL NFT ID (UNID) - Cross-Chain Identity
// ============================================================================

/// Universal NFT Identifier - Works across all chains and metaverses
/// 
/// Format: `did:drc369:<chain_id>:<contract_address>:<token_id>`
/// 
/// This provides a globally unique identifier that can be resolved
/// regardless of which blockchain or metaverse the NFT currently resides on.
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct UniversalNftId {
    /// The originating chain identifier (e.g., "demiurge", "ethereum", "polygon")
    pub chain_id: String,
    /// Contract/module address on origin chain
    pub contract_address: [u8; 32],
    /// Token ID on origin chain
    pub token_id: [u8; 32],
    /// Version of the UNID standard
    pub version: u8,
    /// Checksum for validation
    pub checksum: [u8; 4],
}

impl UniversalNftId {
    /// Create a new UNID for a Demiurge NFT
    pub fn new(token_id: [u8; 32]) -> Self {
        let contract_address = Self::drc369_contract_address();
        let mut unid = Self {
            chain_id: "demiurge".to_string(),
            contract_address,
            token_id,
            version: 1,
            checksum: [0; 4],
        };
        unid.checksum = unid.calculate_checksum();
        unid
    }
    
    /// Create UNID for a bridged asset from another chain
    pub fn from_bridge(chain_id: String, contract_address: [u8; 32], token_id: [u8; 32]) -> Self {
        let mut unid = Self {
            chain_id,
            contract_address,
            token_id,
            version: 1,
            checksum: [0; 4],
        };
        unid.checksum = unid.calculate_checksum();
        unid
    }
    
    /// Get the DRC-369 contract address (deterministic)
    fn drc369_contract_address() -> [u8; 32] {
        let mut hasher = Blake2b512::new();
        hasher.update(b"DRC369_CONTRACT_V1");
        let hash = hasher.finalize();
        let mut addr = [0u8; 32];
        addr.copy_from_slice(&hash[..32]);
        addr
    }
    
    /// Calculate checksum for validation
    fn calculate_checksum(&self) -> [u8; 4] {
        let mut hasher = Blake2b512::new();
        hasher.update(self.chain_id.as_bytes());
        hasher.update(self.contract_address);
        hasher.update(self.token_id);
        hasher.update([self.version]);
        let hash = hasher.finalize();
        let mut checksum = [0u8; 4];
        checksum.copy_from_slice(&hash[..4]);
        checksum
    }
    
    /// Validate the UNID checksum
    pub fn is_valid(&self) -> bool {
        self.checksum == self.calculate_checksum()
    }
    
    /// Convert to DID format string
    pub fn to_did(&self) -> String {
        format!(
            "did:drc369:{}:{}:{}",
            self.chain_id,
            hex::encode(self.contract_address),
            hex::encode(self.token_id)
        )
    }
    
    /// Parse from DID format string
    pub fn from_did(did: &str) -> Option<Self> {
        let parts: Vec<&str> = did.split(':').collect();
        if parts.len() != 5 || parts[0] != "did" || parts[1] != "drc369" {
            return None;
        }
        
        let chain_id = parts[2].to_string();
        let contract_address = hex::decode(parts[3]).ok()?;
        let token_id = hex::decode(parts[4]).ok()?;
        
        if contract_address.len() != 32 || token_id.len() != 32 {
            return None;
        }
        
        let mut ca = [0u8; 32];
        let mut ti = [0u8; 32];
        ca.copy_from_slice(&contract_address);
        ti.copy_from_slice(&token_id);
        
        Some(Self::from_bridge(chain_id, ca, ti))
    }
    
    /// Get a short identifier for display
    pub fn short_id(&self) -> String {
        format!(
            "{}:{}...{}",
            self.chain_id,
            hex::encode(&self.token_id[..4]),
            hex::encode(&self.token_id[28..])
        )
    }
}

// ============================================================================
// CROSS-METAVERSE PORTABILITY SCHEMA
// ============================================================================

/// Metaverse compatibility declaration
/// 
/// NFTs declare which metaverses/games they are compatible with,
/// enabling automatic asset loading and rendering.
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct MetaverseCompatibility {
    /// List of supported metaverse platforms
    pub platforms: Vec<MetaversePlatform>,
    /// Asset format declarations
    pub asset_formats: Vec<AssetFormat>,
    /// Interoperability standard compliance
    pub standards: Vec<InteropStandard>,
    /// Custom platform-specific data
    pub platform_data: Vec<PlatformData>,
}

impl Default for MetaverseCompatibility {
    fn default() -> Self {
        Self {
            platforms: vec![MetaversePlatform::Demiurge],
            asset_formats: vec![AssetFormat::default()],
            standards: vec![InteropStandard::Drc369],
            platform_data: vec![],
        }
    }
}

/// Supported metaverse platforms
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize, PartialEq)]
pub enum MetaversePlatform {
    /// Native Demiurge metaverse
    Demiurge,
    /// Decentraland
    Decentraland,
    /// The Sandbox
    TheSandbox,
    /// Roblox (via bridge)
    Roblox,
    /// VRChat
    VRChat,
    /// Spatial
    Spatial,
    /// Somnium Space
    SomniumSpace,
    /// Cryptovoxels / Voxels
    Voxels,
    /// Unreal Engine metaverses
    UnrealEngine,
    /// Unity-based metaverses
    Unity,
    /// Godot-based games
    Godot,
    /// Custom platform with identifier
    Custom(String),
}

/// Asset format declarations for cross-platform rendering
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct AssetFormat {
    /// Format type (3D model, sprite, audio, etc.)
    pub format_type: AssetFormatType,
    /// File format (glTF, FBX, PNG, etc.)
    pub file_format: String,
    /// Resolution/quality tier
    pub quality_tier: QualityTier,
    /// IPFS/Arweave CID for the asset
    pub content_id: String,
    /// File size in bytes
    pub size_bytes: u64,
    /// Polygon count (for 3D models)
    pub poly_count: Option<u32>,
    /// Texture resolution (for textured assets)
    pub texture_resolution: Option<u32>,
}

impl Default for AssetFormat {
    fn default() -> Self {
        Self {
            format_type: AssetFormatType::Model3D,
            file_format: "glb".to_string(),
            quality_tier: QualityTier::Medium,
            content_id: String::new(),
            size_bytes: 0,
            poly_count: None,
            texture_resolution: None,
        }
    }
}

/// Types of asset formats
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize, PartialEq)]
pub enum AssetFormatType {
    /// 3D model (glTF, FBX, OBJ)
    Model3D,
    /// 2D sprite/image
    Sprite2D,
    /// Animated sprite sheet
    SpriteSheet,
    /// Audio file
    Audio,
    /// Video file
    Video,
    /// VRM avatar
    VrmAvatar,
    /// Voxel model
    Voxel,
    /// Point cloud
    PointCloud,
    /// Procedural generation parameters
    Procedural,
    /// On-chain SVG
    OnChainSvg,
}

/// Quality/LOD tiers for assets
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize, PartialEq)]
pub enum QualityTier {
    /// Thumbnail/icon (< 1KB)
    Thumbnail,
    /// Low quality for mobile/VR (< 100KB)
    Low,
    /// Medium quality (< 1MB)
    Medium,
    /// High quality (< 10MB)
    High,
    /// Ultra/source quality (unlimited)
    Ultra,
}

/// Interoperability standards compliance
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize, PartialEq)]
pub enum InteropStandard {
    /// Native DRC-369
    Drc369,
    /// ERC-721 compatible
    Erc721,
    /// ERC-1155 compatible
    Erc1155,
    /// Open Metaverse Interoperability (OMI)
    Omi,
    /// Virtual Asset Metadata Standard (VAMS)
    Vams,
    /// Metaverse Standards Forum
    Msf,
    /// Custom standard
    Custom(String),
}

/// Platform-specific configuration data
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct PlatformData {
    /// Target platform
    pub platform: MetaversePlatform,
    /// Platform-specific metadata (JSON)
    pub metadata: String,
    /// Platform-specific asset overrides
    pub asset_override: Option<String>,
}

// ============================================================================
// EQUIPMENT SLOT SYSTEM - Typed Composability
// ============================================================================

/// Equipment slot configuration for composable NFTs
/// 
/// Allows NFTs to have typed slots where child NFTs can be equipped,
/// enabling complex item systems for games and metaverses.
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct EquipmentSlots {
    /// Available slots on this NFT
    pub slots: Vec<EquipmentSlot>,
    /// Maximum number of slots allowed
    pub max_slots: u8,
    /// Whether slots can be dynamically added
    pub expandable: bool,
}

impl Default for EquipmentSlots {
    fn default() -> Self {
        Self {
            slots: vec![],
            max_slots: 8,
            expandable: false,
        }
    }
}

/// Individual equipment slot
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct EquipmentSlot {
    /// Unique slot identifier
    pub slot_id: u8,
    /// Slot type (restricts what can be equipped)
    pub slot_type: SlotType,
    /// Human-readable slot name
    pub name: String,
    /// Currently equipped NFT (if any)
    pub equipped_nft: Option<[u8; 32]>,
    /// Whether the slot is locked
    pub locked: bool,
    /// Stat modifiers when slot is filled
    pub stat_modifiers: Vec<StatModifier>,
}

/// Types of equipment slots
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize, PartialEq)]
pub enum SlotType {
    /// Any item can be equipped
    Universal,
    /// Weapon slot (swords, guns, wands)
    Weapon,
    /// Armor slot (chest, legs, etc.)
    Armor,
    /// Accessory slot (rings, amulets)
    Accessory,
    /// Companion/pet slot
    Companion,
    /// Mount slot
    Mount,
    /// Cosmetic/skin slot
    Cosmetic,
    /// Consumable slot
    Consumable,
    /// Tool slot
    Tool,
    /// Badge/achievement display
    Badge,
    /// Custom slot type
    Custom(String),
}

/// Stat modifier applied when item is equipped
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct StatModifier {
    /// Stat being modified
    pub stat_name: String,
    /// Modifier type
    pub modifier_type: ModifierType,
    /// Modifier value
    pub value: i64,
}

/// Types of stat modifications
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize, PartialEq)]
pub enum ModifierType {
    /// Add flat value
    Flat,
    /// Multiply by percentage (100 = +100%)
    Percentage,
    /// Set to exact value (overrides base)
    Override,
}

// ============================================================================
// AVATAR SYSTEM - Cross-Metaverse Identity
// ============================================================================

/// Avatar configuration for identity across metaverses
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
#[derive(Default)]
pub struct AvatarConfig {
    /// Avatar display name
    pub display_name: String,
    /// Avatar bio/description
    pub bio: String,
    /// Primary avatar model (VRM, Ready Player Me, etc.)
    pub primary_model: Option<AvatarModel>,
    /// Alternative models for different platforms
    pub platform_models: Vec<PlatformAvatarModel>,
    /// Customization parameters
    pub customization: AvatarCustomization,
    /// Equipped wearables (DRC-369 NFTs)
    pub wearables: Vec<[u8; 32]>,
    /// Social links
    pub social_links: Vec<SocialLink>,
}


/// Avatar model reference
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct AvatarModel {
    /// Model format
    pub format: AvatarFormat,
    /// Content ID (IPFS/Arweave)
    pub content_id: String,
    /// Thumbnail image
    pub thumbnail: Option<String>,
}

/// Platform-specific avatar model
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct PlatformAvatarModel {
    /// Target platform
    pub platform: MetaversePlatform,
    /// Model for this platform
    pub model: AvatarModel,
}

/// Avatar model formats
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize, PartialEq)]
pub enum AvatarFormat {
    /// VRM format (VRChat, etc.)
    Vrm,
    /// Ready Player Me
    ReadyPlayerMe,
    /// Decentraland avatar
    DecentralandAvatar,
    /// Roblox avatar
    RobloxAvatar,
    /// Generic glTF
    GltfAvatar,
    /// Custom format
    Custom(String),
}

/// Avatar customization parameters
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize, Default)]
pub struct AvatarCustomization {
    /// Skin tone (0-100 scale)
    pub skin_tone: Option<u8>,
    /// Hair color (hex)
    pub hair_color: Option<String>,
    /// Eye color (hex)
    pub eye_color: Option<String>,
    /// Height modifier (percentage, 100 = normal)
    pub height: Option<u8>,
    /// Body type (0-100 scale)
    pub body_type: Option<u8>,
    /// Custom parameters (JSON)
    pub custom_params: Option<String>,
}

/// Social link
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct SocialLink {
    /// Platform name
    pub platform: String,
    /// Handle/URL
    pub handle: String,
    /// Verified status
    pub verified: bool,
}

// ============================================================================
// BRIDGE PROVENANCE - Cross-Chain History
// ============================================================================

/// Tracks the provenance of an NFT across chains
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct BridgeProvenance {
    /// Original mint chain
    pub origin_chain: String,
    /// Original token ID
    pub origin_token_id: [u8; 32],
    /// Bridge history
    pub bridge_history: Vec<BridgeEvent>,
    /// Current chain
    pub current_chain: String,
    /// Is this the canonical (original) version?
    pub is_canonical: bool,
}

impl BridgeProvenance {
    /// Create provenance for a natively minted NFT
    pub fn native(token_id: [u8; 32]) -> Self {
        Self {
            origin_chain: "demiurge".to_string(),
            origin_token_id: token_id,
            bridge_history: vec![],
            current_chain: "demiurge".to_string(),
            is_canonical: true,
        }
    }
    
    /// Create provenance for a bridged NFT
    pub fn bridged(origin_chain: String, origin_token_id: [u8; 32]) -> Self {
        Self {
            origin_chain: origin_chain.clone(),
            origin_token_id,
            bridge_history: vec![BridgeEvent {
                from_chain: origin_chain,
                to_chain: "demiurge".to_string(),
                timestamp: 0, // Will be set by caller
                bridge_protocol: "native".to_string(),
                tx_hash: None,
            }],
            current_chain: "demiurge".to_string(),
            is_canonical: false,
        }
    }
}

/// Record of a bridge event
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct BridgeEvent {
    /// Source chain
    pub from_chain: String,
    /// Destination chain
    pub to_chain: String,
    /// Timestamp of bridge
    pub timestamp: u64,
    /// Bridge protocol used
    pub bridge_protocol: String,
    /// Transaction hash on source chain
    pub tx_hash: Option<String>,
}

// ============================================================================
// METAVERSE CAPABILITIES
// ============================================================================

/// Declares what an NFT can do in metaverses
#[derive(Clone, Debug, Encode, Decode, TypeInfo, Serialize, Deserialize)]
pub struct MetaverseCapabilities {
    /// Can be used as avatar wearable
    pub wearable: bool,
    /// Can be placed in world/land
    pub placeable: bool,
    /// Can be ridden/mounted
    pub rideable: bool,
    /// Has interactive behaviors
    pub interactive: bool,
    /// Can be used as building material
    pub building_block: bool,
    /// Has audio component
    pub audio_enabled: bool,
    /// Has animation
    pub animated: bool,
    /// Supports physics simulation
    pub physics_enabled: bool,
    /// Can be crafted/combined
    pub craftable: bool,
    /// Can be used in battles/games
    pub game_ready: bool,
    /// AI-driven behavior
    pub ai_enabled: bool,
    /// Custom capabilities
    pub custom: Vec<String>,
}

impl Default for MetaverseCapabilities {
    fn default() -> Self {
        Self {
            wearable: false,
            placeable: true,
            rideable: false,
            interactive: false,
            building_block: false,
            audio_enabled: false,
            animated: false,
            physics_enabled: true,
            craftable: false,
            game_ready: false,
            ai_enabled: false,
            custom: vec![],
        }
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_unid_creation() {
        let token_id = [1u8; 32];
        let unid = UniversalNftId::new(token_id);
        
        assert_eq!(unid.chain_id, "demiurge");
        assert!(unid.is_valid());
        
        let did = unid.to_did();
        assert!(did.starts_with("did:drc369:demiurge:"));
        
        let parsed = UniversalNftId::from_did(&did).unwrap();
        assert_eq!(parsed.token_id, token_id);
    }
    
    #[test]
    fn test_equipment_slots() {
        let mut slots = EquipmentSlots::default();
        slots.slots.push(EquipmentSlot {
            slot_id: 0,
            slot_type: SlotType::Weapon,
            name: "Main Hand".to_string(),
            equipped_nft: None,
            locked: false,
            stat_modifiers: vec![],
        });
        
        assert_eq!(slots.slots.len(), 1);
        assert_eq!(slots.slots[0].slot_type, SlotType::Weapon);
    }
    
    #[test]
    fn test_metaverse_compatibility() {
        let compat = MetaverseCompatibility {
            platforms: vec![
                MetaversePlatform::Demiurge,
                MetaversePlatform::VRChat,
                MetaversePlatform::Decentraland,
            ],
            asset_formats: vec![
                AssetFormat {
                    format_type: AssetFormatType::VrmAvatar,
                    file_format: "vrm".to_string(),
                    quality_tier: QualityTier::High,
                    content_id: "ipfs://...".to_string(),
                    size_bytes: 5_000_000,
                    poly_count: Some(50_000),
                    texture_resolution: Some(2048),
                },
            ],
            standards: vec![InteropStandard::Drc369, InteropStandard::Omi],
            platform_data: vec![],
        };
        
        assert_eq!(compat.platforms.len(), 3);
        assert!(compat.standards.contains(&InteropStandard::Omi));
    }
}
