# QOR Desktop - Linux Testing Environment Setup
## Remote Development Server Configuration

**Date:** January 7, 2026  
**Server:** 51.210.209.112  
**OS:** Ubuntu 25.10 (Questing Quokka)  
**Status:** ✅ READY FOR QOR DEVELOPMENT

---

## 🔐 SSH Access Configured

### Authorized SSH Keys
1. **Windows Development Machine** (`abyss`)
2. **Kali Raspberry Pi** (`kali@kali-raspberrypi`) ✅ NEW

### Connection Command
```bash
ssh ubuntu@51.210.209.112
```

**From Kali Pi:**
```bash
# Your SSH key is now authorized - no password needed
ssh ubuntu@51.210.209.112
```

---

## 🛠️ Development Environment

### Installed Software

**Qt Framework:**
- ✅ Qt 6.9.2 (latest stable)
- ✅ Qt Base Development
- ✅ Qt Declarative (QML/Quick)
- ✅ Qt Multimedia
- ✅ Qt SVG
- ✅ Qt Quick Controls
- ✅ Qt Quick Effects (for Glass Engine)
- ✅ Qt Quick Shapes
- ✅ Qt Quick Layouts

**Build Tools:**
- ✅ CMake 3.31.6
- ✅ G++ 15.2.0 (C++20 support)
- ✅ QMake 3.1

**Graphics & Audio:**
- ✅ OpenGL/Mesa dev libraries
- ✅ GLU (OpenGL Utility Library)
- ✅ FreeGLUT (OpenGL utility toolkit)
- ✅ ALSA audio development
- ✅ PulseAudio development

**System Info:**
- ✅ 885 GB available storage
- ✅ Node.js 22.x (for QorID service)
- ✅ PM2 process manager

---

## 🚀 Building QOR Desktop on Linux

### 1. Clone or Sync Repository
```bash
# If not already on server
cd /home/ubuntu
git clone https://github.com/ALaustrup/Demiurge-blockchain.git DEMIURGE

# Or sync from Windows
cd DEMIURGE
git fetch origin
git checkout qor-dev-design
git pull origin qor-dev-design
```

### 2. Configure Build
```bash
cd /home/ubuntu/DEMIURGE/apps/qor-desktop

# Create build directory
mkdir -p build
cd build

# Configure with CMake
cmake -DCMAKE_BUILD_TYPE=Release \
      -DCMAKE_PREFIX_PATH=/usr/lib/x86_64-linux-gnu/cmake/Qt6 \
      ..
```

### 3. Build QOR Desktop
```bash
# Build with parallel jobs
cmake --build . --config Release --parallel $(nproc)
```

### 4. Run QOR Desktop
```bash
# Run directly
./QOR

# Or with debug output
QT_LOGGING_RULES="*.debug=true" ./QOR

# Enable shader debugging
QSG_INFO=1 QSG_VISUALIZE=overdraw ./QOR
```

---

## 📦 QML Module Paths

Qt 6.9.2 QML modules are installed in:
```
/usr/lib/x86_64-linux-gnu/qt6/qml/
```

**Available for Glass Engine:**
- ✅ QtQuick
- ✅ QtQuick.Controls
- ✅ QtQuick.Layouts
- ✅ QtQuick.Window
- ✅ QtQuick.Effects (MultiEffect, ShaderEffect)
- ✅ QtQuick.Shapes
- ✅ QtMultimedia

---

## 🎨 Graphics Backend

### OpenGL Configuration
```bash
# Check OpenGL support
glxinfo | grep "OpenGL version"

# Qt will automatically use:
# - Mesa 25.2.3
# - OpenGL 4.6+ (server GPU dependent)
```

### Qt Quick Scene Graph
Qt Quick uses the scene graph for rendering:
- **Backend:** OpenGL (default)
- **Alternative:** Software rendering (fallback)

To force software rendering (if GPU issues):
```bash
QMLSCENE_DEVICE=softwarecontext ./QOR
```

---

## 🧪 Testing Workflow

### From Kali Raspberry Pi

**1. SSH into Server**
```bash
ssh ubuntu@51.210.209.112
```

**2. Navigate to Project**
```bash
cd ~/DEMIURGE/apps/qor-desktop
```

**3. Make Changes (via Git or direct edit)**
```bash
# Example: Edit QML file
nano src/qml/main.qml

# Or pull changes from Windows dev machine
git pull origin qor-dev-design
```

**4. Rebuild and Test**
```bash
cd build
cmake --build . --config Release --parallel
./QOR
```

### Remote File Transfer (if needed)

**From Kali Pi to Server:**
```bash
scp /local/file.cpp ubuntu@51.210.209.112:~/DEMIURGE/apps/qor-desktop/src/
```

**From Server to Kali Pi:**
```bash
scp ubuntu@51.210.209.112:~/DEMIURGE/apps/qor-desktop/build/QOR ./qor-linux
```

---

## 🐛 Debugging

### Enable Qt Debug Output
```bash
export QT_DEBUG_PLUGINS=1
export QT_LOGGING_RULES="*.debug=true;qt.qml.connections=false"
./QOR
```

### Check QML Module Loading
```bash
# List available QML modules
qml6 -l

# Test QML file directly
qml6 src/qml/main.qml
```

### Shader Debugging
```bash
# Enable shader info
export QSG_INFO=1
export QSG_RENDER_LOOP=basic
./QOR
```

### Memory Profiling
```bash
# Install valgrind
sudo apt install valgrind

# Run with memory check
valgrind --leak-check=full ./QOR
```

---

## 📊 Performance Testing

### Frame Rate Monitoring
```bash
# Enable FPS overlay
export QSG_RENDER_TIMING=1
./QOR
```

### GPU Usage (if desktop environment available)
```bash
# Install monitoring tools
sudo apt install mesa-utils

# Check GPU info
glxinfo | grep "OpenGL renderer"
glxgears  # Simple OpenGL test
```

---

## 🔧 Troubleshooting

### Issue: "cannot connect to X server"
**Solution:** QOR requires a display. Options:
1. **Virtual X Server (Xvfb):**
   ```bash
   sudo apt install xvfb
   xvfb-run -a ./QOR
   ```

2. **VNC Server (for GUI):**
   ```bash
   sudo apt install tightvncserver
   vncserver :1 -geometry 1920x1080 -depth 24
   export DISPLAY=:1
   ./QOR
   ```

3. **Forward X11 over SSH (from Kali Pi):**
   ```bash
   ssh -X ubuntu@51.210.209.112
   cd ~/DEMIURGE/apps/qor-desktop/build
   ./QOR
   ```

### Issue: "Qt platform plugin not found"
**Solution:**
```bash
export QT_QPA_PLATFORM=xcb  # or offscreen for headless
./QOR
```

### Issue: "QML module not found"
**Solution:**
```bash
export QML_IMPORT_PATH=/usr/lib/x86_64-linux-gnu/qt6/qml
./QOR
```

### Issue: Shader compilation errors
**Solution:**
```bash
# Check OpenGL support
glxinfo | grep "OpenGL shading language version"

# Fallback to older GLSL version in shaders
# Edit shader files to use #version 330 instead of 440
```

---

## 🌐 Existing Services on Server

**QorID Service:**
- Running on port 8082
- PM2 managed: `pm2 list`
- SQLite database: `/home/ubuntu/DEMIURGE/apps/qorid-service/data/qorid.sqlite`

**Nginx:**
- Configured for reverse proxy
- SSL certificates available

---

## 🔄 CI/CD Integration (Future)

When ready, can set up automated testing:

```bash
# Install GitHub Actions runner
# Or set up Jenkins/GitLab CI

# Automated build script
cd ~/DEMIURGE/apps/qor-desktop
./scripts/build-linux.sh
./scripts/test-linux.sh
```

---

## 📝 Environment Variables Reference

```bash
# Qt Configuration
export QT_QPA_PLATFORM=xcb           # X11 backend
export QML_IMPORT_PATH=/usr/lib/x86_64-linux-gnu/qt6/qml
export QT_LOGGING_RULES="*.debug=true"

# Graphics
export QSG_INFO=1                    # Scene graph debug info
export QSG_VISUALIZE=overdraw        # Visualize rendering
export QSG_RENDER_LOOP=basic         # Basic render loop

# Audio
export PULSE_SERVER=localhost        # PulseAudio server

# Build
export CMAKE_PREFIX_PATH=/usr/lib/x86_64-linux-gnu/cmake/Qt6
```

---

## 🎯 Next Steps

1. **✅ SSH access configured** - Test from Kali Pi
2. **✅ Development environment ready** - Qt 6.9.2 installed
3. **🔜 Clone/sync repository** - Get QOR source code
4. **🔜 First build** - Test compilation on Linux
5. **🔜 Run QOR Desktop** - Validate Glass Engine on Linux

---

## 📞 Quick Reference

**Server:** `ubuntu@51.210.209.112`  
**Qt Version:** 6.9.2  
**CMake:** 3.31.6  
**OpenGL:** Mesa 25.2.3  
**Project Path:** `/home/ubuntu/DEMIURGE/apps/qor-desktop`

---

## 🔐 Security Notes

- SSH key authentication enabled
- Password authentication still available as fallback
- Firewall: Port 22 (SSH), 8082 (QorID service)
- Consider setting up fail2ban for SSH protection

---

**Document Version:** 1.0.0  
**Last Updated:** January 7, 2026  
**Status:** 🚀 READY FOR LINUX TESTING
