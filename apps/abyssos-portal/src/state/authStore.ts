import { create } from 'zustand';
import { abyssIdClient, type AbyssAccount } from '../lib/abyssIdClient';

interface AuthState {
  account: AbyssAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (account: AbyssAccount) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  account: null,
  isAuthenticated: false,
  isLoading: true,

  login: (account: AbyssAccount) => {
    // Persist to localStorage
    localStorage.setItem('abyssos_auth', JSON.stringify(account));
    set({ account, isAuthenticated: true });
  },

  logout: async () => {
    await abyssIdClient.logout();
    set({ account: null, isAuthenticated: false });
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const account = await abyssIdClient.getCurrentAccount();
      if (account) {
        set({ account, isAuthenticated: true, isLoading: false });
      } else {
        set({ account: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ account: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

