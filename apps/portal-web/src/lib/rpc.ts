import { DEMIURGE_RPC_URL } from "@/config/demiurge";

/**
 * Normalize address for chain RPC calls.
 * AbyssID addresses are 20 bytes (40 hex chars), but chain expects 32 bytes (64 hex chars).
 * Pads with zeros on the left to make it 32 bytes.
 */
export function normalizeAddressForChain(address: string): string {
  let normalized = address.trim().toLowerCase();
  if (normalized.startsWith("0x")) {
    normalized = normalized.slice(2);
  }
  // Pad 20-byte addresses (40 hex chars) to 32 bytes (64 hex chars)
  if (normalized.length === 40) {
    normalized = "0".repeat(24) + normalized; // 24 zeros (48 hex chars) + 40 hex chars = 64 hex chars (32 bytes)
  }
  return normalized;
}

export async function callRpc<T>(
  method: string,
  params: any | null = null
): Promise<T> {
  try {
    const res = await fetch(DEMIURGE_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method,
        params,
        id: Date.now(),
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    if (json.error) {
      throw new Error(json.error.message || "RPC error");
    }
    return json.result as T;
  } catch (error: any) {
    if (error.message?.includes("fetch")) {
      throw new Error(`Connection failed: Unable to reach Demiurge node at ${DEMIURGE_RPC_URL}. Make sure the node is running.`);
    }
    throw error;
  }
}

const CGT_DECIMALS = 8;
const CGT_DIVISOR = BigInt(10 ** CGT_DECIMALS);

export type CgtMetadata = {
  name: string;
  symbol: string;
  decimals: number;
  maxSupply: string;
  totalSupply: string;
};

export type CgtTotalSupply = {
  totalSupply: string;
};

export type CgtBalance = {
  balance: string;
};

export type UrgeIDProfile = {
  address: string;
  display_name: string;
  bio?: string | null;
  handle?: string | null;
  username?: string | null;
  level: number;
  syzygy_score: number;
  total_cgt_earned_from_rewards: string;
  badges: string[];
  created_at_height?: number | null;
};

export type UrgeIDProgress = {
  address: string;
  level: number;
  syzygyScore: number;
  currentLevelThreshold: number;
  nextLevelThreshold: number;
  progressRatio: number;
  totalCgtEarnedFromRewards: string;
};

/**
 * Convert CGT from smallest units (string) to human-readable number.
 */
export function cgtFromSmallest(smallest: string | number): number {
  // Ensure we have a string representation of an integer
  let smallestStr: string;
  if (typeof smallest === "string") {
    // Remove any decimal point and following digits if present
    smallestStr = smallest.split(".")[0];
  } else {
    // Convert number to string, ensuring it's an integer
    smallestStr = Math.floor(smallest).toString();
  }
  
  // Validate it's a valid integer string
  if (!/^-?\d+$/.test(smallestStr)) {
    throw new Error(`Invalid CGT smallest units: ${smallest}`);
  }
  
  const big = BigInt(smallestStr);
  return Number(big) / Number(CGT_DIVISOR);
}

/**
 * Convert CGT (human-readable) to smallest units (string).
 */
export function cgtToSmallest(cgt: number): string {
  const amount = BigInt(Math.floor(cgt * Number(CGT_DIVISOR)));
  return amount.toString();
}

/**
 * Format CGT balance for display.
 */
export function formatCgt(smallest: string | number): string {
  try {
    const amount = cgtFromSmallest(smallest);
    return amount.toFixed(CGT_DECIMALS).replace(/\.?0+$/, "");
  } catch (error) {
    // Fallback: try to parse as string and remove decimals
    const str = String(smallest);
    const intStr = str.split(".")[0];
    try {
      const amount = cgtFromSmallest(intStr);
      return amount.toFixed(CGT_DECIMALS).replace(/\.?0+$/, "");
    } catch {
      return "0";
    }
  }
}

/**
 * Get CGT metadata.
 */
export async function getCgtMetadata(): Promise<CgtMetadata> {
  return callRpc<CgtMetadata>("cgt_getMetadata", null);
}

/**
 * Get CGT total supply.
 */
export async function getCgtTotalSupply(): Promise<CgtTotalSupply> {
  return callRpc<CgtTotalSupply>("cgt_getTotalSupply", null);
}

/**
 * Get CGT balance for an address.
 */
export async function getCgtBalance(address: string): Promise<CgtBalance> {
  return callRpc<CgtBalance>("cgt_getBalance", { address });
}

/**
 * Get nonce for an address.
 */
export async function getNonce(address: string): Promise<{ nonce: number }> {
  return callRpc<{ nonce: number }>("cgt_getNonce", { address });
}

/**
 * Dev-only: Transfer CGT without signature (unsafe, dev mode only).
 */
export async function devTransferCgt(
  from: string,
  to: string,
  amountSmallest: string,
  fee?: number
): Promise<{ ok: boolean; from_balance: string; to_balance: string }> {
  return callRpc<{ ok: boolean; from_balance: string; to_balance: string }>(
    "cgt_devUnsafeTransfer",
    {
      from,
      to,
      amount: amountSmallest,
      fee: fee || 0,
    }
  );
}

/**
 * Build a transfer transaction (server-side serialization).
 */
export async function buildTransferTx(
  from: string,
  to: string,
  amountSmallest: string,
  nonce: number,
  fee?: number
): Promise<{ tx_hex: string }> {
  return callRpc<{ tx_hex: string }>("cgt_buildTransferTx", {
    from,
    to,
    amount: amountSmallest,
    nonce,
    fee: fee || 0,
  });
}

/**
 * Submit a raw transaction (hex-encoded bincode).
 */
export async function sendRawTransaction(
  txHex: string
): Promise<{ accepted: boolean; tx_hash: string }> {
  return callRpc<{ accepted: boolean; tx_hash: string }>("cgt_sendRawTransaction", {
    tx: txHex,
  });
}

/**
 * Get a transaction by hash.
 */
export async function getTransaction(
  txHash: string
): Promise<{
  from: string;
  nonce: number;
  module_id: string;
  call_id: string;
  payload: string;
  fee: number;
  signature: string;
  hash: string;
} | null> {
  return callRpc<{
    from: string;
    nonce: number;
    module_id: string;
    call_id: string;
    payload: string;
    fee: number;
    signature: string;
    hash: string;
  } | null>("cgt_getTransaction", { tx_hash: txHash });
}

/**
 * Get transaction history for an address.
 */
export type UserAnalytics = {
  address: string;
  level: number;
  syzygyScore: number;
  totalCgtEarnedFromRewards: string;
  badges: string[];
  balance: string;
  totalTransactions: number;
  totalNfts: number;
  isArchon: boolean;
  cgtVolume: string;
  createdAtHeight: number | null;
};

export async function getUserAnalytics(address: string): Promise<UserAnalytics> {
  const response = await callRpc("urgeid_getAnalytics", { address }) as { error?: { message: string }, result?: UserAnalytics };
  if (response.error) {
    throw new Error(response.error.message || "Failed to get user analytics");
  }
  return response.result as UserAnalytics;
}

/**
 * Marketplace types and functions
 */
export type Listing = {
  id: number;
  token_id: number;
  seller: string;
  price_cgt: string;
  active: boolean;
};

export type NftMetadata = {
  id: number;
  owner: string;
  creator: string;
  fabric_root_hash: string;
  royalty_recipient?: string | null;
  royalty_bps?: number;
  name?: string;
  description?: string;
  class?: "DGen" | "DevBadge" | null; // NFT class/type
};

// DEV Badge NFT fabric root hash constant (matches chain constant)
export const FABRIC_ROOT_DEV_BADGE = "0xDE5BAD6E00000000000000000000000000000000000000000000000000000000";

/**
 * Check if an NFT is a DEV Badge NFT
 */
export function isDevBadgeNft(nft: NftMetadata): boolean {
  // Check by class first (newer NFTs)
  if (nft.class === "DevBadge") {
    return true;
  }
  // Fallback: check fabric root hash (for backward compatibility)
  const normalizedHash = nft.fabric_root_hash.toLowerCase();
  const normalizedConstant = FABRIC_ROOT_DEV_BADGE.toLowerCase();
  return normalizedHash === normalizedConstant;
}

/**
 * Get all active marketplace listings.
 */
export async function getAllListings(): Promise<{ listings: Listing[] }> {
  return callRpc<{ listings: Listing[] }>("cgt_getAllListings", null);
}

/**
 * Get a specific listing by ID.
 */
export async function getListing(listingId: number): Promise<Listing | null> {
  return callRpc<Listing | null>("cgt_getListing", { listing_id: listingId });
}

/**
 * Build a transaction to create a listing.
 */
export async function buildCreateListingTx(
  from: string,
  tokenId: number,
  priceCgt: string
): Promise<{ tx_hex: string }> {
  return callRpc<{ tx_hex: string }>("cgt_buildCreateListingTx", {
    from,
    token_id: tokenId,
    price_cgt: priceCgt,
  });
}

/**
 * Build a transaction to cancel a listing.
 */
export async function buildCancelListingTx(
  from: string,
  listingId: number
): Promise<{ tx_hex: string }> {
  return callRpc<{ tx_hex: string }>("cgt_buildCancelListingTx", {
    from,
    listing_id: listingId,
  });
}

/**
 * Build a transaction to buy a listing.
 */
export async function buildBuyListingTx(
  from: string,
  listingId: number
): Promise<{ tx_hex: string }> {
  return callRpc<{ tx_hex: string }>("cgt_buildBuyListingTx", {
    from,
    listing_id: listingId,
  });
}

/**
 * Get NFTs owned by an address.
 */
export async function getNftsByOwner(owner: string): Promise<{ nfts: NftMetadata[] }> {
  return callRpc<{ nfts: NftMetadata[] }>("cgt_getNftsByOwner", { address: owner });
}

/**
 * Get a single NFT by ID.
 */
export async function getNft(nftId: number): Promise<NftMetadata | null> {
  return callRpc<NftMetadata | null>("cgt_getNft", { nft_id: nftId });
}

export async function getTransactionHistory(
  address: string,
  limit?: number
): Promise<{ transactions: string[] }> {
  return callRpc<{ transactions: string[] }>("cgt_getTransactionHistory", {
    address,
    limit: limit || 50,
  });
}

/**
 * Sign a transaction (attach signature to unsigned transaction).
 */
export async function signTransactionRpc(
  txHex: string,
  signatureHex: string
): Promise<{ tx_hex: string }> {
  return callRpc<{ tx_hex: string }>("cgt_signTransaction", {
    tx_hex: txHex,
    signature: signatureHex,
  });
}

/**
 * Set username for an UrgeID.
 */
export async function setUsername(
  address: string,
  username: string
): Promise<{ address: string; username: string }> {
  return callRpc<{ address: string; username: string }>("urgeid_setUsername", {
    address,
    username,
  });
}

/**
 * Resolve username to address.
 */
export async function resolveUsername(
  username: string
): Promise<{ address: string }> {
  return callRpc<{ address: string }>("urgeid_resolveUsername", {
    username,
  });
}

/**
 * Get UrgeID profile by username.
 */
export async function getProfileByUsername(
  username: string
): Promise<UrgeIDProfile | null> {
  return callRpc<UrgeIDProfile | null>("urgeid_getProfileByUsername", {
    username,
  });
}

/**
 * Get UrgeID profile by address.
 */
export async function getUrgeIdProfile(
  address: string
): Promise<UrgeIDProfile | null> {
  return callRpc<UrgeIDProfile | null>("urgeid_get", {
    address,
  });
}

/**
 * Get UrgeID progression info (level, thresholds, progress).
 */
export async function getUrgeIdProgress(
  address: string
): Promise<UrgeIDProgress> {
  return callRpc<UrgeIDProgress>("urgeid_getProgress", {
    address,
  });
}

// Dev Capsules types and helpers

export type CapsuleStatus = "draft" | "live" | "paused" | "archived";

export type DevCapsule = {
  id: number;
  owner: string;
  project_slug: string;
  status: CapsuleStatus;
  created_at: number;
  updated_at: number;
  notes: string;
};

/**
 * Create a new Dev Capsule for a project.
 */
export async function devCapsuleCreate(
  owner: string,
  projectSlug: string,
  notes: string
): Promise<DevCapsule> {
  return callRpc<DevCapsule>("devCapsule_create", {
    owner,
    project_slug: projectSlug,
    notes,
  });
}

/**
 * Get a Dev Capsule by ID.
 */
export async function devCapsuleGet(id: number): Promise<DevCapsule | null> {
  return callRpc<DevCapsule | null>("devCapsule_get", { id });
}

/**
 * List all Dev Capsules owned by an address.
 */
export async function devCapsuleListByOwner(
  owner: string
): Promise<DevCapsule[]> {
  return callRpc<DevCapsule[]>("devCapsule_listByOwner", { owner });
}

/**
 * Update the status of a Dev Capsule.
 */
export async function devCapsuleUpdateStatus(
  id: number,
  status: CapsuleStatus
): Promise<DevCapsule> {
  return callRpc<DevCapsule>("devCapsule_updateStatus", { id, status });
}

/**
 * Claim DEV Badge NFT for an existing developer
 */
export async function devClaimDevNft(address: string): Promise<{ ok: boolean; nft_id?: number }> {
  return callRpc<{ ok: boolean; nft_id?: number }>("dev_claimDevNft", { address });
}

// Recursion Registry types and helpers

export type RecursionWorld = {
  world_id: string;
  owner: string;
  title: string;
  description: string;
  fabric_root_hash: string;
  created_at: number;
};

/**
 * Create a new Recursion World.
 */
export async function recursionCreateWorld(
  owner: string,
  worldId: string,
  title: string,
  description: string,
  fabricRootHash: string
): Promise<RecursionWorld> {
  return callRpc<RecursionWorld>("recursion_createWorld", {
    owner,
    world_id: worldId,
    title,
    description,
    fabric_root_hash: fabricRootHash,
  });
}

/**
 * Get a Recursion World by ID.
 */
export async function recursionGetWorld(worldId: string): Promise<RecursionWorld | null> {
  return callRpc<RecursionWorld | null>("recursion_getWorld", { world_id: worldId });
}

/**
 * List all Recursion Worlds owned by an address.
 */
export async function recursionListWorldsByOwner(owner: string): Promise<RecursionWorld[]> {
  return callRpc<RecursionWorld[]>("recursion_listWorldsByOwner", { owner });
}

