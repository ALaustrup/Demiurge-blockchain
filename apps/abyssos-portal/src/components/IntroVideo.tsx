/**
 * Intro Video Component
 * 
 * Plays a full-screen intro video automatically on landing.
 * Video playback is "best effort" - if it fails, user can always skip.
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
  const [videoFailed, setVideoFailed] = useState(false);
  const hasCompletedRef = useRef(false);

  // Skip intro - ALWAYS works, independent of video state
  const skipIntro = () => {
    console.log('[IntroVideo] skipIntro called');
    if (hasCompletedRef.current) {
      console.log('[IntroVideo] Already completed, ignoring skip');
      return;
    }
    hasCompletedRef.current = true;
    
    const video = videoRef.current;
    if (video) {
      video.pause();
    }
    
    localStorage.setItem('abyssos_intro_seen', 'true');
    onComplete();
  };

  // Setup video event listeners - no autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Show skip button after 1 second
    const skipButtonTimer = setTimeout(() => {
      setShowSkip(true);
    }, 1000);

    // Handle video end - complete naturally
    const handleEnded = () => {
      console.log('[IntroVideo] Video ended naturally');
      if (!hasCompletedRef.current) {
        skipIntro();
      }
    };

    // Handle video errors - just log, user can skip
    const handleError = (e: Event) => {
      console.error('[IntroVideo] Video error:', e);
      const error = video.error;
      if (error) {
        console.error('[IntroVideo] Error details:', {
          code: error.code,
          message: error.message,
        });
      }
      setVideoFailed(true);
    };

    // Add event listeners
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      if (skipButtonTimer) clearTimeout(skipButtonTimer);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, []);

  // Click to play
  const handleClickToPlay = async () => {
    console.log('[IntroVideo] handleClickToPlay called');
    const video = videoRef.current;
    if (!video || hasCompletedRef.current || isPlaying) return;

    try {
      await video.play();
      console.log('[IntroVideo] Video playback started via click');
      setIsPlaying(true);
      setHasPlayed(true);
      setVideoFailed(false);
    } catch (error) {
      console.error('[IntroVideo] Failed to play video on click:', error);
      setVideoFailed(true);
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
      >
        {/* Video Container - best effort, non-blocking */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          onClick={handleClickToPlay}
          style={{ cursor: !isPlaying && !hasPlayed ? 'pointer' : 'default' }}
        >
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            preload="metadata"
            muted
            onError={(e) => {
              console.error('[IntroVideo] Video element error:', e);
            }}
          >
            <source src="/video/intro.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Skip Button - ALWAYS accessible, highest z-index, never blocked */}
        {showSkip && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-8 right-8 px-6 py-3 bg-black/80 hover:bg-black text-white rounded-lg backdrop-blur-sm border border-white/30 transition-all z-[10000]"
            onClick={(e) => {
              e.stopPropagation();
              console.log('[IntroVideo] Skip button clicked');
              skipIntro();
            }}
            style={{ pointerEvents: 'auto' }}
          >
            Skip Intro
          </motion.button>
        )}

        {/* Click to Play Overlay - only if video hasn't played and hasn't failed */}
        {!isPlaying && !hasPlayed && !videoFailed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[9998]"
            onClick={handleClickToPlay}
            style={{ 
              pointerEvents: 'auto',
              cursor: 'pointer'
            }}
          >
            <div className="text-center pointer-events-none">
              <motion.div
                className="text-6xl mb-4 text-white"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ▶
              </motion.div>
              <div className="text-white text-lg mb-2">Click to play intro</div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

