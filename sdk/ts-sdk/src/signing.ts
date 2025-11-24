/**
 * Ed25519 signing utilities for Demiurge transactions
 */

import { signAsync, getPublicKeyAsync } from '@noble/ed25519';

/**
 * Hash bytes using SHA-256 (Web Crypto API)
 */
async function sha256Hash(data: Uint8Array): Promise<Uint8Array> {
  const dataCopy = new Uint8Array(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataCopy);
  return new Uint8Array(hashBuffer);
}

/**
 * Convert hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Convert bytes to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Derive public key (address) from private key
 */
export async function deriveAddress(privateKeyHex: string): Promise<string> {
  const privateKey = hexToBytes(privateKeyHex);
  const publicKey = await getPublicKeyAsync(privateKey);
  return '0x' + bytesToHex(publicKey);
}

/**
 * Sign a message with Ed25519
 */
export async function signMessage(
  message: Uint8Array,
  privateKeyHex: string
): Promise<string> {
  const privateKey = hexToBytes(privateKeyHex);
  const signature = await signAsync(message, privateKey);
  return bytesToHex(signature);
}

/**
 * Sign a transaction
 * 
 * The transaction should be serialized without signature (for signing),
 * then the signature is computed and added.
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
 * Sign a transaction hex string
 */
export async function signTransactionHex(
  unsignedTxHex: string,
  privateKeyHex: string
): Promise<string> {
  const txBytes = hexToBytes(unsignedTxHex);
  return signTransaction(txBytes, privateKeyHex);
}

