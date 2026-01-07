/**
 * Explorer Tab Bar Component
 * 
 * Displays browser tabs with close buttons, favicon, title, and new tab button
 */

import { useMemo } from 'react';
import { useBrowserStore, BrowserTab } from '../../../../services/browser/browserStore';

interface TabProps {
  tab: BrowserTab;
  isActive: boolean;
  onSelect: () => void;
  onClose: (e: React.MouseEvent) => void;
}

function Tab({ tab, isActive, onSelect, onClose }: TabProps) {
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
    if (tab.favicon) {
      return <img src={tab.favicon} alt="" className="w-4 h-4" />;
    }
    // Default favicon from domain
    try {
      const domain = new URL(tab.url).hostname;
      return <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} alt="" className="w-4 h-4" />;
    } catch {
      return '🌐';
    }
  }, [tab.url, tab.favicon]);

  return (
    <div
      onClick={onSelect}
      className={`
        group flex items-center gap-2 px-3 py-1.5 min-w-[120px] max-w-[200px]
        border-r border-abyss-cyan/10 cursor-pointer transition-all
        ${isActive 
          ? 'bg-abyss-dark/80 border-b-2 border-b-abyss-cyan' 
          : 'bg-abyss-navy/30 hover:bg-abyss-dark/50'
        }
      `}
    >
      {/* Favicon */}
      <span className="flex-shrink-0 text-sm">
        {typeof displayFavicon === 'string' ? displayFavicon : displayFavicon}
      </span>
      
      {/* Title */}
      <span className={`
        flex-1 text-xs truncate
        ${isActive ? 'text-white' : 'text-gray-400'}
      `}>
        {displayTitle}
      </span>
      
      {/* Loading indicator */}
      {tab.isLoading && (
        <span className="flex-shrink-0 w-3 h-3 border-2 border-abyss-cyan/30 border-t-abyss-cyan rounded-full animate-spin" />
      )}
      
      {/* Close button */}
      <button
        onClick={onClose}
        className={`
          flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center
          text-gray-500 hover:text-white hover:bg-red-500/50
          opacity-0 group-hover:opacity-100 transition-opacity
          ${isActive ? 'opacity-100' : ''}
        `}
      >
        ×
      </button>
    </div>
  );
}

export function ExplorerTabBar() {
  const tabs = useBrowserStore(state => state.tabs);
  const activeTabId = useBrowserStore(state => state.activeTabId);
  const setActiveTab = useBrowserStore(state => state.setActiveTab);
  const closeTab = useBrowserStore(state => state.closeTab);
  const createTab = useBrowserStore(state => state.createTab);

  const handleClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  return (
    <div className="flex items-center bg-abyss-navy/50 border-b border-abyss-cyan/20">
      {/* Tabs */}
      <div className="flex-1 flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-abyss-cyan/30">
        {tabs.map(tab => (
          <Tab
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onSelect={() => setActiveTab(tab.id)}
            onClose={(e) => handleClose(e, tab.id)}
          />
        ))}
      </div>
      
      {/* New Tab Button */}
      <button
        onClick={() => createTab()}
        className="flex-shrink-0 px-3 py-1.5 text-gray-400 hover:text-abyss-cyan hover:bg-abyss-dark/50 transition-colors"
        title="New Tab"
      >
        <span className="text-lg">+</span>
      </button>
    </div>
  );
}
