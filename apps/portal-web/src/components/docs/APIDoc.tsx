"use client";

export function APIDoc() {
  return (
    <div className="space-y-6 text-sm text-zinc-200">
      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">JSON-RPC API</h3>
        <p className="text-zinc-300 mb-4">
          The Demiurge chain node exposes a JSON-RPC 2.0 API with 40+ methods for interacting with the blockchain.
        </p>
        <div className="p-4 bg-black/20 border border-white/10 rounded-lg mb-4">
          <p className="text-xs text-zinc-300 mb-2">
            <strong className="text-zinc-100">Endpoint:</strong> <code className="bg-black/30 px-1 rounded">http://127.0.0.1:8545/rpc</code> (dev) or <code className="bg-black/30 px-1 rounded">https://rpc.demiurge.cloud/rpc</code> (production)
          </p>
          <p className="text-xs text-zinc-300">
            <strong className="text-zinc-100">Protocol:</strong> JSON-RPC 2.0
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Key RPC Methods</h3>
        <div className="space-y-3">
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-fuchsia-400 mb-1">Chain Info</h4>
            <code className="text-xs text-cyan-300">cgt_getChainInfo</code> - Get chain height and status
          </div>
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-fuchsia-400 mb-1">CGT Operations</h4>
            <ul className="text-xs text-zinc-300 space-y-1 mt-2">
              <li><code className="bg-black/30 px-1 rounded">cgt_getBalance</code> - Get CGT balance</li>
              <li><code className="bg-black/30 px-1 rounded">cgt_getTotalSupply</code> - Get total CGT supply</li>
              <li><code className="bg-black/30 px-1 rounded">cgt_getMetadata</code> - Get CGT currency metadata</li>
              <li><code className="bg-black/30 px-1 rounded">cgt_buildTransferTx</code> - Build transfer transaction</li>
              <li><code className="bg-black/30 px-1 rounded">cgt_sendRawTransaction</code> - Submit transaction</li>
            </ul>
          </div>
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-fuchsia-400 mb-1">AbyssID Operations</h4>
            <ul className="text-xs text-zinc-300 space-y-1 mt-2">
              <li><code className="bg-black/30 px-1 rounded">urgeid_create</code> - Create AbyssID profile</li>
              <li><code className="bg-black/30 px-1 rounded">urgeid_get</code> - Get profile by address</li>
              <li><code className="bg-black/30 px-1 rounded">urgeid_setUsername</code> - Set username</li>
              <li><code className="bg-black/30 px-1 rounded">urgeid_resolveUsername</code> - Resolve username to address</li>
              <li><code className="bg-black/30 px-1 rounded">urgeid_recordSyzygy</code> - Record contribution</li>
            </ul>
          </div>
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-fuchsia-400 mb-1">NFT Operations</h4>
            <ul className="text-xs text-zinc-300 space-y-1 mt-2">
              <li><code className="bg-black/30 px-1 rounded">cgt_getNftsByOwner</code> - Get NFTs by owner</li>
              <li><code className="bg-black/30 px-1 rounded">cgt_mintDgenNft</code> - Mint D-GEN NFT (Archons only)</li>
            </ul>
          </div>
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-fuchsia-400 mb-1">Marketplace Operations</h4>
            <ul className="text-xs text-zinc-300 space-y-1 mt-2">
              <li><code className="bg-black/30 px-1 rounded">cgt_getListing</code> - Get listing by ID</li>
              <li><code className="bg-black/30 px-1 rounded">cgt_getAllListings</code> - Get all active listings</li>
              <li><code className="bg-black/30 px-1 rounded">cgt_buildCreateListingTx</code> - Build create listing transaction</li>
              <li><code className="bg-black/30 px-1 rounded">cgt_buildBuyListingTx</code> - Build buy listing transaction</li>
            </ul>
          </div>
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-fuchsia-400 mb-1">Developer Operations</h4>
            <ul className="text-xs text-zinc-300 space-y-1 mt-2">
              <li><code className="bg-black/30 px-1 rounded">dev_registerDeveloper</code> - Register as developer</li>
              <li><code className="bg-black/30 px-1 rounded">dev_getDeveloperProfile</code> - Get developer profile</li>
              <li><code className="bg-black/30 px-1 rounded">dev_addProject</code> - Add project to developer</li>
            </ul>
          </div>
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-fuchsia-400 mb-1">Work Claim</h4>
            <ul className="text-xs text-zinc-300 space-y-1 mt-2">
              <li><code className="bg-black/30 px-1 rounded">work_claim_submit</code> - Submit work claim for CGT rewards</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">GraphQL API</h3>
        <div className="p-4 bg-black/20 border border-white/10 rounded-lg">
          <p className="text-xs text-zinc-300 mb-2">
            <strong className="text-zinc-100">Endpoint:</strong> <code className="bg-black/30 px-1 rounded">http://localhost:4000/graphql</code>
          </p>
          <p className="text-xs text-zinc-300 mb-2">
            <strong className="text-zinc-100">Queries:</strong> Chat messages, users, rooms, developer data, operator context
          </p>
          <p className="text-xs text-zinc-300">
            <strong className="text-zinc-100">Mutations:</strong> Send messages, create rooms, update settings
          </p>
        </div>
      </div>

      <div className="p-4 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-lg">
        <p className="text-xs text-zinc-200">
          <strong>Complete Documentation:</strong> See <code className="bg-black/30 px-1 rounded">docs/api/page.mdx</code> for full method reference, parameters, and examples.
        </p>
      </div>
    </div>
  );
}
