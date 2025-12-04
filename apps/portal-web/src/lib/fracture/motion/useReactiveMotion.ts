"use client";

import { useMemo } from "react";
import { useAudioSpectrum } from "../audio/useAudioSpectrum";

/**
 * useReactiveMotion
 * 
 * Maps low/mid/high frequency bands to subtle UI motion props.
 * Effects are subtle, almost subliminal, but definitely alive.
 */
export function useReactiveMotion() {
  const { low, mid, high, isActive } = useAudioSpectrum();

  const motionProps = useMemo(() => {
    if (!isActive) {
      return {
        glowIntensity: 0,
        panelJitter: {
          x: 0,
          y: 0,
          rotation: 0,
        },
        fogDensity: 0,
        glyphPulse: 0,
      };
    }

    // Normalize values (0-255) to 0-1 range
    const lowNorm = Math.min(low / 255, 1);
    const midNorm = Math.min(mid / 255, 1);
    const highNorm = Math.min(high / 255, 1);

    // Apply smoothing and subtle scaling
    const smoothLow = lowNorm * 0.7; // Reduce intensity for subtlety
    const smoothMid = midNorm * 0.6;
    const smoothHigh = highNorm * 0.5;

    return {
      // Glow intensity: overall energy, influences edge glows
      glowIntensity: Math.min((smoothLow + smoothMid + smoothHigh) / 3, 0.4), // Cap at 40% for subtlety
      
      // Panel jitter: tiny positional offset based on mid frequencies
      panelJitter: {
        x: (smoothMid - 0.5) * 1.5, // Max ±0.75px
        y: (smoothLow - 0.5) * 1.2, // Max ±0.6px
        rotation: (smoothHigh - 0.5) * 0.5, // Max ±0.25deg
      },
      
      // Fog density: low frequencies influence vignette intensity
      fogDensity: smoothLow * 0.3, // Max 30% opacity
      
      // Glyph pulse: high frequencies create subtle pulse on text/glyphs
      glyphPulse: smoothHigh * 0.15, // Max 15% scale variation
    };
  }, [low, mid, high, isActive]);

  return {
    ...motionProps,
    isActive, // Expose isActive for components that need it
  };
}

