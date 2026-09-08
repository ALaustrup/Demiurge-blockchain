//! Module system - our replacement for Substrate pallets

pub mod registry;
pub mod traits;

pub use registry::ModuleRegistry;
pub use traits::{Module, ExecutionContext, ModuleError};
