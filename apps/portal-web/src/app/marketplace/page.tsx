"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Plus, ShoppingCart, X, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";
import {
  getAllListings,
  getListing,
  buildCreateListingTx,
  buildCancelListingTx,
  buildBuyListingTx,
  getNftsByOwner,
  getNft,
  callRpc,
  sendRawTransaction,
  signTransactionRpc,
  getCgtBalance,
  formatCgt,
  cgtToSmallest,
  cgtFromSmallest,
  getNonce,
  type Listing,
  type NftMetadata,
} from "@/lib/rpc";
import { signTransaction } from "@/lib/signing";
import { saveTransaction, generateTxId, updateTransactionStatus } from "@/lib/transactions";

export default function MarketplacePage() {
  const router = useRouter();
  const [address, setAddress] = useState<string>("");
  const [balance, setBalance] = useState<number>(0);
  const [listings, setListings] = useState<Listing[]>([]);
  const [myNfts, setMyNfts] = useState<NftMetadata[]>([]);
  const [nftMetadata, setNftMetadata] = useState<Map<number, NftMetadata>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [selectedNftId, setSelectedNftId] = useState<number | null>(null);
  const [listPrice, setListPrice] = useState("");
  const [listing, setListing] = useState(false);
  const [buyingListingId, setBuyingListingId] = useState<number | null>(null);

  useEffect(() => {
    const storedAddress = localStorage.getItem("demiurge_urgeid_wallet_address");
    if (storedAddress) {
      setAddress(storedAddress);
      loadMarketplaceData(storedAddress);
    } else {
      loadMarketplaceData("");
    }
  }, []);

  const loadMarketplaceData = async (addr: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Load all listings
      const listingsData = await getAllListings();
      setListings(listingsData.listings || []);

      // Load NFT metadata for all listed NFTs
      const metadataMap = new Map<number, NftMetadata>();
      for (const listing of listingsData.listings || []) {
        try {
          const nftData = await getNft(listing.token_id);
          if (nftData) {
            metadataMap.set(listing.token_id, nftData);
          }
        } catch (err) {
          console.warn(`Failed to load metadata for NFT ${listing.token_id}:`, err);
        }
      }
      setNftMetadata(metadataMap);

      // Load user's NFTs if logged in
      if (addr) {
        const nftsData = await getNftsByOwner(addr);
        setMyNfts(nftsData.nfts || []);
        
        const balanceRes = await getCgtBalance(addr);
        const balanceSmallest = BigInt(balanceRes.balance);
        setBalance(Number(balanceSmallest) / 1e8);
      }
    } catch (err: any) {
      console.error("Failed to load marketplace data:", err);
      setError(err.message || "Failed to load marketplace");
    } finally {
      setLoading(false);
    }
  };

  const handleListNft = async () => {
    if (!selectedNftId || !listPrice || !address) {
      alert("Please select an NFT and enter a price");
      return;
    }

    const priceNum = parseFloat(listPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Please enter a valid price");
      return;
    }

    setListing(true);
    setError(null);

    try {
      // Build transaction
      const priceSmallest = cgtToSmallest(priceNum);
      const { tx_hex: unsignedTxHex } = await buildCreateListingTx(
        address,
        selectedNftId,
        priceSmallest
      );

      // Get private key
      const privateKey = localStorage.getItem("demiurge_urgeid_wallet_key");
      if (!privateKey) {
        throw new Error("Private key not found. Please log in again.");
      }

      // Sign transaction - convert hex string to bytes
      const cleanHex = unsignedTxHex.startsWith("0x") ? unsignedTxHex.slice(2) : unsignedTxHex;
      const txBytes = new Uint8Array(cleanHex.length / 2);
      for (let i = 0; i < cleanHex.length; i += 2) {
        txBytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
      }
      const signatureHex = await signTransaction(txBytes, privateKey);
      // For now, return the original hex - proper bincode encoding would be needed
      const signedTxHex = unsignedTxHex;

      // Submit transaction
      const result = await sendRawTransaction(signedTxHex);
      
      // Save to transaction history
      const txId = generateTxId();
      saveTransaction({
        id: txId,
        from: address,
        to: "marketplace",
        amount: priceSmallest,
        amountCgt: priceNum,
        fee: 0.00001,
        timestamp: Date.now(),
        status: "pending",
        txHash: result.tx_hash,
      });

      // Poll for confirmation
      pollTransactionStatus(result.tx_hash, txId);

      alert(`Listing created! Transaction: ${result.tx_hash.slice(0, 16)}...`);
      setShowListModal(false);
      setSelectedNftId(null);
      setListPrice("");
      
      // Reload marketplace
      setTimeout(() => loadMarketplaceData(address), 2000);
    } catch (err: any) {
      console.error("Failed to create listing:", err);
      setError(err.message || "Failed to create listing");
      alert(err.message || "Failed to create listing");
    } finally {
      setListing(false);
    }
  };

  const handleBuyListing = async (listingId: number) => {
    if (!address) {
      alert("Please log in to purchase NFTs");
      router.push("/urgeid");
      return;
    }

    const listing = listings.find((l) => l.id === listingId);
    if (!listing) {
      alert("Listing not found");
      return;
    }

    const price = cgtFromSmallest(listing.price_cgt);
    if (balance < price) {
      alert(`Insufficient balance. You need ${formatCgt(listing.price_cgt)} CGT but have ${balance.toFixed(8)} CGT.`);
      return;
    }

    if (!confirm(`Purchase NFT #${listing.token_id} for ${formatCgt(listing.price_cgt)} CGT?`)) {
      return;
    }

    setBuyingListingId(listingId);
    setError(null);

    try {
      // Build transaction
      const { tx_hex: unsignedTxHex } = await buildBuyListingTx(address, listingId);

      // Get private key
      const privateKey = localStorage.getItem("demiurge_urgeid_wallet_key");
      if (!privateKey) {
        throw new Error("Private key not found. Please log in again.");
      }

      // Sign transaction - convert hex string to bytes
      const cleanHex = unsignedTxHex.startsWith("0x") ? unsignedTxHex.slice(2) : unsignedTxHex;
      const txBytes = new Uint8Array(cleanHex.length / 2);
      for (let i = 0; i < cleanHex.length; i += 2) {
        txBytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
      }
      const signatureHex = await signTransaction(txBytes, privateKey);
      // For now, return the original hex - proper bincode encoding would be needed
      const signedTxHex = unsignedTxHex;

      // Submit transaction
      const result = await sendRawTransaction(signedTxHex);
      
      // Save to transaction history
      const txId = generateTxId();
      saveTransaction({
        id: txId,
        from: address,
        to: listing.seller,
        amount: listing.price_cgt,
        amountCgt: price,
        fee: 0.00001,
        timestamp: Date.now(),
        status: "pending",
        txHash: result.tx_hash,
      });

      // Poll for confirmation
      pollTransactionStatus(result.tx_hash, txId);

      alert(`Purchase successful! Transaction: ${result.tx_hash.slice(0, 16)}...`);
      
      // Reload marketplace
      setTimeout(() => loadMarketplaceData(address), 2000);
    } catch (err: any) {
      console.error("Failed to buy listing:", err);
      setError(err.message || "Failed to purchase NFT");
      alert(err.message || "Failed to purchase NFT");
    } finally {
      setBuyingListingId(null);
    }
  };

  const pollTransactionStatus = async (txHash: string, txId: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        updateTransactionStatus(txId, "failed", txHash, "Timeout waiting for confirmation");
        return;
      }

      try {
        const tx = await callRpc<any>("cgt_getTransaction", { tx_hash: txHash });
        if (tx) {
          updateTransactionStatus(txId, "confirmed", txHash);
          // Reload balance
          if (address) {
            const balanceRes = await getCgtBalance(address);
            const balanceSmallest = BigInt(balanceRes.balance);
            setBalance(Number(balanceSmallest) / 1e8);
          }
          return;
        }
      } catch (err) {
        // Transaction not found yet, continue polling
      }

      attempts++;
      setTimeout(poll, 2000);
    };

    poll();
  };

  if (loading) {
    return (
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-50">Abyss Marketplace</h1>
        <p className="mt-2 text-zinc-400">Buy and sell D-GEN NFTs with CGT</p>
        {address && (
          <div className="mt-4 flex items-center gap-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2">
              <span className="text-sm text-zinc-400">Balance: </span>
              <span className="font-semibold text-slate-50">{balance.toFixed(8)} CGT</span>
            </div>
            <button
              onClick={() => setShowListModal(true)}
              className="flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 font-semibold text-white hover:bg-rose-600"
            >
              <Plus className="h-4 w-4" />
              List NFT
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-800 bg-red-950/30 p-4 text-red-300">
          {error}
        </div>
      )}

      {listings.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50">
          <div className="text-center">
            <Store className="mx-auto h-12 w-12 text-zinc-600" />
            <p className="mt-4 text-zinc-400">No active listings yet</p>
            {address && (
              <button
                onClick={() => setShowListModal(true)}
                className="mt-4 rounded-lg bg-rose-500 px-4 py-2 text-white hover:bg-rose-600"
              >
                List Your First NFT
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => {
            const metadata = nftMetadata.get(listing.token_id);
            const price = cgtFromSmallest(listing.price_cgt);
            const isMyListing = listing.seller.toLowerCase() === address.toLowerCase();
            const canAfford = balance >= price;

            return (
              <div
                key={listing.id}
                className="group rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-rose-500/50 hover:bg-zinc-900"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                    <span className="font-semibold text-slate-50">NFT #{listing.token_id}</span>
                  </div>
                  {metadata?.royalty_bps && metadata.royalty_bps > 0 && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-1 text-xs font-semibold text-amber-400">
                      {metadata.royalty_bps / 100}% Royalty
                    </span>
                  )}
                </div>

                {metadata?.name && (
                  <h3 className="mb-2 text-lg font-semibold text-slate-50">{metadata.name}</h3>
                )}
                {metadata?.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-zinc-400">{metadata.description}</p>
                )}

                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Price:</span>
                    <span className="font-semibold text-slate-50">{formatCgt(listing.price_cgt)} CGT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Seller:</span>
                    <span className="font-mono text-xs text-zinc-300">
                      {listing.seller.slice(0, 8)}...{listing.seller.slice(-6)}
                    </span>
                  </div>
                  {metadata?.creator && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Creator:</span>
                      <span className="font-mono text-xs text-zinc-300">
                        {metadata.creator.slice(0, 8)}...{metadata.creator.slice(-6)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {isMyListing ? (
                    <button
                      disabled
                      className="flex-1 rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-500"
                    >
                      Your Listing
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuyListing(listing.id)}
                      disabled={!address || !canAfford || buyingListingId === listing.id}
                      className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                        !address
                          ? "bg-zinc-800 text-zinc-500"
                          : !canAfford
                          ? "bg-zinc-800 text-zinc-500"
                          : buyingListingId === listing.id
                          ? "bg-rose-600 text-white"
                          : "bg-rose-500 text-white hover:bg-rose-600"
                      }`}
                    >
                      {buyingListingId === listing.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </span>
                      ) : !address ? (
                        "Login to Buy"
                      ) : !canAfford ? (
                        "Insufficient Balance"
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 inline h-4 w-4" />
                          Buy Now
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List NFT Modal */}
      {showListModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => {
            setShowListModal(false);
            setSelectedNftId(null);
            setListPrice("");
          }}
        >
          <div
            className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-50">List NFT for Sale</h3>
              <button
                onClick={() => {
                  setShowListModal(false);
                  setSelectedNftId(null);
                  setListPrice("");
                }}
                className="rounded p-1 text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!address ? (
              <div className="rounded-lg border border-amber-700 bg-amber-900/20 p-3 text-sm text-amber-300">
                Please log in via "My Void" to list NFTs.
              </div>
            ) : myNfts.length === 0 ? (
              <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-sm text-zinc-400">
                You don't own any NFTs yet. Mint one first!
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-300">
                    Select NFT
                  </label>
                  <select
                    value={selectedNftId || ""}
                    onChange={(e) => setSelectedNftId(parseInt(e.target.value) || null)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100"
                  >
                    <option value="">Choose an NFT...</option>
                    {myNfts.map((nft) => (
                      <option key={nft.id} value={nft.id}>
                        NFT #{nft.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-300">
                    Price (CGT)
                  </label>
                  <input
                    type="number"
                    value={listPrice}
                    onChange={(e) => setListPrice(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.00000001"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowListModal(false);
                      setSelectedNftId(null);
                      setListPrice("");
                    }}
                    className="rounded-lg bg-zinc-700 px-4 py-2 text-zinc-300 hover:bg-zinc-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleListNft}
                    disabled={!selectedNftId || !listPrice || listing}
                    className="rounded-lg bg-rose-500 px-4 py-2 font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
                  >
                    {listing ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Listing...
                      </span>
                    ) : (
                      "Create Listing"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

