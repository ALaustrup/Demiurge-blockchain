/**
 * Theme Store for Reactive Colors
 */

import { create } from 'zustand';

interface ReactiveColors {
  glow: {
    r: number;
    g: number;
    b: number;
    intensity: number;
  };
  shadow: {
    r: number;
    g: number;
    b: number;
  };
  bloom: number;
}

interface ThemeState {
  reactiveColors: ReactiveColors | null;
  audioReactiveEnabled: boolean;
  updateReactiveColors: (colors: ReactiveColors) => void;
  setAudioReactive: (enabled: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  reactiveColors: null,
  audioReactiveEnabled: true,
  
  updateReactiveColors: (colors: ReactiveColors) => {
    set({ reactiveColors: colors });
    
    // Apply to CSS variables
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--reactive-glow-r', colors.glow.r.toString());
      root.style.setProperty('--reactive-glow-g', colors.glow.g.toString());
      root.style.setProperty('--reactive-glow-b', colors.glow.b.toString());
      root.style.setProperty('--reactive-glow-intensity', colors.glow.intensity.toString());
      root.style.setProperty('--reactive-shadow-r', colors.shadow.r.toString());
      root.style.setProperty('--reactive-shadow-g', colors.shadow.g.toString());
      root.style.setProperty('--reactive-shadow-b', colors.shadow.b.toString());
      root.style.setProperty('--reactive-bloom', colors.bloom.toString());
    }
  },
  
  setAudioReactive: (enabled: boolean) => {
    set({ audioReactiveEnabled: enabled });
    if (!enabled) {
      // Reset to default colors
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        root.style.removeProperty('--reactive-glow-r');
        root.style.removeProperty('--reactive-glow-g');
        root.style.removeProperty('--reactive-glow-b');
        root.style.removeProperty('--reactive-glow-intensity');
        root.style.removeProperty('--reactive-shadow-r');
        root.style.removeProperty('--reactive-shadow-g');
        root.style.removeProperty('--reactive-shadow-b');
        root.style.removeProperty('--reactive-bloom');
      }
    }
  },
}));

