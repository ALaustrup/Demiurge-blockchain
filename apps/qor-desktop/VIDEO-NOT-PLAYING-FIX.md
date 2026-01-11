# 🎬 Video Background Troubleshooting Guide

## 🔍 **Current Issue:**
Video file exists but not playing - showing animated colors instead

## ✅ **Diagnosis:**

### **Problem Identified:**
The video file was added AFTER QOR.exe was built. Qt resources (qml.qrc) compile files INTO the executable at build time. Adding the video after building means it's not embedded in the .exe.

### **Solution:**
**Rebuild QOR.exe with the video file present** so CMake can compile it into the resources.

---

## 🚀 **Fix Steps:**

### **Method 1: Automated Fix (Recommended)**
```powershell
cd C:\Repos\DEMIURGE\apps\qor-desktop
.\Fix-Video-Background.bat
```

This script will:
1. Verify video file exists
2. Clean CMake cache
3. Reconfigure CMake
4. Rebuild with video embedded
5. Deploy Qt DLLs
6. Provide debug launch instructions

### **Method 2: Manual Fix**
```powershell
cd C:\Repos\DEMIURGE\apps\qor-desktop\build

# Clean cache
del CMakeCache.txt
rmdir /S /Q CMakeFiles
del qml.qrc.depends

# Reconfigure
cmake ..

# Rebuild (this compiles video into executable)
cmake --build . --config Release

# Deploy DLLs
windeployqt QOR.exe --qmldir ..\src\qml
```

---

## 🎥 **Why This Happens:**

### **Qt Resource System:**
```xml
<!-- qml.qrc -->
<qresource prefix="/assets">
    <file>assets/wallpapers/default.mp4</file>
</qresource>
```

When CMake builds QOR.exe, it:
1. Reads `qml.qrc`
2. Finds `assets/wallpapers/default.mp4`
3. Embeds the **entire video** into the .exe binary
4. Makes it accessible via `qrc:/assets/wallpapers/default.mp4`

**If the video isn't there during build:**
- CMake skips it
- QML tries to load `qrc:/assets/wallpapers/default.mp4`
- Returns "file not found" error
- Falls back to animated gradient

---

## 🔧 **Common Issues:**

### **Issue 1: Video File Missing**
```
[ERROR] Video file not found: assets/wallpapers/default.mp4
```

**Solution:** Add video first, then rebuild

### **Issue 2: Video Format Not Supported**
```
❌ Video background error: Unsupported format
```

**Solution:** Convert to H.264 MP4:
```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -s 1920x1080 -r 30 -an default.mp4
```

### **Issue 3: Video Too Large**
Build takes very long or fails

**Solution:** Compress video:
```bash
ffmpeg -i default.mp4 -c:v libx264 -crf 28 -preset slow -s 1920x1080 -r 30 -an default_compressed.mp4
```

### **Issue 4: Missing Multimedia Plugins**
```
❌ Video background error: No multimedia backend available
```

**Solution:** Run `windeployqt` to deploy plugins:
```powershell
cd build
windeployqt QOR.exe --qmldir ..\src\qml
```

---

## 📊 **Verify Video Is Embedded:**

### **After Rebuild, Check:**

1. **File size increased significantly:**
   ```powershell
   Get-Item build\QOR.exe | Select-Object Length
   # Should be much larger (video size + original exe)
   ```

2. **Debug output shows loading:**
   ```
   🎬 Loading video background: qrc:/assets/wallpapers/default.mp4
      Autoplay: true
      Loops: -1
      Muted: true
   📺 Video playback state: Playing
   ```

3. **No error messages:**
   ```
   # Should NOT see:
   ❌ Video background error: ...
   ```

---

## 🎯 **Expected Behavior:**

### **Successful Video Playback:**
- Video plays seamlessly in background
- Loops infinitely
- No audio (muted)
- Fills screen (aspect-crop)
- Status bar and dock visible over video

### **Fallback (If Video Fails):**
- Blue-tinted animated gradient
- Subtle scanlines
- Still fully functional
- Dock clearly visible

---

## 🔍 **Debug Checklist:**

- [ ] Video file exists: `assets\wallpapers\default.mp4`
- [ ] Video file is MP4 H.264 format
- [ ] CMake cache cleaned before rebuild
- [ ] QOR.exe rebuilt AFTER adding video
- [ ] Qt DLLs deployed (windeployqt)
- [ ] Debug launch shows "Playing" state
- [ ] No error messages in console

---

## 📚 **Related Files:**
- `Fix-Video-Background.bat` - Automated fix script
- `VIDEO-BACKGROUND-SETUP.md` - Complete setup guide
- `Run-With-Errors.bat` - Debug launch script
- `qml.qrc` - Resource file (includes video)
- `src/qml/main.qml` - Video playback code

---

## 🎬 **Next Steps:**

1. **Run fix script:**
   ```
   .\Fix-Video-Background.bat
   ```

2. **Launch with debug:**
   ```
   .\Run-With-Errors.bat
   ```

3. **Check console output** for video status

4. **If still not working:** Copy console output and report issue

---

**Most Common Solution:** Just rebuild! The video needs to be compiled into the executable. 🎥
