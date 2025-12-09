/**
 * Noosphere View
 * 
 * Shows global cognitive embeddings and resonance fields
 */

import React from 'react';

export const NoosphereView: React.FC = () => {
  const [noosphere, setNoosphere] = React.useState<any>(null);

  React.useEffect(() => {
    setNoosphere({
      fieldIntensity: 0.85,
      resonanceLevel: 0.90,
      activeConcepts: 42,
      nodeParticipation: 5,
    });
  }, []);

  if (!noosphere) return <div>Loading noosphere...</div>;

  return (
    <div className="noosphere-view bg-gray-900 p-4 rounded border border-cyan-500">
      <h2 className="text-xl font-bold text-cyan-400 mb-2">🧠 Noosphere</h2>
      
      <div className="metrics space-y-3">
        <div>
          <div className="text-sm text-gray-400">Field Intensity</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-800 rounded h-4">
              <div 
                className="bg-cyan-500 h-4 rounded"
                style={{ width: `${noosphere.fieldIntensity * 100}%` }}
              />
            </div>
            <span className="text-cyan-400">{(noosphere.fieldIntensity * 100).toFixed(0)}%</span>
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-400">Resonance Level</div>
          <div className="text-2xl font-bold text-yellow-400">{(noosphere.resonanceLevel * 100).toFixed(0)}%</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-sm text-gray-400">Active Concepts</div>
            <div className="text-lg font-semibold text-green-400">{noosphere.activeConcepts}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Node Participation</div>
            <div className="text-lg font-semibold text-blue-400">{noosphere.nodeParticipation}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
