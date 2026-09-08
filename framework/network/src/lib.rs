//! # Demiurge Network - P2P Networking Layer (The Nervous System)
//!
//! Efficient block propagation, transaction pool, and peer discovery.
//! Built on LibP2P for maximum compatibility.
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────┐
//! │                    DEMIURGE NETWORK LAYER                        │
//! ├─────────────────────────────────────────────────────────────────┤
//! │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
//! │  │  GOSSIPSUB  │  │  KADEMLIA   │  │      IDENTIFY           │  │
//! │  │  (Blood)    │  │  (Sensors)  │  │      (Recognition)      │  │
//! │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
//! │         │                │                     │                 │
//! │         └────────────────┼─────────────────────┘                 │
//! │                          ▼                                       │
//! │                  ┌───────────────┐                               │
//! │                  │ SWARM MANAGER │                               │
//! │                  │  (The Heart)  │                               │
//! │                  └───────────────┘                               │
//! └─────────────────────────────────────────────────────────────────┘
//! ```

pub mod service;
pub mod protocol;
pub mod pool;
pub mod discovery;
pub mod swarm;
pub mod error;

pub use service::NetworkService;
pub use protocol::{Protocol, Message};
pub use pool::TransactionPool;
pub use discovery::PeerDiscovery;
pub use swarm::{SwarmManager, NetworkEvent, SwarmCommand, DemiurgeBehaviour};
pub use error::{NetworkError, Result};
