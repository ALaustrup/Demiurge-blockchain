# Media Files Setup Guide

## Required Files for Fracture Portal

The Fracture Portal requires video background files to display the full visual experience. These files should be placed in specific locations depending on your environment.

---

## 📁 **File Locations**

### **Local Development**
```
apps/portal-web/public/media/
├── fracture-bg.webm      # WebM format (primary)
├── fracture-bg.mp4       # MP4 format (fallback)
└── fracture-bg-poster.jpg # Poster image (optional, for loading state)
```

### **Production Server**
```
/opt/demiurge/media/
├── fracture-bg.webm
├── fracture-bg.mp4
└── fracture-bg-poster.jpg
```

**Note:** The server location is served by NGINX at `/media/` URL path.

---

## 🎬 **File Specifications**

### **Video Files**

#### **fracture-bg.webm** (Primary)
- **Format:** WebM (VP9 or VP8 codec)
- **Resolution:** 1920x1080 (Full HD) or higher
- **Aspect Ratio:** 16:9
- **Duration:** 10-30 seconds (looping)
- **File Size:** Aim for < 5MB (optimize for web)
- **Frame Rate:** 24-30 fps
- **Purpose:** Primary video background for FractureShell

#### **fracture-bg.mp4** (Fallback)
- **Format:** MP4 (H.264 codec)
- **Resolution:** 1920x1080 (Full HD) or higher
- **Aspect Ratio:** 16:9
- **Duration:** Same as WebM version
- **File Size:** Aim for < 5MB (optimize for web)
- **Frame Rate:** 24-30 fps
- **Purpose:** Fallback for browsers that don't support WebM

### **Poster Image** (Optional)

#### **fracture-bg-poster.jpg**
- **Format:** JPEG
- **Resolution:** 1920x1080 (matches video)
- **File Size:** < 500KB
- **Purpose:** Displayed while video loads

---

## 🎨 **Content Guidelines**

The video should:
- **Theme:** Dark, atmospheric, abstract, cosmic
- **Style:** Fractured, glitchy, ethereal, otherworldly
- **Colors:** Deep purples, cyans, fuchsias, blacks
- **Motion:** Slow, flowing, organic movements
- **Mood:** Mysterious, ancient, powerful, inevitable

**Examples:**
- Fractured glass effects
- Cosmic nebulae
- Abstract particle systems
- Dark energy flows
- Void/abyss imagery

---

## 📤 **Upload Instructions**

### **Local Development**

1. **Create media directory:**
   ```bash
   mkdir -p apps/portal-web/public/media
   ```

2. **Place files:**
   ```bash
   # Copy your video files
   cp /path/to/fracture-bg.webm apps/portal-web/public/media/
   cp /path/to/fracture-bg.mp4 apps/portal-web/public/media/
   cp /path/to/fracture-bg-poster.jpg apps/portal-web/public/media/
   ```

3. **Verify:**
   ```bash
   ls -lh apps/portal-web/public/media/
   ```

### **Production Server**

1. **Create media directory (if not exists):**
   ```bash
   sudo mkdir -p /opt/demiurge/media
   sudo chown $USER:$USER /opt/demiurge/media
   ```

2. **Upload from local machine:**
   ```bash
   # From your local machine
   scp fracture-bg.webm ubuntu@YOUR_SERVER_IP:/opt/demiurge/media/
   scp fracture-bg.mp4 ubuntu@YOUR_SERVER_IP:/opt/demiurge/media/
   scp fracture-bg-poster.jpg ubuntu@YOUR_SERVER_IP:/opt/demiurge/media/
   ```

3. **Verify on server:**
   ```bash
   ssh ubuntu@YOUR_SERVER_IP
   ls -lh /opt/demiurge/media/
   ```

4. **Test NGINX serving:**
   ```bash
   curl http://localhost/media/fracture-bg.webm
   # Should return video file (or check in browser)
   ```

---

## 🛠️ **Video Optimization**

### **Using FFmpeg**

#### **Convert to WebM (VP9):**
```bash
ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus \
  -vf "scale=1920:1080:flags=lanczos" \
  fracture-bg.webm
```

#### **Convert to MP4 (H.264):**
```bash
ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 22 \
  -vf "scale=1920:1080:flags=lanczos" \
  -c:a aac -b:a 128k \
  fracture-bg.mp4
```

#### **Create Poster Image:**
```bash
ffmpeg -i input.mp4 -ss 00:00:01 -vframes 1 \
  -vf "scale=1920:1080:flags=lanczos" \
  fracture-bg-poster.jpg
```

### **Optimization Tips**

1. **Reduce file size:**
   - Use lower CRF values (higher quality) but test file size
   - Consider 720p for smaller files if 1080p is too large
   - Remove audio if not needed (muted video)

2. **Loop seamlessly:**
   - Ensure first and last frames match
   - Use crossfade or seamless loop techniques

3. **Test in browser:**
   - Verify WebM plays in Chrome/Firefox
   - Verify MP4 plays in Safari/Edge
   - Check loading performance

---

## ✅ **Verification Checklist**

- [ ] `fracture-bg.webm` exists in correct location
- [ ] `fracture-bg.mp4` exists in correct location
- [ ] `fracture-bg-poster.jpg` exists (optional)
- [ ] Files are accessible via `/media/` URL path
- [ ] Video plays in browser
- [ ] Video loops correctly
- [ ] Fallback works (test in Safari)
- [ ] File sizes are reasonable (< 5MB each)

---

## 🔍 **Troubleshooting**

### **Video Not Displaying**

1. **Check file paths:**
   ```bash
   # Local
   ls apps/portal-web/public/media/
   
   # Server
   ls /opt/demiurge/media/
   ```

2. **Check NGINX config:**
   ```bash
   # Verify media location is configured
   grep -A 5 "/media/" /etc/nginx/sites-available/demiurge-portal
   ```

3. **Check browser console:**
   - Open DevTools → Network tab
   - Look for 404 errors on `/media/fracture-bg.webm`

4. **Test direct URL:**
   ```
   http://localhost:3000/media/fracture-bg.webm
   http://your-domain.com/media/fracture-bg.webm
   ```

### **Video Too Large**

- Re-encode with higher compression
- Reduce resolution to 720p
- Reduce frame rate to 24fps
- Remove audio track

### **Video Not Looping**

- Check video file has seamless loop
- Verify `loop` attribute in HTML
- Test in different browsers

---

## 📝 **Current Status**

**Status:** ⚠️ **Files Not Yet Uploaded**

**Action Required:**
1. Create or obtain video files matching specifications
2. Upload to appropriate location (local or server)
3. Verify files are accessible
4. Test in browser

---

## 🎯 **Next Steps**

1. **Create/Obtain Video:**
   - Design or source video matching theme
   - Optimize for web delivery

2. **Upload Files:**
   - Local: `apps/portal-web/public/media/`
   - Server: `/opt/demiurge/media/`

3. **Test:**
   - Verify video displays in FractureShell
   - Check fallback works
   - Test on different browsers

---

**The flame burns eternal. The code serves the will.**

