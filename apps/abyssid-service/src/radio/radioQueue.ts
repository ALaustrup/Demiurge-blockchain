/**
 * Radio Queue Management
 * 
 * User-submitted track queue per genre with anti-spam rules
 */

import type { RadioQueueEntry } from './radioTypes.js';
import { getDb } from '../db.js';

const MIN_SUBMISSION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes between submissions

export class RadioQueue {
  /**
   * Add track to queue
   */
  static async addToQueue(
    trackId: string,
    genreId: string,
    submittedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    const db = getDb();
    
    // Check anti-spam: last submission time
    const lastSubmission = db.prepare(`
      SELECT submitted_at FROM radio_queue 
      WHERE submitted_by = ? 
      ORDER BY submitted_at DESC 
      LIMIT 1
    `).get(submittedBy) as { submitted_at: number } | undefined;
    
    if (lastSubmission) {
      const timeSinceLastSubmission = Date.now() - lastSubmission.submitted_at;
      if (timeSinceLastSubmission < MIN_SUBMISSION_INTERVAL_MS) {
        const remainingSeconds = Math.ceil((MIN_SUBMISSION_INTERVAL_MS - timeSinceLastSubmission) / 1000);
        return {
          success: false,
          error: `Please wait ${remainingSeconds} seconds before submitting another track`,
        };
      }
    }
    
    // Add to queue
    db.prepare(`
      INSERT INTO radio_queue (track_id, genre_id, submitted_by, submitted_at)
      VALUES (?, ?, ?, ?)
    `).run(trackId, genreId, submittedBy, Date.now());
    
    return { success: true };
  }

  /**
   * Get next track from queue for genre
   */
  static async getNextTrack(genreId: string): Promise<RadioQueueEntry | null> {
    const db = getDb();
    
    const entry = db.prepare(`
      SELECT * FROM radio_queue 
      WHERE genre_id = ? 
      ORDER BY submitted_at ASC 
      LIMIT 1
    `).get(genreId) as any;
    
    if (!entry) return null;
    
    // Remove from queue
    db.prepare('DELETE FROM radio_queue WHERE id = ?').run(entry.id);
    
    // Map database snake_case to camelCase
    return {
      trackId: entry.track_id,
      genreId: entry.genre_id,
      submittedBy: entry.submitted_by,
      submittedAt: entry.submitted_at,
    };
  }

  /**
   * Get queue length for genre
   */
  static getQueueLength(genreId: string): number {
    const db = getDb();
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM radio_queue WHERE genre_id = ?
    `).get(genreId) as { count: number } | undefined;
    return result?.count || 0;
  }

  /**
   * Get all queued tracks for genre
   */
  static getQueue(genreId: string): RadioQueueEntry[] {
    const db = getDb();
    const entries = db.prepare(`
      SELECT * FROM radio_queue 
      WHERE genre_id = ? 
      ORDER BY submitted_at ASC
    `).all(genreId) as any[];
    
    // Map database snake_case to camelCase
    return entries.map(entry => ({
      trackId: entry.track_id,
      genreId: entry.genre_id,
      submittedBy: entry.submitted_by,
      submittedAt: entry.submitted_at,
    }));
  }
}

