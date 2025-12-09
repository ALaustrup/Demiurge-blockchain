//! God-Net Quantum Predictor
//!
//! PHASE OMEGA PART IV: Predicts and simulates God-Net behavior

pub mod global_trend_predictor;
pub mod multi_node_future_simulator;
pub mod cascade_detector;

pub use global_trend_predictor::{GlobalTrendPredictor, GlobalTrendPrediction};
pub use multi_node_future_simulator::{MultiNodeFutureSimulator, MultiNodeSimulation};
pub use cascade_detector::{CascadeDetector, CascadeDetection, CascadeType};
