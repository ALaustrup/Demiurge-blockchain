/**
 * NEON Media Library
 * 
 * Media browser with drag/drop support for all media types
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNeonStore, createMediaItemFromFile } from './useNeonStore';
import type { MediaItem, MediaType, Playlist } from './types';

// ============================================================================
// Types
// ============================================================================

type LibraryView = 'all' | 'audio' | 'video' | 'images' | 'nft' | 'playlists' | 'favorites' | 'recent';

interface FilterState {
  view: LibraryView;
  search: string;
  sortBy: 'name' | 'date' | 'type';
  sortOrder: 'asc' | 'desc';
}

// ============================================================================
// Media Card Component
// ============================================================================

interface MediaCardProps {
  item: MediaItem;
  isSelected: boolean;
  isFavorite: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onFavorite: () => void;
}

function MediaCard({ item, isSelected, isFavorite, onClick, onDoubleClick, onFavorite }: MediaCardProps) {
  const getTypeIcon = (type: MediaType) => {
    switch (type) {
      case 'audio': return '🎵';
      case 'video': return '🎬';
      case 'image': return '🖼️';
      case 'nft': return '💎';
      default: return '📄';
    }
  };
  
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`
        relative group rounded-lg overflow-hidden cursor-pointer transition-all
        ${isSelected 
          ? 'ring-2 ring-abyss-cyan bg-abyss-cyan/10' 
          : 'bg-genesis-glass-light/40 hover:bg-genesis-glass-light/60'
        }
      `}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-genesis-glass-light/60 flex items-center justify-center">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl opacity-40">{getTypeIcon(item.type)}</span>
        )}
        
        {/* Duration badge */}
        {item.duration && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white">
            {formatDuration(item.duration)}
          </div>
        )}
        
        {/* NFT badge */}
        {item.type === 'nft' && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-purple-500/80 rounded text-xs text-white font-medium">
            NFT
          </div>
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-abyss-cyan/90 flex items-center justify-center">
            <span className="text-xl">▶</span>
          </div>
        </div>
      </div>
      
      {/* Info */}
      <div className="p-3">
        <h4 className="text-sm font-medium text-white truncate">{item.name}</h4>
        <p className="text-xs text-gray-500 truncate">
          {item.metadata.artist || item.metadata.format?.toUpperCase() || item.type}
        </p>
      </div>
      
      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFavorite();
        }}
        className={`
          absolute top-2 right-2 p-1.5 rounded-full transition-all
          ${isFavorite 
            ? 'bg-red-500 text-white' 
            : 'bg-black/50 text-white/60 opacity-0 group-hover:opacity-100'
          }
        `}
      >
        {isFavorite ? '❤️' : '🤍'}
      </button>
    </motion.div>
  );
}

// ============================================================================
// Drop Zone Component
// ============================================================================

interface DropZoneProps {
  onDrop: (files: File[]) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}

function DropZone({ onDrop, isDragging, setIsDragging }: DropZoneProps) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, [setIsDragging]);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, [setIsDragging]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onDrop(files);
    }
  }, [onDrop, setIsDragging]);
  
  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        absolute inset-0 flex items-center justify-center transition-all z-50
        ${isDragging 
          ? 'bg-abyss-cyan/20 border-2 border-dashed border-genesis-border-default' 
          : 'pointer-events-none'
        }
      `}
    >
      {isDragging && (
        <div className="text-center">
          <div className="text-6xl mb-4">📁</div>
          <p className="text-xl text-genesis-cipher-cyan font-medium">Drop media files here</p>
          <p className="text-sm text-genesis-text-tertiary mt-2">
            Audio, Video, or Images
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sidebar Navigation
// ============================================================================

interface SidebarProps {
  currentView: LibraryView;
  onViewChange: (view: LibraryView) => void;
  playlists: Playlist[];
  onCreatePlaylist: () => void;
}

function Sidebar({ currentView, onViewChange, playlists, onCreatePlaylist }: SidebarProps) {
  const navItems: { id: LibraryView; label: string; icon: string }[] = [
    { id: 'all', label: 'All Media', icon: '📚' },
    { id: 'audio', label: 'Music', icon: '🎵' },
    { id: 'video', label: 'Videos', icon: '🎬' },
    { id: 'images', label: 'Images', icon: '🖼️' },
    { id: 'nft', label: 'NFTs', icon: '💎' },
    { id: 'favorites', label: 'Favorites', icon: '❤️' },
    { id: 'recent', label: 'Recently Played', icon: '🕐' },
  ];
  
  return (
    <div className="w-48 bg-genesis-glass-light/40 border-r border-genesis-border-default/20 flex flex-col">
      <div className="p-3 border-b border-genesis-border-default/20">
        <h3 className="text-sm font-medium text-genesis-text-tertiary">Library</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`
              w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
              ${currentView === item.id 
                ? 'bg-abyss-cyan/20 text-genesis-cipher-cyan' 
                : 'text-genesis-text-tertiary hover:text-white hover:bg-genesis-glass-light/50'
              }
            `}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        
        <div className="pt-3 mt-3 border-t border-genesis-border-default/20">
          <button
            onClick={() => onViewChange('playlists')}
            className={`
              w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
              ${currentView === 'playlists' 
                ? 'bg-abyss-cyan/20 text-genesis-cipher-cyan' 
                : 'text-genesis-text-tertiary hover:text-white hover:bg-genesis-glass-light/50'
              }
            `}
          >
            <span>📋</span>
            <span>Playlists</span>
          </button>
          
          {playlists.map(playlist => (
            <button
              key={playlist.id}
              onClick={() => {/* TODO: Navigate to playlist */}}
              className="w-full flex items-center gap-2 px-3 py-1.5 pl-6 text-sm text-gray-500 hover:text-white"
            >
              <span className="text-xs">•</span>
              <span className="truncate">{playlist.name}</span>
            </button>
          ))}
          
          <button
            onClick={onCreatePlaylist}
            className="w-full flex items-center gap-2 px-3 py-1.5 pl-6 text-sm text-gray-600 hover:text-genesis-cipher-cyan"
          >
            <span>+</span>
            <span>New Playlist</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function NeonMediaLibrary() {
  const {
    library,
    playback,
    addToLibrary,
    addToFavorites,
    removeFromFavorites,
    playItem,
    addToQueue,
    createPlaylist,
    isDraggingOver,
    setDraggingOver,
  } = useNeonStore();
  
  const [filter, setFilter] = useState<FilterState>({
    view: 'all',
    search: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  
  // Filter and sort items
  const filteredItems = useMemo(() => {
    let items = [...library.items];
    
    // Filter by view/type
    switch (filter.view) {
      case 'audio':
        items = items.filter(i => i.type === 'audio');
        break;
      case 'video':
        items = items.filter(i => i.type === 'video');
        break;
      case 'images':
        items = items.filter(i => i.type === 'image');
        break;
      case 'nft':
        items = items.filter(i => i.type === 'nft' || i.metadata.nftData);
        break;
      case 'favorites':
        items = items.filter(i => library.favorites.includes(i.id));
        break;
      case 'recent':
        items = library.recentlyPlayed
          .map(id => library.items.find(i => i.id === id))
          .filter((i): i is MediaItem => i !== undefined);
        break;
    }
    
    // Search
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      items = items.filter(i => 
        i.name.toLowerCase().includes(searchLower) ||
        i.metadata.artist?.toLowerCase().includes(searchLower) ||
        i.metadata.album?.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort
    items.sort((a, b) => {
      let comparison = 0;
      switch (filter.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = a.addedAt - b.addedAt;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      return filter.sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return items;
  }, [library, filter]);
  
  // Handle file drop
  const handleFileDrop = useCallback((files: File[]) => {
    files.forEach(file => {
      const item = createMediaItemFromFile(file);
      if (item) {
        addToLibrary(item);
      }
    });
  }, [addToLibrary]);
  
  // Handle item selection
  const handleItemClick = useCallback((id: string, ctrlKey: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (ctrlKey) {
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
      } else {
        next.clear();
        next.add(id);
      }
      return next;
    });
  }, []);
  
  // Handle play
  const handlePlay = useCallback((item: MediaItem) => {
    playItem(item);
  }, [playItem]);
  
  // Handle create playlist
  const handleCreatePlaylist = useCallback(() => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreatePlaylist(false);
    }
  }, [newPlaylistName, createPlaylist]);
  
  return (
    <div className="h-full flex relative">
      {/* Drag overlay */}
      <DropZone 
        onDrop={handleFileDrop}
        isDragging={isDraggingOver}
        setIsDragging={setDraggingOver}
      />
      
      {/* Sidebar */}
      <Sidebar
        currentView={filter.view}
        onViewChange={(view) => setFilter(f => ({ ...f, view }))}
        playlists={library.playlists}
        onCreatePlaylist={() => setShowCreatePlaylist(true)}
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-4 p-3 border-b border-genesis-border-default/20">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search media..."
              value={filter.search}
              onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
              className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-genesis-border-default"
            />
          </div>
          
          {/* Sort */}
          <select
            value={`${filter.sortBy}-${filter.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-') as [FilterState['sortBy'], FilterState['sortOrder']];
              setFilter(f => ({ ...f, sortBy, sortOrder }));
            }}
            className="px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded-lg text-genesis-text-secondary text-sm"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="type-asc">Type</option>
          </select>
          
          {/* Add media button */}
          <label className="px-4 py-2 bg-abyss-cyan text-abyss-dark font-medium rounded-lg cursor-pointer hover:bg-abyss-cyan/80 transition-colors">
            + Add Media
            <input
              type="file"
              multiple
              accept="audio/*,video/*,image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  handleFileDrop(Array.from(e.target.files));
                }
              }}
            />
          </label>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-lg mb-2">No media found</p>
              <p className="text-sm">
                {filter.view === 'all' 
                  ? 'Drag and drop files here or click "Add Media"'
                  : `No ${filter.view} in your library`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              <AnimatePresence>
                {filteredItems.map(item => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    isSelected={selectedIds.has(item.id)}
                    isFavorite={library.favorites.includes(item.id)}
                    onClick={() => handleItemClick(item.id, false)}
                    onDoubleClick={() => handlePlay(item)}
                    onFavorite={() => {
                      if (library.favorites.includes(item.id)) {
                        removeFromFavorites(item.id);
                      } else {
                        addToFavorites(item.id);
                      }
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
        
        {/* Stats bar */}
        <div className="px-4 py-2 border-t border-genesis-border-default/20 text-xs text-gray-500 flex items-center gap-4">
          <span>{filteredItems.length} items</span>
          {selectedIds.size > 0 && (
            <span>{selectedIds.size} selected</span>
          )}
        </div>
      </div>
      
      {/* Create playlist modal */}
      <AnimatePresence>
        {showCreatePlaylist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setShowCreatePlaylist(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-abyss-navy border border-genesis-border-default/30 rounded-lg p-6 w-80"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-medium text-white mb-4">Create Playlist</h3>
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Playlist name..."
                className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-genesis-border-default mb-4"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCreatePlaylist(false)}
                  className="px-4 py-2 text-genesis-text-tertiary hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePlaylist}
                  className="px-4 py-2 bg-abyss-cyan text-abyss-dark font-medium rounded-lg"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
