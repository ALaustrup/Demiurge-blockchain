/**
 * Explorer Bookmarks Panel
 * 
 * Sidebar panel showing bookmarks organized by folder
 */

import { useState } from 'react';
import { useBrowserStore, selectActiveTab } from '../../../../services/browser/browserStore';

interface ExplorerBookmarksProps {
  onNavigate: (url: string) => void;
  onClose: () => void;
}

export function ExplorerBookmarks({ onNavigate, onClose }: ExplorerBookmarksProps) {
  const bookmarks = useBrowserStore(state => state.bookmarks);
  const folders = useBrowserStore(state => state.bookmarkFolders);
  const removeBookmark = useBrowserStore(state => state.removeBookmark);
  const addBookmarkFolder = useBrowserStore(state => state.addBookmarkFolder);
  const activeTab = useBrowserStore(selectActiveTab);
  
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['favorites']));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const getBookmarksInFolder = (folderId?: string) => {
    return bookmarks.filter(b => b.folder === folderId);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addBookmarkFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  return (
    <div className="w-64 h-full bg-abyss-navy/80 border-r border-abyss-cyan/20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-abyss-cyan/20">
        <h3 className="text-sm font-medium text-white">Bookmarks</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1"
        >
          ×
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Unsorted bookmarks */}
        {getBookmarksInFolder(undefined).map(bookmark => (
          <BookmarkItem
            key={bookmark.id}
            bookmark={bookmark}
            favicon={getFavicon(bookmark.url)}
            isActive={activeTab?.url === bookmark.url}
            onNavigate={onNavigate}
            onRemove={removeBookmark}
          />
        ))}
        
        {/* Folders */}
        {folders.map(folder => (
          <div key={folder.id} className="space-y-1">
            {/* Folder header */}
            <button
              onClick={() => toggleFolder(folder.id)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-abyss-dark/50 rounded transition-colors"
            >
              <span className="text-xs">
                {expandedFolders.has(folder.id) ? '📂' : '📁'}
              </span>
              <span className="flex-1 text-left truncate">{folder.name}</span>
              <span className="text-xs text-gray-500">
                {getBookmarksInFolder(folder.id).length}
              </span>
            </button>
            
            {/* Folder contents */}
            {expandedFolders.has(folder.id) && (
              <div className="pl-4 space-y-1">
                {getBookmarksInFolder(folder.id).map(bookmark => (
                  <BookmarkItem
                    key={bookmark.id}
                    bookmark={bookmark}
                    favicon={getFavicon(bookmark.url)}
                    isActive={activeTab?.url === bookmark.url}
                    onNavigate={onNavigate}
                    onRemove={removeBookmark}
                  />
                ))}
                {getBookmarksInFolder(folder.id).length === 0 && (
                  <div className="px-2 py-1 text-xs text-gray-500 italic">
                    No bookmarks
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        
        {/* New folder input */}
        {showNewFolder ? (
          <div className="flex items-center gap-1 p-1">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              placeholder="Folder name..."
              className="flex-1 px-2 py-1 text-xs bg-abyss-dark border border-abyss-cyan/30 rounded text-white"
              autoFocus
            />
            <button
              onClick={handleCreateFolder}
              className="px-2 py-1 text-xs text-abyss-cyan hover:bg-abyss-cyan/20 rounded"
            >
              Add
            </button>
            <button
              onClick={() => setShowNewFolder(false)}
              className="px-2 py-1 text-xs text-gray-400 hover:bg-abyss-dark/50 rounded"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewFolder(true)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-500 hover:text-gray-300 hover:bg-abyss-dark/50 rounded transition-colors"
          >
            <span>+</span>
            <span>New Folder</span>
          </button>
        )}
      </div>
      
      {/* Footer with stats */}
      <div className="p-2 border-t border-abyss-cyan/20 text-xs text-gray-500">
        {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''} in {folders.length} folder{folders.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

// Individual bookmark item
interface BookmarkItemProps {
  bookmark: { id: string; url: string; title: string };
  favicon: string | null;
  isActive: boolean;
  onNavigate: (url: string) => void;
  onRemove: (id: string) => void;
}

function BookmarkItem({ bookmark, favicon, isActive, onNavigate, onRemove }: BookmarkItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`
        group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors
        ${isActive ? 'bg-abyss-cyan/20 text-white' : 'text-gray-400 hover:bg-abyss-dark/50 hover:text-white'}
      `}
      onClick={() => onNavigate(bookmark.url)}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowMenu(true);
      }}
    >
      {/* Favicon */}
      {favicon ? (
        <img src={favicon} alt="" className="w-4 h-4 flex-shrink-0" />
      ) : (
        <span className="text-xs">🔗</span>
      )}
      
      {/* Title */}
      <span className="flex-1 text-xs truncate">{bookmark.title}</span>
      
      {/* Remove button (on hover) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(bookmark.id);
        }}
        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity"
      >
        ×
      </button>
    </div>
  );
}
