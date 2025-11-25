"use client";

import { useEffect, useRef, useState } from "react";
import type { AbyssState } from "./AbyssStateMachine";

interface ShaderPlaneProps {
  state: AbyssState;
  className?: string;
}

/**
 * ShaderPlane
 * 
 * Creates a shader-like effect using Canvas 2D API with turbulence,
 * chromatic displacement, and state-reactive animations.
 * 
 * TODO: Milestone 4.1 – upgrade to WebGL/GLSL for true fragment shader
 */
export function ShaderPlane({ state, className = "" }: ShaderPlaneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    // Shader parameters based on state
    const getShaderParams = () => {
      switch (state) {
        case "idle":
          return {
            turbulence: 0.3,
            viscosity: 0.5,
            chromaShift: 0.1,
            glitch: 0,
            bloom: 0,
            vignette: 0,
          };
        case "checking":
          return {
            turbulence: 0.5,
            viscosity: 0.6,
            chromaShift: 0.15,
            glitch: 0,
            bloom: 0.2,
            vignette: 0.3,
          };
        case "reject":
          return {
            turbulence: 1.0,
            viscosity: 0.8,
            chromaShift: 0.5,
            glitch: 1.0,
            bloom: 0,
            vignette: 0,
          };
        case "accept":
          return {
            turbulence: 0.4,
            viscosity: 0.4,
            chromaShift: 0.2,
            glitch: 0,
            bloom: 0.8,
            vignette: 0.5,
          };
        case "binding":
          return {
            turbulence: 0.6,
            viscosity: 0.7,
            chromaShift: 0.3,
            glitch: 0,
            bloom: 0.4,
            vignette: 0.9,
          };
        case "confirm":
          return {
            turbulence: 0.2,
            viscosity: 0.3,
            chromaShift: 0.1,
            glitch: 0,
            bloom: 1.0,
            vignette: 0.2,
          };
        default:
          return {
            turbulence: 0.3,
            viscosity: 0.5,
            chromaShift: 0.1,
            glitch: 0,
            bloom: 0,
            vignette: 0,
          };
      }
    };

    // Simple noise function
    const noise = (x: number, y: number, t: number): number => {
      const n = Math.sin(x * 12.9898 + y * 78.233 + t) * 43758.5453;
      return (n - Math.floor(n)) * 2 - 1;
    };

    // Fractal Brownian Motion
    const fbm = (x: number, y: number, t: number, octaves: number = 4): number => {
      let value = 0;
      let amplitude = 0.5;
      let frequency = 1;
      for (let i = 0; i < octaves; i++) {
        value += amplitude * noise(x * frequency, y * frequency, t * frequency);
        amplitude *= 0.5;
        frequency *= 2;
      }
      return value;
    };

    // Render loop
    const render = () => {
      const { width, height } = canvas;
      const params = getShaderParams();
      timeRef.current += 0.01;

      // Clear canvas
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Create image data for pixel manipulation
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const nx = x / width;
          const ny = y / height;

          // Turbulence
          const t = fbm(nx * 3, ny * 3, timeRef.current * params.turbulence, 4);

          // Chromatic displacement
          const rOffset = Math.sin(t * Math.PI * 2) * params.chromaShift * 10;
          const gOffset = Math.sin(t * Math.PI * 2 + Math.PI * 0.66) * params.chromaShift * 10;
          const bOffset = Math.sin(t * Math.PI * 2 + Math.PI * 1.33) * params.chromaShift * 10;

          // Glitch effect
          let glitchX = 0;
          if (params.glitch > 0) {
            glitchX = (Math.random() - 0.5) * params.glitch * 20;
          }

          // Vignette
          const centerX = width / 2;
          const centerY = height / 2;
          const dist = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
          );
          const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
          const vignette = 1 - (dist / maxDist) * params.vignette;

          // Base color (dark purple/black)
          const baseR = 10;
          const baseG = 5;
          const baseB = 20;

          // Apply effects
          const idx = (y * width + x) * 4;
          data[idx] = Math.max(0, Math.min(255, baseR + rOffset + glitchX)) * vignette;
          data[idx + 1] = Math.max(0, Math.min(255, baseG + gOffset)) * vignette;
          data[idx + 2] = Math.max(0, Math.min(255, baseB + bOffset + glitchX)) * vignette;
          data[idx + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Bloom effect (overlay)
      if (params.bloom > 0) {
        const gradient = ctx.createRadialGradient(
          width / 2,
          height / 2,
          0,
          width / 2,
          height / 2,
          Math.max(width, height) * 0.8
        );
        gradient.addColorStop(0, `rgba(139, 92, 246, ${params.bloom * 0.3})`);
        gradient.addColorStop(0.5, `rgba(168, 85, 247, ${params.bloom * 0.2})`);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state]);

  if (!isVisible) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{
        mixBlendMode: "screen",
        opacity: 0.4,
      }}
    />
  );
}

