/**
 * Archon State Store
 * 
 * PHASE OMEGA PART VI: Zustand store for Archon state management
 */

import { create } from 'zustand';
import { fetchArchonState, triggerAscension, getDirectives, getDiagnostics } from './archonApi';
import type { ArchonState } from './ArchonPresence';

interface ArchonStore {
  // State
  archonState: ArchonState | null;
  directives: Array<{ directive: string; priority: number; description: string }>;
  diagnostics: Array<{
    id: string;
    category: string;
    name: string;
    result: string;
    timestamp: number;
  }>;
  loading: boolean;
  error: string | null;
  lastUpdate: number | null;
  
  // Actions
  fetchState: () => Promise<void>;
  triggerAscensionEvent: () => Promise<void>;
  fetchDirectives: () => Promise<void>;
  fetchDiagnostics: () => Promise<void>;
  clearError: () => void;
}

export const useArchonStore = create<ArchonStore>((set, get) => ({
  // Initial state
  archonState: null,
  directives: [],
  diagnostics: [],
  loading: false,
  error: null,
  lastUpdate: null,
  
  // Fetch Archon state
  fetchState: async () => {
    set({ loading: true, error: null });
    try {
      const state = await fetchArchonState();
      set({
        archonState: state,
        loading: false,
        lastUpdate: Date.now(),
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch Archon state',
        loading: false,
      });
    }
  },
  
  // Trigger Ascension Event
  triggerAscensionEvent: async () => {
    set({ loading: true, error: null });
    try {
      const result = await triggerAscension();
      if (result.success) {
        // Refresh state after ascension
        await get().fetchState();
      } else {
        set({ error: 'Ascension event failed' });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to trigger ascension',
        loading: false,
      });
    }
  },
  
  // Fetch directives
  fetchDirectives: async () => {
    try {
      const directives = await getDirectives();
      set({ directives });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch directives',
      });
    }
  },
  
  // Fetch diagnostics
  fetchDiagnostics: async () => {
    try {
      const diagnostics = await getDiagnostics();
      set({ diagnostics });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch diagnostics',
      });
    }
  },
  
  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
