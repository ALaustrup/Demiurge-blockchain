/**
 * Archon Presence Component
 * 
 * PHASE OMEGA PART VI: The OS must see the Archon.
 * This component displays the Prime Archon's state in AbyssOS.
 */

import { useEffect, useState } from 'react';
import { fetchArchonState } from './archonApi';

export interface ArchonState {
  runtime_version: string;
  state_root: string;
  node_id: string;
  invariants_ok: boolean;
  integrity_hash: string;
  block_height: number;
  timestamp: number;
  runtime_registry_hash: string;
  sdk_compatibility_hash: string;
  sovereignty_seal_hash: string;
}

export function ArchonPresence() {
  const [archon, setArchon] = useState<ArchonState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchState = async () => {
      try {
        const state = await fetchArchonState();
        setArchon(state);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch Archon state');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchState();

    // Poll every 500ms (twice per second)
    const interval = setInterval(fetchState, 500);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="archon-state archon-loading">
        <div className="archon-pulse"></div>
        <span>Archon: Initializing…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="archon-state archon-error">
        <span>⚠️ Archon: {error}</span>
      </div>
    );
  }

  if (!archon) {
    return (
      <div className="archon-state archon-unknown">
        <span>Archon: Unknown State</span>
      </div>
    );
  }

  return (
    <div className="archon-state archon-active">
      <div className="archon-header">
        <strong className="archon-title">Prime Archon</strong>
        <div className="archon-status-indicator">
          {archon.invariants_ok ? (
            <span className="archon-status-ok">✔ Stable</span>
          ) : (
            <span className="archon-status-warning">⚠ Drift Detected</span>
          )}
        </div>
      </div>
      
      <div className="archon-details">
        <div className="archon-detail-row">
          <span className="archon-label">Runtime:</span>
          <span className="archon-value">{archon.runtime_version}</span>
        </div>
        
        <div className="archon-detail-row">
          <span className="archon-label">Node:</span>
          <span className="archon-value">{archon.node_id}</span>
        </div>
        
        <div className="archon-detail-row">
          <span className="archon-label">Block:</span>
          <span className="archon-value">{archon.block_height.toLocaleString()}</span>
        </div>
        
        <div className="archon-detail-row">
          <span className="archon-label">Integrity:</span>
          <span className="archon-value archon-hash">
            {archon.integrity_hash.slice(0, 12)}…
          </span>
        </div>
        
        <div className="archon-detail-row">
          <span className="archon-label">State Root:</span>
          <span className="archon-value archon-hash">
            {archon.state_root.slice(0, 12)}…
          </span>
        </div>
      </div>
    </div>
  );
}
