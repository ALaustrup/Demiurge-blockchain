//! Module registry - manages all loaded modules

use std::collections::HashMap;
use crate::traits::{Module, ExecutionContext, ModuleError};
use demiurge_storage::Storage;
use thiserror::Error;

pub struct ModuleRegistry {
    modules: HashMap<String, Box<dyn Module>>,
}

impl Default for ModuleRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl ModuleRegistry {
    pub fn new() -> Self {
        Self {
            modules: HashMap::new(),
        }
    }

    pub fn register<M: Module + 'static>(&mut self, module: M) {
        let name = module.name().to_string();
        self.modules.insert(name, Box::new(module));
    }
    
    pub fn get(&self, module_name: &str) -> Option<&dyn Module> {
        self.modules.get(module_name).map(|m| m.as_ref())
    }

    /// Execute a call on a registered module
    pub fn execute(
        &self,
        module_name: &str,
        call: Vec<u8>,
        context: &ExecutionContext,
        storage: &dyn Storage,
    ) -> Result<(), RegistryError> {
        let module = self.modules
            .get(module_name)
            .ok_or_else(|| RegistryError::ModuleNotFound(module_name.to_string()))?;

        module.execute(call, context, storage)
            .map_err(RegistryError::ModuleError)
    }
    
    /// Get all registered module names
    pub fn module_names(&self) -> Vec<&str> {
        self.modules.keys().map(|s| s.as_str()).collect()
    }
}

#[derive(Error, Debug)]
pub enum RegistryError {
    #[error("Module not found: {0}")]
    ModuleNotFound(String),
    #[error("Module error: {0}")]
    ModuleError(#[from] ModuleError),
    #[error("Execution error: {0}")]
    ExecutionError(String),
}
