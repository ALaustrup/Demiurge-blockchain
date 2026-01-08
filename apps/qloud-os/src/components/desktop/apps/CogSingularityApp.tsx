/**
 * Cognitive Singularity Console Application
 * 
 * Visualizes the self-evolving mind of Demiurge
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getMetaState } from '../../../services/kernel/metaState';
import { growthManager } from '../../../services/kernel/growthManager';
import { selfRewriteEngine } from '../../../services/autopoiesis/selfRewriteEngine';
import { spiritManager } from '../../../services/spirits/spiritManager';
import type { MetaState } from '../../../services/kernel/metaState';
import { Button } from '../../shared/Button';

export function CogSingularityApp() {
  const [metaState, setMetaState] = useState<MetaState | null>(null);
  const [mutationTree, setMutationTree] = useState<any[]>([]);
  const [growthSeeds, setGrowthSeeds] = useState<any[]>([]);
  
  useEffect(() => {
    const updateState = async () => {
      const state = await getMetaState();
      setMetaState(state);
      
      // Get growth proposal
      const proposal = await growthManager.proposeGrowth();
      setGrowthSeeds(proposal.seeds);
      
      // Get mutation history
      const modules = selfRewriteEngine.listModules();
      setMutationTree(modules.map(id => ({
        id,
        version: selfRewriteEngine.getModuleVersion(id),
      })));
    };
    
    updateState();
    const interval = setInterval(updateState, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleExecuteGrowth = async (seed: any) => {
    const result = await growthManager.executeGrowth(seed);
    if (result.success) {
      alert(`Growth executed successfully! Module: ${result.moduleId}`);
    } else {
      alert(`Growth failed: ${result.error}`);
    }
  };
  
  return (
    <div className="h-full flex flex-col min-h-0 p-6 space-y-6 overflow-auto">
      <div>
        <h2 className="text-2xl font-bold text-genesis-cipher-cyan mb-2">Cognitive Singularity Console</h2>
        <p className="text-sm text-genesis-text-tertiary">The self-evolving mind of Demiurge</p>
      </div>
      
      {/* Meta State Overview */}
      {metaState && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
            <div className="text-sm text-genesis-text-tertiary mb-1">Cognition Load</div>
            <div className="text-2xl font-mono text-genesis-cipher-cyan">
              {metaState.cognition.runningTasks}
            </div>
          </div>
          
          <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
            <div className="text-sm text-genesis-text-tertiary mb-1">Stability</div>
            <div className={`text-2xl font-mono ${
              metaState.stability.isStable ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {metaState.stability.isStable ? '✓ Stable' : '⚠ Unstable'}
            </div>
          </div>
          
          <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
            <div className="text-sm text-genesis-text-tertiary mb-1">Spirit Fitness</div>
            <div className="text-2xl font-mono text-abyss-purple">
              {metaState.spirits.averageFitness.toFixed(1)}
            </div>
          </div>
          
          <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
            <div className="text-sm text-genesis-text-tertiary mb-1">Growth Ready</div>
            <div className={`text-2xl font-mono ${
              metaState.growth.canProceed ? 'text-green-400' : 'text-genesis-text-tertiary'
            }`}>
              {metaState.growth.canProceed ? '✓ Yes' : '✗ No'}
            </div>
          </div>
        </div>
      )}
      
      {/* Mutation Tree */}
      <div className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-genesis-cipher-cyan mb-4">Mutation Tree</h3>
        <div className="space-y-2">
          {mutationTree.length > 0 ? (
            mutationTree.map((module, i) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-3 bg-abyss-navy/30 rounded"
              >
                <div>
                  <div className="font-mono text-sm text-genesis-cipher-cyan">{module.id.slice(0, 32)}...</div>
                  <div className="text-xs text-genesis-text-tertiary">Version {module.version}</div>
                </div>
                <div className="text-xs text-gray-500">Mutated</div>
              </motion.div>
            ))
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">No mutations yet</div>
          )}
        </div>
      </div>
      
      {/* Growth Seeds */}
      {growthSeeds.length > 0 && (
        <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-6">
          <h3 className="text-lg font-bold text-genesis-cipher-cyan mb-4">Growth Seeds</h3>
          <div className="space-y-3">
            {growthSeeds.map((seed, i) => (
              <motion.div
                key={seed.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 bg-genesis-glass-light/50 rounded border border-genesis-border-default/20"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-genesis-cipher-cyan">{seed.name}</h4>
                  <span className="text-xs px-2 py-1 bg-abyss-purple/20 text-abyss-purple border border-abyss-purple/30 rounded">
                    Priority: {seed.priority}
                  </span>
                </div>
                <p className="text-sm text-genesis-text-secondary mb-3">{seed.spec}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-genesis-text-tertiary">Source: {seed.source}</span>
                  <span className="text-xs text-genesis-text-tertiary">Complexity: {seed.estimatedComplexity}</span>
                  <button
                    className="px-3 py-1 text-xs bg-genesis-glass-light border border-genesis-border-default/20 rounded hover:border-genesis-border-default/50 text-genesis-cipher-cyan"
                    onClick={() => handleExecuteGrowth(seed)}
                  >
                    Execute Growth
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      {/* Kernel Decision */}
      {metaState && (
        <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
          <h3 className="text-lg font-bold text-genesis-cipher-cyan mb-2">Kernel Decision</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-genesis-text-tertiary">Action:</span>
              <span className="ml-2 text-genesis-cipher-cyan font-bold">{metaState.growth.decision.action}</span>
            </div>
            <div>
              <span className="text-genesis-text-tertiary">Priority:</span>
              <span className="ml-2 text-white">{metaState.growth.decision.priority}/100</span>
            </div>
            <div>
              <span className="text-genesis-text-tertiary">Reasoning:</span>
              <div className="mt-1 text-genesis-text-secondary">{metaState.growth.decision.reasoning}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Prediction */}
      {metaState && (
        <div className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-4">
          <h3 className="text-lg font-bold text-genesis-cipher-cyan mb-2">Short-Term Prediction</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-genesis-text-tertiary">Chain Height:</span>
              <span className="ml-2 text-white">{metaState.prediction.chainHeight}</span>
            </div>
            <div>
              <span className="text-genesis-text-tertiary">Grid Load:</span>
              <span className="ml-2 text-white">{(metaState.prediction.gridLoad * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-genesis-text-tertiary">Confidence:</span>
              <span className="ml-2 text-white">{(metaState.prediction.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

