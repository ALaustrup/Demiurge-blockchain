/**
 * useAbyssIDIdentity Hook
 * 
 * Provides access to the unified QorID identity system.
 * All apps should use this hook to access user identity and data.
 */

import { useEffect, useState } from 'react';
import { useQorID } from './useAbyssID';
import { qorIDIdentityService, type QorIDIdentity, type UserData } from '../services/identity/QorIDIdentityService';

/**
 * Hook to access QorID identity
 * Automatically syncs with login/logout
 */
export function useAbyssIDIdentity() {
  const { session, isLoading } = useQorID();
  const [identity, setIdentity] = useState<QorIDIdentity | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize identity when session changes
  useEffect(() => {
    if (isLoading) return;

    if (session) {
      setIsInitializing(true);
      qorIDIdentityService
        .initialize(session)
        .then(initIdentity => {
          setIdentity(initIdentity);
          setIsInitializing(false);
        })
        .catch(error => {
          console.error('Failed to initialize QorID identity:', error);
          setIdentity(null);
          setIsInitializing(false);
        });
    } else {
      qorIDIdentityService.clear();
      setIdentity(null);
    }
  }, [session, isLoading]);

  // Subscribe to identity changes
  useEffect(() => {
    const unsubscribe = qorIDIdentityService.subscribe(newIdentity => {
      setIdentity(newIdentity);
    });

    return unsubscribe;
  }, []);

  return {
    identity,
    isAuthenticated: identity !== null,
    isLoading: isLoading || isInitializing,
    username: identity?.username || null,
    publicKey: identity?.publicKey || null,
    demiurgePublicKey: identity?.demiurgePublicKey || null,
  };
}

/**
 * Hook to access user data (balance, assets, etc.)
 * Automatically syncs and updates in real-time
 */
export function useAbyssIDUserData() {
  const { identity } = useAbyssIDIdentity();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Subscribe to data changes
  useEffect(() => {
    if (!identity) {
      setUserData(null);
      return;
    }

    const unsubscribe = qorIDIdentityService.subscribeToData(newData => {
      setUserData(newData);
    });

    return unsubscribe;
  }, [identity]);

  // Manual sync function
  const sync = async () => {
    if (!identity) return;
    setIsSyncing(true);
    try {
      await qorIDIdentityService.syncUserData();
    } catch (error) {
      console.error('Failed to sync user data:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    userData,
    balance: userData?.balance || 0,
    assets: userData?.assets || [],
    isSyncing,
    sync,
  };
}

