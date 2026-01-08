# QLOUD OS Intro Video

## Required File

Place your intro video at:
```
public/video/intro.mp4
```

## Video Specifications

- **Format:** MP4 (H.264 codec recommended)
- **Duration:** 10-30 seconds recommended
- **Resolution:** 1920x1080 (Full HD) or higher
- **Aspect Ratio:** 16:9
- **Audio:** Optional (will be muted by default)

## Behavior

- Video plays on first visit to QLOUD OS
- User can click to start playback
- "Skip Intro" button appears after 1 second
- If video file is missing or fails to load, user can skip immediately

## Production Deployment

When deploying to production, ensure:
1. Video file is compressed for web (use FFmpeg or similar)
2. File size is reasonable (< 20MB recommended)
3. File is placed in `public/video/intro.mp4` before building

## Build Command

```bash
pnpm build
```

The video will be copied to the dist folder automatically during build.

---

**Note:** Video file is not included in Git repository due to size. 
Add to production manually or via CI/CD pipeline.
