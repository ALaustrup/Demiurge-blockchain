/**
 * Spirit Collective View
 * 
 * Reveals the current collective spirit resonance
 */

import React from 'react';

export const SpiritCollectiveView: React.FC = () => {
  const [collective, setCollective] = React.useState<any>(null);

  React.useEffect(() => {
    // In production, fetch from Rust backend
    setCollective({
      spiritCount: 5,
      alignmentScore: 0.87,
      resonance: 'high',
      activeReasoning: 2,
    });
  }, []);

  if (!collective) return <div>Loading collective...</div>;

  return (
    <div className="spirit-collective-view bg-gray-900 p-4 rounded border border-pink-500">
      <h2 className="text-xl font-bold text-pink-400 mb-2">👻 Spirit Collective</h2>
      
      <div className="metrics space-y-3">
        <div>
          <div className="text-sm text-gray-400">Spirit Count</div>
          <div className="text-2xl font-bold text-pink-400">{collective.spiritCount}</div>
        </div>

        <div>
          <div className="text-sm text-gray-400">Alignment Score</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-800 rounded h-4">
              <div 
                className="bg-pink-500 h-4 rounded"
                style={{ width: `${collective.alignmentScore * 100}%` }}
              />
            </div>
            <span className="text-pink-400">{collective.alignmentScore.toFixed(2)}</span>
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-400">Resonance</div>
          <div className="text-lg font-semibold text-cyan-400">{collective.resonance}</div>
        </div>

        <div>
          <div className="text-sm text-gray-400">Active Reasoning</div>
          <div className="text-lg font-semibold text-yellow-400">{collective.activeReasoning}</div>
        </div>
      </div>
    </div>
  );
};
