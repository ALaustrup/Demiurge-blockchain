import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeId, getStoredTheme, setStoredTheme, getThemeConfig, ThemeConfig } from '../theme/abyssTheme';

interface ThemeContextValue {
  currentTheme: ThemeId;
  themeConfig: ThemeConfig;
  setTheme: (themeId: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(getStoredTheme());

  useEffect(() => {
    // Apply theme to document root for CSS variables if needed
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const setTheme = (themeId: ThemeId) => {
    setCurrentTheme(themeId);
    setStoredTheme(themeId);
  };

  const themeConfig = getThemeConfig(currentTheme);

  return (
    <ThemeContext.Provider value={{ currentTheme, themeConfig, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

