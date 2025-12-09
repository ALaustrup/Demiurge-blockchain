/**
 * Intention Stack View
 * 
 * Shows evolving intentions
 */

import React from 'react';

export const IntentionStackView: React.FC = () => {
  const [intentions, setIntentions] = React.useState<any[]>([]);

  React.useEffect(() => {
    // In production, fetch from Rust backend
    setIntentions([
      { id: '1', goal: 'Optimize runtime performance', priority: 'High', status: 'Active' },
      { id: '2', goal: 'Improve state management', priority: 'Medium', status: 'Pending' },
      { id: '3', goal: 'Enhance security layer', priority: 'Critical', status: 'Active' },
    ]);
  }, []);

  return (
    <div className="intention-stack-view bg-gray-900 p-4 rounded border border-purple-500">
      <h2 className="text-xl font-bold text-purple-400 mb-2">🎯 Intention Stack</h2>
      
      <div className="stack space-y-2">
        {intentions.map((intention) => (
          <div key={intention.id} className="intention p-2 bg-gray-800 rounded">
            <div className="flex justify-between">
              <span className="font-semibold">{intention.goal}</span>
              <span className={`px-2 py-1 rounded text-xs ${
                intention.priority === 'Critical' ? 'bg-red-500' :
                intention.priority === 'High' ? 'bg-orange-500' :
                'bg-yellow-500'
              }`}>
                {intention.priority}
              </span>
            </div>
            <div className="text-sm text-gray-400 mt-1">Status: {intention.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
