import { create } from 'zustand';

export type AppId = 'chainOps' | 'miner' | 'wallet';

export interface Window {
  id: string;
  appId: AppId;
  title: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface DesktopState {
  openWindows: Window[];
  activeWindowId: string | null;
  openApp: (appId: AppId) => void;
  closeWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
}

const appTitles: Record<AppId, string> = {
  chainOps: 'Chain Ops',
  miner: 'Mandelbrot Miner',
  wallet: 'Accounts / Wallet',
};

export const useDesktopStore = create<DesktopState>((set) => ({
  openWindows: [],
  activeWindowId: null,

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
}));

