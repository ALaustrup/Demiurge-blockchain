/**
 * Intro Video Component
 * 
 * Plays a full-screen intro video automatically on landing.
 * Place your .mp4 file at: apps/abyssos-portal/public/video/intro.mp4
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroVideoProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function IntroVideo({ onComplete, onSkip }: IntroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay

  // Auto-play video on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let skipTimer: ReturnType<typeof setTimeout> | null = null;
    let hasCompleted = false;
    let earlyEndRetries = 0;
    let startedAt = 0;

    // Show skip button after 2 seconds
    skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 2000);

    // Handle video end - ONLY call onComplete when video actually ends
    const handleEnded = () => {
      if (!video) return;

      const duration = video.duration || 0;
      const currentTime = video.currentTime || 0;
      const elapsed = startedAt ? (performance.now() - startedAt) / 1000 : currentTime;

      // Require meaningful playback before completing
      const minWatch = Math.min(12, Math.max(5, duration * 0.6)); // at least 5s or 60% up to 12s
      const nearEnd = duration > 0 && currentTime >= duration - 0.35;
      const watchedEnough = elapsed >= minWatch || nearEnd;

      if (!watchedEnough && earlyEndRetries < 5) {
        earlyEndRetries += 1;
        console.warn(
          `Intro video ended early (t=${currentTime.toFixed(2)}/${duration.toFixed(
            2
          )}, elapsed=${elapsed.toFixed(2)}s). Retry ${earlyEndRetries}/5`
        );
        video.currentTime = 0;
        video.play().catch((err) => {
          console.error('Failed to resume intro video after early end:', err);
        });
        return;
      }

      if (hasCompleted) return; // Prevent multiple calls
      hasCompleted = true;
      console.log('Intro video ended naturally');
      localStorage.setItem('abyssos_intro_seen', 'true');
      onComplete();
    };

    // Handle video errors - log but don't auto-complete
    const handleError = (e: Event) => {
      console.error('Video error:', e);
      const error = video.error;
      if (error) {
        console.error('Video error details:', {
          code: error.code,
          message: error.message,
        });
      }
      // Don't auto-complete on error - let user skip manually
    };

    // Handle video canplay - ensure video is ready
    const handleCanPlay = () => {
      console.log('Video can play');
    };

    // Handle video loadedmetadata
    const handleLoadedMetadata = () => {
      console.log('Video metadata loaded, duration:', video.duration);
    };

    // Handle video stalled - don't auto-complete
    const handleStalled = () => {
      console.warn('Video stalled - buffering');
    };

    // Add event listeners
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('stalled', handleStalled);

    // Attempt to play (start muted for better autoplay success)
    video.muted = true;
    setIsMuted(true);
    
    const playPromise = video.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('Video playback started (muted)');
          startedAt = performance.now();
          setIsPlaying(true);
          setHasPlayed(true);
          
          // Unmute after a short delay (browsers allow unmuting after user interaction/playback starts)
          setTimeout(() => {
            if (video) {
              video.muted = false;
              setIsMuted(false);
              console.log('Video unmuted');
            }
          }, 500);
        })
        .catch((error) => {
          console.warn('Video autoplay failed:', error);
          // If autoplay fails, user can click to play
        });
    }

    return () => {
      if (skipTimer) {
        clearTimeout(skipTimer);
      }
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('stalled', handleStalled);
    };
  }, [onComplete]);

  const handleSkip = () => {
    const video = videoRef.current;
    if (video) {
      video.pause();
    }
    localStorage.setItem('abyssos_intro_seen', 'true');
    onComplete();
  };

  const handleClickToPlay = async () => {
    const video = videoRef.current;
    if (video && !isPlaying) {
      try {
        await video.play();
        setIsPlaying(true);
        setHasPlayed(true);
        console.log('Video playback started via click');
      } catch (error) {
        console.error('Failed to play video on click:', error);
        // Try unmuting and playing again (some browsers require user interaction + unmute)
        video.muted = false;
        try {
          await video.play();
          setIsPlaying(true);
          setHasPlayed(true);
        } catch (err2) {
          console.error('Failed to play video even after unmuting:', err2);
        }
      }
    }
  };

  // Make entire screen clickable to start playback
  const handleScreenClick = (e: React.MouseEvent) => {
    if (!isPlaying && !hasPlayed) {
      handleClickToPlay(e);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        onClick={handleScreenClick}
        style={{ cursor: !isPlaying && !hasPlayed ? 'pointer' : 'default' }}
      >
        {/* Video Container */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: isPlaying ? 'auto' : 'none' }}
        >
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            muted={false}
            preload="auto"
            autoPlay
            onClick={handleClickToPlay}
            onError={(e) => {
              console.error('Video element error:', e);
            }}
            onLoadStart={() => {
              console.log('Video load started');
            }}
            onLoadedData={() => {
              console.log('Video data loaded');
            }}
            onCanPlay={() => {
              console.log('Video can play');
            }}
          >
            <source src="/video/intro.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Skip Button */}
        {showSkip && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-8 right-8 px-6 py-3 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm border border-white/20 transition-all z-10"
            onClick={handleSkip}
          >
            Skip Intro
          </motion.button>
        )}

        {/* Click to Play Overlay (if autoplay failed) */}
        {!isPlaying && !hasPlayed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleClickToPlay();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            style={{ 
              pointerEvents: 'auto',
              zIndex: 9999
            }}
          >
            <div className="text-center pointer-events-none">
              <motion.button
                className="text-6xl mb-4 text-white hover:text-abyss-cyan transition-colors pointer-events-auto cursor-pointer bg-transparent border-none p-0"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClickToPlay();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
              >
                ▶
              </motion.button>
              <div className="text-white text-lg">Click to play intro</div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

