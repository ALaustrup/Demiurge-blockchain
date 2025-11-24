"use client";

import { useState, useEffect } from "react";
import { useUrgeID } from "@/hooks/useUrgeID";
import { sdk } from "@/lib/sdk";
import { Image } from "lucide-react";

export default function NFTsPage() {
  const { address } = useUrgeID();
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) {
      loadNFTs();
    }
  }, [address]);

  const loadNFTs = async () => {
    if (!address) return;
    try {
      setLoading(true);
      const nftList = await sdk.nft.getNftsByOwner(address);
      setNfts(nftList);
    } catch (err: any) {
      console.error("Failed to load NFTs:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-zinc-400">Please create or load an UrgeID first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My NFTs</h1>
        
        {loading ? (
          <div className="text-zinc-400">Loading...</div>
        ) : nfts.length === 0 ? (
          <div className="text-center py-12">
            <Image className="h-16 w-16 mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-400">No NFTs found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((nft) => (
              <div
                key={nft.id}
                className="p-6 rounded-lg border border-zinc-800 bg-zinc-900"
              >
                <h3 className="text-lg font-semibold mb-2">NFT #{nft.id}</h3>
                <div className="space-y-1 text-sm text-zinc-400">
                  <div>Creator: {nft.creator.slice(0, 10)}...</div>
                  <div>Fabric Hash: {nft.fabric_root_hash.slice(0, 16)}...</div>
                  {nft.royalty_bps && (
                    <div>Royalty: {nft.royalty_bps} bps</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

