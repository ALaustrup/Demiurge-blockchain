"use client";

import { useState, useEffect, useRef } from "react";
import { useAudioEngine } from "./AudioContextProvider";

/**
 * useAudioSpectrum
 * 
 * TODO: Milestone 4.1 – integrate audio-reactive behavior
 * 
 * Reads frequency bins via analyser.getByteFrequencyData
 * and outputs low/mid/high bands for reactive UI.
 */
export function useAudioSpectrum() {
  const { analyser, isPlaying } = useAudioEngine();
  const [low, setLow] = useState(0);
  const [mid, setMid] = useState(0);
  const [high, setHigh] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!analyser || !isPlaying) {
      setLow(0);
      setMid(0);
      setHigh(0);
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    if (!dataArrayRef.current || dataArrayRef.current.length !== bufferLength) {
      dataArrayRef.current = new Uint8Array(new ArrayBuffer(bufferLength));
    }

    const updateSpectrum = () => {
      if (!analyser || !dataArrayRef.current) return;

      // Type assertion to satisfy strict TypeScript checking
      const dataArray = dataArrayRef.current;
      // @ts-expect-error - AnalyserNode.getByteFrequencyData accepts Uint8Array with ArrayBufferLike
      analyser.getByteFrequencyData(dataArray);

      // Split frequency bands
      // Low: 0-30% of spectrum
      // Mid: 30-70% of spectrum
      // High: 70-100% of spectrum
      const lowEnd = Math.floor(bufferLength * 0.3);
      const midEnd = Math.floor(bufferLength * 0.7);

      let lowSum = 0;
      let midSum = 0;
      let highSum = 0;

      for (let i = 0; i < lowEnd; i++) {
        lowSum += dataArray[i];
      }
      for (let i = lowEnd; i < midEnd; i++) {
        midSum += dataArray[i];
      }
      for (let i = midEnd; i < bufferLength; i++) {
        highSum += dataArray[i];
      }

      setLow(Math.floor(lowSum / lowEnd));
      setMid(Math.floor(midSum / (midEnd - lowEnd)));
      setHigh(Math.floor(highSum / (bufferLength - midEnd)));

      animationFrameRef.current = requestAnimationFrame(updateSpectrum);
    };

    updateSpectrum();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, isPlaying]);

  return {
    low,
    mid,
    high,
    isActive: isPlaying && analyser !== null,
  };
}

