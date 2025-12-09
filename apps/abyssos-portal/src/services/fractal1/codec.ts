/**
 * Fractal-1 Audio Codec
 * 
 * Main encoder/decoder for Fractal-1 format
 */

import type { FractalMetadata, DecodedFractal, FractalSegment, Fractal1Header } from './types';
import { AudioSegmenter } from './segmenter';
import { BeatmapGenerator } from './beatmap';
import { LZAbyss } from './lzAbyss';

const MAGIC = 'FRACT1';
const VERSION = 1;

export class Fractal1Codec {
  /**
   * Encode audio to Fractal-1 format
   */
  static async encodeFractal1(
    audioBuffer: AudioBuffer,
    metadata: FractalMetadata
  ): Promise<Uint8Array> {
    // Generate beatmap
    const audioContext = new AudioContext({ sampleRate: audioBuffer.sampleRate });
    const beatmapGen = new BeatmapGenerator(audioContext);
    const beatmap = await beatmapGen.generateBeatmap(audioBuffer);
    const beatmapData = BeatmapGenerator.serializeBeatmap(beatmap);
    
    // Segment audio
    const { segments, segmentTable } = AudioSegmenter.segmentAudio(audioBuffer, true);
    
    // Build header
    const header: Fractal1Header = {
      magic: MAGIC,
      version: VERSION,
      metadata: {
        ...metadata,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        duration: audioBuffer.duration,
      },
      beatmapSize: beatmapData.length,
      segmentCount: segmentTable.length,
      segmentTableOffset: 0, // Will be calculated
      audioDataOffset: 0, // Will be calculated
    };
    
    // Serialize header
    const headerJson = JSON.stringify(header);
    const headerBytes = new TextEncoder().encode(headerJson);
    const headerSize = headerBytes.length;
    
    // Calculate offsets
    let offset = 4 + 4 + headerSize + 4 + beatmapData.length; // magic(4) + version(4) + header + beatmapSize(4) + beatmap
    header.segmentTableOffset = offset;
    offset += segmentTable.length * 20; // Each segment entry is ~20 bytes
    header.audioDataOffset = offset;
    
    // Build output buffer
    const output: number[] = [];
    
    // Write magic
    for (let i = 0; i < MAGIC.length; i++) {
      output.push(MAGIC.charCodeAt(i));
    }
    
    // Write version (4 bytes, little-endian)
    output.push(VERSION & 0xFF);
    output.push((VERSION >> 8) & 0xFF);
    output.push((VERSION >> 16) & 0xFF);
    output.push((VERSION >> 24) & 0xFF);
    
    // Write header size (4 bytes)
    output.push(headerSize & 0xFF);
    output.push((headerSize >> 8) & 0xFF);
    output.push((headerSize >> 16) & 0xFF);
    output.push((headerSize >> 24) & 0xFF);
    
    // Write header JSON
    output.push(...headerBytes);
    
    // Write beatmap size (4 bytes)
    output.push(beatmapData.length & 0xFF);
    output.push((beatmapData.length >> 8) & 0xFF);
    output.push((beatmapData.length >> 16) & 0xFF);
    output.push((beatmapData.length >> 24) & 0xFF);
    
    // Write beatmap
    output.push(...beatmapData);
    
    // Write segment table
    for (const segment of segmentTable) {
      // index (4 bytes)
      output.push(segment.index & 0xFF);
      output.push((segment.index >> 8) & 0xFF);
      output.push((segment.index >> 16) & 0xFF);
      output.push((segment.index >> 24) & 0xFF);
      
      // offset (8 bytes)
      const offsetBytes = this.uint64ToBytes(segment.offset);
      output.push(...offsetBytes);
      
      // size (4 bytes)
      output.push(segment.size & 0xFF);
      output.push((segment.size >> 8) & 0xFF);
      output.push((segment.size >> 16) & 0xFF);
      output.push((segment.size >> 24) & 0xFF);
      
      // timestamp (4 bytes, float)
      const timestampBytes = new Uint8Array(new Float32Array([segment.timestamp]).buffer);
      output.push(...timestampBytes);
      
      // compressed (1 byte)
      output.push(segment.compressed ? 1 : 0);
    }
    
    // Write audio segments
    for (const segment of segments) {
      const segmentBytes = new Uint8Array(segment.buffer);
      output.push(...segmentBytes);
    }
    
    return new Uint8Array(output);
  }

  /**
   * Decode Fractal-1 format to audio
   */
  static async decodeFractal1(data: Uint8Array): Promise<DecodedFractal> {
    let offset = 0;
    
    // Read magic
    const magic = String.fromCharCode(...data.slice(offset, offset + 6));
    if (magic !== MAGIC) {
      throw new Error(`Invalid Fractal-1 magic: ${magic}`);
    }
    offset += 6;
    
    // Read version
    const version = data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
    offset += 4;
    
    if (version !== VERSION) {
      throw new Error(`Unsupported Fractal-1 version: ${version}`);
    }
    
    // Read header size
    const headerSize = data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
    offset += 4;
    
    // Read header JSON
    const headerBytes = data.slice(offset, offset + headerSize);
    const headerJson = new TextDecoder().decode(headerBytes);
    const header: Fractal1Header = JSON.parse(headerJson);
    offset += headerSize;
    
    // Read beatmap
    const beatmapSize = data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
    offset += 4;
    
    const beatmapData = data.slice(offset, offset + beatmapSize);
    const beatmap = BeatmapGenerator.deserializeBeatmap(beatmapData);
    offset += beatmapSize;
    
    // Read segment table
    const segments: FractalSegment[] = [];
    for (let i = 0; i < header.segmentCount; i++) {
      const index = data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
      offset += 4;
      
      const segOffset = this.bytesToUint64(data.slice(offset, offset + 8));
      offset += 8;
      
      const size = data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
      offset += 4;
      
      const timestampBytes = data.slice(offset, offset + 4);
      const timestamp = new Float32Array(timestampBytes.buffer, timestampBytes.byteOffset, 1)[0];
      offset += 4;
      
      const compressed = data[offset] === 1;
      offset += 1;
      
      segments.push({
        index,
        offset: segOffset,
        size,
        timestamp,
        compressed,
      });
    }
    
    // Read audio segments
    const audioSegments: Float32Array[] = [];
    for (const segment of segments) {
      const segmentData = data.slice(header.audioDataOffset + segment.offset, header.audioDataOffset + segment.offset + segment.size);
      const audioData = new Float32Array(segmentData.buffer, segmentData.byteOffset, segment.size / 4);
      audioSegments.push(audioData);
    }
    
    // Reconstruct audio buffer
    const audioBuffer = AudioSegmenter.reconstructAudio(
      audioSegments,
      header.metadata.sampleRate,
      header.metadata.channels
    );
    
    // Convert to Float32Array for return
    const audioData = audioBuffer.getChannelData(0);
    
    return {
      metadata: header.metadata,
      audioData,
      beatmap,
      segments,
    };
  }

  /**
   * Convert uint64 to 8-byte array (little-endian)
   */
  private static uint64ToBytes(value: number): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < 8; i++) {
      bytes.push((value >> (i * 8)) & 0xFF);
    }
    return bytes;
  }

  /**
   * Convert 8-byte array to uint64 (little-endian)
   */
  private static bytesToUint64(bytes: Uint8Array): number {
    let value = 0;
    for (let i = 0; i < 8 && i < bytes.length; i++) {
      value |= bytes[i] << (i * 8);
    }
    return value;
  }
}

