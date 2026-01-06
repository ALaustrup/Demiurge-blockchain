"use client";

export function RuntimeModulesDoc() {
  return (
    <div className="space-y-6 text-sm text-zinc-200">
      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Overview</h3>
        <p className="text-zinc-300 mb-4">
          The Demiurge blockchain uses a modular runtime system with 9 core modules. Each module handles a specific domain of functionality and communicates through a standardized interface.
        </p>
        <p className="text-zinc-300 mb-4">
          <strong className="text-zinc-100">Runtime Version:</strong> 1<br />
          <strong className="text-zinc-100">Total Modules:</strong> 9<br />
          <strong className="text-zinc-100">Module Order:</strong> Deterministic and versioned
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Module List</h3>
        <div className="space-y-3">
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-rose-400 mb-1">1. Bank CGT (bank_cgt)</h4>
            <p className="text-xs text-zinc-300">CGT token operations: balances, transfers, minting, supply management. Constants: CGT_NAME, CGT_SYMBOL, CGT_DECIMALS (8), CGT_MAX_SUPPLY (1B).</p>
          </div>
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-rose-400 mb-1">2. AbyssID Registry (urgeid_registry)</h4>
            <p className="text-xs text-zinc-300">Identity system: profiles, usernames, Syzygy scores, leveling (level = 1 + syzygy/1000), badges (Luminary at 10K syzygy), CGT rewards for level-ups.</p>
          </div>
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-rose-400 mb-1">3. NFT D-GEN (nft_dgen)</h4>
            <p className="text-xs text-zinc-300">D-721 NFT standard: Archon-only minting, transfers, royalties (basis points), DEV Badge auto-minting for developers, Fabric root hash linking.</p>
          </div>
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-rose-400 mb-1">4. Fabric Manager (fabric_manager)</h4>
            <p className="text-xs text-zinc-300">P2P Fabric asset registration, CGT fee pools, seeder rewards (Proof-of-Delivery). Archons register content with initial reward pools.</p>
          </div>
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-rose-400 mb-1">5. Abyss Registry (abyss_registry)</h4>
            <p className="text-xs text-zinc-300">NFT marketplace: create/cancel listings, purchase NFTs with CGT, automatic royalty distribution to creators (if configured).</p>
          </div>
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-rose-400 mb-1">6. Developer Registry (developer_registry)</h4>
            <p className="text-xs text-zinc-300">Developer profiles, project registration, reputation tracking. Auto-mints DEV Badge NFT on registration. Username must match AbyssID username.</p>
          </div>
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-rose-400 mb-1">7. Dev Capsules (dev_capsules)</h4>
            <p className="text-xs text-zinc-300">Development capsule management: draft, live, paused, archived states. Project-bound execution environments tracked on-chain with notes and metadata.</p>
          </div>
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-rose-400 mb-1">8. Recursion Registry (recursion_registry)</h4>
            <p className="text-xs text-zinc-300">Recursion Worlds: chain-native game worlds with Fabric content linking. World registration, ownership tracking, metadata (title, description, fabric_root_hash).</p>
          </div>
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-rose-400 mb-1">9. Work Claim (work_claim)</h4>
            <p className="text-xs text-zinc-300">Work-claim mining: arcade miners (e.g., Mandelbrot) submit claims with depth_metric and active_ms. Formula: (depth * 100.0 + time/1000 * 0.1).min(1M CGT).</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Module Interaction</h3>
        <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
          <li><strong className="text-zinc-100">Abyss Registry</strong> → NFT D-GEN: Transfers NFTs during purchases</li>
          <li><strong className="text-zinc-100">Abyss Registry</strong> → Bank CGT: Handles CGT transfers and royalties</li>
          <li><strong className="text-zinc-100">Developer Registry</strong> → NFT D-GEN: Auto-mints DEV Badge NFTs</li>
          <li><strong className="text-zinc-100">Fabric Manager</strong> → Bank CGT: Manages CGT fee pools</li>
          <li><strong className="text-zinc-100">Work Claim</strong> → Bank CGT: Mints CGT rewards</li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Transaction Flow</h3>
        <ol className="text-xs text-zinc-300 space-y-1 list-decimal list-inside">
          <li>Transaction received via RPC (cgt_sendRawTransaction)</li>
          <li>Transaction validated (signature, nonce, balance for fees)</li>
          <li>Runtime dispatches to appropriate module based on module_id</li>
          <li>Module executes call_id with transaction payload</li>
          <li>State updates are committed atomically</li>
          <li>Transaction hash stored for tracking</li>
        </ol>
      </div>

      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
        <p className="text-xs text-zinc-200">
          <strong>Complete Documentation:</strong> See <code className="bg-black/30 px-1 rounded">docs/overview/RUNTIME.md</code> for full details including transaction calls, data structures, storage keys, and validation rules.
        </p>
      </div>
    </div>
  );
}
