/**
 * NFT Metadata Panel
 * 
 * Displays track metadata, provenance, and royalty information
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DRC369 } from '../../../../services/drc369/schema';

interface NFTMetadataPanelProps {
  track: DRC369;
}

export function NFTMetadataPanel({ track }: NFTMetadataPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-abyss-dark/60 border border-abyss-cyan/20 rounded-lg p-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left flex items-center justify-between text-sm text-gray-300 hover:text-abyss-cyan"
      >
        <span>Track Info</span>
        <span>{isExpanded ? '▼' : '▶'}</span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2 text-xs">
              {track.music && (
                <>
                  <div>
                    <span className="text-gray-400">Track:</span>{' '}
                    <span className="text-abyss-cyan">{track.music.trackName}</span>
                  </div>
                  {track.music.trackNumber && (
                    <div>
                      <span className="text-gray-400">Track #:</span>{' '}
                      <span className="text-gray-300">{track.music.trackNumber}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400">Album:</span>{' '}
                    <span className="text-gray-300">{track.music.albumName || 'Single'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Artist:</span>{' '}
                    <span className="text-abyss-cyan">{track.music.artistName}</span>
                  </div>
                  {track.music.genre && (
                    <div>
                      <span className="text-gray-400">Genre:</span>{' '}
                      <span className="text-gray-300">{track.music.genre}</span>
                    </div>
                  )}
                  {track.music.releaseDate && (
                    <div>
                      <span className="text-gray-400">Release:</span>{' '}
                      <span className="text-gray-300">{track.music.releaseDate}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400">Duration:</span>{' '}
                    <span className="text-gray-300">
                      {Math.floor(track.music.duration / 60)}:
                      {Math.floor(track.music.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-abyss-cyan/10">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Owner:</span>
                  <button
                    onClick={() => copyToClipboard(track.owner)}
                    className="text-abyss-cyan hover:text-abyss-cyan/80 text-xs"
                  >
                    {track.owner.substring(0, 8)}...{track.owner.substring(track.owner.length - 6)} 📋
                  </button>
                </div>
              </div>

              {track.royalties !== undefined && (
                <div>
                  <span className="text-gray-400">Royalties:</span>{' '}
                  <span className="text-gray-300">{track.royalties}%</span>
                </div>
              )}

              {track.provenance && track.provenance.length > 0 && (
                <div className="pt-2 border-t border-abyss-cyan/10">
                  <div className="text-gray-400 mb-1">Provenance:</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {track.provenance.map((entry, idx) => (
                      <div key={idx} className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleDateString()} - {entry.owner.substring(0, 6)}...
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {track.uri && (
                <div className="pt-2 border-t border-abyss-cyan/10">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">URI:</span>
                    <button
                      onClick={() => copyToClipboard(track.uri)}
                      className="text-abyss-cyan hover:text-abyss-cyan/80 text-xs"
                    >
                      Copy 📋
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

