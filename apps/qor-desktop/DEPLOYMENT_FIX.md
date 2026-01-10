# QOR Desktop - Deployment Fix

## Issue
When launching QOR Desktop, the error appeared:
```
Qt6Sql.dll was not found
```

## Cause
Qt applications need their runtime dependencies (DLLs) copied to the executable directory. After building, only the QOR.exe was present but not the required Qt6 libraries.

## Solution
Used **windeployqt** to automatically deploy all Qt6 dependencies:

```powershell
cd apps/qor-desktop/build
windeployqt --release --qmldir ../src/qml QOR.exe
```

This tool:
- Scans QOR.exe for Qt dependencies
- Copies all required DLLs (Qt6Sql, Qt6Core, Qt6Gui, Qt6Qml, etc.)
- Deploys QML modules and plugins
- Copies translation files

## Result
✅ **QOR Desktop now launches successfully!**

**Process**: Running (PID: 20444)  
**Status**: All dependencies deployed  
**Window**: Should be visible on screen

## For Future Builds
Always run `windeployqt` after building Qt applications on Windows:

```powershell
# After building:
cd build
windeployqt --release QOR.exe
```

Or add to CMakeLists.txt as a post-build step.

## Dependencies Deployed
- Qt6Core.dll
- Qt6Gui.dll
- Qt6Qml.dll
- Qt6Quick.dll
- Qt6Sql.dll ✅ (was missing)
- Qt6Network.dll
- Qt6Widgets.dll
- QML plugins
- Platform plugins
- Translation files

---
**Date**: January 7, 2026  
**Status**: ✅ RESOLVED
