/**
 * Audio Reactive Background Component
 * 
 * Replaces static desktop wallpaper with real-time audio-reactive visualization.
 * When audio is playing: vibrant, reactive visuals.
 * When audio stops: transitions to calm desktop live wallpaper.
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { audioReactiveVisualizer } from '../../services/audioReactiveVisualizer';
import { useMusicPlayerStore } from '../../state/musicPlayerStore';
import { backgroundMusicService } from '../../services/backgroundMusic';

export function AudioReactiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioData, setAudioData] = useState<{ frequencies: Uint8Array; waveform: Uint8Array; average: number } | null>(null);
  const { isPlaying, currentTrack } = useMusicPlayerStore();
  const [isAudioActive, setIsAudioActive] = useState(false);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    // Check if any audio is playing
    const hasActiveAudio = isPlaying || backgroundMusicService.getPlaying();
    setIsAudioActive(hasActiveAudio);

    // Initialize visualizer
    audioReactiveVisualizer.initialize().catch(console.error);

    // Try to connect to audio elements
    const audioElements = document.querySelectorAll('audio, video');
    if (audioElements.length > 0) {
      const firstAudio = audioElements[0] as HTMLAudioElement | HTMLVideoElement;
      audioReactiveVisualizer.connectAudioSource(firstAudio);
    }

    // Subscribe to audio data
    const unsubscribe = audioReactiveVisualizer.subscribe((data) => {
      setAudioData(data);
    });

    return () => {
      unsubscribe();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTrack]);

  // Render visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let frame = 0;

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 10, 0.1)';
      ctx.fillRect(0, 0, width, height);

      if (isAudioActive && audioData) {
        // Audio-reactive mode: vibrant, dynamic visuals
        drawReactiveVisuals(ctx, width, height, audioData, frame);
      } else {
        // Calm desktop wallpaper mode
        drawCalmWallpaper(ctx, width, height, frame);
      }

      frame++;
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAudioActive, audioData]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}

/**
 * Draw reactive visuals when audio is playing
 */
function drawReactiveVisuals(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: { frequencies: Uint8Array; waveform: Uint8Array; average: number },
  frame: number
) {
  const { frequencies, waveform, average } = data;
  const centerX = width / 2;
  const centerY = height / 2;

  // Ancient/futuristic cyber color palette
  const colors = [
    { r: 0, g: 255, b: 255 }, // Cyan
    { r: 138, g: 43, b: 226 }, // Blue violet (ancient)
    { r: 255, g: 20, b: 147 }, // Deep pink
    { r: 0, g: 191, b: 255 }, // Deep sky blue
    { r: 255, g: 215, b: 0 }, // Gold (ancient)
  ];

  // Clear with fade
  ctx.fillStyle = 'rgba(0, 0, 10, 0.15)';
  ctx.fillRect(0, 0, width, height);

  // Draw frequency bars in circular pattern (ancient mandala style)
  const barCount = frequencies.length;
  const radius = Math.min(width, height) * 0.3;
  
  for (let i = 0; i < barCount; i++) {
    const value = frequencies[i] / 255;
    const angle = (i / barCount) * Math.PI * 2 + (frame * 0.001);
    const barLength = value * radius * 0.8;
    
    const x1 = centerX + Math.cos(angle) * radius;
    const y1 = centerY + Math.sin(angle) * radius;
    const x2 = centerX + Math.cos(angle) * (radius + barLength);
    const y2 = centerY + Math.sin(angle) * (radius + barLength);

    const colorIndex = Math.floor(i / (barCount / colors.length));
    const color = colors[colorIndex % colors.length];
    const alpha = 0.6 + value * 0.4;

    ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
    ctx.lineWidth = 2 + value * 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Add glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Draw waveform as central energy orb
  const orbRadius = average / 255 * 100 + 30;
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, orbRadius);
  gradient.addColorStop(0, `rgba(0, 255, 255, ${0.8 + average / 255 * 0.2})`);
  gradient.addColorStop(0.5, `rgba(138, 43, 226, ${0.4 + average / 255 * 0.3})`);
  gradient.addColorStop(1, 'rgba(0, 0, 10, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2);
  ctx.fill();

  // Draw waveform lines radiating outward
  for (let i = 0; i < waveform.length; i += 4) {
    const value = (waveform[i] - 128) / 128;
    const angle = (i / waveform.length) * Math.PI * 2 + (frame * 0.002);
    const distance = orbRadius + Math.abs(value) * 50;

    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;

    ctx.fillStyle = `rgba(0, 255, 255, ${0.3 + Math.abs(value) * 0.5})`;
    ctx.beginPath();
    ctx.arc(x, y, 2 + Math.abs(value) * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw geometric patterns (ancient/futuristic)
  drawGeometricPatterns(ctx, width, height, frame, average);
}

/**
 * Draw calm desktop wallpaper when audio is not playing
 */
function drawCalmWallpaper(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: number
) {
  // Ancient/futuristic cyber aesthetic - calm mode
  const time = frame * 0.01;

  // Base gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'rgba(0, 0, 20, 1)');
  gradient.addColorStop(0.5, 'rgba(0, 10, 30, 1)');
  gradient.addColorStop(1, 'rgba(0, 0, 20, 1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Slow-moving orbs
  const orb1X = width * 0.25 + Math.sin(time * 0.3) * 50;
  const orb1Y = height * 0.25 + Math.cos(time * 0.2) * 30;
  const orb2X = width * 0.75 + Math.cos(time * 0.25) * 40;
  const orb2Y = height * 0.75 + Math.sin(time * 0.35) * 50;

  // Orb 1 - Cyan
  const grad1 = ctx.createRadialGradient(orb1X, orb1Y, 0, orb1X, orb1Y, 200);
  grad1.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
  grad1.addColorStop(1, 'rgba(0, 255, 255, 0)');
  ctx.fillStyle = grad1;
  ctx.beginPath();
  ctx.arc(orb1X, orb1Y, 200, 0, Math.PI * 2);
  ctx.fill();

  // Orb 2 - Purple
  const grad2 = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, 250);
  grad2.addColorStop(0, 'rgba(138, 43, 226, 0.08)');
  grad2.addColorStop(1, 'rgba(138, 43, 226, 0)');
  ctx.fillStyle = grad2;
  ctx.beginPath();
  ctx.arc(orb2X, orb2Y, 250, 0, Math.PI * 2);
  ctx.fill();

  // Subtle grid pattern (ancient tech aesthetic)
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  const gridSize = 50;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Slow particle field
  for (let i = 0; i < 30; i++) {
    const x = (i * 137.5) % width;
    const y = (i * 197.3 + time * 10) % height;
    const size = 1 + Math.sin(time + i) * 0.5;
    ctx.fillStyle = `rgba(0, 255, 255, ${0.1 + Math.sin(time + i) * 0.05})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw geometric patterns (ancient/futuristic aesthetic)
 */
function drawGeometricPatterns(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: number,
  intensity: number
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const time = frame * 0.01;

  // Rotating geometric shapes
  ctx.strokeStyle = `rgba(0, 255, 255, ${0.2 + intensity / 255 * 0.3})`;
  ctx.lineWidth = 1;

  // Hexagon pattern
  const sides = 6;
  const radius = 150 + intensity / 255 * 50;
  ctx.beginPath();
  for (let i = 0; i <= sides; i++) {
    const angle = (i / sides) * Math.PI * 2 + time;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  // Inner triangle
  const triRadius = radius * 0.6;
  ctx.beginPath();
  for (let i = 0; i <= 3; i++) {
    const angle = (i / 3) * Math.PI * 2 - time;
    const x = centerX + Math.cos(angle) * triRadius;
    const y = centerY + Math.sin(angle) * triRadius;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

