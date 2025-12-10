/**
 * Login Voice Service
 * 
 * Plays a voice file in the background when the login/signup screen appears
 * (right after the intro video ends).
 * 
 * Place your audio file at: apps/abyssos-portal/public/audio/login-voice.wav
 * Supported formats: .wav, .mp3, .ogg
 */

class LoginVoiceService {
  private audio: HTMLAudioElement | null = null;
  private hasPlayed: boolean = false;
  private volume: number = 0.7; // 70% volume for voice

  /**
   * Initialize and play the login voice
   * This should be called when the login screen appears
   */
  async play() {
    if (typeof window === 'undefined' || this.hasPlayed) return;

    try {
      // Create audio element
      this.audio = new Audio('/audio/login-voice.wav');
      this.audio.volume = this.volume;
      this.audio.preload = 'auto';

      // Play the voice
      await this.audio.play();
      this.hasPlayed = true;

      // Clean up after playback completes
      this.audio.addEventListener('ended', () => {
        if (this.audio) {
          this.audio = null;
        }
      });

      // Handle errors gracefully
      this.audio.addEventListener('error', (e) => {
        console.warn('Login voice file not found or failed to load. Place your audio file at: public/audio/login-voice.wav');
        this.audio = null;
      });
    } catch (error) {
      console.warn('Failed to play login voice:', error);
      // Auto-play might be blocked by browser, that's okay
    }
  }

  /**
   * Stop the voice (if still playing)
   */
  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  /**
   * Reset so it can play again (useful for testing)
   */
  reset() {
    this.hasPlayed = false;
    this.stop();
  }
}

// Singleton instance
export const loginVoiceService = new LoginVoiceService();

