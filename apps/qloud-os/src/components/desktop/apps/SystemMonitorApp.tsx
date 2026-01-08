/**
 * System Monitor Application
 * 
 * Process table and system resource monitoring
 */

import { useState, useEffect } from 'react';
import { processManager, type Process } from '../../../services/system/processManager';
import { getAllVMJobs, onVMJobUpdate } from '../../../services/qorvm/qorvm';
import { Button } from '../../shared/Button';
import type { VMJobStatus } from '../../../services/qorvm/types';

export function SystemMonitorApp() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [totalCpu, setTotalCpu] = useState(0);
  const [totalMemory, setTotalMemory] = useState(0);
  const [gridJobs, setGridJobs] = useState<VMJobStatus[]>([]);
  
  useEffect(() => {
    const updateProcesses = () => {
      const procs = processManager.list();
      setProcesses(procs);
      setTotalCpu(processManager.getTotalCpuUsage());
      setTotalMemory(processManager.getTotalMemoryUsage());
    };
    
    // Initial load
    updateProcesses();
    
    // Subscribe to updates
    const unsubscribe = processManager.onUpdate(updateProcesses);
    
    // Also poll manually
    const interval = setInterval(updateProcesses, 1000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);
  
  // Load grid jobs
  useEffect(() => {
    const updateJobs = () => {
      setGridJobs(getAllVMJobs());
    };
    
    updateJobs();
    const unsubscribe = onVMJobUpdate(updateJobs);
    const interval = setInterval(updateJobs, 1000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);
  
  const handleKill = (pid: number) => {
    if (confirm(`Kill process ${pid}?`)) {
      processManager.kill(pid);
    }
  };
  
  const handleRestart = (pid: number) => {
    processManager.restart(pid);
  };
  
  const getStatusColor = (status: Process['status']) => {
    switch (status) {
      case 'running': return 'text-green-400';
      case 'sleeping': return 'text-yellow-400';
      case 'stopped': return 'text-red-400';
      case 'dead': return 'text-gray-500';
      default: return 'text-genesis-text-tertiary';
    }
  };
  
  return (
    <div className="h-full flex flex-col min-h-0 p-6 space-y-6 overflow-auto">
      <div>
        <h2 className="text-2xl font-bold text-genesis-cipher-cyan mb-2">System Monitor</h2>
        <p className="text-sm text-genesis-text-tertiary">Process management and resource usage</p>
      </div>
      
      {/* System Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
          <div className="text-sm text-genesis-text-tertiary mb-1">Total CPU Usage</div>
          <div className="text-2xl font-mono text-genesis-cipher-cyan">{totalCpu.toFixed(1)}%</div>
          <div className="mt-2 h-2 bg-genesis-glass-light rounded-full overflow-hidden">
            <div
              className="h-full bg-abyss-cyan transition-all duration-300"
              style={{ width: `${Math.min(totalCpu, 100)}%` }}
            />
          </div>
        </div>
        
        <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4">
          <div className="text-sm text-genesis-text-tertiary mb-1">Total Memory Usage</div>
          <div className="text-2xl font-mono text-genesis-cipher-cyan">
            {(totalMemory / 1024 / 1024).toFixed(2)} MB
          </div>
          <div className="mt-2 h-2 bg-genesis-glass-light rounded-full overflow-hidden">
            <div
              className="h-full bg-abyss-purple transition-all duration-300"
              style={{ width: `${Math.min((totalMemory / 1024 / 1024 / 500) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Process Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-genesis-cipher-cyan">Running Processes</h3>
          <div className="text-xs text-genesis-text-tertiary">
            {processes.length} process{processes.length !== 1 ? 'es' : ''}
          </div>
        </div>
        
        {processes.length === 0 ? (
          <div className="text-center text-genesis-text-tertiary py-8">
            <p>No processes running</p>
          </div>
        ) : (
          <div className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-abyss-navy/50 border-b border-genesis-border-default/20">
                <tr>
                  <th className="text-left p-3 text-genesis-text-tertiary font-medium">PID</th>
                  <th className="text-left p-3 text-genesis-text-tertiary font-medium">Name</th>
                  <th className="text-left p-3 text-genesis-text-tertiary font-medium">Type</th>
                  <th className="text-left p-3 text-genesis-text-tertiary font-medium">Status</th>
                  <th className="text-right p-3 text-genesis-text-tertiary font-medium">CPU</th>
                  <th className="text-right p-3 text-genesis-text-tertiary font-medium">Memory</th>
                  <th className="text-center p-3 text-genesis-text-tertiary font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((process) => (
                  <tr
                    key={process.pid}
                    className="border-b border-genesis-border-default/10 hover:bg-abyss-navy/30 transition-colors"
                  >
                    <td className="p-3 font-mono text-genesis-cipher-cyan">{process.pid}</td>
                    <td className="p-3 text-white">{process.name}</td>
                    <td className="p-3 text-genesis-text-tertiary">{process.type}</td>
                    <td className={`p-3 ${getStatusColor(process.status)}`}>
                      {process.status}
                    </td>
                    <td className="p-3 text-right text-genesis-text-secondary">
                      {process.cpuUsage.toFixed(1)}%
                    </td>
                    <td className="p-3 text-right text-genesis-text-secondary">
                      {(process.memoryUsage / 1024 / 1024).toFixed(2)} MB
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center space-x-2">
                        {process.status === 'running' && (
                          <>
                            <Button
                              onClick={() => handleRestart(process.pid)}
                              variant="secondary"
                              className="text-xs px-2 py-1"
                            >
                              Restart
                            </Button>
                            <Button
                              onClick={() => handleKill(process.pid)}
                              variant="secondary"
                              className="text-xs px-2 py-1 text-red-400 hover:text-red-300"
                            >
                              Kill
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Grid Jobs Section */}
      {gridJobs.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-genesis-cipher-cyan">Grid Jobs</h3>
            <div className="text-xs text-genesis-text-tertiary">
              {gridJobs.filter(j => j.status === 'running').length} active
            </div>
          </div>
          
          <div className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-abyss-navy/50 border-b border-genesis-border-default/20">
                <tr>
                  <th className="text-left p-3 text-genesis-text-tertiary font-medium">Job ID</th>
                  <th className="text-left p-3 text-genesis-text-tertiary font-medium">Status</th>
                  <th className="text-left p-3 text-genesis-text-tertiary font-medium">Peer</th>
                  <th className="text-left p-3 text-genesis-text-tertiary font-medium">Progress</th>
                </tr>
              </thead>
              <tbody>
                {gridJobs.map((job) => (
                  <tr
                    key={job.jobId}
                    className="border-b border-genesis-border-default/10 hover:bg-abyss-navy/30 transition-colors"
                  >
                    <td className="p-3 font-mono text-genesis-cipher-cyan text-xs">
                      {job.jobId.slice(0, 16)}...
                    </td>
                    <td className={`p-3 ${
                      job.status === 'completed' ? 'text-green-400' :
                      job.status === 'failed' ? 'text-red-400' :
                      job.status === 'running' ? 'text-yellow-400' :
                      'text-genesis-text-tertiary'
                    }`}>
                      {job.status}
                    </td>
                    <td className="p-3 text-genesis-text-secondary text-xs">
                      {job.peerId ? job.peerId.slice(0, 12) + '...' : 'local'}
                    </td>
                    <td className="p-3">
                      {job.progress !== undefined ? (
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-2 bg-genesis-glass-light rounded-full overflow-hidden">
                            <div
                              className="h-full bg-abyss-cyan transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-genesis-text-tertiary">{job.progress}%</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

