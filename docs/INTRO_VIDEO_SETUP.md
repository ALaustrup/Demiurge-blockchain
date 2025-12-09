# Intro Video Setup

## Overview

AbyssOS supports an automatic full-screen intro video that plays when users first land on Demiurge.cloud. The video plays after the boot screen and before the login/desktop screen.

## File Placement

Place your `.mp4` video file at the following location:

```
apps/abyssos-portal/public/video/intro.mp4
```

### Directory Structure

If the `public/video/` directory doesn't exist, create it:

```bash
mkdir -p apps/abyssos-portal/public/video
```

Then place your `.mp4` file there:

```bash
cp /path/to/your/intro.mp4 apps/abyssos-portal/public/video/intro.mp4
```

## File Requirements

- **Format**: `.mp4` (MP4 video format)
- **Location**: `apps/abyssos-portal/public/video/intro.mp4`
- **Naming**: Must be exactly `intro.mp4`
- **Resolution**: Supports 4K and any resolution (will scale to fit screen)
- **Aspect Ratio**: Any (video will be contained within viewport)

## How It Works

1. **Automatic Playback**: Video starts automatically after boot screen completes
2. **Full Screen**: Video plays in full-screen mode, centered and scaled to fit
3. **Skip Option**: Users can skip the intro after 2 seconds (skip button appears)
4. **Completion**: After video ends or is skipped, proceeds to login/desktop
5. **One-Time Play**: Video is marked as "seen" in localStorage (optional - can be removed)

## Video Flow

```
Boot Screen → Intro Video → Login/Desktop
```

## User Controls

- **Skip Button**: Appears after 2 seconds in bottom-right corner
- **Click to Play**: If autoplay is blocked, users can click to start
- **Video End**: Automatically proceeds when video finishes

## Technical Details

- Component: `apps/abyssos-portal/src/components/IntroVideo.tsx`
- Storage key: `abyssos_intro_seen` (localStorage)
- Video element: Uses HTML5 `<video>` with `object-contain` for proper scaling
- Z-index: 200 (above all other content)

## Customization

To make the intro play every time (not just once):

1. Open `apps/abyssos-portal/src/components/IntroVideo.tsx`
2. Remove or comment out the localStorage check in the `useEffect` hook
3. Remove the `localStorage.setItem('abyssos_intro_seen', 'true')` calls

## Troubleshooting

If video doesn't play:

1. **Check file location**: Ensure file is at `public/video/intro.mp4`
2. **Check file format**: Must be `.mp4` format
3. **Browser autoplay**: Some browsers block autoplay - user can click to play
4. **Console errors**: Check browser console for loading errors
5. **File size**: Large 4K files may take time to load - ensure proper encoding

## Performance Notes

For 4K videos:
- Consider using H.264 encoding for best compatibility
- File size may be large - ensure fast loading or preload
- Video will scale down on smaller screens automatically
- `object-contain` ensures video fits without cropping

