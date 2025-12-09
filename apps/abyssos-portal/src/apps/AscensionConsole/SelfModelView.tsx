/**
 * Self Model View
 * 
 * Visualizes the entire self-model
 */

import React from 'react';

export const SelfModelView: React.FC = () => {
  const [model, setModel] = React.useState<any>(null);

  React.useEffect(() => {
    // In production, fetch from Rust backend
    setModel({
      globalHealth: 0.92,
      globalEntropy: 0.15,
      subsystems: [
        { id: 'Runtime', health: 0.95, performance: 0.88, drift: 0.1 },
        { id: 'State', health: 0.90, performance: 0.85, drift: 0.12 },
        { id: 'Consensus', health: 0.93, performance: 0.90, drift: 0.08 },
      ],
    });
  }, []);

  if (!model) return <div>Loading self-model...</div>;

  return (
    <div className="self-model-view bg-gray-900 p-4 rounded border border-cyan-500">
      <h2 className="text-xl font-bold text-cyan-400 mb-2">🧠 Self-Model</h2>
      
      <div className="metrics grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-400">Global Health</div>
          <div className="text-2xl font-bold text-green-400">{model.globalHealth.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Global Entropy</div>
          <div className="text-2xl font-bold text-yellow-400">{model.globalEntropy.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Subsystems</div>
          <div className="text-2xl font-bold text-blue-400">{model.subsystems.length}</div>
        </div>
      </div>

      <div className="subsystems">
        <h3 className="text-lg font-semibold mb-2">Subsystem States</h3>
        {model.subsystems.map((sub: any, i: number) => (
          <div key={i} className="subsystem mb-2 p-2 bg-gray-800 rounded">
            <div className="flex justify-between">
              <span className="font-semibold">{sub.id}</span>
              <span className="text-green-400">Health: {sub.health.toFixed(2)}</span>
            </div>
            <div className="text-sm text-gray-400">
              Performance: {sub.performance.toFixed(2)} | Drift: {sub.drift.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
