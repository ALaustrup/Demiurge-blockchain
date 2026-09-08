//! # Demiurge RPC - JSON-RPC + WebSocket API
//!
//! Complete RPC layer for external access to the blockchain.
//! Supports JSON-RPC 2.0 and WebSocket subscriptions.


pub mod server;
pub mod methods;
pub mod subscriptions;
pub mod error;

pub use server::{RpcServer, registered_methods};
pub use methods::RpcMethods;
pub use subscriptions::SubscriptionManager;
pub use error::{RpcError, Result};
