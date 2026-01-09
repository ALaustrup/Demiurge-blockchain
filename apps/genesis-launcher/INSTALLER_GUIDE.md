# DEMIURGE QOR Installer - Complete Guide

## 🎯 Overview

This guide covers building, testing, and distributing the DEMIURGE QOR installer for the ultimate installation experience.

## 🚀 Quick Start

### Build Everything
```powershell
cd C:\Repos\DEMIURGE\apps\genesis-launcher
.\scripts\build-installer-complete.ps1 -Version "1.0.0"
```

This will:
1. ✅ Build the launcher application
2. ✅ Deploy all Qt dependencies
3. ✅ Copy resources (videos, icons)
4. ✅ Create the installer package
5. ✅ Verify everything is correct

### Test the Installer
```powershell
.\scripts\test-installer.ps1 -InstallerPath ".\DEMIURGE-QOR-1.0.0-Setup.exe"
```

## 📋 Prerequisites

### Required Software
- **Qt 6.10+** with:
  - Qt Core, Gui, Qml, Quick, QuickControls2, Network, Widgets, Multimedia
  - Qt Installer Framework 4.6+
- **CMake 3.21+**
- **Visual Studio 2022** (Windows) or **Xcode** (macOS) or **GCC 13+** (Linux)

### Verify Installation
```powershell
# Check Qt
Test-Path "C:\Qt\6.10.1\msvc2022_64\bin\qmake.exe"

# Check Qt Installer Framework
Test-Path "C:\Qt\Tools\QtInstallerFramework\4.6\bin\binarycreator.exe"

# Check CMake
cmake --version
```

## 🏗️ Build Process

### Step-by-Step

1. **Build Application**
   ```powershell
   cd apps\genesis-launcher
   mkdir build-installer
   cd build-installer
   cmake .. -G "Visual Studio 17 2022" -A x64 -DCMAKE_PREFIX_PATH="C:\Qt\6.10.1\msvc2022_64"
   cmake --build . --config Release
   ```

2. **Deploy Dependencies**
   ```powershell
   windeployqt --qmldir ..\src\qml --release Release\GenesisLauncher.exe
   ```

3. **Prepare Installer Data**
   ```powershell
   # Copy to installer package
   Copy-Item Release\* installer\packages\com.demiurge.qor\data\ -Recurse
   ```

4. **Create Installer**
   ```powershell
   binarycreator.exe --offline-only -c installer\config\config.xml -p installer\packages DEMIURGE-QOR-1.0.0-Setup.exe
   ```

### Using the Build Script

The `build-installer-complete.ps1` script automates all steps:

```powershell
# Basic usage
.\scripts\build-installer-complete.ps1

# Custom Qt path
.\scripts\build-installer-complete.ps1 -QtPath "C:\Qt\6.10.1\mingw_64"

# Custom version
.\scripts\build-installer-complete.ps1 -Version "1.0.1"

# Skip build (use existing)
.\scripts\build-installer-complete.ps1 -SkipBuild

# Only build, don't create installer
.\scripts\build-installer-complete.ps1 -SkipInstaller
```

## 🧪 Testing

### Automated Testing

```powershell
.\scripts\test-installer.ps1 -InstallerPath ".\DEMIURGE-QOR-1.0.0-Setup.exe"
```

The test script:
- ✅ Runs silent installation
- ✅ Verifies all files are present
- ✅ Checks for required DLLs
- ✅ Tests launcher startup
- ✅ Cleans up test installation

### Manual Testing

1. **Run Installer**
   ```powershell
   .\DEMIURGE-QOR-1.0.0-Setup.exe
   ```

2. **Verify Installation**
   - Check installation directory: `C:\Program Files\Demiurge\QOR`
   - Verify `GenesisLauncher.exe` exists
   - Check Start Menu shortcut
   - Check Desktop shortcut

3. **Test Launcher**
   - Launch from Start Menu
   - Verify intro video plays
   - Test login screen
   - Verify all features work

4. **Test Uninstaller**
   - Run uninstaller from Control Panel
   - Verify clean removal

## 🎨 Installer Customization

### Configuration Files

- **`installer/config/config.xml`** - Main installer configuration
- **`installer/config/controlscript.qs`** - Custom page behavior
- **`installer/packages/com.demiurge.qor/meta/installscript.qs`** - Installation logic

### Custom Pages

The installer includes custom text for:
- Welcome page
- Target directory selection
- Ready to install
- Installation progress
- Finish page with launch option

### Branding

Update these files for custom branding:
- Logo: Add to `installer/config/` (optional)
- Icons: `src/resources/icons/`
- Colors: Modify `controlscript.qs`

## 📦 Installer Contents

### Required Files
- `GenesisLauncher.exe` - Main executable
- `Qt6*.dll` - Qt runtime libraries
- `platforms/qwindows.dll` - Qt platform plugin
- `videos/intro.mp4` - Intro video (optional)
- `qml/` - QML modules
- Icons and resources

### File Structure
```
installer/
├── config/
│   ├── config.xml          # Main config
│   └── controlscript.qs     # Page customization
└── packages/
    └── com.demiurge.qor/
        ├── data/            # Application files (populated by build)
        └── meta/
            ├── package.xml  # Package metadata
            ├── installscript.qs  # Installation logic
            └── license.txt  # License file
```

## 🚢 Distribution

### GitHub Releases

```powershell
# Create release
gh release create v1.0.0 `
  --title "DEMIURGE QOR v1.0.0" `
  --notes "Initial release" `
  DEMIURGE-QOR-1.0.0-Setup.exe
```

### Custom CDN

```powershell
# Upload to server
scp DEMIURGE-QOR-1.0.0-Setup.exe `
  ubuntu@51.210.209.112:/var/www/releases/qor/v1.0.0/
```

## 🔐 Code Signing (Optional)

### Windows
```powershell
signtool sign /f certificate.pfx /p PASSWORD /fd SHA256 `
  /tr http://timestamp.digicert.com /td SHA256 `
  DEMIURGE-QOR-1.0.0-Setup.exe
```

### macOS
```bash
codesign --deep --force --sign "Developer ID Application: Name (TEAM_ID)" \
  --options runtime DemiurgeQOR.app
```

## 🐛 Troubleshooting

### "Qt platform plugin could not be initialized"
- Ensure `platforms/qwindows.dll` is in installer data
- Run `windeployqt` with `--release` flag

### "Missing DLL: Qt6Core.dll"
- Run `windeployqt` again
- Check Qt path is correct

### Installer crashes on launch
- Verify `config.xml` syntax
- Check `controlscript.qs` for errors
- Remove optional logo/icon references if missing

### Video doesn't play
- Ensure `videos/intro.mp4` is in installer data
- Check video path in `LauncherWindow.qml`

## 📚 Resources

- [Qt Installer Framework Documentation](https://doc.qt.io/qtinstallerframework/)
- [Qt Deployment Guide](https://doc.qt.io/qt-6/deployment.html)
- [CMake Documentation](https://cmake.org/documentation/)

## ✅ Checklist Before Release

- [ ] All tests pass
- [ ] Installer runs without errors
- [ ] Launcher starts correctly
- [ ] Intro video plays
- [ ] All shortcuts created
- [ ] Uninstaller works
- [ ] Code signed (if applicable)
- [ ] Version numbers updated
- [ ] Release notes prepared

---

**Ready to build?** Run `.\scripts\build-installer-complete.ps1` and follow the prompts!
