/**
 * Radio Types (Frontend)
 * 
 * Re-exported from backend for frontend use
 */

export interface RadioBlock {
  blockId: string;
  trackId: string;
  genreId: string;
  producer: string;
  timestamp: number;
  segmentRoot: string;
  segmentCount: number;
}

export interface RadioQueueEntry {
  trackId: string;
  genreId: string;
  submittedBy: string;
  submittedAt: number;
  priority?: number;
}

