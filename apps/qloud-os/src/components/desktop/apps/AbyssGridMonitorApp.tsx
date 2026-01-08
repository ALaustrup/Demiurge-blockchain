/**
 * Abyss Grid Monitor Application
 * 
 * Visual map of connected peers in the Abyss Grid
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { peerDiscovery } from '../../../services/grid/discovery';
import type { GridPeer } from '../../../services/grid/types';
import { getAllVMJobs } from '../../../services/qorvm/qorvm';

export function AbyssGridMonitorApp() {
  const [peers, setPeers] = useState<GridPeer[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<GridPeer | null>(null);
  const [jobs] = useState(getAllVMJobs());
  
  useEffect(() => {
    const updatePeers = () => {
      setPeers(peerDiscovery.getPeers());
    };
    
    // Initial load
    updatePeers();
    
    // Subscribe to updates
    const unsubscribe = peerDiscovery.onPeersUpdate(updatePeers);
    
    // Also poll manually
    const interval = setInterval(updatePeers, 2000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);
  
  // Calculate orbital positions
  const getOrbitalPosition = (index: number, total: number, radius: number) => {
    const angle = (index / total) * Math.PI * 2;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };
  
  const centerX = 50; // %
  const centerY = 50; // %
  const radius = 30; // %
  
  return (
    <div className="h-full flex flex-col min-h-0 p-6 space-y-6 overflow-auto">
      <div>
        <h2 className="text-2xl font-bold text-genesis-cipher-cyan mb-2">Abyss Grid Monitor</h2>
        <p className="text-sm text-genesis-text-tertiary">Networked execution grid visualization</p>
      </div>
      
      {/* Grid Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
          <div className="text-sm text-genesis-text-tertiary mb-1">Connected Peers</div>
          <div className="text-2xl font-mono text-genesis-cipher-cyan">{peers.length}</div>
        </div>
        
        <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
          <div className="text-sm text-genesis-text-tertiary mb-1">Active Jobs</div>
          <div className="text-2xl font-mono text-abyss-purple">
            {jobs.filter(j => j.status === 'running').length}
          </div>
        </div>
        
        <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
          <div className="text-sm text-genesis-text-tertiary mb-1">Total Compute</div>
          <div className="text-2xl font-mono text-genesis-cipher-cyan">
            {peers.reduce((sum, p) => sum + p.computeScore, 0)}
          </div>
        </div>
      </div>
      
      {/* Orbital Visualization */}
      <div className="flex-1 relative bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg overflow-hidden min-h-[400px]">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(0,255,255,0.1)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          
          {/* Center node (local peer) */}
          <motion.circle
            cx={centerX}
            cy={centerY}
            r="3"
            fill="#00ffff"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <title>Local Peer</title>
          </motion.circle>
          
          {/* Orbital peers */}
          {peers.map((peer, index) => {
            const pos = getOrbitalPosition(index, Math.max(peers.length, 1), radius);
            const x = centerX + pos.x;
            const y = centerY + pos.y;
            const isSelected = selectedPeer?.peerId === peer.peerId;
            
            return (
              <g key={peer.peerId}>
                {/* Connection line */}
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={x}
                  y2={y}
                  stroke="rgba(0,255,255,0.2)"
                  strokeWidth="0.5"
                />
                
                {/* Peer node */}
                <motion.circle
                  cx={x}
                  cy={y}
                  r={isSelected ? "2.5" : "2"}
                  fill={peer.connectionStatus === 'connected' ? '#00ffff' : '#666'}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: index * 0.1 }}
                  onClick={() => setSelectedPeer(peer)}
                  style={{ cursor: 'pointer' }}
                >
                  <title>{peer.peerId}</title>
                </motion.circle>
                
                {/* Glow effect for selected */}
                {isSelected && (
                  <motion.circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="none"
                    stroke="#00ffff"
                    strokeWidth="0.5"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Peer Details Panel */}
      {selectedPeer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-genesis-cipher-cyan">Peer Details</h3>
            <button
              onClick={() => setSelectedPeer(null)}
              className="text-genesis-text-tertiary hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-genesis-text-tertiary">Peer ID:</span>
              <span className="ml-2 font-mono text-genesis-cipher-cyan">{selectedPeer.peerId}</span>
            </div>
            <div>
              <span className="text-genesis-text-tertiary">Version:</span>
              <span className="ml-2 text-white">{selectedPeer.version}</span>
            </div>
            <div>
              <span className="text-genesis-text-tertiary">Compute Score:</span>
              <span className="ml-2 text-genesis-cipher-cyan">{selectedPeer.computeScore}/100</span>
            </div>
            <div>
              <span className="text-genesis-text-tertiary">Free Memory:</span>
              <span className="ml-2 text-white">
                {(selectedPeer.freeMemory / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <div>
              <span className="text-genesis-text-tertiary">Features:</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {selectedPeer.supportedFeatures.map((feature: string) => (
                  <span
                    key={feature}
                    className="px-2 py-0.5 bg-abyss-cyan/20 text-genesis-cipher-cyan border border-genesis-border-default/30 rounded text-xs"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-genesis-text-tertiary">Status:</span>
              <span className={`ml-2 ${
                selectedPeer.connectionStatus === 'connected' ? 'text-green-400' : 'text-genesis-text-tertiary'
              }`}>
                {selectedPeer.connectionStatus}
              </span>
            </div>
            <div>
              <span className="text-genesis-text-tertiary">Last Seen:</span>
              <span className="ml-2 text-white">
                {new Date(selectedPeer.lastSeen).toLocaleTimeString()}
              </span>
            </div>
            <div>
              <span className="text-genesis-text-tertiary">ZK Capable:</span>
              <span className="ml-2 text-genesis-cipher-cyan">
                {selectedPeer.supportedFeatures.includes('zk') ? '✓ Yes' : '✗ No'}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

