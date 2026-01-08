/**
 * Temporal Observatory Application
 * 
 * Visualizes time itself - past, present, predicted, branches
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { temporalStateManager } from '../../../services/temporal/temporalState';
import { causalGraph } from '../../../services/temporal/causalGraph';
import { futurePredictor } from '../../../services/retrocausality/futurePredictor';
import { timelineBrancher } from '../../../services/multiverse/timelineBrancher';
import { branchEvaluator } from '../../../services/multiverse/branchEvaluator';
import { probabilisticRouter } from '../../../services/quantum/probabilisticRouter';
import type { TimeSlice } from '../../../services/temporal/temporalTypes';
import type { TimelineBranch } from '../../../services/multiverse/multiverseTypes';
import type { CausalLink } from '../../../services/temporal/temporalTypes';

export function TemporalObservatoryApp() {
  const [temporalState, setTemporalState] = useState<any>(null);
  const [causalLinks, setCausalLinks] = useState<CausalLink[]>([]);
  const [branches, setBranches] = useState<TimelineBranch[]>([]);
  const [futurePredictions, setFuturePredictions] = useState<any[]>([]);
  
  useEffect(() => {
    const updateState = async () => {
      const state = temporalStateManager.getState();
      setTemporalState(state);
      
      setCausalLinks(causalGraph.getAllLinks());
      
      // Get future predictions
      const predictions = [];
      for (let i = 1; i <= 5; i++) {
        const pred = await futurePredictor.predictChainState(i * 10);
        predictions.push(pred);
      }
      setFuturePredictions(predictions);
      
      // Create sample branches
      const sampleBranches = await timelineBrancher.createBranches({}, 3);
      setBranches(sampleBranches);
    };
    
    updateState();
    const interval = setInterval(updateState, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="h-full flex flex-col min-h-0 p-6 space-y-6 overflow-auto">
      <div>
        <h2 className="text-2xl font-bold text-genesis-cipher-cyan mb-2">Temporal Observatory</h2>
        <p className="text-sm text-genesis-text-tertiary">The visualization of time itself</p>
      </div>
      
      {/* Timeline Visualization */}
      <div className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-genesis-cipher-cyan mb-4">Timeline</h3>
        <div className="flex items-center space-x-4 overflow-x-auto pb-4">
          {/* Past */}
          <div className="flex-shrink-0">
            <div className="text-xs text-genesis-text-tertiary mb-2">Past</div>
            <div className="space-y-1">
              {temporalState?.past.slice(-5).map((slice: TimeSlice, i: number) => (
                <motion.div
                  key={slice.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="w-16 h-16 bg-abyss-navy/50 border border-genesis-border-default/20 rounded flex items-center justify-center text-xs text-genesis-cipher-cyan"
                >
                  {new Date(slice.timestamp).getHours()}:{new Date(slice.timestamp).getMinutes()}
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Now */}
          <div className="flex-shrink-0">
            <div className="text-xs text-genesis-text-tertiary mb-2">Now</div>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-20 h-20 bg-abyss-cyan/20 border-2 border-genesis-border-default rounded flex items-center justify-center text-sm font-bold text-genesis-cipher-cyan"
            >
              NOW
            </motion.div>
          </div>
          
          {/* Future */}
          <div className="flex-shrink-0">
            <div className="text-xs text-genesis-text-tertiary mb-2">Future</div>
            <div className="space-y-1">
              {futurePredictions.map((pred, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="w-16 h-16 bg-abyss-purple/20 border border-abyss-purple/30 rounded flex items-center justify-center text-xs text-abyss-purple"
                >
                  +{pred.height}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Causal Graph */}
      <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-6">
        <h3 className="text-lg font-bold text-genesis-cipher-cyan mb-4">Causal Graph</h3>
        <div className="space-y-2 max-h-64 overflow-auto">
          {causalLinks.length > 0 ? (
            causalLinks.slice(0, 10).map((link, i) => (
              <div key={i} className="flex items-center space-x-2 text-sm">
                <span className="text-genesis-text-tertiary font-mono text-xs">{link.from.slice(0, 8)}...</span>
                <span className="text-genesis-cipher-cyan">→</span>
                <span className="text-genesis-text-tertiary font-mono text-xs">{link.to.slice(0, 8)}...</span>
                <span className="text-gray-500 text-xs">({(link.strength * 100).toFixed(0)}%)</span>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">No causal links yet</div>
          )}
        </div>
      </div>
      
      {/* Branch Evaluator */}
      {branches.length > 0 && (
        <div className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-6">
          <h3 className="text-lg font-bold text-genesis-cipher-cyan mb-4">Multiverse Branches</h3>
          <div className="space-y-3">
            {branches.map((branch, i) => {
              const evaluation = branchEvaluator.evaluateBranch(branch);
              return (
                <div
                  key={branch.id}
                  className="p-4 bg-abyss-navy/30 rounded border border-genesis-border-default/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-mono text-sm text-genesis-cipher-cyan">
                      Branch {i + 1} · Depth: {branch.depth}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      evaluation.recommendation === 'optimal' ? 'bg-green-500/20 text-green-400' :
                      evaluation.recommendation === 'acceptable' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {evaluation.recommendation}
                    </span>
                  </div>
                  <div className="text-xs text-genesis-text-tertiary space-y-1">
                    <div>Score: {evaluation.score.toFixed(1)}/100</div>
                    <div>Stability: {(evaluation.metrics.stability * 100).toFixed(0)}%</div>
                    <div>Efficiency: {(evaluation.metrics.efficiency * 100).toFixed(0)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Temporal State Stats */}
      {temporalState && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
            <div className="text-sm text-genesis-text-tertiary mb-1">Past Slices</div>
            <div className="text-2xl font-mono text-genesis-cipher-cyan">{temporalState.past.length}</div>
          </div>
          
          <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
            <div className="text-sm text-genesis-text-tertiary mb-1">Future Slices</div>
            <div className="text-2xl font-mono text-abyss-purple">{temporalState.future.length}</div>
          </div>
          
          <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
            <div className="text-sm text-genesis-text-tertiary mb-1">Branches</div>
            <div className="text-2xl font-mono text-genesis-cipher-cyan">{temporalState.branches.length}</div>
          </div>
          
          <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
            <div className="text-sm text-genesis-text-tertiary mb-1">Causal Links</div>
            <div className="text-2xl font-mono text-abyss-purple">{causalLinks.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}

