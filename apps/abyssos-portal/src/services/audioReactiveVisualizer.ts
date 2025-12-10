/**
 * Audio Reactive Visualization Engine
 * 
 * Creates real-time audio-reactive visuals that react to music/audio playback.
 * When audio is playing, displays vibrant reactive visuals.
 * When audio stops, transitions to a calm desktop live wallpaper.
 * Inspired by Windows Media Player and Xbox original music visualizer.
 */

export interface VisualizerConfig {
  intensity: number; // 0-1, how reactive the visuals are
  speed: number; // 0-1, animation speed
  colorScheme: 'cyber' | 'ancient' | 'futuristic' | 'neon';
}

class AudioReactiveVisualizer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationFrameId: number | null = null;
  private audioSource: MediaElementAudioSourceNode | null = null;
  private isActive: boolean = false;
  private config: VisualizerConfig = {
    intensity: 0.7,
    speed: 0.5,
    colorScheme: 'cyber',
  };
  private listeners: Set<(data: { frequencies: Uint8Array; waveform: Uint8Array; average: number }) => void> = new Set();

  /**
   * Initialize the visualizer with an audio element
   */
  async initialize(audioElement?: HTMLAudioElement | HTMLVideoElement) {
    if (typeof window === 'undefined') return;

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256; // Higher resolution for better visuals
      this.analyser.smoothingTimeConstant = 0.8;
      
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      // Connect audio source if provided
      if (audioElement) {
        this.connectAudioSource(audioElement);
      }

      this.isActive = true;
      this.startAnalysis();
    } catch (error) {
      console.error('Failed to initialize audio visualizer:', error);
    }
  }

  /**
   * Connect an audio/video element to the visualizer
   */
  connectAudioSource(element: HTMLAudioElement | HTMLVideoElement) {
    if (!this.audioContext || !this.analyser) {
      console.warn('Visualizer not initialized');
      return;
    }

    try {
      // Disconnect existing source if any
      if (this.audioSource) {
        this.audioSource.disconnect();
      }

      // Create new source from element
      this.audioSource = this.audioContext.createMediaElementSource(element);
      this.audioSource.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Failed to connect audio source:', error);
    }
  }

  /**
   * Start analyzing audio and notifying listeners
   */
  private startAnalysis() {
    if (!this.analyser || !this.dataArray) return;

    const analyze = () => {
      if (!this.isActive || !this.analyser || !this.dataArray) return;

      // Get frequency data
      this.analyser.getByteFrequencyData(this.dataArray);
      
      // Get waveform data
      const waveformArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteTimeDomainData(waveformArray);

      // Calculate average amplitude
      const sum = Array.from(this.dataArray).reduce((a, b) => a + b, 0);
      const average = sum / this.dataArray.length;

      // Notify all listeners
      this.notifyListeners({
        frequencies: this.dataArray,
        waveform: waveformArray,
        average,
      });

      this.animationFrameId = requestAnimationFrame(analyze);
    };

    analyze();
  }

  /**
   * Subscribe to audio data updates
   */
  subscribe(listener: (data: { frequencies: Uint8Array; waveform: Uint8Array; average: number }) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(data: { frequencies: Uint8Array; waveform: Uint8Array; average: number }) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in visualizer listener:', error);
      }
    });
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<VisualizerConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): VisualizerConfig {
    return { ...this.config };
  }

  /**
   * Stop the visualizer
   */
  stop() {
    this.isActive = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.audioSource) {
      this.audioSource.disconnect();
      this.audioSource = null;
    }
  }

  /**
   * Resume the visualizer
   */
  resume() {
    if (this.audioContext && this.analyser && this.dataArray) {
      this.isActive = true;
      this.startAnalysis();
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.dataArray = null;
    this.listeners.clear();
  }
}

// Singleton instance
export const audioReactiveVisualizer = new AudioReactiveVisualizer();

