/**
 * NEON Player App
 * 
 * Full-featured music player for Fractal-1 audio with NEON-reactive effects
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { NeonVisualizer, NFTMetadataPanel, NeonDesktopReactivity } from './neonPlayer';
import type { DRC369 } from '../../../services/drc369/schema';
import { Fractal1Codec } from '@abyssos/fractall/codec';
import type { FractalBeatmap } from '@abyssos/fractall/types';
import { useMusicPlayerStore } from '../../../state/musicPlayerStore';
import { useDesktopStore } from '../../../state/desktopStore';

interface NeonPlayerAppProps {
  assetId?: string;
}

export function NeonPlayerApp({ assetId }: NeonPlayerAppProps) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    beatmap,
    setTrack,
    setPlaying,
    setCurrentTime,
    setDuration,
    setBeatmap,
    setBackgroundMode,
  } = useMusicPlayerStore();
  const { closeWindow, openWindows } = useDesktopStore();
  
  const [playlist, setPlaylist] = useState<DRC369[]>([]);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'one' | 'all'>('off');
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [sourceNode, setSourceNode] = useState<AudioBufferSourceNode | null>(null);
  const [gainNode, setGainNode] = useState<GainNode | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number>();
  const [isVideo, setIsVideo] = useState(false);
  
  // Enable background mode when window is closed
  useEffect(() => {
    const neonPlayerWindow = openWindows.find(w => w.appId === 'neonPlayer');
    if (!neonPlayerWindow && currentTrack && isPlaying) {
      setBackgroundMode(true);
    } else if (neonPlayerWindow) {
      setBackgroundMode(false);
    }
  }, [openWindows, currentTrack, isPlaying, setBackgroundMode]);

  // Initialize audio context
  useEffect(() => {
    const ctx = new AudioContext();
    setAudioContext(ctx);
    
    return () => {
      ctx.close();
    };
  }, []);

  // Load track
  useEffect(() => {
    if (assetId) {
      loadTrack(assetId);
    }
  }, [assetId]);

  // Detect if track is video or audio
  useEffect(() => {
    if (currentTrack) {
      const contentType = currentTrack.contentType || currentTrack.attributes?.mimeType || '';
      const uri = currentTrack.uri || '';
      const isVideoFile = contentType.startsWith('video/') || 
                         /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv|m4v)$/i.test(uri);
      setIsVideo(isVideoFile);
    }
  }, [currentTrack]);

  // Playback control
  useEffect(() => {
    if (isPlaying && currentTrack) {
      if (isVideo && videoRef.current) {
        videoRef.current.play().catch(console.error);
      } else if (!isVideo && audioContext) {
        playTrack();
      }
    } else if (!isPlaying) {
      if (isVideo && videoRef.current) {
        videoRef.current.pause();
      } else if (sourceNode) {
        stopTrack();
      }
    }
  }, [isPlaying, currentTrack, isVideo]);

  // Update current time
  useEffect(() => {
    if (isPlaying) {
      const updateTime = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
        animationFrameRef.current = requestAnimationFrame(updateTime);
      };
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, setCurrentTime]);

  const loadTrack = async (id: string) => {
    try {
      // Load DRC-369 asset
      const { drc369Api } = await import('../../../services/abyssid/drc369');
      const assets = await drc369Api.getOwned({});
      const track = assets.find(a => a.id === id);
      
      if (track && track.music) {
        setTrack(track);
        setDuration(track.music.duration);
        
        // Load and decode fractal-1 audio
        if (track.uri.startsWith('fractal1://')) {
          await loadFractal1Audio(track);
        }
      }
    } catch (error) {
      console.error('Failed to load track:', error);
    }
  };

  const loadFractal1Audio = async (track: DRC369) => {
    try {
      // Fetch fractal-1 data
      const response = await fetch(track.uri.replace('fractal1://', '/api/fractal1/'));
      const fractal1Data = new Uint8Array(await response.arrayBuffer());
      
      // Decode fractal-1
      const decoded = await Fractal1Codec.decodeFractal1(fractal1Data);
      setBeatmap(decoded.beatmap);
      
      // Create audio buffer
      if (audioContext) {
        // Convert to ArrayBuffer if needed
        let buffer: ArrayBuffer;
        const sourceBuffer = decoded.audioData.buffer;
        if (sourceBuffer instanceof ArrayBuffer) {
          buffer = sourceBuffer;
        } else if (sourceBuffer instanceof SharedArrayBuffer) {
          // Convert SharedArrayBuffer to ArrayBuffer
          buffer = sourceBuffer.slice(0);
        } else {
          // Fallback: create new ArrayBuffer from Uint8Array
          const uint8 = new Uint8Array(sourceBuffer);
          buffer = uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength);
        }
        const _audioBuffer = await audioContext.decodeAudioData(buffer);
        // Store for playback
        // (In real implementation, use decoded audio buffer)
      }
    } catch (error) {
      console.error('Failed to decode fractal-1 audio:', error);
    }
  };

  const playTrack = () => {
    if (!audioContext || !currentTrack) return;
    
    // Create audio source
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    
    source.connect(gain);
    gain.connect(audioContext.destination);
    
    // Load and play audio
    // (Simplified - in real implementation, use decoded fractal-1 audio buffer)
    
    setSourceNode(source);
    setGainNode(gain);
  };

  const stopTrack = () => {
    if (sourceNode) {
      sourceNode.stop();
      setSourceNode(null);
    }
  };

  const handlePlayPause = () => {
    setPlaying(!isPlaying);
  };
  
  const handleClose = () => {
    if (currentTrack && isPlaying) {
      // Enable background mode instead of stopping
      setBackgroundMode(true);
    }
    const neonPlayerWindow = openWindows.find(w => w.appId === 'neonPlayer');
    if (neonPlayerWindow) {
      closeWindow(neonPlayerWindow.id);
    }
  };

  const handleSeek = (time: number) => {
    if (isVideo && videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    } else if (!isVideo && audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full bg-abyss-dark/90 backdrop-blur-sm flex flex-col">
        {/* Visualizer / Video Player */}
        <div className="flex-1 relative overflow-hidden">
          {isVideo && currentTrack?.uri ? (
            <video
              ref={videoRef}
              src={currentTrack.uri}
              className="w-full h-full object-contain"
              onTimeUpdate={(e) => {
                const video = e.currentTarget;
                setCurrentTime(video.currentTime);
                setDuration(video.duration || 0);
              }}
              onLoadedMetadata={(e) => {
                const video = e.currentTarget;
                setDuration(video.duration || 0);
              }}
              onEnded={() => {
                setPlaying(false);
                // TODO: Handle next track
              }}
              playsInline
              controls={false}
            />
          ) : (
            <>
              <NeonVisualizer beatmap={beatmap} isPlaying={isPlaying} currentTime={currentTime} />
              
              {/* Album Art / Metadata Overlay */}
              {currentTrack && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-abyss-cyan mb-2">
                      {currentTrack.music?.trackName || currentTrack.name}
                    </h2>
                    <p className="text-gray-300">
                      {currentTrack.music?.artistName || 'Unknown Artist'}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Hidden audio element for audio-only playback */}
          {!isVideo && (
            <audio
              ref={audioRef}
              src={currentTrack?.uri}
              onTimeUpdate={(e) => {
                const audio = e.currentTarget;
                setCurrentTime(audio.currentTime);
                setDuration(audio.duration || 0);
              }}
              onLoadedMetadata={(e) => {
                const audio = e.currentTarget;
                setDuration(audio.duration || 0);
              }}
              onEnded={() => {
                setPlaying(false);
                // TODO: Handle next track
              }}
            />
          )}
        </div>

        {/* Controls */}
        <div className="bg-abyss-dark/80 border-t border-abyss-cyan/30 p-4">
          {/* Scrubber */}
          <div className="mb-4">
            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full h-2 bg-abyss-dark rounded-lg appearance-none cursor-pointer accent-abyss-cyan"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={() => setShuffle(!shuffle)}
              className={`px-3 py-1 rounded ${shuffle ? 'bg-abyss-cyan text-black' : 'bg-abyss-dark text-gray-300'}`}
            >
              🔀
            </button>
            <button className="px-3 py-1 rounded bg-abyss-dark text-gray-300">
              ⏮
            </button>
            <button
              onClick={handlePlayPause}
              className="px-6 py-2 rounded bg-abyss-cyan text-black font-bold text-xl"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className="px-3 py-1 rounded bg-abyss-dark text-gray-300">
              ⏭
            </button>
            <button
              onClick={() => {
                if (repeat === 'off') setRepeat('all');
                else if (repeat === 'all') setRepeat('one');
                else setRepeat('off');
              }}
              className={`px-3 py-1 rounded ${repeat !== 'off' ? 'bg-abyss-cyan text-black' : 'bg-abyss-dark text-gray-300'}`}
            >
              {repeat === 'all' ? '🔁' : repeat === 'one' ? '🔂' : '↩'}
            </button>
          </div>

          {/* Metadata Panel Toggle */}
          {currentTrack && (
            <div className="mt-4">
              <NFTMetadataPanel track={currentTrack} />
            </div>
          )}
        </div>

      {/* Desktop Reactivity */}
      {isPlaying && <NeonDesktopReactivity beatmap={beatmap} currentTime={currentTime} />}
    </div>
  );
}

