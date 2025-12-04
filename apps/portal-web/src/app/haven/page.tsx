"use client";

import { FractureShell } from "@/components/fracture/FractureShell";
import { HeroPanel } from "@/components/fracture/HeroPanel";
import Link from "next/link";
import { Home, User, Fingerprint, Key, Calendar, LogOut, Code, Sparkles, BarChart3, FolderKanban, Coins, Send, History, Lock, Eye, EyeOff, Download, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { useAbyssID } from "@/lib/fracture/identity/AbyssIDContext";
import { AbyssIDDialog } from "@/components/fracture/AbyssIDDialog";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  callRpc,
  formatCgt,
  getCgtBalance,
  cgtToSmallest,
  getNonce,
  buildTransferTx,
  sendRawTransaction,
  getTransactionHistory,
  signTransactionRpc,
  setUsername,
  resolveUsername,
  getUrgeIdProgress,
  getNftsByOwner,
  isDevBadgeNft,
  normalizeAddressForChain,
  type UrgeIDProfile,
  type UrgeIDProgress,
  type NftMetadata,
} from "@/lib/rpc";
import { signTransaction } from "@/lib/signing";
import { exportVault, importVault } from "@/lib/vault";
import {
  saveTransaction,
  getTransactionsForAddress,
  updateTransactionStatus,
  generateTxId,
  type TransactionRecord,
} from "@/lib/transactions";
import { graphqlRequest, getChatHeaders } from "@/lib/graphql";


type Nft = {
  id: number;
  owner: string;
  creator: string;
  fabric_root_hash: string;
  royalty_bps?: number;
};

export default function HavenPage() {
  const { identity, clearIdentity, setIdentity } = useAbyssID();
  const [showAbyssID, setShowAbyssID] = useState(false);

  // Wallet & Profile State
  const [urgeIdProfile, setUrgeIdProfile] = useState<UrgeIDProfile | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [nfts, setNfts] = useState<Nft[]>([]);
  const [progress, setProgress] = useState<UrgeIDProgress | null>(null);
  const [loadingChain, setLoadingChain] = useState(false);
  const [chainError, setChainError] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<string | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [vaultStatus, setVaultStatus] = useState<string | null>(null);
  const [nftCarouselIndex, setNftCarouselIndex] = useState(0);

  // Send CGT State
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [resolvedRecipient, setResolvedRecipient] = useState<{
    address: string;
    username?: string;
    isDeveloper?: boolean;
  } | null>(null);
  const [resolvingRecipient, setResolvingRecipient] = useState(false);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [txHistory, setTxHistory] = useState<TransactionRecord[]>([]);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [checkingDeveloper, setCheckingDeveloper] = useState(false);

  // Use shared address normalization utility
  const normalizeAddressForRpc = normalizeAddressForChain;
  
  // Normalize address for GraphQL (database stores addresses as-is from headers, typically lowercase with 0x)
  const normalizeAddressForGraphQL = (address: string): string => {
    return address.trim().toLowerCase();
  };

  // Helper to shorten address for display
  const shortenAddress = (addr: string) => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  useEffect(() => {
    if (identity?.address) {
      loadChainData();
      checkDeveloperStatus();
    }
  }, [identity]);
  
  // Check developer status from GraphQL
  const checkDeveloperStatus = async () => {
    if (!identity?.address) {
      setIsDeveloper(false);
      return;
    }

    try {
      setCheckingDeveloper(true);
      
      // Normalize address for GraphQL query
      const normalizedAddress = normalizeAddressForGraphQL(identity.address);
      
      // Query developer status
      const query = `
        query {
          developer(address: "${normalizedAddress}") {
            address
            username
            reputation
            createdAt
          }
        }
      `;
      
      const data = await graphqlRequest<{ developer: { address: string; username: string; reputation: number; createdAt: string } | null }>(
        query,
        {},
        getChatHeaders(identity.address, identity.username || "")
      );
      
      const isDev = !!data.developer;
      setIsDeveloper(isDev);
      
      // Update identity if developer status changed
      if (isDev && !identity.isDeveloper) {
        setIdentity({ ...identity, isDeveloper: true });
      } else if (!isDev && identity.isDeveloper) {
        setIdentity({ ...identity, isDeveloper: false });
      }
    } catch (err: any) {
      // Silently handle gateway connection errors
      if (err.message?.includes("Connection failed") || err.message?.includes("Unable to reach")) {
        console.warn("Abyss Gateway not available - developer status check failed");
        setIsDeveloper(false);
      } else {
        console.error("Failed to check developer status:", err);
        setIsDeveloper(false);
      }
    } finally {
      setCheckingDeveloper(false);
    }
  };

  const loadChainData = async () => {
    if (!identity?.address) return;

    setLoadingChain(true);
    setChainError(null);

    try {
      const normalizedAddr = normalizeAddressForRpc(identity.address);

      // Load UrgeID profile
      try {
        const profile = await callRpc<UrgeIDProfile | null>("urgeid_get", {
          address: normalizedAddr,
        });
        if (profile) {
          setUrgeIdProfile(profile);
          if (profile.username) {
            setUsernameInput(profile.username);
          }
        }
      } catch (err) {
        console.warn("Failed to load UrgeID profile:", err);
      }

      // Load balance
      try {
        const balanceRes = await getCgtBalance(normalizedAddr);
        const balanceSmallest = BigInt(balanceRes.balance);
        const balanceNum = Number(balanceSmallest) / 1e8;
        setBalance(balanceNum);
      } catch (err) {
        console.warn("Failed to load balance:", err);
      }

      // Load NFTs
      try {
        const nftsRes = await getNftsByOwner(normalizedAddr);
        const loadedNfts = nftsRes.nfts || [];
        setNfts(loadedNfts);
      } catch (err) {
        console.warn("Failed to load NFTs:", err);
      }

      // Load progress
      try {
        const progressData = await getUrgeIdProgress(normalizedAddr);
        setProgress(progressData);
      } catch (err) {
        console.warn("Failed to load progress:", err);
      }

      // Load transaction history
      try {
        const onChainHistory = await getTransactionHistory(normalizedAddr, 50);
        const localHistory = getTransactionsForAddress(normalizedAddr);
        const allHashes = new Set([
          ...onChainHistory.transactions,
          ...localHistory.map((tx) => tx.txHash || tx.id),
        ]);
        
        for (const hash of allHashes) {
          if (onChainHistory.transactions.includes(hash)) {
            updateTransactionStatus(hash, "confirmed", hash);
          }
        }
        
        setTxHistory(getTransactionsForAddress(normalizedAddr));
      } catch (err) {
        console.warn("Failed to load transaction history:", err);
      }
    } catch (err: any) {
      if (err.message?.includes("Unable to reach Demiurge node") || err.message?.includes("Connection failed")) {
        setChainError("Chain node not available. Wallet features require the Demiurge chain node.");
      } else {
        setChainError(err.message || "Failed to load chain data");
      }
    } finally {
      setLoadingChain(false);
    }
  };


  // Resolve recipient (username or address)
  const resolveRecipient = async (input: string): Promise<{
    address: string;
    username?: string;
    isDeveloper: boolean;
  } | null> => {
    if (!input.trim()) {
      setResolvedRecipient(null);
      setRecipientError(null);
      return null;
    }

    const trimmed = input.trim();
    
    // Check if it's a hex address (64 chars, with or without 0x)
    let normalizedAddr = trimmed;
    if (normalizedAddr.startsWith("0x")) {
      normalizedAddr = normalizedAddr.slice(2);
    }
    
    if (normalizedAddr.length === 64 && /^[0-9a-fA-F]{64}$/.test(normalizedAddr)) {
      // It's an address - check if they're a developer
      let isDev = false;
      try {
        const normalizedForGraphQL = normalizeAddressForGraphQL(trimmed);
        const query = `
          query {
            developer(address: "${normalizedForGraphQL}") {
              address
              username
            }
          }
        `;
        const data = await graphqlRequest<{ developer: { address: string; username: string } | null }>(
          query,
          {},
          getChatHeaders(identity?.address || "", identity?.username || "")
        );
        isDev = !!data.developer;
      } catch (err) {
        // Silently fail - not a developer
      }
      const recipient = { address: normalizedAddr, isDeveloper: isDev };
      setResolvedRecipient(recipient);
      setRecipientError(null);
      return recipient;
    }

    // Check if it's a username (starts with @)
    if (trimmed.startsWith("@")) {
      const username = trimmed.slice(1);
      setResolvingRecipient(true);
      setRecipientError(null);
      
      try {
        const resolved = await resolveUsername(username);
        if (resolved && resolved.address) {
          // Check if this user is a developer
          let isDev = false;
          try {
            const normalizedForGraphQL = normalizeAddressForGraphQL(resolved.address);
            const query = `
              query {
                developer(address: "${normalizedForGraphQL}") {
                  address
                  username
                }
              }
            `;
            const data = await graphqlRequest<{ developer: { address: string; username: string } | null }>(
              query,
              {},
              getChatHeaders(identity?.address || "", identity?.username || "")
            );
            isDev = !!data.developer;
          } catch (err) {
            // Silently fail - not a developer
          }
          const recipient = { address: resolved.address, username, isDeveloper: isDev };
          setResolvedRecipient(recipient);
          return recipient;
        } else {
          setRecipientError("Username not found");
          setResolvedRecipient(null);
          return null;
        }
      } catch (err: any) {
        setRecipientError(err.message || "Failed to resolve username");
        setResolvedRecipient(null);
        return null;
      } finally {
        setResolvingRecipient(false);
      }
    } else {
      setRecipientError("Invalid format. Use @username or a 64-character address");
      setResolvedRecipient(null);
      return null;
    }
  };

  const handleSendCgt = async () => {
    if (!urgeIdProfile || !sendTo.trim() || !sendAmount.trim()) {
      setSendStatus("Please fill in all fields");
      return;
    }

    let recipient = resolvedRecipient;
    if (!recipient) {
      recipient = await resolveRecipient(sendTo);
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

    // Check for private key
    const storedKey = localStorage.getItem("demiurge_urgeid_wallet_key");
    if (!storedKey) {
      setSendStatus("Private key not available. Please use the UrgeID page (/urgeid) to create a wallet with a private key for sending transactions.");
      return;
    }

    setSending(true);
    setSendStatus(null);

    try {
      const normalizedAddr = normalizeAddressForRpc(identity!.address);
      
      // Get nonce
      const nonceRes = await getNonce(normalizedAddr);
      const nonce = nonceRes.nonce;

      // Build transaction
      const amountSmallest = cgtToSmallest(amount);
      const { tx_hex: unsignedTxHex } = await buildTransferTx(
        normalizedAddr,
        recipient.address,
        amountSmallest,
        nonce
      );

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
        from: normalizedAddr,
        to: recipient.address,
        amount: amountSmallest.toString(),
        amountCgt: amount,
        fee: 0,
        timestamp: Date.now(),
        status: "pending",
        txHash: result.tx_hash,
      };
      saveTransaction(txRecord);
      setTxHistory(getTransactionsForAddress(normalizedAddr));

      setSendStatus(`Transaction submitted! Hash: ${result.tx_hash.slice(0, 8)}...`);
      setSendTo("");
      setSendAmount("");
      setResolvedRecipient(null);
      
      // Refresh balance
      await loadChainData();
    } catch (err: any) {
      setSendStatus(err.message || "Failed to send CGT");
    } finally {
      setSending(false);
    }
  };

  const handleClaimUsername = async () => {
    if (!usernameInput.trim() || !identity?.address) return;
    
    setUsernameStatus(null);
    try {
      const normalizedAddr = normalizeAddressForRpc(identity.address);
      await setUsername(normalizedAddr, usernameInput.trim());
      setUsernameStatus("Username claimed successfully!");
      await loadChainData();
    } catch (err: any) {
      setUsernameStatus(err?.message || "Failed to claim username");
    }
  };

  const handleExportVault = async () => {
    const storedKey = localStorage.getItem("demiurge_urgeid_wallet_key");
    if (!storedKey || !identity?.address) {
      setVaultStatus("Private key not available. Please use the UrgeID page (/urgeid) to create a wallet with a private key.");
      return;
    }

    const password = prompt("Enter a password to encrypt your vault:");
    if (!password) return;

    try {
      const wallet = { address: identity.address, privateKey: storedKey };
      const vault = await exportVault(wallet, password);
      const blob = new Blob([JSON.stringify(vault, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `urgeid-vault-${identity.address.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setVaultStatus("Vault exported successfully.");
    } catch (err: any) {
      setVaultStatus(err?.message || "Failed to export vault.");
    }
  };

  return (
    <FractureShell>
      <HeroPanel
        title="Haven"
        subtitle="Your sovereign home and profile on the Demiurge chain"
      />

      <div className="space-y-6">
        {/* Chain Node Error Banner */}
        {chainError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-yellow-300 font-medium mb-1">Chain Node Not Available</p>
              <p className="text-xs text-yellow-400/80">
                {chainError} Wallet and profile features require the Demiurge chain node to be running.
              </p>
            </div>
          </motion.div>
        )}

        {/* Identity Display */}
        {identity ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-gradient-to-r from-cyan-500/10 to-fuchsia-500/10 border border-cyan-500/30 rounded-xl"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                  <Fingerprint className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100 mb-1 flex items-center gap-2">
                    AbyssID: @{identity.username}
                    {(isDeveloper || identity.isDeveloper) && (
                      <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-full flex items-center gap-1">
                        <Code className="h-3 w-3" />
                        DEV
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    {identity.address}
                  </p>
                </div>
              </div>
              <button
                onClick={clearIdentity}
                className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg">
                <Key className="h-4 w-4 text-cyan-400" />
                <div>
                  <p className="text-xs text-zinc-400">Public Key</p>
                  <p className="text-xs text-zinc-300 font-mono truncate">
                    {identity.publicKey.substring(0, 24)}...
                  </p>
                </div>
              </div>
              {identity.createdAt && (
                <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg">
                  <Calendar className="h-4 w-4 text-fuchsia-400" />
                  <div>
                    <p className="text-xs text-zinc-400">Created</p>
                    <p className="text-xs text-zinc-300">
                      {new Date(identity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white/5 border border-white/10 rounded-xl text-center"
          >
            <div className="mb-4">
              <Fingerprint className="h-12 w-12 text-zinc-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                No AbyssID Found
              </h3>
              <p className="text-sm text-zinc-400 mb-4">
                You need an AbyssID to access Haven. Create one to begin your journey.
              </p>
            </div>
            <button
              onClick={() => setShowAbyssID(true)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-fuchsia-400 transition-all duration-200 hover:scale-105"
            >
              Create AbyssID
            </button>
          </motion.div>
        )}

        {/* Wallet & Stats Grid */}
        {identity && !chainError && (
          <div className="grid gap-4 md:grid-cols-3">
            {/* CGT Balance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-5 w-5 text-emerald-400" />
                <p className="text-sm font-medium text-zinc-300">CGT Balance</p>
              </div>
              {loadingChain ? (
                <p className="text-xl font-mono font-semibold text-emerald-400">Loading...</p>
              ) : balance !== null ? (
                <p className="text-xl font-mono font-semibold text-emerald-400">
                  {formatCgt(Math.floor(balance * 1e8).toString())} CGT
                </p>
              ) : (
                <p className="text-xl font-mono font-semibold text-zinc-500">—</p>
              )}
            </motion.div>

            {/* Level */}
            {progress && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30 rounded-xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                  <p className="text-sm font-medium text-zinc-300">Level</p>
                </div>
                <p className="text-xl font-mono font-semibold text-violet-400">
                  Lv. {progress.level}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  {progress.syzygyScore.toLocaleString()} Syzygy
                </p>
              </motion.div>
            )}

            {/* Syzygy Score */}
            {urgeIdProfile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  <p className="text-sm font-medium text-zinc-300">Syzygy Score</p>
                </div>
                <p className="text-xl font-mono font-semibold text-purple-400">
                  {urgeIdProfile.syzygy_score.toLocaleString()}
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {progress && !chainError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white/5 border border-white/10 rounded-xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-300">Progress & Contribution</h3>
              <Link
                href="/nexus"
                className="flex items-center gap-1 px-3 py-1 bg-white/5 border border-white/10 text-xs text-zinc-300 rounded-lg hover:bg-white/10 transition-colors"
              >
                <BarChart3 className="h-3 w-3" />
                View Analytics
              </Link>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-sm font-semibold text-zinc-200">
                  Level: Lv. {progress.level}
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  Syzygy Score: {progress.syzygyScore.toLocaleString()}
                </div>
              </div>
              <div className="mt-2">
                <div className="h-2 w-full rounded-full bg-black/40">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 transition-all"
                    style={{
                      width: `${Math.max(0, Math.min(100, progress.progressRatio * 100))}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  {progress.syzygyScore.toLocaleString()} / {progress.nextLevelThreshold.toLocaleString()} Syzygy towards Lv.{progress.level + 1}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Username Claim Section */}
        {identity && urgeIdProfile && !urgeIdProfile.username && !chainError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white/5 border border-white/10 rounded-xl"
          >
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Claim your UrgeID username</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-500">@</span>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                  placeholder="yourname"
                  className="flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleClaimUsername}
                  disabled={!usernameInput.trim()}
                  className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Claim
                </button>
              </div>
              {usernameStatus && (
                <p className="text-xs text-zinc-400">{usernameStatus}</p>
              )}
              <p className="text-xs text-zinc-500">
                3-32 characters, lowercase letters, numbers, underscores, dots
              </p>
            </div>
          </motion.div>
        )}

        {/* Send CGT Section */}
        {identity && !chainError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white/5 border border-white/10 rounded-xl"
          >
            <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send CGT
            </h3>
            {!localStorage.getItem("demiurge_urgeid_wallet_key") && (
              <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-xs text-yellow-300">
                  ⚠️ Private key not available. To send CGT, you need a wallet with a private key. Visit <Link href="/urgeid" className="underline">/urgeid</Link> to create or import a wallet.
                </p>
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">
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
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500"
                />
                {resolvingRecipient && (
                  <p className="mt-1 text-xs text-zinc-500">Resolving...</p>
                )}
                {recipientError && (
                  <p className="mt-1 text-xs text-red-400">{recipientError}</p>
                )}
                {resolvedRecipient && !recipientError && (
                  <div className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2">
                    {resolvedRecipient.username ? (
                      <div className="text-xs text-zinc-300 flex items-center gap-2">
                        <span className="font-semibold text-cyan-400">@{resolvedRecipient.username}</span>
                        {resolvedRecipient.isDeveloper && (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-full flex items-center gap-0.5">
                            <Code className="h-2.5 w-2.5" />
                            DEV
                          </span>
                        )}
                        <span className="ml-auto text-zinc-500 font-mono">
                          ({shortenAddress(resolvedRecipient.address)})
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-400">
                        Recipient: <span className="font-mono">{shortenAddress(resolvedRecipient.address)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="Amount (CGT)"
                  step="0.00000001"
                  className="flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleSendCgt}
                  disabled={sending || !sendTo.trim() || !sendAmount.trim() || !resolvedRecipient || resolvingRecipient || !localStorage.getItem("demiurge_urgeid_wallet_key")}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-fuchsia-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
              {sendStatus && (
                <p className="text-xs text-zinc-400">{sendStatus}</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Transaction History */}
        {identity && txHistory.length > 0 && !chainError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white/5 border border-white/10 rounded-xl"
          >
            <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <History className="h-4 w-4" />
              Transaction History
            </h3>
            <div className="space-y-2">
              {txHistory.slice(0, 10).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-2 text-xs"
                >
                  <div>
                    <div className="text-zinc-300">
                      → {tx.amountCgt.toFixed(8)} CGT
                    </div>
                    {tx.txHash && (
                      <div className="text-zinc-500 font-mono">
                        {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)}
                      </div>
                    )}
                  </div>
                  <div className="text-zinc-400">
                    {tx.status === "confirmed" ? "✓" : tx.status === "pending" ? "⏳" : "✗"}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* NFT Assets Gallery */}
        {identity && nfts.length > 0 && !chainError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white/5 border border-white/10 rounded-xl"
          >
            <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              D-GEN NFT Assets
            </h3>
            <div className="relative">
              <div className="overflow-hidden rounded-lg">
                <div 
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${nftCarouselIndex * 100}%)` }}
                >
                  {nfts.map((nft) => (
                    <div
                      key={nft.id}
                      className="min-w-full flex-shrink-0"
                    >
                      <div className="rounded-lg border border-white/10 bg-black/20 p-4 mx-1">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-sm font-semibold text-zinc-200">
                              NFT #{nft.id}
                            </div>
                            <div className="text-xs text-zinc-400 mt-1">
                              {urgeIdProfile?.username ? `@${urgeIdProfile.username}` : shortenAddress(identity.address)}
                            </div>
                          </div>
                          <div className="text-xs text-zinc-500 font-mono">
                            {nft.fabric_root_hash.slice(0, 8)}...{nft.fabric_root_hash.slice(-8)}
                          </div>
                        </div>
                        <div className="aspect-square bg-black/40 rounded-md flex items-center justify-center mb-3">
                          <Sparkles className="h-12 w-12 text-violet-400/30" />
                        </div>
                        <div className="text-xs text-zinc-400">
                          <div className="flex justify-between">
                            <span>Creator:</span>
                            <span className="font-mono">{shortenAddress(nft.creator)}</span>
                          </div>
                          {nft.royalty_bps !== undefined && (
                            <div className="flex justify-between mt-1">
                              <span>Royalty:</span>
                              <span>{(nft.royalty_bps / 100).toFixed(2)}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carousel Navigation */}
              {nfts.length > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => setNftCarouselIndex((prev) => (prev > 0 ? prev - 1 : nfts.length - 1))}
                    className="rounded-lg border border-white/10 bg-black/20 p-2 text-zinc-300 hover:bg-black/40 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex gap-1">
                    {nfts.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setNftCarouselIndex(idx)}
                        className={`h-2 rounded-full transition-all ${
                          idx === nftCarouselIndex
                            ? "w-6 bg-cyan-500"
                            : "w-2 bg-zinc-700"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setNftCarouselIndex((prev) => (prev < nfts.length - 1 ? prev + 1 : 0))}
                    className="rounded-lg border border-white/10 bg-black/20 p-2 text-zinc-300 hover:bg-black/40 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="text-center mt-3 text-xs text-zinc-500">
                {nftCarouselIndex + 1} of {nfts.length}
              </div>
            </div>
          </motion.div>
        )}

        {/* Security & Backup Section */}
        {identity && !chainError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white/5 border border-white/10 rounded-xl"
          >
            <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Security & Backup
            </h3>
            {!localStorage.getItem("demiurge_urgeid_wallet_key") ? (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-xs text-yellow-300 mb-2">
                  Private key not available. To access wallet security features, visit <Link href="/urgeid" className="underline">/urgeid</Link> to create or import a wallet.
                </p>
                {identity.seedPhrase && (
                  <div className="mt-3 p-2 bg-black/20 rounded-lg">
                    <p className="text-xs text-zinc-400 mb-1">Your AbyssID Seed Phrase:</p>
                    <code className="text-xs text-zinc-300 font-mono break-words">{identity.seedPhrase}</code>
                  </div>
                )}
              </div>
            ) : !showPrivateKey ? (
              <div className="space-y-2">
                <button
                  onClick={() => setShowPrivateKey(true)}
                  className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 hover:bg-red-500/20 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  Reveal Private Key
                </button>
                <button
                  onClick={handleExportVault}
                  className="w-full flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-300 hover:bg-black/40 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Export Encrypted Vault
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                  <p className="text-xs text-red-400 mb-2">
                    ⚠️ Anyone with this key can control your UrgeID. Do not share this with anyone.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs break-all text-red-300 flex-1">
                      {localStorage.getItem("demiurge_urgeid_wallet_key") || "Not available"}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(localStorage.getItem("demiurge_urgeid_wallet_key") || "");
                      }}
                      className="rounded-lg border border-red-500/30 px-2 py-1 text-[11px] text-red-300 hover:bg-red-500/20 transition-colors"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => setShowPrivateKey(false)}
                      className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-zinc-300 hover:bg-black/40 transition-colors"
                    >
                      <EyeOff className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {vaultStatus && (
                  <p className="text-xs text-zinc-400">{vaultStatus}</p>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Info Section */}
        <div className="p-6 bg-gradient-to-r from-cyan-500/10 to-fuchsia-500/10 border border-cyan-500/20 rounded-xl">
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">
            About Haven
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Haven is your personal sanctuary within the Demiurge ecosystem. Here you can manage your identity,
            view your assets, track your progress, and access all your sovereign tools. This is where your
            journey on the chain begins and evolves.
          </p>
        </div>
      </div>

      {/* AbyssID Dialog */}
      <AbyssIDDialog open={showAbyssID} onClose={() => setShowAbyssID(false)} />
    </FractureShell>
  );
}
