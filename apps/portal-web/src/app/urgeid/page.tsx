"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Coins, Sparkles, ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import QRCode from "react-qr-code";
import {
  callRpc,
  formatCgt,
  getCgtBalance,
  cgtToSmallest,
  getNonce,
  buildTransferTx,
  sendRawTransaction,
  getTransaction,
  getTransactionHistory,
  signTransactionRpc,
  setUsername,
  resolveUsername,
  getUrgeIdProgress,
  type UrgeIDProfile,
  type UrgeIDProgress,
} from "@/lib/rpc";
import { signTransaction } from "@/lib/signing";
import { formatUrgeId } from "@/lib/urgeid";
import { exportVault, importVault } from "@/lib/vault";
import {
  saveTransaction,
  getTransactionsForAddress,
  updateTransactionStatus,
  generateTxId,
  type TransactionRecord,
} from "@/lib/transactions";

type UrgeIdViewMode = "landing" | "login" | "dashboard";

type Nft = {
  id: number;
  owner: string;
  creator: string;
  fabric_root_hash: string;
  royalty_bps?: number;
};

export default function UrgeIDPage() {
  const router = useRouter();
  const [mode, setMode] = useState<UrgeIdViewMode>("landing");
  const [address, setAddress] = useState<string>("");
  const [privateKey, setPrivateKey] = useState<string>("");
  const [loginAddressInput, setLoginAddressInput] = useState<string>("");
  const [profile, setProfile] = useState<UrgeIDProfile | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [nfts, setNfts] = useState<Nft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<UrgeIDProgress | null>(null);
  const [vaultStatus, setVaultStatus] = useState<string | null>(null);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [resolvedRecipient, setResolvedRecipient] = useState<{
    address: string;
    username?: string;
  } | null>(null);
  const [resolvingRecipient, setResolvingRecipient] = useState(false);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [txHistory, setTxHistory] = useState<TransactionRecord[]>([]);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  // Check if user already has a wallet on mount
  useEffect(() => {
    const storedAddress = localStorage.getItem("demiurge_urgeid_wallet_address");
    const storedKey = localStorage.getItem("demiurge_urgeid_wallet_key");
    if (storedAddress && storedKey) {
      setAddress(storedAddress);
      setPrivateKey(storedKey);
      setMode("dashboard");
      loadDashboard(storedAddress);
      const history = getTransactionsForAddress(storedAddress);
      setTxHistory(history);
    }
  }, []);

  const generateKeypair = () => {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const addrHex = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const keyHex = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    setAddress(addrHex);
    setPrivateKey(keyHex);
    return { address: addrHex, privateKey: keyHex };
  };

  const createUrgeID = async (addr?: string, key?: string) => {
    // Use provided address/key or fall back to state
    const finalAddress = addr || address;
    const finalKey = key || privateKey;
    
    if (!finalAddress) {
      setError("Address is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Auto-set display_name to a default (we'll use username later)
      const displayName = `UrgeID ${address.slice(0, 8)}`;
      
      const profile = await callRpc<UrgeIDProfile>("urgeid_create", {
        address: finalAddress,
        display_name: displayName,
        bio: null,
      });

      // Store wallet locally
      localStorage.setItem("demiurge_urgeid_wallet_address", finalAddress);
      localStorage.setItem("demiurge_urgeid_wallet_key", finalKey);
      
      // Update state
      setAddress(finalAddress);
      setPrivateKey(finalKey);

      setProfile(profile);
      setMode("dashboard");
      setShowSecurityModal(true);
      await loadDashboard(finalAddress);
    } catch (err: any) {
      setError(err.message || "Failed to create UrgeID profile");
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async (addr: string) => {
    try {
      // Load profile
      const profile = await callRpc<UrgeIDProfile | null>("urgeid_get", {
        address: addr,
      });
      if (profile) {
        setProfile(profile);
        if (profile.username) {
          setUsernameInput(profile.username);
        }
      }

      // Load balance
      const balanceRes = await getCgtBalance(addr);
      const balanceSmallest = BigInt(balanceRes.balance);
      const balanceNum = Number(balanceSmallest) / 1e8;
      setBalance(balanceNum);

      // Load NFTs
      const nftsRes = await callRpc<{ nfts: Nft[] }>("cgt_getNftsByOwner", {
        address: addr,
      });
      setNfts(nftsRes.nfts || []);

      // Load progression data
      try {
        const progressData = await getUrgeIdProgress(addr);
        setProgress(progressData);
      } catch (err) {
        console.error("Failed to load progression:", err);
      }

      // Load transaction history
      try {
        const onChainHistory = await getTransactionHistory(addr, 50);
        const localHistory = getTransactionsForAddress(addr);
        const allHashes = new Set([
          ...onChainHistory.transactions,
          ...localHistory.map((tx) => tx.txHash || tx.id),
        ]);
        
        for (const hash of allHashes) {
          if (onChainHistory.transactions.includes(hash)) {
            updateTransactionStatus(hash, "confirmed", hash);
          }
        }
        
        setTxHistory(getTransactionsForAddress(addr));
      } catch (err) {
        console.error("Failed to load on-chain history:", err);
      }
    } catch (err: any) {
      console.error("Failed to load dashboard:", err);
      setError(err.message || "Failed to load dashboard");
    }
  };

  const handleLogin = async () => {
    if (!loginAddressInput.trim()) {
      setError("Please enter an UrgeID address");
      return;
    }

    // Normalize address (remove 0x prefix, ensure 64 chars)
    let normalizedAddr = loginAddressInput.trim();
    if (normalizedAddr.startsWith("0x")) {
      normalizedAddr = normalizedAddr.slice(2);
    }
    
    if (normalizedAddr.length !== 64) {
      setError("Invalid address format. Must be 64 hex characters.");
      return;
    }

    // Validate hex
    if (!/^[0-9a-fA-F]{64}$/.test(normalizedAddr)) {
      setError("Invalid address format. Must be hexadecimal.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to load profile
      const profile = await callRpc<UrgeIDProfile | null>("urgeid_get", {
        address: normalizedAddr,
      });

      if (!profile) {
        setError("No UrgeID found for this address. Check the address or generate a new one.");
        setLoading(false);
        return;
      }

      // Load balance
      const balanceRes = await getCgtBalance(normalizedAddr);
      const balanceSmallest = BigInt(balanceRes.balance);
      const balanceNum = Number(balanceSmallest) / 1e8;
      setBalance(balanceNum);

      setAddress(normalizedAddr);
      setProfile(profile);
      setMode("dashboard");
      
      // Check if we have a private key for this address
      const storedKey = localStorage.getItem("demiurge_urgeid_wallet_key");
      const storedAddr = localStorage.getItem("demiurge_urgeid_wallet_address");
      if (storedKey && storedAddr === normalizedAddr) {
        setPrivateKey(storedKey);
      } else {
        setPrivateKey(""); // View-only mode
      }

      await loadDashboard(normalizedAddr);
    } catch (err: any) {
      setError(err.message || "Failed to load UrgeID");
    } finally {
      setLoading(false);
    }
  };

  // Helper to shorten address for display
  const shortenAddress = (addr: string) => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  // Resolve recipient (username or address)
  const resolveRecipient = async (input: string) => {
    if (!input.trim()) {
      setResolvedRecipient(null);
      setRecipientError(null);
      return;
    }

    const trimmed = input.trim();
    
    // Check if it's a hex address (64 chars, with or without 0x)
    let normalizedAddr = trimmed;
    if (normalizedAddr.startsWith("0x")) {
      normalizedAddr = normalizedAddr.slice(2);
    }
    
    // If it's exactly 64 hex characters, treat as address
    if (normalizedAddr.length === 64 && /^[0-9a-fA-F]{64}$/.test(normalizedAddr)) {
      setResolvedRecipient({ address: normalizedAddr });
      setRecipientError(null);
      return;
    }

    // Otherwise, treat as username
    setResolvingRecipient(true);
    setRecipientError(null);
    
    try {
      // Normalize username: strip leading @, lowercase, trim
      const normalizedUsername = trimmed.replace(/^@/, "").toLowerCase().trim();
      
      if (normalizedUsername.length < 3) {
        setRecipientError("Username must be at least 3 characters");
        setResolvedRecipient(null);
        setResolvingRecipient(false);
        return;
      }

      const result = await resolveUsername(normalizedUsername);
      setResolvedRecipient({
        address: result.address,
        username: normalizedUsername,
      });
      setRecipientError(null);
    } catch (err: any) {
      setRecipientError(err.message || "No UrgeID found for this username");
      setResolvedRecipient(null);
    } finally {
      setResolvingRecipient(false);
    }
  };

  const handleSendCgt = async () => {
    if (!profile || !sendTo.trim() || !sendAmount.trim()) {
      setSendStatus("Please fill in all fields");
      return;
    }

    // Ensure recipient is resolved
    let recipient = resolvedRecipient;
    if (!recipient) {
      await resolveRecipient(sendTo);
      recipient = resolvedRecipient;
      if (!recipient) {
        setSendStatus("Please enter a valid recipient (username or address)");
        return;
      }
    }

    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      setSendStatus("Invalid amount");
      return;
    }

    setSending(true);
    setSendStatus(null);

    try {
      // Get nonce
      const nonceRes = await getNonce(profile.address);
      const nonce = nonceRes.nonce;

      // Build transaction using resolved address
      const amountSmallest = cgtToSmallest(amount);
      const { tx_hex: unsignedTxHex } = await buildTransferTx(
        profile.address,
        recipient.address,
        amountSmallest,
        nonce
      );

      // Get private key
      const storedKey = localStorage.getItem("demiurge_urgeid_wallet_key");
      if (!storedKey) {
        throw new Error("Private key not available. Cannot sign transaction.");
      }

      // Sign transaction
      const txBytes = new Uint8Array(
        unsignedTxHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
      );
      const signatureHex = await signTransaction(txBytes, storedKey);

      // Attach signature
      const { tx_hex: signedTxHex } = await signTransactionRpc(
        unsignedTxHex,
        signatureHex
      );

      // Submit transaction
      const result = await sendRawTransaction(signedTxHex);
      
      // Save to local history
      const txRecord: TransactionRecord = {
        id: generateTxId(),
        txHash: result.tx_hash,
        from: profile.address,
        to: recipient.address,
        amount: amountSmallest,
        amountCgt: amount,
        fee: 0,
        timestamp: Date.now(),
        status: "pending",
      };
      saveTransaction(txRecord);
      setTxHistory(getTransactionsForAddress(profile.address));

      setSendStatus(`Transaction submitted! Hash: ${result.tx_hash.slice(0, 8)}...`);
      setSendTo("");
      setSendAmount("");
      setResolvedRecipient(null);

      // Poll for confirmation
      pollTransactionStatus(result.tx_hash);
    } catch (err: any) {
      setSendStatus(err.message || "Failed to send transaction");
    } finally {
      setSending(false);
    }
  };

  const pollTransactionStatus = async (txHash: string) => {
    if (!profile) return;
    
    let attempts = 0;
    const maxAttempts = 10;
    const pollInterval = 2000;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        updateTransactionStatus(txHash, "failed", txHash);
        setTxHistory(getTransactionsForAddress(profile!.address));
        return;
      }

      try {
        const tx = await getTransaction(txHash);
        if (tx) {
          updateTransactionStatus(txHash, "confirmed", txHash);
          setTxHistory(getTransactionsForAddress(profile!.address));
          
          // Refresh balances after confirmation
          try {
            await loadDashboard(profile.address);
          } catch (err) {
            console.error("Failed to refresh balance:", err);
          }
          
          return;
        }
      } catch (err) {
        // Transaction not found yet, continue polling
      }

      attempts++;
      setTimeout(poll, pollInterval);
    };

    setTimeout(poll, pollInterval);
  };

  // Landing view
  if (mode === "landing") {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        <motion.div
          className="space-y-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-semibold text-slate-50">My Void</h1>
          <p className="text-sm text-slate-300">
            Your Void (UrgeID) is your sovereign identity on the Demiurge blockchain. It's your wallet address, your username, and your profile—all in one. Use it to earn CGT, level up through Syzygy contributions, interact with the network, and engage in World Chat and Direct Messages.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => setMode("login")}
              className="rounded-xl border border-slate-700 bg-slate-900/50 px-6 py-4 text-left transition-colors hover:border-sky-500 hover:bg-slate-900"
            >
              <h3 className="text-lg font-semibold text-slate-50 mb-2">Access Your Void</h3>
              <p className="text-sm text-slate-400">
                Access an existing Void (UrgeID) by entering your address
              </p>
            </button>

            <button
              onClick={async () => {
                const { address: newAddr, privateKey: newKey } = generateKeypair();
                await createUrgeID(newAddr, newKey);
              }}
              disabled={loading}
              className="rounded-xl border border-violet-700 bg-violet-900/20 px-6 py-4 text-left transition-colors hover:border-violet-500 hover:bg-violet-900/30 disabled:opacity-50"
            >
              <h3 className="text-lg font-semibold text-slate-50 mb-2">Generate New Void</h3>
              <p className="text-sm text-slate-400">
                Create a new identity on the Demiurge blockchain
              </p>
            </button>
          </div>

          {error && (
            <p className="text-xs text-rose-400">{error}</p>
          )}
        </motion.div>
      </main>
    );
  }

  // Login view
  if (mode === "login") {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
        <button
          onClick={() => setMode("landing")}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <motion.div
          className="space-y-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-semibold text-slate-50">Access Your Void</h1>
          <p className="text-sm text-slate-300">
            Enter your UrgeID address to access your Void (profile and dashboard).
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                UrgeID Address
              </label>
              <input
                type="text"
                value={loginAddressInput}
                onChange={(e) => setLoginAddressInput(e.target.value)}
                placeholder="Enter 64-character hex address (with or without 0x prefix)"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm font-mono text-slate-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading || !loginAddressInput.trim()}
              className="w-full rounded-full bg-sky-500 px-6 py-3 text-sm font-medium text-slate-50 shadow-lg shadow-sky-500/30 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Access Void"}
            </button>

            {error && (
              <p className="text-xs text-rose-400">{error}</p>
            )}
          </div>
        </motion.div>
      </main>
    );
  }

  // Dashboard view
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      {/* Security Modal */}
      <AnimatePresence>
        {showSecurityModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSecurityModal(false)}
          >
            <motion.div
              className="rounded-2xl border border-slate-800 bg-slate-950 p-6 max-w-md mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold text-slate-50 mb-4">Protect Your Void</h2>
              <div className="space-y-3 text-sm text-slate-300 mb-6">
                <p>This Void (UrgeID) is your identity on the Demiurge blockchain.</p>
                <p>Whoever controls the private key controls your CGT, your NFTs, and your chat identity.</p>
                <p>Store your key and backup info somewhere safe and offline.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSecurityModal(false);
                    // Scroll to backup section
                    setTimeout(() => {
                      document.getElementById("backup-section")?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                  View backup info
                </button>
                <button
                  onClick={() => setShowSecurityModal(false)}
                  className="flex-1 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-50 hover:bg-sky-400"
                >
                  I understand
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("demiurge_urgeid_wallet_address");
            localStorage.removeItem("demiurge_urgeid_wallet_key");
            setMode("landing");
            setAddress("");
            setProfile(null);
          }}
          className="text-xs text-slate-500 hover:text-slate-300"
        >
          Sign Out
        </button>
      </div>

      {profile && (
        <motion.div
          className="space-y-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header with Username */}
          <div className="flex items-center justify-between">
            <div>
              {profile.username ? (
                <h1 className="text-3xl font-semibold text-sky-400">@{profile.username}</h1>
              ) : (
                <h1 className="text-3xl font-semibold text-slate-400">Username not claimed yet</h1>
              )}
              <div className="mt-2 flex items-center gap-2">
                <code className="font-mono text-xs text-slate-400">
                  {profile.address.slice(0, 8)}...{profile.address.slice(-6)}
                </code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(profile.address)}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Copy
                </button>
              </div>
            </div>
            {profile.badges.length > 0 && (
              <div className="flex gap-2">
                {profile.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-400"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>

          {profile.bio && (
            <p className="text-sm text-slate-300">{profile.bio}</p>
          )}

          {/* Username Claim Section */}
          {!profile.username && (
            <section className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Claim your username</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">@</span>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                    placeholder="yourname"
                    className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100 outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!usernameInput.trim() || !profile) return;
                      setUsernameStatus(null);
                      try {
                        await setUsername(profile.address, usernameInput.trim());
                        setUsernameStatus("Username claimed successfully!");
                        await loadDashboard(profile.address);
                      } catch (err: any) {
                        setUsernameStatus(err?.message || "Failed to claim username");
                      }
                    }}
                    disabled={!usernameInput.trim()}
                    className="rounded-md border border-slate-600 px-3 py-1 text-[12px] text-slate-50 hover:bg-slate-800 disabled:opacity-50"
                  >
                    Claim
                  </button>
                </div>
                {usernameStatus && (
                  <div className="text-[11px] text-slate-400">
                    {usernameStatus}
                  </div>
                )}
                <div className="text-[10px] text-slate-500">
                  3-32 characters, lowercase letters, numbers, underscores, dots
                </div>
              </div>
            </section>
          )}

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* CGT Balance */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Coins className="h-4 w-4 text-emerald-400" />
                CGT Balance
              </div>
              <p className="text-2xl font-mono font-semibold text-emerald-400">
                {balance !== null
                  ? formatCgt(Math.floor(balance * 1e8).toString())
                  : "—"}{" "}
                CGT
              </p>
            </div>

            {/* Level */}
            {progress && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  Level
                </div>
                <p className="text-2xl font-mono font-semibold text-violet-400">
                  Lv. {progress.level}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {progress.syzygyScore.toLocaleString()} Syzygy
                </p>
              </div>
            )}

            {/* Syzygy Score */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Sparkles className="h-4 w-4 text-violet-400" />
                Syzygy Score
              </div>
              <p className="text-2xl font-mono font-semibold text-violet-400">
                {profile.syzygy_score.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {progress && (
            <section className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <h3 className="text-xs font-semibold text-slate-400 mb-3">
                Progress & Contribution
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    Level: Lv. {progress.level}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Syzygy Score: {progress.syzygyScore.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    CGT from level rewards: {formatCgt(progress.totalCgtEarnedFromRewards)}
                  </div>
                </div>
                
                <div className="mt-2">
                  <div className="h-2 w-full rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-sky-500 transition-all"
                      style={{
                        width: `${Math.max(0, Math.min(100, progress.progressRatio * 100))}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {progress.syzygyScore.toLocaleString()} / {progress.nextLevelThreshold.toLocaleString()} Syzygy towards Lv.{progress.level + 1}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Security / Backup Section */}
          {privateKey && (
            <section id="backup-section" className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <h3 className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Security & Backup
              </h3>
              {!showPrivateKey ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowPrivateKey(true)}
                    className="flex items-center gap-2 rounded-md border border-rose-700 bg-rose-950/30 px-3 py-2 text-sm text-rose-300 hover:bg-rose-950/50"
                  >
                    <Eye className="h-4 w-4" />
                    Reveal Private Key
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-rose-800 bg-rose-950/30 p-3">
                    <p className="text-xs text-rose-400 mb-2">
                      ⚠️ Anyone with this key can control your UrgeID. Do not share this with anyone.
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs break-all text-rose-300 flex-1">
                        {privateKey}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(privateKey);
                        }}
                        className="rounded-md border border-rose-700 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-900/50"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPrivateKey(false)}
                        className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800"
                      >
                        <EyeOff className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Export Vault */}
                  <button
                    type="button"
                    onClick={async () => {
                      const password = prompt("Enter a password to encrypt your vault:");
                      if (!password) return;
                      try {
                        const wallet = { address, privateKey };
                        const vault = await exportVault(wallet, password);
                        const blob = new Blob([JSON.stringify(vault, null, 2)], {
                          type: "application/json",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `urgeid-vault-${address.slice(0, 8)}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        setVaultStatus("Vault exported successfully.");
                      } catch (err: any) {
                        setVaultStatus(err?.message || "Failed to export vault.");
                      }
                    }}
                    className="w-full rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-50 hover:bg-slate-800"
                  >
                    Export Encrypted Vault
                  </button>
                  {vaultStatus && (
                    <p className="text-xs text-slate-400">{vaultStatus}</p>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Send CGT Section */}
          <section className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <h3 className="text-xs font-semibold text-slate-400 mb-3">Send CGT</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Recipient (Username or Address)
                </label>
                <input
                  type="text"
                  value={sendTo}
                  onChange={(e) => {
                    setSendTo(e.target.value);
                    setResolvedRecipient(null);
                    setRecipientError(null);
                  }}
                  onBlur={() => {
                    if (sendTo.trim()) {
                      resolveRecipient(sendTo);
                    }
                  }}
                  placeholder="@username or 64-character address"
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                />
                {resolvingRecipient && (
                  <p className="mt-1 text-xs text-slate-500">Resolving...</p>
                )}
                {recipientError && (
                  <p className="mt-1 text-xs text-rose-400">{recipientError}</p>
                )}
                {resolvedRecipient && !recipientError && (
                  <div className="mt-2 rounded-md border border-slate-800 bg-slate-900/50 p-2">
                    {resolvedRecipient.username ? (
                      <div className="text-xs text-slate-300">
                        <span className="font-semibold text-sky-400">@{resolvedRecipient.username}</span>
                        <span className="ml-2 text-slate-500 font-mono">
                          ({shortenAddress(resolvedRecipient.address)})
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400">
                        Recipient: <span className="font-mono">{shortenAddress(resolvedRecipient.address)}</span>
                      </div>
                    )}
                  </div>
                )}
                {!resolvedRecipient && !recipientError && sendTo.trim() && (
                  <p className="mt-1 text-xs text-slate-500">
                    Enter a valid username (e.g. @oracle) or a 64-character UrgeID address
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="Amount (CGT)"
                  step="0.00000001"
                  className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                />
                <button
                  onClick={handleSendCgt}
                  disabled={sending || !sendTo.trim() || !sendAmount.trim() || !resolvedRecipient || resolvingRecipient}
                  className="rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-50 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
              {sendStatus && (
                <p className="text-xs text-slate-400">{sendStatus}</p>
              )}
            </div>
          </section>

          {/* Transaction History */}
          {txHistory.length > 0 && (
            <section className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <h3 className="text-xs font-semibold text-slate-400 mb-3">Transaction History</h3>
              <div className="space-y-2">
                {txHistory.slice(0, 10).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/50 p-2 text-xs"
                  >
                    <div>
                      <div className="text-slate-300">
                        → {tx.amountCgt.toFixed(8)} CGT
                      </div>
                      {tx.txHash && (
                        <div className="text-slate-500 font-mono">
                          {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)}
                        </div>
                      )}
                    </div>
                    <div className="text-slate-400">
                      {tx.status === "confirmed" ? "✓" : tx.status === "pending" ? "⏳" : "✗"}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* NFTs */}
          {nfts.length > 0 && (
            <section className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <h3 className="text-xs font-semibold text-slate-400 mb-3">D-GEN NFTs</h3>
              <div className="grid gap-2 md:grid-cols-2">
                {nfts.map((nft) => (
                  <div
                    key={nft.id}
                    className="rounded-md border border-slate-800 bg-slate-900/50 p-3"
                  >
                    <div className="text-sm font-medium text-slate-300">NFT #{nft.id}</div>
                    <div className="text-xs text-slate-500 font-mono mt-1">
                      {nft.fabric_root_hash.slice(0, 16)}...
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </motion.div>
      )}
    </main>
  );
}
