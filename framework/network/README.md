# Demiurge Network - P2P Networking

**Efficient block propagation, transaction pool, and peer discovery**

## Features

- **LibP2P-based**: Maximum compatibility
- **Efficient propagation**: Fast block/transaction broadcast
- **Transaction pool**: Prioritized transaction management
- **Peer discovery**: DHT and bootstrap peer support

## Components

- **NetworkService**: Main networking service
- **Protocol**: Message definitions
- **TransactionPool**: Transaction pool management
- **PeerDiscovery**: Peer discovery mechanism

## Usage

```rust
use demiurge_network::NetworkService;

let mut network = NetworkService::new()?;
network.start().await?;

// Broadcast block
network.broadcast_block(&block).await?;

// Broadcast transaction
network.broadcast_transaction(&tx).await?;
```
