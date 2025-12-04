import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AppId = 'chainOps' | 'miner' | 'wallet' | 'abyssBrowser' | 'abyssTorrent' | 'onChainFiles';

export interface Window {
  id: string;
  appId: AppId;
  title: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface AppInfo {
  id: AppId;
  label: string;
  icon: string;
}

export const APP_INFOS: AppInfo[] = [
  { id: 'chainOps', label: 'Chain Ops', icon: '⚡' },
  { id: 'miner', label: 'Miner', icon: '🔷' },
  { id: 'wallet', label: 'Wallet', icon: '💎' },
  { id: 'abyssBrowser', label: 'Browser', icon: '🌐' },
  { id: 'abyssTorrent', label: 'Torrent', icon: '📤' },
  { id: 'onChainFiles', label: 'Files', icon: '📁' },
];

interface DesktopState {
  openWindows: Window[];
  activeWindowId: string | null;
  launcherApps: AppId[]; // Ordered list of apps in launcher
  openApp: (appId: AppId) => void;
  closeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  reorderLauncher: (fromIndex: number, toIndex: number) => void;
  setLauncherApps: (appIds: AppId[]) => void;
}

const appTitles: Record<AppId, string> = {
  chainOps: 'Chain Ops',
  miner: 'Mandelbrot Miner',
  wallet: 'Accounts / Wallet',
  abyssBrowser: 'AbyssBrowser',
  abyssTorrent: 'AbyssTorrent',
  onChainFiles: 'OnChain Files',
};

// Default launcher order
const DEFAULT_LAUNCHER_APPS: AppId[] = APP_INFOS.map((app) => app.id);

export const useDesktopStore = create<DesktopState>()(
  persist(
    (set) => ({
      openWindows: [],
      activeWindowId: null,
      launcherApps: DEFAULT_LAUNCHER_APPS,

      openApp: (appId: AppId) => {
        set((state) => {
          // Check if window already open
          const existing = state.openWindows.find((w) => w.appId === appId);
          if (existing) {
            return {
              activeWindowId: existing.id,
            };
          }

          // Create new window
          const newWindow: Window = {
            id: `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            appId,
            title: appTitles[appId],
            x: 100 + state.openWindows.length * 30,
            y: 100 + state.openWindows.length * 30,
            width: 800,
            height: 600,
          };

          return {
            openWindows: [...state.openWindows, newWindow],
            activeWindowId: newWindow.id,
          };
        });
      },

      closeWindow: (windowId: string) => {
        set((state) => {
          const newWindows = state.openWindows.filter((w) => w.id !== windowId);
          return {
            openWindows: newWindows,
            activeWindowId:
              state.activeWindowId === windowId
                ? newWindows.length > 0
                  ? newWindows[newWindows.length - 1].id
                  : null
                : state.activeWindowId,
          };
        });
      },

      focusWindow: (windowId: string) => {
        set({ activeWindowId: windowId });
      },

      reorderLauncher: (fromIndex: number, toIndex: number) => {
        set((state) => {
          const newApps = [...state.launcherApps];
          const [removed] = newApps.splice(fromIndex, 1);
          newApps.splice(toIndex, 0, removed);
          return { launcherApps: newApps };
        });
      },

      setLauncherApps: (appIds: AppId[]) => {
        set({ launcherApps: appIds });
      },
    }),
    {
      name: 'abyssos-desktop-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        launcherApps: state.launcherApps,
      }),
    }
  )
);

