# QØЯ - Demiurge Desktop Client

**QØЯ** (pronounced "core") is the complete native desktop client for the Demiurge blockchain ecosystem.

## What is QØЯ?

QØЯ represents the heart of Demiurge - a Qt6-based cross-platform desktop application that provides:

- **Full Chain Access** - Direct connection to the Demiurge blockchain
- **Abyss OS Environment** - The complete graphical operating system
- **Native Performance** - No browser limitations or sandboxing
- **Local Storage** - Unlimited storage using your machine's drives
- **Hardware Mining** - CPU/GPU mining with native performance
- **P2P Networking** - Content sharing and seeding for CGT rewards

## Architecture

```
QØЯ Desktop
├── Chain Layer (Rust/libp2p)
│   ├── Transaction signing
│   ├── Block validation
│   ├── P2P networking
│   └── Mining engine
│
├── Core (Qt/C++)
│   ├── Local SQLite database
│   ├── Secure credential vault
│   ├── File system access
│   └── System integration
│
└── Abyss OS (Qt WebEngine + Native)
    ├── Desktop environment
    ├── Native apps (NEON, WRYT, Files)
    ├── Abyss Explorer browser
    └── AbyssID/Wallet integration
```

## Features

- 🔗 **Full Blockchain Node** - Run as a validator or light node
- 🔐 **Native AbyssID** - Secure key storage using OS keychain
- 💰 **Abyss Wallet** - CGT and DRC-369 asset management
- ⛏️ **Mining Engine** - CPU/GPU mining with 5-10x web rates
- 🌐 **P2P Network** - Earn CGT by seeding content
- 🎵 **NEON Player** - Native media player with visualizers
- 📝 **WRYT Editor** - Document editing with all system fonts
- 📁 **Files Manager** - Full filesystem access
- 🌍 **Abyss Explorer** - Web3 browser component
- 🖥️ **System Tray** - Background operation with quick access
- 🔄 **Auto-Update** - Seamless updates

## Requirements

- Qt 6.6 or later with WebEngine, Sql, Multimedia, OpenGL
- CMake 3.20 or later
- C++17 compatible compiler
- SQLite3
- OpenSSL

## Building

### Prerequisites

**Ubuntu/Debian:**
```bash
sudo apt install qt6-base-dev qt6-webengine-dev qt6-webchannel-dev \
    qt6-multimedia-dev libsqlite3-dev libssl-dev cmake build-essential
```

**macOS:**
```bash
brew install qt@6 sqlite openssl cmake
```

**Windows:**
Download Qt 6.6+ from [qt.io](https://www.qt.io/download) with:
- Qt WebEngine
- Qt Multimedia
- Qt SQL
- Qt OpenGL

### Build Steps

```bash
cd apps/qor-desktop
cmake -B build -DCMAKE_PREFIX_PATH=/path/to/Qt/6.6.0/gcc_64
cmake --build build --config Release
```

### Run

```bash
# Linux/macOS
./build/QOR

# Windows
.\build\Release\QOR.exe
```

## Project Structure

```
qor-desktop/
├── CMakeLists.txt              # Build configuration
├── src/
│   ├── main.cpp                # Entry point
│   ├── core/                   # Application core (Phase 1)
│   │   ├── Application.cpp     # QApplication subclass
│   │   ├── Config.cpp          # User preferences
│   │   └── Logger.cpp          # Logging system
│   ├── ui/                     # User interface
│   │   ├── MainWindow.cpp      # Main window
│   │   ├── SystemTray.cpp      # System tray
│   │   ├── Desktop.cpp         # Desktop environment
│   │   ├── Taskbar.cpp         # Taskbar
│   │   └── AppLauncher.cpp     # App launcher
│   ├── storage/                # Local storage (Phase 1)
│   │   ├── LocalDatabase.cpp   # SQLite wrapper
│   │   ├── FileManager.cpp     # Filesystem access
│   │   └── SecureVault.cpp     # Encrypted credentials
│   ├── identity/               # Identity management
│   │   ├── AbyssIDManager.cpp  # AbyssID integration
│   │   └── WalletManager.cpp   # Wallet operations
│   ├── chain/                  # Chain integration
│   │   ├── ChainClient.cpp     # RPC communication
│   │   ├── TransactionQueue.cpp # Offline tx queue
│   │   └── SyncManager.cpp     # Online/offline sync
│   ├── network/                # P2P networking (Phase 3)
│   │   ├── P2PNode.cpp         # libp2p integration
│   │   └── ContentSharing.cpp  # File sharing
│   ├── mining/                 # Mining engine (Phase 2)
│   │   ├── MiningEngine.cpp    # Mining coordinator
│   │   ├── CPUMiner.cpp        # CPU mining
│   │   └── GPUMiner.cpp        # OpenCL GPU mining
│   ├── apps/                   # Native applications
│   │   ├── neon/               # NEON media player
│   │   ├── wryt/               # WRYT document editor
│   │   ├── files/              # Files manager
│   │   └── explorer/           # Abyss Explorer browser
│   └── resources/              # Icons and assets
├── web/                        # Bundled Abyss OS (from web build)
├── installer/                  # Platform installers
└── README.md
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+T | New Tab (Explorer) |
| Ctrl+W | Close Tab |
| Ctrl+R | Reload |
| Ctrl+Q | Quit |
| F11 | Toggle Fullscreen |
| F12 | Developer Tools |
| Alt+Left | Back |
| Alt+Right | Forward |
| Alt+Home | Home |

## Creating Installers

### Windows (MSI/NSIS)
```powershell
cd installer
./build-windows.ps1
```

### macOS (DMG)
```bash
cd installer
./build-macos.sh
```

### Linux (AppImage/Flatpak)
```bash
cd installer
./build-linux.sh
```

## Configuration

QØЯ stores configuration in:
- **Windows:** `%APPDATA%/Demiurge/QOR/`
- **macOS:** `~/Library/Application Support/Demiurge/QOR/`
- **Linux:** `~/.config/Demiurge/QOR/`

Secure credentials are stored in the OS keychain:
- **Windows:** Credential Manager
- **macOS:** Keychain
- **Linux:** Secret Service (GNOME Keyring/KWallet)

## License

Part of the DEMIURGE project. See main LICENSE file.

---

*QØЯ - The Core of Demiurge*
