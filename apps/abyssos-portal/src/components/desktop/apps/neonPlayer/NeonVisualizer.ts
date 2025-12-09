/**
 * NEON Visualizer
 * 
 * GPU-accelerated WebGL2 visualizer for Fractal-1 beatmaps
 */

import type { FractalBeatmap } from '@abyssos/fractall/types';

export class NeonVisualizer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private animationFrame: number | null = null;
  private beatmap: FractalBeatmap[] = [];
  private currentTime: number = 0;
  private isPlaying: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.initWebGL();
  }

  private initWebGL(): void {
    const gl = this.canvas.getContext('webgl2');
    if (!gl) {
      console.error('WebGL2 not supported');
      return;
    }

    this.gl = gl;

    // Vertex shader
    const vertexShaderSource = `#version 300 es
      in vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader with neon effects
    const fragmentShaderSource = `#version 300 es
      precision highp float;
      uniform float u_time;
      uniform float u_bass;
      uniform float u_mid;
      uniform float u_high;
      uniform vec3 u_color;
      out vec4 fragColor;

      void main() {
        vec2 uv = gl_FragCoord.xy / vec2(800.0, 600.0);
        float pulse = sin(u_time * 2.0 + u_bass * 0.1) * 0.5 + 0.5;
        vec3 color = u_color * pulse;
        color += vec3(u_bass, u_mid, u_high) * 0.3;
        fragColor = vec4(color, 1.0);
      }
    `;

    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return;

    this.program = this.createProgram(vertexShader, fragmentShader);
    if (!this.program) return;

    // Setup geometry
    this.setupGeometry();
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;
    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null {
    if (!this.gl) return null;
    const program = this.gl.createProgram();
    if (!program) return null;

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Program linking error:', this.gl.getProgramInfoLog(program));
      this.gl.deleteProgram(program);
      return null;
    }

    return program;
  }

  private setupGeometry(): void {
    if (!this.gl || !this.program) return;

    // Full-screen quad
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
  }

  updateBeatmap(beatmap: FractalBeatmap[]): void {
    this.beatmap = beatmap;
  }

  updateTime(time: number): void {
    this.currentTime = time;
  }

  setPlaying(playing: boolean): void {
    this.isPlaying = playing;
    if (playing) {
      this.startAnimation();
    } else {
      this.stopAnimation();
    }
  }

  private startAnimation(): void {
    if (this.animationFrame !== null) return;
    this.render();
  }

  private stopAnimation(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  private render = (): void => {
    if (!this.gl || !this.program || !this.isPlaying) return;

    // Get current beatmap data
    const currentBeat = this.getCurrentBeat();
    
    // Clear
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Use program
    this.gl.useProgram(this.program);

    // Set uniforms
    const timeLocation = this.gl.getUniformLocation(this.program, 'u_time');
    const bassLocation = this.gl.getUniformLocation(this.program, 'u_bass');
    const midLocation = this.gl.getUniformLocation(this.program, 'u_mid');
    const highLocation = this.gl.getUniformLocation(this.program, 'u_high');
    const colorLocation = this.gl.getUniformLocation(this.program, 'u_color');

    if (timeLocation) this.gl.uniform1f(timeLocation, this.currentTime);
    if (bassLocation) this.gl.uniform1f(bassLocation, (currentBeat?.bass || 0) / 255);
    if (midLocation) this.gl.uniform1f(midLocation, (currentBeat?.mid || 0) / 255);
    if (highLocation) this.gl.uniform1f(highLocation, (currentBeat?.high || 0) / 255);
    if (colorLocation && currentBeat) {
      this.gl.uniform3f(
        colorLocation,
        currentBeat.colorR / 255,
        currentBeat.colorG / 255,
        currentBeat.colorB / 255
      );
    }

    // Draw
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    this.animationFrame = requestAnimationFrame(this.render);
  };

  private getCurrentBeat(): FractalBeatmap | null {
    if (this.beatmap.length === 0) return null;
    
    // Find beatmap entry closest to current time
    let closest = this.beatmap[0];
    let minDiff = Math.abs(closest.timestamp - this.currentTime);
    
    for (const beat of this.beatmap) {
      const diff = Math.abs(beat.timestamp - this.currentTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = beat;
      }
    }
    
    return closest;
  }

  destroy(): void {
    this.stopAnimation();
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
    }
  }
}

