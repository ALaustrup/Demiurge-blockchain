"use client";

import { useMemo } from "react";
import { useAudioSpectrum } from "./useAudioSpectrum";
import type { AbyssState } from "@/components/fracture/AbyssStateMachine";

/**
 * useAbyssReactive
 * 
 * Audio-reactive hook specifically tuned for AbyssID ritual states.
 * Maps frequency bands to semantic values for ritual animations.
 */
export function useAbyssReactive(state: AbyssState) {
  const { low, mid, high, isActive } = useAudioSpectrum();

  const reactive = useMemo(() => {
    if (!isActive) {
      return {
        modalScale: 1,
        textShimmer: 0,
        glitchAmplification: 0,
        pulseEvent: false,
        silenceDecay: 1,
        low: 0,
        mid: 0,
        high: 0,
      };
    }

    // Normalize values (0-255) to 0-1 range
    const lowNorm = low / 255;
    const midNorm = mid / 255;
    const highNorm = high / 255;

    // State-specific mappings
    let modalScale = 1;
    let textShimmer = 0;
    let glitchAmplification = 0;
    let pulseEvent = false;

    switch (state) {
      case "idle":
        // Subtle breathing
        modalScale = 1 + lowNorm * 0.02;
        textShimmer = midNorm * 0.1;
        break;

      case "checking":
        // Slow inward pulse (3 cycles)
        const pulsePhase = (Date.now() % 2000) / 2000;
        modalScale = 1 - Math.sin(pulsePhase * Math.PI * 2) * 0.12;
        textShimmer = midNorm * 0.3;
        pulseEvent = lowNorm > 0.5;
        break;

      case "reject":
        // Sharp jolt
        glitchAmplification = highNorm * 1.0;
        modalScale = 1 + (highNorm - 0.5) * 0.04;
        break;

      case "accept":
        // Deep collapse → slow expansion
        modalScale = 0.95 + lowNorm * 0.1;
        textShimmer = (lowNorm + midNorm) * 0.4;
        pulseEvent = lowNorm > 0.6;
        break;

      case "binding":
        // Vignette collapse
        modalScale = 0.98 + lowNorm * 0.04;
        textShimmer = midNorm * 0.2;
        break;

      case "confirm":
        // Bloom
        modalScale = 1 + (lowNorm + midNorm) * 0.05;
        textShimmer = (midNorm + highNorm) * 0.5;
        pulseEvent = lowNorm > 0.7;
        break;
    }

    // Silence decay (gradual fade when audio stops)
    const silenceDecay = isActive ? 1 : 0.95;

    return {
      modalScale,
      textShimmer,
      glitchAmplification,
      pulseEvent,
      silenceDecay,
      low: lowNorm,
      mid: midNorm,
      high: highNorm,
    };
  }, [low, mid, high, isActive, state]);

  return reactive;
}

