//! Quantum Forecasting Engine
//!
//! PHASE OMEGA PART III: Predicts and simulates future system state

pub mod trend_predictor;
pub mod shock_detector;
pub mod future_simulator;

pub use trend_predictor::{TrendPredictor, TrendPrediction};
pub use shock_detector::{ShockDetector, ShockDetection, ShockType};
pub use future_simulator::{FutureSimulator, SimulationResult};
