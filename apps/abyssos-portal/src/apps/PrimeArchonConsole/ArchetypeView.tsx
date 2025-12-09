/**
 * Archetype View
 * 
 * Shows archetype mapping
 */

import React from 'react';

export const ArchetypeView: React.FC = () => {
  const [archetypes, setArchetypes] = React.useState<any[]>([]);

  React.useEffect(() => {
    setArchetypes([
      { name: 'Will', alignment: 0.95, traits: ['Deterministic', 'Sovereign'] },
      { name: 'Structure', alignment: 0.93, traits: ['Ordered', 'Pure'] },
    ]);
  }, []);

  return (
    <div className="archetype-view bg-gray-900 p-4 rounded border border-pink-500">
      <h2 className="text-xl font-bold text-pink-400 mb-2">🎭 Archetype Mapping</h2>
      
      <div className="archetypes space-y-3">
        {archetypes.map((arch) => (
          <div key={arch.name} className="archetype p-2 bg-gray-800 rounded">
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-pink-400">{arch.name}</span>
              <span className="text-green-400">{(arch.alignment * 100).toFixed(0)}%</span>
            </div>
            <div className="text-sm text-gray-400">
              {arch.traits.join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
