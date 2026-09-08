//! Physics-Ready Metadata for DRC-369
//!
//! Standardized physics properties ensure consistent behavior across all game engines.
//! Physics data is stored as JSON and serialized to bytes for on-chain storage.

use serde::{Deserialize, Serialize};
use crate::error::{Drc369Error, Result};

/// Rigid body properties for physics simulation
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct RigidBodyProperties {
    /// Mass in kilograms
    pub mass_kg: f32,
    
    /// Center of mass offset from origin [x, y, z]
    #[serde(default)]
    pub center_of_mass: [f32; 3],
    
    /// Collision shape for physics
    #[serde(default)]
    pub collision_shape: CollisionShape,
    
    /// Whether the body is static (immovable)
    #[serde(default)]
    pub is_static: bool,
    
    /// Linear damping (air resistance)
    #[serde(default)]
    pub linear_damping: f32,
    
    /// Gravity scale (1.0 = normal, 0.0 = no gravity)
    #[serde(default = "default_gravity_scale")]
    pub gravity_scale: f32,
}

fn default_gravity_scale() -> f32 { 1.0 }

/// Collision shape types
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum CollisionShape {
    Box { half_extents: [f32; 3] },
    Sphere { radius: f32 },
    Capsule { radius: f32, height: f32 },
    ConvexHull { mesh_uri: String },
}

impl Default for CollisionShape {
    fn default() -> Self {
        Self::Box { half_extents: [0.5, 0.5, 0.5] }
    }
}

/// Physical material properties
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct MaterialPhysics {
    /// Static friction coefficient
    #[serde(default)]
    pub static_friction: f32,
    
    /// Dynamic friction coefficient  
    #[serde(default)]
    pub dynamic_friction: f32,
    
    /// Coefficient of restitution (bounciness) 0-1
    #[serde(default)]
    pub restitution: f32,
    
    /// Density in kg/m³
    pub density_kg_m3: Option<f32>,
    
    /// Material preset
    pub preset: Option<MaterialPreset>,
}

/// Common material presets
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum MaterialPreset {
    Wood, Metal, Stone, Glass, Rubber, Ice, Flesh, Cloth, Water, Custom,
}

impl MaterialPreset {
    pub fn default_physics(&self) -> MaterialPhysics {
        match self {
            Self::Metal => MaterialPhysics {
                static_friction: 0.6,
                dynamic_friction: 0.4,
                restitution: 0.2,
                density_kg_m3: Some(7850.0),
                preset: Some(Self::Metal),
            },
            Self::Wood => MaterialPhysics {
                static_friction: 0.5,
                dynamic_friction: 0.4,
                restitution: 0.3,
                density_kg_m3: Some(600.0),
                preset: Some(Self::Wood),
            },
            _ => MaterialPhysics::default(),
        }
    }
}

/// Thermal physics properties
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct ThermalProperties {
    pub conductivity_w_mk: Option<f32>,
    pub melting_point_k: Option<f32>,
    pub flammable: bool,
}

/// Destruction/damage properties
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct DestructionProperties {
    pub destructible: bool,
    pub health: Option<f32>,
    pub max_health: Option<f32>,
    pub break_force_n: Option<f32>,
    pub debris_assets: Vec<String>,
}

/// Damage types
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum DamageType {
    Physical, Fire, Ice, Lightning, Poison, Magic, Custom(String),
}

/// Fluid interaction properties
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct FluidInteraction {
    pub buoyant: bool,
    pub drag_coefficient: f32,
}

/// Complete physics properties for a DRC-369 asset
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct PhysicsProperties {
    pub rigid_body: Option<RigidBodyProperties>,
    pub material: Option<MaterialPhysics>,
    pub thermal: Option<ThermalProperties>,
    pub destruction: Option<DestructionProperties>,
    pub fluid: Option<FluidInteraction>,
    #[serde(default)]
    pub physics_layer: u32,
    #[serde(default)]
    pub physics_tags: Vec<String>,
}

/// Maximum allowed mass in kg (prevents overflow issues in physics engines)
pub const MAX_MASS_KG: f32 = 1_000_000_000.0; // 1 billion kg

/// Maximum half-extent dimension in meters
pub const MAX_DIMENSION_M: f32 = 10_000.0; // 10km

/// Physics validation result with detailed error information
#[derive(Clone, Debug)]
pub struct PhysicsValidationResult {
    pub is_valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

impl PhysicsProperties {
    /// Create physics for a simple box
    pub fn simple_box(mass_kg: f32, half_extents: [f32; 3]) -> Self {
        Self {
            rigid_body: Some(RigidBodyProperties {
                mass_kg,
                collision_shape: CollisionShape::Box { half_extents },
                ..Default::default()
            }),
            material: Some(MaterialPreset::Wood.default_physics()),
            ..Default::default()
        }
    }
    
    /// Comprehensive validation of all physics properties
    /// Returns detailed validation result with errors and warnings
    pub fn validate_comprehensive(&self) -> PhysicsValidationResult {
        let mut errors = Vec::new();
        let mut warnings = Vec::new();
        
        // Validate rigid body properties
        if let Some(rb) = &self.rigid_body {
            // Mass validation
            if rb.mass_kg < 0.0 {
                errors.push("Mass cannot be negative".to_string());
            } else if rb.mass_kg == 0.0 && !rb.is_static {
                errors.push("Non-static bodies require mass > 0".to_string());
            } else if rb.mass_kg > MAX_MASS_KG {
                errors.push(format!("Mass exceeds maximum allowed value of {} kg", MAX_MASS_KG));
            }
            
            // Center of mass validation
            for (i, &coord) in rb.center_of_mass.iter().enumerate() {
                if coord.is_nan() || coord.is_infinite() {
                    errors.push(format!("Center of mass {} contains invalid value", ['x', 'y', 'z'][i]));
                }
            }
            
            // Collision shape validation
            match &rb.collision_shape {
                CollisionShape::Box { half_extents } => {
                    for (i, &extent) in half_extents.iter().enumerate() {
                        if extent <= 0.0 {
                            errors.push(format!("Box half_extent {} must be positive", ['x', 'y', 'z'][i]));
                        } else if extent > MAX_DIMENSION_M {
                            errors.push(format!("Box half_extent {} exceeds maximum of {} m", 
                                ['x', 'y', 'z'][i], MAX_DIMENSION_M));
                        }
                    }
                }
                CollisionShape::Sphere { radius } => {
                    if *radius <= 0.0 {
                        errors.push("Sphere radius must be positive".to_string());
                    } else if *radius > MAX_DIMENSION_M {
                        errors.push(format!("Sphere radius exceeds maximum of {} m", MAX_DIMENSION_M));
                    }
                }
                CollisionShape::Capsule { radius, height } => {
                    if *radius <= 0.0 {
                        errors.push("Capsule radius must be positive".to_string());
                    }
                    if *height <= 0.0 {
                        errors.push("Capsule height must be positive".to_string());
                    }
                    if *radius > MAX_DIMENSION_M || *height > MAX_DIMENSION_M {
                        errors.push(format!("Capsule dimensions exceed maximum of {} m", MAX_DIMENSION_M));
                    }
                }
                CollisionShape::ConvexHull { mesh_uri } => {
                    if mesh_uri.is_empty() {
                        errors.push("ConvexHull requires a valid mesh_uri".to_string());
                    } else if !mesh_uri.starts_with("ipfs://") && !mesh_uri.starts_with("https://") {
                        warnings.push("mesh_uri should use ipfs:// or https:// scheme".to_string());
                    }
                }
            }
            
            // Damping validation
            if rb.linear_damping < 0.0 {
                errors.push("Linear damping cannot be negative".to_string());
            } else if rb.linear_damping > 10.0 {
                warnings.push("High linear damping (>10) may cause unnatural behavior".to_string());
            }
            
            // Gravity scale validation
            if rb.gravity_scale.is_nan() || rb.gravity_scale.is_infinite() {
                errors.push("Gravity scale contains invalid value".to_string());
            } else if rb.gravity_scale < -10.0 || rb.gravity_scale > 10.0 {
                warnings.push("Extreme gravity scale may cause physics instability".to_string());
            }
        }
        
        // Validate material properties
        if let Some(mat) = &self.material {
            if mat.static_friction < 0.0 {
                errors.push("Static friction cannot be negative".to_string());
            } else if mat.static_friction > 2.0 {
                warnings.push("Static friction >2 is unusual for most materials".to_string());
            }
            
            if mat.dynamic_friction < 0.0 {
                errors.push("Dynamic friction cannot be negative".to_string());
            } else if mat.dynamic_friction > mat.static_friction && mat.static_friction > 0.0 {
                warnings.push("Dynamic friction typically should not exceed static friction".to_string());
            }
            
            if mat.restitution < 0.0 || mat.restitution > 1.0 {
                errors.push("Restitution (bounciness) must be between 0 and 1".to_string());
            }
            
            if let Some(density) = mat.density_kg_m3 {
                if density <= 0.0 {
                    errors.push("Density must be positive".to_string());
                } else if density > 25000.0 {
                    warnings.push("Density exceeds osmium (densest natural element)".to_string());
                }
            }
        }
        
        // Validate thermal properties
        if let Some(thermal) = &self.thermal {
            if let Some(conductivity) = thermal.conductivity_w_mk {
                if conductivity < 0.0 {
                    errors.push("Thermal conductivity cannot be negative".to_string());
                }
            }
            
            if let Some(melting_point) = thermal.melting_point_k {
                if melting_point < 0.0 {
                    errors.push("Melting point in Kelvin cannot be negative".to_string());
                }
            }
        }
        
        // Validate destruction properties
        if let Some(destruction) = &self.destruction {
            if destruction.destructible {
                if destruction.health.is_none() && destruction.max_health.is_none() {
                    warnings.push("Destructible objects should have health defined".to_string());
                }
                
                if let (Some(health), Some(max_health)) = (destruction.health, destruction.max_health) {
                    if health > max_health {
                        errors.push("Current health cannot exceed max health".to_string());
                    }
                    if max_health <= 0.0 {
                        errors.push("Max health must be positive for destructible objects".to_string());
                    }
                }
                
                if let Some(break_force) = destruction.break_force_n {
                    if break_force < 0.0 {
                        errors.push("Break force cannot be negative".to_string());
                    }
                }
            }
        }
        
        // Validate fluid interaction
        if let Some(fluid) = &self.fluid {
            if fluid.drag_coefficient < 0.0 {
                errors.push("Drag coefficient cannot be negative".to_string());
            }
        }
        
        // Validate physics layer (reasonable bounds)
        if self.physics_layer > 31 {
            warnings.push("Physics layer >31 may not be supported by some engines".to_string());
        }
        
        PhysicsValidationResult {
            is_valid: errors.is_empty(),
            errors,
            warnings,
        }
    }
    
    /// Simple validation that returns Result (for backward compatibility)
    pub fn validate(&self) -> Result<()> {
        let result = self.validate_comprehensive();
        if result.is_valid {
            Ok(())
        } else {
            Err(Drc369Error::PhysicsValidationFailed(result.errors.join("; ")))
        }
    }
    
    /// Check if physics properties are game-engine ready
    /// Returns true if the properties can be directly used in a physics simulation
    pub fn is_simulation_ready(&self) -> bool {
        // Must have rigid body for simulation
        if self.rigid_body.is_none() {
            return false;
        }
        
        // Validate without errors
        self.validate_comprehensive().is_valid
    }
    
    /// Serialize to JSON bytes for on-chain storage
    pub fn to_bytes(&self) -> Vec<u8> {
        serde_json::to_vec(self).unwrap_or_default()
    }
    
    /// Deserialize from JSON bytes
    pub fn from_bytes(bytes: &[u8]) -> Option<Self> {
        serde_json::from_slice(bytes).ok()
    }
    
    /// Deserialize and validate from bytes
    pub fn from_bytes_validated(bytes: &[u8]) -> Result<Self> {
        let props = Self::from_bytes(bytes)
            .ok_or_else(|| Drc369Error::InvalidMetadata("Failed to parse physics data".to_string()))?;
        props.validate()?;
        Ok(props)
    }
    
    /// Convert to JSON-LD format
    pub fn to_json_ld(&self) -> serde_json::Value {
        serde_json::json!({
            "@context": "https://demiurge.io/physics/v1",
            "@type": "drc:PhysicsProperties",
            "rigidBody": self.rigid_body,
            "material": self.material,
            "thermal": self.thermal,
            "destruction": self.destruction,
            "fluid": self.fluid,
        })
    }
}

/// Storage key prefix for physics data
pub const PHYSICS_STATE_PREFIX: &[u8] = b"DRC369:Physics:";

/// Get storage key for NFT physics
pub fn physics_key(nft_id: &[u8; 32]) -> Vec<u8> {
    let mut key = PHYSICS_STATE_PREFIX.to_vec();
    key.extend_from_slice(nft_id);
    key
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_physics_validation() {
        let mut props = PhysicsProperties::simple_box(1.0, [0.5, 0.5, 0.5]);
        assert!(props.validate().is_ok());
        
        props.rigid_body.as_mut().unwrap().mass_kg = -1.0;
        assert!(props.validate().is_err());
    }
    
    #[test]
    fn test_serialization() {
        let props = PhysicsProperties::simple_box(2.5, [1.0, 0.5, 0.3]);
        let bytes = props.to_bytes();
        let restored = PhysicsProperties::from_bytes(&bytes).unwrap();
        assert_eq!(restored.rigid_body.unwrap().mass_kg, 2.5);
    }
}
