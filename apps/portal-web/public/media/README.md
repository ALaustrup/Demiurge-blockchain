# Media Files

## Video Background

To use a custom video background for the site:

1. Place your `.mp4` file in this directory (`apps/portal-web/public/media/`)
2. Name it `background.mp4`
3. The video will automatically play on loop as the site background

The video should be:
- MP4 format (H.264 codec recommended for best compatibility)
- Optimized for web (reasonable file size)
- Suitable for looping (seamless start/end)

The video background is configured in `apps/portal-web/src/components/fracture/FractureShell.tsx` and will:
- Auto-play on page load
- Loop continuously
- Be muted (required for autoplay)
- Cover the full viewport
- Fall back to gradient if video fails to load

## Other Media Files

- `fracture-bg.mp4` / `fracture-bg.webm` - Alternative background videos (fallback)
- `fracture-bg-poster.jpg` - Poster image shown before video loads
