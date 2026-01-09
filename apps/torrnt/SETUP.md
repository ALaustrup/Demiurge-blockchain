# TORRNT Setup Guide

## Build Status

TORRNT has been successfully built! Here's how to verify and use it.

## Verify Build

### Check Executable

```powershell
# Check if executable exists
Test-Path "C:\Repos\DEMIURGE\apps\torrnt\build\Release\torrnt.exe"

# Or check all build outputs
Get-ChildItem "C:\Repos\DEMIURGE\apps\torrnt\build" -Recurse -Filter "*.exe"
```

### Build Location

The executable should be at:
```
C:\Repos\DEMIURGE\apps\torrnt\build\Release\torrnt.exe
```

## Deploy Qt Dependencies

Before running TORRNT, you need to deploy Qt DLLs:

```powershell
cd C:\Repos\DEMIURGE\apps\torrnt\build\Release
C:\Qt\6.10.1\msvc2022_64\bin\windeployqt.exe --qmldir ..\..\src\qml --release torrnt.exe
```

This will copy all required Qt DLLs to the Release directory.

## Run TORRNT

### Option 1: Direct Run

```powershell
cd C:\Repos\DEMIURGE\apps\torrnt\build\Release
.\torrnt.exe
```

### Option 2: Create Shortcut

1. Right-click `torrnt.exe`
2. Create shortcut
3. Move shortcut to Desktop or Start Menu

## Verify Installation

### Check Components

```powershell
# Check executable
Test-Path "build\Release\torrnt.exe"

# Check Qt DLLs
Test-Path "build\Release\Qt6Core.dll"
Test-Path "build\Release\Qt6Qml.dll"
Test-Path "build\Release\Qt6Quick.dll"

# Check QML files
Test-Path "build\Release\qml\MainWindow.qml"
```

### Test Functionality

1. **Launch TORRNT**
2. **Check UI**: Should show main window with Genesis theme
3. **Test Magnet Link**: Try adding a magnet link
4. **Check Blockchain**: Verify connection status indicator

## Current Status

- ✅ **Build**: Successful
- ⚠️ **libtorrent**: Installation in progress (optional)
- ✅ **Qt Dependencies**: Need to deploy with `windeployqt`
- ✅ **QML Resources**: Embedded in executable

## Without libtorrent

TORRNT will run but with limited functionality:
- ✅ UI displays correctly
- ✅ Blockchain search works
- ✅ Can view on-chain torrents
- ❌ Cannot add magnet links
- ❌ Cannot download/upload torrents

## With libtorrent (After Installation Completes)

Once libtorrent installation finishes:

1. **Rebuild TORRNT**:
   ```powershell
   cd C:\Repos\DEMIURGE\apps\torrnt\build
   cmake .. -G "Visual Studio 17 2022" -A x64 `
       -DCMAKE_PREFIX_PATH="C:\Qt\6.10.1\msvc2022_64" `
       -DCMAKE_TOOLCHAIN_FILE="$env:USERPROFILE\vcpkg\scripts\buildsystems\vcpkg.cmake"
   cmake --build . --config Release
   ```

2. **Deploy Qt Dependencies**:
   ```powershell
   cd Release
   C:\Qt\6.10.1\msvc2022_64\bin\windeployqt.exe --qmldir ..\..\src\qml --release torrnt.exe
   ```

3. **Test Full Functionality**:
   - Add magnet links
   - Download torrents
   - Upload/seeding
   - Peer connections

## Troubleshooting

### Executable Not Found

Rebuild:
```powershell
cd C:\Repos\DEMIURGE\apps\torrnt\build
cmake --build . --config Release
```

### Missing Qt DLLs

Run `windeployqt` as shown above.

### Application Crashes

Check for:
- Missing Qt DLLs
- Missing QML files
- Corrupted build

Rebuild from scratch:
```powershell
Remove-Item build -Recurse -Force
mkdir build
cd build
cmake .. -G "Visual Studio 17 2022" -A x64 -DCMAKE_PREFIX_PATH="C:\Qt\6.10.1\msvc2022_64"
cmake --build . --config Release
```

### Video Not Playing

- Check video file exists: `apps/qloud-os/public/video/intro.mp4`
- Check Nginx config includes `/video/` location
- Clear browser cache
- Check browser console for errors

## Next Steps

1. **Deploy Qt dependencies** (run `windeployqt`)
2. **Test TORRNT** (launch and verify UI)
3. **Wait for libtorrent** (for full functionality)
4. **Rebuild with libtorrent** (once installation completes)
