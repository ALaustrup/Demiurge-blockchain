# 🎬 QOR Desktop - Video Background Setup Guide

## 📂 **Where to Place Your Video**

**Location:**
```
C:\Repos\DEMIURGE\apps\qor-desktop\assets\wallpapers\default.mp4
```

**Filename:** Must be exactly `default.mp4`

---

## 🎥 **Video Requirements**

### **Recommended Specs:**
| Property | Value | Why |
|----------|-------|-----|
| **Format** | MP4 | Best compatibility with Qt Multimedia |
| **Codec** | H.264 | Hardware-accelerated on all GPUs |
| **Resolution** | 1920x1080 | Standard Full HD |
| **Framerate** | 30fps | Smooth without high CPU usage |
| **Bitrate** | 5-10 Mbps | Good quality, manageable file size |
| **Duration** | 10-60 seconds | Seamless loop without being repetitive |
| **Audio** | None/Muted | Audio will be muted automatically |

### **Supported Formats:**
- ✅ MP4 (H.264) - **Recommended**
- ✅ MP4 (H.265/HEVC) - Smaller file, requires modern GPU
- ✅ WebM - Good for transparency effects
- ✅ MOV - Apple format, larger files

---

## 🛠️ **Converting Your Video**

If your video isn't in the right format, use **FFmpeg** (free tool):

### **Install FFmpeg:**
```powershell
# Using winget (Windows Package Manager)
winget install FFmpeg

# Or download from: https://ffmpeg.org/download.html
```

### **Convert Video to Optimal Format:**
```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -s 1920x1080 -r 30 -an default.mp4
```

**Explanation:**
- `-i input.mp4` - Your source video
- `-c:v libx264` - Use H.264 codec
- `-crf 23` - Quality (18-28, lower = better quality)
- `-preset medium` - Encoding speed vs compression
- `-s 1920x1080` - Resize to 1080p
- `-r 30` - 30 frames per second
- `-an` - Remove audio track
- `default.mp4` - Output filename

### **For Smaller File Size:**
```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 28 -preset slow -s 1920x1080 -r 30 -an default.mp4
```

### **For 4K Video:**
```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -s 3840x2160 -r 30 -an default.mp4
```

---

## 📋 **Step-by-Step Setup**

### **Method 1: Using the Helper Script**

1. Copy your `.mp4` file to:
   ```
   C:\Repos\DEMIURGE\apps\qor-desktop\assets\wallpapers\
   ```

2. Rename it to `default.mp4`

3. Double-click: `Add-Video.bat` to verify

4. Rebuild QOR:
   ```powershell
   cd C:\Repos\DEMIURGE\apps\qor-desktop
   .\Simple-Rebuild.bat
   ```

5. Launch QOR:
   ```powershell
   .\Launch-QOR.bat
   ```

### **Method 2: Manual Process**

1. **Place Video:**
   ```powershell
   # Copy your video
   Copy-Item "C:\Path\To\Your\Video.mp4" "C:\Repos\DEMIURGE\apps\qor-desktop\assets\wallpapers\default.mp4"
   ```

2. **Rebuild:**
   ```powershell
   cd C:\Repos\DEMIURGE\apps\qor-desktop\build
   cmake --build . --config Release
   ```

3. **Launch:**
   ```powershell
   cd C:\Repos\DEMIURGE\apps\qor-desktop
   .\Launch-QOR.bat
   ```

---

## 🎨 **How It Works**

### **QML Implementation:**
The video background is implemented in `main.qml`:

```qml
Video {
    id: videoBackground
    anchors.fill: parent
    source: "qrc:/assets/wallpapers/default.mp4"
    fillMode: VideoOutput.PreserveAspectCrop
    autoPlay: true
    loops: MediaPlayer.Infinite
    muted: true
}
```

### **Features:**
- ✨ **Infinite looping** - Seamlessly repeats forever
- 🔇 **Always muted** - No audio distraction
- 🖼️ **Aspect crop** - Fills screen without stretching
- 🛡️ **Fallback gradient** - Shows if video fails to load
- 🌑 **Vignette overlay** - Ensures UI text is readable
- 📊 **Bottom darkening** - Makes dock visible

---

## 🔧 **Troubleshooting**

### **Video Not Playing?**

1. **Check file format:**
   ```powershell
   ffprobe default.mp4
   ```

2. **Verify file exists:**
   ```powershell
   Test-Path "C:\Repos\DEMIURGE\apps\qor-desktop\assets\wallpapers\default.mp4"
   ```

3. **Check console output:**
   ```powershell
   .\Run-With-Errors.bat
   ```
   Look for: `🎬 Loading video background: qrc:/assets/wallpapers/default.mp4`

### **Video Choppy/Laggy?**

- **Reduce resolution:** Convert to 1920x1080
- **Lower framerate:** Use 24fps instead of 60fps
- **Compress more:** Use higher CRF value (28-32)
- **Use H.264:** More compatible than H.265

### **File Too Large?**

```bash
# Compress aggressively
ffmpeg -i default.mp4 -c:v libx264 -crf 32 -preset veryslow -s 1920x1080 -r 24 -an default_compressed.mp4
```

---

## 🎯 **Future Enhancements**

**Coming Soon:**
- [ ] User wallpaper gallery (multiple videos to choose from)
- [ ] Upload custom videos via Settings widget
- [ ] Video playback speed control
- [ ] Image wallpaper support (static backgrounds)
- [ ] Blur/brightness adjustments
- [ ] Per-workspace backgrounds

---

## 📁 **File Structure**

```
apps/qor-desktop/
├── assets/
│   └── wallpapers/
│       ├── default.mp4           ← Your video goes here
│       ├── Add-Video.bat         ← Helper script
│       ├── README.md             ← This guide
│       └── PLACE_VIDEO_HERE.txt  ← Quick instructions
├── src/qml/
│   └── main.qml                  ← Video background implementation
└── qml.qrc                       ← Resource file (includes default.mp4)
```

---

## 🚀 **Quick Reference**

```powershell
# 1. Add your video
Copy-Item "YourVideo.mp4" "C:\Repos\DEMIURGE\apps\qor-desktop\assets\wallpapers\default.mp4"

# 2. Rebuild
cd C:\Repos\DEMIURGE\apps\qor-desktop
.\Simple-Rebuild.bat

# 3. Launch
.\Launch-QOR.bat
```

---

**Need Help?** Check `Run-With-Errors.bat` output for video loading messages.
