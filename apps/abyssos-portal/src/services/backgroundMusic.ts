/**
 * Background Music Service
 * 
 * Manages background music that plays after AbyssID login/signup.
 * Music is on by default but can be toggled off by users.
 */

class BackgroundMusicService {
  private audio: HTMLAudioElement | null = null;
  private isEnabled: boolean = true;
  private isPlaying: boolean = false;
  private volume: number = 0.3; // 30% volume by default
  private listeners: Set<(enabled: boolean) => void> = new Set();

  /**
   * Initialize background music
   * Place your .wav file at: apps/abyssos-portal/public/audio/background-music.wav
   */
  async initialize() {
    if (typeof window === 'undefined') return;

    // Check if music is disabled in localStorage
    const stored = localStorage.getItem('abyssos_background_music_enabled');
    if (stored === 'false') {
      this.isEnabled = false;
    }

    // Create audio element
    this.audio = new Audio('/audio/background-music.wav');
    this.audio.loop = true;
    this.audio.volume = this.volume;
    this.audio.preload = 'auto';

    // Handle errors gracefully
    this.audio.addEventListener('error', (e) => {
      console.warn('Background music file not found or failed to load. Place your .wav file at: public/audio/background-music.wav');
    });
  }

  /**
   * Play background music (called after login/signup)
   */
  play() {
    if (!this.isEnabled || !this.audio || this.isPlaying) return;

    this.audio.play().catch((error) => {
      console.warn('Failed to play background music:', error);
      // Auto-play might be blocked by browser, that's okay
    });
    this.isPlaying = true;
  }

  /**
   * Stop background music
   */
  stop() {
    if (!this.audio || !this.isPlaying) return;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying = false;
  }

  /**
   * Toggle music on/off
   */
  toggle() {
    this.isEnabled = !this.isEnabled;
    localStorage.setItem('abyssos_background_music_enabled', String(this.isEnabled));

    if (this.isEnabled) {
      this.play();
    } else {
      this.stop();
    }

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    localStorage.setItem('abyssos_background_music_volume', String(this.volume));
  }

  /**
   * Get current enabled state
   */
  getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Get current playing state
   */
  getPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Subscribe to enabled state changes
   */
  subscribe(listener: (enabled: boolean) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.isEnabled);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.isEnabled);
      } catch (error) {
        console.error('Error in background music listener:', error);
      }
    });
  }
}

// Singleton instance
export const backgroundMusicService = new BackgroundMusicService();

// Initialize on module load
if (typeof window !== 'undefined') {
  backgroundMusicService.initialize();
}

