# QOR Desktop Wallpapers

This folder contains the background video/images for QOR Desktop.

## 📹 **Default Background**

Place your default background video here:
- **Filename:** `default.mp4`
- **Format:** MP4 (H.264 codec recommended)
- **Resolution:** 1920x1080 or higher recommended
- **Loop:** The video will automatically loop infinitely
- **Audio:** Will be muted (background only)

## ✨ **Features**

- **Automatic looping** - Video plays seamlessly forever
- **Performance optimized** - GPU-accelerated playback
- **Fallback support** - If video fails, shows dark gradient
- **Vignette overlay** - Ensures text readability
- **Bottom darkening** - Makes dock visible against any background

## 🎨 **Adding Your Video**

1. Copy your `.mp4` file to this folder
2. Rename it to `default.mp4` (or keep multiple for user choice)
3. Rebuild QOR Desktop:
   ```powershell
   cd C:\Repos\DEMIURGE\apps\qor-desktop\build
   cmake --build . --config Release
   ```
4. Launch QOR to see your new background!

## 📐 **Recommended Video Specs**

```
Format:     MP4
Codec:      H.264 (best compatibility)
Resolution: 1920x1080 (1080p)
Framerate:  30fps (smooth, not resource-heavy)
Bitrate:    5-10 Mbps (good quality, small file)
Duration:   10-60 seconds (seamless loop)
Audio:      None (will be muted anyway)
```

## 🔧 **User Customization (Future)**

Users will be able to:
- Select from multiple wallpapers via Settings widget
- Upload their own videos/images
- Adjust video playback speed
- Toggle video on/off for performance

---

**Current Status:** Single default video background  
**Next Phase:** User-selectable wallpaper gallery
