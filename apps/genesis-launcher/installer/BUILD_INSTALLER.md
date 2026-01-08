# Building DEMIURGE QOR Installers

This guide will walk you through building installers for all three platforms.

---

## 📋 **Prerequisites**

### **All Platforms:**
1. **Qt 6.10+** installed with:
   - Qt Core, Gui, Qml, Quick, QuickControls2, Network, Widgets, Multimedia
   - Qt Installer Framework (IFW)
2. **CMake 3.21+**
3. **Git**

### **Windows:**
- Visual Studio 2022 or MinGW 13+
- [Qt Installer Framework](https://download.qt.io/official_releases/qt-installer-framework/4.6/QtInstallerFramework-windows-x64-4.6.0.exe)
- Optional: [SignTool](https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/) for code signing

### **macOS:**
- Xcode 14+
- Xcode Command Line Tools: `xcode-select --install`
- Qt Installer Framework: `brew install qt-installer-framework`
- Optional: Apple Developer Account ($99/year) for code signing

### **Linux:**
- GCC 13+ or Clang 15+
- Qt Installer Framework: Download from [Qt Downloads](https://download.qt.io/official_releases/qt-installer-framework/)
- Optional: `linuxdeployqt` for AppImage creation

---

## 🏗️ **Step 1: Build the Application**

### **Windows (PowerShell):**
```powershell
cd C:\Repos\DEMIURGE\apps\genesis-launcher

# Create build directory
mkdir build
cd build

# Configure
cmake .. -G "MinGW Makefiles" `
  -DCMAKE_PREFIX_PATH="C:/Qt/6.10.1/mingw_64" `
  -DCMAKE_BUILD_TYPE=Release

# Build
cmake --build . --config Release

# The executable will be at: build/DemiurgeQOR.exe
```

### **macOS / Linux:**
```bash
cd ~/Repos/DEMIURGE/apps/genesis-launcher

# Create build directory
mkdir build && cd build

# Configure
cmake .. \
  -DCMAKE_PREFIX_PATH="$HOME/Qt/6.10.1/gcc_64" \
  -DCMAKE_BUILD_TYPE=Release

# Build
cmake --build . --config Release -j$(nproc)

# The executable will be at: build/DemiurgeQOR
```

---

## 📦 **Step 2: Prepare Installer Files**

### **Copy Application Files to Installer:**

#### **Windows:**
```powershell
# Copy executable and dependencies
$INSTALL_DATA = ".\installer\packages\com.demiurge.qor\data"

# Copy exe
Copy-Item build\DemiurgeQOR.exe $INSTALL_DATA\

# Copy Qt DLLs (use windeployqt)
& "C:\Qt\6.10.1\mingw_64\bin\windeployqt.exe" `
  --qmldir ..\src\qml `
  --release `
  $INSTALL_DATA\DemiurgeQOR.exe

# Copy resources
Copy-Item src\resources\icons\qor.ico $INSTALL_DATA\
```

#### **macOS:**
```bash
INSTALL_DATA="./installer/packages/com.demiurge.qor/data"

# Create .app bundle
macdeployqt build/DemiurgeQOR.app \
  -qmldir=../src/qml \
  -always-overwrite

# Copy to installer
cp -r build/DemiurgeQOR.app $INSTALL_DATA/
```

#### **Linux:**
```bash
INSTALL_DATA="./installer/packages/com.demiurge.qor/data"

# Copy executable
cp build/DemiurgeQOR $INSTALL_DATA/

# Copy Qt libraries
ldd build/DemiurgeQOR | grep "=> /" | awk '{print $3}' | xargs -I '{}' cp -v '{}' $INSTALL_DATA/

# Copy resources
cp src/resources/icons/qor.png $INSTALL_DATA/
```

---

## 🎁 **Step 3: Create the Installer**

### **Using Qt Installer Framework:**

#### **Windows:**
```powershell
# Set path to binarycreator
$IFW_PATH = "C:\Qt\Tools\QtInstallerFramework\4.6\bin"

# Create installer
& "$IFW_PATH\binarycreator.exe" `
  --offline-only `
  -c installer\config\config.xml `
  -p installer\packages `
  DemiurgeQOR-1.0.0-Setup.exe

# Output: DemiurgeQOR-1.0.0-Setup.exe (~150-300 MB)
```

#### **macOS:**
```bash
IFW_PATH="/opt/homebrew/bin"

# Create installer
$IFW_PATH/binarycreator \
  --offline-only \
  -c installer/config/config.xml \
  -p installer/packages \
  DemiurgeQOR-1.0.0-Installer.app

# Create DMG
hdiutil create -volname "DEMIURGE QOR" \
  -srcfolder DemiurgeQOR-1.0.0-Installer.app \
  -ov -format UDZO \
  DemiurgeQOR-1.0.0.dmg

# Output: DemiurgeQOR-1.0.0.dmg
```

#### **Linux:**
```bash
IFW_PATH="/opt/Qt/Tools/QtInstallerFramework/4.6/bin"

# Create installer (binary)
$IFW_PATH/binarycreator \
  --offline-only \
  -c installer/config/config.xml \
  -p installer/packages \
  DemiurgeQOR-1.0.0-Installer.run

# Make executable
chmod +x DemiurgeQOR-1.0.0-Installer.run

# Output: DemiurgeQOR-1.0.0-Installer.run
```

---

## 🔐 **Step 4: Code Signing (Optional but Recommended)**

### **Windows:**
```powershell
# Sign with your code signing certificate
signtool sign /f "path\to\certificate.pfx" `
  /p "PASSWORD" `
  /fd SHA256 `
  /tr "http://timestamp.digicert.com" `
  /td SHA256 `
  DemiurgeQOR-1.0.0-Setup.exe
```

### **macOS:**
```bash
# Sign the installer
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name (TEAM_ID)" \
  --options runtime \
  DemiurgeQOR-1.0.0-Installer.app

# Sign DMG
codesign --sign "Developer ID Application: Your Name (TEAM_ID)" \
  DemiurgeQOR-1.0.0.dmg

# Notarize with Apple
xcrun notarytool submit DemiurgeQOR-1.0.0.dmg \
  --apple-id YOUR_APPLE_ID \
  --password APP_SPECIFIC_PASSWORD \
  --team-id TEAM_ID \
  --wait

# Staple the ticket
xcrun stapler staple DemiurgeQOR-1.0.0.dmg
```

### **Linux:**
```bash
# GPG sign the installer
gpg --detach-sign --armor DemiurgeQOR-1.0.0-Installer.run

# Creates: DemiurgeQOR-1.0.0-Installer.run.asc
```

---

## 🧪 **Step 5: Test the Installer**

### **Windows:**
```powershell
# Run installer
.\DemiurgeQOR-1.0.0-Setup.exe

# Test silent install
.\DemiurgeQOR-1.0.0-Setup.exe --script install-silent.qs

# Test uninstall
"C:\Program Files\Demiurge\QOR\DemiurgeQOR-Uninstall.exe"
```

### **macOS:**
```bash
# Mount DMG
open DemiurgeQOR-1.0.0.dmg

# Drag to Applications

# Run
open /Applications/DEMIURGE\ QOR.app
```

### **Linux:**
```bash
# Run installer
./DemiurgeQOR-1.0.0-Installer.run

# Test installed app
/opt/Demiurge/QOR/DemiurgeQOR
```

---

## 🚀 **Quick Build Script**

Create `scripts/build-installer.ps1` (Windows):

```powershell
#!/usr/bin/env pwsh
# Quick installer build script

param(
    [string]$QtPath = "C:\Qt\6.10.1\mingw_64",
    [string]$Version = "1.0.0"
)

Write-Host "Building DEMIURGE QOR Installer v$Version..." -ForegroundColor Cyan

# Step 1: Build application
Write-Host "`n[1/4] Building application..." -ForegroundColor Yellow
mkdir -Force build | Out-Null
cd build
cmake .. -G "MinGW Makefiles" -DCMAKE_PREFIX_PATH="$QtPath" -DCMAKE_BUILD_TYPE=Release
cmake --build . --config Release
cd ..

# Step 2: Deploy Qt dependencies
Write-Host "`n[2/4] Deploying Qt dependencies..." -ForegroundColor Yellow
$INSTALL_DATA = "installer\packages\com.demiurge.qor\data"
Remove-Item -Recurse -Force $INSTALL_DATA -ErrorAction SilentlyContinue
mkdir -Force $INSTALL_DATA | Out-Null
Copy-Item build\DemiurgeQOR.exe $INSTALL_DATA\
& "$QtPath\bin\windeployqt.exe" --qmldir src\qml --release $INSTALL_DATA\DemiurgeQOR.exe

# Step 3: Create installer
Write-Host "`n[3/4] Creating installer..." -ForegroundColor Yellow
$IFW_PATH = "C:\Qt\Tools\QtInstallerFramework\4.6\bin"
& "$IFW_PATH\binarycreator.exe" `
  --offline-only `
  -c installer\config\config.xml `
  -p installer\packages `
  "DemiurgeQOR-$Version-Setup.exe"

# Step 4: Done
Write-Host "`n[4/4] Complete!" -ForegroundColor Green
Write-Host "Installer created: DemiurgeQOR-$Version-Setup.exe" -ForegroundColor Cyan
Write-Host "Size: $((Get-Item "DemiurgeQOR-$Version-Setup.exe").Length / 1MB) MB" -ForegroundColor Cyan
```

**Usage:**
```powershell
.\scripts\build-installer.ps1 -Version "1.0.0"
```

---

## 📤 **Distribution**

### **Upload to GitHub Releases:**
```bash
# Create GitHub release
gh release create v1.0.0 \
  --title "DEMIURGE QOR v1.0.0 - Alpha Release" \
  --notes "Initial alpha release for testing" \
  DemiurgeQOR-1.0.0-Setup.exe \
  DemiurgeQOR-1.0.0.dmg \
  DemiurgeQOR-1.0.0-Installer.run
```

### **Upload to Custom CDN:**
```bash
# Upload to releases.demiurge.cloud
scp DemiurgeQOR-1.0.0-Setup.exe \
  ubuntu@51.210.209.112:/var/www/releases/qor/v1.0.0/windows/

scp DemiurgeQOR-1.0.0.dmg \
  ubuntu@51.210.209.112:/var/www/releases/qor/v1.0.0/macos/

scp DemiurgeQOR-1.0.0-Installer.run \
  ubuntu@51.210.209.112:/var/www/releases/qor/v1.0.0/linux/
```

---

## 🐛 **Troubleshooting**

### **"Qt platform plugin could not be initialized"**
- Ensure `platforms/` directory is copied by `windeployqt`/`macdeployqt`

### **"Missing DLL: Qt6Core.dll"**
- Run `windeployqt` again with `--release` flag

### **macOS: "App is damaged and can't be opened"**
- Code sign the app: `codesign --deep --force --sign - DemiurgeQOR.app`

### **Linux: "./DemiurgeQOR: error while loading shared libraries"**
- Check dependencies: `ldd DemiurgeQOR`
- Copy missing Qt libraries to installer data directory

---

## 📚 **Resources**

- [Qt Installer Framework Docs](https://doc.qt.io/qtinstallerframework/)
- [Qt Deployment Guide](https://doc.qt.io/qt-6/deployment.html)
- [Code Signing Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)

---

**Ready to build your first installer?** Start with Windows (easiest) and work your way to macOS and Linux!
