/**
 * Fractal-1 Audio Codec Types
 */

export interface FractalMetadata {
  trackNumber?: number;
  trackName: string;
  albumName?: string;
  artistName: string;
  genre?: string;
  releaseDate?: string;
  duration: number; // in seconds
  sampleRate: number;
  channels: number;
  nftMetadata?: {
    owner: string;
    royalties: number; // 0-100 percentage
    provenance?: Array<{
      owner: string;
      txHash: string;
      timestamp: number;
    }>;
  };
}

export interface FractalSegment {
  index: number;
  offset: number;
  size: number;
  timestamp: number; // in seconds
  compressed: boolean;
}

export interface FractalBeatmap {
  timestamp: number;
  bass: number; // 0-255
  mid: number; // 0-255
  high: number; // 0-255
  beat: number; // 0-255 (beat trigger strength)
  colorR: number; // 0-255
  colorG: number; // 0-255
  colorB: number; // 0-255
}

export interface DecodedFractal {
  metadata: FractalMetadata;
  audioData: Float32Array;
  beatmap: FractalBeatmap[];
  segments: FractalSegment[];
}

export interface Fractal1Header {
  magic: string; // "FRACT1"
  version: number;
  metadata: FractalMetadata;
  beatmapSize: number;
  segmentCount: number;
  segmentTableOffset: number;
  audioDataOffset: number;
}

