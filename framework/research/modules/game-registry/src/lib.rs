//! # Game Registry Module
//!
//! On-chain registry for games in the Demiurge ecosystem.
//!
//! ## Features
//!
//! - Game registration with stake deposit (anti-spam)
//! - Category-based organization (miner, drc369, casual, multiplayer)
//! - Multi-engine support (Phaser, ScatterTXT, Unity, Unreal)
//! - Approval workflow for quality control
//! - Developer revenue sharing configuration

mod error;
mod registry;

pub use error::GameRegistryError;
pub use registry::*;
