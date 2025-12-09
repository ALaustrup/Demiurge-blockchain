/**
 * Radio Scheduler
 * 
 * Schedules radio blocks and manages broadcast timing
 */

import { RadioQueue } from './radioQueue.js';
import { RadioBlockManager } from './radioBlock.js';
import { RadioSegmentServer } from './radioSegmentServer.js';
import type { RadioBlock } from './radioTypes.js';

const BROADCAST_INTERVAL_MS = 30 * 1000; // 30 seconds per block

export class RadioScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private currentGenre: string = 'all';
  private onBlockCallback: ((block: RadioBlock) => void) | null = null;

  /**
   * Start scheduler
   */
  start(genreId: string = 'all', onBlock: (block: RadioBlock) => void): void {
    this.currentGenre = genreId;
    this.onBlockCallback = onBlock;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Schedule first block immediately
    this.scheduleNextBlock();
    
    // Schedule subsequent blocks
    this.intervalId = setInterval(() => {
      this.scheduleNextBlock();
    }, BROADCAST_INTERVAL_MS);
  }

  /**
   * Stop scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Schedule next block
   */
  private async scheduleNextBlock(): Promise<void> {
    try {
      // Get next track from queue
      const queueEntry = await RadioQueue.getNextTrack(this.currentGenre);
      
      if (!queueEntry) {
        // Silently return if no tracks - this is normal
        return;
      }
      
      // Get segment table
      const segmentTable = await RadioSegmentServer.getSegmentTable(queueEntry.trackId);
      
      if (segmentTable.length === 0) {
        console.warn(`[RadioScheduler] No segments found for track: ${queueEntry.trackId}`);
        return;
      }
      
      // Calculate segment root (simplified - in real implementation, use Merkle tree)
      const segmentRoot = await this.calculateSegmentRoot(segmentTable);
      
      // Create radio block
      const block = RadioBlockManager.createBlock(
        queueEntry.trackId,
        queueEntry.genreId,
        queueEntry.submittedBy,
        segmentRoot,
        segmentTable.length
      );
      
      // Emit block
      if (this.onBlockCallback) {
        this.onBlockCallback(block);
      }
      
      // Push to Grid peer events (in real implementation)
      // await pushToGrid(block);
      
      console.log(`[RadioScheduler] Broadcast block: ${block.blockId} for track: ${queueEntry.trackId}`);
    } catch (error) {
      // Don't log errors for empty queue - it's expected
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('queue')) {
        console.error('[RadioScheduler] Error scheduling block:', error);
      }
    }
  }

  /**
   * Calculate Merkle root of segment table
   */
  private async calculateSegmentRoot(segmentTable: Array<{ index: number; offset: number; size: number }>): Promise<string> {
    // Simplified - in real implementation, build Merkle tree
    const data = JSON.stringify(segmentTable);
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

