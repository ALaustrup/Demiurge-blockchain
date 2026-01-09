# TORRNT - On-Chain Torrenting Application

**Decentralized torrenting with blockchain integration for the Demiurge ecosystem**

TORRNT is a Qt-based torrent client that integrates with the Demiurge blockchain to provide on-chain torrent registration, search, and peer reputation tracking.

## Features

- **Magnet Link Support** - Add torrents via magnet links
- **Torrent File Support** - Load `.torrent` files
- **On-Chain Registry** - Register and search torrents on the Demiurge blockchain
- **Peer Reputation** - Track and report peer activity for reputation system
- **Real-time Stats** - Monitor download/upload speeds, peers, and progress
- **Genesis Theme** - Beautiful UI matching the Demiurge ecosystem

## Prerequisites

### Required
- Qt 6.10+ (Core, Gui, Qml, Quick, QuickControls2, Network, Concurrent, Widgets)
- CMake 3.21+
- C++20 compiler (GCC 13+, MSVC 2022, Clang 15+)

### Optional (for full functionality)
- **libtorrent-rasterbar** - Core torrenting library
  - Windows: `vcpkg install libtorrent:x64-windows`
  - Linux: `sudo apt-get install libtorrent-rasterbar-dev`
  - macOS: `brew install libtorrent-rasterbar`

## Building

### Windows (MSVC)
```powershell
cd apps/torrnt
mkdir build
cd build
cmake .. -G "Visual Studio 17 2022" -A x64 -DCMAKE_PREFIX_PATH="C:\Qt\6.10.1\msvc2022_64"
cmake --build . --config Release
```

### Linux
```bash
cd apps/torrnt
mkdir build
cd build
cmake .. -DCMAKE_PREFIX_PATH=~/Qt/6.10.1/gcc_64
cmake --build . --config Release
```

### macOS
```bash
cd apps/torrnt
mkdir build
cd build
cmake .. -DCMAKE_PREFIX_PATH=~/Qt/6.10.1/macos
cmake --build . --config Release
```

## Usage

### Adding Torrents

1. **Magnet Link**: Paste a magnet link in the "Add Torrent" panel and click "Add Magnet Link"
2. **Torrent File**: Click "Browse Torrent File" to select a `.torrent` file
3. **On-Chain Search**: Click "Search On-Chain" to find torrents registered on the Demiurge blockchain

### Managing Torrents

- **Pause/Resume**: Click the pause/resume button on any torrent
- **Remove**: Click remove to stop and remove a torrent (files are preserved by default)
- **Monitor**: View real-time download/upload speeds, peer counts, and progress

### Blockchain Integration

- **Register Torrents**: Torrents can be registered on-chain for discovery
- **Search**: Find torrents registered by other users
- **Reputation**: Peer activity is tracked for reputation scoring

## Architecture

```
torrnt/
├── src/
│   ├── main.cpp                    # Application entry point
│   ├── TorrentManager.h/cpp        # Core torrenting logic (libtorrent)
│   ├── blockchain/
│   │   ├── BlockchainTorrentBridge.h/cpp  # Blockchain RPC integration
│   │   └── TorrentRegistry.h       # On-chain module interface
│   └── qml/
│       ├── MainWindow.qml          # Main UI
│       ├── components/
│       │   └── TorrentItem.qml      # Torrent display component
│       └── qml.qrc                  # QML resources
└── CMakeLists.txt
```

## On-Chain Module

The `torrent_registry` module on the Demiurge blockchain provides:

- `register_torrent` - Register a torrent with metadata
- `search_torrents` - Search for torrents by name/description
- `get_torrent` - Get detailed torrent metadata
- `report_peer_activity` - Report peer upload/download activity
- `get_peer_reputation` - Get peer reputation score

## P2P Foundation

TORRNT serves as the foundation for P2P functionality in the Demiurge ecosystem:

- **Peer Discovery** - Find peers via DHT and blockchain
- **Reputation System** - Track peer reliability and contribution
- **On-Chain Metadata** - Store torrent information on-chain for discovery
- **Payment Integration** - Future support for paid content via CGT

## Future Enhancements

- [ ] File dialog for torrent file selection
- [ ] Settings panel (download path, bandwidth limits, etc.)
- [ ] Peer details view
- [ ] Torrent creation (create .torrent files)
- [ ] CGT payment integration for premium content
- [ ] Encrypted peer connections
- [ ] WebRTC integration for NAT traversal

## License

Part of the Demiurge Blockchain ecosystem.
