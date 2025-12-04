"use client";

import { createContext, useContext, ReactNode, useState, useRef, useEffect } from "react";
import { getAudioEngine, AudioEngine } from "./AudioEngine";

interface AudioContextValue {
  audioEngine: AudioEngine;
  isReady: boolean;
  isPlaying: boolean;
  startAudio: () => void;
  stopAudio: () => void;
  togglePlay: () => void;
  analyser: AnalyserNode | null;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioContextProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioEngineRef = useRef<AudioEngine>(getAudioEngine());
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Create audio element on mount with format fallback (MP3 -> WAV)
  useEffect(() => {
    const audio = document.createElement("audio");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.3; // Subtle background ambience

    // Try MP3 first (smaller file size, widely supported)
    const mp3Source = document.createElement("source");
    mp3Source.src = "/media/fracture-ambience.mp3";
    mp3Source.type = "audio/mpeg";
    audio.appendChild(mp3Source);

    // Fallback to WAV if MP3 fails (browser will automatically try this)
    const wavSource = document.createElement("source");
    wavSource.src = "/media/fracture-ambience.wav";
    wavSource.type = "audio/wav";
    audio.appendChild(wavSource);

    // Handle audio errors gracefully
    audio.addEventListener("error", (e) => {
      console.warn("Audio file not found or failed to load. Tried MP3 and WAV formats:", e);
    });

    // Handle successful load
    audio.addEventListener("loadeddata", () => {
      // Determine which format was loaded by checking current source
      const currentSrc = audio.currentSrc || audio.src;
      const format = currentSrc.includes(".wav") ? "WAV" : "MP3";
      console.log(`Audio loaded successfully: ${format} format`);
    });

    audioElementRef.current = audio;

    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, []);

  const startAudio = () => {
    // Require user interaction before starting audio
    if (!hasInteracted) {
      setHasInteracted(true);
    }

    const engine = audioEngineRef.current;
    const audio = audioElementRef.current;

    if (!audio) {
      console.warn("Audio element not ready");
      return;
    }

    // Resume AudioContext if suspended (required after user interaction)
    const ctx = engine.getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(console.error);
    }

    const success = engine.startAudio(audio);
    if (success) {
      setIsReady(true);
      audio.play().then(() => {
        engine.setPlaying(true);
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("Failed to play audio:", err);
        // Audio might be blocked by browser policy, but analyser can still work
        setIsReady(true);
      });
    }
  };

  const stopAudio = () => {
    const engine = audioEngineRef.current;
    const audio = audioElementRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    engine.stopAudio();
    setIsReady(false);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  return (
    <AudioContext.Provider
      value={{
        audioEngine: audioEngineRef.current,
        isReady,
        isPlaying,
        startAudio,
        stopAudio,
        togglePlay,
        analyser: audioEngineRef.current.getAnalyser(),
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudioEngine(): AudioContextValue {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudioEngine must be used within AudioContextProvider");
  }
  return context;
}

