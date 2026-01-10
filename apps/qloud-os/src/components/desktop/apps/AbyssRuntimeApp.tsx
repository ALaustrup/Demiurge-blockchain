/**
 * Abyss Runtime Application
 * 
 * Upload and execute WASM modules
 */

import { useState, useRef, useEffect } from 'react';
import { useQorID } from '../../../hooks/useAbyssID';
import { wasmVM, type WASMModule } from '../../../services/runtime/wasmVM';
import { submitVMJob } from '../../../services/qorvm/qorvm';
import { processManager } from '../../../services/system/processManager';
import { fs } from '../../../services/vfs';
import { peerDiscovery } from '../../../services/grid/discovery';
import { Button } from '../../shared/Button';
import type { VMExecutionResult } from '../../../services/qorvm/types';

export function AbyssRuntimeApp() {
  const { session } = useQorID();
  const [modules, setModules] = useState<WASMModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<VMExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executeOnGrid, setExecuteOnGrid] = useState(false);
  const [availablePeers, setAvailablePeers] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Update available peers count
  useEffect(() => {
    const updatePeers = () => {
      setAvailablePeers(peerDiscovery.getPeers().length);
    };
    updatePeers();
    const unsubscribe = peerDiscovery.onPeersUpdate(updatePeers);
    return unsubscribe;
  }, []);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const moduleId = `wasm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const module: WASMModule = {
        id: moduleId,
        name: file.name,
        wasmBytes: bytes,
        metadata: {
          version: '1.0.0',
        },
      };
      
      // Save to VFS
      await fs.write(`/runtime/${moduleId}.wasm`, bytes, { mime: 'application/wasm' });
      
      // Load into VM
      await wasmVM.loadModule(module);
      
      setModules(prev => [...prev, module]);
      setSelectedModule(moduleId);
    } catch (error: any) {
      alert(`Failed to load WASM module: ${error.message}`);
    }
  };
  
  const handleExecute = async () => {
    if (!selectedModule || !session) {
      alert('Please select a module and log in');
      return;
    }
    
    setIsExecuting(true);
    setExecutionResult(null);
    
    // Create ABI
    const abi = {
      log: (message: string) => {
        console.log(`[WASM] ${message}`);
      },
      getWalletAddress: async () => {
        // Return mock address for now
        return session.publicKey;
      },
      signMessage: async (message: string) => {
        // Mock signing
        return `mock_sig_${message.slice(0, 8)}`;
      },
      rpcCall: async (method: string, params: any[]) => {
        const rpcUrl = import.meta.env.VITE_DEMIURGE_RPC_URL || 'https://rpc.demiurge.cloud/rpc';
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method,
            params,
            id: Date.now(),
          }),
        });
        const json = await response.json();
        return json.result;
      },
      readFile: async (path: string) => {
        const node = await fs.read(path);
        if (node?.type === 'file' && node.data) {
          return typeof node.data === 'string' 
            ? new TextEncoder().encode(node.data)
            : node.data;
        }
        return null;
      },
      writeFile: async (path: string, data: Uint8Array) => {
        await fs.write(path, data);
        return true;
      },
    };
    
    // Spawn process
    const pid = processManager.spawn(
      `WASM:${selectedModule}`,
      'wasm',
      async () => {
        try {
          // Use AbyssVM for execution (supports local + grid)
          const result = await submitVMJob(
            selectedModule,
            {}, // Input
            {
              ...abi,
              getJobId: () => `job:${selectedModule}:${Date.now()}`,
              getPeerId: () => 'local',
            },
            {
              executeRemotely: executeOnGrid,
              requireReceipt: true,
            }
          );
          setExecutionResult(result);
        } catch (error: any) {
          setExecutionResult({
            success: false,
            error: error.message,
            logs: [],
            executionTime: 0,
            peerId: 'local',
          });
        } finally {
          setIsExecuting(false);
        }
      },
      () => {
        wasmVM.stop(selectedModule);
      }
    );
    
    // Auto-stop after 30 seconds
    setTimeout(() => {
      processManager.kill(pid);
    }, 30000);
  };
  
  const handleStop = () => {
    if (selectedModule) {
      wasmVM.stop(selectedModule);
      setIsExecuting(false);
          setExecutionResult({
            success: false,
            error: 'Execution stopped',
            logs: wasmVM.getLogs(selectedModule),
            executionTime: 0,
            peerId: 'local',
          });
    }
  };
  
  return (
    <div className="h-full flex flex-col min-h-0 p-6 space-y-6 overflow-auto">
      <div>
        <h2 className="text-2xl font-bold text-genesis-cipher-cyan mb-2">Abyss Runtime</h2>
        <p className="text-sm text-genesis-text-tertiary">Upload and execute WASM modules</p>
      </div>
      
      {/* Upload Section */}
      <div className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".wasm"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="secondary"
          >
            Upload WASM Module
          </Button>
          <span className="text-xs text-genesis-text-tertiary">
            {modules.length} module{modules.length !== 1 ? 's' : ''} loaded
          </span>
        </div>
      </div>
      
      {/* Module List */}
      {modules.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-genesis-cipher-cyan mb-4">Loaded Modules</h3>
          <div className="space-y-2">
            {modules.map((module) => (
              <div
                key={module.id}
                onClick={() => setSelectedModule(module.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedModule === module.id
                    ? 'bg-abyss-cyan/10 border-genesis-border-default'
                    : 'bg-genesis-glass-light/50 border-genesis-border-default/20 hover:border-genesis-border-default/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-genesis-cipher-cyan">{module.name}</div>
                    <div className="text-xs text-genesis-text-tertiary mt-1">ID: {module.id.slice(0, 16)}...</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {wasmVM.isRunning(module.id) ? (
                      <span className="text-green-400">Running</span>
                    ) : (
                      <span>Stopped</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Execution Controls */}
      {selectedModule && (
        <div className="bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={executeOnGrid}
                onChange={(e) => setExecuteOnGrid(e.target.checked)}
                className="w-4 h-4 text-genesis-cipher-cyan bg-genesis-glass-light border-genesis-border-default/30 rounded focus:ring-abyss-cyan"
              />
              <span className="text-sm text-genesis-text-secondary">
                Execute on Grid {availablePeers > 0 && `(${availablePeers} peers)`}
              </span>
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleExecute}
              disabled={isExecuting || !session}
              className="flex-1"
            >
              {isExecuting ? 'Executing...' : executeOnGrid ? 'Execute on Grid' : 'Execute Locally'}
            </Button>
            {isExecuting && (
              <Button
                onClick={handleStop}
                variant="secondary"
              >
                Stop
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Execution Results */}
      {executionResult && (
        <div className="bg-genesis-glass-light/50 border border-genesis-border-default/20 rounded-lg p-4">
          <h3 className="text-lg font-bold text-genesis-cipher-cyan mb-2">Execution Result</h3>
          <div className={`mb-2 ${executionResult.success ? 'text-green-400' : 'text-red-400'}`}>
            {executionResult.success ? '✓ Success' : '✗ Failed'}
          </div>
          {executionResult.error && (
            <div className="text-red-400 text-sm mb-2">Error: {executionResult.error}</div>
          )}
          {executionResult.output && (
            <div className="text-genesis-text-secondary text-sm mb-2">{executionResult.output}</div>
          )}
          {executionResult.logs.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-genesis-text-tertiary mb-2">Logs:</div>
              <div className="bg-genesis-glass-light rounded p-2 font-mono text-xs max-h-40 overflow-auto">
                {executionResult.logs.map((log, i) => (
                  <div key={i} className="text-genesis-text-secondary">{log}</div>
                ))}
              </div>
            </div>
          )}
          {executionResult.receipt && (
            <div className="mt-4 p-3 bg-abyss-purple/10 border border-abyss-purple/30 rounded">
              <div className="text-xs text-genesis-text-tertiary mb-1">Execution Receipt</div>
              <div className="text-xs font-mono text-genesis-cipher-cyan">
                {executionResult.receipt.receiptId.slice(0, 32)}...
              </div>
              <div className="text-xs text-genesis-text-tertiary mt-1">
                Executed on: {executionResult.peerId} • {executionResult.executionTime}ms
              </div>
            </div>
          )}
        </div>
      )}
      
      {!session && (
        <div className="bg-abyss-purple/10 border border-abyss-purple/30 rounded-lg p-4 text-sm text-genesis-text-secondary">
          Please log in with QorID to execute WASM modules.
        </div>
      )}
    </div>
  );
}

