"use client";

import { useState, useEffect } from "react";
import { useUrgeID } from "@/hooks/useUrgeID";
import { sdk } from "@/lib/sdk";
import { signTransactionHex } from "@demiurge/ts-sdk";
import { Coins, Send } from "lucide-react";

export default function WalletPage() {
  const { address, privateKey } = useUrgeID();
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (address) {
      loadBalance();
    }
  }, [address]);

  const loadBalance = async () => {
    if (!address) return;
    try {
      setLoading(true);
      const bal = await sdk.cgt.getBalanceFormatted(address);
      setBalance(bal.toFixed(8));
    } catch (err: any) {
      console.error("Failed to load balance:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!address || !privateKey || !sendTo || !sendAmount) return;
    
    try {
      setSending(true);
      
      // Build transaction
      const { unsignedTxHex, nonce } = await sdk.cgt.buildTransfer(
        address,
        sendTo,
        parseFloat(sendAmount)
      );
      
      // Sign transaction
      const signatureHex = await signTransactionHex(unsignedTxHex, privateKey);
      
      // Submit (using RPC directly for now - SDK will have helper)
      const txHash = await sdk.cgt.sendRawTransaction(unsignedTxHex);
      
      alert(`Transaction sent! Hash: ${txHash}`);
      setSendTo("");
      setSendAmount("");
      await loadBalance();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSending(false);
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Wallet</h1>
        
        <div className="space-y-6">
          <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900">
            <div className="flex items-center gap-4 mb-4">
              <Coins className="h-8 w-8 text-rose-400" />
              <div>
                <h2 className="text-2xl font-semibold">CGT Balance</h2>
                {loading ? (
                  <p className="text-zinc-400">Loading...</p>
                ) : (
                  <p className="text-3xl font-bold">{balance ?? "0.00000000"} CGT</p>
                )}
              </div>
            </div>
            <button
              onClick={loadBalance}
              className="text-sm text-rose-400 hover:text-rose-300"
            >
              Refresh
            </button>
          </div>

          <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send CGT
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">To Address</label>
                <input
                  type="text"
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-50"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Amount (CGT)</label>
                <input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.00000001"
                  className="w-full px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-50"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={sending || !sendTo || !sendAmount || !privateKey}
                className="w-full px-6 py-3 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send CGT"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

