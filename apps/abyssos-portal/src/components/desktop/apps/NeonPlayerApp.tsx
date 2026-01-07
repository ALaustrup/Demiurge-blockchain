/**
 * NEON Player App
 * 
 * Full-featured music player for Fractal-1 audio with NEON-reactive effects
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeonVisualizer, NFTMetadataPanel, NeonDesktopReactivity, createMediaItemFromFile, useNeonStore } from './neonPlayer';
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
  const [activeMode, setActiveMode] = useState<'video' | 'music' | 'image'>('music');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [eqPreset, setEqPreset] = useState<'flat' | 'warm' | 'bright' | 'vocal'>('flat');
  const [spatialAudio, setSpatialAudio] = useState(false);
  const [crossfade, setCrossfade] = useState(false);
  const [slideshowInterval, setSlideshowInterval] = useState(5);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number>();
  const [isVideo, setIsVideo] = useState(false);
  
  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const { addToLibrary, playItem } = useNeonStore();
  
  // Prevent browser default drag/drop behavior globally
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
    // Prevent browser from opening files dropped anywhere on the window
    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('drop', preventDefaults);
    
    return () => {
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('drop', preventDefaults);
    };
  }, []);
  
  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      // Process the first valid media file
      for (const file of files) {
        const mediaItem = createMediaItemFromFile(file);
        if (mediaItem) {
          // Add to new library
          addToLibrary(mediaItem);
          
          // Create a DRC369-compatible track object for existing player
          const trackForPlayer: DRC369 = {
            id: mediaItem.id,
            name: mediaItem.name,
            uri: mediaItem.uri,
            owner: 'local',
            contentType: file.type,
            attributes: {
              mimeType: file.type,
            },
            music: mediaItem.type === 'audio' ? {
              trackName: mediaItem.name,
              artistName: mediaItem.metadata.artist || 'Unknown Artist',
              albumName: mediaItem.metadata.album || 'Unknown Album',
              duration: mediaItem.duration || 0,
            } : undefined,
          };
          
          // Set track in music player store
          setTrack(trackForPlayer);
          setPlaying(true);
          
          // Auto-detect mode based on media type
          if (mediaItem.type === 'video') {
            setActiveMode('video');
            setIsVideo(true);
          } else if (mediaItem.type === 'image') {
            setActiveMode('image');
            setIsVideo(false);
          } else {
            setActiveMode('music');
            setIsVideo(false);
          }
          
          break; // Only handle first file for now
        }
      }
    }
  }, [addToLibrary, setTrack, setPlaying]);
  
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
      setActiveMode(isVideoFile ? 'video' : 'music');
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
        if (isVideo && videoRef.current) {
          setCurrentTime(videoRef.current.currentTime);
        } else if (!isVideo && audioRef.current) {
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
  }, [isPlaying, isVideo, setCurrentTime]);

  // Apply playback speed to media elements
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, isVideo]);

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
    <div 
      className="w-full h-full bg-abyss-dark/90 backdrop-blur-sm flex flex-col relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag and Drop Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-abyss-dark/90 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-abyss-cyan rounded-lg"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <div className="text-8xl mb-6">🎵</div>
              <h2 className="text-3xl font-bold text-abyss-cyan mb-2">Drop Media Here</h2>
              <p className="text-gray-400 text-lg">
                Audio, Video, or Images
              </p>
              <div className="mt-4 flex gap-4 justify-center text-sm text-gray-500">
                <span>🎧 MP3, FLAC, WAV</span>
                <span>🎬 MP4, WebM, MKV</span>
                <span>🖼️ JPG, PNG, GIF</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="px-4 py-3 border-b border-abyss-cyan/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(['music', 'video', 'image'] as Array<'music' | 'video' | 'image'>).map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`px-3 py-1 rounded text-sm ${
                activeMode === mode ? 'bg-abyss-cyan text-black font-semibold' : 'bg-abyss-dark text-gray-300 border border-abyss-cyan/30'
              }`}
            >
              {mode === 'music' && 'Music'}
              {mode === 'video' && 'Video'}
              {mode === 'image' && 'Images'}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-400">
          Modes auto-detect media type; manual switching lets you prep playlists/slideshows.
        </div>
      </div>

      {/* Visualizer / Video / Image */}
      <div className="flex-1 relative overflow-hidden">
        {activeMode === 'image' ? (
          <div className="h-full w-full flex items-center justify-center text-gray-400 bg-abyss-dark/60 border-b border-abyss-cyan/20">
            Image slideshow mode — drop media to begin. Interval {slideshowInterval}s.
          </div>
        ) : isVideo && currentTrack?.uri ? (
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
        {!isVideo && activeMode !== 'image' && (
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

      {/* Controls + Settings */}
      <div className="bg-abyss-dark/80 border-t border-abyss-cyan/30 p-4 space-y-4">
        {/* Scrubber */}
        <div>
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
        <div className="flex items-center justify-center gap-4">
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

        {/* Settings grid */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-abyss-dark/60 border border-abyss-cyan/20 rounded-lg p-3 space-y-2">
            <div className="font-semibold text-abyss-cyan">Playback</div>
            <label className="flex items-center justify-between text-gray-300">
              Speed
              <select
                className="bg-abyss-dark border border-abyss-cyan/30 rounded px-2 py-1 text-xs"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              >
                <option value={0.75}>0.75x</option>
                <option value={1}>1.0x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2.0x</option>
              </select>
            </label>
            <label className="flex items-center justify-between text-gray-300">
              Crossfade
              <input type="checkbox" checked={crossfade} onChange={(e) => setCrossfade(e.target.checked)} />
            </label>
            <label className="flex items-center justify-between text-gray-300">
              Spatial audio
              <input type="checkbox" checked={spatialAudio} onChange={(e) => setSpatialAudio(e.target.checked)} />
            </label>
          </div>

          <div className="bg-abyss-dark/60 border border-abyss-cyan/20 rounded-lg p-3 space-y-2">
            <div className="font-semibold text-abyss-cyan">Sound shaping</div>
            <label className="text-gray-300 flex items-center justify-between">
              EQ preset
              <select
                className="bg-abyss-dark border border-abyss-cyan/30 rounded px-2 py-1 text-xs"
                value={eqPreset}
                onChange={(e) => setEqPreset(e.target.value as typeof eqPreset)}
              >
                <option value="flat">Flat</option>
                <option value="warm">Warm</option>
                <option value="bright">Bright</option>
                <option value="vocal">Vocal</option>
              </select>
            </label>
            <div className="text-xs text-gray-500">Custom EQ bands coming; presets are UI-only today.</div>
          </div>

          <div className="bg-abyss-dark/60 border border-abyss-cyan/20 rounded-lg p-3 space-y-2">
            <div className="font-semibold text-abyss-cyan">Library / Slideshow</div>
            <label className="flex items-center justify-between text-gray-300">
              Slideshow interval (s)
              <input
                type="number"
                min={2}
                max={60}
                value={slideshowInterval}
                onChange={(e) => setSlideshowInterval(Number(e.target.value))}
                className="w-16 bg-abyss-dark border border-abyss-cyan/30 rounded px-2 py-1 text-xs"
              />
            </label>
            <div className="text-xs text-gray-500">
              Image mode rotates through selected media. Playlists for video/audio coming next.
            </div>
          </div>
        </div>

        {/* Metadata Panel */}
        {currentTrack && (
          <div className="mt-2">
            <NFTMetadataPanel track={currentTrack} />
          </div>
        )}
      </div>

      {/* Desktop Reactivity */}
      {isPlaying && <NeonDesktopReactivity beatmap={beatmap} currentTime={currentTime} />}
    </div>
  );
}

