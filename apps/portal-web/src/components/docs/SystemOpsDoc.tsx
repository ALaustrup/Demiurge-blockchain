"use client";

export function SystemOpsDoc() {
  return (
    <div className="space-y-6 text-sm text-zinc-200">
      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Chain Node Operations</h3>
        <p className="text-zinc-300 mb-4">
          Technical documentation for system administrators and operators running Demiurge infrastructure.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Installation & Building</h3>
        <div className="p-4 bg-black/20 border border-white/10 rounded-lg">
          <code className="block p-2 bg-black/30 rounded text-xs text-cyan-300 font-mono mb-2">
            cd chain && cargo build --release
          </code>
          <p className="text-xs text-zinc-300">
            Builds the chain node binary. Output: <code className="bg-black/30 px-1 rounded">target/release/demiurge-chain</code>
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Configuration</h3>
        <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside">
          <li><strong className="text-zinc-100">Data Directory:</strong> Default <code className="bg-black/30 px-1 rounded">.demiurge/data</code> (RocksDB storage)</li>
          <li><strong className="text-zinc-100">RPC Endpoint:</strong> Default <code className="bg-black/30 px-1 rounded">http://127.0.0.1:8545/rpc</code></li>
          <li><strong className="text-zinc-100">Genesis Config:</strong> Auto-initializes on first run (Genesis Archon: 1M CGT)</li>
          <li><strong className="text-zinc-100">Network:</strong> Devnet configuration (chain_id: 77701)</li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Running Modes</h3>
        <div className="space-y-3">
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-purple-400 mb-1">Development Mode</h4>
            <code className="block p-2 bg-black/30 rounded text-xs text-cyan-300 font-mono mb-2">
              cargo run -p demiurge-chain
            </code>
            <p className="text-xs text-zinc-300">Runs with debug logging, in-memory state option available for testing.</p>
          </div>
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-purple-400 mb-1">Production Mode</h4>
            <code className="block p-2 bg-black/30 rounded text-xs text-cyan-300 font-mono mb-2">
              ./target/release/demiurge-chain
            </code>
            <p className="text-xs text-zinc-300">Uses RocksDB for persistent state, optimized for performance.</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Service Management</h3>
        <div className="space-y-3">
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-purple-400 mb-1">systemd Service</h4>
            <p className="text-xs text-zinc-300 mb-2">Service file: <code className="bg-black/30 px-1 rounded">demiurge-node0.service</code></p>
            <code className="block p-2 bg-black/30 rounded text-xs text-cyan-300 font-mono">
              sudo systemctl start demiurge-node0<br />
              sudo systemctl status demiurge-node0<br />
              sudo systemctl stop demiurge-node0
            </code>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Monitoring & Logging</h3>
        <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
          <li>Chain height tracking via <code className="bg-black/30 px-1 rounded">cgt_getChainInfo</code> RPC call</li>
          <li>Transaction history per address</li>
          <li>RocksDB database at <code className="bg-black/30 px-1 rounded">.demiurge/data</code></li>
          <li>RPC endpoint health checks</li>
          <li>State integrity verification</li>
        </ul>
      </div>

      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
        <p className="text-xs text-zinc-200">
          <strong>Complete Documentation:</strong> See <code className="bg-black/30 px-1 rounded">docs/system/page.mdx</code> for deployment guides, monitoring setup, and troubleshooting.
        </p>
      </div>
    </div>
  );
}
