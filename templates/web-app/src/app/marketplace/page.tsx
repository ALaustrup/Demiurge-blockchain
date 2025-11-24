"use client";

import { useState, useEffect } from "react";
import { sdk } from "@/lib/sdk";
import { Store } from "lucide-react";

export default function MarketplacePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      setLoading(true);
      const list = await sdk.marketplace.getAllListings();
      setListings(list);
    } catch (err: any) {
      console.error("Failed to load listings:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Store className="h-8 w-8" />
          Marketplace
        </h1>
        
        {loading ? (
          <div className="text-zinc-400">Loading...</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400">No listings found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="p-6 rounded-lg border border-zinc-800 bg-zinc-900"
              >
                <h3 className="text-lg font-semibold mb-2">Listing #{listing.id}</h3>
                <div className="space-y-1 text-sm text-zinc-400">
                  <div>NFT ID: {listing.nft_id}</div>
                  <div>Price: {listing.price} CGT</div>
                  <div>Seller: {listing.seller.slice(0, 10)}...</div>
                  <div>Status: {listing.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

