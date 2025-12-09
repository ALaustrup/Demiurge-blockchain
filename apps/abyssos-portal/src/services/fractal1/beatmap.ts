/**
 * Beatmap Generation for Fractal-1
 * 
 * Analyzes audio frequency domain to produce NEON-reactive data
 */

import type { FractalBeatmap } from './types';

const FFT_SIZE = 2048;
const BEATMAP_INTERVAL_MS = 50; // 50ms intervals for smooth reactivity

export class BeatmapGenerator {
  private audioContext: AudioContext;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private bassRange: [number, number] = [20, 250]; // Hz
  private midRange: [number, number] = [250, 4000]; // Hz
  private highRange: [number, number] = [4000, 20000]; // Hz

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Generate beatmap from audio buffer
   */
  async generateBeatmap(audioBuffer: AudioBuffer): Promise<FractalBeatmap[]> {
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    const channelData = audioBuffer.getChannelData(0); // Use first channel
    
    const beatmap: FractalBeatmap[] = [];
    const intervalSamples = Math.floor((BEATMAP_INTERVAL_MS / 1000) * sampleRate);
    const fftSize = Math.min(FFT_SIZE, channelData.length);
    
    // Process audio in chunks
    for (let offset = 0; offset < channelData.length - fftSize; offset += intervalSamples) {
      const chunk = channelData.slice(offset, offset + fftSize);
      const analysis = this.analyzeChunk(chunk, sampleRate);
      
      beatmap.push({
        timestamp: offset / sampleRate,
        bass: analysis.bass,
        mid: analysis.mid,
        high: analysis.high,
        beat: analysis.beat,
        colorR: analysis.colorR,
        colorG: analysis.colorG,
        colorB: analysis.colorB,
      });
    }
    
    return beatmap;
  }

  /**
   * Analyze audio chunk for frequency content
   */
  private analyzeChunk(chunk: Float32Array, sampleRate: number): {
    bass: number;
    mid: number;
    high: number;
    beat: number;
    colorR: number;
    colorG: number;
    colorB: number;
  } {
    // Simple FFT-like analysis using windowed FFT
    const fft = this.simpleFFT(chunk);
    const frequencies = this.getFrequencies(fft, sampleRate);
    
    // Calculate energy in frequency bands
    const bassEnergy = this.getBandEnergy(frequencies, this.bassRange);
    const midEnergy = this.getBandEnergy(frequencies, this.midRange);
    const highEnergy = this.getBandEnergy(frequencies, this.highRange);
    
    // Normalize to 0-255
    const bass = Math.min(255, Math.floor(bassEnergy * 255));
    const mid = Math.min(255, Math.floor(midEnergy * 255));
    const high = Math.min(255, Math.floor(highEnergy * 255));
    
    // Beat detection (simplified - look for sudden energy spikes)
    const totalEnergy = bassEnergy + midEnergy + highEnergy;
    const beat = totalEnergy > 0.7 ? 255 : Math.floor(totalEnergy * 255);
    
    // Color mapping based on frequency content
    const colorR = Math.min(255, bass + Math.floor(mid * 0.3));
    const colorG = Math.min(255, mid + Math.floor(high * 0.2));
    const colorB = Math.min(255, high + Math.floor(bass * 0.1));
    
    return { bass, mid, high, beat, colorR, colorG, colorB };
  }

  /**
   * Simple FFT implementation (for browser compatibility)
   */
  private simpleFFT(samples: Float32Array): Float32Array {
    const N = samples.length;
    const output = new Float32Array(N);
    
    // Simple DFT (not optimized, but works)
    for (let k = 0; k < N; k++) {
      let real = 0;
      let imag = 0;
      
      for (let n = 0; n < N; n++) {
        const angle = (2 * Math.PI * k * n) / N;
        real += samples[n] * Math.cos(angle);
        imag -= samples[n] * Math.sin(angle);
      }
      
      output[k] = Math.sqrt(real * real + imag * imag) / N;
    }
    
    return output;
  }

  /**
   * Convert FFT bin to frequency
   */
  private getFrequencies(fft: Float32Array, sampleRate: number): Float32Array {
    const frequencies = new Float32Array(fft.length);
    for (let i = 0; i < fft.length; i++) {
      frequencies[i] = (i * sampleRate) / (2 * fft.length);
    }
    return frequencies;
  }

  /**
   * Get energy in frequency band
   */
  private getBandEnergy(frequencies: Float32Array, range: [number, number]): number {
    let energy = 0;
    let count = 0;
    
    for (let i = 0; i < frequencies.length; i++) {
      if (frequencies[i] >= range[0] && frequencies[i] <= range[1]) {
        energy += frequencies[i];
        count++;
      }
    }
    
    return count > 0 ? energy / count : 0;
  }

  /**
   * Serialize beatmap to compact Uint8Array
   */
  static serializeBeatmap(beatmap: FractalBeatmap[]): Uint8Array {
    const buffer = new ArrayBuffer(beatmap.length * 8); // 8 bytes per entry
    const view = new DataView(buffer);
    
    for (let i = 0; i < beatmap.length; i++) {
      const b = beatmap[i];
      const offset = i * 8;
      view.setFloat32(offset, b.timestamp, true);
      view.setUint8(offset + 4, b.bass);
      view.setUint8(offset + 5, b.mid);
      view.setUint8(offset + 6, b.high);
      view.setUint8(offset + 7, b.beat);
      // Colors stored separately if needed
    }
    
    return new Uint8Array(buffer);
  }

  /**
   * Deserialize beatmap from Uint8Array
   */
  static deserializeBeatmap(data: Uint8Array): FractalBeatmap[] {
    const beatmap: FractalBeatmap[] = [];
    const view = new DataView(data.buffer);
    
    for (let i = 0; i < data.length; i += 8) {
      const timestamp = view.getFloat32(i, true);
      const bass = view.getUint8(i + 4);
      const mid = view.getUint8(i + 5);
      const high = view.getUint8(i + 6);
      const beat = view.getUint8(i + 7);
      
      // Default colors (can be enhanced)
      beatmap.push({
        timestamp,
        bass,
        mid,
        high,
        beat,
        colorR: bass,
        colorG: mid,
        colorB: high,
      });
    }
    
    return beatmap;
  }
}

