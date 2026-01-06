/**
 * Mandelbrot Miner Application
 * 
 * Arcade-style mining game that earns CGT through work claims.
 * Features real-time earnings dashboard and mining statistics.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAbyssIDIdentity } from '../../../hooks/useAbyssIDIdentity';
import { useBlockListener } from '../../../context/BlockListenerContext';
import { Button } from '../../shared/Button';

const RPC_URL = import.meta.env.VITE_DEMIURGE_RPC_URL || 'https://rpc.demiurge.cloud/rpc';

interface MiningSession {
  sessionId: string;
  startTime: number;
  depthMetric: number;
  activeMs: number;
  status: 'active' | 'submitted' | 'rewarded';
  reward?: number;
}

interface MiningStats {
  totalSessions: number;
  totalDepth: number;
  totalRewards: number;
  averageReward: number;
  bestSession: number;
}

interface WorkClaimHistory {
  id: string;
  timestamp: number;
  depthMetric: number;
  activeMs: number;
  reward: number;
  txHash?: string;
}

export function MinerApp() {
  const { identity, demiurgePublicKey } = useAbyssIDIdentity();
  const { currentBlockHeight } = useBlockListener();
  
  const [isMining, setIsMining] = useState(false);
  const [currentSession, setCurrentSession] = useState<MiningSession | null>(null);
  const [miningStats, setMiningStats] = useState<MiningStats>({
    totalSessions: 0,
    totalDepth: 0,
    totalRewards: 0,
    averageReward: 0,
    bestSession: 0,
  });
  const [claimHistory, setClaimHistory] = useState<WorkClaimHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mining animation state
  const [zoom, setZoom] = useState(1);
  const [iterations, setIterations] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  
  // Load mining history from localStorage
  useEffect(() => {
    if (demiurgePublicKey) {
      const saved = localStorage.getItem(`miner_history_${demiurgePublicKey.slice(0, 16)}`);
      if (saved) {
        try {
          const { history, stats } = JSON.parse(saved);
          setClaimHistory(history || []);
          setMiningStats(stats || miningStats);
        } catch (e) {
          console.error('Failed to load mining history:', e);
        }
      }
    }
  }, [demiurgePublicKey]);
  
  // Save mining history
  const saveHistory = useCallback((history: WorkClaimHistory[], stats: MiningStats) => {
    if (demiurgePublicKey) {
      localStorage.setItem(
        `miner_history_${demiurgePublicKey.slice(0, 16)}`,
        JSON.stringify({ history, stats })
      );
    }
  }, [demiurgePublicKey]);
  
  // Mandelbrot set calculation
  const calculateMandelbrot = useCallback((x: number, y: number, maxIter: number): number => {
    let real = 0;
    let imag = 0;
    let iter = 0;
    
    while (real * real + imag * imag <= 4 && iter < maxIter) {
      const tempReal = real * real - imag * imag + x;
      imag = 2 * real * imag + y;
      real = tempReal;
      iter++;
    }
    
    return iter;
  }, []);
  
  // Draw Mandelbrot set
  const drawMandelbrot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.createImageData(width, height);
    
    const centerX = -0.5;
    const centerY = 0;
    const scale = 3 / zoom;
    const maxIter = Math.min(100 + Math.floor(zoom * 10), 500);
    
    let totalIter = 0;
    
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const x = centerX + (px - width / 2) * scale / width;
        const y = centerY + (py - height / 2) * scale / height;
        
        const iter = calculateMandelbrot(x, y, maxIter);
        totalIter += iter;
        
        const idx = (py * width + px) * 4;
        
        if (iter === maxIter) {
          imageData.data[idx] = 0;
          imageData.data[idx + 1] = 0;
          imageData.data[idx + 2] = 0;
        } else {
          const hue = (iter / maxIter) * 360;
          const [r, g, b] = hslToRgb(hue / 360, 1, 0.5);
          imageData.data[idx] = r;
          imageData.data[idx + 1] = g;
          imageData.data[idx + 2] = b;
        }
        imageData.data[idx + 3] = 255;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    setIterations(totalIter);
    
    return totalIter;
  }, [zoom, calculateMandelbrot]);
  
  // HSL to RGB conversion
  const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };
  
  // Mining loop
  const miningLoop = useCallback(() => {
    if (!isMining) return;
    
    // Slowly zoom in
    setZoom(prev => prev * 1.002);
    
    const totalIter = drawMandelbrot();
    
    // Update session depth metric
    setCurrentSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        depthMetric: prev.depthMetric + (totalIter || 0) / 1000000,
        activeMs: Date.now() - startTimeRef.current,
      };
    });
    
    animationRef.current = requestAnimationFrame(miningLoop);
  }, [isMining, drawMandelbrot]);
  
  // Start/stop mining effect
  useEffect(() => {
    if (isMining) {
      animationRef.current = requestAnimationFrame(miningLoop);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isMining, miningLoop]);
  
  // Initial draw
  useEffect(() => {
    drawMandelbrot();
  }, []);
  
  const startMining = () => {
    if (!identity) {
      setError('Please log in with AbyssID to start mining');
      return;
    }
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    startTimeRef.current = Date.now();
    setZoom(1);
    
    setCurrentSession({
      sessionId,
      startTime: Date.now(),
      depthMetric: 0,
      activeMs: 0,
      status: 'active',
    });
    
    setIsMining(true);
    setError(null);
  };
  
  const stopMining = async () => {
    setIsMining(false);
    
    if (!currentSession || !demiurgePublicKey) return;
    
    // Submit work claim
    setIsSubmitting(true);
    setError(null);
    
    try {
      const workClaim = {
        address: demiurgePublicKey,
        game_id: 'mandelbrot_miner',
        session_id: currentSession.sessionId,
        depth_metric: currentSession.depthMetric,
        active_ms: currentSession.activeMs,
        extra: JSON.stringify({
          final_zoom: zoom,
          iterations: iterations,
        }),
      };
      
      const response = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'work_submitClaim',
          params: workClaim,
          id: Date.now(),
        }),
      });
      
      const json = await response.json();
      
      if (json.error) {
        throw new Error(json.error.message || 'Work claim failed');
      }
      
      // Calculate reward (same formula as on-chain)
      const depthReward = currentSession.depthMetric * 100; // DEPTH_FACTOR
      const timeReward = (currentSession.activeMs / 1000) * 0.1; // TIME_FACTOR
      const reward = Math.min(depthReward + timeReward, 1000000); // MAX_REWARD_PER_CLAIM in CGT
      
      // Add to history
      const historyEntry: WorkClaimHistory = {
        id: currentSession.sessionId,
        timestamp: Date.now(),
        depthMetric: currentSession.depthMetric,
        activeMs: currentSession.activeMs,
        reward,
        txHash: json.result?.tx_hash,
      };
      
      const newHistory = [historyEntry, ...claimHistory].slice(0, 50);
      
      // Update stats
      const newStats: MiningStats = {
        totalSessions: miningStats.totalSessions + 1,
        totalDepth: miningStats.totalDepth + currentSession.depthMetric,
        totalRewards: miningStats.totalRewards + reward,
        averageReward: (miningStats.totalRewards + reward) / (miningStats.totalSessions + 1),
        bestSession: Math.max(miningStats.bestSession, reward),
      };
      
      setClaimHistory(newHistory);
      setMiningStats(newStats);
      saveHistory(newHistory, newStats);
      
      setCurrentSession({
        ...currentSession,
        status: 'rewarded',
        reward,
      });
      
    } catch (err: any) {
      console.error('Work claim error:', err);
      setError(err.message || 'Failed to submit work claim');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };
  
  const formatCGT = (amount: number): string => {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  };

  return (
    <div className="h-full flex flex-col min-h-0 p-6 space-y-4 overflow-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-abyss-cyan mb-2">Mandelbrot Miner</h2>
        <p className="text-sm text-gray-400">Mine CGT by exploring the infinite depths of the Mandelbrot set</p>
      </div>
      
      {/* Mining Canvas & Controls */}
      <div className="grid grid-cols-2 gap-4">
        {/* Canvas */}
        <div className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-4">
          <canvas
            ref={canvasRef}
            width={280}
            height={200}
            className="w-full rounded border border-abyss-cyan/30"
          />
          
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-gray-400">
              Zoom: {zoom.toFixed(2)}x
            </div>
            <div className="text-xs text-gray-400">
              Iterations: {iterations.toLocaleString()}
            </div>
          </div>
          
          <div className="mt-4">
            {!isMining ? (
              <Button
                onClick={startMining}
                disabled={!identity}
                className="w-full"
              >
                {identity ? 'Start Mining' : 'Log in to Mine'}
              </Button>
            ) : (
              <Button
                onClick={stopMining}
                disabled={isSubmitting}
                variant="secondary"
                className="w-full"
              >
                {isSubmitting ? 'Submitting...' : 'Stop & Claim Reward'}
              </Button>
            )}
          </div>
        </div>
        
        {/* Current Session Stats */}
        <div className="space-y-4">
          <div className="bg-abyss-navy/50 border border-abyss-cyan/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-abyss-cyan mb-3">Current Session</h3>
            
            {currentSession ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-medium ${
                    currentSession.status === 'active' ? 'text-green-400' :
                    currentSession.status === 'rewarded' ? 'text-abyss-cyan' :
                    'text-yellow-400'
                  }`}>
                    {currentSession.status === 'active' ? '⚡ Mining' :
                     currentSession.status === 'rewarded' ? '✓ Rewarded' :
                     '⏳ Pending'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Duration:</span>
                  <span className="font-mono text-white">{formatDuration(currentSession.activeMs)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Depth Metric:</span>
                  <span className="font-mono text-white">{currentSession.depthMetric.toFixed(4)}</span>
                </div>
                {currentSession.reward !== undefined && (
                  <div className="flex justify-between text-sm pt-2 border-t border-abyss-cyan/20">
                    <span className="text-gray-400">Reward:</span>
                    <span className="font-mono text-green-400">+{formatCGT(currentSession.reward)} CGT</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                Start mining to begin earning CGT
              </div>
            )}
          </div>
          
          {/* Lifetime Stats */}
          <div className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-abyss-cyan mb-3">Lifetime Stats</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Sessions:</span>
                <span className="ml-2 text-white">{miningStats.totalSessions}</span>
              </div>
              <div>
                <span className="text-gray-400">Total Rewards:</span>
                <span className="ml-2 text-green-400">{formatCGT(miningStats.totalRewards)}</span>
              </div>
              <div>
                <span className="text-gray-400">Avg Reward:</span>
                <span className="ml-2 text-white">{formatCGT(miningStats.averageReward)}</span>
              </div>
              <div>
                <span className="text-gray-400">Best Session:</span>
                <span className="ml-2 text-abyss-cyan">{formatCGT(miningStats.bestSession)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
          {error}
        </div>
      )}
      
      {/* Mining History */}
      <div className="flex-1 min-h-0">
        <h3 className="text-lg font-bold text-abyss-cyan mb-3">Mining History</h3>
        
        {claimHistory.length === 0 ? (
          <div className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-8 text-center">
            <div className="text-4xl mb-2">🔷</div>
            <div className="text-gray-400 text-sm">No mining sessions yet</div>
            <div className="text-gray-500 text-xs mt-1">Start mining to earn CGT rewards</div>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-auto">
            {claimHistory.map((claim) => (
              <div
                key={claim.id}
                className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-3 hover:border-abyss-cyan/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-400">
                      {new Date(claim.timestamp).toLocaleDateString()}{' '}
                      {new Date(claim.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDuration(claim.activeMs)}
                    </div>
                  </div>
                  <div className="text-sm font-mono text-green-400">
                    +{formatCGT(claim.reward)} CGT
                  </div>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Depth: {claim.depthMetric.toFixed(4)}
                  {claim.txHash && (
                    <span className="ml-2">
                      TX: {claim.txHash.slice(0, 12)}...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Info Box */}
      <div className="bg-abyss-dark/50 border border-abyss-cyan/20 rounded-lg p-4">
        <h4 className="text-sm font-medium text-abyss-cyan mb-2">How Mining Works</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Explore the Mandelbrot set by zooming in - deeper = more rewards</li>
          <li>• Longer mining sessions earn more CGT</li>
          <li>• Reward formula: (depth × 100) + (seconds × 0.1) CGT</li>
          <li>• Maximum reward per session: 1,000,000 CGT</li>
          <li>• Work claims are verified on-chain</li>
        </ul>
      </div>
    </div>
  );
}
