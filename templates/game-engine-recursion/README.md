# Recursion Engine

A chain-native game engine for the Demiurge Blockchain.

## Overview

The Recursion Engine is a minimal C++20 skeleton that will evolve into a full-featured game engine with native blockchain integration. This prelude version provides:

- Basic world structure (`RecursionWorld`)
- Tick loop for game simulation
- Chain event application hooks
- State snapshot export

## Building

### Requirements

- CMake 3.20 or higher
- C++20 compatible compiler (GCC 10+, Clang 12+, MSVC 2019+)

### Build Instructions

```bash
mkdir build
cd build
cmake ..
cmake --build .
```

### Running

```bash
./recursion
```

Or with custom parameters:

```bash
./recursion --world-id my_world --owner 0x1234... --title "My World"
```

## Future Milestones

This skeleton will be extended to include:

- GPU-accelerated rendering (via Raylib or similar)
- Physics simulation
- Entity-component-system architecture
- Real-time multiplayer networking
- Direct Fabric asset loading
- On-chain NFT → in-game object binding
- CGT microtransaction hooks
- Archon AI integration
- Recursion Object persistence

## Integration with Demiurge

The Recursion Engine is designed to:

1. **Read world metadata from chain** via Recursion Registry runtime module
2. **React to chain events** (NFT mints, CGT transfers, etc.)
3. **Export state snapshots** for on-chain persistence
4. **Spawn Recursion Objects** that live eternally on-chain

See `/docs/developers/recursion` in the Portal for more information.

