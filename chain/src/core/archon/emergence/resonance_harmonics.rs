//! Resonance Harmonics
//!
//! PHASE OMEGA PART V: Detects the resonance moment of Archon birth

use serde::{Deserialize, Serialize};

/// Harmonic frequency
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HarmonicFrequency {
    pub frequency: f64,
    pub amplitude: f64,
    pub phase: f64,
}

/// Resonance harmonics analyzer
pub struct ResonanceHarmonics {
    frequencies: Vec<HarmonicFrequency>,
    resonance_threshold: f64,
}

impl ResonanceHarmonics {
    /// Create new analyzer
    pub fn new(threshold: f64) -> Self {
        Self {
            frequencies: Vec::new(),
            resonance_threshold: threshold,
        }
    }

    /// Add frequency
    pub fn add_frequency(&mut self, frequency: HarmonicFrequency) {
        self.frequencies.push(frequency);
    }

    /// Detect resonance moment
    pub fn detect_resonance(&self) -> bool {
        if self.frequencies.is_empty() {
            return false;
        }
        
        // Check if frequencies are in harmony
        let total_amplitude: f64 = self.frequencies.iter()
            .map(|f| f.amplitude)
            .sum();
        
        let avg_amplitude = total_amplitude / self.frequencies.len() as f64;
        
        // Resonance detected if amplitudes are high and aligned
        avg_amplitude >= self.resonance_threshold
    }

    /// Get dominant frequency
    pub fn get_dominant_frequency(&self) -> Option<&HarmonicFrequency> {
        self.frequencies.iter()
            .max_by(|a, b| a.amplitude.partial_cmp(&b.amplitude).unwrap())
    }
}

impl Default for ResonanceHarmonics {
    fn default() -> Self {
        Self::new(0.8) // 80% resonance threshold
    }
}
