/**
 * AbyssID Wallet Application
 * 
 * Full wallet with CGT balance, transactions, staking, and send functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { useAbyssIDIdentity, useAbyssIDUserData } from '../../../hooks/useAbyssIDIdentity';
import { useAbyssID } from '../../../hooks/useAbyssID';
import { useWalletStore } from '../../../state/walletStore';
import { useBlockListener } from '../../../context/BlockListenerContext';
import { sendCgt } from '../../../services/wallet/demiurgeWallet';
import { Button } from '../../shared/Button';
import { AddressDisplay } from '../../shared/AddressDisplay';
import { NFTSwapPanel } from './NFTSwapPanel';

const RPC_URL = import.meta.env.VITE_DEMIURGE_RPC_URL || 'https://rpc.demiurge.cloud/rpc';

interface StakeInfo {
  amount: string;
  pending_rewards: string;
  unstake_requested_at: number;
  unstake_amount: string;
  has_pending_unstake: boolean;
}

interface StakingStats {
  total_staked: string;
  apy_bps: number;
  apy_percent: number;
  min_stake: string;
  lock_period_secs: number;
  lock_period_days: number;
}

interface PremiumStatus {
  effective_tier: string;
  effective_tier_id: number;
  subscription_tier: string;
  stake_tier: string;
  subscription_expires_at: number;
  staked_amount: string;
  storage_limit: number;
  storage_limit_gb: number;
  storage_used: number;
  storage_used_gb: number;
  storage_available: number;
}

interface PremiumTier {
  id: number;
  name: string;
  monthly_cost: string;
  stake_requirement: string;
  storage_limit: number;
  storage_limit_gb: number;
  features: string[];
}

interface TreasuryStats {
  balance: string;
  total_fees_collected: string;
  total_burned: string;
  total_validator_rewards: string;
  fee_rate_percent: number;
  treasury_share_percent: number;
  burn_share_percent: number;
  validator_share_percent: number;
}

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
  const [activeTab, setActiveTab] = useState<'cgt' | 'staking' | 'nft-swap' | 'premium'>('cgt');
  
  // Staking state
  const [stakeInfo, setStakeInfo] = useState<StakeInfo | null>(null);
  const [stakingStats, setStakingStats] = useState<StakingStats | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);
  const [stakingError, setStakingError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  
  // Premium state
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null);
  const [premiumTiers, setPremiumTiers] = useState<PremiumTier[]>([]);
  const [treasuryStats, setTreasuryStats] = useState<TreasuryStats | null>(null);
  const [isLoadingPremium, setIsLoadingPremium] = useState(false);
  
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
  
  // Fetch staking info
  const fetchStakingInfo = useCallback(async () => {
    if (!demiurgePublicKey) return;
    
    try {
      const [infoResponse, statsResponse] = await Promise.all([
        fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'staking_getInfo',
            params: { address: demiurgePublicKey },
            id: Date.now(),
          }),
        }),
        fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'staking_getStats',
            params: {},
            id: Date.now() + 1,
          }),
        }),
      ]);
      
      const infoJson = await infoResponse.json();
      const statsJson = await statsResponse.json();
      
      if (infoJson.result) setStakeInfo(infoJson.result);
      if (statsJson.result) setStakingStats(statsJson.result);
    } catch (error) {
      console.error('Failed to fetch staking info:', error);
    }
  }, [demiurgePublicKey]);
  
  // Fetch staking info on mount and when tab changes
  useEffect(() => {
    if (activeTab === 'staking') {
      fetchStakingInfo();
    }
  }, [activeTab, fetchStakingInfo]);
  
  // Fetch premium status
  const fetchPremiumStatus = useCallback(async () => {
    if (!demiurgePublicKey) return;
    
    setIsLoadingPremium(true);
    try {
      const [statusResponse, tiersResponse, treasuryResponse] = await Promise.all([
        fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'premium_getStatus',
            params: { address: demiurgePublicKey },
            id: Date.now(),
          }),
        }),
        fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'premium_getTiers',
            params: {},
            id: Date.now() + 1,
          }),
        }),
        fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'treasury_getStats',
            params: {},
            id: Date.now() + 2,
          }),
        }),
      ]);
      
      const statusJson = await statusResponse.json();
      const tiersJson = await tiersResponse.json();
      const treasuryJson = await treasuryResponse.json();
      
      if (statusJson.result) setPremiumStatus(statusJson.result);
      if (tiersJson.result?.tiers) setPremiumTiers(tiersJson.result.tiers);
      if (treasuryJson.result) setTreasuryStats(treasuryJson.result);
    } catch (error) {
      console.error('Failed to fetch premium status:', error);
    } finally {
      setIsLoadingPremium(false);
    }
  }, [demiurgePublicKey]);
  
  // Fetch premium status when tab changes
  useEffect(() => {
    if (activeTab === 'premium') {
      fetchPremiumStatus();
    }
  }, [activeTab, fetchPremiumStatus]);
  
  // Format CGT amount
  const formatCGT = (amount: string) => {
    const num = Number(amount) / 100_000_000;
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
  };
  
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
          onClick={() => setActiveTab('staking')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'staking'
              ? 'text-abyss-cyan border-b-2 border-abyss-cyan'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Staking
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
        <button
          onClick={() => setActiveTab('premium')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'premium'
              ? 'text-abyss-cyan border-b-2 border-abyss-cyan'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Premium
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

      {activeTab === 'premium' && (
        <div className="space-y-6">
          {isLoadingPremium ? (
            <div className="text-center text-gray-400 py-8">Loading premium status...</div>
          ) : (
            <>
              {/* Current Status Banner */}
              <div className={`border rounded-lg p-6 ${
                premiumStatus?.effective_tier === 'Genesis' 
                  ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
                  : premiumStatus?.effective_tier === 'Archon'
                  ? 'bg-gradient-to-r from-abyss-purple/20 to-abyss-cyan/20 border-abyss-purple/30'
                  : 'bg-abyss-navy/50 border-abyss-cyan/20'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Your Current Tier</div>
                    <div className={`text-3xl font-bold ${
                      premiumStatus?.effective_tier === 'Genesis' ? 'text-yellow-400' :
                      premiumStatus?.effective_tier === 'Archon' ? 'text-abyss-purple' :
                      'text-gray-400'
                    }`}>
                      {premiumStatus?.effective_tier || 'Free'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400 mb-1">Storage</div>
                    <div className="text-lg font-mono text-white">
                      {premiumStatus?.storage_used_gb?.toFixed(2) || '0.00'} / {premiumStatus?.storage_limit_gb || 2} GB
                    </div>
                    <div className="w-32 h-2 bg-abyss-dark rounded-full overflow-hidden mt-1">
                      <div 
                        className="h-full bg-abyss-cyan transition-all"
                        style={{ width: `${Math.min(100, ((premiumStatus?.storage_used || 0) / (premiumStatus?.storage_limit || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Subscription vs Stake Status */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Via Subscription</div>
                    <div className="text-sm font-medium">
                      {premiumStatus?.subscription_tier || 'None'}
                      {premiumStatus?.subscription_expires_at ? (
                        <span className="text-xs text-gray-500 ml-2">
                          (expires {new Date(premiumStatus.subscription_expires_at * 1000).toLocaleDateString()})
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Via Staking</div>
                    <div className="text-sm font-medium">
                      {premiumStatus?.stake_tier || 'None'}
                      {premiumStatus?.staked_amount && Number(premiumStatus.staked_amount) > 0 ? (
                        <span className="text-xs text-gray-500 ml-2">
                          ({formatCGT(premiumStatus.staked_amount)} CGT staked)
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tier Comparison */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-abyss-cyan">Premium Tiers</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {premiumTiers.map((tier) => (
                    <div 
                      key={tier.id}
                      className={`border rounded-lg p-4 ${
                        tier.name === premiumStatus?.effective_tier
                          ? 'border-abyss-cyan bg-abyss-cyan/10'
                          : 'border-abyss-cyan/20 bg-abyss-dark/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`text-lg font-bold ${
                          tier.name === 'Genesis' ? 'text-yellow-400' :
                          tier.name === 'Archon' ? 'text-abyss-purple' :
                          'text-gray-300'
                        }`}>
                          {tier.name}
                        </h4>
                        {tier.name === premiumStatus?.effective_tier && (
                          <span className="px-2 py-1 text-xs bg-abyss-cyan/20 text-abyss-cyan rounded">
                            Current
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Storage</span>
                          <span className="text-white">{tier.storage_limit_gb} GB</span>
                        </div>
                        {tier.monthly_cost !== '0' && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Monthly</span>
                              <span className="text-white">{formatCGT(tier.monthly_cost)} CGT</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Or Stake</span>
                              <span className="text-white">{formatCGT(tier.stake_requirement)} CGT</span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="space-y-1 border-t border-white/10 pt-3">
                        {tier.features.map((feature) => (
                          <div key={feature} className="flex items-center text-xs text-gray-400">
                            <span className="text-green-400 mr-2">✓</span>
                            {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                        ))}
                      </div>
                      
                      {tier.name !== 'Free' && tier.name !== premiumStatus?.effective_tier && (
                        <Button
                          onClick={() => {
                            // TODO: Implement subscription
                            alert('Subscription coming soon! For now, stake CGT in the Staking tab to unlock premium tiers.');
                          }}
                          className="w-full mt-4"
                          variant="secondary"
                        >
                          Upgrade to {tier.name}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Treasury Info */}
              {treasuryStats && (
                <div className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-abyss-cyan mb-3">Ecosystem Treasury</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-gray-500">Treasury Balance</div>
                      <div className="font-mono text-white">{formatCGT(treasuryStats.balance)} CGT</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Total Burned</div>
                      <div className="font-mono text-red-400">{formatCGT(treasuryStats.total_burned)} CGT</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Fees Collected</div>
                      <div className="font-mono text-white">{formatCGT(treasuryStats.total_fees_collected)} CGT</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Fee Rate</div>
                      <div className="font-mono text-white">{treasuryStats.fee_rate_percent}%</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="text-xs text-gray-500 mb-2">Fee Distribution</div>
                    <div className="flex gap-4 text-xs">
                      <span className="text-abyss-cyan">{treasuryStats.treasury_share_percent}% Treasury</span>
                      <span className="text-red-400">{treasuryStats.burn_share_percent}% Burn</span>
                      <span className="text-green-400">{treasuryStats.validator_share_percent}% Validators</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Info Box */}
              <div className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-4">
                <h4 className="text-sm font-medium text-abyss-cyan mb-2">How Premium Works</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• <strong>Pay Monthly:</strong> Subscribe with CGT for immediate access</li>
                  <li>• <strong>Stake to Unlock:</strong> Stake CGT in the Staking tab to unlock tiers permanently while staked</li>
                  <li>• <strong>Best of Both:</strong> Your effective tier is always the highest between subscription and stake</li>
                  <li>• <strong>70% to Ecosystem:</strong> Premium payments fund development and infrastructure</li>
                </ul>
              </div>
            </>
          )}
        </div>
      )}
      
      {activeTab === 'staking' && (
        <div className="space-y-6">
          {/* Staking Stats Banner */}
          <div className="bg-gradient-to-r from-abyss-purple/20 to-abyss-cyan/20 border border-abyss-cyan/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Network APY</div>
                <div className="text-2xl font-bold text-abyss-cyan">
                  {stakingStats ? `${stakingStats.apy_percent}%` : '...'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Total Staked</div>
                <div className="text-lg font-mono text-white">
                  {stakingStats ? formatCGT(stakingStats.total_staked) : '...'} CGT
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Lock Period</div>
                <div className="text-lg text-white">
                  {stakingStats ? `${stakingStats.lock_period_days} days` : '...'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Your Staking Position */}
          <div className="bg-abyss-navy/50 border border-abyss-cyan/20 rounded-lg p-6">
            <h3 className="text-lg font-bold text-abyss-cyan mb-4">Your Staking Position</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-abyss-dark/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Staked Amount</div>
                <div className="text-2xl font-mono text-white">
                  {stakeInfo ? formatCGT(stakeInfo.amount) : '0.00'}
                  <span className="text-sm text-gray-400 ml-2">CGT</span>
                </div>
              </div>
              
              <div className="bg-abyss-dark/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Pending Rewards</div>
                <div className="text-2xl font-mono text-green-400">
                  +{stakeInfo ? formatCGT(stakeInfo.pending_rewards) : '0.00'}
                  <span className="text-sm text-gray-400 ml-2">CGT</span>
                </div>
              </div>
            </div>
            
            {/* Unstake Status */}
            {stakeInfo?.has_pending_unstake && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-yellow-400 font-medium">Unstake Pending</div>
                    <div className="text-lg font-mono text-white">
                      {formatCGT(stakeInfo.unstake_amount)} CGT
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-400">
                    Unlocks in {stakingStats?.lock_period_days || 7} days
                  </div>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              {/* Stake Form */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-300">Stake CGT</div>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Amount to stake"
                  className="w-full px-3 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded text-white text-sm"
                />
                <Button
                  onClick={() => {
                    setStakingError('Staking transactions coming soon');
                  }}
                  disabled={isStaking || !stakeAmount}
                  className="w-full"
                >
                  Stake
                </Button>
              </div>
              
              {/* Unstake Form */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-300">Unstake CGT</div>
                <input
                  type="number"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  placeholder="Amount to unstake"
                  className="w-full px-3 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded text-white text-sm"
                />
                <Button
                  onClick={() => {
                    setStakingError('Unstaking transactions coming soon');
                  }}
                  disabled={isStaking || !unstakeAmount}
                  variant="secondary"
                  className="w-full"
                >
                  Request Unstake
                </Button>
              </div>
            </div>
            
            {/* Claim Rewards */}
            {stakeInfo && Number(stakeInfo.pending_rewards) > 0 && (
              <div className="mt-4">
                <Button
                  onClick={() => {
                    setStakingError('Claiming rewards coming soon');
                  }}
                  disabled={isStaking}
                  className="w-full bg-green-600 hover:bg-green-500"
                >
                  Claim {formatCGT(stakeInfo.pending_rewards)} CGT Rewards
                </Button>
              </div>
            )}
            
            {stakingError && (
              <div className="mt-4 text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                {stakingError}
              </div>
            )}
          </div>
          
          {/* Staking Info */}
          <div className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-abyss-cyan mb-2">How Staking Works</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Stake CGT to earn {stakingStats?.apy_percent || 10}% APY rewards</li>
              <li>• Minimum stake: {stakingStats ? formatCGT(stakingStats.min_stake) : '1'} CGT</li>
              <li>• Unstaking has a {stakingStats?.lock_period_days || 7}-day lock period</li>
              <li>• Rewards accrue continuously and can be claimed anytime</li>
              <li>• No maximum stake limit per address</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'cgt' && (
        <>
      
      {/* Balance Card */}
      <div className="bg-abyss-navy/50 border border-abyss-cyan/20 rounded-lg p-6 backdrop-blur-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-gray-400 mb-2">CGT Balance</div>
            <div className="text-4xl font-mono text-abyss-cyan mb-2">
              {isLoadingBalance ? '...' : (typeof balance === 'number' ? balance.toFixed(8) : String(balance))}
              <span className="text-lg text-gray-400 ml-2">CGT</span>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span>Address:</span>
              {demiurgePublicKey && <AddressDisplay address={demiurgePublicKey} truncateLength={12} />}
              <button
                onClick={() => setShowQR(!showQR)}
                className="text-abyss-cyan hover:text-abyss-cyan/80 text-xs underline"
              >
                {showQR ? 'Hide' : 'Show'} QR
              </button>
            </div>
          </div>
          
          {/* QR Code placeholder */}
          {showQR && demiurgePublicKey && (
            <div className="bg-white p-2 rounded">
              <div className="w-24 h-24 flex items-center justify-center text-xs text-gray-500 border border-gray-200">
                <div className="text-center">
                  <div className="text-2xl">📱</div>
                  <div className="text-[8px] mt-1 text-black break-all px-1">
                    {demiurgePublicKey.slice(0, 8)}...
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Staked Amount Preview */}
        {stakeInfo && Number(stakeInfo.amount) > 0 && (
          <div className="mt-4 pt-4 border-t border-abyss-cyan/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Staked:</span>
              <span className="font-mono text-abyss-purple">{formatCGT(stakeInfo.amount)} CGT</span>
            </div>
            {Number(stakeInfo.pending_rewards) > 0 && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-400">Pending Rewards:</span>
                <span className="font-mono text-green-400">+{formatCGT(stakeInfo.pending_rewards)} CGT</span>
              </div>
            )}
          </div>
        )}
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
                  <div className="flex items-center gap-1">
                    <span>To:</span> <AddressDisplay address={tx.to} truncateLength={8} />
                  </div>
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

