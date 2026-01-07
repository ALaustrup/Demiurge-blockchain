/**
 * Explorer Navigation Bar - Modular Position-Aware Component
 * 
 * A unified navigation bar that combines tabs and navigation controls.
 * Can be positioned at top, bottom, left, or right of the browser window.
 * Automatically adjusts layout orientation based on position.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { useBrowserStore, selectActiveTab, selectRecentHistory, NavPosition, BrowserTab } from '../../../../services/browser/browserStore';

// ============================================================================
// Icons
// ============================================================================

const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ForwardIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const HomeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const BookmarkIcon = ({ filled }: { filled: boolean }) => (
  <svg className="w-4 h-4" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// ============================================================================
// Sub-Components
// ============================================================================

interface NavButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  compact?: boolean;
}

function NavButton({ onClick, disabled, title, children, compact }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        ${compact ? 'p-1' : 'p-1.5'} rounded transition-colors
        ${disabled 
          ? 'text-gray-600 cursor-not-allowed' 
          : 'text-gray-400 hover:text-white hover:bg-abyss-cyan/20'
        }
      `}
    >
      {children}
    </button>
  );
}

// Tab component for both horizontal and vertical layouts
interface TabItemProps {
  tab: BrowserTab;
  isActive: boolean;
  isVertical: boolean;
  compact: boolean;
  onSelect: () => void;
  onClose: (e: React.MouseEvent) => void;
}

function TabItem({ tab, isActive, isVertical, compact, onSelect, onClose }: TabItemProps) {
  const displayTitle = useMemo(() => {
    if (tab.url.startsWith('abyss://')) {
      const path = tab.url.replace('abyss://', '');
      if (path === 'home' || path === '') return 'Home';
      return path.charAt(0).toUpperCase() + path.slice(1);
    }
    return tab.title || new URL(tab.url).hostname;
  }, [tab.url, tab.title]);

  const displayFavicon = useMemo(() => {
    if (tab.url.startsWith('abyss://')) {
      return '🌊';
    }
    try {
      const domain = new URL(tab.url).hostname;
      return <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="" className="w-4 h-4" />;
    } catch {
      return '🌐';
    }
  }, [tab.url]);

  if (isVertical) {
    return (
      <div
        onClick={onSelect}
        title={displayTitle}
        className={`
          group flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-all rounded-lg mx-1
          ${isActive 
            ? 'bg-abyss-cyan/20 border-l-2 border-abyss-cyan' 
            : 'hover:bg-abyss-dark/50'
          }
          ${compact ? 'justify-center' : ''}
        `}
      >
        <span className="flex-shrink-0 text-sm">
          {typeof displayFavicon === 'string' ? displayFavicon : displayFavicon}
        </span>
        
        {!compact && (
          <>
            <span className={`flex-1 text-xs truncate ${isActive ? 'text-white' : 'text-gray-400'}`}>
              {displayTitle}
            </span>
            
            {tab.isLoading && (
              <span className="flex-shrink-0 w-3 h-3 border-2 border-abyss-cyan/30 border-t-abyss-cyan rounded-full animate-spin" />
            )}
            
            <button
              onClick={onClose}
              className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-red-500/50 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </>
        )}
      </div>
    );
  }

  // Horizontal tab
  return (
    <div
      onClick={onSelect}
      className={`
        group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-all
        border-r border-abyss-cyan/10
        ${compact ? 'min-w-[40px] justify-center' : 'min-w-[100px] max-w-[180px]'}
        ${isActive 
          ? 'bg-abyss-dark/80 border-b-2 border-b-abyss-cyan' 
          : 'bg-abyss-navy/30 hover:bg-abyss-dark/50'
        }
      `}
    >
      <span className="flex-shrink-0 text-sm">
        {typeof displayFavicon === 'string' ? displayFavicon : displayFavicon}
      </span>
      
      {!compact && (
        <>
          <span className={`flex-1 text-xs truncate ${isActive ? 'text-white' : 'text-gray-400'}`}>
            {displayTitle}
          </span>
          
          {tab.isLoading && (
            <span className="flex-shrink-0 w-3 h-3 border-2 border-abyss-cyan/30 border-t-abyss-cyan rounded-full animate-spin" />
          )}
          
          <button
            onClick={onClose}
            className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-red-500/50 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`}
          >
            ×
          </button>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

interface ExplorerNavBarProps {
  onRefresh?: () => void;
  onToggleBookmarks?: () => void;
  showBookmarks?: boolean;
}

export function ExplorerNavBar({ onRefresh, onToggleBookmarks, showBookmarks }: ExplorerNavBarProps) {
  const tabs = useBrowserStore(state => state.tabs);
  const activeTab = useBrowserStore(selectActiveTab);
  const activeTabId = useBrowserStore(state => state.activeTabId);
  const history = useBrowserStore(state => selectRecentHistory(state, 20));
  const bookmarks = useBrowserStore(state => state.bookmarks);
  const homePage = useBrowserStore(state => state.homePage);
  const searchEngine = useBrowserStore(state => state.searchEngine);
  const navPosition = useBrowserStore(state => state.navPosition);
  const compactMode = useBrowserStore(state => state.compactMode);
  
  const setActiveTab = useBrowserStore(state => state.setActiveTab);
  const closeTab = useBrowserStore(state => state.closeTab);
  const createTab = useBrowserStore(state => state.createTab);
  const goBack = useBrowserStore(state => state.goBack);
  const goForward = useBrowserStore(state => state.goForward);
  const navigateTab = useBrowserStore(state => state.navigateTab);
  const addBookmark = useBrowserStore(state => state.addBookmark);
  const removeBookmark = useBrowserStore(state => state.removeBookmark);
  const isBookmarked = useBrowserStore(state => state.isBookmarked);
  const setNavPosition = useBrowserStore(state => state.setNavPosition);
  const setCompactMode = useBrowserStore(state => state.setCompactMode);
  
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [showPositionMenu, setShowPositionMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isVertical = navPosition === 'left' || navPosition === 'right';
  const isReversed = navPosition === 'bottom' || navPosition === 'right';

  // Sync input with active tab URL
  useEffect(() => {
    if (activeTab) {
      setInputValue(activeTab.url);
    }
  }, [activeTab?.url]);

  // Generate suggestions
  const suggestions = useMemo(() => {
    if (!inputValue.trim() || inputValue.startsWith('abyss://')) return [];
    
    const query = inputValue.toLowerCase();
    const historyMatches = history
      .filter(h => h.url.toLowerCase().includes(query) || h.title.toLowerCase().includes(query))
      .map(h => ({ type: 'history' as const, url: h.url, title: h.title }));
    
    const bookmarkMatches = bookmarks
      .filter(b => b.url.toLowerCase().includes(query) || b.title.toLowerCase().includes(query))
      .map(b => ({ type: 'bookmark' as const, url: b.url, title: b.title }));
    
    const seen = new Set<string>();
    return [...bookmarkMatches, ...historyMatches].filter(s => {
      if (seen.has(s.url)) return false;
      seen.add(s.url);
      return true;
    }).slice(0, 6);
  }, [inputValue, history, bookmarks]);

  const handleNavigate = (url?: string) => {
    if (!activeTab) return;
    
    const targetUrl = url || inputValue.trim();
    if (!targetUrl) return;
    
    let finalUrl = targetUrl;
    
    if (!targetUrl.includes('.') && !targetUrl.startsWith('abyss://') && !targetUrl.startsWith('http')) {
      const searchUrls = {
        duckduckgo: 'https://duckduckgo.com/?q=',
        google: 'https://www.google.com/search?q=',
        brave: 'https://search.brave.com/search?q=',
      };
      finalUrl = searchUrls[searchEngine] + encodeURIComponent(targetUrl);
    } else if (!targetUrl.startsWith('http') && !targetUrl.startsWith('abyss://')) {
      finalUrl = `https://${targetUrl}`;
    }
    
    navigateTab(activeTab.id, finalUrl);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
        handleNavigate(suggestions[selectedSuggestion].url);
      } else {
        handleNavigate();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestion(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
    }
  };

  const handleBookmarkToggle = () => {
    if (!activeTab || activeTab.url.startsWith('abyss://')) return;
    
    const existing = bookmarks.find(b => b.url === activeTab.url);
    if (existing) {
      removeBookmark(existing.id);
    } else {
      addBookmark({
        url: activeTab.url,
        title: activeTab.title || activeTab.url,
        folder: 'favorites',
      });
    }
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  const currentIsBookmarked = activeTab ? isBookmarked(activeTab.url) : false;
  const isSecure = activeTab?.url.startsWith('https://') || activeTab?.url.startsWith('abyss://');

  // Position menu
  const PositionMenu = () => (
    <div className="absolute z-50 bg-abyss-navy border border-abyss-cyan/30 rounded-lg shadow-xl p-2 min-w-[140px]">
      <div className="text-xs text-gray-500 px-2 pb-1 mb-1 border-b border-abyss-cyan/20">Position</div>
      {(['top', 'bottom', 'left', 'right'] as NavPosition[]).map(pos => (
        <button
          key={pos}
          onClick={() => { setNavPosition(pos); setShowPositionMenu(false); }}
          className={`w-full text-left px-2 py-1 text-sm rounded ${navPosition === pos ? 'bg-abyss-cyan/20 text-abyss-cyan' : 'text-gray-300 hover:bg-abyss-dark/50'}`}
        >
          {pos.charAt(0).toUpperCase() + pos.slice(1)}
        </button>
      ))}
      <div className="border-t border-abyss-cyan/20 mt-1 pt-1">
        <button
          onClick={() => { setCompactMode(!compactMode); setShowPositionMenu(false); }}
          className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-abyss-dark/50 rounded flex items-center gap-2"
        >
          <span className={`w-3 h-3 rounded border ${compactMode ? 'bg-abyss-cyan border-abyss-cyan' : 'border-gray-500'}`} />
          Compact Mode
        </button>
      </div>
    </div>
  );

  // Vertical layout (left/right sidebar)
  if (isVertical) {
    return (
      <div className={`
        flex flex-col bg-abyss-navy/80 border-abyss-cyan/20
        ${navPosition === 'left' ? 'border-r' : 'border-l'}
        ${compactMode ? 'w-12' : 'w-56'}
      `}>
        {/* Navigation controls */}
        <div className={`p-2 border-b border-abyss-cyan/20 ${compactMode ? 'flex flex-col items-center gap-1' : 'flex flex-wrap gap-1'}`}>
          <NavButton onClick={() => activeTab && goBack(activeTab.id)} disabled={!activeTab?.canGoBack} title="Back" compact={compactMode}>
            <BackIcon />
          </NavButton>
          <NavButton onClick={() => activeTab && goForward(activeTab.id)} disabled={!activeTab?.canGoForward} title="Forward" compact={compactMode}>
            <ForwardIcon />
          </NavButton>
          <NavButton onClick={() => onRefresh?.()} disabled={!activeTab} title="Refresh" compact={compactMode}>
            <RefreshIcon />
          </NavButton>
          <NavButton onClick={() => activeTab && navigateTab(activeTab.id, homePage)} disabled={!activeTab} title="Home" compact={compactMode}>
            <HomeIcon />
          </NavButton>
        </div>
        
        {/* Address bar (only in non-compact) */}
        {!compactMode && (
          <div className="p-2 border-b border-abyss-cyan/20">
            <div className="relative">
              <div className="flex items-center bg-abyss-dark border border-abyss-cyan/30 rounded-lg overflow-hidden focus-within:border-abyss-cyan">
                <div className={`px-2 ${isSecure ? 'text-green-400' : 'text-gray-500'}`}>
                  {isSecure ? <LockIcon /> : '⚠️'}
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); setSelectedSuggestion(-1); }}
                  onFocus={() => { setShowSuggestions(true); inputRef.current?.select(); }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 px-2 py-1 bg-transparent text-white text-xs focus:outline-none"
                  placeholder="URL..."
                />
              </div>
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-abyss-navy border border-abyss-cyan/30 rounded-lg shadow-xl z-50 overflow-hidden">
                  {suggestions.map((s, i) => (
                    <div
                      key={s.url}
                      onClick={() => handleNavigate(s.url)}
                      className={`px-2 py-1.5 text-xs cursor-pointer truncate ${i === selectedSuggestion ? 'bg-abyss-cyan/20 text-white' : 'text-gray-400 hover:bg-abyss-dark/50'}`}
                    >
                      {s.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="flex-1 overflow-y-auto py-1">
          {tabs.map(tab => (
            <TabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              isVertical={true}
              compact={compactMode}
              onSelect={() => setActiveTab(tab.id)}
              onClose={(e) => handleCloseTab(e, tab.id)}
            />
          ))}
          
          {/* New tab button */}
          <button
            onClick={() => createTab()}
            className={`w-full flex items-center gap-2 px-2 py-1.5 text-gray-500 hover:text-abyss-cyan hover:bg-abyss-dark/50 transition-colors ${compactMode ? 'justify-center' : ''}`}
          >
            <span>+</span>
            {!compactMode && <span className="text-xs">New Tab</span>}
          </button>
        </div>
        
        {/* Settings */}
        <div className="p-2 border-t border-abyss-cyan/20 relative">
          <div className={`flex ${compactMode ? 'justify-center' : 'gap-1'}`}>
            {!compactMode && (
              <NavButton onClick={() => onToggleBookmarks?.()} title="Bookmarks" compact={compactMode}>
                <BookmarkIcon filled={showBookmarks || false} />
              </NavButton>
            )}
            <NavButton onClick={() => setShowPositionMenu(!showPositionMenu)} title="Settings" compact={compactMode}>
              <SettingsIcon />
            </NavButton>
          </div>
          {showPositionMenu && (
            <div className={`absolute ${navPosition === 'left' ? 'left-full ml-1' : 'right-full mr-1'} bottom-0`}>
              <PositionMenu />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Horizontal layout (top/bottom)
  return (
    <div className={`
      flex flex-col bg-abyss-navy/50 border-abyss-cyan/20
      ${navPosition === 'top' ? 'border-b' : 'border-t'}
      ${isReversed ? 'flex-col-reverse' : ''}
    `}>
      {/* Tab bar */}
      <div className="flex items-center bg-abyss-dark/30">
        <div className="flex-1 flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-abyss-cyan/30">
          {tabs.map(tab => (
            <TabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              isVertical={false}
              compact={compactMode}
              onSelect={() => setActiveTab(tab.id)}
              onClose={(e) => handleCloseTab(e, tab.id)}
            />
          ))}
        </div>
        
        <button
          onClick={() => createTab()}
          className="flex-shrink-0 px-3 py-1.5 text-gray-400 hover:text-abyss-cyan hover:bg-abyss-dark/50 transition-colors"
          title="New Tab"
        >
          +
        </button>
      </div>
      
      {/* Navigation bar */}
      <div className="flex items-center gap-2 p-2">
        {/* Nav buttons */}
        <div className="flex items-center gap-1">
          <NavButton onClick={() => activeTab && goBack(activeTab.id)} disabled={!activeTab?.canGoBack} title="Back" compact={compactMode}>
            <BackIcon />
          </NavButton>
          <NavButton onClick={() => activeTab && goForward(activeTab.id)} disabled={!activeTab?.canGoForward} title="Forward" compact={compactMode}>
            <ForwardIcon />
          </NavButton>
          <NavButton onClick={() => onRefresh?.()} disabled={!activeTab} title="Refresh" compact={compactMode}>
            <RefreshIcon />
          </NavButton>
          <NavButton onClick={() => activeTab && navigateTab(activeTab.id, homePage)} disabled={!activeTab} title="Home" compact={compactMode}>
            <HomeIcon />
          </NavButton>
        </div>
        
        {/* Address bar */}
        <div className="flex-1 relative">
          <div className="flex items-center bg-abyss-navy border border-abyss-cyan/30 rounded-lg overflow-hidden focus-within:border-abyss-cyan focus-within:ring-2 focus-within:ring-abyss-cyan/30">
            <div className={`px-2 ${isSecure ? 'text-green-400' : 'text-gray-500'}`}>
              {isSecure ? <LockIcon /> : '⚠️'}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); setSelectedSuggestion(-1); }}
              onFocus={() => { setShowSuggestions(true); inputRef.current?.select(); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-2 py-1.5 bg-transparent text-white text-sm focus:outline-none placeholder-gray-500"
              placeholder="Search or enter URL..."
            />
            {activeTab?.isWeb3 && <span className="px-2 text-xs text-green-400 font-medium">Web3</span>}
            {activeTab?.isDRC369 && <span className="px-2 text-xs text-abyss-purple font-medium">DRC-369</span>}
          </div>
          
          {showSuggestions && suggestions.length > 0 && (
            <div className={`absolute ${navPosition === 'bottom' ? 'bottom-full mb-1' : 'top-full mt-1'} left-0 right-0 bg-abyss-navy border border-abyss-cyan/30 rounded-lg shadow-xl z-50 overflow-hidden`}>
              {suggestions.map((s, i) => (
                <div
                  key={s.url}
                  onClick={() => handleNavigate(s.url)}
                  className={`px-3 py-2 flex items-center gap-2 cursor-pointer ${i === selectedSuggestion ? 'bg-abyss-cyan/20' : 'hover:bg-abyss-dark/50'}`}
                >
                  <span className="text-xs">{s.type === 'bookmark' ? '⭐' : '🕐'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{s.title}</div>
                    <div className="text-xs text-gray-500 truncate">{s.url}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-1 relative">
          <NavButton onClick={handleBookmarkToggle} disabled={!activeTab || activeTab.url.startsWith('abyss://')} title={currentIsBookmarked ? 'Remove bookmark' : 'Add bookmark'}>
            <BookmarkIcon filled={currentIsBookmarked} />
          </NavButton>
          <NavButton onClick={() => onToggleBookmarks?.()} title="Bookmarks Panel">
            📚
          </NavButton>
          <NavButton onClick={() => setShowPositionMenu(!showPositionMenu)} title="Settings">
            <SettingsIcon />
          </NavButton>
          
          {showPositionMenu && (
            <div className={`absolute ${navPosition === 'bottom' ? 'bottom-full mb-1' : 'top-full mt-1'} right-0`}>
              <PositionMenu />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
