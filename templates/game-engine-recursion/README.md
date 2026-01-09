# Recursion Engine - Qt-Based Game Engine

A full-featured game engine for the Demiurge Blockchain using Qt 3D/Quick 3D for rendering.

## 🎮 Features

- **Qt Quick 3D Rendering** - Hardware-accelerated 3D graphics
- **Blockchain Integration** - Real-time chain events trigger in-game reactions
- **Entity-Component System** - Flexible game object management
- **RPC Client** - Direct connection to Demiurge blockchain
- **Recursion World Support** - Load and interact with on-chain worlds
- **NFT Integration** - NFT mints spawn in-game objects
- **State Snapshots** - Export world state for on-chain persistence

## 🏗️ Architecture

```
Recursion Engine
├── RecursionEngine (Qt/C++) - Main engine controller
├── BlockchainRPC - RPC client for chain operations
├── EntityManager - Entity-Component-System
├── GameRenderer - Qt 3D rendering system
├── RecursionWorld (C++) - World state and tick loop
└── QML/Quick 3D - 3D scene rendering and UI
```

## 📋 Prerequisites

- **Qt 6.10+** with:
  - Qt Core, Gui, Qml, Quick
  - Qt Quick 3D
  - Qt Quick 3D Runtime
  - Qt Quick 3D Asset Import
  - Qt Network
  - Qt OpenGL
  - Qt Multimedia
  - Qt Gamepad (optional)
- **CMake 3.20+**
- **C++20 compiler**

## 🚀 Building

### Windows
```powershell
cd templates\game-engine-recursion
mkdir build
cd build
cmake .. -G "Visual Studio 17 2022" -A x64 -DCMAKE_PREFIX_PATH="C:\Qt\6.10.1\msvc2022_64"
cmake --build . --config Release
```

### Linux/macOS
```bash
cd templates/game-engine-recursion
mkdir build && cd build
cmake .. -DCMAKE_PREFIX_PATH="$HOME/Qt/6.10.1/gcc_64"
cmake --build . -j$(nproc)
```

## 🎯 Usage

### Basic Usage
```bash
./recursion
```

### Load Specific World
```bash
./recursion --world-id my_world_id
```

### Custom RPC Endpoint
```bash
./recursion --rpc-url https://rpc.demiurge.cloud/rpc
```

## 🎨 Qt Graphics Features Used

### Qt Quick 3D
- **3D Rendering** - Hardware-accelerated OpenGL/Vulkan rendering
- **Models** - Import 3D models or use primitives
- **Materials** - PBR (Physically Based Rendering) materials
- **Lighting** - Directional, point, and ambient lights
- **Cameras** - Perspective and orthographic cameras
- **Animations** - Property animations for smooth transitions

### Qt Quick
- **UI Overlay** - HUD, menus, and controls
- **Input Handling** - Mouse, keyboard, gamepad
- **State Management** - QML bindings for reactive updates

### Qt Network
- **RPC Client** - JSON-RPC 2.0 for blockchain communication
- **Event Subscription** - Real-time chain event updates

## 🔗 Blockchain Integration

### RPC Methods
- `recursion_getWorld(worldId)` - Load world metadata
- `recursion_createWorld(worldData)` - Create new world
- `recursion_listWorldsByOwner(owner)` - List user's worlds

### Chain Events
- **NFT Mint** - Spawns NFT objects in the world
- **CGT Transfer** - Updates entity properties
- **Recursion Object Created** - Adds new entities

## 🎮 Game Loop

1. **Initialize** - Load world from blockchain
2. **Tick Loop** - 60 FPS game simulation
3. **Update Entities** - Process entity logic
4. **Render** - Qt Quick 3D renders scene
5. **Handle Events** - Process chain events and input

## 📦 Entity System

### Entity Types
- **nft_object** - NFT representations
- **recursion_object** - Permanent on-chain objects
- **player** - Player entities
- **custom** - User-defined entity types

### Entity Properties
- Position (QVector3D)
- Rotation (QQuaternion)
- Scale (QVector3D)
- Custom properties (QJsonObject)

## 🎨 Rendering

### Scene Setup
- **Ground Plane** - Grid-based world floor
- **Lighting** - Directional sun + ambient
- **Camera** - Mouse-controlled perspective camera
- **Entities** - Dynamically rendered game objects

### Materials
- **PBR Materials** - Physically based rendering
- **Emissive** - Glowing effects for blockchain objects
- **Genesis Theme** - Flame orange (#FF3D00) and Cipher cyan (#00FFC8)

## 🔄 State Management

### World State
- Tick count
- Accumulated time
- Event history
- Entity states

### Export Snapshot
```cpp
QJsonObject snapshot = engine.exportStateSnapshot();
// Can be persisted on-chain
```

## 🚀 Future Enhancements

- **Physics Simulation** - Qt Physics integration
- **Multiplayer** - Real-time networking
- **Asset Loading** - Load models from Fabric/IPFS
- **Advanced Shaders** - Custom GLSL shaders
- **VR Support** - VR rendering pipeline
- **Archon AI** - NPCs powered by Archon agents

## 📚 Resources

- [Qt Quick 3D Documentation](https://doc.qt.io/qt-6/qtquick3d-index.html)
- [Qt 3D Documentation](https://doc.qt.io/qt-6/qt3d-index.html)
- [Demiurge Blockchain RPC](https://docs.demiurge.cloud/api/rpc)

---

**The Recursion Engine - Where blockchain meets reality.**
