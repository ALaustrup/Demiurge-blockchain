# Login Voice Setup

## Overview
The AbyssOS Portal now plays a voice file in the background when the login/signup screen appears, right after the intro video ends.

## Audio File Location
Place your voice audio file at the following path:
```
apps/abyssos-portal/public/audio/login-voice.wav
```

**Supported formats:** `.wav`, `.mp3`, `.ogg`

**Recommended format:** `.wav` for best compatibility

## How it Works
1. **Intro Video Plays**: The intro video (`intro.mp4`) plays first when visitors land on the site
2. **Video Ends**: When the intro video completes, the login/signup screen appears
3. **Voice Plays**: The login voice file automatically starts playing in the background
4. **One-Time Playback**: The voice plays once and does not loop (unlike background music)

## Features
- **Automatic Playback**: Plays automatically when the login screen appears
- **Background Audio**: Plays in the background while users interact with the login form
- **Volume Control**: Default volume is set to 70% (adjustable in code)
- **Error Handling**: Gracefully handles missing files or playback errors
- **One-Time Only**: Plays once per session (won't replay if user navigates back)

## Customization
To adjust the volume, edit `apps/abyssos-portal/src/services/loginVoice.ts`:
```typescript
private volume: number = 0.7; // Change this value (0.0 to 1.0)
```

## Troubleshooting
- **Voice not playing**: 
  - Ensure the file is placed at `public/audio/login-voice.wav`
  - Check browser console for error messages
  - Verify file format is supported (.wav, .mp3, or .ogg)
  - Some browsers may block autoplay - user interaction may be required

- **File too large**: Consider compressing the audio file to reduce load time

## File Structure
```
apps/abyssos-portal/
├── public/
│   ├── audio/
│   │   ├── background-music.wav    # Background music (loops)
│   │   └── login-voice.wav          # Login voice (plays once) ← Place your file here
│   └── video/
│       └── intro.mp4                # Intro video
```

