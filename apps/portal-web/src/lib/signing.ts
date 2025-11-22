/**
 * Ed25519 signing utilities for Demiurge transactions.
 */

import { sign, getPublicKey } from "@noble/ed25519";

/**
 * Hash bytes using SHA-256 (Web Crypto API).
 */
async function sha256Hash(data: Uint8Array): Promise<Uint8Array> {
  // Copy to a new Uint8Array to ensure we have a proper ArrayBuffer
  const dataCopy = new Uint8Array(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataCopy);
  return new Uint8Array(hashBuffer);
}

/**
 * Derive public key (address) from private key.
 */
export function deriveAddress(privateKeyHex: string): string {
  const privateKey = hexToBytes(privateKeyHex);
  const publicKey = getPublicKey(privateKey);
  return bytesToHex(publicKey);
}

/**
 * Sign a message with Ed25519.
 *
 * @param message - Message bytes to sign
 * @param privateKeyHex - Private key as hex string
 * @returns Signature as hex string (64 bytes = 128 hex chars)
 */
export async function signMessage(
  message: Uint8Array,
  privateKeyHex: string
): Promise<string> {
  const privateKey = hexToBytes(privateKeyHex);
  const signature = await sign(message, privateKey);
  return bytesToHex(signature);
}

/**
 * Sign a transaction.
 *
 * The transaction should be serialized without signature (for signing),
 * then the signature is computed and added.
 *
 * @param txBytes - Transaction bytes (without signature)
 * @param privateKeyHex - Private key as hex string
 * @returns Signature as hex string
 */
export async function signTransaction(
  txBytes: Uint8Array,
  privateKeyHex: string
): Promise<string> {
  // Hash the transaction bytes for signing
  const messageHash = await sha256Hash(txBytes);
  return signMessage(messageHash, privateKeyHex);
}

/**
 * Convert hex string to bytes.
 */
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Convert bytes to hex string.
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

