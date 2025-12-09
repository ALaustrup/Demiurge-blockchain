/**
 * Radio Segment Server
 * 
 * Hosts chunk requests for streaming fractal-1 audio segments
 */

import type { RadioSegment } from './radioTypes.js';
import { getDb } from '../db.js';

export class RadioSegmentServer {
  /**
   * Get segment data for track
   */
  static async getSegment(
    trackId: string,
    segmentIndex: number
  ): Promise<RadioSegment | null> {
    const db = getDb();
    
    // In real implementation, fetch from storage (IPFS, Fabric, etc.)
    // For now, return mock data
    const segment = db.prepare(`
      SELECT * FROM radio_segments 
      WHERE track_id = ? AND segment_index = ?
    `).get(trackId, segmentIndex) as any;
    
    if (!segment) return null;
    
    return {
      trackId: segment.track_id,
      segmentIndex: segment.segment_index,
      data: new Uint8Array(segment.data), // In real implementation, decode from storage
      timestamp: segment.timestamp,
    };
  }

  /**
   * Store segment data
   */
  static async storeSegment(segment: RadioSegment): Promise<void> {
    const db = getDb();
    
    // In real implementation, store to IPFS/Fabric and store reference
    db.prepare(`
      INSERT OR REPLACE INTO radio_segments (track_id, segment_index, data, timestamp)
      VALUES (?, ?, ?, ?)
    `).run(
      segment.trackId,
      segment.segmentIndex,
      Array.from(segment.data), // In real implementation, store reference/hash
      segment.timestamp
    );
  }

  /**
   * Get segment table for track
   */
  static async getSegmentTable(trackId: string): Promise<Array<{ index: number; offset: number; size: number }>> {
    const db = getDb();
    
    // In real implementation, fetch from fractal-1 header
    const segments = db.prepare(`
      SELECT segment_index, offset, size FROM radio_segments 
      WHERE track_id = ? 
      ORDER BY segment_index ASC
    `).all(trackId) as Array<{ segment_index: number; offset: number; size: number }>;
    
    return segments.map(s => ({
      index: s.segment_index,
      offset: s.offset,
      size: s.size,
    }));
  }
}

