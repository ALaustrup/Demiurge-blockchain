//! God-Net Fabric
//!
//! PHASE OMEGA PART IV: Connects all Demiurge instances into a living mesh
//! Provides LAN synchronization, node alignment, and respectful node management

pub mod fabric_mesh;
pub mod link_resonance;
pub mod mesh_topology;
pub mod mesh_convergence;
pub mod lan_synchronization;

pub use fabric_mesh::{FabricMesh, NodeId, NodeInfo, MeshLink};
pub use link_resonance::{LinkResonance, ResonanceMeasurement, ResonanceQuality};
pub use mesh_topology::{MeshTopology, TopologyMetrics};
pub use mesh_convergence::{MeshConvergence, ConvergenceState, ConvergenceMetrics};
pub use lan_synchronization::{LanSynchronization, LanNodeInfo, LanSyncStatus, RespectLevel};
