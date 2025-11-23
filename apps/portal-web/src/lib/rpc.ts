import { DEMIURGE_RPC_URL } from "@/config/demiurge";

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
 * Get UrgeID progression info (level, thresholds, progress).
 */
export async function getUrgeIdProgress(
  address: string
): Promise<UrgeIDProgress> {
  return callRpc<UrgeIDProgress>("urgeid_getProgress", {
    address,
  });
}

