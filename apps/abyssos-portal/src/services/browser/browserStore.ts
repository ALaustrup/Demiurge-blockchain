/**
 * Browser State Store
 * 
 * Zustand store for managing browser tabs, history, and bookmarks
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  history: string[];
  historyIndex: number;
  isWeb3: boolean;
  isDRC369: boolean;
  createdAt: number;
}

export interface HistoryEntry {
  url: string;
  title: string;
  visitedAt: number;
  favicon?: string;
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  folder?: string;
  createdAt: number;
}

export interface BookmarkFolder {
  id: string;
  name: string;
  parentId?: string;
}

export type NavPosition = 'top' | 'bottom' | 'left' | 'right';

interface BrowserState {
  // Tabs
  tabs: BrowserTab[];
  activeTabId: string | null;
  
  // History
  history: HistoryEntry[];
  
  // Bookmarks
  bookmarks: Bookmark[];
  bookmarkFolders: BookmarkFolder[];
  
  // Settings
  homePage: string;
  searchEngine: 'duckduckgo' | 'google' | 'brave';
  navPosition: NavPosition;
  compactMode: boolean;
  
  // Tab actions
  createTab: (url?: string) => string;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<BrowserTab>) => void;
  navigateTab: (tabId: string, url: string) => void;
  goBack: (tabId: string) => void;
  goForward: (tabId: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  
  // History actions
  addHistoryEntry: (entry: Omit<HistoryEntry, 'visitedAt'>) => void;
  clearHistory: () => void;
  removeHistoryEntry: (url: string) => void;
  
  // Bookmark actions
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => void;
  removeBookmark: (id: string) => void;
  updateBookmark: (id: string, updates: Partial<Bookmark>) => void;
  addBookmarkFolder: (name: string, parentId?: string) => void;
  removeBookmarkFolder: (id: string) => void;
  isBookmarked: (url: string) => boolean;
  
  // Settings
  setHomePage: (url: string) => void;
  setSearchEngine: (engine: 'duckduckgo' | 'google' | 'brave') => void;
  setNavPosition: (position: NavPosition) => void;
  setCompactMode: (compact: boolean) => void;
}

// ============================================================================
// Helpers
// ============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createNewTab(url: string = 'abyss://home'): BrowserTab {
  return {
    id: generateId(),
    url,
    title: url.startsWith('abyss://') ? 'Abyss Explorer' : 'New Tab',
    isLoading: !url.startsWith('abyss://'),
    canGoBack: false,
    canGoForward: false,
    history: [url],
    historyIndex: 0,
    isWeb3: false,
    isDRC369: false,
    createdAt: Date.now(),
  };
}

// ============================================================================
// Store
// ============================================================================

export const useBrowserStore = create<BrowserState>()(
  persist(
    (set, get) => ({
      // Initial state
      tabs: [],
      activeTabId: null,
      history: [],
      bookmarks: [],
      bookmarkFolders: [
        { id: 'favorites', name: 'Favorites' },
        { id: 'web3', name: 'Web3 dApps' },
      ],
      homePage: 'abyss://home',
      searchEngine: 'duckduckgo',
      navPosition: 'top',
      compactMode: false,
      
      // Tab actions
      createTab: (url) => {
        const newTab = createNewTab(url || get().homePage);
        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
        }));
        return newTab.id;
      },
      
      closeTab: (tabId) => {
        set((state) => {
          const tabIndex = state.tabs.findIndex(t => t.id === tabId);
          if (tabIndex === -1) return state;
          
          const newTabs = state.tabs.filter(t => t.id !== tabId);
          
          // If closing active tab, select adjacent tab
          let newActiveId = state.activeTabId;
          if (state.activeTabId === tabId) {
            if (newTabs.length === 0) {
              newActiveId = null;
            } else if (tabIndex >= newTabs.length) {
              newActiveId = newTabs[newTabs.length - 1].id;
            } else {
              newActiveId = newTabs[tabIndex].id;
            }
          }
          
          return {
            tabs: newTabs,
            activeTabId: newActiveId,
          };
        });
      },
      
      setActiveTab: (tabId) => {
        set({ activeTabId: tabId });
      },
      
      updateTab: (tabId, updates) => {
        set((state) => ({
          tabs: state.tabs.map(tab =>
            tab.id === tabId ? { ...tab, ...updates } : tab
          ),
        }));
      },
      
      navigateTab: (tabId, url) => {
        set((state) => {
          const tab = state.tabs.find(t => t.id === tabId);
          if (!tab) return state;
          
          // Add to tab history
          const newHistory = [...tab.history.slice(0, tab.historyIndex + 1), url];
          const newIndex = newHistory.length - 1;
          
          return {
            tabs: state.tabs.map(t =>
              t.id === tabId
                ? {
                    ...t,
                    url,
                    isLoading: !url.startsWith('abyss://'),
                    history: newHistory,
                    historyIndex: newIndex,
                    canGoBack: newIndex > 0,
                    canGoForward: false,
                  }
                : t
            ),
          };
        });
        
        // Add to global history
        if (!url.startsWith('abyss://')) {
          get().addHistoryEntry({ url, title: url });
        }
      },
      
      goBack: (tabId) => {
        set((state) => {
          const tab = state.tabs.find(t => t.id === tabId);
          if (!tab || tab.historyIndex <= 0) return state;
          
          const newIndex = tab.historyIndex - 1;
          const newUrl = tab.history[newIndex];
          
          return {
            tabs: state.tabs.map(t =>
              t.id === tabId
                ? {
                    ...t,
                    url: newUrl,
                    historyIndex: newIndex,
                    canGoBack: newIndex > 0,
                    canGoForward: true,
                    isLoading: !newUrl.startsWith('abyss://'),
                  }
                : t
            ),
          };
        });
      },
      
      goForward: (tabId) => {
        set((state) => {
          const tab = state.tabs.find(t => t.id === tabId);
          if (!tab || tab.historyIndex >= tab.history.length - 1) return state;
          
          const newIndex = tab.historyIndex + 1;
          const newUrl = tab.history[newIndex];
          
          return {
            tabs: state.tabs.map(t =>
              t.id === tabId
                ? {
                    ...t,
                    url: newUrl,
                    historyIndex: newIndex,
                    canGoBack: true,
                    canGoForward: newIndex < t.history.length - 1,
                    isLoading: !newUrl.startsWith('abyss://'),
                  }
                : t
            ),
          };
        });
      },
      
      reorderTabs: (fromIndex, toIndex) => {
        set((state) => {
          const newTabs = [...state.tabs];
          const [removed] = newTabs.splice(fromIndex, 1);
          newTabs.splice(toIndex, 0, removed);
          return { tabs: newTabs };
        });
      },
      
      // History actions
      addHistoryEntry: (entry) => {
        set((state) => {
          // Remove duplicate if exists
          const filtered = state.history.filter(h => h.url !== entry.url);
          return {
            history: [
              { ...entry, visitedAt: Date.now() },
              ...filtered,
            ].slice(0, 1000), // Keep last 1000 entries
          };
        });
      },
      
      clearHistory: () => {
        set({ history: [] });
      },
      
      removeHistoryEntry: (url) => {
        set((state) => ({
          history: state.history.filter(h => h.url !== url),
        }));
      },
      
      // Bookmark actions
      addBookmark: (bookmark) => {
        set((state) => ({
          bookmarks: [
            ...state.bookmarks,
            {
              ...bookmark,
              id: generateId(),
              createdAt: Date.now(),
            },
          ],
        }));
      },
      
      removeBookmark: (id) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter(b => b.id !== id),
        }));
      },
      
      updateBookmark: (id, updates) => {
        set((state) => ({
          bookmarks: state.bookmarks.map(b =>
            b.id === id ? { ...b, ...updates } : b
          ),
        }));
      },
      
      addBookmarkFolder: (name, parentId) => {
        set((state) => ({
          bookmarkFolders: [
            ...state.bookmarkFolders,
            { id: generateId(), name, parentId },
          ],
        }));
      },
      
      removeBookmarkFolder: (id) => {
        set((state) => ({
          bookmarkFolders: state.bookmarkFolders.filter(f => f.id !== id),
          bookmarks: state.bookmarks.filter(b => b.folder !== id),
        }));
      },
      
      isBookmarked: (url) => {
        return get().bookmarks.some(b => b.url === url);
      },
      
      // Settings
      setHomePage: (url) => {
        set({ homePage: url });
      },
      
      setSearchEngine: (engine) => {
        set({ searchEngine: engine });
      },
      
      setNavPosition: (position) => {
        set({ navPosition: position });
      },
      
      setCompactMode: (compact) => {
        set({ compactMode: compact });
      },
    }),
    {
      name: 'abyss-browser-storage',
      partialize: (state) => ({
        history: state.history,
        bookmarks: state.bookmarks,
        bookmarkFolders: state.bookmarkFolders,
        homePage: state.homePage,
        searchEngine: state.searchEngine,
        navPosition: state.navPosition,
        compactMode: state.compactMode,
      }),
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectActiveTab = (state: BrowserState) =>
  state.tabs.find(t => t.id === state.activeTabId) || null;

export const selectTabCount = (state: BrowserState) => state.tabs.length;

export const selectRecentHistory = (state: BrowserState, limit = 10) =>
  state.history.slice(0, limit);

export const selectBookmarksByFolder = (state: BrowserState, folderId?: string) =>
  state.bookmarks.filter(b => b.folder === folderId);
