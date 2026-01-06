"use client";

export function ArchitectureDoc() {
  return (
    <div className="space-y-6 text-sm text-zinc-200">
      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">System Architecture</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-zinc-100 mb-2">Blockchain Node</h4>
            <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
              <li>Rust-based L1 blockchain</li>
              <li>Custom Proof-of-Work (Forge) - Argon2id + SHA-256</li>
              <li>RocksDB state backend (production)</li>
              <li>JSON-RPC 2.0 API (40+ methods)</li>
              <li>Modular runtime system (9 modules)</li>
              <li>Ed25519 transaction signing</li>
            </ul>
          </div>

          <div className="p-4 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-zinc-100 mb-2">Runtime Modules</h4>
            <ul className="text-xs text-zinc-300 space-y-1">
              <li>bank_cgt, urgeid_registry, nft_dgen</li>
              <li>fabric_manager, abyss_registry</li>
              <li>developer_registry, dev_capsules</li>
              <li>recursion_registry, work_claim</li>
              <li>Versioned registration order</li>
              <li>Cross-module dependencies</li>
            </ul>
          </div>

          <div className="p-4 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-zinc-100 mb-2">Portal Web</h4>
            <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
              <li>Next.js 15+ with React 18</li>
              <li>AbyssID onboarding and profiles</li>
              <li>Chat system (World Chat, DMs)</li>
              <li>Marketplace browsing</li>
              <li>Fabric visualization</li>
              <li>GraphQL integration</li>
            </ul>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-zinc-200 mb-2">Abyss Gateway</h4>
            <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
              <li>GraphQL API for chat/social</li>
              <li>Block indexing</li>
              <li>User profiles and analytics</li>
              <li>Developer data</li>
              <li>Operator context</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-3">Core Concepts</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-cyan-400 mb-2">AbyssID (My Void)</h4>
            <p className="text-xs text-zinc-300">
              Sovereign identity with username, Syzygy score, leveling system, badges. Serves as wallet address and identity profile.
            </p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-cyan-400 mb-2">Archons</h4>
            <p className="text-xs text-zinc-400">
              Creators who can mint D-GEN NFTs, list in Abyss marketplace, upload to Fabric, and earn CGT via seeding and compute.
            </p>
          </div>

          <div className="p-4 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-cyan-400 mb-2">CGT (Creator God Token)</h4>
            <p className="text-xs text-zinc-300">
              Native L1 token: 8 decimals, 1B max supply. Used for gas, fees, Fabric seeding rewards, Forge compute, marketplace prices, royalties.
            </p>
          </div>

          <div className="p-4 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-cyan-400 mb-2">Fabric</h4>
            <p className="text-xs text-zinc-300">
              P2P content network for immutable content roots. Archons register assets with CGT fee pools. Seeders earn CGT via Proof-of-Delivery.
            </p>
          </div>

          <div className="p-4 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-cyan-400 mb-2">Abyss</h4>
            <p className="text-xs text-zinc-300">
              Marketplace and GraphQL Gateway. NFT listings, purchases, royalties. Chat system and social features via GraphQL API.
            </p>
          </div>

          <div className="p-4 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-cyan-400 mb-2">D-GEN NFTs</h4>
            <p className="text-xs text-zinc-300">
              D-721 standard: AI-native NFTs with provenance tracking, configurable royalties, Fabric root hash linking, DEV Badge class.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Data Flow</h3>
        <div className="p-4 bg-black/20 border border-white/10 rounded-lg">
          <ol className="text-xs text-zinc-300 space-y-2 list-decimal list-inside">
            <li>User interacts with Portal Web (Next.js frontend)</li>
            <li>Frontend calls JSON-RPC API (chain node) or GraphQL API (Abyss Gateway)</li>
            <li>Chain node validates transaction, dispatches to runtime module</li>
            <li>Module executes transaction, updates RocksDB state</li>
            <li>Abyss Gateway indexes blocks, provides GraphQL queries</li>
            <li>Frontend updates UI with new state</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
