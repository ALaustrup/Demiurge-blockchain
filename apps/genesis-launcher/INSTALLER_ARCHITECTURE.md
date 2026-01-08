# DEMIURGE QOR - Installer Architecture

**Goal:** Create professional, code-signed installers for Windows, macOS, and Linux that deliver the DEMIURGE QOR Launcher to end users.

---

## 📦 **Installer Strategy**

We'll use the **Qt Installer Framework (IFW)** as the primary cross-platform installer solution, with platform-specific packaging for native integration.

### **Why Qt Installer Framework?**
- ✅ Cross-platform (same codebase for all OS)
- ✅ Native Qt integration
- ✅ Supports updates and components
- ✅ Professional appearance
- ✅ Scriptable installation logic
- ✅ License agreements, shortcuts, registry entries

---

## 🏗️ **Three-Tier Deployment**

### **Tier 1: Bootstrap Installer (Small, Fast)**
**Size:** ~5-10 MB  
**Purpose:** Quick download, installs the main launcher

- Downloads the full application on demand
- Shows DEMIURGE branding during install
- Creates shortcuts and file associations
- Registers uninstaller

### **Tier 2: Main Application Bundle**
**Size:** ~150-300 MB (includes Qt runtime)  
**Contents:**
- DEMIURGE QOR executable
- Qt 6 libraries
- QML modules
- Resources (fonts, icons, themes)

### **Tier 3: On-Demand Components**
**Downloaded after installation:**
- QOR Desktop (full OS)
- Demiurge Miner
- Future modules

---

## 🪟 **Windows Installer**

### **Format:** `.exe` (Qt IFW) or `.msi` (WiX Toolset)

### **Recommended: Qt Installer Framework**

#### **Features:**
- Single `.exe` installer
- Silent install support: `/S` or `--script install.qs`
- NSIS-style (familiar to Windows users)
- 32-bit and 64-bit support
- Code signing via SignTool

#### **Installation Paths:**
```
Default: C:\Program Files\Demiurge\QOR\
User:    %LOCALAPPDATA%\Demiurge\QOR\
```

#### **Registry Keys:**
```
HKLM\Software\Demiurge\QOR
- InstallPath
- Version
- UninstallString
```

#### **Start Menu Structure:**
```
📁 DEMIURGE
 ├── 🚀 QOR Launcher
 ├── 📖 Documentation
 ├── 🌐 Visit demiurge.cloud
 └── 🗑️ Uninstall
```

#### **Code Signing:**
```powershell
# Sign with EV certificate
signtool sign /f cert.pfx /p PASSWORD /fd SHA256 /tr http://timestamp.digicert.com DemiurgeQOR-Setup.exe
```

**Cost:** ~$300-500/year for code signing certificate

---

### **Alternative: WiX Toolset (MSI)**
**For enterprise deployments requiring MSI format:**

- GPO deployment support
- Full Windows Installer integration
- More complex but more powerful

```xml
<Product Id="*" Name="DEMIURGE QOR" Version="1.0.0" 
         Manufacturer="Demiurge" UpgradeCode="YOUR-GUID-HERE">
  <Package InstallerVersion="500" Compressed="yes" />
  <Media Id="1" Cabinet="product.cab" EmbedCab="yes" />
  ...
</Product>
```

---

## 🍎 **macOS Installer**

### **Format:** `.dmg` (Disk Image) with `.app` bundle

### **Application Structure:**
```
DemiurgeQOR.app/
├── Contents/
│   ├── Info.plist
│   ├── MacOS/
│   │   └── DemiurgeQOR (executable)
│   ├── Resources/
│   │   ├── qor.icns
│   │   ├── qml/
│   │   └── assets/
│   └── Frameworks/
│       ├── QtCore.framework
│       ├── QtQml.framework
│       └── QtQuick.framework
```

### **DMG Creation:**
```bash
# Create .app bundle
macdeployqt DemiurgeQOR.app -qmldir=../src/qml

# Create DMG
hdiutil create -volname "DEMIURGE QOR" -srcfolder DemiurgeQOR.app \
  -ov -format UDZO DemiurgeQOR-1.0.0.dmg
```

### **Code Signing & Notarization:**
```bash
# Sign the app
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name (TEAMID)" \
  --options runtime DemiurgeQOR.app

# Create signed DMG
codesign --sign "Developer ID Application: Your Name (TEAMID)" \
  DemiurgeQOR-1.0.0.dmg

# Notarize with Apple
xcrun notarytool submit DemiurgeQOR-1.0.0.dmg \
  --apple-id YOUR_APPLE_ID --password APP_SPECIFIC_PASSWORD \
  --team-id TEAM_ID --wait

# Staple the ticket
xcrun stapler staple DemiurgeQOR-1.0.0.dmg
```

**Requirements:**
- Apple Developer Account ($99/year)
- macOS 11+ for notarization
- Xcode Command Line Tools

### **Installation:**
User drags `DemiurgeQOR.app` to `/Applications` folder (standard macOS UX)

---

## 🐧 **Linux Installers**

### **Three Distribution Methods:**

#### **1. AppImage (Universal, Recommended for Users)**
**Size:** ~200 MB (self-contained)  
**Run:** `chmod +x DemiurgeQOR-1.0.0-x86_64.AppImage && ./DemiurgeQOR-1.0.0-x86_64.AppImage`

**Benefits:**
- ✅ Works on any Linux distribution
- ✅ No installation required
- ✅ Portable (run from USB)
- ✅ No root/admin needed

**Creation:**
```bash
# Build with linuxdeployqt
linuxdeployqt DemiurgeQOR -appimage -qmldir=../src/qml

# Creates: DemiurgeQOR-x86_64.AppImage
```

---

#### **2. .deb Package (Debian/Ubuntu)**
**For:** Ubuntu, Debian, Linux Mint, Pop!_OS

```bash
# Create .deb
dpkg-deb --build demiurge-qor_1.0.0_amd64

# Install
sudo apt install ./demiurge-qor_1.0.0_amd64.deb
```

**Package Structure:**
```
demiurge-qor_1.0.0_amd64/
├── DEBIAN/
│   ├── control (package metadata)
│   ├── postinst (post-install script)
│   └── prerm (pre-uninstall script)
├── usr/
│   ├── bin/
│   │   └── demiurge-qor (symlink)
│   ├── share/
│   │   ├── applications/
│   │   │   └── demiurge-qor.desktop
│   │   ├── icons/
│   │   │   └── demiurge-qor.png
│   │   └── demiurge-qor/ (app files)
```

**Desktop Entry:**
```ini
[Desktop Entry]
Type=Application
Name=DEMIURGE QOR
Comment=Gateway to the Demiurge Blockchain
Exec=/opt/demiurge/qor/DemiurgeQOR
Icon=demiurge-qor
Terminal=false
Categories=Network;Blockchain;Utility;
```

---

#### **3. .rpm Package (Fedora/RHEL)**
**For:** Fedora, RHEL, CentOS, openSUSE

```bash
# Create .rpm
rpmbuild -ba demiurge-qor.spec

# Install
sudo rpm -i demiurge-qor-1.0.0-1.x86_64.rpm
# or
sudo dnf install ./demiurge-qor-1.0.0-1.x86_64.rpm
```

---

## 🛠️ **Build Pipeline**

### **CI/CD with GitHub Actions**

```yaml
name: Build Installers

on:
  push:
    tags:
      - 'v*'

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Qt
        uses: jurplel/install-qt-action@v3
        with:
          version: '6.10.1'
      - name: Build
        run: |
          mkdir build && cd build
          cmake .. -G "MinGW Makefiles"
          cmake --build . --config Release
      - name: Create Installer
        run: |
          binarycreator -c config/config.xml -p packages DemiurgeQOR-Setup.exe
      - name: Upload Artifact
        uses: actions/upload-artifact@v3
        with:
          name: windows-installer
          path: DemiurgeQOR-Setup.exe

  build-macos:
    runs-on: macos-latest
    steps:
      # Similar steps for macOS

  build-linux:
    runs-on: ubuntu-latest
    steps:
      # Similar steps for Linux AppImage, .deb, .rpm
```

---

## 📁 **Release Hosting**

### **Option 1: GitHub Releases**
- Free
- Automatic with CI/CD
- Download stats
- Direct links

### **Option 2: Custom CDN (releases.demiurge.cloud)**
```
https://releases.demiurge.cloud/qor/
├── latest/
│   ├── windows/
│   │   └── DemiurgeQOR-Setup.exe
│   ├── macos/
│   │   └── DemiurgeQOR.dmg
│   └── linux/
│       ├── DemiurgeQOR-x86_64.AppImage
│       ├── demiurge-qor_amd64.deb
│       └── demiurge-qor.x86_64.rpm
├── v1.0.0/
├── v1.0.1/
└── manifest.json
```

---

## 🔄 **Auto-Update System**

### **Current Implementation:**
The launcher already has `UpdateEngine` built in!

**Located at:** `apps/genesis-launcher/src/updater/`

**Features:**
- Manifest-based updates
- Delta patching (only download changes)
- Background downloads
- Verification (SHA-256)

### **Update Manifest Example:**
```json
{
  "version": "1.0.1",
  "releaseDate": "2026-01-15",
  "components": [
    {
      "name": "DemiurgeQor",
      "version": "1.0.1",
      "platform": "windows",
      "url": "https://releases.demiurge.cloud/qor/v1.0.1/windows/update.zip",
      "sha256": "abc123...",
      "size": 45000000,
      "delta": {
        "from": "1.0.0",
        "url": "https://releases.demiurge.cloud/qor/v1.0.1/windows/delta-1.0.0-to-1.0.1.patch",
        "sha256": "def456...",
        "size": 5000000
      }
    }
  ],
  "changelog": "Fixed authentication bug, improved performance"
}
```

---

## 🎨 **Installer UI/UX**

### **Branding:**
- Genesis theme colors (flame orange, cipher cyan)
- Demiurge logo and wordmark
- Professional, modern design

### **Installation Steps:**
1. **Welcome Screen**
   - "Welcome to DEMIURGE QOR"
   - Brief description
   - Terms acceptance

2. **Installation Location**
   - Default path
   - Custom path selector
   - Disk space check

3. **Components Selection** (optional)
   - QOR Launcher (required)
   - Desktop shortcuts
   - Start menu entries
   - File associations

4. **Progress**
   - File extraction progress bar
   - Current operation display
   - Estimated time remaining

5. **Completion**
   - "Installation complete!"
   - "Launch DEMIURGE QOR" checkbox
   - Link to documentation

---

## 📋 **Implementation Checklist**

### **Phase 1: Qt Installer Framework Setup**
- [ ] Install Qt IFW (https://download.qt.io/official_releases/qt-installer-framework/)
- [ ] Create `config/config.xml` (installer metadata)
- [ ] Create `packages/com.demiurge.qor/` structure
- [ ] Write `package.xml` (component metadata)
- [ ] Create install scripts (`installscript.qs`)

### **Phase 2: Build System**
- [ ] Update `CMakeLists.txt` with install targets
- [ ] Create `scripts/package-windows.ps1`
- [ ] Create `scripts/package-macos.sh`
- [ ] Create `scripts/package-linux.sh`
- [ ] Test local builds

### **Phase 3: Code Signing**
- [ ] Obtain Windows code signing certificate
- [ ] Register Apple Developer account
- [ ] Set up macOS code signing & notarization
- [ ] Configure GPG signing for Linux packages

### **Phase 4: CI/CD**
- [ ] Create `.github/workflows/build-installers.yml`
- [ ] Configure secrets (certificates, passwords)
- [ ] Test automated builds
- [ ] Set up artifact storage

### **Phase 5: Distribution**
- [ ] Configure releases.demiurge.cloud
- [ ] Upload initial release
- [ ] Test update system
- [ ] Write installation documentation

---

## 🚀 **Next Steps**

1. **Immediate:** Create Qt IFW package structure
2. **Short-term:** Build Windows installer (highest priority)
3. **Medium-term:** macOS and Linux packages
4. **Long-term:** Automated CI/CD pipeline

---

**Target Release Date:** January 10, 2026 (Alpha Launch)  
**Priority:** Windows > Linux AppImage > macOS > .deb/.rpm
