"use client";

import { useEffect, useRef, useState } from "react";
import type { AbyssState } from "./AbyssStateMachine";
import type { RitualEffects } from "@/lib/rituals/ritualTypes";

interface ShaderPlaneProps {
  state: AbyssState;
  className?: string;
  // Audio-reactive values (optional - falls back to state-based if not provided)
  reactive?: {
    low: number;
    mid: number;
    high: number;
    glitchAmplification?: number;
    pulseEvent?: boolean;
    silenceDecay?: number;
  };
  // Ritual effects (optional - overrides state-based params if provided)
  ritualEffects?: RitualEffects;
}

/**
 * ShaderPlane
 * 
 * WebGL/GLSL fragment shader implementation with turbulence,
 * chromatic displacement, and state-reactive animations.
 * 
 * Upgraded from Canvas 2D to WebGL for true fragment shader effects.
 */
export function ShaderPlane({ state, className = "", reactive, ritualEffects }: ShaderPlaneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const [isVisible, setIsVisible] = useState(true);
  const [webglSupported, setWebglSupported] = useState(true);

  // Vertex shader source
  const vertexShaderSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // Fragment shader source
  const fragmentShaderSource = `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform float u_turbulence;
    uniform float u_chromaShift;
    uniform float u_glitch;
    uniform float u_bloom;
    uniform float u_vignette;
    uniform float u_lowFreq;
    uniform float u_midFreq;
    uniform float u_highFreq;

    // Noise function
    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    // Fractal Brownian Motion
    float fbm(vec2 p, float time) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for (int i = 0; i < 4; i++) {
        value += amplitude * (noise(p * frequency + time) * 2.0 - 1.0);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      return value;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      vec2 p = uv * 3.0;
      
      // Turbulence
      float t = fbm(p, u_time * u_turbulence);
      
      // Chromatic displacement
      float rOffset = sin(t * 6.28318) * u_chromaShift * 0.1;
      float gOffset = sin(t * 6.28318 + 2.094) * u_chromaShift * 0.1;
      float bOffset = sin(t * 6.28318 + 4.188) * u_chromaShift * 0.1;
      
      // Glitch effect
      float glitchX = 0.0;
      if (u_glitch > 0.0) {
        glitchX = (noise(vec2(uv.x * 100.0 + u_time * 10.0, uv.y)) - 0.5) * u_glitch * 0.02;
      }
      
      // Base color (dark purple/black)
      vec3 baseColor = vec3(0.04, 0.02, 0.08);
      
      // Apply chromatic displacement
      vec3 color = baseColor + vec3(rOffset + glitchX, gOffset, bOffset + glitchX);
      
      // Vignette
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(uv, center);
      float maxDist = 0.707; // sqrt(0.5^2 + 0.5^2)
      float vignette = 1.0 - (dist / maxDist) * u_vignette;
      color *= vignette;
      
      // Bloom effect
      if (u_bloom > 0.0) {
        float bloomDist = distance(uv, center);
        float bloom = (1.0 - smoothstep(0.0, 0.8, bloomDist)) * u_bloom * 0.3;
        color += vec3(0.545, 0.361, 0.965) * bloom;
      }
      
      // Audio-reactive enhancements
      color += vec3(u_lowFreq * 0.1, u_midFreq * 0.05, u_highFreq * 0.1);
      
      gl_FragColor = vec4(color, 0.4);
    }
  `;

  // Compile shader
  const compileShader = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  };

  // Create shader program
  const createProgram = (gl: WebGLRenderingContext): WebGLProgram | null => {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return null;
    
    const program = gl.createProgram();
    if (!program) return null;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    
    return program;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Try to get WebGL context
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      console.warn("WebGL not supported, falling back to hidden state");
      setWebglSupported(false);
      return;
    }

    glRef.current = gl;

    // Set canvas size
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    // Create shader program
    const program = createProgram(gl);
    if (!program) {
      setWebglSupported(false);
      return;
    }
    programRef.current = program;

    // Set up geometry (full-screen quad)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]), gl.STATIC_DRAW);

    // Get attribute and uniform locations
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const turbulenceLocation = gl.getUniformLocation(program, "u_turbulence");
    const chromaShiftLocation = gl.getUniformLocation(program, "u_chromaShift");
    const glitchLocation = gl.getUniformLocation(program, "u_glitch");
    const bloomLocation = gl.getUniformLocation(program, "u_bloom");
    const vignetteLocation = gl.getUniformLocation(program, "u_vignette");
    const lowFreqLocation = gl.getUniformLocation(program, "u_lowFreq");
    const midFreqLocation = gl.getUniformLocation(program, "u_midFreq");
    const highFreqLocation = gl.getUniformLocation(program, "u_highFreq");

    // Shader parameters based on state + audio-reactive values
    const getShaderParams = () => {
      // Base parameters from state
      let baseParams: {
        turbulence: number;
        chromaShift: number;
        glitch: number;
        bloom: number;
        vignette: number;
      };

      switch (state) {
        case "idle":
          baseParams = {
            turbulence: 0.3,
            chromaShift: 0.1,
            glitch: 0,
            bloom: 0,
            vignette: 0,
          };
          break;
        case "checking":
          baseParams = {
            turbulence: 0.5,
            chromaShift: 0.15,
            glitch: 0,
            bloom: 0.2,
            vignette: 0.3,
          };
          break;
        case "reject":
          baseParams = {
            turbulence: 1.0,
            chromaShift: 0.5,
            glitch: 1.0,
            bloom: 0,
            vignette: 0,
          };
          break;
        case "accept":
          baseParams = {
            turbulence: 0.4,
            chromaShift: 0.2,
            glitch: 0,
            bloom: 0.8,
            vignette: 0.5,
          };
          break;
        case "binding":
          baseParams = {
            turbulence: 0.6,
            chromaShift: 0.3,
            glitch: 0,
            bloom: 0.4,
            vignette: 0.9,
          };
          break;
        case "confirm":
          baseParams = {
            turbulence: 0.2,
            chromaShift: 0.1,
            glitch: 0,
            bloom: 1.0,
            vignette: 0.2,
          };
          break;
        default:
          baseParams = {
            turbulence: 0.3,
            chromaShift: 0.1,
            glitch: 0,
            bloom: 0,
            vignette: 0,
          };
      }

      // Apply ritual effects if provided (overrides state-based params)
      if (ritualEffects?.shaderUniforms) {
        const ritual = ritualEffects.shaderUniforms;
        if (ritual.turbulence !== undefined) baseParams.turbulence = ritual.turbulence;
        if (ritual.chromaShift !== undefined) baseParams.chromaShift = ritual.chromaShift;
        if (ritual.glitchAmount !== undefined) baseParams.glitch = ritual.glitchAmount;
        if (ritual.bloomIntensity !== undefined) baseParams.bloom = ritual.bloomIntensity;
        if (ritual.vignetteIntensity !== undefined) baseParams.vignette = ritual.vignetteIntensity;
      }

      // Apply audio-reactive modifications if provided
      if (reactive) {
        const { low, mid, high, glitchAmplification = 0, pulseEvent = false, silenceDecay = 1 } = reactive;
        
        // Enhance turbulence with low frequencies
        baseParams.turbulence = baseParams.turbulence * (1 + low * 0.3) * silenceDecay;
        
        // Enhance chroma shift with mid frequencies
        baseParams.chromaShift = baseParams.chromaShift * (1 + mid * 0.4) * silenceDecay;
        
        // Add glitch from reactive values or state
        if (glitchAmplification > 0) {
          baseParams.glitch = Math.max(baseParams.glitch, glitchAmplification);
        }
        
        // Pulse bloom on pulse events
        if (pulseEvent) {
          baseParams.bloom = Math.min(1.0, baseParams.bloom + 0.3);
        }
        
        // Enhance bloom with high frequencies
        baseParams.bloom = baseParams.bloom * (1 + high * 0.2) * silenceDecay;
      }

      return baseParams;
    };

    // Render loop
    const render = () => {
      if (!gl || !program) return;

      const params = getShaderParams();
      timeRef.current += 0.01;

      // Clear
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Use program
      gl.useProgram(program);

      // Set up geometry
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      // Set uniforms
      gl.uniform1f(timeLocation, timeRef.current);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(turbulenceLocation, params.turbulence);
      gl.uniform1f(chromaShiftLocation, params.chromaShift);
      gl.uniform1f(glitchLocation, params.glitch);
      gl.uniform1f(bloomLocation, params.bloom);
      gl.uniform1f(vignetteLocation, params.vignette);
      
      // Audio-reactive uniforms
      if (reactive) {
        gl.uniform1f(lowFreqLocation, reactive.low);
        gl.uniform1f(midFreqLocation, reactive.mid);
        gl.uniform1f(highFreqLocation, reactive.high);
      } else {
        gl.uniform1f(lowFreqLocation, 0);
        gl.uniform1f(midFreqLocation, 0);
        gl.uniform1f(highFreqLocation, 0);
      }

      // Draw
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (program) {
        gl.deleteProgram(program);
      }
    };
  }, [state, reactive]);

  if (!isVisible || !webglSupported) return null;

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
