# Fracture v1 Audit - Current State vs Spec

## Executive Summary

**Status:** Scaffolded but needs refinement to match dark, ancient, hostile aesthetic.

**Key Gaps:**
1. Visual tone is too friendly/bright (needs darker, menacing)
2. Audio engine not fully wired (stubbed, no real audio file)
3. Audio reactivity too subtle/not visible
4. HeroPanel lacks the "glass cathedral" aesthetic
5. Missing proper landing page showcasing Fracture
6. Theme colors need to be darker/more muted

---

## Component Audit

### ✅ FractureShell.tsx
**Current State:**
- Has video background setup (correct paths)
- Has gradient overlay (but too light: from-black/60)
- Has AudioReactiveLayer integration
- Content wrapped in glass panel

**Issues:**
- Gradient overlay not dark enough (spec: from-black/80)
- Missing noise layer
- Video fallback gradient is too colorful (slate-950, purple-950)
- Content container styling could be more "cathedral-like"

**Needs:**
- Darker gradient: `from-black/80 via-black/60 to-black`
- Add subtle noise/vignette overlay
- More menacing glass panel styling

---

### ⚠️ HeroPanel.tsx
**Current State:**
- Basic title/subtitle structure
- Gradient text (cyan/fuchsia/purple)
- Generic friendly styling

**Issues:**
- Too bright and friendly
- No glass panel container
- No dark tone copy
- Missing CTAs ("Enter the Abyss", "Read the Scrolls")
- No audio-reactive motion

**Needs:**
- Dark glass panel: `bg-white/5 border border-white/10 backdrop-blur-2xl`
- Overline: "DEM IURGE // ABYSSAL LATTICE"
- Title: "FRACTURE" (not gradient, more carved/etched)
- Dark subtitle with menacing tone
- Two CTAs with proper styling
- Audio-reactive subtle motion

---

### ⚠️ AudioEngine.ts
**Current State:**
- Basic AudioContext creation (lazy)
- AnalyserNode setup
- MediaElementSource connection

**Issues:**
- No actual audio file support
- No user interaction trigger
- FFT size too small (256, should be 2048 for better analysis)
- No error handling for audio file loading

**Needs:**
- Lazy AudioContext on user interaction
- Support for `/media/fracture-ambience.mp3`
- Better FFT size (2048)
- Proper audio element lifecycle

---

### ⚠️ AudioContextProvider.tsx
**Current State:**
- Context provider exists
- Basic startAudio/stopAudio
- Stubbed audio element creation

**Issues:**
- Creates dummy audio element (not real file)
- No user interaction requirement
- No togglePlay method
- Missing spectrum exposure

**Needs:**
- Load actual audio file from `/media/fracture-ambience.mp3`
- Require user interaction before starting
- Expose togglePlay method
- Better state management

---

### ⚠️ useReactiveMotion.ts
**Current State:**
- Maps low/mid/high to motion props
- Returns: glowIntensity, wobble, parallaxDepth, flicker

**Issues:**
- Props don't match spec (spec wants: glowIntensity, panelJitter, fogDensity, glyphPulse)
- Values might be too subtle or too strong

**Needs:**
- Rename/remap to match spec:
  - `glowIntensity` ✓ (keep)
  - `panelJitter` (replace wobble)
  - `fogDensity` (replace parallaxDepth)
  - `glyphPulse` (replace flicker)
- Ensure subtle but noticeable effects

---

### ⚠️ AudioReactiveLayer.tsx
**Current State:**
- Basic radial gradient based on low band
- Very subtle opacity changes

**Issues:**
- Too subtle (almost invisible)
- Not using useReactiveMotion values
- Only affects opacity, not other visual properties

**Needs:**
- Use useReactiveMotion values
- Apply fogDensity to vignette
- Apply glowIntensity to edge glows
- More visible but still subtle

---

### ⚠️ AudioToggle.tsx
**Current State:**
- Uses Volume2/VolumeX icons
- Fixed bottom-right position
- Basic styling

**Issues:**
- Generic speaker icons (spec wants minimal glyphs)
- Not in nav (spec wants top-right in nav)
- Styling could be more minimal/menacing

**Needs:**
- Minimal glyph design (::, [], etc.)
- Move to nav (top-right)
- Darker, more minimal styling

---

### ⚠️ FractureNav.tsx
**Current State:**
- Has all correct routes (Haven, Void, Nexus, Scrolls, Conspire)
- AbyssID button works
- Brand shows "DEMIURGE"

**Issues:**
- Brand should show "FRACTURE" (spec says "FRACTURE" is the update name)
- Colors might be too bright
- Missing AudioToggle integration

**Needs:**
- Update brand to "FRACTURE" (keep DEMIURGE as project name in metadata)
- Darker color scheme
- Integrate AudioToggle in nav

---

### ✅ fractureTheme.ts
**Current State:**
- Has color definitions
- Has gradients
- Has effects

**Issues:**
- Colors might be too bright
- Missing darker variants
- Could use more menacing tones

**Needs:**
- Darker primary colors
- More muted accents
- Better glassmorphism tokens

---

### ⚠️ Landing Page (app/page.tsx)
**Current State:**
- Redirects to /haven

**Issues:**
- No dedicated Fracture landing experience
- Users don't see the full Fracture aesthetic

**Needs:**
- Create proper landing with FractureShell + HeroPanel
- Showcase video background, audio reactivity
- Proper CTAs

---

## Files That Need Changes

1. `apps/portal-web/src/components/fracture/FractureShell.tsx` - Darker overlay, noise, better styling
2. `apps/portal-web/src/components/fracture/HeroPanel.tsx` - Complete redesign for dark glass cathedral
3. `apps/portal-web/src/lib/fracture/audio/AudioEngine.ts` - Real audio file support, better FFT
4. `apps/portal-web/src/lib/fracture/audio/AudioContextProvider.tsx` - User interaction trigger, real audio
5. `apps/portal-web/src/lib/fracture/motion/useReactiveMotion.ts` - Map to spec values
6. `apps/portal-web/src/components/fracture/AudioReactiveLayer.tsx` - Use reactive motion, more visible
7. `apps/portal-web/src/components/fracture/AudioToggle.tsx` - Minimal glyphs, move to nav
8. `apps/portal-web/src/components/fracture/FractureNav.tsx` - Darker tone, "FRACTURE" brand, AudioToggle
9. `apps/portal-web/src/lib/fracture/theme/fractureTheme.ts` - Darker colors
10. `apps/portal-web/src/app/page.tsx` - Create proper Fracture landing

---

## Media Files Required

**Location:** `apps/portal-web/public/media/`

**Files Needed:**
1. `fracture-bg.webm` - Video background (WebM format)
2. `fracture-bg.mp4` - Video background (MP4 fallback)
3. `fracture-ambience.mp3` - Ambient audio track for reactivity

**Note:** These files are NOT in the repo yet. User must add them.

---

## Implementation Priority

1. **High Priority:**
   - FractureShell overlay refinement
   - HeroPanel redesign
   - Audio engine wiring (real file)
   - useReactiveMotion spec mapping

2. **Medium Priority:**
   - AudioReactiveLayer enhancement
   - AudioToggle redesign
   - FractureNav updates
   - Theme refinement

3. **Low Priority:**
   - Landing page creation
   - Noise layer (can be CSS-based)

