# Pantheon Console

The desktop application for DEMIURGE, built with Qt 6.10.

## Requirements

- Qt 6.10 or later
- CMake 3.16 or later
- C++17 compatible compiler

## Building

### Using Qt Creator

1. Open `CMakeLists.txt` in Qt Creator
2. Configure the project
3. Build and run

### Using Command Line

```bash
mkdir build
cd build
cmake ..
cmake --build .
```

On Windows with Qt installed:
```powershell
mkdir build
cd build
cmake .. -DCMAKE_PREFIX_PATH="C:/Qt/6.10.0/msvc2022_64"
cmake --build .
```

## Current Status

Phase 0: Basic skeleton with main window. Future phases will add:
- Node status panel
- Recent blocks & transactions view
- CGT balance display
- JSON-RPC integration

