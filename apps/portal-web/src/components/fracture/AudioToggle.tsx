"use client";

import { useAudioEngine } from "@/lib/fracture/audio/AudioContextProvider";
import { useReactiveMotion } from "@/lib/fracture/motion/useReactiveMotion";

/**
 * AudioToggle
 * 
 * Minimal glyph-based toggle for audio reactivity.
 * Uses :: for active, [] for silent.
 */
export function AudioToggle() {
  const { isPlaying, togglePlay } = useAudioEngine();
  const { glowIntensity } = useReactiveMotion();

  return (
    <button
      onClick={togglePlay}
      className="relative px-3 py-1.5 rounded border border-white/10 bg-black/20 backdrop-blur-sm text-zinc-400 hover:text-cyan-300 hover:border-cyan-500/30 transition-all duration-300 text-sm font-mono"
      title={isPlaying ? "Silent" : "Awake"}
      style={{
        boxShadow: isPlaying && glowIntensity > 0
          ? `0 0 ${8 + glowIntensity * 12}px rgba(6, 182, 212, ${glowIntensity * 0.3})`
          : "none",
      }}
    >
      {isPlaying ? (
        <span className="tracking-wider">::</span>
      ) : (
        <span className="tracking-wider">[]</span>
      )}
    </button>
  );
}

