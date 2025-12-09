/**
 * 💀 Fractal-1 Codec Verifier
 * 
 * PHASE OMEGA PART II: Validates deterministic encoding/decoding
 * and ensures beatmap consistency
 */

import { Fractal1Codec } from './codec';
import type { FractalBeatmap, DecodedFractal, FractalMetadata } from './types';

export interface VerificationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    encodingTime: number;
    decodingTime: number;
    compressionRatio: number;
    beatmapConsistency: number;
  };
}

export class FractallVerifier {
  /**
   * Verify deterministic encoding/decoding
   */
  static async verifyDeterministic(
    audioBuffer: AudioBuffer,
    metadata: FractalMetadata
  ): Promise<VerificationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const startEncode = performance.now();
    
    // Encode
    const encoded1 = await Fractal1Codec.encodeFractal1(audioBuffer, metadata);
    const encodeTime = performance.now() - startEncode;
    
    // Encode again (should be identical)
    const encoded2 = await Fractal1Codec.encodeFractal1(audioBuffer, metadata);
    
    // Verify deterministic encoding
    if (encoded1.length !== encoded2.length) {
      errors.push(`Encoding length mismatch: ${encoded1.length} vs ${encoded2.length}`);
    }
    
    // Compare byte-by-byte (allowing small tolerance for floating point)
    let differences = 0;
    const minLength = Math.min(encoded1.length, encoded2.length);
    for (let i = 0; i < minLength; i++) {
      if (encoded1[i] !== encoded2[i]) {
        differences++;
      }
    }
    
    if (differences > 0) {
      errors.push(`Encoding non-deterministic: ${differences} byte differences`);
    }
    
    // Decode and verify
    const startDecode = performance.now();
    const decoded1 = await Fractal1Codec.decodeFractal1(encoded1);
    const decodeTime = performance.now() - startDecode;
    
    const decoded2 = await Fractal1Codec.decodeFractal1(encoded2);
    
    // Verify beatmap consistency
    const beatmapConsistency = this.verifyBeatmapConsistency(decoded1.beatmap, decoded2.beatmap);
    
    if (beatmapConsistency < 0.99) {
      errors.push(`Beatmap consistency too low: ${(beatmapConsistency * 100).toFixed(2)}%`);
    }
    
    // Verify compression ratio
    const originalSize = audioBuffer.length * audioBuffer.numberOfChannels * 4; // float32 = 4 bytes
    const compressedSize = encoded1.length;
    const compressionRatio = originalSize / compressedSize;
    
    if (compressionRatio < 1.0) {
      warnings.push(`Compression ratio below 1.0: ${compressionRatio.toFixed(2)}`);
    }
    
    // Verify segment integrity
    this.verifySegments(decoded1, errors);
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        encodingTime: encodeTime,
        decodingTime: decodeTime,
        compressionRatio,
        beatmapConsistency,
      },
    };
  }

  /**
   * Verify beatmap consistency between two decoded fractals
   */
  private static verifyBeatmapConsistency(
    beatmap1: FractalBeatmap[],
    beatmap2: FractalBeatmap[]
  ): number {
    if (beatmap1.length !== beatmap2.length) {
      return 0;
    }
    
    let totalDiff = 0;
    let maxDiff = 0;
    
    for (let i = 0; i < beatmap1.length; i++) {
      const b1 = beatmap1[i];
      const b2 = beatmap2[i];
      
      const diff = Math.abs(b1.bass - b2.bass) +
                   Math.abs(b1.mid - b2.mid) +
                   Math.abs(b1.high - b2.high) +
                   Math.abs(b1.beat - b2.beat);
      
      totalDiff += diff;
      maxDiff = Math.max(maxDiff, diff);
    }
    
    // Normalize to 0-1 (perfect = 1.0)
    const avgDiff = totalDiff / (beatmap1.length * 4 * 255); // 4 channels * max value 255
    return 1.0 - Math.min(1.0, avgDiff);
  }

  /**
   * Verify segment integrity
   */
  private static verifySegments(decoded: DecodedFractal, errors: string[]): void {
    // Verify all segments have valid indices
    for (let i = 0; i < decoded.segments.length; i++) {
      const seg = decoded.segments[i];
      
      if (seg.index !== i) {
        errors.push(`Segment index mismatch: expected ${i}, got ${seg.index}`);
      }
      
      if (seg.size <= 0) {
        errors.push(`Invalid segment size at index ${i}: ${seg.size}`);
      }
      
      if (seg.timestamp < 0) {
        errors.push(`Invalid segment timestamp at index ${i}: ${seg.timestamp}`);
      }
    }
    
    // Verify segments are in order
    for (let i = 1; i < decoded.segments.length; i++) {
      if (decoded.segments[i].timestamp < decoded.segments[i - 1].timestamp) {
        errors.push(`Segments out of order at index ${i}`);
      }
    }
  }

  /**
   * Validate beatmap structure
   */
  static validateBeatmap(beatmap: FractalBeatmap[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (let i = 0; i < beatmap.length; i++) {
      const b = beatmap[i];
      
      // Validate ranges
      if (b.bass < 0 || b.bass > 255) {
        errors.push(`Beatmap[${i}]: bass out of range: ${b.bass}`);
      }
      if (b.mid < 0 || b.mid > 255) {
        errors.push(`Beatmap[${i}]: mid out of range: ${b.mid}`);
      }
      if (b.high < 0 || b.high > 255) {
        errors.push(`Beatmap[${i}]: high out of range: ${b.high}`);
      }
      if (b.beat < 0 || b.beat > 255) {
        errors.push(`Beatmap[${i}]: beat out of range: ${b.beat}`);
      }
      
      // Validate colors
      if (b.colorR < 0 || b.colorR > 255) {
        errors.push(`Beatmap[${i}]: colorR out of range: ${b.colorR}`);
      }
      if (b.colorG < 0 || b.colorG > 255) {
        errors.push(`Beatmap[${i}]: colorG out of range: ${b.colorG}`);
      }
      if (b.colorB < 0 || b.colorB > 255) {
        errors.push(`Beatmap[${i}]: colorB out of range: ${b.colorB}`);
      }
      
      // Validate timestamp progression
      if (i > 0 && b.timestamp < beatmap[i - 1].timestamp) {
        errors.push(`Beatmap[${i}]: timestamp regression: ${b.timestamp} < ${beatmap[i - 1].timestamp}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Reject malformed segments
   */
  static validateSegments(segments: DecodedFractal['segments']): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      
      if (seg.index !== i) {
        errors.push(`Segment index mismatch: expected ${i}, got ${seg.index}`);
      }
      
      if (seg.offset < 0) {
        errors.push(`Segment[${i}]: negative offset: ${seg.offset}`);
      }
      
      if (seg.size <= 0) {
        errors.push(`Segment[${i}]: invalid size: ${seg.size}`);
      }
      
      if (seg.timestamp < 0) {
        errors.push(`Segment[${i}]: negative timestamp: ${seg.timestamp}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
