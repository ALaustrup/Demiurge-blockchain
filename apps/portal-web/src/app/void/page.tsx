"use client";

import { FractureShell } from "@/components/fracture/FractureShell";
import { HeroPanel } from "@/components/fracture/HeroPanel";
import Link from "next/link";
import { Code, FolderKanban, BookOpen, Sparkles, Award, AlertCircle, Plus, Crown, TrendingUp, Calendar, ArrowRight, BarChart3 } from "lucide-react";
import { useAbyssID } from "@/lib/fracture/identity/AbyssIDContext";
import { useState, useEffect } from "react";
import { graphqlRequest, getChatHeaders, MUTATIONS } from "@/lib/graphql";
import { motion } from "framer-motion";
import { devClaimDevNft, getNftsByOwner, isDevBadgeNft, callRpc, normalizeAddressForChain, type NftMetadata } from "@/lib/rpc";

export default function VoidPage() {
  const { identity, setIdentity } = useAbyssID();
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasDevBadge, setHasDevBadge] = useState(false);
  const [checkingBadge, setCheckingBadge] = useState(false);
  const [claimingBadge, setClaimingBadge] = useState(false);
  const [chainNodeError, setChainNodeError] = useState<string | null>(null);
  const [isArchon, setIsArchon] = useState<boolean>(false);
  const [checkingArchon, setCheckingArchon] = useState(false);
  const [minting, setMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [developerProfile, setDeveloperProfile] = useState<any>(null);
  const [projects, setProjects] = useState<Array<{ slug: string; name: string; description: string | null; createdAt: string }>>([]);

  useEffect(() => {
    if (identity?.address) {
      checkDeveloperStatus();
    } else {
      setChecking(false);
      setIsDeveloper(false);
    }
  }, [identity]);

  useEffect(() => {
    // Check badge status whenever developer status changes or identity is available
    if (identity?.address && isDeveloper) {
      checkDevBadgeStatus();
    } else {
      setHasDevBadge(false);
    }
    
    // Check Archon status
    if (identity?.address) {
      checkArchonStatus();
    }
  }, [identity, isDeveloper]);

  const checkDeveloperStatus = async () => {
    if (!identity?.address) {
      setChecking(false);
      setIsDeveloper(false);
      return;
    }

    try {
      setChecking(true);
      
      // Normalize address for GraphQL query (database stores with 0x prefix)
      const normalizedAddress = normalizeAddressForGraphQL(identity.address);
      
      // Use the developer query with address parameter (more efficient than fetching all)
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
        // Load developer profile and projects
        if (data.developer) {
          setDeveloperProfile(data.developer);
          loadProjects();
        }
      } else if (!isDev && identity.isDeveloper) {
        setIdentity({ ...identity, isDeveloper: false });
        setDeveloperProfile(null);
        setProjects([]);
      } else if (isDev && data.developer) {
        setDeveloperProfile(data.developer);
        loadProjects();
      }
    } catch (err: any) {
      // Silently handle gateway connection errors
      if (err.message?.includes("Connection failed") || err.message?.includes("Unable to reach")) {
        console.warn("Abyss Gateway not available - developer features disabled");
        setIsDeveloper(false);
      } else {
        console.error("Failed to check developer status:", err);
        setIsDeveloper(false);
      }
    } finally {
      setChecking(false);
    }
  };

  const handleBecomeDeveloper = async () => {
    if (!identity?.address || !identity?.username) {
      alert("You need an AbyssID with a username to become a developer. Please create an AbyssID first.");
      return;
    }

    try {
      setRegistering(true);
      const result = await graphqlRequest<{ registerDeveloper: { address: string; username: string; reputation: number } }>(
        MUTATIONS.REGISTER_DEVELOPER,
        { username: identity.username },
        getChatHeaders(identity.address, identity.username)
      );

      if (result.registerDeveloper) {
        setIsDeveloper(true);
        setDeveloperProfile(result.registerDeveloper);
        // Update identity to include developer badge
        const updatedIdentity = { ...identity, isDeveloper: true };
        setIdentity(updatedIdentity);
        alert("🎉 Congratulations! You are now a Developer. Your Dev badge has been added to your profile.");
        // Load projects after registration
        loadProjects();
        // Check for DEV Badge NFT after registration (will trigger via useEffect)
      }
    } catch (err: any) {
      console.error("Failed to register as developer:", err);
      alert(`Failed to register as developer: ${err.message || "Unknown error"}`);
    } finally {
      setRegistering(false);
    }
  };

  // Import shared address normalization utility
  const normalizeAddress = normalizeAddressForChain;
  
  // Normalize address for GraphQL (database stores addresses as-is from headers, typically lowercase with 0x)
  const normalizeAddressForGraphQL = (address: string): string => {
    // Use address as-is but ensure lowercase (database stores exactly as received from headers)
    return address.trim().toLowerCase();
  };

  const checkDevBadgeStatus = async () => {
    if (!identity?.address) {
      setHasDevBadge(false);
      return;
    }

    try {
      setCheckingBadge(true);
      setChainNodeError(null);
      
      // Normalize address (remove 0x prefix for chain RPC)
      const normalizedAddr = normalizeAddress(identity.address);
      
      const nftsRes = await getNftsByOwner(normalizedAddr);
      const nfts = nftsRes.nfts || [];
      
      // Check if user has a DEV Badge NFT
      const devBadge = nfts.find((nft: NftMetadata) => isDevBadgeNft(nft));
      setHasDevBadge(!!devBadge);
    } catch (err: any) {
      if (err.message?.includes("Connection failed") || err.message?.includes("Unable to reach")) {
        setChainNodeError("Demiurge chain node is not available. NFT badge features require the chain node to be running.");
        setHasDevBadge(false);
      } else {
        console.error("Failed to check DEV Badge status:", err);
        setChainNodeError("Failed to check DEV Badge status. Make sure the chain node is running.");
        setHasDevBadge(false);
      }
    } finally {
      setCheckingBadge(false);
    }
  };

  const handleClaimDevBadge = async () => {
    if (!identity?.address) {
      alert("You need an AbyssID to claim the Developer NFT Badge.");
      return;
    }

    try {
      setClaimingBadge(true);
      setChainNodeError(null);
      
      // Normalize address (remove 0x prefix)
      const normalizedAddr = normalizeAddress(identity.address);
      
      const result = await devClaimDevNft(normalizedAddr);
      
      if (result.ok) {
        setHasDevBadge(true);
        alert(`🎉 Success! Your Developer NFT Badge has been claimed. NFT ID: ${result.nft_id || "N/A"}`);
        // Refresh badge status
        await checkDevBadgeStatus();
      } else {
        alert("Failed to claim Developer NFT Badge. Please try again.");
      }
    } catch (err: any) {
      if (err.message?.includes("Connection failed") || err.message?.includes("Unable to reach")) {
        setChainNodeError("Demiurge chain node is not available. Please start the chain node to claim your badge.");
        alert("Cannot claim badge: Demiurge chain node is not available.");
      } else if (err.message?.includes("already has a DEV Badge")) {
        setHasDevBadge(true);
        alert("You already have a Developer NFT Badge.");
      } else {
        console.error("Failed to claim DEV Badge:", err);
        alert(`Failed to claim Developer NFT Badge: ${err.message || "Unknown error"}`);
      }
    } finally {
      setClaimingBadge(false);
    }
  };

  const checkArchonStatus = async () => {
    if (!identity?.address) {
      setIsArchon(false);
      return;
    }

    try {
      setCheckingArchon(true);
      const normalizedAddr = normalizeAddress(identity.address);
      
      const archonRes = await callRpc<{ is_archon: boolean }>("cgt_isArchon", {
        address: normalizedAddr,
      });
      setIsArchon(archonRes.is_archon || false);
    } catch (err: any) {
      if (err.message?.includes("Connection failed") || err.message?.includes("Unable to reach")) {
        console.warn("Chain node not available - Archon status check failed");
        setIsArchon(false);
      } else {
        console.error("Failed to check Archon status:", err);
        setIsArchon(false);
      }
    } finally {
      setCheckingArchon(false);
    }
  };

  const handleMintNft = async () => {
    if (minting || !identity?.address || !isArchon) return;

    setMinting(true);
    setMintError(null);

    try {
      const normalizedAddr = normalizeAddress(identity.address);
      
      // Optional: Call faucet first (only in dev)
      if (process.env.NODE_ENV !== "production") {
        try {
          await callRpc("cgt_devFaucet", { address: normalizedAddr });
        } catch (e) {
          // Faucet might fail, continue anyway
        }
      }

      // Generate dummy hash for test NFT
      const fabricHash = Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");

      // Create NFT name with username if available
      const nftName = identity.username 
        ? `D-GEN NFT by @${identity.username}`
        : `D-GEN NFT by ${normalizedAddr.slice(0, 8)}`;

      // Mint NFT
      const mintRes = await callRpc<{ nft_id: number }>("cgt_mintDgenNft", {
        owner: normalizedAddr,
        fabric_root_hash: fabricHash,
        forge_model_id: null,
        forge_prompt_hash: null,
        name: nftName,
        description: identity.username 
          ? `A D-GEN NFT minted by @${identity.username} from Void`
          : `A D-GEN NFT minted from Void`,
      });

      if (mintRes) {
        setMintError(null);
        alert(`🎉 NFT minted successfully! NFT ID: ${mintRes.nft_id}`);
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to mint NFT";
      if (errorMsg.includes("Archon") || errorMsg.includes("archon")) {
        setMintError("Only Archons can mint D-GEN NFTs. You need Archon status to mint.");
      } else {
        setMintError(errorMsg);
      }
    } finally {
      setMinting(false);
    }
  };

  // Helper to shorten address for display
  const shortenAddress = (addr: string) => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  const loadProjects = async () => {
    if (!identity?.address || !isDeveloper) return;

    try {
      const query = `
        query {
          projects(ownerAddress: "${identity.address}") {
            slug
            name
            description
            createdAt
          }
        }
      `;
      const data = await graphqlRequest<{ projects: Array<{ slug: string; name: string; description: string | null; createdAt: string }> }>(
        query,
        {},
        getChatHeaders(identity.address, identity.username || "")
      );
      setProjects(data.projects || []);
    } catch (err: any) {
      if (err.message?.includes("Connection failed") || err.message?.includes("Unable to reach")) {
        console.warn("Abyss Gateway not available - projects not loaded");
      } else {
        console.error("Failed to load projects:", err);
      }
    }
  };

  return (
    <FractureShell>
      <HeroPanel
        title="Void"
        subtitle="Developer HQ: Build, deploy, and manage your Demiurge projects"
      />

      <div className="space-y-6">
        {/* Developer Upgrade Card */}
        {identity && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-xl border transition-all duration-200 ${
              isDeveloper
                ? "bg-gradient-to-r from-cyan-500/10 to-fuchsia-500/10 border-cyan-500/30"
                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-cyan-500/30"
            }`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                <Code className="h-6 w-6 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-zinc-100 mb-1 flex items-center gap-2">
                  Become a Developer
                  {isDeveloper && (
                    <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-full flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Dev
                    </span>
                  )}
                </h3>
                <p className="text-sm text-zinc-400">
                  {isDeveloper
                    ? "You're a registered developer! Access developer resources, analytics, and project management tools."
                    : "Upgrade to Developer status to access advanced features, analytics, and project management tools."}
                </p>
              </div>
            </div>
            {!isDeveloper && !checking && (
              <div className="mt-4">
                <button
                  onClick={handleBecomeDeveloper}
                  disabled={registering}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-fuchsia-400 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {registering ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Registering...
                    </>
                  ) : (
                    <>
                      <Code className="h-5 w-5" />
                      Become a Developer
                    </>
                  )}
                </button>
                <p className="text-xs text-zinc-500 mt-2">
                  Requires an AbyssID with a username. You'll be added to the developer directory and receive a Dev badge.
                </p>
              </div>
            )}
            {/* Claim Developer NFT Badge - Only show if developer and doesn't have badge */}
            {isDeveloper && !hasDevBadge && !checkingBadge && (
              <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 border border-purple-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                    <Award className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-zinc-100 mb-1">
                      Claim Developer NFT Badge
                    </h4>
                    <p className="text-xs text-zinc-400 mb-3">
                      Claim your on-chain Developer NFT Badge to prove your developer status on the Demiurge chain. This badge is available to all registered developers.
                    </p>
                    {chainNodeError ? (
                      <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-300">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{chainNodeError}</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleClaimDevBadge}
                        disabled={claimingBadge}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-semibold rounded-lg hover:from-purple-400 hover:to-fuchsia-400 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                      >
                        {claimingBadge ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Claiming...
                          </>
                        ) : (
                          <>
                            <Award className="h-4 w-4" />
                            Claim NFT Badge
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Show loading state while checking badge */}
            {isDeveloper && checkingBadge && (
              <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
                  <p className="text-xs text-zinc-400">Checking NFT badge status...</p>
                </div>
              </div>
            )}
            {/* Show if already has badge */}
            {isDeveloper && hasDevBadge && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                    <Award className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-zinc-100 mb-1">
                      Developer NFT Badge Claimed
                    </h4>
                    <p className="text-xs text-zinc-400">
                      You have successfully claimed your Developer NFT Badge on the Demiurge chain.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Archon NFT Minting Section */}
        {identity && isArchon && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30 rounded-xl"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-violet-500/20 border border-violet-500/30">
                <Crown className="h-6 w-6 text-violet-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-zinc-100 mb-1 flex items-center gap-2">
                  Archon NFT Minting
                  <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-full flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Archon
                  </span>
                </h3>
                <p className="text-sm text-zinc-400">
                  As an Archon, you can mint D-GEN NFTs on the Demiurge chain.
                </p>
              </div>
            </div>
            
            {mintError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-400">{mintError}</p>
              </div>
            )}

            <button
              onClick={handleMintNft}
              disabled={minting || !isArchon}
              className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold rounded-lg hover:from-violet-400 hover:to-purple-400 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {minting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Minting...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Mint D-GEN NFT
                </>
              )}
            </button>
            <p className="text-xs text-zinc-500 mt-2">
              Only Archons can mint D-GEN NFTs. This feature requires the Demiurge chain node to be running.
            </p>
          </motion.div>
        )}

        {/* Archon Status Check */}
        {identity && !isArchon && !checkingArchon && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-white/5 border border-white/10 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5 text-zinc-500" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-zinc-300 mb-1">Archon Status</h4>
                <p className="text-xs text-zinc-400">
                  You are not currently an Archon. Archon status is required to mint D-GEN NFTs.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Developer Resources Section */}
        {identity?.isDeveloper && developerProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-gradient-to-r from-cyan-500/10 to-fuchsia-500/10 border border-cyan-500/30 rounded-xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                <Code className="h-6 w-6 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-zinc-100 mb-1 flex items-center gap-2">
                  Developer Resources
                  <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-full">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    Dev
                  </span>
                </h3>
                <p className="text-sm text-zinc-400">
                  Analytics, projects, and developer tools
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-cyan-400" />
                  <p className="text-xs text-zinc-400">Reputation</p>
                </div>
                <p className="text-2xl font-bold text-cyan-400">{developerProfile.reputation}</p>
                <p className="text-xs text-zinc-500 mt-1">Developer score</p>
              </div>

              <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <FolderKanban className="h-4 w-4 text-fuchsia-400" />
                  <p className="text-xs text-zinc-400">Projects</p>
                </div>
                <p className="text-2xl font-bold text-fuchsia-400">{projects.length}</p>
                <p className="text-xs text-zinc-500 mt-1">Active projects</p>
              </div>

              <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  <p className="text-xs text-zinc-400">Member Since</p>
                </div>
                <p className="text-sm font-semibold text-purple-400">
                  {new Date(developerProfile.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Developer since</p>
              </div>
            </div>

            {projects.length > 0 ? (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                  <FolderKanban className="h-4 w-4" />
                  Your Projects
                </h4>
                <div className="space-y-2">
                  {projects.map((project) => (
                    <Link
                      key={project.slug}
                      href={`/developers/projects/${project.slug}`}
                      className="block p-3 bg-black/20 border border-white/10 rounded-lg hover:bg-black/30 hover:border-cyan-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-zinc-200">{project.name}</p>
                          {project.description && (
                            <p className="text-xs text-zinc-400 mt-1">{project.description}</p>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-zinc-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-black/20 border border-white/10 rounded-lg text-center">
                <FolderKanban className="h-8 w-8 text-zinc-500 mx-auto mb-2" />
                <p className="text-sm text-zinc-400 mb-2">No projects yet</p>
                <Link
                  href="/developers/projects"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-zinc-200 text-sm font-semibold rounded-lg hover:bg-white/10 hover:border-cyan-500/30 transition-all"
                >
                  <Code className="h-4 w-4" />
                  Create Project
                </Link>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
              <Link
                href="/developers"
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-zinc-200 text-sm font-semibold rounded-lg hover:bg-white/10 hover:border-cyan-500/30 transition-all"
              >
                <BarChart3 className="h-4 w-4" />
                Developer Directory
              </Link>
              <Link
                href="/developers/projects"
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-zinc-200 text-sm font-semibold rounded-lg hover:bg-white/10 hover:border-cyan-500/30 transition-all"
              >
                <FolderKanban className="h-4 w-4" />
                Manage Projects
              </Link>
            </div>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Dev Capsules */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/30">
                <FolderKanban className="h-6 w-6 text-fuchsia-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100">
                Dev Capsules
              </h3>
            </div>
            <p className="text-sm text-zinc-400 mb-4">
              TODO: Milestone 4.1 – integrate Dev Capsules management interface
            </p>
            <p className="text-xs text-zinc-500">
              Create and manage project-bound execution environments tracked on-chain.
            </p>
          </div>
        </div>

        {/* Recursion Engine */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-purple-500/20 border border-purple-500/30">
              <Code className="h-6 w-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-zinc-100 mb-1">
                Recursion Engine
              </h3>
              <p className="text-sm text-zinc-400">
                Chain-native game engine for creating sovereign worlds
              </p>
            </div>
            <Link
              href="/scrolls/developers/recursion"
              className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all text-sm font-medium"
            >
              <BookOpen className="h-4 w-4 inline mr-2" />
              Docs
            </Link>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-6 bg-gradient-to-r from-cyan-500/10 to-fuchsia-500/10 border border-cyan-500/20 rounded-xl">
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">
            About Void
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Void is the command center for developers building on Demiurge. Here you can manage your projects,
            create Dev Capsules, interact with the Recursion Engine, and access all developer tools and resources.
            This is where the future of sovereign development takes shape.
          </p>
        </div>
      </div>
    </FractureShell>
  );
}

