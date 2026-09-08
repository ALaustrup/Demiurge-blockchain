# 🧪 Demiurge Testnet

**Testnet deployment and testing infrastructure**

## Quick Start

```bash
# Build node
cd framework
cargo build --release

# Run testnet node
./target/release/demiurge-node --data-dir ./testnet-data
```

## Testnet Configuration

- **Chain Name**: Demiurge Testnet
- **Block Time**: 1 second
- **Finality**: < 2 seconds
- **RPC**: ws://127.0.0.1:9944
- **P2P**: /ip4/0.0.0.0/tcp/30333

## Testing

### 1. Start Node
```bash
cargo run --bin demiurge-node
```

### 2. Connect via RPC
```bash
# Using curl
curl -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"get_chain_info","id":1}' \
  http://127.0.0.1:9944
```

### 3. Submit Transaction
```bash
# TODO: Implement transaction submission
```

## Test Scenarios

1. **Block Production** - Verify blocks are produced
2. **Transaction Execution** - Test transaction flow
3. **Module Calls** - Test module execution
4. **Consensus** - Verify finality
5. **Networking** - Test P2P connections
6. **RPC** - Test API endpoints

## Status

🚧 **In Development** - Testnet setup pending
