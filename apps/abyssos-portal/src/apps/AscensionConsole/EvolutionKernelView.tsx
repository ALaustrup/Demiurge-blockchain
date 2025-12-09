/**
 * Evolution Kernel View
 * 
 * Displays kernel decisions
 */

import React from 'react';

export const EvolutionKernelView: React.FC = () => {
  const [decisions, setDecisions] = React.useState<any[]>([]);

  React.useEffect(() => {
    // In production, fetch from Rust backend
    setDecisions([
      { id: '1', delta: 'Optimize state root computation', score: 0.85, status: 'Approved' },
      { id: '2', delta: 'Refactor runtime module', score: 0.65, status: 'Pending' },
      { id: '3', delta: 'Enhance signature verification', score: 0.92, status: 'Approved' },
    ]);
  }, []);

  return (
    <div className="evolution-kernel-view bg-gray-900 p-4 rounded border border-green-500">
      <h2 className="text-xl font-bold text-green-400 mb-2">🧬 Evolution Kernel</h2>
      
      <div className="decisions space-y-2">
        {decisions.map((decision) => (
          <div key={decision.id} className="decision p-2 bg-gray-800 rounded">
            <div className="flex justify-between">
              <span>{decision.delta}</span>
              <span className="text-green-400">Score: {decision.score.toFixed(2)}</span>
            </div>
            <div className="text-sm text-gray-400 mt-1">
              Status: <span className={decision.status === 'Approved' ? 'text-green-400' : 'text-yellow-400'}>
                {decision.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
