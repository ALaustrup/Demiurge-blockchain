/**
 * Directive View
 * 
 * Shows directive stack (A0-An)
 */

import React from 'react';

export const DirectiveView: React.FC = () => {
  const [directives, setDirectives] = React.useState<any[]>([]);

  React.useEffect(() => {
    setDirectives([
      { id: 'A0', directive: 'Maintain system stability', priority: 1.0, status: 'Active' },
      { id: 'A1', directive: 'Optimize God-Net resonance', priority: 0.9, status: 'Active' },
      { id: 'A2', directive: 'Enforce purity field', priority: 0.85, status: 'Pending' },
    ]);
  }, []);

  return (
    <div className="directive-view bg-gray-900 p-4 rounded border border-orange-500">
      <h2 className="text-xl font-bold text-orange-400 mb-2">📜 Directive Stack</h2>
      
      <div className="directives space-y-2">
        {directives.map((dir) => (
          <div key={dir.id} className="directive p-2 bg-gray-800 rounded">
            <div className="flex justify-between">
              <span className="font-mono font-bold text-orange-400">{dir.id}</span>
              <span className={`px-2 py-1 rounded text-xs ${
                dir.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'
              }`}>
                {dir.status}
              </span>
            </div>
            <div className="text-sm mt-1">{dir.directive}</div>
            <div className="text-xs text-gray-400 mt-1">Priority: {dir.priority.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
