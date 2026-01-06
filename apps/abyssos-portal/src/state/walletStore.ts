/**
 * AbyssID Wallet Store
 * 
 * Manages wallet state: balance, transactions, derived keys
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WalletTransaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  type: 'send' | 'receive' | 'mint' | 'burn' | 'transfer';
  blockHeight?: number;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface WalletState {
  // Derived Demiurge public key (from AbyssID identity)
  demiurgePublicKey: string | null;
  
  // CGT balance
  balance: number;
  balanceLastUpdated: number;
  
  // Transactions
  transactions: WalletTransaction[];
  
  // Loading states
  isLoadingBalance: boolean;
  isLoadingTransactions: boolean;
  
  // Actions
  setDemiurgePublicKey: (key: string) => void;
  setBalance: (balance: number) => void;
  addTransaction: (tx: WalletTransaction) => void;
  updateTransaction: (hash: string, updates: Partial<WalletTransaction>) => void;
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  clearWallet: () => void;
}

const initialState = {
  demiurgePublicKey: null,
  balance: 0,
  balanceLastUpdated: 0,
  transactions: [],
  isLoadingBalance: false,
  isLoadingTransactions: false,
};

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setDemiurgePublicKey: (key: string) => {
        set({ demiurgePublicKey: key });
      },
      
      setBalance: (balance: number) => {
        set({ balance, balanceLastUpdated: Date.now() });
      },
      
      addTransaction: (tx: WalletTransaction) => {
        const { transactions } = get();
        // Avoid duplicates
        if (transactions.find(t => t.hash === tx.hash)) return;
        set({ transactions: [tx, ...transactions].slice(0, 100) }); // Keep last 100
      },
      
      updateTransaction: (hash: string, updates: Partial<WalletTransaction>) => {
        const { transactions } = get();
        set({
          transactions: transactions.map(tx =>
            tx.hash === hash ? { ...tx, ...updates } : tx
          ),
        });
      },
      
      refreshBalance: async () => {
        const { demiurgePublicKey } = get();
        if (!demiurgePublicKey) return;
        
        set({ isLoadingBalance: true });
        try {
          // First try to get from AbyssID service (includes 5000 CGT gift)
          const sessionToken = typeof window !== 'undefined' 
            ? localStorage.getItem('abyssos.abyssid.sessionId')
            : null;
          
          if (sessionToken) {
            try {
              const balanceResponse = await fetch(
                `${import.meta.env.VITE_ABYSSID_API_URL || 'http://localhost:8082'}/api/abyssid/wallet/balance`,
                {
                  headers: {
                    'Authorization': `Bearer ${sessionToken}`,
                  },
                }
              );
              
              if (balanceResponse.ok) {
                const { balance } = await balanceResponse.json();
                get().setBalance(Number(balance) || 0);
                return;
              }
            } catch (apiError) {
              console.warn('Failed to fetch balance from API, falling back to RPC:', apiError);
            }
          }
          
          // Fallback to RPC
          const rpcUrl = import.meta.env.VITE_DEMIURGE_RPC_URL || 'https://rpc.demiurge.cloud/rpc';
          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'cgt_getBalance',
              params: [demiurgePublicKey],
              id: Date.now(),
            }),
          });
          
          const json = await response.json();
          if (json.result !== undefined) {
            // RPC returns balance as string (to avoid JS number overflow)
            // Convert from smallest units (10^-8) to CGT
            const balanceInSmallestUnits = BigInt(String(json.result));
            const balanceInCGT = Number(balanceInSmallestUnits) / 100_000_000;
            get().setBalance(balanceInCGT);
          }
        } catch (error) {
          console.error('Failed to refresh balance:', error);
        } finally {
          set({ isLoadingBalance: false });
        }
      },
      
      refreshTransactions: async () => {
        const { demiurgePublicKey } = get();
        if (!demiurgePublicKey) return;
        
        set({ isLoadingTransactions: true });
        try {
          const rpcUrl = import.meta.env.VITE_DEMIURGE_RPC_URL || 'https://rpc.demiurge.cloud/rpc';
          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'cgt_getTransactionsByAddress',
              params: [demiurgePublicKey, 50], // Last 50 transactions
              id: Date.now(),
            }),
          });
          
          const json = await response.json();
          if (Array.isArray(json.result)) {
            const txs: WalletTransaction[] = json.result.map((tx: any) => ({
              hash: tx.hash || tx.txHash,
              from: tx.from,
              to: tx.to,
              amount: Number(tx.amount || tx.value || 0),
              type: tx.type || (tx.to === demiurgePublicKey ? 'receive' : 'send'),
              blockHeight: tx.blockHeight || tx.block,
              timestamp: tx.timestamp || Date.now(),
              status: tx.status || 'confirmed',
            }));
            set({ transactions: txs });
          }
        } catch (error) {
          console.error('Failed to refresh transactions:', error);
        } finally {
          set({ isLoadingTransactions: false });
        }
      },
      
      clearWallet: () => {
        set(initialState);
      },
    }),
    {
      name: 'abyssos-wallet-storage',
      partialize: (state) => ({
        demiurgePublicKey: state.demiurgePublicKey,
        transactions: state.transactions,
      }),
    }
  )
);

