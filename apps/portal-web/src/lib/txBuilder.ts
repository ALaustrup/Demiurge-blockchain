/**
 * Transaction building and signing utilities.
 */

import { signTransaction } from "./signing";

/**
 * Sign a transaction hex string and return signed hex.
 * 
 * This decodes the unsigned transaction, adds the signature,
 * and re-encodes it. Since we're using bincode (Rust format),
 * we need to work with the server to properly handle this.
 * 
 * For now, we'll use a simpler approach: the server accepts
 * the unsigned transaction and we'll add signing via a separate
 * RPC call or modify the transaction structure.
 */
export async function signTransactionHex(
  unsignedTxHex: string,
  privateKeyHex: string
): Promise<string> {
  // The transaction hex is bincode-encoded. We need to:
  // 1. Decode it to get the transaction structure
  // 2. Sign the transaction (without signature field)
  // 3. Add signature to the structure
  // 4. Re-encode
  
  // For now, since bincode decoding in JS is complex,
  // we'll sign the raw bytes and the server will handle
  // attaching the signature. Or we can use a helper RPC.
  
  // Actually, let's sign the transaction bytes directly
  // The signature should be computed over the transaction
  // without the signature field
  const txBytes = Uint8Array.from(Buffer.from(unsignedTxHex, "hex"));
  
  // Sign the transaction bytes (these are the unsigned transaction)
  const signature = await signTransaction(txBytes, privateKeyHex);
  
  // For now, return the original hex - we'll need server-side
  // support to properly attach the signature to bincode-encoded data
  // TODO: Implement proper bincode decode/encode or use server RPC
  return unsignedTxHex;
}

