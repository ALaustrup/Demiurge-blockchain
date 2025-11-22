import { DEMIURGE_RPC_URL } from "@/config/demiurge";

export async function callRpc<T>(
  method: string,
  params: any | null = null
): Promise<T> {
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

  const json = await res.json();
  if (json.error) {
    throw new Error(json.error.message || "RPC error");
  }
  return json.result as T;
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

/**
 * Convert CGT from smallest units (string) to human-readable number.
 */
export function cgtFromSmallest(smallest: string | number): number {
  const big = typeof smallest === "string" ? BigInt(smallest) : BigInt(smallest);
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
  const amount = cgtFromSmallest(smallest);
  return amount.toFixed(CGT_DECIMALS).replace(/\.?0+$/, "");
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

