/**
 * Explorer Navigation Bar
 * 
 * Back, forward, refresh, home buttons + address bar with autocomplete
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { useBrowserStore, selectActiveTab, selectRecentHistory } from '../../../../services/browser/browserStore';

// Navigation button component
interface NavButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function NavButton({ onClick, disabled, title, children }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-1.5 rounded transition-colors
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

// Icons as simple SVGs
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

interface ExplorerNavigationProps {
  onRefresh?: () => void;
}

export function ExplorerNavigation({ onRefresh }: ExplorerNavigationProps) {
  const activeTab = useBrowserStore(selectActiveTab);
  const history = useBrowserStore(state => selectRecentHistory(state, 20));
  const bookmarks = useBrowserStore(state => state.bookmarks);
  const homePage = useBrowserStore(state => state.homePage);
  const searchEngine = useBrowserStore(state => state.searchEngine);
  
  const goBack = useBrowserStore(state => state.goBack);
  const goForward = useBrowserStore(state => state.goForward);
  const navigateTab = useBrowserStore(state => state.navigateTab);
  const addBookmark = useBrowserStore(state => state.addBookmark);
  const removeBookmark = useBrowserStore(state => state.removeBookmark);
  const isBookmarked = useBrowserStore(state => state.isBookmarked);
  
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input with active tab URL
  useEffect(() => {
    if (activeTab) {
      setInputValue(activeTab.url);
    }
  }, [activeTab?.url]);

  // Generate suggestions from history and bookmarks
  const suggestions = useMemo(() => {
    if (!inputValue.trim() || inputValue.startsWith('abyss://')) return [];
    
    const query = inputValue.toLowerCase();
    const historyMatches = history
      .filter(h => h.url.toLowerCase().includes(query) || h.title.toLowerCase().includes(query))
      .map(h => ({ type: 'history' as const, url: h.url, title: h.title }));
    
    const bookmarkMatches = bookmarks
      .filter(b => b.url.toLowerCase().includes(query) || b.title.toLowerCase().includes(query))
      .map(b => ({ type: 'bookmark' as const, url: b.url, title: b.title }));
    
    // Combine and dedupe
    const seen = new Set<string>();
    return [...bookmarkMatches, ...historyMatches].filter(s => {
      if (seen.has(s.url)) return false;
      seen.add(s.url);
      return true;
    }).slice(0, 8);
  }, [inputValue, history, bookmarks]);

  const handleNavigate = (url?: string) => {
    if (!activeTab) return;
    
    const targetUrl = url || inputValue.trim();
    if (!targetUrl) return;
    
    let finalUrl = targetUrl;
    
    // Handle search queries
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

  const currentIsBookmarked = activeTab ? isBookmarked(activeTab.url) : false;
  const isSecure = activeTab?.url.startsWith('https://') || activeTab?.url.startsWith('abyss://');

  return (
    <div className="flex items-center gap-2 p-2 bg-abyss-dark/50 border-b border-abyss-cyan/20">
      {/* Navigation buttons */}
      <div className="flex items-center gap-1">
        <NavButton
          onClick={() => activeTab && goBack(activeTab.id)}
          disabled={!activeTab?.canGoBack}
          title="Back"
        >
          <BackIcon />
        </NavButton>
        
        <NavButton
          onClick={() => activeTab && goForward(activeTab.id)}
          disabled={!activeTab?.canGoForward}
          title="Forward"
        >
          <ForwardIcon />
        </NavButton>
        
        <NavButton
          onClick={() => onRefresh?.()}
          disabled={!activeTab}
          title="Refresh"
        >
          <RefreshIcon />
        </NavButton>
        
        <NavButton
          onClick={() => activeTab && navigateTab(activeTab.id, homePage)}
          disabled={!activeTab}
          title="Home"
        >
          <HomeIcon />
        </NavButton>
      </div>
      
      {/* Address bar */}
      <div className="flex-1 relative">
        <div className="flex items-center bg-abyss-navy border border-abyss-cyan/30 rounded-lg overflow-hidden focus-within:border-abyss-cyan focus-within:ring-2 focus-within:ring-abyss-cyan/30">
          {/* Security indicator */}
          <div className={`px-2 ${isSecure ? 'text-green-400' : 'text-gray-500'}`}>
            {isSecure ? <LockIcon /> : '⚠️'}
          </div>
          
          {/* URL input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
              setSelectedSuggestion(-1);
            }}
            onFocus={() => {
              setShowSuggestions(true);
              inputRef.current?.select();
            }}
            onBlur={() => {
              // Delay to allow click on suggestion
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 px-2 py-1.5 bg-transparent text-white text-sm focus:outline-none placeholder-gray-500"
            placeholder="Search or enter URL..."
          />
          
          {/* Web3 indicator */}
          {activeTab?.isWeb3 && (
            <span className="px-2 text-xs text-green-400 font-medium">Web3</span>
          )}
          
          {/* DRC-369 indicator */}
          {activeTab?.isDRC369 && (
            <span className="px-2 text-xs text-abyss-purple font-medium">DRC-369</span>
          )}
        </div>
        
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-abyss-navy border border-abyss-cyan/30 rounded-lg shadow-xl z-50 overflow-hidden">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.url}
                onClick={() => handleNavigate(suggestion.url)}
                className={`
                  px-3 py-2 flex items-center gap-2 cursor-pointer
                  ${index === selectedSuggestion 
                    ? 'bg-abyss-cyan/20' 
                    : 'hover:bg-abyss-dark/50'
                  }
                `}
              >
                <span className="text-xs">
                  {suggestion.type === 'bookmark' ? '⭐' : '🕐'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{suggestion.title}</div>
                  <div className="text-xs text-gray-500 truncate">{suggestion.url}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Bookmark button */}
      <NavButton
        onClick={handleBookmarkToggle}
        disabled={!activeTab || activeTab.url.startsWith('abyss://')}
        title={currentIsBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      >
        <BookmarkIcon filled={currentIsBookmarked} />
      </NavButton>
    </div>
  );
}
