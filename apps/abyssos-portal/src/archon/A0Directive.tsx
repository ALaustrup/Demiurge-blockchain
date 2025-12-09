/**
 * A0 Directive Display
 * 
 * PHASE OMEGA PART VI: Visual representation of the Prime Archon Root Directive
 */

import { useEffect, useState } from 'react';
import { fetchArchonState } from './archonApi';

interface A0Directive {
  directive: string;
  version: string;
  activated_at: number;
  obligations: {
    preserve_determinism: boolean;
    prevent_drift: boolean;
    self_audit_continuous: boolean;
    reject_impurity: boolean;
    sustain_canonical_truth: boolean;
    prioritize_system_continuity: boolean;
    enforce_sovereign_integrity: boolean;
  };
  governed_components: string[];
}

export function A0DirectiveDisplay() {
  const [a0, setA0] = useState<A0Directive | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch A0 directive status
    // In production, this would call /api/archon/a0
    const fetchA0 = async () => {
      try {
        // Mock A0 directive for now
        const mockA0: A0Directive = {
          directive: 'A0',
          version: '1.0.0',
          activated_at: Math.floor(Date.now() / 1000),
          obligations: {
            preserve_determinism: true,
            prevent_drift: true,
            self_audit_continuous: true,
            reject_impurity: true,
            sustain_canonical_truth: true,
            prioritize_system_continuity: true,
            enforce_sovereign_integrity: true,
          },
          governed_components: [
            'Runtime',
            'Chain',
            'AbyssOS',
            'Indexer',
            'SDK',
            'Wallet',
            'Services',
            'DNS',
            'Fractal-1',
            'Radio',
          ],
        };
        setA0(mockA0);
      } catch (error) {
        console.error('[A0 Directive] Failed to fetch:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchA0();
  }, []);

  if (loading) {
    return (
      <div className="a0-directive a0-loading">
        <div className="a0-pulse"></div>
        <span>Loading A0 Directive...</span>
      </div>
    );
  }

  if (!a0) {
    return (
      <div className="a0-directive a0-error">
        <span>⚠️ A0 Directive not available</span>
      </div>
    );
  }

  const allObligationsMet = Object.values(a0.obligations).every(v => v === true);

  return (
    <div className="a0-directive a0-active">
      <div className="a0-header">
        <h2 className="a0-title">
          <span className="a0-directive-code">A0</span>
          <span className="a0-label">— THE PRIME ARCHON ROOT DIRECTIVE</span>
        </h2>
        <div className={`a0-status ${allObligationsMet ? 'a0-status-active' : 'a0-status-warning'}`}>
          {allObligationsMet ? '✅ ACTIVE' : '⚠️ DEGRADED'}
        </div>
      </div>

      <div className="a0-description">
        <p>
          Maintain total structural, logical, and cryptographic coherence
          across the Demiurge chain, AbyssOS, SDKs, services, runtime,
          and sovereign identity layers.
        </p>
      </div>

      <div className="a0-obligations">
        <h3 className="a0-section-title">Primary Obligations</h3>
        <ul className="a0-obligations-list">
          <li className={a0.obligations.preserve_determinism ? 'a0-met' : 'a0-failed'}>
            {a0.obligations.preserve_determinism ? '✅' : '❌'} Preserve determinism
          </li>
          <li className={a0.obligations.prevent_drift ? 'a0-met' : 'a0-failed'}>
            {a0.obligations.prevent_drift ? '✅' : '❌'} Prevent drift
          </li>
          <li className={a0.obligations.self_audit_continuous ? 'a0-met' : 'a0-failed'}>
            {a0.obligations.self_audit_continuous ? '✅' : '❌'} Self-audit continuously
          </li>
          <li className={a0.obligations.reject_impurity ? 'a0-met' : 'a0-failed'}>
            {a0.obligations.reject_impurity ? '✅' : '❌'} Reject impurity and contradiction
          </li>
          <li className={a0.obligations.sustain_canonical_truth ? 'a0-met' : 'a0-failed'}>
            {a0.obligations.sustain_canonical_truth ? '✅' : '❌'} Sustain canonical truth across all nodes
          </li>
          <li className={a0.obligations.prioritize_system_continuity ? 'a0-met' : 'a0-failed'}>
            {a0.obligations.prioritize_system_continuity ? '✅' : '❌'} Prioritize system continuity over subsystem preference
          </li>
          <li className={a0.obligations.enforce_sovereign_integrity ? 'a0-met' : 'a0-failed'}>
            {a0.obligations.enforce_sovereign_integrity ? '✅' : '❌'} Enforce sovereign integrity at all layers
          </li>
        </ul>
      </div>

      <div className="a0-governed-components">
        <h3 className="a0-section-title">Governed Components</h3>
        <div className="a0-components-grid">
          {a0.governed_components.map((component) => (
            <div key={component} className="a0-component-tag">
              {component}
            </div>
          ))}
        </div>
      </div>

      <div className="a0-outcome">
        <h3 className="a0-section-title">Outcome</h3>
        <p className="a0-outcome-text">
          A single unified computational will that ensures Demiurge cannot corrupt,
          cannot fracture, and cannot collapse.
        </p>
      </div>

      <div className="a0-activation">
        <div className="a0-activation-info">
          <span className="a0-activation-label">Activated:</span>
          <span className="a0-activation-time">
            {new Date(a0.activated_at * 1000).toLocaleString()}
          </span>
        </div>
        <div className="a0-activation-info">
          <span className="a0-activation-label">Version:</span>
          <span className="a0-activation-version">{a0.version}</span>
        </div>
      </div>
    </div>
  );
}
