/**
 * dApp Permission Request Modal
 * 
 * Shows when a dApp requests permissions to connect with QorID
 */

import { useState, useEffect } from 'react';
import { Button } from '../../../shared/Button';

interface PermissionRequest {
  origin: string;
  permissions: string[];
  favicon?: string;
  onApprove: () => void;
  onReject: () => void;
}

interface PermissionModalProps {
  request: PermissionRequest | null;
}

// Permission descriptions
const PERMISSION_INFO: Record<string, { name: string; description: string; icon: string; risk: 'low' | 'medium' | 'high' }> = {
  'eth_accounts': {
    name: 'View Accounts',
    description: 'See your wallet address and public account information',
    icon: '👤',
    risk: 'low',
  },
  'personal_sign': {
    name: 'Sign Messages',
    description: 'Sign messages with your private key (does not grant access to funds)',
    icon: '✍️',
    risk: 'medium',
  },
  'eth_signTypedData': {
    name: 'Sign Typed Data',
    description: 'Sign structured data for verifiable credentials and permissions',
    icon: '📝',
    risk: 'medium',
  },
  'eth_sendTransaction': {
    name: 'Send Transactions',
    description: 'Send CGT and interact with smart contracts on Demiurge',
    icon: '💸',
    risk: 'high',
  },
  'drc369_access': {
    name: 'DRC-369 Access',
    description: 'View and interact with your DRC-369 assets',
    icon: '🎨',
    risk: 'medium',
  },
};

export function PermissionModal({ request }: PermissionModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [rememberChoice, setRememberChoice] = useState(false);

  useEffect(() => {
    if (request) {
      // Pre-select all requested permissions
      setSelectedPermissions(new Set(request.permissions));
    }
  }, [request]);

  if (!request) return null;

  const siteName = (() => {
    try {
      const url = new URL(request.origin);
      return url.hostname;
    } catch {
      return request.origin;
    }
  })();

  const handleApprove = () => {
    // In production, save permissions if rememberChoice is true
    request.onApprove();
  };

  const handleReject = () => {
    request.onReject();
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions(prev => {
      const next = new Set(prev);
      if (next.has(perm)) {
        next.delete(perm);
      } else {
        next.add(perm);
      }
      return next;
    });
  };

  const hasHighRisk = request.permissions.some(p => PERMISSION_INFO[p]?.risk === 'high');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-abyss-navy border border-genesis-border-default/30 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-genesis-border-default/20">
          <div className="flex items-center gap-4">
            {/* Site favicon */}
            <div className="w-12 h-12 rounded-xl bg-genesis-glass-light flex items-center justify-center">
              {request.favicon ? (
                <img src={request.favicon} alt="" className="w-8 h-8" />
              ) : (
                <span className="text-2xl">🌐</span>
              )}
            </div>
            
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">Connection Request</h2>
              <p className="text-sm text-genesis-cipher-cyan truncate">{siteName}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-genesis-text-tertiary mb-4">
            This site is requesting the following permissions:
          </p>

          {/* Permission list */}
          <div className="space-y-2 mb-6">
            {request.permissions.map(perm => {
              const info = PERMISSION_INFO[perm] || {
                name: perm,
                description: 'Unknown permission',
                icon: '❓',
                risk: 'medium' as const,
              };

              return (
                <label
                  key={perm}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                    ${selectedPermissions.has(perm) 
                      ? 'bg-abyss-cyan/10 border border-genesis-border-default/30' 
                      : 'bg-genesis-glass-light/50 border border-transparent hover:border-genesis-border-default/20'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.has(perm)}
                    onChange={() => togglePermission(perm)}
                    className="w-4 h-4 rounded border-genesis-border-default/30 bg-genesis-glass-light text-genesis-cipher-cyan focus:ring-abyss-cyan/50"
                  />
                  
                  <span className="text-xl">{info.icon}</span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{info.name}</span>
                      <span className={`
                        text-xs px-1.5 py-0.5 rounded
                        ${info.risk === 'low' ? 'bg-green-500/20 text-green-400' : ''}
                        ${info.risk === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                        ${info.risk === 'high' ? 'bg-red-500/20 text-red-400' : ''}
                      `}>
                        {info.risk}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{info.description}</p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* High risk warning */}
          {hasHighRisk && (
            <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-6">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-medium text-red-400">High Risk Permission</p>
                <p className="text-xs text-genesis-text-tertiary">
                  This site is requesting transaction permissions. Only approve if you trust this site.
                </p>
              </div>
            </div>
          )}

          {/* Remember choice */}
          <label className="flex items-center gap-2 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberChoice}
              onChange={(e) => setRememberChoice(e.target.checked)}
              className="w-4 h-4 rounded border-genesis-border-default/30 bg-genesis-glass-light text-genesis-cipher-cyan focus:ring-abyss-cyan/50"
            />
            <span className="text-sm text-genesis-text-tertiary">Remember this choice for {siteName}</span>
          </label>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleReject}
              variant="ghost"
              className="flex-1"
            >
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              variant="primary"
              className="flex-1"
              disabled={selectedPermissions.size === 0}
            >
              Connect
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-genesis-glass-light/50 border-t border-genesis-border-default/20">
          <p className="text-xs text-gray-500 text-center">
            Connected with <span className="text-genesis-cipher-cyan">QorID</span> • Your keys, your identity
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing permission requests
 */
export function usePermissionRequests() {
  const [pendingRequest, setPendingRequest] = useState<PermissionRequest | null>(null);
  const [approvedSites, setApprovedSites] = useState<Map<string, Set<string>>>(new Map());

  const requestPermissions = (
    origin: string,
    permissions: string[],
    favicon?: string
  ): Promise<string[]> => {
    // Check if already approved
    const approved = approvedSites.get(origin);
    if (approved && permissions.every(p => approved.has(p))) {
      return Promise.resolve(permissions);
    }

    return new Promise((resolve, reject) => {
      setPendingRequest({
        origin,
        permissions,
        favicon,
        onApprove: () => {
          // Store approval
          setApprovedSites(prev => {
            const next = new Map(prev);
            const existing = next.get(origin) || new Set();
            permissions.forEach(p => existing.add(p));
            next.set(origin, existing);
            return next;
          });
          setPendingRequest(null);
          resolve(permissions);
        },
        onReject: () => {
          setPendingRequest(null);
          reject(new Error('User rejected the request'));
        },
      });
    });
  };

  const revokePermissions = (origin: string) => {
    setApprovedSites(prev => {
      const next = new Map(prev);
      next.delete(origin);
      return next;
    });
  };

  const getApprovedPermissions = (origin: string): string[] => {
    return Array.from(approvedSites.get(origin) || []);
  };

  return {
    pendingRequest,
    requestPermissions,
    revokePermissions,
    getApprovedPermissions,
  };
}
