/**
 * Customization Store
 * 
 * Manages user customization preferences:
 * - Color scheme customization
 * - Toolbar widget positions
 * - Other UI preferences
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface ToolbarWidgetPosition {
  id: string;
  order: number;
  visible: boolean;
}

export interface CustomizationState {
  // Color customization
  colorScheme: ColorScheme | null;
  useCustomColors: boolean;

  // Toolbar widget positions
  toolbarWidgets: ToolbarWidgetPosition[];
  
  // Actions
  setColorScheme: (scheme: ColorScheme) => void;
  clearColorScheme: () => void;
  setUseCustomColors: (use: boolean) => void;
  updateToolbarWidget: (id: string, updates: Partial<ToolbarWidgetPosition>) => void;
  resetToolbarWidgets: () => void;
}

const defaultColorScheme: ColorScheme = {
  primary: '#00ffff',
  secondary: '#ff00ff',
  accent: '#00ffff',
  background: 'rgba(10, 10, 25, 0.75)',
  text: '#e4e4e7',
};

const defaultToolbarWidgets: ToolbarWidgetPosition[] = [
  { id: 'rpc-status', order: 0, visible: true },
  { id: 'music-player', order: 1, visible: true },
  { id: 'background-music', order: 2, visible: true },
  { id: 'date-time', order: 3, visible: true },
  { id: 'avatar', order: 4, visible: true },
];

export const useCustomizationStore = create<CustomizationState>()(
  persist(
    (set, get) => ({
      colorScheme: null,
      useCustomColors: false,
      toolbarWidgets: defaultToolbarWidgets,

      setColorScheme: (scheme: ColorScheme) => {
        set({ colorScheme: scheme, useCustomColors: true });
        // Apply to CSS variables
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          root.style.setProperty('--custom-primary', scheme.primary);
          root.style.setProperty('--custom-secondary', scheme.secondary);
          root.style.setProperty('--custom-accent', scheme.accent);
          root.style.setProperty('--custom-background', scheme.background);
          root.style.setProperty('--custom-text', scheme.text);
        }
      },

      clearColorScheme: () => {
        set({ colorScheme: null, useCustomColors: false });
        // Remove CSS variables
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          root.style.removeProperty('--custom-primary');
          root.style.removeProperty('--custom-secondary');
          root.style.removeProperty('--custom-accent');
          root.style.removeProperty('--custom-background');
          root.style.removeProperty('--custom-text');
        }
      },

      setUseCustomColors: (use: boolean) => {
        set({ useCustomColors: use });
        if (!use) {
          get().clearColorScheme();
        }
      },

      updateToolbarWidget: (id: string, updates: Partial<ToolbarWidgetPosition>) => {
        const { toolbarWidgets } = get();
        const updated = toolbarWidgets.map(widget =>
          widget.id === id ? { ...widget, ...updates } : widget
        );
        // Sort by order
        updated.sort((a, b) => a.order - b.order);
        set({ toolbarWidgets: updated });
      },

      resetToolbarWidgets: () => {
        set({ toolbarWidgets: defaultToolbarWidgets });
      },
    }),
    {
      name: 'abyssos-customization',
      partialize: (state) => ({
        colorScheme: state.colorScheme,
        useCustomColors: state.useCustomColors,
        toolbarWidgets: state.toolbarWidgets,
      }),
    }
  )
);

