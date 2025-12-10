/**
 * Intro Video Component
 * 
 * Plays a full-screen intro video automatically on landing.
 * Place your .mp4 file at: apps/abyssos-portal/public/video/intro.mp4.mp4
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

  // Auto-play video on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Show skip button after 2 seconds
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 2000);

    // Attempt to play
    const playPromise = video.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setHasPlayed(true);
        })
        .catch((error) => {
          console.warn('Video autoplay failed:', error);
          // If autoplay fails, user can click to play
        });
    }

    // Handle video end
    const handleEnded = () => {
      localStorage.setItem('abyssos_intro_seen', 'true');
      onComplete();
    };

    video.addEventListener('ended', handleEnded);

    return () => {
      clearTimeout(skipTimer);
      video.removeEventListener('ended', handleEnded);
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

  const handleClickToPlay = () => {
    const video = videoRef.current;
    if (video && !isPlaying) {
      video.play().then(() => {
        setIsPlaying(true);
        setHasPlayed(true);
      });
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
        {/* Video Container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            muted={false}
            preload="auto"
            onClick={handleClickToPlay}
          >
            <source src="/video/intro.mp4.mp4" type="video/mp4" />
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
            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20"
            onClick={handleClickToPlay}
          >
            <div className="text-center">
              <div className="text-4xl mb-4">▶</div>
              <div className="text-white text-lg">Click to play intro</div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

