# Phase 4: Audio Engine Activation - Implementation Guide

## Files to Edit

### 1. Complete AudioEngine.ts

**File**: `apps/portal-web/src/lib/fracture/audio/AudioEngine.ts`

**Current State**: Basic scaffolding exists
**Action**: Complete the implementation

```typescript
"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface AudioEngineState {
  isReady: boolean;
  isPlaying: boolean;
  analyser: AnalyserNode | null;
  audioContext: AudioContext | null;
  source: MediaElementAudioSourceNode | null;
}

export function useAudioEngine() {
  const [state, setState] = useState<AudioEngineState>({
    isReady: false,
    isPlaying: false,
    analyser: null,
    audioContext: null,
    source: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize AudioContext
  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;

    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;

      setState((prev) => ({
        ...prev,
        isReady: true,
        analyser,
        audioContext,
      }));
    } catch (error) {
      console.error("Failed to initialize AudioContext:", error);
    }

    return () => {
      if (audioContext) {
        audioContext.close().catch(console.error);
      }
    };
  }, []);

  // Connect audio element to analyser
  const connectAudio = useCallback((audioElement: HTMLAudioElement) => {
    if (!state.audioContext || !state.analyser) return;

    try {
      const source = state.audioContext.createMediaElementSource(audioElement);
      source.connect(state.analyser);
      state.analyser.connect(state.audioContext.destination);

      audioRef.current = audioElement;
      setState((prev) => ({ ...prev, source }));

      // Handle play/pause
      audioElement.addEventListener("play", () => {
        if (state.audioContext?.state === "suspended") {
          state.audioContext.resume();
        }
        setState((prev) => ({ ...prev, isPlaying: true }));
      });

      audioElement.addEventListener("pause", () => {
        setState((prev) => ({ ...prev, isPlaying: false }));
      });

      audioElement.addEventListener("ended", () => {
        setState((prev) => ({ ...prev, isPlaying: false }));
      });
    } catch (error) {
      console.error("Failed to connect audio:", error);
    }
  }, [state.audioContext, state.analyser]);

  // Connect microphone (optional)
  const connectMicrophone = useCallback(async () => {
    if (!state.audioContext || !state.analyser) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = state.audioContext.createMediaStreamSource(stream);
      source.connect(state.analyser);
      state.analyser.connect(state.audioContext.destination);

      setState((prev) => ({ ...prev, isPlaying: true, source }));
    } catch (error) {
      console.error("Failed to connect microphone:", error);
    }
  }, [state.audioContext, state.analyser]);

  return {
    ...state,
    connectAudio,
    connectMicrophone,
    audioRef,
  };
}
```

### 2. Update AbyssReactive.ts to Map States

**File**: `apps/portal-web/src/lib/fracture/audio/AbyssReactive.ts`

**Enhancement**: Add state-specific audio reactivity

```typescript
import { useState, useEffect } from "react";
import { useAudioSpectrum } from "./useAudioSpectrum";
import { AbyssState } from "@/components/fracture/AbyssStateMachine";

interface AbyssReactiveState {
  low: number;
  mid: number;
  high: number;
  pulseEvent: boolean;
  silenceDecay: number;
  // State-specific values
  turbulence: number;
  glitchAmount: number;
  bloomIntensity: number;
  vignetteIntensity: number;
}

export function useAbyssReactive(abyssState: AbyssState): AbyssReactiveState {
  const { low, mid, high } = useAudioSpectrum();
  const [pulseEvent, setPulseEvent] = useState(false);
  const [silenceDecay, setSilenceDecay] = useState(0);

  // Map audio to state-specific effects
  const turbulence = abyssState === "checking" 
    ? Math.min(low * 0.3 + mid * 0.2, 1.0)
    : abyssState === "binding" 
    ? Math.min(low * 0.5, 0.8)
    : 0.1;

  const glitchAmount = abyssState === "reject" 
    ? Math.min(high * 0.8 + mid * 0.3, 1.0)
    : 0.0;

  const bloomIntensity = abyssState === "accept" 
    ? Math.min(low * 0.6 + mid * 0.4, 1.0)
    : abyssState === "confirm"
    ? Math.min(low * 0.4, 0.7)
    : 0.0;

  const vignetteIntensity = abyssState === "binding"
    ? Math.min(0.3 + low * 0.5, 0.9)
    : 0.0;

  useEffect(() => {
    // Trigger pulse on strong low frequency during accept/confirm
    if ((abyssState === "accept" || abyssState === "confirm") && low > 0.7) {
      setPulseEvent(true);
      const timeout = setTimeout(() => setPulseEvent(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [low, abyssState]);

  useEffect(() => {
    // Silence decay for subtle background hum
    if (low < 0.1 && mid < 0.1 && high < 0.1) {
      setSilenceDecay((prev) => Math.min(prev + 0.01, 1));
    } else {
      setSilenceDecay(0);
    }
  }, [low, mid, high]);

  return {
    low,
    mid,
    high,
    pulseEvent,
    silenceDecay,
    turbulence,
    glitchAmount,
    bloomIntensity,
    vignetteIntensity,
  };
}
```

### 3. Update ShaderPlane to Use AbyssReactive

**File**: `apps/portal-web/src/components/fracture/ShaderPlane.tsx`

**Enhancement**: Wire AbyssReactive values into shader uniforms

```typescript
// In ShaderCanvas component, update the useFrame hook:

useFrame(({ clock }) => {
  if (material.current) {
    material.current.uniforms.iTime.value = clock.getElapsedTime();
    
    // Use AbyssReactive values
    material.current.uniforms.u_low_freq.value = reactive.low;
    material.current.uniforms.u_mid_freq.value = reactive.mid;
    material.current.uniforms.u_high_freq.value = reactive.high;
    
    // State-specific effects
    material.current.uniforms.u_glitch_amount.value = reactive.glitchAmount;
    material.current.uniforms.u_bloom_intensity.value = reactive.bloomIntensity;
    material.current.uniforms.u_vignette_intensity.value = reactive.vignetteIntensity;
    
    // Turbulence (affects warp)
    material.current.uniforms.u_intensity.value = 0.5 + reactive.turbulence * 0.3;
  }
});
```

### 4. Add Background Music Support

**File**: `apps/portal-web/src/lib/fracture/audio/useBackgroundMusic.ts` (NEW)

```typescript
"use client";

import { useState, useRef, useEffect } from "react";
import { useAudioEngine } from "./AudioEngine";

interface Track {
  name: string;
  url: string;
}

const DEFAULT_PLAYLIST: Track[] = [
  // Add your tracks here
  // { name: "Track 1", url: "/media/music/track1.mp3" },
];

export function useBackgroundMusic() {
  const { connectAudio, isReady } = useAudioEngine();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isReady && audioRef.current) {
      connectAudio(audioRef.current);
    }
  }, [isReady, connectAudio]);

  const playTrack = (track: Track) => {
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.play();
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return {
    currentTrack,
    isPlaying,
    playTrack,
    stop,
    audioRef,
  };
}
```

## Integration Steps

1. **Update AbyssIDDialog** to pass state to ShaderPlane:
   ```typescript
   <ShaderPlane mode={state} />
   ```

2. **Add Audio Toggle** to FractureShell or AbyssIDDialog

3. **Test**: Open AbyssID ritual and verify audio-reactive effects change with state transitions

