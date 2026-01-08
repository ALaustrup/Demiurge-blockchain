/**
 * QorID Identity Service
 * 
 * Centralized service for managing QorID authentication and user data synchronization
 * across all apps and services in QOR OS.
 * 
 * This is the single source of truth for user identity on-chain.
 */

import type { QorIDSession } from '../qorid/types';
import { deriveDemiurgePublicKey } from '../wallet/demiurgeWallet';
import { useWalletStore } from '../../state/walletStore';
import { useAuthStore } from '../../state/authStore';

export interface QorIDIdentity {
  session: QorIDSession;
  demiurgePublicKey: string;
  username: string;
  publicKey: string;
}

export interface UserData {
  identity: QorIDIdentity;
  balance: number;
  balanceLastUpdated: number;
  assets: any[]; // DRC-369 NFTs and other on-chain assets
  assetsLastUpdated: number;
}

class QorIDIdentityService {
  private identity: QorIDIdentity | null = null;
  private listeners: Set<(identity: QorIDIdentity | null) => void> = new Set();
  private dataListeners: Set<(data: UserData | null) => void> = new Set();
  private syncInterval: number | null = null;

  /**
   * Initialize identity from session
   * This should be called when user logs in
   */
  async initialize(session: QorIDSession): Promise<QorIDIdentity> {
    // Derive Demiurge public key from QorID
    const demiurgePublicKey = await deriveDemiurgePublicKey(session.publicKey);
    
    const identity: QorIDIdentity = {
      session,
      demiurgePublicKey,
      username: session.username,
      publicKey: session.publicKey,
    };

    this.identity = identity;
    
    // Update wallet store
    const walletStore = useWalletStore.getState();
    walletStore.setDemiurgePublicKey(demiurgePublicKey);
    
    // Update auth store for backward compatibility
    // Note: This maintains compatibility with legacy code that uses authStore
    try {
      const authStore = useAuthStore.getState();
      authStore.login({
        username: session.username,
        publicKey: session.publicKey,
      });
    } catch (error) {
      // Auth store might not be available in all contexts
      console.warn('Could not update auth store:', error);
    }

    // Notify all listeners
    this.notifyListeners(identity);
    
    // Start auto-sync
    this.startAutoSync();

    return identity;
  }

  /**
   * Clear identity (logout)
   */
  clear(): void {
    this.identity = null;
    
    // Clear wallet store
    const walletStore = useWalletStore.getState();
    walletStore.clearWallet();
    
    // Clear auth store
    const authStore = useAuthStore.getState();
    authStore.logout();

    // Stop auto-sync
    this.stopAutoSync();

    // Notify all listeners
    this.notifyListeners(null);
  }

  /**
   * Get current identity
   */
  getIdentity(): QorIDIdentity | null {
    return this.identity;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.identity !== null;
  }

  /**
   * Subscribe to identity changes
   */
  subscribe(listener: (identity: QorIDIdentity | null) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately notify with current identity
    listener(this.identity);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Subscribe to user data changes (balance, assets, etc.)
   */
  subscribeToData(listener: (data: UserData | null) => void): () => void {
    this.dataListeners.add(listener);
    
    // Immediately notify with current data
    this.notifyDataListeners();
    
    // Return unsubscribe function
    return () => {
      this.dataListeners.delete(listener);
    };
  }

  /**
   * Sync user data (balance, assets, etc.)
   * This is called automatically on interval and can be called manually
   */
  async syncUserData(): Promise<void> {
    if (!this.identity) return;

    const walletStore = useWalletStore.getState();
    
    // Sync balance
    await walletStore.refreshBalance();
    
    // Sync transactions
    await walletStore.refreshTransactions();
    
    // TODO: Sync on-chain assets (DRC-369 NFTs, etc.)
    // This will be implemented when asset sync is needed
    
    // Notify data listeners
    this.notifyDataListeners();
  }

  /**
   * Start automatic synchronization
   */
  private startAutoSync(): void {
    // Stop existing sync if any
    this.stopAutoSync();
    
    // Sync immediately
    this.syncUserData();
    
    // Then sync every 30 seconds
    this.syncInterval = window.setInterval(() => {
      this.syncUserData();
    }, 30000);
  }

  /**
   * Stop automatic synchronization
   */
  private stopAutoSync(): void {
    if (this.syncInterval !== null) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Notify all identity listeners
   */
  private notifyListeners(identity: QorIDIdentity | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(identity);
      } catch (error) {
        console.error('Error in identity listener:', error);
      }
    });
  }

  /**
   * Notify all data listeners
   */
  private notifyDataListeners(): void {
    if (!this.identity) {
      this.dataListeners.forEach(listener => {
        try {
          listener(null);
        } catch (error) {
          console.error('Error in data listener:', error);
        }
      });
      return;
    }

    const walletStore = useWalletStore.getState();
    
    const data: UserData = {
      identity: this.identity,
      balance: walletStore.balance,
      balanceLastUpdated: walletStore.balanceLastUpdated,
      assets: [], // TODO: Load from asset store
      assetsLastUpdated: Date.now(),
    };

    this.dataListeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in data listener:', error);
      }
    });
  }
}

// Singleton instance
export const qorIDIdentityService = new QorIDIdentityService();

