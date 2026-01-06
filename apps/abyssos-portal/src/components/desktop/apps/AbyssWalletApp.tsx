/**
 * AbyssID Wallet Application
 * 
 * Full wallet with CGT balance, transactions, send functionality
 */

import { useState, useEffect } from 'react';
import { useAbyssIDIdentity, useAbyssIDUserData } from '../../../hooks/useAbyssIDIdentity';
import { useAbyssID } from '../../../hooks/useAbyssID';
import { useWalletStore } from '../../../state/walletStore';
import { useBlockListener } from '../../../context/BlockListenerContext';
import { sendCgt } from '../../../services/wallet/demiurgeWallet';
import { Button } from '../../shared/Button';
import { NFTSwapPanel } from './NFTSwapPanel';

export function AbyssWalletApp() {
  const { identity, isAuthenticated } = useAbyssIDIdentity();
  const { balance: userBalance, sync: syncUserData, isSyncing } = useAbyssIDUserData();
  const { currentBlockHeight } = useBlockListener();
  const {
    transactions,
    isLoadingTransactions,
    refreshTransactions,
    refreshBalance,
    addTransaction,
    updateTransaction,
    isLoadingBalance,
  } = useWalletStore();
  const { session } = useAbyssID();
  
  const [sendAmount, setSendAmount] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showSendForm, setShowSendForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'cgt' | 'nft-swap'>('cgt');
  
  // Use identity from unified service - automatically synced
  const demiurgePublicKey = identity?.demiurgePublicKey || null;
  const balance = userBalance; // From unified identity service
  
  // Refresh transactions when block height changes (balance auto-syncs via identity service)
  useEffect(() => {
    if (demiurgePublicKey) {
      refreshTransactions();
    }
  }, [demiurgePublicKey, currentBlockHeight, refreshTransactions]);
  
  // Listen for transaction confirmations
  useEffect(() => {
    if (!demiurgePublicKey) return;
    
    const unsubscribe = useBlockListener().onTransaction((event) => {
      // Check if this transaction is from our wallet
      const tx = transactions.find(t => t.hash === event.hash);
      if (tx && tx.status === 'pending') {
        updateTransaction(event.hash, {
          status: 'confirmed',
          blockHeight: event.blockHeight,
        });
        refreshBalance(); // Update balance after confirmation
      }
    });
    
    return unsubscribe;
  }, [demiurgePublicKey, transactions, updateTransaction, refreshBalance]);
  
  const handleSend = async () => {
    if (!identity || !demiurgePublicKey) {
      setSendError('No wallet connected');
      return;
    }
    
    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      setSendError('Invalid amount');
      return;
    }
    
    if (amount > balance) {
      setSendError('Insufficient balance');
      return;
    }
    
    if (!sendTo.trim()) {
      setSendError('Recipient address required');
      return;
    }
    
    setIsSending(true);
    setSendError(null);
    
    try {
      // Add pending transaction
      const pendingTx = {
        hash: `pending_${Date.now()}`,
        from: demiurgePublicKey,
        to: sendTo.trim(),
        amount,
        type: 'send' as const,
        timestamp: Date.now(),
        status: 'pending' as const,
      };
      addTransaction(pendingTx);
      
      // Send transaction
      const result = await sendCgt({
        from: identity.publicKey,
        to: sendTo.trim(),
        amount,
      });
      
      // Update transaction with real hash
      updateTransaction(pendingTx.hash, {
        hash: result.txHash,
        status: 'pending',
      });
      
      // Reset form
      setSendAmount('');
      setSendTo('');
      setShowSendForm(false);
      
      // Refresh balance
      refreshBalance();
    } catch (error: any) {
      setSendError(error.message || 'Failed to send transaction');
      console.error('Send transaction error:', error);
    } finally {
      setIsSending(false);
    }
  };
  
  if (!isAuthenticated || !session) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Please log in with AbyssID to use the wallet</p>
          <Button onClick={() => {}}>Login</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col min-h-0 p-6 space-y-6 overflow-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-abyss-cyan mb-2">AbyssID Wallet</h2>
        <p className="text-sm text-gray-400">Manage your CGT balance, transactions, and NFTs</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-abyss-cyan/20">
        <button
          onClick={() => setActiveTab('cgt')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'cgt'
              ? 'text-abyss-cyan border-b-2 border-abyss-cyan'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          CGT
        </button>
        <button
          onClick={() => setActiveTab('nft-swap')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'nft-swap'
              ? 'text-abyss-cyan border-b-2 border-abyss-cyan'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          NFT Swap
        </button>
      </div>

      {activeTab === 'nft-swap' && (
        <NFTSwapPanel
          onSwapComplete={(assetId) => {
            console.log('NFT swapped:', assetId);
            // TODO: Refresh NFT list or show notification
          }}
        />
      )}

      {activeTab === 'cgt' && (
        <>
      
      {/* Balance Card */}
      <div className="bg-abyss-navy/50 border border-abyss-cyan/20 rounded-lg p-6 backdrop-blur-sm">
        <div className="text-sm text-gray-400 mb-2">CGT Balance</div>
        <div className="text-4xl font-mono text-abyss-cyan mb-2">
          {isLoadingBalance ? '...' : (typeof balance === 'number' ? balance.toFixed(8) : String(balance))}
          <span className="text-lg text-gray-400 ml-2">CGT</span>
        </div>
        <div className="text-xs text-gray-500">
          Demiurge Address: <code className="text-abyss-cyan">{demiurgePublicKey?.slice(0, 16)}...</code>
        </div>
      </div>
      
      {/* Send CGT Section */}
      <div className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-4">
        {!showSendForm ? (
          <Button onClick={() => setShowSendForm(true)} className="w-full">
            Send CGT
          </Button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Recipient Address</label>
              <input
                type="text"
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded text-white text-sm focus:outline-none focus:border-abyss-cyan"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Amount (CGT)</label>
              <input
                type="number"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="0.0"
                step="0.0001"
                min="0"
                max={balance}
                className="w-full px-3 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded text-white text-sm focus:outline-none focus:border-abyss-cyan"
              />
            </div>
            {sendError && (
              <div className="text-red-400 text-sm">{sendError}</div>
            )}
            <div className="flex space-x-2">
              <Button
                onClick={handleSend}
                disabled={isSending}
                className="flex-1"
              >
                {isSending ? 'Sending...' : 'Send'}
              </Button>
              <Button
                onClick={() => {
                  setShowSendForm(false);
                  setSendError(null);
                }}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-abyss-cyan">Recent Transactions</h3>
          <Button
            onClick={refreshTransactions}
            disabled={isLoadingTransactions}
            variant="secondary"
            className="text-xs"
          >
            {isLoadingTransactions ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
        
        {transactions.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No transactions yet</p>
            <p className="text-xs mt-2">Send or receive CGT to see transactions here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 10).map((tx) => (
              <div
                key={tx.hash}
                className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-4 hover:border-abyss-cyan/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      tx.type === 'send' ? 'bg-red-500/20 text-red-400' :
                      tx.type === 'receive' ? 'bg-green-500/20 text-green-400' :
                      'bg-abyss-purple/20 text-abyss-purple'
                    }`}>
                      {tx.type}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      tx.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                      tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                  <div className="text-sm font-mono text-abyss-cyan">
                    {tx.type === 'send' ? '-' : '+'}{tx.amount.toFixed(4)} CGT
                  </div>
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>To: <code className="text-abyss-cyan">{tx.to.slice(0, 16)}...</code></div>
                  {tx.blockHeight && <div>Block: #{tx.blockHeight}</div>}
                  <div>Hash: <code className="text-gray-500">{tx.hash.slice(0, 16)}...</code></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}

