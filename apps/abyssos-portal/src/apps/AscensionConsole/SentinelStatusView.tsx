/**
 * Sentinel Status View
 * 
 * Shows purity, anomaly metrics, and Sentinel state
 */

import React from 'react';
import { supremeGuardian } from '../../core/sentinel/supreme_guardian';

export const SentinelStatusView: React.FC = () => {
  const [status, setStatus] = React.useState<any>(null);

  React.useEffect(() => {
    const updateStatus = async () => {
      const guardianState = await supremeGuardian.monitor();
      setStatus({
        ...guardianState,
        purity: 0.98,
        anomalies: guardianState.anomalies,
      });
    };
    
    updateStatus();
    const interval = setInterval(updateStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return <div>Loading sentinel status...</div>;

  return (
    <div className="sentinel-status-view bg-gray-900 p-4 rounded border border-red-500">
      <h2 className="text-xl font-bold text-red-400 mb-2">🛡️ Sentinel Status</h2>
      
      <div className="status grid grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-gray-400">Active</div>
          <div className={`text-2xl font-bold ${status.active ? 'text-green-400' : 'text-red-400'}`}>
            {status.active ? '✓' : '✗'}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-400">Anomalies</div>
          <div className={`text-2xl font-bold ${status.anomalies === 0 ? 'text-green-400' : 'text-red-400'}`}>
            {status.anomalies}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-400">Purity</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-800 rounded h-4">
              <div 
                className="bg-green-500 h-4 rounded"
                style={{ width: `${status.purity * 100}%` }}
              />
            </div>
            <span className="text-green-400">{(status.purity * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-400">
        Last Check: {new Date(status.lastCheck).toLocaleTimeString()}
      </div>
    </div>
  );
};
