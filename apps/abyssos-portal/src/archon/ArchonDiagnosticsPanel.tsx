/**
 * Archon Diagnostics Panel
 * 
 * PHASE OMEGA PART VI: Displays diagnostic test results
 */

import { useEffect } from 'react';
import { useArchonStore } from './ArchonStateStore';

export function ArchonDiagnosticsPanel() {
  const { diagnostics, fetchDiagnostics, loading, error } = useArchonStore();

  useEffect(() => {
    fetchDiagnostics();
    const interval = setInterval(fetchDiagnostics, 10000);
    return () => clearInterval(interval);
  }, [fetchDiagnostics]);

  if (loading && diagnostics.length === 0) {
    return (
      <div className="archon-diagnostics-panel">
        <div className="archon-loading">Loading diagnostics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="archon-diagnostics-panel">
        <div className="archon-error">Error: {error}</div>
      </div>
    );
  }

  const getResultIcon = (result: string) => {
    if (result === 'Pass') return '✅';
    if (result.startsWith('Warning')) return '⚠️';
    if (result.startsWith('Fail')) return '❌';
    return '⚪';
  };

  const getResultClass = (result: string) => {
    if (result === 'Pass') return 'archon-test-pass';
    if (result.startsWith('Warning')) return 'archon-test-warning';
    if (result.startsWith('Fail')) return 'archon-test-fail';
    return 'archon-test-unknown';
  };

  return (
    <div className="archon-diagnostics-panel">
      <h3 className="archon-panel-title">Diagnostic Tests</h3>
      <div className="archon-diagnostics-list">
        {diagnostics.map((test) => (
          <div key={test.id} className={`archon-diagnostic-item ${getResultClass(test.result)}`}>
            <div className="archon-diagnostic-header">
              <span className="archon-diagnostic-icon">{getResultIcon(test.result)}</span>
              <span className="archon-diagnostic-name">{test.name}</span>
              <span className="archon-diagnostic-category">{test.category}</span>
            </div>
            <div className="archon-diagnostic-result">{test.result}</div>
            <div className="archon-diagnostic-timestamp">
              {new Date(test.timestamp * 1000).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
