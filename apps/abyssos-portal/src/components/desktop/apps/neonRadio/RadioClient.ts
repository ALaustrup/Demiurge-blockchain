/**
 * Radio Client
 * 
 * Subscribes to radio blocks and manages audio playback
 */

import type { RadioBlock } from '../../../../services/abyssid/radioTypes';
import { Fractal1Codec } from '@abyssos/fractall/codec';

export class RadioClient {
  private genreId: string;
  private eventSource: EventSource | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private onBlockCallback: ((block: RadioBlock) => void) | null = null;
  private onBufferStatusCallback: ((status: 'idle' | 'buffering' | 'ready') => void) | null = null;
  private isPlaying: boolean = false;

  constructor(genreId: string = 'all') {
    this.genreId = genreId;
  }

  /**
   * Start listening to radio stream
   */
  start(): void {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.onBufferStatusCallback?.('buffering');
    
    // Initialize audio context
    this.audioContext = new AudioContext();
    
    // Connect to radio stream
    const streamUrl = `https://id.demiurge.cloud/api/radio/blocks/stream?genre=${this.genreId}`;
    this.eventSource = new EventSource(streamUrl);
    
    this.eventSource.onmessage = (event) => {
      try {
        const blocks: RadioBlock[] = JSON.parse(event.data);
        if (blocks.length > 0) {
          const latestBlock = blocks[blocks.length - 1];
          this.handleBlock(latestBlock);
        }
      } catch (error) {
        console.error('Failed to parse radio block:', error);
      }
    };
    
    this.eventSource.onerror = (error) => {
      console.error('Radio stream error:', error);
      this.onBufferStatusCallback?.('idle');
    };
  }

  /**
   * Stop listening
   */
  stop(): void {
    this.isPlaying = false;
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.onBufferStatusCallback?.('idle');
  }

  /**
   * Handle incoming radio block
   */
  private async handleBlock(block: RadioBlock): Promise<void> {
    if (this.onBlockCallback) {
      this.onBlockCallback(block);
    }
    
    // Load and play audio segments
    await this.loadAndPlayBlock(block);
  }

  /**
   * Load and play audio from block
   */
  private async loadAndPlayBlock(block: RadioBlock): Promise<void> {
    if (!this.audioContext) return;
    
    try {
      this.onBufferStatusCallback?.('buffering');
      
      // Fetch segment table (in real implementation, decode from fractal-1)
      // For now, fetch segments sequentially
      const segments: Float32Array[] = [];
      
      for (let i = 0; i < block.segmentCount; i++) {
        const segmentUrl = `https://id.demiurge.cloud/api/radio/segment/${block.trackId}/${i}`;
        const response = await fetch(segmentUrl);
        const segmentData = new Uint8Array(await response.arrayBuffer());
        
        // Decode segment (simplified - in real implementation, decode fractal-1)
        const audioData = new Float32Array(segmentData.buffer);
        segments.push(audioData);
      }
      
      // Reconstruct audio buffer
      const totalLength = segments.reduce((sum, seg) => sum + seg.length, 0);
      const audioBuffer = this.audioContext.createBuffer(1, totalLength, 44100); // Default sample rate
      
      let offset = 0;
      for (const segment of segments) {
        audioBuffer.getChannelData(0).set(segment, offset);
        offset += segment.length;
      }
      
      // Play audio
      this.playAudioBuffer(audioBuffer);
      
      this.onBufferStatusCallback?.('ready');
    } catch (error) {
      console.error('Failed to load block audio:', error);
      this.onBufferStatusCallback?.('idle');
    }
  }

  /**
   * Play audio buffer
   */
  private playAudioBuffer(audioBuffer: AudioBuffer): void {
    if (!this.audioContext) return;
    
    // Stop previous source
    if (this.sourceNode) {
      this.sourceNode.stop();
    }
    
    // Create new source
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    
    source.onended = () => {
      // Auto-play next block if available
      // (Handled by event source)
    };
    
    source.start(0);
    this.sourceNode = source;
  }

  /**
   * Set callback for new blocks
   */
  onBlock(callback: (block: RadioBlock) => void): void {
    this.onBlockCallback = callback;
  }

  /**
   * Set callback for buffer status
   */
  onBufferStatus(callback: (status: 'idle' | 'buffering' | 'ready') => void): void {
    this.onBufferStatusCallback = callback;
  }
}

