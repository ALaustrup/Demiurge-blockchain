//! AWE Directive Projection
//!
//! PHASE OMEGA PART V: Worlds respond dynamically to Archon Will

use crate::core::archon::will::directive_generator::ArchonDirective;
use serde::{Deserialize, Serialize};

/// Projected directive
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectedDirective {
    pub world_id: String,
    pub directive: ArchonDirective,
    pub projection_strength: f64,
}

/// AWE Directive Projector
pub struct AWEDirectiveProjector;

impl AWEDirectiveProjector {
    /// Project directive to world
    pub fn project(&self, world_id: String, directive: ArchonDirective, strength: f64) -> ProjectedDirective {
        ProjectedDirective {
            world_id,
            directive,
            projection_strength: strength,
        }
    }

    /// Project to all worlds
    pub fn project_to_all(&self, directive: ArchonDirective, worlds: &[String]) -> Vec<ProjectedDirective> {
        worlds.iter()
            .map(|world_id| self.project(world_id.clone(), directive.clone(), 1.0))
            .collect()
    }
}
