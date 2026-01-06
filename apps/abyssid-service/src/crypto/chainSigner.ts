/**
 * Chain Signer Module
 * 
 * Handles signing and submitting DRC-369 mint transactions to the Demiurge chain
 */

import { ed25519 } from '@noble/curves/ed25519';
import { deriveDemiurgeKey } from './keyDerivation.js';
import { encodeDrc369Mint, type DRC369MintAsset } from '../tx/encodeDrc369Mint.js';
import { sendRawTransaction } from '../rpc.js';
import { bytesToHex } from '../tx/utils.js';

export interface ChainUser {
  id?: number;
  username?: string;
  public_key: string; // Identity public key (required)
}

// Type helper for partial ChainUser (only public_key required)
export type ChainUserMinimal = Pick<ChainUser, 'public_key'> & Partial<Pick<ChainUser, 'id' | 'username'>>;

export interface MintResult {
  txHash: string;
  assetId: string;
  onChain: boolean;
}

/**
 * Mint a DRC-369 asset on the Demiurge chain
 * 
 * @param user - User object with identity public key
 * @param asset - Asset data to mint
 * @returns Transaction hash and asset ID
 */
export async function mintDrc369OnChain(
  user: ChainUserMinimal,
  asset: DRC369MintAsset
): Promise<MintResult> {
  // Derive the user's Demiurge chain private key
  const privKey = deriveDemiurgeKey(user.public_key);
  
  // Encode the mint transaction payload
  const payload = encodeDrc369Mint(asset);
  
  // Sign the payload with Ed25519
  const signature = ed25519.sign(payload, privKey);
  
  // Construct raw transaction: [payload][signature]
  const rawTx = new Uint8Array(payload.length + signature.length);
  rawTx.set(payload, 0);
  rawTx.set(signature, payload.length);
  
  // Convert to hex for RPC submission
  const rawTxHex = bytesToHex(rawTx);
  
  // Submit to chain
  const txHash = await sendRawTransaction(rawTxHex);
  
  // Generate asset ID from transaction hash
  const assetId = `drc369:${txHash.slice(0, 16)}`;
  
  return {
    txHash,
    assetId,
    onChain: true,
  };
}

