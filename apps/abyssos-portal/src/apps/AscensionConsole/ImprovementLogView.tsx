/**
 * Improvement Log View
 * 
 * Shows approved and rejected improvements
 */

import React from 'react';

export const ImprovementLogView: React.FC = () => {
  const [improvements, setImprovements] = React.useState<any[]>([]);

  React.useEffect(() => {
    // In production, fetch from Rust backend
    setImprovements([
      { id: '1', artifact: 'State optimization module', status: 'Approved', timestamp: Date.now() - 3600000 },
      { id: '2', artifact: 'Performance patch', status: 'Executed', timestamp: Date.now() - 7200000 },
      { id: '3', artifact: 'Security enhancement', status: 'Rejected', timestamp: Date.now() - 10800000 },
    ]);
  }, []);

  return (
    <div className="improvement-log-view bg-gray-900 p-4 rounded border border-blue-500">
      <h2 className="text-xl font-bold text-blue-400 mb-2">📋 Improvement Log</h2>
      
      <div className="log space-y-2">
        {improvements.map((improvement) => (
          <div key={improvement.id} className="improvement p-2 bg-gray-800 rounded">
            <div className="flex justify-between">
              <span>{improvement.artifact}</span>
              <span className={`px-2 py-1 rounded text-xs ${
                improvement.status === 'Approved' || improvement.status === 'Executed' ? 'bg-green-500' :
                'bg-red-500'
              }`}>
                {improvement.status}
              </span>
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {new Date(improvement.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
