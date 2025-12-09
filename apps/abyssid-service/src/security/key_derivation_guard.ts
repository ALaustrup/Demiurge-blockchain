/**
 * 💀 Key Derivation Guard
 * 
 * PHASE OMEGA PART II: Enforces deterministic key derivation
 * and validates key generation consistency
 */

import { deriveDemiurgeKey, deriveDemiurgeKeypair } from '../crypto/keyDerivation';
import { sha256 } from '@noble/hashes/sha256';

export interface KeyDerivationResult {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  derivationHash: string;
}

export class KeyDerivationGuard {
  /**
   * Derive keys with validation
   * PHASE OMEGA PART II: Ensures deterministic derivation
   */
  static deriveKeysWithGuard(identityPublicKey: string): KeyDerivationResult {
    // Validate input
    if (!identityPublicKey || identityPublicKey.length < 32) {
      throw new Error('Invalid identity public key');
    }
    
    // Derive keys
    const { privateKey, publicKey } = deriveDemiurgeKeypair(identityPublicKey);
    
    // Verify deterministic derivation
    const { privateKey: privateKey2, publicKey: publicKey2 } = deriveDemiurgeKeypair(identityPublicKey);
    
    if (!this.arraysEqual(privateKey, privateKey2)) {
      throw new Error('Key derivation is non-deterministic');
    }
    
    if (!this.arraysEqual(publicKey, publicKey2)) {
      throw new Error('Public key derivation is non-deterministic');
    }
    
    // Compute derivation hash for tracking
    const derivationHash = this.computeDerivationHash(identityPublicKey, privateKey, publicKey);
    
    return {
      privateKey,
      publicKey,
      derivationHash,
    };
  }

  /**
   * Verify key derivation consistency
   */
  static verifyDerivationConsistency(
    identityPublicKey: string,
    expectedPrivateKey: Uint8Array,
    expectedPublicKey: Uint8Array
  ): boolean {
    const { privateKey, publicKey } = deriveDemiurgeKeypair(identityPublicKey);
    
    return this.arraysEqual(privateKey, expectedPrivateKey) &&
           this.arraysEqual(publicKey, expectedPublicKey);
  }

  /**
   * Compute derivation hash for tracking
   */
  private static computeDerivationHash(
    identityKey: string,
    privateKey: Uint8Array,
    publicKey: Uint8Array
  ): string {
    const combined = new Uint8Array(identityKey.length + privateKey.length + publicKey.length);
    combined.set(new TextEncoder().encode(identityKey), 0);
    combined.set(privateKey, identityKey.length);
    combined.set(publicKey, identityKey.length + privateKey.length);
    
    const hash = sha256(combined);
    return Array.from(hash)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Compare two Uint8Arrays
   */
  private static arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Validate key format
   */
  static validateKeyFormat(key: Uint8Array, expectedLength: number): boolean {
    if (key.length !== expectedLength) {
      return false;
    }
    
    // Ed25519 keys should not be all zeros
    return !key.every(b => b === 0);
  }
}
