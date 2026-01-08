# QOR Explorer Desktop Application

A Qt-based cross-platform desktop application providing the complete QOR OS experience as a standalone application.

## Overview

QOR Explorer Desktop brings the full Demiurge blockchain experience to users without requiring a web browser. Built with Qt 6 and QtWebEngine, it provides:

- **Native Performance**: Hardware-accelerated rendering
- **Full Web3 Support**: No iframe restrictions, direct wallet integration
- **Cross-Platform**: Windows, macOS, and Linux support
- **Complete QOR OS**: All features from the web portal
- **Offline Capable**: Local caching and offline mode
- **System Integration**: Native notifications, file associations, system tray

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    QOR Explorer Desktop                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Qt UI      │  │  WebEngine   │  │   Native     │          │
│  │   Layer      │  │   View       │  │   Modules    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│  ┌──────┴─────────────────┴──────────────────┴───────┐          │
│  │              Qt C++ Bridge Layer                   │          │
│  │  - Window Management                               │          │
│  │  - File System Access                              │          │
│  │  - Native Dialogs                                  │          │
│  │  - System Tray                                     │          │
│  │  - Auto-Updates                                    │          │
│  └──────────────────────┬────────────────────────────┘          │
│                         │                                        │
│  ┌──────────────────────┴────────────────────────────┐          │
│  │              QOR OS Web Application               │          │
│  │  (Same React codebase as web portal)              │          │
│  └───────────────────────────────────────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **UI Framework** | Qt 6.5+ | Cross-platform native UI |
| **Web Engine** | QtWebEngine | Chromium-based web rendering |
| **Language** | C++ / QML | Native code, declarative UI |
| **Build System** | CMake | Cross-platform builds |
| **Installer** | Qt Installer Framework | Windows/Mac/Linux installers |
| **Updates** | Qt Auto-Updater | Automatic updates |
| **Web Content** | React (QLOUD OS) | Existing web codebase |

---

## Directory Structure

```
apps/abyss-explorer-desktop/
├── CMakeLists.txt              # Main CMake config
├── src/
│   ├── main.cpp                # Application entry
│   ├── MainWindow.cpp          # Main window
│   ├── MainWindow.h
│   ├── BrowserView.cpp         # WebEngine view
│   ├── BrowserView.h
│   ├── SystemTray.cpp          # System tray
│   ├── SystemTray.h
│   ├── QorIDManager.cpp      # QOR ID native integration
│   ├── QorIDManager.h
│   ├── WalletBridge.cpp        # Wallet native bridge
│   ├── WalletBridge.h
│   ├── UpdateManager.cpp       # Auto-updates
│   ├── UpdateManager.h
│   └── resources/
│       ├── icons/
│       │   ├── app.ico         # Windows icon
│       │   ├── app.icns        # macOS icon
│       │   └── app.png         # Linux icon
│       └── qml/
│           └── main.qml        # Optional QML UI
├── web/                        # Bundled QOR OS web app
│   └── (built from qloud-os)
├── installer/
│   ├── config/
│   │   └── config.xml
│   ├── packages/
│   │   └── com.demiurge.abyssexplorer/
│   │       ├── meta/
│   │       │   └── package.xml
│   │       └── data/
│   └── scripts/
│       ├── build-installer.sh
│       └── build-installer.ps1
└── README.md
```

---

## Core Features

### 1. Native Window Management

```cpp
// MainWindow.h
class MainWindow : public QMainWindow {
    Q_OBJECT
    
public:
    MainWindow(QWidget *parent = nullptr);
    
    void setNavBarPosition(NavPosition position);
    void toggleFullscreen();
    void toggleDevTools();
    
private:
    BrowserView *m_browserView;
    SystemTray *m_systemTray;
    NavPosition m_navPosition = NavPosition::Top;
    
signals:
    void navPositionChanged(NavPosition position);
};
```

### 2. WebEngine Integration

```cpp
// BrowserView.h
class BrowserView : public QWebEngineView {
    Q_OBJECT
    
public:
    BrowserView(QWidget *parent = nullptr);
    
    // Inject QOR OS bridge
    void injectAbyssBridge();
    
    // Handle Web3 requests from the page
    Q_INVOKABLE QString signMessage(const QString &message);
    Q_INVOKABLE QString getAddress();
    Q_INVOKABLE QJsonObject getChainStatus();
    
private:
    QWebChannel *m_channel;
    QorIDManager *m_abyssId;
    WalletBridge *m_wallet;
    
protected:
    void contextMenuEvent(QContextMenuEvent *event) override;
};
```

### 3. QorID Native Integration

```cpp
// QorIDManager.h
class QorIDManager : public QObject {
    Q_OBJECT
    Q_PROPERTY(bool isAuthenticated READ isAuthenticated NOTIFY authChanged)
    Q_PROPERTY(QString username READ username NOTIFY authChanged)
    
public:
    QorIDManager(QObject *parent = nullptr);
    
    Q_INVOKABLE bool login();
    Q_INVOKABLE void logout();
    Q_INVOKABLE QString signMessage(const QString &message);
    Q_INVOKABLE QString getPublicKey();
    
    bool isAuthenticated() const;
    QString username() const;
    
signals:
    void authChanged();
    void signatureRequested(const QString &message);
    void signatureCompleted(const QString &signature);
    
private:
    QString m_username;
    QByteArray m_privateKey;
    QByteArray m_publicKey;
    bool m_authenticated = false;
    
    // Secure storage
    void saveToKeychain();
    void loadFromKeychain();
};
```

### 4. System Tray

```cpp
// SystemTray.h
class SystemTray : public QSystemTrayIcon {
    Q_OBJECT
    
public:
    SystemTray(MainWindow *mainWindow);
    
    void showNotification(const QString &title, const QString &message);
    void updateStatus(bool connected, int blockHeight);
    
private:
    QMenu *createContextMenu();
    MainWindow *m_mainWindow;
    
private slots:
    void onActivated(QSystemTrayIcon::ActivationReason reason);
};
```

### 5. Auto-Update System

```cpp
// UpdateManager.h
class UpdateManager : public QObject {
    Q_OBJECT
    
public:
    UpdateManager(QObject *parent = nullptr);
    
    Q_INVOKABLE void checkForUpdates();
    Q_INVOKABLE void downloadUpdate();
    Q_INVOKABLE void installUpdate();
    
signals:
    void updateAvailable(const QString &version, const QString &changelog);
    void downloadProgress(int percent);
    void updateReady();
    void updateError(const QString &error);
    
private:
    QString m_updateUrl = "https://releases.demiurge.cloud/desktop/";
    QString m_currentVersion;
    QString m_newVersion;
};
```

---

## Build Instructions

### Prerequisites

```bash
# Ubuntu/Debian
sudo apt install qt6-base-dev qt6-webengine-dev cmake build-essential

# macOS
brew install qt@6

# Windows
# Download Qt from qt.io, install with WebEngine component
```

### Build

```bash
cd apps/abyss-explorer-desktop

# Configure
cmake -B build -DCMAKE_PREFIX_PATH=/path/to/Qt/6.5.0/gcc_64

# Build
cmake --build build --config Release

# Run
./build/AbyssExplorer
```

### Create Installers

```bash
# Build web content first
cd ../qloud-os
pnpm build
cp -r dist ../abyss-explorer-desktop/web/

# Build installer
cd ../abyss-explorer-desktop/installer
./scripts/build-installer.sh
```

---

## Platform-Specific Notes

### Windows

- **Installer**: MSI package via Qt Installer Framework
- **Auto-start**: Registry entry in `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`
- **File associations**: `.drc369`, `.abyss` files
- **Protocol handler**: `abyss://` URL scheme

### macOS

- **Installer**: DMG with drag-to-Applications
- **Code signing**: Required for Gatekeeper
- **Notarization**: Required for distribution
- **Keychain**: QorID credentials stored securely
- **Menu bar**: Native menu integration

### Linux

- **Packages**: AppImage, .deb, .rpm, Flatpak
- **Desktop entry**: `~/.local/share/applications/`
- **Icons**: Multiple sizes for different DEs
- **Auto-start**: `~/.config/autostart/`

---

## Release Process

1. **Version Bump**: Update version in `CMakeLists.txt`
2. **Build All Platforms**: CI/CD builds for Win/Mac/Linux
3. **Sign & Notarize**: Code sign Windows/Mac builds
4. **Upload**: Push to releases.demiurge.cloud
5. **Update Manifest**: Update auto-update manifest
6. **Announce**: Notify users of new version

---

## Accessibility

All users can access QOR Explorer Desktop regardless of premium tier:

| Feature | Free | Archon | Genesis |
|---------|------|--------|---------|
| Desktop App | ✅ | ✅ | ✅ |
| Full QOR OS | ✅ | ✅ | ✅ |
| Web3 Browsing | ✅ | ✅ | ✅ |
| QorID Login | ✅ | ✅ | ✅ |
| System Tray | ✅ | ✅ | ✅ |
| Auto-Updates | ✅ | ✅ | ✅ |
| Extended Storage | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ✅ | ✅ |

---

## Security Considerations

- **Sandboxing**: WebEngine content is sandboxed
- **Keychain**: Private keys stored in OS keychain, never in plaintext
- **Updates**: Signed update packages only
- **CSP**: Strict content security policy
- **No Telemetry**: No analytics or tracking without consent

---

## Timeline (Estimated)

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1** | 2 weeks | Basic Qt app with WebEngine, loads QOR OS |
| **Phase 2** | 2 weeks | Native QorID integration, wallet bridge |
| **Phase 3** | 1 week | System tray, notifications, auto-start |
| **Phase 4** | 2 weeks | Installer packages, code signing |
| **Phase 5** | 1 week | Auto-update system |
| **Phase 6** | 1 week | Testing, polish, documentation |

**Total: ~9 weeks**

---

*QOR Explorer Desktop - The Demiurge experience, natively.*
