/**
 * Transaction building and signing helpers for Demiurge chain.
 */

const CGT_DECIMALS = 8;

export type Transaction = {
  from: string; // hex address
  nonce: number;
  module_id: string;
  call_id: string;
  payload: string; // hex-encoded bincode
  fee: number;
  signature: string; // hex-encoded signature
};

/**
 * Convert CGT amount (human-readable) to smallest units.
 */
export function cgtToSmallest(cgt: number): bigint {
  return BigInt(Math.floor(cgt * 10 ** CGT_DECIMALS));
}

/**
 * Build a CGT transfer transaction.
 */
export async function buildTransferTransaction(
  from: string,
  to: string,
  amountCgt: number,
  nonce: number,
  fee: number = 1000 // Default fee in smallest units
): Promise<Transaction> {
  // Convert amount to smallest units
  const amountSmallest = cgtToSmallest(amountCgt);

  // Build transfer params (matches Rust TransferParams)
  const params = {
    to: hexToBytes(to),
    amount: amountSmallest.toString(),
  };

  // Serialize params to bincode (we'll use a simple JSON approach for now)
  // In production, you'd use a proper bincode encoder
  // For dev, we'll encode as JSON and the Rust side can handle it
  const payloadJson = JSON.stringify({
    to: to,
    amount: amountSmallest.toString(),
  });

  // Convert to hex (simplified - in production use proper bincode)
  const payloadHex = Buffer.from(payloadJson).toString("hex");

  return {
    from,
    nonce,
    module_id: "bank_cgt",
    call_id: "transfer",
    payload: payloadHex,
    fee,
    signature: "", // Will be signed separately
  };
}

/**
 * Sign a transaction (dev stub - uses simple hash for now).
 * In production, this would use Ed25519 or similar.
 */
export async function signTransaction(
  tx: Transaction,
  privateKey: string
): Promise<string> {
  // For dev: create a simple signature placeholder
  // In production, use proper cryptographic signing
  const txHash = await hashTransaction(tx);
  // Stub: return a hex signature (64 bytes)
  return txHash.slice(0, 128); // 64 bytes = 128 hex chars
}

/**
 * Hash a transaction for signing (simplified).
 */
async function hashTransaction(tx: Transaction): Promise<string> {
  const data = `${tx.from}${tx.nonce}${tx.module_id}${tx.call_id}${tx.payload}${tx.fee}`;
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Convert hex string to bytes (for address conversion).
 */
function hexToBytes(hex: string): number[] {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes: number[] = [];
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes.push(parseInt(cleanHex.slice(i, i + 2), 16));
  }
  return bytes;
}

/**
 * Serialize transaction to hex for RPC submission.
 */
export function serializeTransaction(tx: Transaction): string {
  // For now, serialize as JSON and encode as hex
  // In production, use proper bincode serialization
  const json = JSON.stringify({
    from: hexToBytes(tx.from),
    nonce: tx.nonce,
    module_id: tx.module_id,
    call_id: tx.call_id,
    payload: hexToBytes(tx.payload),
    fee: tx.fee,
    signature: hexToBytes(tx.signature || ""),
  });
  return Buffer.from(json).toString("hex");
}

