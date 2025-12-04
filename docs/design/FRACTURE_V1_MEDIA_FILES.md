# Fracture v1 - Media Files Setup

## Required Media Files

Place the following files in: **`apps/portal-web/public/media/`**

### 1. Video Background Files

**`fracture-bg.webm`**
- Format: WebM (VP9 codec recommended)
- Resolution: 1920x1080 (or higher, will be scaled)
- Frame rate: 30fps
- Duration: 5-10 seconds (looping)
- File size: Aim for < 5MB (compressed)
- Content: Dark, abstract, space-like, suitable for background
- Should loop seamlessly

**`fracture-bg.mp4`**
- Format: MP4 (H.264 codec)
- Same specifications as WebM
- Used as fallback for browsers that don't support WebM
- Should be identical content to WebM version

**Optional: `fracture-bg-poster.jpg`**
- Static image shown while video loads
- Resolution: 1920x1080
- Format: JPEG
- File size: < 500KB
- Should be a representative frame from the video

### 2. Audio File

**`fracture-ambience.mp3`**
- Format: MP3
- Bitrate: 128-192 kbps
- Duration: 2-5 minutes (will loop)
- Content: Dark, ambient, minimal, atmospheric
- Should loop seamlessly (no gaps at loop point)
- Volume: Normalized (not too loud, will be played at 30% volume)

---

## File Placement

```
apps/portal-web/
└── public/
    └── media/
        ├── fracture-bg.webm          ← Place here
        ├── fracture-bg.mp4           ← Place here
        ├── fracture-ambience.mp3     ← Place here
        └── fracture-bg-poster.jpg    ← Optional
```

---

## What Happens Without Files

The app gracefully handles missing files:

- **Missing video files:** Falls back to dark gradient background
- **Missing audio file:** AudioToggle will show error in console, but app continues to work
- **Missing poster:** Video will show first frame or black screen while loading

---

## Testing After Adding Files

1. **Video Background:**
   - Visit `http://localhost:3000/`
   - Video should play automatically, loop seamlessly
   - Should be dark and atmospheric

2. **Audio Reactivity:**
   - Click the AudioToggle (:: or []) in the nav
   - Audio should start playing (check browser console for errors if file missing)
   - Edge glows should appear subtly when audio is active
   - Vignette should pulse with low frequencies

3. **Visual Effects:**
   - HeroPanel should have subtle jitter/motion when audio is playing
   - Text/glyphs should pulse slightly
   - Overall experience should feel "alive" but not distracting

---

## Recommended Tools for Creating Files

### Video:
- **FFmpeg** for conversion/compression
- **After Effects / Blender** for creation
- **HandBrake** for compression

### Audio:
- **Audacity** for editing/looping
- **FFmpeg** for format conversion
- **LAME** for MP3 encoding

---

## Example FFmpeg Commands

### Convert video to WebM:
```bash
ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus -b:a 128k fracture-bg.webm
```

### Convert video to MP4 (H.264):
```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset slow -c:a aac -b:a 128k fracture-bg.mp4
```

### Create seamless loop (audio):
```bash
ffmpeg -i input.wav -af "aloop=loop=-1:size=2e+09" -t 300 fracture-ambience.mp3
```

---

## Notes

- All files are served statically from `/public/media/`
- Files are referenced in code as `/media/fracture-bg.webm`, etc.
- Next.js automatically serves files from `public/` directory
- No build step required for media files (just place them and restart dev server)

