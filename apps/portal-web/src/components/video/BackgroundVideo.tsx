"use client";

import { useEffect, useRef, useState } from "react";

interface BackgroundVideoProps {
  className?: string;
  overlay?: boolean;
}

export function BackgroundVideo({ className = "", overlay = true }: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsLoaded(true);
      // Try to play, but don't block if it fails
      video.play().catch((error) => {
        console.log('[BackgroundVideo] Autoplay prevented:', error);
        // This is fine - browser policy, not an error
      });
    };

    const handleError = (e: Event) => {
      console.error('[BackgroundVideo] Video error:', e);
      setHasError(true);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, []);

  if (hasError) {
    // Fallback to gradient if video fails
    return (
      <div className={`absolute inset-0 bg-gradient-to-br from-genesis-void-black via-genesis-glass-dark to-genesis-void-black ${className}`} />
    );
  }

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src="/video/intro.mp4" type="video/mp4" />
      </video>

      {/* Overlay for better text readability */}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      )}
    </div>
  );
}
