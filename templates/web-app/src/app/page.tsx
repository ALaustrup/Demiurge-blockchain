"use client";

import { useState } from "react";
import { Wallet, Coins, Image, MessageSquare, Store } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Demiurge dApp Template</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/urgeid" className="p-6 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors">
            <Wallet className="h-8 w-8 mb-4 text-rose-400" />
            <h2 className="text-xl font-semibold mb-2">UrgeID</h2>
            <p className="text-zinc-400">Generate or load your UrgeID identity</p>
          </Link>

          <Link href="/wallet" className="p-6 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors">
            <Coins className="h-8 w-8 mb-4 text-rose-400" />
            <h2 className="text-xl font-semibold mb-2">Wallet</h2>
            <p className="text-zinc-400">View balance and send CGT</p>
          </Link>

          <Link href="/nfts" className="p-6 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors">
            <Image className="h-8 w-8 mb-4 text-rose-400" />
            <h2 className="text-xl font-semibold mb-2">NFTs</h2>
            <p className="text-zinc-400">View your D-GEN NFT collection</p>
          </Link>

          <Link href="/marketplace" className="p-6 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors">
            <Store className="h-8 w-8 mb-4 text-rose-400" />
            <h2 className="text-xl font-semibold mb-2">Marketplace</h2>
            <p className="text-zinc-400">Browse and buy NFTs</p>
          </Link>

          <Link href="/chat" className="p-6 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors">
            <MessageSquare className="h-8 w-8 mb-4 text-rose-400" />
            <h2 className="text-xl font-semibold mb-2">Chat</h2>
            <p className="text-zinc-400">World chat and DMs</p>
          </Link>
        </div>
      </div>
    </main>
  );
}

