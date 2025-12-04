/**
 * AudioEngine
 * 
 * TODO: Milestone 4.1 – integrate audio-reactive behavior
 * 
 * Creates a lazy AudioContext and connects to an audio element
 * via MediaElementSource → AnalyserNode for spectrum analysis.
 */

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private isReady = false;
  private isPlaying = false;

  /**
   * Get audio context (for external access if needed)
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Initialize the audio context (lazy)
   */
  private getContext(): AudioContext | null {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn("AudioContext not supported:", e);
        return null;
      }
    }
    return this.audioContext;
  }

  /**
   * Start audio analysis from an audio element
   */
  startAudio(audioElement: HTMLAudioElement): boolean {
    const ctx = this.getContext();
    if (!ctx) return false;

    this.audioElement = audioElement;

    try {
      // Create analyser node with better resolution for subtle reactivity
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 2048; // Higher resolution for better frequency analysis
      this.analyser.smoothingTimeConstant = 0.8; // Smooth transitions

      // Create source from audio element
      this.source = ctx.createMediaElementSource(audioElement);
      this.source.connect(this.analyser);
      this.analyser.connect(ctx.destination);

      this.isReady = true;
      return true;
    } catch (e) {
      console.warn("Failed to start audio engine:", e);
      return false;
    }
  }

  /**
   * Stop audio analysis
   */
  stopAudio(): void {
    if (this.source) {
      try {
        this.source.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
      this.source = null;
    }

    this.analyser = null;
    this.audioElement = null;
    this.isReady = false;
    this.isPlaying = false;
  }

  /**
   * Get analyser node reference
   */
  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  /**
   * Get ready state
   */
  getReady(): boolean {
    return this.isReady;
  }

  /**
   * Get playing state
   */
  getPlaying(): boolean {
    return this.isPlaying && this.isReady;
  }

  /**
   * Set playing state
   */
  setPlaying(playing: boolean): void {
    this.isPlaying = playing;
  }
}

// Singleton instance
let audioEngineInstance: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!audioEngineInstance) {
    audioEngineInstance = new AudioEngine();
  }
  return audioEngineInstance;
}

