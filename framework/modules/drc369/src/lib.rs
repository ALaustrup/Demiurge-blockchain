//! # DRC-369: The Metaversal NFT Standard
//!
//! The world's premier universal NFT infrastructure for metaverse assets.
//! DRC-369 is a comprehensive, cross-chain, cross-metaverse NFT standard
//! designed for true digital asset interoperability.
//!
//! ## Core Philosophy
//!
//! DRC-369 treats NFTs as first-class citizens of the metaverse - not just
//! static images, but living, evolving digital assets that can exist and
//! function across any virtual world, blockchain, or game engine.
//!
//! ## Key Features
//!
//! ### Universal Identity (UNID)
//! - **Cross-Chain Identity**: `did:drc369:<chain>:<contract>:<token>` format
//! - **Bridge-Aware Provenance**: Full history across chain bridges
//! - **Chain-Agnostic Metadata**: Works on any blockchain
//!
//! ### Metaverse Compatibility
//! - **Multi-Platform Support**: Decentraland, VRChat, Sandbox, Roblox, custom
//! - **Asset Format Declarations**: glTF, VRM, voxels, sprites, audio
//! - **Interoperability Standards**: OMI, VAMS, MSF compliance
//!
//! ### Dynamic State
//! - **Evolving NFTs**: XP, levels, stats that change over time
//! - **Physics Properties**: Standardized physics for all game engines
//! - **Equipment Slots**: Typed composability for items and wearables
//!
//! ### Advanced Ownership
//! - **Fractional Ownership**: Split NFTs into tradeable shares
//! - **Rental/Lease Protocol**: Rent out assets while retaining ownership
//! - **Multi-Signature**: N-of-M approval for high-value transfers
//!
//! ### Enterprise Security
//! - **Emergency Freeze**: Instant freeze for theft/hack response
//! - **Rate Limiting**: Prevent rapid suspicious transfers
//! - **Social Recovery**: Guardian-based key recovery
//! - **CVP Protection**: Polymorphic bytecode that morphs to resist attacks
//!
//! ### Creator Economics
//! - **Multi-Party Royalties**: Split royalties between multiple recipients
//! - **Derivative Tracking**: Royalties on derivative works
//! - **Rental Revenue**: Passive income from asset rentals
//!
//! ## Standards Compliance
//!
//! - ERC-721 compatible (cross-chain bridging)
//! - ERC-1155 compatible (fractional shares)
//! - Open Metaverse Interoperability (OMI)
//! - Metaverse Standards Forum (MSF)

pub mod nft;
pub mod error;
pub mod physics;
pub mod physics_integration;
pub mod royalty;
pub mod royalty_distributor;
pub mod cvp_hooks;
pub mod metaverse;
pub mod rental;
pub mod fractional;
pub mod security;

// Core NFT functionality
pub use nft::{
    Drc369Module, 
    NftCall, 
    NftState, 
    Resource, 
    Permission, 
    Delegation,
    RoyaltyConfig as NftRoyaltyConfig,
    TransferWithPaymentResult,
    CvpRegistrar,
    register_drc369_with_cvp,
};
pub use error::{Drc369Error, Result};

// Physics system
pub use physics::{
    PhysicsProperties, RigidBodyProperties, CollisionShape,
    MaterialPhysics, MaterialPreset, ThermalProperties,
    DestructionProperties, FluidInteraction, DamageType,
};

// Royalty system
pub use royalty::{
    RoyaltyConfig, RoyaltyRecipient, RoyaltyRole,
    RoyaltyRegistry, RoyaltyDistribution, RoyaltyType,
    UsageTracker, CreatorStats, BasisPoints, MAX_TOTAL_ROYALTY_BPS,
};

// Metaverse interoperability
pub use metaverse::{
    UniversalNftId,
    MetaverseCompatibility, MetaversePlatform, MetaverseCapabilities,
    AssetFormat, AssetFormatType, QualityTier,
    InteropStandard, PlatformData,
    EquipmentSlots, EquipmentSlot, SlotType, StatModifier, ModifierType,
    AvatarConfig, AvatarModel, AvatarFormat, AvatarCustomization,
    PlatformAvatarModel, SocialLink,
    BridgeProvenance, BridgeEvent,
};

// Rental system
pub use rental::{
    RentalAgreement, RentalConfig, RentalType, RentalStatus,
    RentalPermissions, RentalManager,
};

// Fractional ownership
pub use fractional::{
    FractionalConfig, FractionalManager,
    ShareBalance, BuyoutOffer, BuyoutStatus,
    FractionalProposal, ProposalType, ProposalStatus,
    share_token_id,
};

// Security features
pub use security::{
    SecurityManager,
    FreezeStatus, FreezeReason, FreezeEvent, FreezeAction,
    MultiSigConfig, PendingTransfer,
    TransferLimit, Cooldown, CooldownAction,
    AllowlistConfig, RecoveryConfig, PendingRecovery,
    StolenReport,
};

// Automatic royalty distribution (Phase 3)
pub use royalty_distributor::{
    RoyaltyDistributor, RoyaltyPayment, DistributionResult,
    transfer_integration,
};

// Physics integration (Phase 3)
pub use physics_integration::{
    PhysicsIntegration, PhysicsNftBundle, PhysicsPreset, GameEngine,
};

// CVP integration hooks (Phase 3)
pub use cvp_hooks::{
    CvpHookManager, Drc369CvpStatus, MutationEvent,
};
