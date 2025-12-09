/**
 * Radio Block Structure
 * 
 * On-chain broadcast blocks for Abyss Radio
 */

import type { RadioBlock } from './radioTypes';

export class RadioBlockManager {
  /**
   * Create a new radio block
   */
  static createBlock(
    trackId: string,
    genreId: string,
    producer: string,
    segmentRoot: string,
    segmentCount: number
  ): RadioBlock {
    return {
      blockId: `radio:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
      trackId,
      genreId,
      producer,
      timestamp: Date.now(),
      segmentRoot,
      segmentCount,
    };
  }

  /**
   * Serialize radio block to JSON
   */
  static serialize(block: RadioBlock): string {
    return JSON.stringify(block);
  }

  /**
   * Deserialize radio block from JSON
   */
  static deserialize(data: string): RadioBlock {
    return JSON.parse(data);
  }

  /**
   * Validate radio block structure
   */
  static validate(block: RadioBlock): boolean {
    return (
      typeof block.blockId === 'string' &&
      typeof block.trackId === 'string' &&
      typeof block.genreId === 'string' &&
      typeof block.producer === 'string' &&
      typeof block.timestamp === 'number' &&
      typeof block.segmentRoot === 'string' &&
      typeof block.segmentCount === 'number' &&
      block.segmentCount > 0
    );
  }
}

