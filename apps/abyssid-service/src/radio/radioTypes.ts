/**
 * Abyss Radio Types
 */

export interface RadioBlock {
  blockId: string;
  trackId: string;
  genreId: string;
  producer: string; // AbyssID or wallet address
  timestamp: number;
  segmentRoot: string; // Merkle root of segment table
  segmentCount: number;
}

export interface RadioQueueEntry {
  trackId: string;
  genreId: string;
  submittedBy: string;
  submittedAt: number;
  priority?: number;
}

export interface RadioSegment {
  trackId: string;
  segmentIndex: number;
  data: Uint8Array;
  timestamp: number;
}

export interface RadioStreamState {
  currentBlock: RadioBlock | null;
  nextBlock: RadioBlock | null;
  bufferTime: number; // seconds
  listeners: number;
}

