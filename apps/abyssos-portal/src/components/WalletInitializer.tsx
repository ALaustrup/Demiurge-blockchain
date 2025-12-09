import { useEffect } from 'react';
import { useAbyssIDIdentity } from '../hooks/useAbyssIDIdentity';
import { useAbyssIDUserData } from '../hooks/useAbyssIDIdentity';

/**
 * WalletInitializer - Ensures wallet is automatically synced with AbyssID
 * 
 * This component uses the unified AbyssID identity service which automatically:
 * - Derives Demiurge public key from AbyssID
 * - Syncs wallet balance
 * - Syncs transactions
 * - Syncs on-chain assets
 * 
 * All of this happens automatically when user logs in via AbyssID.
 */
export function WalletInitializer() {
  const { identity, isAuthenticated } = useAbyssIDIdentity();
  const { balance, isSyncing } = useAbyssIDUserData();

  // The identity service handles everything automatically
  // This component just ensures the hooks are active
  useEffect(() => {
    if (isAuthenticated && identity) {
      console.log('[WalletInitializer] AbyssID authenticated:', identity.username);
      console.log('[WalletInitializer] Demiurge public key:', identity.demiurgePublicKey);
      console.log('[WalletInitializer] Balance:', balance);
    }
  }, [identity, isAuthenticated, balance]);

  return null; // This component doesn't render anything
}

