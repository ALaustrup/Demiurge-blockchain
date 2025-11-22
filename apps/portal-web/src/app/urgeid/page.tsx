"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Coins, Sparkles, ArrowLeft } from "lucide-react";
import QRCode from "react-qr-code";
import { callRpc, formatCgt, getCgtBalance } from "@/lib/rpc";
import { formatUrgeId } from "@/lib/urgeid";
import { exportVault, importVault } from "@/lib/vault";

type UrgeIDProfile = {
  address: string;
  display_name: string;
  bio?: string | null;
  handle?: string | null;
  syzygy_score: number;
  badges: string[];
  created_at_height?: number | null;
};

type Nft = {
  id: number;
  owner: string;
  creator: string;
  fabric_root_hash: string;
  royalty_bps?: number;
};

export default function UrgeIDPage() {
  const router = useRouter();
  const [step, setStep] = useState<"onboarding" | "dashboard">("onboarding");
  const [address, setAddress] = useState<string>("");
  const [privateKey, setPrivateKey] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [profile, setProfile] = useState<UrgeIDProfile | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [nfts, setNfts] = useState<Nft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handleInput, setHandleInput] = useState("");
  const [handleStatus, setHandleStatus] = useState<string | null>(null);
  const [vaultStatus, setVaultStatus] = useState<string | null>(null);

  // Check if user already has a wallet
  useEffect(() => {
    const storedAddress = localStorage.getItem("demiurge_urgeid_wallet_address");
    const storedKey = localStorage.getItem("demiurge_urgeid_wallet_key");
    if (storedAddress && storedKey) {
      setAddress(storedAddress);
      setPrivateKey(storedKey);
      setStep("dashboard");
      loadDashboard(storedAddress);
    }
  }, []);

  const generateKeypair = () => {
    // Generate random 32-byte address (stub - later use Ed25519)
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
  };

  const createUrgeID = async () => {
    if (!address || !displayName.trim()) {
      setError("Address and display name are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const profile = await callRpc<UrgeIDProfile>("urgeid_create", {
        address,
        display_name: displayName,
        bio: bio.trim() || null,
      });

      // Store wallet locally
      localStorage.setItem("demiurge_urgeid_wallet_address", address);
      localStorage.setItem("demiurge_urgeid_wallet_key", privateKey);

      setProfile(profile);
      setStep("dashboard");
      await loadDashboard(address);
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
        setHandleInput(profile.handle || "");
      }

      // Load balance (stored as smallest units string, convert to number)
      const balanceRes = await getCgtBalance(addr);
      const balanceSmallest = BigInt(balanceRes.balance);
      const balanceNum = Number(balanceSmallest) / 1e8;
      setBalance(balanceNum);

      // Load NFTs
      const nftsRes = await callRpc<{ nfts: Nft[] }>("cgt_getNftsByOwner", {
        address: addr,
      });
      setNfts(nftsRes.nfts || []);
    } catch (err: any) {
      console.error("Failed to load dashboard:", err);
    }
  };

  if (step === "onboarding") {
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
          <h1 className="text-3xl font-semibold text-slate-50">
            Create your UrgeID
          </h1>
          <p className="text-sm text-slate-300">
            Create your on-chain identity in the Demiurge Pantheon. Every user
            has an UrgeID — a sovereign identity with Syzygy tracking, badges,
            and the ability to mint D-GEN NFTs.
          </p>

          {!address && (
            <div className="space-y-4">
              <button
                onClick={generateKeypair}
                className="rounded-full bg-sky-500 px-6 py-3 text-sm font-medium text-slate-950 shadow-lg shadow-sky-500/30 hover:bg-sky-400"
              >
                Generate UrgeID Vault
              </button>
            </div>
          )}

          {address && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="mb-2 text-xs font-medium text-slate-400">
                  UrgeID Vault Address
                </div>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs break-all text-sky-300 max-w-full">
                    {address}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(address);
                    }}
                    className="rounded-md border border-slate-600 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-800 whitespace-nowrap flex-shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-rose-800 bg-rose-950/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-rose-400">
                  <Wallet className="h-4 w-4" />
                  Private Key
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <code className="font-mono text-xs break-all text-rose-300 max-w-full">
                    {privateKey}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(privateKey);
                    }}
                    className="rounded-md border border-rose-700 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-900/50 whitespace-nowrap flex-shrink-0"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-rose-400">
                  ⚠️ Save this key. Losing it means losing access forever.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your UrgeID name"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Bio (Optional)
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about your UrgeID..."
                    rows={3}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={createUrgeID}
                  disabled={loading || !displayName.trim()}
                  className="w-full rounded-full bg-violet-500 px-6 py-3 text-sm font-medium text-slate-50 shadow-lg shadow-violet-500/30 hover:bg-violet-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create UrgeID Profile"}
                </button>

                {error && (
                  <p className="text-xs text-rose-400">{error}</p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </main>
    );
  }

  // Dashboard view
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
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
            router.push("/urgeid");
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-50">
                {profile.display_name}
              </h1>
              <h2 className="mt-1 text-lg font-semibold text-slate-50">
                Your UrgeID:{" "}
                <span className="font-mono text-sm text-slate-300">
                  {profile.address.slice(0, 6)}...{profile.address.slice(-4)}
                </span>
              </h2>
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

          {/* UrgeID Vault Section */}
          <section className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <h3 className="text-xs font-semibold text-slate-400">
              Your UrgeID
            </h3>

            <div className="mt-2 space-y-2">
              <div>
                <div className="text-[11px] text-slate-500 mb-1">
                  Your UrgeID
                </div>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-[11px] break-all text-slate-200">
                    {formatUrgeId(profile.address)}
                  </code>
                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard.writeText(formatUrgeId(profile.address))
                    }
                    className="rounded-md border border-slate-600 px-2 py-[2px] text-[10px] text-slate-200 hover:bg-slate-800"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-500 mb-1">
                  Raw Address
                </div>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-[11px] break-all text-slate-200">
                    {profile.address}
                  </code>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(profile.address)}
                    className="rounded-md border border-slate-600 px-2 py-[2px] text-[10px] text-slate-200 hover:bg-slate-800"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 mt-2">
                <div className="text-[11px] text-slate-500 mb-2">
                  Scan UrgeID Vault
                </div>
                <div className="inline-block rounded-md bg-slate-900 p-2">
                  <QRCode value={profile.address} size={96} />
                </div>
              </div>
            </div>
          </section>

          {/* Handle Section */}
          <section className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <h3 className="text-xs font-semibold text-slate-400">
              UrgeID Handle
            </h3>

            <div className="mt-2 text-[11px] text-slate-400">
              Choose a unique handle other UrgeIDs can use to find you.
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-slate-500">@</span>
              <input
                value={handleInput}
                onChange={(e) => setHandleInput(e.target.value.toLowerCase())}
                className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100 outline-none focus:border-sky-500"
                placeholder="yourname"
              />
              <button
                type="button"
                onClick={async () => {
                  setHandleStatus(null);
                  try {
                    const updated = await callRpc<UrgeIDProfile>("urgeid_setHandle", {
                      address: profile.address,
                      handle: handleInput.replace(/^@/, ""),
                    });
                    setProfile(updated);
                    setHandleStatus("Handle saved.");
                  } catch (err: any) {
                    setHandleStatus(err?.message ?? "Failed to save handle.");
                  }
                }}
                className="rounded-md border border-slate-600 px-3 py-1 text-[12px] text-slate-50 hover:bg-slate-800"
              >
                Save
              </button>
            </div>

            {profile.handle && (
              <div className="mt-2 text-[12px] text-slate-300">
                Current: <span className="font-mono text-sky-400">@{profile.handle}</span>
              </div>
            )}

            {handleStatus && (
              <div className="mt-1 text-[11px] text-slate-400">
                {handleStatus}
              </div>
            )}
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Balance */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Coins className="h-4 w-4 text-emerald-400" />
                CGT Balance
              </div>
              <p className="text-2xl font-mono font-semibold text-emerald-400">
                {balance !== null
                  ? formatCgt(balance * 1e8)
                  : "—"}{" "}
                CGT
              </p>
              {balance !== null && (
                <p className="text-xs text-slate-500 mt-1">
                  {Math.floor(balance * 1e8).toLocaleString()} smallest units
                </p>
              )}
            </div>

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

          {/* NFTs */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Sparkles className="h-4 w-4 text-violet-400" />
                D-GEN NFTs
              </div>
              <span className="text-xs text-slate-500">
                {nfts.length} owned
              </span>
            </div>
            {nfts.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {nfts.map((nft) => (
                  <div
                    key={nft.id}
                    className="rounded-lg border border-slate-700 bg-slate-800/30 p-3 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-sky-300">#{nft.id}</span>
                      <span className="text-slate-500 text-[10px]">
                        {nft.fabric_root_hash.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No NFTs yet</p>
            )}
          </div>

          {/* Vault Export/Import Section */}
          <section className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <h3 className="text-xs font-semibold text-slate-400">
              UrgeID Vault (Export / Import)
            </h3>

            <div className="mt-2 text-[11px] text-slate-400">
              Export an encrypted backup of your UrgeID Vault, or import an existing one.
            </div>

            <div className="mt-3 flex flex-col gap-3">
              {/* EXPORT */}
              <div>
                <button
                  type="button"
                  onClick={async () => {
                    const password = prompt("Enter a password to encrypt your vault:");
                    if (!password) return;

                    try {
                      // Retrieve wallet from localStorage
                      const storedAddress = localStorage.getItem("demiurge_urgeid_wallet_address");
                      const storedKey = localStorage.getItem("demiurge_urgeid_wallet_key");
                      if (!storedAddress || !storedKey) {
                        throw new Error("No local wallet found.");
                      }

                      const wallet = { address: storedAddress, privateKey: storedKey };
                      const vault = await exportVault(wallet, password);

                      const blob = new Blob([JSON.stringify(vault, null, 2)], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `urgeid-vault-${wallet.address.slice(0, 8)}.json`;
                      a.click();
                      URL.revokeObjectURL(url);

                      setVaultStatus("Vault exported successfully.");
                    } catch (err: any) {
                      setVaultStatus(err?.message ?? "Failed to export vault.");
                    }
                  }}
                  className="rounded-md border border-slate-600 px-3 py-1 text-[12px] text-slate-50 hover:bg-slate-800"
                >
                  Export Vault
                </button>
              </div>

              {/* IMPORT */}
              <div>
                <input
                  type="file"
                  accept="application/json"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const password = prompt("Enter the password used to encrypt this vault:");
                    if (!password) return;

                    try {
                      const text = await file.text();
                      const vault = JSON.parse(text);
                      const restored = await importVault(vault, password);

                      const newWallet = {
                        address: restored.address,
                        privateKey: restored.privateKey,
                      };

                      localStorage.setItem("demiurge_urgeid_wallet_address", restored.address);
                      localStorage.setItem("demiurge_urgeid_wallet_key", restored.privateKey);

                      setVaultStatus("Vault imported and set as active UrgeID.");
                      // Reload dashboard with new address
                      setAddress(restored.address);
                      await loadDashboard(restored.address);
                    } catch (err: any) {
                      setVaultStatus(err?.message ?? "Failed to import vault.");
                    } finally {
                      e.target.value = "";
                    }
                  }}
                  className="mt-1 text-[11px] text-slate-300 file:mr-3 file:rounded-md file:border file:border-slate-600 file:bg-slate-900 file:px-3 file:py-1 file:text-[11px] file:text-slate-100 hover:file:bg-slate-800"
                />
              </div>
            </div>

            {vaultStatus && (
              <div className="mt-2 text-[11px] text-slate-400">{vaultStatus}</div>
            )}
          </section>
        </motion.div>
      )}
    </main>
  );
}

