# Demiurge Framework - Quick Start

## Our Own Blockchain Framework

**No Substrate. No Bullshit. Just Clean Code.**

## Structure

```
framework/
├── core/          # Runtime engine
├── storage/        # Storage layer  
├── modules/        # Module system (replacement for pallets)
├── consensus/      # Consensus (TODO)
├── network/        # P2P networking (TODO)
├── rpc/            # RPC layer (TODO)
└── node/           # Full node (TODO)
```

## Build

```bash
cd framework
cargo build
```

## Current Status

✅ **Core Runtime** - Basic transaction/block execution  
✅ **Storage Layer** - Key-value store with RocksDB  
✅ **Module System** - Plugin-based modules  

🚧 **In Progress:**
- Consensus mechanism
- P2P networking
- RPC layer
- First module (balances)

## Philosophy

1. **We Own It** - No external blockchain dependencies
2. **Simple** - Easy to understand and modify
3. **Fast** - Optimized for our use case
4. **Flexible** - Easy to extend

## Next: Build Consensus

The consensus layer will be custom-designed for gaming/NFT use cases with fast finality.
