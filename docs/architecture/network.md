# Network Layer

Demiurge uses LibP2P for peer-to-peer networking.

---

## Overview

| Component | Technology |
|-----------|------------|
| Transport | TCP + Noise encryption |
| Discovery | Kademlia DHT |
| Messaging | Gossipsub |
| Identity | Ed25519 PeerId |

---

## Network Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     NETWORK SERVICE                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Gossipsub  │  │  Kademlia   │  │  Identify   │     │
│  │  (Pubsub)   │  │  (DHT)      │  │  (Handshake)│     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Transaction Pool                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                    LibP2P Swarm                         │
│                 (TCP + Noise + Yamux)                   │
└─────────────────────────────────────────────────────────┘
```

---

## Gossipsub Topics

| Topic | Purpose | Message Type |
|-------|---------|--------------|
| `/demiurge/blocks/1` | Block announcements | Signed block |
| `/demiurge/transactions/1` | Transaction propagation | Signed transaction |
| `/demiurge/consensus/1` | BFT voting messages | Vote/Commit |

---

## Peer Discovery

### Bootstrap Nodes

```toml
[network]
bootstrap_peers = [
    "/ip4/127.0.0.1/tcp/30333/p2p/12D3Koo..."
]
```

### Kademlia DHT

- Distributed hash table for peer discovery
- Automatically finds peers
- Stores peer routing information

### mDNS (Local)

- Discovers peers on local network
- Useful for development/testing

---

## Message Protocol

### Block Announcement

```rust
pub struct BlockAnnouncement {
    pub block: SignedBlock,
    pub from: PeerId,
}
```

Flow:
1. Validator produces block
2. Gossipsub publishes to `/demiurge/blocks/1`
3. Peers validate and store
4. Peers forward to their peers

### Transaction Propagation

```rust
pub struct TransactionMessage {
    pub transaction: SignedTransaction,
    pub from: PeerId,
}
```

Flow:
1. User submits via RPC
2. Node adds to local pool
3. Gossipsub publishes to `/demiurge/transactions/1`
4. Peers add to their pools

---

## Transaction Pool

The transaction pool manages pending transactions:

```rust
pub struct TransactionPool {
    pending: HashMap<[u8; 32], Transaction>,
    max_size: usize,
    max_per_account: usize,
}

impl TransactionPool {
    /// Add transaction to pool
    pub fn add(&mut self, tx: Transaction) -> Result<(), PoolError>;
    
    /// Get transactions for block
    pub fn get_pending(&self, limit: usize) -> Vec<Transaction>;
    
    /// Remove included transactions
    pub fn remove_included(&mut self, txs: &[Transaction]);
}
```

### Pool Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `max_size` | 10,000 | Maximum pending transactions |
| `max_per_account` | 100 | Per-account limit |
| `ttl_seconds` | 3600 | Transaction expiry |

---

## Configuration

### Node Configuration

```toml
[network]
listen_addr = "0.0.0.0:30333"
external_addr = "127.0.0.1:30333"
max_peers = 50
bootstrap_peers = [
    "/ip4/127.0.0.1/tcp/30333/p2p/12D3Koo..."
]

[network.gossipsub]
mesh_n = 6
mesh_n_low = 4
mesh_n_high = 12
gossip_lazy = 6
heartbeat_interval_ms = 1000
```

### Command Line

```bash
./demiurge-node \
  --p2p-addr 0.0.0.0:30333 \
  --external-addr 127.0.0.1:30333 \
  --bootnodes /ip4/x.x.x.x/tcp/30333/p2p/12D3Koo...
```

---

## Network Events

The network service emits events for the node to handle:

```rust
pub enum NetworkEvent {
    /// New block received
    BlockReceived { block: Block, from: PeerId },
    
    /// New transaction received
    TransactionReceived { tx: Transaction, from: PeerId },
    
    /// Peer connected
    PeerConnected { peer_id: PeerId },
    
    /// Peer disconnected
    PeerDisconnected { peer_id: PeerId },
    
    /// CVP mutation announced
    CvpMutationAnnounced { contract_id: [u8; 32], epoch: u64 },
}
```

---

## Security

### Peer Authentication

- All connections use Noise protocol
- PeerId derived from Ed25519 public key
- Mutual authentication on connect

### Message Validation

- Blocks validated before forwarding
- Transactions verified (signature, balance)
- Invalid messages dropped, sender scored

### Rate Limiting

- Per-peer message limits
- Gossipsub scoring for misbehavior
- Automatic peer banning

### Eclipse Attack Prevention

- Multiple bootstrap nodes
- Diverse peer selection
- DHT refresh intervals

---

## Monitoring

### Peer Count

```bash
# RPC method
curl -X POST http://localhost:9944 \
  -d '{"jsonrpc":"2.0","id":1,"method":"network_peerCount","params":[]}'
```

### Network Status

```bash
# RPC method  
curl -X POST http://localhost:9944 \
  -d '{"jsonrpc":"2.0","id":1,"method":"network_status","params":[]}'
```

### Logs

```bash
# Enable network debug logging
RUST_LOG=demiurge_network=debug ./demiurge-node
```

---

## Implementation

**Location:** `framework/network/`

| File | Purpose |
|------|---------|
| `service.rs` | Network service orchestration |
| `swarm.rs` | LibP2P swarm management |
| `protocol.rs` | Wire protocol definitions |
| `pool.rs` | Transaction pool |
| `discovery.rs` | Peer discovery |

---

## Troubleshooting

### No Peers Connecting

1. Check firewall (port 30333)
2. Verify bootstrap node addresses
3. Check `--external-addr` matches public IP

### High Latency

1. Check network connectivity
2. Reduce `mesh_n_high` for fewer connections
3. Increase `heartbeat_interval_ms`

### Transaction Not Propagating

1. Check transaction validity
2. Verify pool not full
3. Check gossipsub topic subscription

---

## Further Reading

- [Architecture Overview](./README.md)
- [Deployment Guide](../operations/deployment.md)
- [Testnet Setup](../operations/testnet.md)
