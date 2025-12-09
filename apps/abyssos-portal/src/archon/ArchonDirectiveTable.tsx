/**
 * Archon Directive Table
 * 
 * PHASE OMEGA PART VI: Displays active Archon directives
 */

import { useEffect } from 'react';
import { useArchonStore } from './ArchonStateStore';

export function ArchonDirectiveTable() {
  const { directives, fetchDirectives, loading, error } = useArchonStore();

  useEffect(() => {
    fetchDirectives();
    const interval = setInterval(fetchDirectives, 5000);
    return () => clearInterval(interval);
  }, [fetchDirectives]);

  if (loading && directives.length === 0) {
    return (
      <div className="archon-directive-table">
        <div className="archon-loading">Loading directives...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="archon-directive-table">
        <div className="archon-error">Error: {error}</div>
      </div>
    );
  }

  if (directives.length === 0) {
    return (
      <div className="archon-directive-table">
        <div className="archon-empty">No active directives</div>
      </div>
    );
  }

  return (
    <div className="archon-directive-table">
      <h3 className="archon-table-title">Active Directives</h3>
      <table className="archon-table">
        <thead>
          <tr>
            <th>Directive</th>
            <th>Priority</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {directives.map((directive, index) => (
            <tr key={index} className={`archon-directive-row priority-${directive.priority}`}>
              <td className="archon-directive-code">{directive.directive}</td>
              <td className="archon-directive-priority">{directive.priority}</td>
              <td className="archon-directive-description">{directive.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
