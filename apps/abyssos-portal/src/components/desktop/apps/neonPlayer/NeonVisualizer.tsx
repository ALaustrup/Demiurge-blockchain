/**
 * NEON Visualizer React Component
 */

import { useEffect, useRef } from 'react';
import { NeonVisualizer as NeonVisualizerClass } from './NeonVisualizer';
import type { FractalBeatmap } from '@abyssos/fractall/types';

interface NeonVisualizerProps {
  beatmap: FractalBeatmap[];
  isPlaying: boolean;
  currentTime: number;
}

export function NeonVisualizer({ beatmap, isPlaying, currentTime }: NeonVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<NeonVisualizerClass | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const visualizer = new NeonVisualizerClass(canvasRef.current);
    visualizerRef.current = visualizer;

    return () => {
      visualizer.destroy();
    };
  }, []);

  useEffect(() => {
    if (visualizerRef.current) {
      visualizerRef.current.updateBeatmap(beatmap);
    }
  }, [beatmap]);

  useEffect(() => {
    if (visualizerRef.current) {
      visualizerRef.current.updateTime(currentTime);
    }
  }, [currentTime]);

  useEffect(() => {
    if (visualizerRef.current) {
      visualizerRef.current.setPlaying(isPlaying);
    }
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      width={800}
      height={600}
    />
  );
}

