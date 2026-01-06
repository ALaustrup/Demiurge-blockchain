"use client";

export function CreatorsDoc() {
  return (
    <div className="space-y-6 text-sm text-zinc-200">
      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Becoming an Archon</h3>
        <p className="text-zinc-300 mb-4">
          Archons are creators who have "ascended" to creator status. They can mint D-GEN NFTs, list in the Abyss marketplace, upload to Fabric, and earn CGT.
        </p>
        <div className="p-4 bg-black/20 border border-white/10 rounded-lg">
          <p className="text-xs text-zinc-300">
            <strong className="text-zinc-100">Archon Status:</strong> Set on-chain via genesis or special transaction. Archons have all AbyssID abilities plus creator features.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Minting D-GEN NFTs</h3>
        <div className="space-y-3">
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-cyan-400 mb-1">Requirements</h4>
            <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
              <li>Must have Archon status</li>
              <li>Fabric root hash for content linking</li>
              <li>Optional: Forge model ID and prompt hash</li>
              <li>Optional: Royalty recipient and percentage (basis points)</li>
            </ul>
          </div>
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-cyan-400 mb-1">Transaction</h4>
            <code className="block p-2 bg-black/30 rounded text-xs text-cyan-300 font-mono mb-2">
              cgt_mintDgenNft
            </code>
            <p className="text-xs text-zinc-300">
              Mints a new D-GEN NFT with sequential ID. Creator and owner set to transaction sender.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Listing in Abyss Marketplace</h3>
        <div className="space-y-3">
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-cyan-400 mb-1">Create Listing</h4>
            <code className="block p-2 bg-black/30 rounded text-xs text-cyan-300 font-mono mb-2">
              cgt_buildCreateListingTx
            </code>
            <p className="text-xs text-zinc-300">
              Creates a marketplace listing with price in CGT (smallest units). Validates NFT ownership.
            </p>
          </div>
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-cyan-400 mb-1">Cancel Listing</h4>
            <code className="block p-2 bg-black/30 rounded text-xs text-cyan-300 font-mono mb-2">
              cgt_buildCancelListingTx
            </code>
            <p className="text-xs text-zinc-300">
              Cancels an active listing. Only the seller can cancel their own listings.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Royalties</h3>
        <div className="p-4 bg-black/20 border border-white/10 rounded-lg">
          <p className="text-xs text-zinc-300 mb-2">
            When an NFT is sold in the marketplace:
          </p>
          <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
            <li>If NFT has royalty_recipient and royalty_bps configured:</li>
            <li>Royalty = price_cgt * royalty_bps / 10000</li>
            <li>Seller receives: price_cgt - royalty</li>
            <li>Creator receives: royalty</li>
            <li>Royalties are automatically distributed on purchase</li>
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Earning CGT</h3>
        <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside">
          <li><strong className="text-zinc-100">Fabric Seeding:</strong> Register Fabric assets with CGT fee pools, seeders earn CGT via Proof-of-Delivery</li>
          <li><strong className="text-zinc-100">Marketplace Sales:</strong> Sell NFTs in Abyss marketplace for CGT</li>
          <li><strong className="text-zinc-100">Royalties:</strong> Earn ongoing royalties from secondary sales</li>
          <li><strong className="text-zinc-100">Forge Compute:</strong> Earn CGT for verifiable compute work (future)</li>
        </ul>
      </div>

      <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
        <p className="text-xs text-zinc-200">
          <strong>Complete Documentation:</strong> See <code className="bg-black/30 px-1 rounded">docs/creators/page.mdx</code> for detailed guides, best practices, and examples.
        </p>
      </div>
    </div>
  );
}
