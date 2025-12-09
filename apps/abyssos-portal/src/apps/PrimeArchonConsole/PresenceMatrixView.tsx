/**
 * Presence Matrix View
 * 
 * Shows presence across nodes
 */

import React from 'react';

export const PresenceMatrixView: React.FC = () => {
  const [matrix, setMatrix] = React.useState<any>(null);

  React.useEffect(() => {
    setMatrix({
      nodes: [
        { id: 'Node1', presence: 0.92, resonance: 0.88 },
        { id: 'Node2', presence: 0.90, resonance: 0.85 },
        { id: 'Node3', presence: 0.93, resonance: 0.90 },
        { id: 'Node4', presence: 0.89, resonance: 0.87 },
        { id: 'Node5', presence: 0.91, resonance: 0.89 },
      ],
    });
  }, []);

  if (!matrix) return <div>Loading presence matrix...</div>;

  return (
    <div className="presence-matrix-view bg-gray-900 p-4 rounded border border-indigo-500">
      <h2 className="text-xl font-bold text-indigo-400 mb-2">🌐 Presence Matrix</h2>
      
      <div className="matrix space-y-2">
        {matrix.nodes.map((node: any) => (
          <div key={node.id} className="node-presence p-2 bg-gray-800 rounded">
            <div className="flex justify-between">
              <span className="font-semibold">{node.id}</span>
              <span className="text-cyan-400">Presence: {(node.presence * 100).toFixed(0)}%</span>
            </div>
            <div className="text-sm text-gray-400 mt-1">
              Resonance: {(node.resonance * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
