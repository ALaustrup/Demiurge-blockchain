# Installing libtorrent for TORRNT

## Problem: Permission Errors with Background Installation

If you're experiencing recurring Cursor errors or permission denied errors when installing libtorrent, this is likely due to file locking issues with vcpkg's log files.

## Solution: Manual Installation

**Run the installation in a separate PowerShell window** (not in Cursor's terminal):

### Option 1: Use the Manual Installation Script

1. Open a **new PowerShell window** (outside of Cursor)
2. Navigate to the TORRNT scripts directory:
   ```powershell
   cd C:\Repos\DEMIURGE\apps\torrnt\scripts
   ```
3. Run the manual installation script:
   ```powershell
   .\install-libtorrent-manual.ps1
   ```

This script:
- Cleans up locked log files
- Installs Boost dependencies (if needed)
- Installs libtorrent
- Provides clear progress updates

### Option 2: Direct vcpkg Command

If the script doesn't work, run vcpkg directly in a separate PowerShell window:

```powershell
cd $env:USERPROFILE\vcpkg
.\vcpkg.exe install libtorrent:x64-windows
```

**Important:** Run this in a **separate PowerShell window**, not in Cursor's integrated terminal.

## Why This Happens

- vcpkg creates log files that can get locked
- Background processes in Cursor can cause file permission conflicts
- Running in a separate window avoids these issues

## Installation Time

- **Full installation**: 30-60 minutes (builds ~70 packages including Boost)
- **If Boost already installed**: 10-20 minutes (just libtorrent)

## Verify Installation

After installation completes, verify it worked:

```powershell
.\apps\torrnt\scripts\check-libtorrent-status.ps1
```

Or manually check:

```powershell
Test-Path "$env:USERPROFILE\vcpkg\installed\x64-windows\include\libtorrent\session.hpp"
```

## Rebuild TORRNT

Once libtorrent is installed, rebuild TORRNT:

```powershell
cd C:\Repos\DEMIURGE\apps\torrnt\build
cmake .. -G "Visual Studio 17 2022" -A x64 `
    -DCMAKE_PREFIX_PATH="C:\Qt\6.10.1\msvc2022_64" `
    -DCMAKE_TOOLCHAIN_FILE="$env:USERPROFILE\vcpkg\scripts\buildsystems\vcpkg.cmake"
cmake --build . --config Release
```

## Troubleshooting

### Permission Denied Errors

1. Close Cursor completely
2. Open a new PowerShell window as Administrator
3. Run the installation script
4. Reopen Cursor after installation completes

### Installation Fails Partway Through

vcpkg installations can be resumed. Just run the install command again - it will continue from where it left off.

### Boost Installation Takes Too Long

If Boost is taking too long, you can install it separately first:

```powershell
cd $env:USERPROFILE\vcpkg
.\vcpkg.exe install boost-system:x64-windows boost-thread:x64-windows
```

Then install libtorrent:

```powershell
.\vcpkg.exe install libtorrent:x64-windows
```
