import type { AbyssIDProvider, AbyssIDSession } from './types';
import { abyssIdClient } from '../../lib/abyssIdClient';

const STORAGE_KEY_SESSION = 'abyssid_session';

// Simple deterministic signature for mock purposes
async function mockSignMessage(message: Uint8Array | string): Promise<string> {
  const msgStr = typeof message === 'string' ? message : new TextDecoder().decode(message);
  const encoder = new TextEncoder();
  const data = encoder.encode(msgStr);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const localAbyssIDProvider: AbyssIDProvider = {
  async getSession(): Promise<AbyssIDSession | null> {
    try {
      const sessionData = localStorage.getItem(STORAGE_KEY_SESSION);
      if (sessionData) {
        return JSON.parse(sessionData) as AbyssIDSession;
      }

      // Fallback to existing auth system
      const account = await abyssIdClient.getCurrentAccount();
      if (account) {
        const session: AbyssIDSession = {
          username: account.username,
          publicKey: account.publicKey,
        };
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
        return session;
      }

      return null;
    } catch {
      return null;
    }
  },

  async login(username?: string): Promise<AbyssIDSession> {
    if (username) {
      // Try to get existing account
      const accounts = abyssIdClient.getAllAccounts();
      const account = accounts[username];

      if (account) {
        const session: AbyssIDSession = {
          username: account.username,
          publicKey: account.publicKey,
        };
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
        return session;
      }

      // Create new account if doesn't exist
      const newAccount = await abyssIdClient.signup(username);
      const session: AbyssIDSession = {
        username: newAccount.username,
        publicKey: newAccount.publicKey,
      };
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
      return session;
    }

    // If no username, try to get existing session
    const existing = await this.getSession();
    if (existing) {
      return existing;
    }

    throw new Error('No username provided and no existing session');
  },

  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY_SESSION);
    await abyssIdClient.logout();
  },

  async signMessage(message: Uint8Array | string): Promise<string> {
    const session = await this.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    // For now, return mock signature
    // In production, this would use the actual keypair
    const signature = await mockSignMessage(message);
    return signature;
  },
};

