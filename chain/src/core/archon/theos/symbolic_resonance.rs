//! Symbolic Resonance
//!
//! PHASE OMEGA PART V: Provides symbolic hooks for lore integration

use crate::core::archon::theos::myth_interpreter::MythicSymbol;
use serde::{Deserialize, Serialize};

/// Resonance measurement
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SymbolicResonance {
    pub symbol: String,
    pub resonance_strength: f64,
    pub alignment: f64,
}

/// Symbolic Resonance Analyzer
pub struct SymbolicResonanceAnalyzer;

impl SymbolicResonanceAnalyzer {
    /// Analyze resonance
    pub fn analyze(&self, symbols: &[MythicSymbol], current_state: &str) -> Vec<SymbolicResonance> {
        symbols.iter()
            .map(|symbol| {
                let resonance_strength = symbol.resonance;
                let alignment = if current_state.contains(&symbol.symbol) {
                    1.0
                } else {
                    0.5
                };
                
                SymbolicResonance {
                    symbol: symbol.symbol.clone(),
                    resonance_strength,
                    alignment,
                }
            })
            .collect()
    }

    /// Get total resonance
    pub fn get_total_resonance(&self, resonances: &[SymbolicResonance]) -> f64 {
        if resonances.is_empty() {
            return 0.0;
        }
        
        resonances.iter()
            .map(|r| r.resonance_strength * r.alignment)
            .sum::<f64>() / resonances.len() as f64
    }
}
