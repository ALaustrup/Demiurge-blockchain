/**
 * AbyssOS Theme System
 * 
 * Defines theme variants with glassmorphism and premium styling tokens.
 */

export type ThemeId = 'ABYSS_GLASS' | 'OBSIDIAN_CORE' | 'IRIDESCENT_WAVE';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  dock: {
    background: string;
    border: string;
    backdropBlur: string;
    shadow: string;
  };
  toolbar: {
    background: string;
    border: string;
    backdropBlur: string;
  };
  accent: {
    glowIntensity: number;
    primary: string;
    secondary: string;
  };
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  ABYSS_GLASS: {
    id: 'ABYSS_GLASS',
    name: 'Abyss Glass',
    dock: {
      background: 'rgba(10, 10, 25, 0.65)',
      border: 'rgba(255, 255, 255, 0.12)',
      backdropBlur: 'blur(20px) saturate(1.4)',
      shadow: '0 18px 45px rgba(0, 0, 0, 0.6)',
    },
    toolbar: {
      background: 'rgba(10, 10, 25, 0.75)',
      border: 'rgba(0, 255, 255, 0.2)',
      backdropBlur: 'blur(12px) saturate(1.2)',
    },
    accent: {
      glowIntensity: 1.0,
      primary: '#00ffff',
      secondary: '#ff00ff',
    },
  },
  OBSIDIAN_CORE: {
    id: 'OBSIDIAN_CORE',
    name: 'Obsidian Core',
    dock: {
      background: 'rgba(5, 5, 15, 0.85)',
      border: 'rgba(255, 255, 255, 0.08)',
      backdropBlur: 'blur(25px) saturate(1.2)',
      shadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
    },
    toolbar: {
      background: 'rgba(5, 5, 15, 0.9)',
      border: 'rgba(157, 0, 255, 0.15)',
      backdropBlur: 'blur(15px) saturate(1.1)',
    },
    accent: {
      glowIntensity: 0.8,
      primary: '#9d00ff',
      secondary: '#00ffff',
    },
  },
  IRIDESCENT_WAVE: {
    id: 'IRIDESCENT_WAVE',
    name: 'Iridescent Wave',
    dock: {
      background: 'rgba(15, 10, 30, 0.7)',
      border: 'rgba(255, 255, 255, 0.15)',
      backdropBlur: 'blur(22px) saturate(1.5)',
      shadow: '0 18px 45px rgba(157, 0, 255, 0.3)',
    },
    toolbar: {
      background: 'rgba(15, 10, 30, 0.8)',
      border: 'rgba(255, 0, 255, 0.2)',
      backdropBlur: 'blur(14px) saturate(1.3)',
    },
    accent: {
      glowIntensity: 1.2,
      primary: '#ff00ff',
      secondary: '#00ffff',
    },
  },
};

const STORAGE_KEY_THEME = 'abyssos_theme';

export function getStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return 'ABYSS_GLASS';
  const stored = localStorage.getItem(STORAGE_KEY_THEME);
  if (stored && stored in THEMES) {
    return stored as ThemeId;
  }
  return 'ABYSS_GLASS';
}

export function setStoredTheme(themeId: ThemeId): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_THEME, themeId);
}

export function getThemeConfig(themeId: ThemeId = getStoredTheme()): ThemeConfig {
  return THEMES[themeId];
}

