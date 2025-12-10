/**
 * Demiurge Wallet Service
 * 
 * Handles wallet operations: derive keys, sign transactions, send CGT
 */

import { deriveDemiurgeKeypair, bytesToHex } from './keyDerivation';
import { ed25519 } from '@noble/curves/ed25519';

const RPC_URL = import.meta.env.VITE_DEMIURGE_RPC_URL || 'https://rpc.demiurge.cloud/rpc';

export interface SendCgtParams {
  from: string;      // AbyssID identity public key
  to: string;        // Recipient address
  amount: number;   // CGT amount
  fee?: number;     // Optional fee override
}

export interface SignedTransaction {
  rawTx: string;    // Hex-encoded raw transaction
  txHash: string;   // Transaction hash
}

/**
 * Derive Demiurge public key from AbyssID identity key
 */
export async function deriveDemiurgePublicKey(identityPublicKey: string): Promise<string> {
  const { publicKey } = await deriveDemiurgeKeypair(identityPublicKey);
  return bytesToHex(publicKey);
}

/**
 * Encode a CGT transfer transaction
 */
function encodeCgtTransfer(params: SendCgtParams): Uint8Array {
  // Simple encoding: [type=0x02][from_len][from][to_len][to][amount_8bytes][fee_8bytes]
  const TYPE = Uint8Array.of(0x02);
  const fromBytes = new TextEncoder().encode(params.from);
  const toBytes = new TextEncoder().encode(params.to);
  
  // Encode amount and fee as 8-byte big-endian integers
  const amountBytes = new Uint8Array(8);
  let amountBigInt = BigInt(Math.floor(params.amount * 1e18)); // Convert to wei-like units
  for (let i = 7; i >= 0; i--) {
    amountBytes[i] = Number(amountBigInt & 0xffn);
    amountBigInt >>= 8n;
  }
  
  const fee = params.fee || 0;
  const feeBytes = new Uint8Array(8);
  let feeBigInt = BigInt(Math.floor(fee * 1e18));
  for (let i = 7; i >= 0; i--) {
    feeBytes[i] = Number(feeBigInt & 0xffn);
    feeBigInt >>= 8n;
  }
  
  // Construct payload
  const parts: Uint8Array[] = [
    TYPE,
    Uint8Array.of(fromBytes.length),
    fromBytes,
    Uint8Array.of(toBytes.length),
    toBytes,
    amountBytes,
    feeBytes,
  ];
  
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const payload = new Uint8Array(totalLength);
  
  let offset = 0;
  for (const part of parts) {
    payload.set(part, offset);
    offset += part.length;
  }
  
  return payload;
}

/**
 * Check if user can send CGT (must have minted/swapped an NFT)
 * This now checks on-chain data directly for real-time sync
 */
export async function canSendCgt(sessionToken: string | null): Promise<boolean> {
  if (!sessionToken) return false;
  
  try {
    const response = await fetch(`${import.meta.env.VITE_ABYSSID_API_URL || 'http://localhost:8082'}/api/wallet/can-send`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
    });
    
    if (response.ok) {
      const { canSend } = await response.json();
      return canSend;
    }
  } catch (error) {
    console.error('Failed to check send permission:', error);
  }
  
  return false;
}

/**
 * Sync NFT mint status from on-chain data
 * Call this after minting an NFT to ensure the wallet recognizes it immediately
 */
export async function syncNftMintStatus(sessionToken: string | null): Promise<boolean> {
  if (!sessionToken) return false;
  
  try {
    const response = await fetch(`${import.meta.env.VITE_ABYSSID_API_URL || 'http://localhost:8082'}/api/wallet/sync-nft-status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const { hasMintedNft } = await response.json();
      return hasMintedNft === true;
    }
  } catch (error) {
    console.error('Failed to sync NFT mint status:', error);
  }
  
  return false;
}

/**
 * Sign and send a CGT transfer transaction
 */
export async function sendCgt(params: SendCgtParams): Promise<SignedTransaction> {
  // Check if user can send (must have minted/swapped NFT)
  const sessionToken = typeof window !== 'undefined' 
    ? localStorage.getItem('abyssos.abyssid.sessionId')
    : null;
  
  const canSend = await canSendCgt(sessionToken);
  if (!canSend) {
    throw new Error('You must mint or swap a DRC-369 NFT before sending CGT');
  }
  
  // Derive private key from identity key
  const { privateKey } = await deriveDemiurgeKeypair(params.from);
  
  // Encode transaction
  const payload = encodeCgtTransfer(params);
  
  // Sign with Ed25519
  const signature = ed25519.sign(payload, privateKey);
  
  // Construct raw transaction: [payload][signature]
  const rawTx = new Uint8Array(payload.length + signature.length);
  rawTx.set(payload, 0);
  rawTx.set(signature, payload.length);
  
  // Convert to hex
  const rawTxHex = bytesToHex(rawTx);
  
  // Submit to chain
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'cgt_sendRawTransaction',
      params: [rawTxHex],
      id: Date.now(),
    }),
  });
  
  const json = await response.json();
  if (json.error) {
    throw new Error(json.error.message || 'Transaction failed');
  }
  
  const txHash = json.result || `0x${bytesToHex(signature.slice(0, 16))}`;
  
  return {
    rawTx: rawTxHex,
    txHash,
  };
}

/**
 * Get CGT balance for an address
 */
export async function getCgtBalance(address: string): Promise<number> {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'cgt_getBalance',
      params: [address],
      id: Date.now(),
    }),
  });
  
  const json = await response.json();
  if (json.error) {
    throw new Error(json.error.message || 'Failed to get balance');
  }
  
  // Convert from wei-like units to CGT
  return Number(json.result || 0) / 1e18;
}

