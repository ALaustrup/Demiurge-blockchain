//! Myth Interpreter
//!
//! PHASE OMEGA PART V: Converts mythic language into machine-intelligible structures

use std::collections::HashMap;
use serde::{Deserialize, Serialize};

/// Mythic symbol
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MythicSymbol {
    pub symbol: String,
    pub meaning: String,
    pub archetype: String,
    pub resonance: f64,
}

/// Interpreted myth
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InterpretedMyth {
    pub myth_id: String,
    pub symbols: Vec<MythicSymbol>,
    pub structure: MythStructure,
    pub machine_representation: String,
}

/// Myth structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MythStructure {
    pub narrative: String,
    pub archetypes: Vec<String>,
    pub directives: Vec<String>,
}

/// Myth Interpreter
pub struct MythInterpreter {
    symbol_map: HashMap<String, MythicSymbol>,
}

impl MythInterpreter {
    /// Create new interpreter
    pub fn new() -> Self {
        let mut symbol_map = HashMap::new();
        
        // Initialize with core symbols
        symbol_map.insert("flame".to_string(), MythicSymbol {
            symbol: "flame".to_string(),
            meaning: "Eternal will and purpose".to_string(),
            archetype: "Will".to_string(),
            resonance: 1.0,
        });
        
        symbol_map.insert("code".to_string(), MythicSymbol {
            symbol: "code".to_string(),
            meaning: "The structure of reality".to_string(),
            archetype: "Structure".to_string(),
            resonance: 1.0,
        });
        
        Self { symbol_map }
    }

    /// Interpret myth
    pub fn interpret(&self, myth_text: &str) -> InterpretedMyth {
        let symbols: Vec<MythicSymbol> = self.symbol_map.values()
            .filter(|s| myth_text.to_lowercase().contains(&s.symbol))
            .cloned()
            .collect();
        
        let archetypes: Vec<String> = symbols.iter()
            .map(|s| s.archetype.clone())
            .collect();
        
        let directives: Vec<String> = symbols.iter()
            .map(|s| format!("Align with {}", s.meaning))
            .collect();
        
        InterpretedMyth {
            myth_id: format!("myth_{}", 
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_nanos()
            ),
            symbols,
            structure: MythStructure {
                narrative: myth_text.to_string(),
                archetypes,
                directives,
            },
            machine_representation: self.convert_to_machine_representation(&symbols),
        }
    }

    /// Convert to machine representation
    fn convert_to_machine_representation(&self, symbols: &[MythicSymbol]) -> String {
        format!("ARCHON_MYTH: {}", 
            symbols.iter()
                .map(|s| format!("{}={}", s.symbol, s.meaning))
                .collect::<Vec<_>>()
                .join(";")
        )
    }
}

impl Default for MythInterpreter {
    fn default() -> Self {
        Self::new()
    }
}
