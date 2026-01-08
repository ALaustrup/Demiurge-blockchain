# Genesis Launcher

**The Gateway to the Demiurge Blockchain Ecosystem**

Genesis Launcher is a unified application that serves as:
- 🔐 **Authenticator** - AbyssID login with secure key vault
- 📦 **Installer** - Downloads and installs QOR Desktop and Miner
- 🔄 **Updater** - Automatic differential updates
- 🚀 **Launcher** - Gateway to choose between modes

## The Fork

Upon authentication, users choose their path:

### 🔧 The Construct (Miner + Wallet)
*"Low Latency. Pure Profit."*

A lightweight daemon that runs in the system tray. No heavy desktop overhead.
- Mining threads management
- Wallet balance and transactions
- Minimal resource usage

### 🌌 Enter Abyss (Full OS)
*"Full Immersion. The Desktop."*

Launches the complete QOR Desktop Environment - the full Abyss OS experience.
- Complete desktop environment
- All applications available
- Full feature set

## Architecture

```
genesis-launcher/
├── src/
│   ├── core/          # LauncherCore, ProcessManager
│   ├── auth/          # AuthManager, KeyVault, SessionToken
│   ├── ipc/           # IPCServer/Client for SSO
│   ├── updater/       # UpdateEngine, DeltaPatcher
│   ├── miner/         # DemiurgeMiner daemon
│   ├── qml/           # QML UI (Obsidian Monolith theme)
│   └── resources/     # Icons, fonts, textures
├── bootstrap/         # GenesisSeed (lightweight installer)
├── scripts/           # Build and deployment scripts
└── CMakeLists.txt
```

## Building

### Requirements
- Qt 6.10+ (with Quick, QuickControls2, Network, Widgets)
- CMake 3.21+
- C++17 compiler (GCC 13+, MSVC 2022, Clang 15+)

### Windows
```powershell
.\scripts\build-all.ps1 -QtPath "C:\Qt\6.10.1\mingw_64"
```

### Linux/macOS
```bash
python scripts/deploy.py --qt-path ~/Qt/6.10.1/gcc_64
```

## IPC (Inter-Process Communication)

Genesis Launcher provides Single Sign-On (SSO) to child processes:

1. **QLocalServer** - Named pipe for secure local communication
2. **QSharedMemory** - Fast session token access

Child processes (QOR, DemiurgeMiner) connect to the launcher and receive
authentication tokens automatically - no need for users to login twice.

## Security

- **DPAPI (Windows)** - Master key encrypted with Windows Data Protection API
- **Keychain (macOS)** - Native Keychain Services integration
- **libsecret (Linux)** - GNOME Keyring / KWallet support
- **PBKDF2** - Password-based key derivation (10,000 iterations)

## Deployment

The launcher supports:
- **Windows**: NSIS installer + portable ZIP
- **Linux**: AppImage + .deb/.rpm packages
- **macOS**: DMG disk image

## License

Part of the Demiurge Blockchain ecosystem.
