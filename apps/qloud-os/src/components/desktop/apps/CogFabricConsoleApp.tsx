/**
 * Cognitive Fabric Console Application
 * 
 * Visualizes the mind of Demiurge
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { vectorStore } from '../../../services/neural/vectorStore';
import { getCognitionState } from '../../../services/cogfabrik/cognitionState';
import { spiritCoordinator } from '../../../services/cogfabrik/spiritCoordinator';
import { getMiningStats } from '../../../services/mining/rewardEngine';
import { spiritManager } from '../../../services/spirits/spiritManager';
import { peerDiscovery } from '../../../services/grid/discovery';
import type { CognitionState } from '../../../services/cogfabrik/cognitionState';

export function CogFabricConsoleApp() {
  const [cognitionState, setCognitionState] = useState<CognitionState | null>(null);
  const [vectorCount, setVectorCount] = useState(0);
  const [miningStats, setMiningStats] = useState<any>(null);
  const [spirits, setSpirits] = useState(0);
  const [peers, setPeers] = useState(0);
  
  useEffect(() => {
    const updateState = async () => {
      const state = await getCognitionState();
      setCognitionState(state);
      setVectorCount(vectorStore.getAllVectors().length);
      setMiningStats(getMiningStats());
      setSpirits(spiritManager.getAllSpirits().length);
      setPeers(peerDiscovery.getPeers().length);
    };
    
    updateState();
    const interval = setInterval(updateState, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="h-full flex flex-col min-h-0 p-6 space-y-6 overflow-auto">
      <div>
        <h2 className="text-2xl font-bold text-genesis-cipher-cyan mb-2">Cognitive Fabric Console</h2>
        <p className="text-sm text-genesis-text-tertiary">The mind of Demiurge</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
          <div className="text-sm text-genesis-text-tertiary mb-1">Neural Vectors</div>
          <div className="text-2xl font-mono text-genesis-cipher-cyan">{vectorCount}</div>
        </div>
        
        <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
          <div className="text-sm text-genesis-text-tertiary mb-1">Active Spirits</div>
          <div className="text-2xl font-mono text-abyss-purple">{spirits}</div>
        </div>
        
        <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
          <div className="text-sm text-genesis-text-tertiary mb-1">Grid Peers</div>
          <div className="text-2xl font-mono text-genesis-cipher-cyan">{peers}</div>
        </div>
        
        <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
          <div className="text-sm text-genesis-text-tertiary mb-1">CGT Mined</div>
          <div className="text-2xl font-mono text-abyss-purple">
            {miningStats?.totalReward.toFixed(4) || '0.0000'}
          </div>
        </div>
      </div>
      
      {/* Neural Graph Visualization */}
      <div className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-6 min-h-[300px]">
        <h3 className="text-lg font-bold text-genesis-cipher-cyan mb-4">Neural Graph</h3>
        <div className="relative w-full h-full">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            {/* Grid background */}
            <defs>
              <pattern id="neuralGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(0,255,255,0.1)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#neuralGrid)" />
            
            {/* Neural nodes (simplified visualization) */}
            {Array.from({ length: Math.min(vectorCount, 20) }).map((_, i) => {
              const angle = (i / Math.min(vectorCount, 20)) * Math.PI * 2;
              const radius = 30;
              const x = 50 + Math.cos(angle) * radius;
              const y = 50 + Math.sin(angle) * radius;
              
              return (
                <motion.circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="1.5"
                  fill="#00ffff"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.8 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 200 }}
                >
                  <title>Neural Vector {i + 1}</title>
                </motion.circle>
              );
            })}
            
            {/* Connections */}
            {Array.from({ length: Math.min(vectorCount, 20) }).map((_, i) => {
              const angle1 = (i / Math.min(vectorCount, 20)) * Math.PI * 2;
              const angle2 = ((i + 1) / Math.min(vectorCount, 20)) * Math.PI * 2;
              const radius = 30;
              const x1 = 50 + Math.cos(angle1) * radius;
              const y1 = 50 + Math.sin(angle1) * radius;
              const x2 = 50 + Math.cos(angle2) * radius;
              const y2 = 50 + Math.sin(angle2) * radius;
              
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(0,255,255,0.3)"
                  strokeWidth="0.5"
                />
              );
            })}
          </svg>
        </div>
      </div>
      
      {/* Mining Stats */}
      {miningStats && (
        <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
          <h3 className="text-lg font-bold text-genesis-cipher-cyan mb-4">Compute Mining Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-genesis-text-tertiary">Total Cycles</div>
              <div className="text-xl font-mono text-genesis-cipher-cyan">{miningStats.cycles.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-genesis-text-tertiary">ZK Proofs</div>
              <div className="text-xl font-mono text-abyss-purple">{miningStats.zkProofWeight.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-genesis-text-tertiary">Neural Contributions</div>
              <div className="text-xl font-mono text-genesis-cipher-cyan">{miningStats.neuralContributionScore.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-genesis-text-tertiary">Total Reward (CGT)</div>
              <div className="text-xl font-mono text-abyss-purple">{miningStats.totalReward.toFixed(4)}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Cognition State */}
      {cognitionState && (
        <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
          <h3 className="text-lg font-bold text-genesis-cipher-cyan mb-4">Cognition State</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-genesis-text-tertiary">Vector Count:</span>
              <span className="ml-2 text-white">{cognitionState.vectorCount}</span>
            </div>
            <div>
              <span className="text-genesis-text-tertiary">Active Spirits:</span>
              <span className="ml-2 text-white">{cognitionState.activeSpirits}</span>
            </div>
            <div>
              <span className="text-genesis-text-tertiary">Running Tasks:</span>
              <span className="ml-2 text-white">{cognitionState.runningTasks}</span>
            </div>
            <div>
              <span className="text-genesis-text-tertiary">Last Update:</span>
              <span className="ml-2 text-white">
                {new Date(cognitionState.lastUpdate).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

