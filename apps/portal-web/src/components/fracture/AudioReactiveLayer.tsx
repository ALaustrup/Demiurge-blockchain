"use client";

import { useEffect, useRef } from "react";
import { useReactiveMotion } from "@/lib/fracture/motion/useReactiveMotion";
import { useAudioSpectrum } from "@/lib/fracture/audio/useAudioSpectrum";

/**
 * AudioReactiveLayer
 * 
 * Applies subtle visual effects based on audio reactivity.
 * Effects are almost subliminal but definitely alive.
 */
export function AudioReactiveLayer() {
  const { glowIntensity, fogDensity } = useReactiveMotion();
  const { isActive } = useAudioSpectrum();
  const glowRef = useRef<HTMLDivElement>(null);
  const fogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) {
      if (glowRef.current) {
        glowRef.current.style.opacity = "0";
        glowRef.current.style.transition = "opacity 1s ease-out";
      }
      if (fogRef.current) {
        fogRef.current.style.opacity = "0";
        fogRef.current.style.transition = "opacity 1s ease-out";
      }
      return;
    }

    // Apply glow intensity to edge glows (subtle but visible)
    if (glowRef.current) {
      const opacity = Math.max(0, Math.min(1, glowIntensity * 2)); // Scale up for visibility
      glowRef.current.style.opacity = String(opacity);
      glowRef.current.style.transition = "opacity 0.3s ease-out";
    }

    // Apply fog density to vignette
    if (fogRef.current) {
      const opacity = Math.max(0, Math.min(1, fogDensity));
      fogRef.current.style.opacity = String(opacity);
      fogRef.current.style.transition = "opacity 0.5s ease-out";
    }
  }, [glowIntensity, fogDensity, isActive]);

  return (
    <>
      {/* Edge Glow - Subtle cyan/magenta glow at screen edges */}
      <div
        ref={glowRef}
        className="fixed inset-0 z-13 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at top left, rgba(34, 211, 238, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse at top right, rgba(232, 121, 249, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse at bottom left, rgba(192, 132, 252, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at bottom right, rgba(34, 211, 238, 0.15) 0%, transparent 50%)
          `,
          opacity: 0,
        }}
      />

      {/* Fog/Vignette - Low frequency influences darkness at edges */}
      <div
        ref={fogRef}
        className="fixed inset-0 z-14 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, transparent 30%, rgba(0,0,0,0.6) 100%)",
          opacity: 0,
        }}
      />
    </>
  );
}

