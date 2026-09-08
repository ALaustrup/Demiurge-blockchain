//! Physics Integration for DRC-369
//!
//! Phase 3 Implementation: Integrates physics properties directly into NFT state,
//! enabling physics-ready assets that work across all game engines.
//!
//! # Architecture
//!
//! ```text
//! NFT with Physics
//! ┌─────────────────────────────────────┐
//! │  DRC-369 NFT                        │
//! │  ┌────────────────┐ ┌─────────────┐ │
//! │  │ Core State     │ │ Physics     │ │
//! │  │ • Owner        │ │ • RigidBody │ │
//! │  │ • Metadata     │ │ • Material  │ │
//! │  │ • XP/Level     │ │ • Thermal   │ │
//! │  │ • Resources    │ │ • Destruct  │ │
//! │  └────────────────┘ └─────────────┘ │
//! └─────────────────────────────────────┘
//!              │
//!              ▼
//! ┌─────────────────────────────────────┐
//! │  Game Engine Adapters               │
//! │  ┌────────┐ ┌────────┐ ┌──────────┐ │
//! │  │Unreal  │ │ Unity  │ │ Godot    │ │
//! │  └────────┘ └────────┘ └──────────┘ │
//! └─────────────────────────────────────┘
//! ```

use serde::{Deserialize, Serialize};
use demiurge_storage::Storage;
use tracing::info;

use crate::error::{Drc369Error, Result};
use crate::physics::{
    PhysicsProperties, RigidBodyProperties, CollisionShape,
    MaterialPreset, DestructionProperties, DamageType,
};
use crate::nft::Drc369Module;

/// Physics-enabled NFT data bundle (serialization only)
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PhysicsNftBundle {
    /// Core NFT ID (hex encoded for serialization)
    pub nft_id: String,
    /// Owner address (hex encoded)
    pub owner: String,
    /// XP value
    pub xp: u64,
    /// Level
    pub level: u32,
    /// Physics properties
    pub physics: PhysicsProperties,
    /// Whether physics is simulation-ready
    pub simulation_ready: bool,
}

/// Physics preset configurations for common asset types
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum PhysicsPreset {
    /// Lightweight equipment (helmets, gloves)
    LightEquipment,
    /// Heavy equipment (armor, shields)
    HeavyEquipment,
    /// Weapons (swords, axes)
    Weapon,
    /// Projectiles (arrows, bullets)
    Projectile,
    /// Vehicles (cars, spaceships)
    Vehicle,
    /// Characters (avatars, NPCs)
    Character,
    /// Buildings/Structures
    Structure,
    /// Decorative items (no physics collision)
    Decorative,
    /// Custom physics
    Custom(PhysicsProperties),
}

impl PhysicsPreset {
    /// Convert preset to physics properties
    pub fn to_physics(&self) -> PhysicsProperties {
        match self {
            Self::LightEquipment => PhysicsProperties {
                rigid_body: Some(RigidBodyProperties {
                    mass_kg: 2.0,
                    center_of_mass: [0.0, 0.0, 0.0],
                    collision_shape: CollisionShape::Box { half_extents: [0.2, 0.2, 0.1] },
                    is_static: false,
                    linear_damping: 0.3,
                    gravity_scale: 1.0,
                }),
                material: Some(MaterialPreset::Metal.default_physics()),
                ..Default::default()
            },
            
            Self::HeavyEquipment => PhysicsProperties {
                rigid_body: Some(RigidBodyProperties {
                    mass_kg: 15.0,
                    center_of_mass: [0.0, 0.0, 0.0],
                    collision_shape: CollisionShape::Box { half_extents: [0.4, 0.5, 0.2] },
                    is_static: false,
                    linear_damping: 0.5,
                    gravity_scale: 1.0,
                }),
                material: Some(MaterialPreset::Metal.default_physics()),
                ..Default::default()
            },
            
            Self::Weapon => PhysicsProperties {
                rigid_body: Some(RigidBodyProperties {
                    mass_kg: 3.5,
                    center_of_mass: [0.0, -0.3, 0.0], // Handle-weighted
                    collision_shape: CollisionShape::Capsule { radius: 0.05, height: 1.0 },
                    is_static: false,
                    linear_damping: 0.2,
                    gravity_scale: 1.0,
                }),
                material: Some(MaterialPreset::Metal.default_physics()),
                destruction: Some(DestructionProperties {
                    health: Some(1000.0),
                    destructible: true,
                    ..Default::default()
                }),
                ..Default::default()
            },
            
            Self::Projectile => PhysicsProperties {
                rigid_body: Some(RigidBodyProperties {
                    mass_kg: 0.1,
                    center_of_mass: [0.0, 0.0, 0.0],
                    collision_shape: CollisionShape::Sphere { radius: 0.02 },
                    is_static: false,
                    linear_damping: 0.01, // Low drag for range
                    gravity_scale: 1.0,
                }),
                ..Default::default()
            },
            
            Self::Vehicle => PhysicsProperties {
                rigid_body: Some(RigidBodyProperties {
                    mass_kg: 1500.0,
                    center_of_mass: [0.0, -0.5, 0.0], // Low center for stability
                    collision_shape: CollisionShape::Box { half_extents: [2.0, 0.8, 4.5] },
                    is_static: false,
                    linear_damping: 0.1,
                    gravity_scale: 1.0,
                }),
                material: Some(MaterialPreset::Metal.default_physics()),
                destruction: Some(DestructionProperties {
                    health: Some(5000.0),
                    destructible: true,
                    ..Default::default()
                }),
                ..Default::default()
            },
            
            Self::Character => PhysicsProperties {
                rigid_body: Some(RigidBodyProperties {
                    mass_kg: 75.0,
                    center_of_mass: [0.0, 0.0, 0.0],
                    collision_shape: CollisionShape::Capsule { radius: 0.4, height: 1.8 },
                    is_static: false,
                    linear_damping: 0.1,
                    gravity_scale: 1.0,
                }),
                ..Default::default()
            },
            
            Self::Structure => PhysicsProperties {
                rigid_body: Some(RigidBodyProperties {
                    mass_kg: 0.0, // Infinite mass (static)
                    center_of_mass: [0.0, 0.0, 0.0],
                    collision_shape: CollisionShape::Box { half_extents: [5.0, 3.0, 5.0] },
                    is_static: true,
                    linear_damping: 1.0,
                    gravity_scale: 0.0,
                }),
                material: Some(MaterialPreset::Stone.default_physics()),
                ..Default::default()
            },
            
            Self::Decorative => PhysicsProperties {
                rigid_body: None, // No physics simulation
                ..Default::default()
            },
            
            Self::Custom(props) => props.clone(),
        }
    }
}

/// Physics Integration Manager
pub struct PhysicsIntegration;

impl PhysicsIntegration {
    /// Mint a new NFT with physics properties in a single transaction
    /// 
    /// This combines the mint and set_physics operations atomically.
    pub fn mint_with_physics(
        storage: &dyn Storage,
        caller: [u8; 32],
        owner: [u8; 32],
        metadata: Vec<u8>,
        soulbound: bool,
        physics: PhysicsProperties,
    ) -> Result<PhysicsNftBundle> {
        // Validate physics properties
        physics.validate()?;
        
        // Mint the NFT
        let nft_id = Drc369Module::mint(storage, caller, owner, metadata, soulbound)?;
        
        // Set physics properties
        Drc369Module::set_physics(storage, caller, nft_id, physics.clone())?;
        
        // Get the NFT state
        let state = Drc369Module::get_state(storage, &nft_id);
        
        let simulation_ready = physics.is_simulation_ready();
        
        info!(
            "DRC369 Physics: Minted physics-enabled NFT {} (simulation_ready: {})",
            hex::encode(&nft_id[..8]),
            simulation_ready
        );
        
        Ok(PhysicsNftBundle {
            nft_id: hex::encode(nft_id),
            owner: hex::encode(owner),
            xp: state.xp,
            level: state.level,
            physics,
            simulation_ready,
        })
    }
    
    /// Mint a new NFT with a physics preset
    pub fn mint_with_preset(
        storage: &dyn Storage,
        caller: [u8; 32],
        owner: [u8; 32],
        metadata: Vec<u8>,
        soulbound: bool,
        preset: PhysicsPreset,
    ) -> Result<PhysicsNftBundle> {
        let physics = preset.to_physics();
        Self::mint_with_physics(storage, caller, owner, metadata, soulbound, physics)
    }
    
    /// Get complete physics bundle for an NFT
    pub fn get_physics_bundle(
        storage: &dyn Storage,
        nft_id: &[u8; 32],
    ) -> Option<PhysicsNftBundle> {
        let owner = Drc369Module::get_owner(storage, nft_id)?;
        let state = Drc369Module::get_state(storage, nft_id);
        let physics = Drc369Module::get_physics(storage, nft_id)?;
        let simulation_ready = physics.is_simulation_ready();
        
        Some(PhysicsNftBundle {
            nft_id: hex::encode(nft_id),
            owner: hex::encode(owner),
            xp: state.xp,
            level: state.level,
            physics,
            simulation_ready,
        })
    }
    
    /// Update physics properties when NFT levels up
    /// 
    /// Some games may want physics to scale with level (heavier armor, etc.)
    pub fn scale_physics_with_level(
        storage: &dyn Storage,
        caller: [u8; 32],
        nft_id: [u8; 32],
        scale_factor: f32,
    ) -> Result<()> {
        // Get current physics
        let mut physics = Drc369Module::get_physics(storage, &nft_id)
            .ok_or(Drc369Error::NftNotFound)?;
        
        // Scale rigid body properties
        if let Some(ref mut rb) = physics.rigid_body {
            rb.mass_kg *= scale_factor;
            
            // Scale collision shape
            rb.collision_shape = match rb.collision_shape.clone() {
                CollisionShape::Box { half_extents } => {
                    CollisionShape::Box {
                        half_extents: [
                            half_extents[0] * scale_factor,
                            half_extents[1] * scale_factor,
                            half_extents[2] * scale_factor,
                        ],
                    }
                }
                CollisionShape::Sphere { radius } => {
                    CollisionShape::Sphere { radius: radius * scale_factor }
                }
                CollisionShape::Capsule { radius, height } => {
                    CollisionShape::Capsule {
                        radius: radius * scale_factor,
                        height: height * scale_factor,
                    }
                }
                other => other,
            };
        }
        
        // Update storage
        Drc369Module::set_physics(storage, caller, nft_id, physics)?;
        
        info!(
            "DRC369 Physics: Scaled NFT {} physics by {}x",
            hex::encode(&nft_id[..8]),
            scale_factor
        );
        
        Ok(())
    }
    
    /// Apply damage to physics-enabled NFT
    /// 
    /// Returns remaining health, or None if NFT has no destruction properties
    pub fn apply_damage(
        storage: &dyn Storage,
        caller: [u8; 32],
        nft_id: [u8; 32],
        damage_amount: f32,
        damage_type: DamageType,
    ) -> Result<Option<f32>> {
        // Get current physics
        let mut physics = Drc369Module::get_physics(storage, &nft_id)
            .ok_or(Drc369Error::NftNotFound)?;
        
        // Check if destructible
        let remaining = if let Some(ref mut destruct_props) = physics.destruction {
            if !destruct_props.destructible {
                return Ok(destruct_props.health);
            }
            
            // Calculate effective damage based on type and resistances
            let effective_damage = match damage_type {
                DamageType::Physical => damage_amount,
                DamageType::Fire => damage_amount * 1.2, // Fire does extra damage
                DamageType::Ice => damage_amount * 0.8,
                DamageType::Lightning => damage_amount * 1.1,
                DamageType::Poison => damage_amount * 0.7,
                DamageType::Magic => damage_amount * 1.0,
                DamageType::Custom(_) => damage_amount,
            };
            
            if let Some(health) = destruct_props.health.as_mut() {
                *health = (*health - effective_damage).max(0.0);
                Some(*health)
            } else {
                None
            }
        } else {
            None
        };
        
        // Update storage
        Drc369Module::set_physics(storage, caller, nft_id, physics)?;
        
        if let Some(health) = remaining {
            info!(
                "DRC369 Physics: NFT {} took {} {:?} damage, {} health remaining",
                hex::encode(&nft_id[..8]),
                damage_amount,
                damage_type,
                health
            );
        }
        
        Ok(remaining)
    }
    
    /// Export physics properties in game engine-specific format
    pub fn export_for_engine(
        storage: &dyn Storage,
        nft_id: &[u8; 32],
        engine: GameEngine,
    ) -> Result<String> {
        let physics = Drc369Module::get_physics(storage, nft_id)
            .ok_or(Drc369Error::NftNotFound)?;
        
        match engine {
            GameEngine::Unreal => Self::export_unreal(&physics),
            GameEngine::Unity => Self::export_unity(&physics),
            GameEngine::Godot => Self::export_godot(&physics),
            GameEngine::Custom => Self::export_json(&physics),
        }
    }
    
    /// Export for Unreal Engine (Blueprint-compatible JSON)
    fn export_unreal(physics: &PhysicsProperties) -> Result<String> {
        #[derive(Serialize)]
        struct UnrealPhysics {
            mass: f32,
            linear_damping: f32,
            angular_damping: f32,
            gravity_scale: f32,
            enable_physics: bool,
            collision_preset: String,
            static_friction: f32,
            dynamic_friction: f32,
            restitution: f32,
        }
        
        let unreal = if let Some(rb) = &physics.rigid_body {
            let material = physics.material.as_ref();
            UnrealPhysics {
                mass: rb.mass_kg,
                linear_damping: rb.linear_damping,
                angular_damping: rb.linear_damping * 0.5,
                gravity_scale: rb.gravity_scale,
                enable_physics: !rb.is_static,
                collision_preset: if rb.is_static { "WorldStatic" } else { "PhysicsActor" }.to_string(),
                static_friction: material.map(|m| m.static_friction).unwrap_or(0.5),
                dynamic_friction: material.map(|m| m.dynamic_friction).unwrap_or(0.4),
                restitution: material.map(|m| m.restitution).unwrap_or(0.3),
            }
        } else {
            UnrealPhysics {
                mass: 0.0,
                linear_damping: 0.0,
                angular_damping: 0.0,
                gravity_scale: 0.0,
                enable_physics: false,
                collision_preset: "NoCollision".to_string(),
                static_friction: 0.0,
                dynamic_friction: 0.0,
                restitution: 0.0,
            }
        };
        
        serde_json::to_string_pretty(&unreal)
            .map_err(|e| Drc369Error::StateUpdateFailed(e.to_string()))
    }
    
    /// Export for Unity (Component-compatible JSON)
    fn export_unity(physics: &PhysicsProperties) -> Result<String> {
        #[derive(Serialize)]
        struct UnityPhysics {
            rigidbody: Option<UnityRigidbody>,
            collider: Option<UnityCollider>,
            physics_material: Option<UnityPhysicsMaterial>,
        }
        
        #[derive(Serialize)]
        struct UnityRigidbody {
            mass: f32,
            drag: f32,
            angular_drag: f32,
            use_gravity: bool,
            is_kinematic: bool,
        }
        
        #[derive(Serialize)]
        struct UnityCollider {
            collider_type: String,
            size: [f32; 3],
            radius: Option<f32>,
            height: Option<f32>,
        }
        
        #[derive(Serialize)]
        struct UnityPhysicsMaterial {
            static_friction: f32,
            dynamic_friction: f32,
            bounciness: f32,
        }
        
        let unity = if let Some(rb) = &physics.rigid_body {
            let (collider_type, size, radius, height) = match &rb.collision_shape {
                CollisionShape::Box { half_extents } => {
                    ("BoxCollider".to_string(), 
                     [half_extents[0] * 2.0, half_extents[1] * 2.0, half_extents[2] * 2.0],
                     None, None)
                }
                CollisionShape::Sphere { radius } => {
                    ("SphereCollider".to_string(), [0.0, 0.0, 0.0], Some(*radius), None)
                }
                CollisionShape::Capsule { radius, height } => {
                    ("CapsuleCollider".to_string(), [0.0, 0.0, 0.0], Some(*radius), Some(*height))
                }
                CollisionShape::ConvexHull { .. } => {
                    ("MeshCollider".to_string(), [0.0, 0.0, 0.0], None, None)
                }
            };
            
            UnityPhysics {
                rigidbody: Some(UnityRigidbody {
                    mass: rb.mass_kg,
                    drag: rb.linear_damping,
                    angular_drag: rb.linear_damping * 0.5,
                    use_gravity: rb.gravity_scale > 0.0,
                    is_kinematic: rb.is_static,
                }),
                collider: Some(UnityCollider {
                    collider_type,
                    size,
                    radius,
                    height,
                }),
                physics_material: physics.material.as_ref().map(|m| UnityPhysicsMaterial {
                    static_friction: m.static_friction,
                    dynamic_friction: m.dynamic_friction,
                    bounciness: m.restitution,
                }),
            }
        } else {
            UnityPhysics {
                rigidbody: None,
                collider: None,
                physics_material: None,
            }
        };
        
        serde_json::to_string_pretty(&unity)
            .map_err(|e| Drc369Error::StateUpdateFailed(e.to_string()))
    }
    
    /// Export for Godot (Resource-compatible JSON)
    fn export_godot(physics: &PhysicsProperties) -> Result<String> {
        // Godot-compatible format
        serde_json::to_string_pretty(&physics)
            .map_err(|e| Drc369Error::StateUpdateFailed(e.to_string()))
    }
    
    /// Export as raw JSON
    fn export_json(physics: &PhysicsProperties) -> Result<String> {
        serde_json::to_string_pretty(&physics)
            .map_err(|e| Drc369Error::StateUpdateFailed(e.to_string()))
    }
}

/// Supported game engines for physics export
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum GameEngine {
    Unreal,
    Unity,
    Godot,
    Custom,
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_physics_presets() {
        let weapon = PhysicsPreset::Weapon.to_physics();
        assert!(weapon.rigid_body.is_some());
        assert!(weapon.destruction.is_some());
        
        let decorative = PhysicsPreset::Decorative.to_physics();
        assert!(decorative.rigid_body.is_none());
    }
    
    #[test]
    fn test_unreal_export() {
        let physics = PhysicsPreset::Weapon.to_physics();
        let export = PhysicsIntegration::export_unreal(&physics).unwrap();
        assert!(export.contains("mass"));
        assert!(export.contains("PhysicsActor"));
    }
    
    #[test]
    fn test_unity_export() {
        let physics = PhysicsPreset::Character.to_physics();
        let export = PhysicsIntegration::export_unity(&physics).unwrap();
        assert!(export.contains("rigidbody"));
        assert!(export.contains("CapsuleCollider"));
    }
}
