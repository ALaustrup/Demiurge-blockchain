# Background Music Setup

## Overview

AbyssOS supports background music that plays automatically after AbyssID login or signup. The music is enabled by default but can be toggled off by users via the toolbar widget.

## File Placement

Place your `.wav` music file at the following location:

```
apps/abyssos-portal/public/audio/background-music.wav
```

### Directory Structure

If the `public/audio/` directory doesn't exist, create it:

```bash
mkdir -p apps/abyssos-portal/public/audio
```

Then place your `.wav` file there:

```bash
cp /path/to/your/music.wav apps/abyssos-portal/public/audio/background-music.wav
```

## File Requirements

- **Format**: `.wav` (WAV audio format)
- **Location**: `apps/abyssos-portal/public/audio/background-music.wav`
- **Naming**: Must be exactly `background-music.wav`

## How It Works

1. **Automatic Playback**: Music starts automatically after successful AbyssID login or signup
2. **Looping**: Music loops continuously while playing
3. **Volume**: Default volume is set to 30% to avoid being too loud
4. **Toggle**: Users can toggle music on/off via the 🔊/🔇 button in the toolbar
5. **Persistence**: User preference (enabled/disabled) is saved in localStorage

## User Controls

Users can control background music via:

- **Toolbar Widget**: Click the 🔊/🔇 button in the top toolbar to toggle music
- **Settings**: Music preference is saved and persists across sessions

## Technical Details

- Music service: `apps/abyssos-portal/src/services/backgroundMusic.ts`
- Storage key: `abyssos_background_music_enabled` (localStorage)
- Volume storage: `abyssos_background_music_volume` (localStorage)
- Default volume: 0.3 (30%)

## Troubleshooting

If music doesn't play:

1. **Check file location**: Ensure file is at `public/audio/background-music.wav`
2. **Check file format**: Must be `.wav` format
3. **Browser autoplay**: Some browsers block autoplay - user may need to interact first
4. **Console errors**: Check browser console for loading errors

The system will gracefully handle missing files and log a warning to the console.

