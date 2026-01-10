/**
 * Mining Accounting Application
 * 
 * Comprehensive mining operations dashboard with:
 * - Real-time mining stats
 * - Historical data
 * - Reward tracking
 * - Manual adjustment requests
 */

import { useState, useEffect } from 'react';
import { useQorID } from '../../../hooks/useAbyssID';
import { demiurgeRpc } from '../../../lib/demiurgeRpcClient';

interface MiningSession {
  id: string;
  gameId: string;
  sessionId: string;
  startTime: number;
  endTime?: number;
  depthMetric: number;
  activeMs: number;
  claimsSubmitted: number;
  totalRewards: number;
  status: 'active' | 'completed' | 'paused';
}

interface WorkClaim {
  id: string;
  sessionId: string;
  gameId: string;
  depthMetric: number;
  activeMs: number;
  reward: number;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  blockHeight?: number;
  timestamp: number;
}

interface AdjustmentRequest {
  id: string;
  reason: string;
  requestedAmount: number;
  evidence: string[];
  status: 'pending' | 'approved' | 'rejected';
  response?: string;
  createdAt: number;
  updatedAt: number;
}

export function MiningAccountingApp() {
  const { session } = useQorID();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'adjustments'>('dashboard');
  const [sessions, setSessions] = useState<MiningSession[]>([]);
  const [claims, setClaims] = useState<WorkClaim[]>([]);
  const [adjustments, setAdjustments] = useState<AdjustmentRequest[]>([]);
  const [currentSession, setCurrentSession] = useState<MiningSession | null>(null);
  const [isMining, setIsMining] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('mining_sessions');
    const savedClaims = localStorage.getItem('mining_claims');
    const savedAdjustments = localStorage.getItem('mining_adjustments');
    
    if (savedSessions) setSessions(JSON.parse(savedSessions));
    if (savedClaims) setClaims(JSON.parse(savedClaims));
    if (savedAdjustments) setAdjustments(JSON.parse(savedAdjustments));
  }, []);

  // Calculate stats
  const totalSessions = sessions.length;
  const totalClaims = claims.length;
  const totalRewards = claims
    .filter(c => c.status === 'confirmed')
    .reduce((sum, c) => sum + c.reward, 0);
  const pendingRewards = claims
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + c.reward, 0);
  const averageDepth = claims.length > 0
    ? claims.reduce((sum, c) => sum + c.depthMetric, 0) / claims.length
    : 0;

  const handleStartMining = () => {
    const session: MiningSession = {
      id: `session-${Date.now()}`,
      gameId: 'mandelbrot',
      sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      depthMetric: 0,
      activeMs: 0,
      claimsSubmitted: 0,
      totalRewards: 0,
      status: 'active',
    };
    
    setCurrentSession(session);
    setIsMining(true);
    setSessions(prev => [session, ...prev]);
    localStorage.setItem('mining_sessions', JSON.stringify([session, ...sessions]));
  };

  const handleStopMining = () => {
    if (currentSession) {
      const updated = {
        ...currentSession,
        endTime: Date.now(),
        status: 'completed' as const,
      };
      setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
      setCurrentSession(null);
      setIsMining(false);
      localStorage.setItem('mining_sessions', JSON.stringify(sessions));
    }
  };

  const handleSubmitClaim = async () => {
    if (!currentSession || !session) return;
    
    // Calculate reward (simplified - in production, use actual formula)
    const reward = (currentSession.depthMetric * 100) + (currentSession.activeMs / 1000 * 0.1);
    const rewardInSmallestUnits = Math.floor(reward * 100_000_000);
    
    try {
      // Submit work claim via RPC
      const result = await demiurgeRpc.submitWorkClaim({
        game_id: currentSession.gameId,
        session_id: currentSession.sessionId,
        depth_metric: currentSession.depthMetric,
        active_ms: currentSession.activeMs,
      });
      
      const claim: WorkClaim = {
        id: `claim-${Date.now()}`,
        sessionId: currentSession.sessionId,
        gameId: currentSession.gameId,
        depthMetric: currentSession.depthMetric,
        activeMs: currentSession.activeMs,
        reward: reward,
        status: 'pending',
        timestamp: Date.now(),
      };
      
      setClaims(prev => [claim, ...prev]);
      localStorage.setItem('mining_claims', JSON.stringify([claim, ...claims]));
    } catch (error) {
      console.error('Failed to submit claim:', error);
    }
  };

  const handleRequestAdjustment = () => {
    // Open adjustment request modal
    // Implementation in separate component
  };

  return (
    <div className="w-full h-full bg-genesis-glass-light text-white flex flex-col">
      {/* Header */}
      <div className="h-16 bg-abyss-navy/50 border-b border-genesis-border-default/20 flex items-center justify-between px-6">
        <h2 className="text-xl font-bold text-genesis-cipher-cyan">Mining Accounting</h2>
        <div className="flex items-center gap-2">
          {!isMining ? (
            <button
              onClick={handleStartMining}
              className="px-4 py-2 bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30 hover:border-green-500/60 hover:shadow-[0_0_12px_rgba(34,197,94,0.4)] rounded transition-all"
            >
              Start Mining
            </button>
          ) : (
            <button
              onClick={handleStopMining}
              className="px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 hover:border-red-500/60 hover:shadow-[0_0_12px_rgba(239,68,68,0.4)] rounded transition-all"
            >
              Stop Mining
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="h-12 border-b border-genesis-border-default/20 flex items-center gap-1 px-6">
        {(['dashboard', 'history', 'adjustments'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg border border-b-0 transition-all ${
              activeTab === tab
                ? 'bg-abyss-cyan/20 border-genesis-border-default/50 text-genesis-cipher-cyan'
                : 'bg-transparent border-transparent text-genesis-text-tertiary hover:text-genesis-cipher-cyan hover:bg-abyss-cyan/10'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Current Session */}
            {currentSession && (
              <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-6">
                <h3 className="text-lg font-bold text-genesis-cipher-cyan mb-4">Current Mining Session</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-genesis-text-tertiary mb-1">Depth Metric</div>
                    <div className="text-2xl font-mono text-genesis-cipher-cyan">{currentSession.depthMetric.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-genesis-text-tertiary mb-1">Active Time</div>
                    <div className="text-2xl font-mono text-genesis-cipher-cyan">
                      {Math.floor(currentSession.activeMs / 1000)}s
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-genesis-text-tertiary mb-1">Claims Submitted</div>
                    <div className="text-2xl font-mono text-genesis-cipher-cyan">{currentSession.claimsSubmitted}</div>
                  </div>
                  <div>
                    <div className="text-xs text-genesis-text-tertiary mb-1">Total Rewards</div>
                    <div className="text-2xl font-mono text-genesis-cipher-cyan">
                      {currentSession.totalRewards.toFixed(8)} CGT
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSubmitClaim}
                  className="mt-4 px-4 py-2 bg-abyss-cyan/20 border border-genesis-border-default/40 text-genesis-cipher-cyan hover:bg-abyss-cyan/30 hover:border-genesis-border-default/60 hover:shadow-[0_0_12px_rgba(0,255,255,0.4)] rounded transition-all"
                >
                  Submit Work Claim
                </button>
              </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
                <div className="text-xs text-genesis-text-tertiary mb-1">Total Sessions</div>
                <div className="text-2xl font-mono text-genesis-cipher-cyan">{totalSessions}</div>
              </div>
              <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
                <div className="text-xs text-genesis-text-tertiary mb-1">Total Claims</div>
                <div className="text-2xl font-mono text-genesis-cipher-cyan">{totalClaims}</div>
              </div>
              <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
                <div className="text-xs text-genesis-text-tertiary mb-1">Total Rewards</div>
                <div className="text-2xl font-mono text-genesis-cipher-cyan">{totalRewards.toFixed(8)}</div>
                <div className="text-xs text-gray-500">CGT</div>
              </div>
              <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
                <div className="text-xs text-genesis-text-tertiary mb-1">Pending Rewards</div>
                <div className="text-2xl font-mono text-yellow-400">{pendingRewards.toFixed(8)}</div>
                <div className="text-xs text-gray-500">CGT</div>
              </div>
            </div>

            {/* Recent Claims */}
            <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-6">
              <h3 className="text-lg font-bold text-genesis-cipher-cyan mb-4">Recent Work Claims</h3>
              <div className="space-y-2">
                {claims.slice(0, 10).map(claim => (
                  <div
                    key={claim.id}
                    className="flex items-center justify-between p-3 bg-genesis-glass-light/50 rounded border border-genesis-border-default/10"
                  >
                    <div>
                      <div className="text-sm font-mono text-genesis-cipher-cyan">
                        Depth: {claim.depthMetric.toFixed(2)} | Time: {Math.floor(claim.activeMs / 1000)}s
                      </div>
                      <div className="text-xs text-genesis-text-tertiary">
                        {new Date(claim.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono text-genesis-cipher-cyan">
                        {claim.reward.toFixed(8)} CGT
                      </div>
                      <div className={`text-xs ${
                        claim.status === 'confirmed' ? 'text-green-400' :
                        claim.status === 'pending' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {claim.status}
                      </div>
                    </div>
                  </div>
                ))}
                {claims.length === 0 && (
                  <div className="text-center text-genesis-text-tertiary py-8">No claims yet</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-genesis-cipher-cyan">Mining History</h3>
            {sessions.map(session => (
              <div
                key={session.id}
                className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-genesis-cipher-cyan">{session.sessionId}</div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    session.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    session.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-genesis-text-tertiary'
                  }`}>
                    {session.status}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-genesis-text-tertiary">Claims</div>
                    <div className="text-genesis-cipher-cyan">{session.claimsSubmitted}</div>
                  </div>
                  <div>
                    <div className="text-genesis-text-tertiary">Rewards</div>
                    <div className="text-genesis-cipher-cyan">{session.totalRewards.toFixed(8)} CGT</div>
                  </div>
                  <div>
                    <div className="text-genesis-text-tertiary">Duration</div>
                    <div className="text-genesis-cipher-cyan">
                      {session.endTime
                        ? `${Math.floor((session.endTime - session.startTime) / 1000)}s`
                        : 'Active'}
                    </div>
                  </div>
                  <div>
                    <div className="text-genesis-text-tertiary">Started</div>
                    <div className="text-genesis-cipher-cyan text-xs">
                      {new Date(session.startTime).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="text-center text-genesis-text-tertiary py-8">No mining sessions yet</div>
            )}
          </div>
        )}

        {activeTab === 'adjustments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-genesis-cipher-cyan">Adjustment Requests</h3>
              <button
                onClick={handleRequestAdjustment}
                className="px-4 py-2 bg-abyss-cyan/20 border border-genesis-border-default/40 text-genesis-cipher-cyan hover:bg-abyss-cyan/30 hover:border-genesis-border-default/60 hover:shadow-[0_0_12px_rgba(0,255,255,0.4)] rounded transition-all"
              >
                Request Adjustment
              </button>
            </div>
            {adjustments.map(adj => (
              <div
                key={adj.id}
                className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-genesis-cipher-cyan">{adj.reason}</div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    adj.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    adj.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {adj.status}
                  </div>
                </div>
                <div className="text-sm text-genesis-text-secondary mb-2">{adj.reason}</div>
                <div className="text-sm font-mono text-genesis-cipher-cyan">
                  Requested: {adj.requestedAmount.toFixed(8)} CGT
                </div>
                {adj.response && (
                  <div className="mt-2 text-xs text-genesis-text-tertiary">{adj.response}</div>
                )}
              </div>
            ))}
            {adjustments.length === 0 && (
              <div className="text-center text-genesis-text-tertiary py-8">No adjustment requests</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
