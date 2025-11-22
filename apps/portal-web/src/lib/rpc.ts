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

