/**
 * NEON Radio App
 * 
 * Internet radio client for QOR Radio with live playback
 */

import { useState, useEffect, useRef } from 'react';
import { WindowFrame } from '../WindowFrame';
import { RadioClient } from './neonRadio/RadioClient';
import type { DRC369 } from '../../../services/drc369/schema';
import type { RadioBlock } from '../../../services/qorid/radioTypes';

interface NeonRadioAppProps {
  initialGenre?: string;
}

const GENRES = [
  { id: 'all', label: 'All Genres' },
  { id: 'electronic', label: 'Electronic' },
  { id: 'rock', label: 'Rock' },
  { id: 'hip-hop', label: 'Hip-Hop' },
  { id: 'ambient', label: 'Ambient' },
  { id: 'jazz', label: 'Jazz' },
  { id: 'classical', label: 'Classical' },
];

export function NeonRadioApp({ initialGenre = 'all' }: NeonRadioAppProps) {
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBlock, setCurrentBlock] = useState<RadioBlock | null>(null);
  const [currentTrack, setCurrentTrack] = useState<DRC369 | null>(null);
  const [bufferStatus, setBufferStatus] = useState<'idle' | 'buffering' | 'ready'>('idle');
  const [queueLength, setQueueLength] = useState(0);
  
  const radioClientRef = useRef<RadioClient | null>(null);

  useEffect(() => {
    const client = new RadioClient(selectedGenre);
    radioClientRef.current = client;
    
    client.onBlock((block) => {
      setCurrentBlock(block);
      loadTrackMetadata(block.trackId);
    });
    
    client.onBufferStatus((status) => {
      setBufferStatus(status);
    });
    
    if (isPlaying) {
      client.start();
    }
    
    // Fetch queue length
    updateQueueLength();
    
    return () => {
      client.stop();
    };
  }, [selectedGenre, isPlaying]);

  const loadTrackMetadata = async (trackId: string) => {
    try {
      const { drc369Api } = await import('../../../services/qorid/drc369');
      const assets = await drc369Api.getPublic({});
      const track = assets.find(a => a.id === trackId);
      if (track) {
        setCurrentTrack(track);
      }
    } catch (error) {
      console.error('Failed to load track metadata:', error);
    }
  };

  const updateQueueLength = async () => {
    try {
      const response = await fetch(`https://id.demiurge.cloud/api/radio/queue?genre=${selectedGenre}`);
      const data = await response.json();
      setQueueLength(data.length || 0);
    } catch (error) {
      console.error('Failed to fetch queue length:', error);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (radioClientRef.current) {
      if (!isPlaying) {
        radioClientRef.current.start();
      } else {
        radioClientRef.current.stop();
      }
    }
  };

  const handleQueueTrack = async () => {
    if (!currentTrack) return;
    
    try {
      const response = await fetch('https://id.demiurge.cloud/api/radio/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: currentTrack.id,
          genreId: selectedGenre,
        }),
      });
      
      if (response.ok) {
        await updateQueueLength();
        alert('Track queued successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to queue: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to queue track:', error);
      alert('Failed to queue track');
    }
  };

  return (
    <WindowFrame
      id="neonRadio"
      title="QOR Radio"
      width={600}
      height={500}
    >
      <div className="w-full h-full bg-genesis-glass-light/90 backdrop-blur-sm flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-genesis-border-default/30">
          <h2 className="text-xl font-bold text-genesis-cipher-cyan mb-3">QOR Radio</h2>
          
          {/* Genre Selector */}
          <div className="flex flex-wrap gap-2 mb-3">
            {GENRES.map((genre) => (
              <button
                key={genre.id}
                onClick={() => setSelectedGenre(genre.id)}
                className={`px-3 py-1 rounded text-sm ${
                  selectedGenre === genre.id
                    ? 'bg-abyss-cyan text-black'
                    : 'bg-genesis-glass-light text-genesis-text-secondary hover:bg-abyss-cyan/20'
                }`}
              >
                {genre.label}
              </button>
            ))}
          </div>
          
          {/* Queue Info */}
          <div className="text-xs text-genesis-text-tertiary">
            Queue: {queueLength} tracks
          </div>
        </div>

        {/* Now Playing */}
        <div className="flex-1 p-4 flex flex-col items-center justify-center">
          {bufferStatus === 'buffering' && (
            <div className="text-genesis-cipher-cyan mb-4 animate-pulse">Buffering...</div>
          )}
          
          {currentTrack && (
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-genesis-cipher-cyan mb-2">
                {currentTrack.music?.trackName || currentTrack.name || 'Unknown Track'}
              </h3>
              <p className="text-genesis-text-secondary mb-1">
                {currentTrack.music?.artistName || 'Unknown Artist'}
              </p>
              {currentTrack.music?.albumName && (
                <p className="text-sm text-genesis-text-tertiary">
                  {currentTrack.music.albumName}
                </p>
              )}
            </div>
          )}
          
          {!currentTrack && !isPlaying && (
            <div className="text-center text-genesis-text-tertiary">
              <p>Select a genre and press Play to start listening</p>
            </div>
          )}
          
          {/* Playback Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlayPause}
              className={`px-6 py-3 rounded font-bold text-xl ${
                isPlaying
                  ? 'bg-red-500 text-white'
                  : 'bg-abyss-cyan text-black'
              }`}
            >
              {isPlaying ? '⏸ Stop' : '▶ Play'}
            </button>
            
            {currentTrack && (
              <button
                onClick={handleQueueTrack}
                className="px-4 py-2 rounded bg-genesis-glass-light text-genesis-cipher-cyan border border-genesis-border-default/30 hover:bg-abyss-cyan/10"
              >
                Queue This Track
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-genesis-border-default/30 text-xs text-genesis-text-tertiary">
          <div className="flex justify-between">
            <span>Status: {isPlaying ? 'Live' : 'Stopped'}</span>
            {currentBlock && (
              <span>Block: {currentBlock.blockId.substring(0, 12)}...</span>
            )}
          </div>
        </div>
      </div>
    </WindowFrame>
  );
}

