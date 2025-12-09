/**
 * Distributed Memory View
 * 
 * Shows distributed memory across nodes
 */

import React from 'react';

export const DistributedMemoryView: React.FC = () => {
  const [memory, setMemory] = React.useState<any>(null);

  React.useEffect(() => {
    setMemory({
      totalChunks: 1024,
      totalNodes: 5,
      averageImportance: 0.75,
      replicas: 3,
    });
  }, []);

  if (!memory) return <div>Loading memory...</div>;

  return (
    <div className="distributed-memory-view bg-gray-900 p-4 rounded border border-green-500">
      <h2 className="text-xl font-bold text-green-400 mb-2">💾 Distributed Memory</h2>
      
      <div className="metrics space-y-3">
        <div>
          <div className="text-sm text-gray-400">Total Chunks</div>
          <div className="text-2xl font-bold text-green-400">{memory.totalChunks.toLocaleString()}</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-sm text-gray-400">Nodes</div>
            <div className="text-lg font-semibold text-blue-400">{memory.totalNodes}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Replicas</div>
            <div className="text-lg font-semibold text-cyan-400">{memory.replicas}</div>
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Avg Importance</div>
          <div className="text-lg font-semibold text-yellow-400">{(memory.averageImportance * 100).toFixed(0)}%</div>
        </div>
      </div>
    </div>
  );
};
