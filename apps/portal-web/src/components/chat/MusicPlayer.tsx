"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from "lucide-react";
import type { RoomMusicItem } from "@/lib/graphql";

interface MusicPlayerProps {
  musicQueue: RoomMusicItem[];
  roomId: string;
  isModerator: boolean;
  onPlayMusic: (musicId: string | null) => void;
  onAudioData?: (data: { frequency: number; amplitude: number }) => void;
  isWindowFocused: boolean;
  muteWhenUnfocused: boolean;
}

export function MusicPlayer({
  musicQueue,
  roomId,
  isModerator,
  onPlayMusic,
  onAudioData,
  isWindowFocused,
  muteWhenUnfocused,
}: MusicPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const currentMusic = currentIndex >= 0 ? musicQueue[currentIndex] : null;

  // Initialize audio context and analyser
  useEffect(() => {
    if (!audioRef.current) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      const source = audioContext.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
    } catch (e) {
      console.warn("Web Audio API not available:", e);
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Audio analysis loop
  useEffect(() => {
    if (!analyserRef.current || !onAudioData || !isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const analyze = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average frequency and amplitude
      let sum = 0;
      let max = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
        max = Math.max(max, dataArray[i]);
      }
      
      const average = sum / bufferLength;
      const amplitude = max / 255;
      
      onAudioData({
        frequency: average / 255,
        amplitude,
      });
      
      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    animationFrameRef.current = requestAnimationFrame(analyze);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, onAudioData]);

  // Find currently playing music
  useEffect(() => {
    const playingIndex = musicQueue.findIndex((m) => m.isPlaying);
    if (playingIndex >= 0) {
      setCurrentIndex(playingIndex);
      setIsPlaying(true);
    } else {
      setCurrentIndex(-1);
      setIsPlaying(false);
    }
  }, [musicQueue]);

  // Handle play/pause
  const handlePlayPause = () => {
    if (!audioRef.current || !currentMusic) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((e) => {
        console.error("Failed to play audio:", e);
      });
      setIsPlaying(true);
    }
  };

  // Handle next/previous
  const handleNext = () => {
    if (currentIndex < musicQueue.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      onPlayMusic(musicQueue[nextIndex].id);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      onPlayMusic(musicQueue[prevIndex].id);
    }
  };

  // Handle volume
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Handle mute
  const handleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? 0 : volume;
    }
  };

  // Pause when window loses focus (if setting enabled)
  useEffect(() => {
    if (!isWindowFocused && muteWhenUnfocused && audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isWindowFocused, muteWhenUnfocused, isPlaying]);

  // Get audio source URL based on type
  const getAudioSource = (music: RoomMusicItem): string | null => {
    if (music.sourceType === "nft") {
      // NFT music - would need to fetch from chain/storage
      return null; // Placeholder
    } else if (music.sourceType === "spotify") {
      // Spotify embed URL
      return `https://open.spotify.com/embed/${music.sourceUrl}`;
    } else if (music.sourceType === "soundcloud") {
      // SoundCloud embed URL
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(music.sourceUrl)}`;
    } else if (music.sourceType === "youtube") {
      // YouTube embed URL
      const videoId = music.sourceUrl.split("v=")[1]?.split("&")[0] || music.sourceUrl.split("/").pop();
      return `https://www.youtube.com/embed/${videoId}?autoplay=0`;
    }
    return music.sourceUrl;
  };

  if (musicQueue.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {currentMusic && (
        <>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50"
              title="Previous"
            >
              <SkipBack className="h-3 w-3" />
            </button>
            <button
              onClick={handlePlayPause}
              className="rounded p-1 text-rose-400 hover:bg-zinc-800 hover:text-rose-300"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === musicQueue.length - 1}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50"
              title="Next"
            >
              <SkipForward className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleMute}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="h-1 w-16 cursor-pointer appearance-none rounded bg-zinc-700"
              title="Volume"
            />
          </div>
          <div className="max-w-[120px] truncate text-xs text-zinc-400" title={currentMusic.title || `Track ${currentIndex + 1}`}>
            {currentMusic.title || `Track ${currentIndex + 1}`}
          </div>

          {/* Audio element (hidden) */}
          {currentMusic.sourceType !== "spotify" && 
           currentMusic.sourceType !== "soundcloud" && 
           currentMusic.sourceType !== "youtube" && (
            <audio
              ref={audioRef}
              src={getAudioSource(currentMusic) || undefined}
              onEnded={handleNext}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          )}

          {/* Embed for Spotify/SoundCloud/YouTube - hidden in compact mode */}
          {(currentMusic.sourceType === "spotify" || 
            currentMusic.sourceType === "soundcloud" || 
            currentMusic.sourceType === "youtube") && (
            <div className="hidden">
              <iframe
                src={getAudioSource(currentMusic) || undefined}
                width="100%"
                height="80"
                frameBorder="0"
                allow="autoplay"
                className="rounded"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

