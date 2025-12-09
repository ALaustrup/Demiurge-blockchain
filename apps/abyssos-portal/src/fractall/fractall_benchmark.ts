/**
 * 💀 Fractal-1 Codec Benchmark
 * 
 * PHASE OMEGA PART II: Runs timed GPU→CPU tests and produces benchmark report
 * Fails CI if regression detected
 */

import { Fractal1Codec } from './codec';
import type { FractalMetadata } from './types';

export interface BenchmarkResult {
  encodingTime: number;
  decodingTime: number;
  gpuAcceleration: boolean;
  throughputMBps: number;
  compressionRatio: number;
  passed: boolean;
  regression: boolean;
}

export interface BenchmarkReport {
  timestamp: number;
  version: string;
  results: BenchmarkResult;
  baseline?: BenchmarkResult;
}

export class FractallBenchmark {
  private static BASELINE_ENCODING_TIME_MS = 1000; // 1 second baseline
  private static BASELINE_DECODING_TIME_MS = 500; // 0.5 second baseline
  private static MIN_COMPRESSION_RATIO = 1.0;
  private static MIN_THROUGHPUT_MBPS = 10.0;

  /**
   * Run benchmark on audio buffer
   */
  static async benchmark(
    audioBuffer: AudioBuffer,
    metadata: FractalMetadata
  ): Promise<BenchmarkResult> {
    // Encoding benchmark
    const encodeStart = performance.now();
    const encoded = await Fractal1Codec.encodeFractal1(audioBuffer, metadata);
    const encodingTime = performance.now() - encodeStart;
    
    // Decoding benchmark
    const decodeStart = performance.now();
    await Fractal1Codec.decodeFractal1(encoded);
    const decodingTime = performance.now() - decodeStart;
    
    // Calculate throughput
    const audioSizeMB = (audioBuffer.length * audioBuffer.numberOfChannels * 4) / (1024 * 1024);
    const throughputMBps = audioSizeMB / (encodingTime / 1000);
    
    // Calculate compression ratio
    const originalSize = audioBuffer.length * audioBuffer.numberOfChannels * 4;
    const compressedSize = encoded.length;
    const compressionRatio = originalSize / compressedSize;
    
    // Check GPU acceleration (WebGL2 available)
    const gpuAcceleration = this.checkGPUAcceleration();
    
    // Check for regression
    const regression = encodingTime > this.BASELINE_ENCODING_TIME_MS * 1.5 ||
                       decodingTime > this.BASELINE_DECODING_TIME_MS * 1.5 ||
                       compressionRatio < this.MIN_COMPRESSION_RATIO ||
                       throughputMBps < this.MIN_THROUGHPUT_MBPS;
    
    const passed = !regression;
    
    return {
      encodingTime,
      decodingTime,
      gpuAcceleration,
      throughputMBps,
      compressionRatio,
      passed,
      regression,
    };
  }

  /**
   * Check if GPU acceleration is available
   */
  private static checkGPUAcceleration(): boolean {
    if (typeof document === 'undefined') {
      return false;
    }
    
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    
    return gl !== null;
  }

  /**
   * Generate benchmark report
   */
  static generateReport(result: BenchmarkResult, baseline?: BenchmarkResult): BenchmarkReport {
    return {
      timestamp: Date.now(),
      version: '1.0.0',
      results: result,
      baseline,
    };
  }

  /**
   * Compare with baseline and detect regression
   */
  static compareWithBaseline(
    current: BenchmarkResult,
    baseline: BenchmarkResult
  ): { regression: boolean; details: string[] } {
    const details: string[] = [];
    let regression = false;
    
    // Encoding time regression
    if (current.encodingTime > baseline.encodingTime * 1.2) {
      regression = true;
      details.push(
        `Encoding time regression: ${current.encodingTime.toFixed(2)}ms > ${baseline.encodingTime.toFixed(2)}ms (20% threshold)`
      );
    }
    
    // Decoding time regression
    if (current.decodingTime > baseline.decodingTime * 1.2) {
      regression = true;
      details.push(
        `Decoding time regression: ${current.decodingTime.toFixed(2)}ms > ${baseline.decodingTime.toFixed(2)}ms (20% threshold)`
      );
    }
    
    // Compression ratio regression
    if (current.compressionRatio < baseline.compressionRatio * 0.9) {
      regression = true;
      details.push(
        `Compression ratio regression: ${current.compressionRatio.toFixed(2)} < ${baseline.compressionRatio.toFixed(2)} (10% threshold)`
      );
    }
    
    // Throughput regression
    if (current.throughputMBps < baseline.throughputMBps * 0.8) {
      regression = true;
      details.push(
        `Throughput regression: ${current.throughputMBps.toFixed(2)} MB/s < ${baseline.throughputMBps.toFixed(2)} MB/s (20% threshold)`
      );
    }
    
    return { regression, details };
  }

  /**
   * Run full benchmark suite
   */
  static async runBenchmarkSuite(
    testAudioBuffers: AudioBuffer[],
    metadata: FractalMetadata
  ): Promise<{
    passed: boolean;
    results: BenchmarkResult[];
    report: BenchmarkReport;
  }> {
    const results: BenchmarkResult[] = [];
    
    for (const buffer of testAudioBuffers) {
      const result = await this.benchmark(buffer, metadata);
      results.push(result);
    }
    
    // Aggregate results
    const avgResult: BenchmarkResult = {
      encodingTime: results.reduce((sum, r) => sum + r.encodingTime, 0) / results.length,
      decodingTime: results.reduce((sum, r) => sum + r.decodingTime, 0) / results.length,
      gpuAcceleration: results.some(r => r.gpuAcceleration),
      throughputMBps: results.reduce((sum, r) => sum + r.throughputMBps, 0) / results.length,
      compressionRatio: results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length,
      passed: results.every(r => r.passed),
      regression: results.some(r => r.regression),
    };
    
    const report = this.generateReport(avgResult);
    
    return {
      passed: avgResult.passed && !avgResult.regression,
      results,
      report,
    };
  }
}
