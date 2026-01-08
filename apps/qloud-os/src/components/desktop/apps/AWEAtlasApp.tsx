/**
 * World Atlas Application
 * 
 * Browse and manage all worlds
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { aweManager } from '../../../awe/aweManager';
import { abyssIdSDK } from '../../../services/qorid/sdk';
import { loadWorldFromDRC369, isAWEWorld, extractWorldMetadata } from '../../../services/drc369/aweWorld';
import type { DRC369 } from '../../../services/drc369/schema';
import { Button } from '../../shared/Button';

export function AWEAtlasApp() {
  const [localWorlds, setLocalWorlds] = useState<string[]>([]);
  const [chainWorlds, setChainWorlds] = useState<DRC369[]>([]);
  const [selectedWorld, setSelectedWorld] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadWorlds();
  }, []);
  
  const loadWorlds = async () => {
    setLoading(true);
    try {
      // Load local worlds
      const worldIds = aweManager.getWorldIds();
      setLocalWorlds(worldIds);
      
      // Load chain worlds
      const owned = await abyssIdSDK.drc369.getOwned({});
      const publicAssets = await abyssIdSDK.drc369.getPublic({});
      const allAssets = [...owned, ...publicAssets];
      const aweWorlds = allAssets.filter(isAWEWorld);
      setChainWorlds(aweWorlds);
    } catch (error) {
      console.error('[AWE Atlas] Failed to load worlds:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLoadFromChain = async (assetId: string) => {
    try {
      const state = await loadWorldFromDRC369(assetId);
      if (state) {
        const { WorldEngine } = await import('../../../awe/engine/worldEngine');
        const engine = new WorldEngine(state);
        const newWorldId = aweManager.addWorld(engine);
        setLocalWorlds([...localWorlds, state.id]);
        alert(`World ${state.id} loaded from chain`);
      }
    } catch (error) {
      alert(`Failed to load world: ${error}`);
    }
  };
  
  const handleForkWorld = async (worldId: string) => {
    const engine = aweManager.getWorld(worldId);
    if (!engine) return;
    
    const state = engine.getState();
    const newWorldId = aweManager.createWorld(state.seed + '_fork', {
      ...state,
      id: undefined as any,
      tick: 0,
    });
    setLocalWorlds([...localWorlds, newWorldId]);
    alert(`World forked: ${newWorldId}`);
  };
  
  return (
    <div className="h-full flex flex-col min-h-0 p-6 space-y-4 overflow-auto">
      <div>
        <h2 className="text-2xl font-bold text-genesis-cipher-cyan mb-2">World Atlas</h2>
        <p className="text-sm text-genesis-text-tertiary">Browse and manage all worlds</p>
      </div>
      
      {loading && (
        <div className="text-genesis-text-tertiary text-center py-8">Loading worlds...</div>
      )}
      
      {/* Local Worlds */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-genesis-cipher-cyan mb-2">Local Worlds</h3>
          {localWorlds.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {localWorlds.map(worldId => {
                const engine = aweManager.getWorld(worldId);
                const state = engine?.getState();
                return (
                  <motion.div
                    key={worldId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-4 space-y-2"
                  >
                    <div className="font-mono text-sm text-genesis-cipher-cyan truncate">{worldId}</div>
                    {state && (
                      <>
                        <div className="text-xs text-genesis-text-tertiary">
                          Tick: {state.tick} | Entities: {state.entities.size} | Species: {state.species.size}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleForkWorld(worldId)}
                            className="text-xs px-2 py-1"
                          >
                            Fork
                          </Button>
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">No local worlds</div>
          )}
        </div>
        
        {/* Chain Worlds */}
        <div>
          <h3 className="text-lg font-medium text-genesis-cipher-cyan mb-2">On-Chain Worlds (DRC-369)</h3>
          {chainWorlds.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chainWorlds.map(asset => {
                const metadata = extractWorldMetadata(asset);
                return (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-abyss-purple/20 border border-abyss-purple/30 rounded-lg p-4 space-y-2"
                  >
                    <div className="font-mono text-sm text-abyss-purple truncate">{asset.id.slice(0, 16)}...</div>
                    {metadata && (
                      <>
                        <div className="text-xs text-genesis-text-tertiary">
                          Species: {metadata.speciesCount} | Ticks: {metadata.totalTicks}
                        </div>
                        <Button
                          onClick={() => handleLoadFromChain(asset.id)}
                          className="text-xs px-2 py-1"
                        >
                          Load
                        </Button>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">No on-chain worlds</div>
          )}
        </div>
      </div>
    </div>
  );
}

