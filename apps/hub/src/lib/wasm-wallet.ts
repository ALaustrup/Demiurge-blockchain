/**
 * WASM Wallet Service
 * 
 * Provides browser-based wallet signing using WebAssembly.
 *
 * SECURITY (Phase 0): keypairs are NEVER derived from a QOR ID / username.
 * A keypair is generated from a random seed, stored encrypted (PBKDF2 + AES-GCM)
 * under the user's password, and must be explicitly unlocked before signing.
 */

import { hexToU8a } from '@polkadot/util';
import { WalletNotUnlockedError } from './wallet-errors';

// Dynamic imports for WASM module
let init: any;
let sign_message: any;
let get_address_from_keypair: any;
let generate_random_keypair: any;

let wasmInitialized = false;
let wasmModule: any = null;

/**
 * Load WASM module functions dynamically
 * Returns false if module is not available (non-blocking)
 */
async function loadWasmModule(): Promise<boolean> {
  if (init && generate_random_keypair && sign_message && get_address_from_keypair) {
    return true; // Already loaded
  }

  // Only try to load in browser environment
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // Try importing from the built package (dynamic import to avoid build-time resolution)
    // Use string concatenation to prevent TypeScript from statically analyzing the import
    const wasmModule = await import('@demiurge/' + 'wallet-wasm').catch(() => null);
    if (wasmModule) {
      init = wasmModule.default;
      sign_message = wasmModule.sign_message;
      get_address_from_keypair = wasmModule.get_address_from_keypair;
      generate_random_keypair = wasmModule.generate_random_keypair;
      return true;
    }
  } catch (error) {
    // Silently fail - module not available
  }

  try {
    // Fallback: try loading from relative path (for development)
    // Use string concatenation to prevent TypeScript from statically analyzing the import
    const wasmPath = '../../packages/wallet-wasm/pkg/wallet_wasm';
    const wasmModule = await import(wasmPath as any).catch(() => null);
    if (wasmModule) {
      init = wasmModule.default;
      sign_message = wasmModule.sign_message;
      get_address_from_keypair = wasmModule.get_address_from_keypair;
      generate_random_keypair = wasmModule.generate_random_keypair;
      return true;
    }
  } catch (fallbackError) {
    // Silently fail - module not available
  }

  return false;
}

/**
 * Initialize WASM module
 * Returns false if WASM is not available (non-blocking)
 */
export async function initWasm(): Promise<boolean> {
  if (wasmInitialized && wasmModule) {
    return true;
  }

  // Try to load WASM module functions first
  const loaded = await loadWasmModule();
  if (!loaded || !init) {
    return false; // WASM module not available, but don't throw error
  }

  try {
    // Try to load WASM binary from public directory
    try {
      const wasmModulePath = '/pkg/wallet_wasm_bg.wasm';
      const wasmModuleResponse = await fetch(wasmModulePath);
      
      if (wasmModuleResponse.ok) {
        const wasmBytes = await wasmModuleResponse.arrayBuffer();
        wasmModule = await init(wasmBytes);
      } else {
        // Fallback: try direct initialization
        wasmModule = await init();
      }
    } catch (fetchError) {
      // Final fallback: try direct initialization (may not work in all environments)
      try {
        wasmModule = await init();
      } catch (directError) {
        // WASM not available, return false instead of throwing
        return false;
      }
    }
    
    wasmInitialized = true;
    return true;
  } catch (error) {
    // WASM not available, return false instead of throwing
    return false;
  }
}

/**
 * Generate a brand-new keypair from a random seed (never from a username).
 *
 * @returns Keypair JSON string
 */
export async function generateRandomKeypair(): Promise<string> {
  const initialized = await initWasm();
  if (!initialized || !generate_random_keypair) {
    throw new Error('WASM wallet module not available. Please ensure the wallet-wasm package is built.');
  }
  try {
    return generate_random_keypair();
  } catch (error) {
    console.error('Failed to generate keypair:', error);
    throw new Error('Failed to generate keypair');
  }
}

// ---------------------------------------------------------------------------
// Unlock session: the decrypted keypair JSON lives in memory only after an
// explicit unlock and is discarded on lock.
// ---------------------------------------------------------------------------

let unlockedKeypairJson: string | null = null;
let unlockedQorId: string | null = null;

/** True if an encrypted WASM keypair exists in this browser for the QOR ID. */
export function hasStoredKeypair(qorId: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`wasm_keypair_${qorId}`) !== null;
}

/**
 * Create a new random keypair for the user, store it encrypted under
 * `password`, and unlock it for this session.
 */
export async function createWasmWallet(qorId: string, password: string): Promise<{ keypairJson: string; publicKeyHex: string }> {
  if (!password) throw new Error('Wallet password is required');
  const keypairJson = await generateRandomKeypair();
  await storeKeypair(qorId, keypairJson, password);
  unlockedKeypairJson = keypairJson;
  unlockedQorId = qorId;
  const publicKeyHex = await getPublicKeyHex(keypairJson);
  return { keypairJson, publicKeyHex };
}

/**
 * Decrypt the stored keypair with `password` and keep it in memory for signing.
 * Throws WalletNotUnlocked if no encrypted keypair exists for this QOR ID.
 */
export async function unlockWasmWallet(qorId: string, password: string): Promise<string> {
  const keypairJson = await loadKeypair(qorId, password);
  if (!keypairJson) {
    throw new WalletNotUnlockedError('WalletNotUnlocked: no local wallet exists for this QOR ID; create one first');
  }
  unlockedKeypairJson = keypairJson;
  unlockedQorId = qorId;
  return keypairJson;
}

/** Discard the in-memory keypair. */
export function lockWasmWallet(): void {
  unlockedKeypairJson = null;
  unlockedQorId = null;
}

/** True if a keypair is unlocked (optionally: for the given QOR ID). */
export function isWasmWalletUnlocked(qorId?: string): boolean {
  if (!unlockedKeypairJson) return false;
  return qorId ? unlockedQorId === qorId : true;
}

/**
 * Keypair JSON for signing. Throws WalletNotUnlocked when nothing is unlocked
 * (or the unlocked wallet belongs to a different QOR ID).
 */
export async function getUnlockedKeypair(qorId?: string): Promise<string> {
  if (!unlockedKeypairJson || (qorId && unlockedQorId !== qorId)) {
    throw new WalletNotUnlockedError();
  }
  return unlockedKeypairJson;
}

/**
 * Get public key hex from keypair JSON
 * 
 * @param keypairJson Keypair JSON string
 * @returns Public key as hex string
 */
export async function getPublicKeyHex(keypairJson: string): Promise<string> {
  const initialized = await initWasm();
  if (!initialized) {
    throw new Error('WASM wallet module not available.');
  }
  
  try {
    return get_address_from_keypair(keypairJson);
  } catch (error) {
    console.error('Failed to get public key:', error);
    throw new Error('Failed to extract public key');
  }
}

/**
 * Sign a message with keypair
 * 
 * @param keypairJson Keypair JSON string
 * @param message Message bytes to sign
 * @returns Signature as hex string
 */
export async function signMessage(
  keypairJson: string,
  message: Uint8Array
): Promise<string> {
  const initialized = await initWasm();
  if (!initialized) {
    throw new Error('WASM wallet module not available.');
  }
  
  try {
    return sign_message(keypairJson, message);
  } catch (error) {
    console.error('Failed to sign message:', error);
    throw new Error('Failed to sign message');
  }
}

/**
 * Sign a transaction payload for Polkadot.js API
 * 
 * This creates a signature compatible with Substrate transaction signing
 * 
 * @param keypairJson Keypair JSON string
 * @param payload Transaction payload bytes
 * @returns Signature as hex string (64 bytes)
 */
export async function signTransactionPayload(
  keypairJson: string,
  payload: Uint8Array
): Promise<string> {
  const initialized = await initWasm();
  if (!initialized) {
    throw new Error('WASM wallet module not available.');
  }
  
  try {
    // Sign the payload
    const signatureHex = sign_message(keypairJson, payload);
    
    // Ensure signature is 64 bytes (128 hex chars)
    const signatureBytes = hexToU8a(signatureHex);
    if (signatureBytes.length !== 64) {
      throw new Error(`Invalid signature length: ${signatureBytes.length}, expected 64`);
    }
    
    return signatureHex;
  } catch (error) {
    console.error('Failed to sign transaction payload:', error);
    throw new Error('Failed to sign transaction');
  }
}

/**
 * Create a custom signer for Polkadot.js API
 * 
 * This allows using WASM signing with Polkadot.js API
 */
export function createWasmSigner(keypairJson: string) {
  return {
    sign: async (payload: { data: Uint8Array }): Promise<{ signature: string }> => {
      const signature = await signTransactionPayload(keypairJson, payload.data);
      return { signature };
    }
  };
}

/**
 * Store keypair securely in localStorage (encrypted)
 * 
 * @param qorId QOR ID
 * @param keypairJson Keypair JSON string
 * @param password Encryption password
 */
export async function storeKeypair(
  qorId: string,
  keypairJson: string,
  password: string
): Promise<void> {
  const storageKey = `wasm_keypair_${qorId}`;

  // Derive encryption key from password using PBKDF2
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  const aesKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // Encrypt the keypair JSON
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    enc.encode(keypairJson)
  );

  // Store salt + iv + ciphertext as base64
  const payload = new Uint8Array(salt.length + iv.length + new Uint8Array(ciphertext).length);
  payload.set(salt, 0);
  payload.set(iv, salt.length);
  payload.set(new Uint8Array(ciphertext), salt.length + iv.length);

  localStorage.setItem(storageKey, btoa(String.fromCharCode(...payload)));
}

/**
 * Load stored keypair from localStorage
 * 
 * @param qorId QOR ID
 * @param password Decryption password
 * @returns Keypair JSON string
 */
export async function loadKeypair(
  qorId: string,
  password: string
): Promise<string | null> {
  const storageKey = `wasm_keypair_${qorId}`;
  const stored = localStorage.getItem(storageKey);
  
  if (!stored) {
    // No wallet: never fall back to deriving one from the QOR ID.
    return null;
  }

  try {
    // Decode base64 payload
    const raw = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
    const salt = raw.slice(0, 16);
    const iv = raw.slice(16, 28);
    const ciphertext = raw.slice(28);

    // Derive decryption key
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
    );
    const aesKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      ciphertext
    );

    return new TextDecoder().decode(plaintext);
  } catch {
    // Wrong password or corrupted/legacy (unencrypted) payload. Legacy plaintext
    // keypairs were username-derived and are intentionally not honoured.
    return null;
  }
}

/**
 * Check if WASM wallet is initialized
 */
export function isWasmInitialized(): boolean {
  return wasmInitialized && wasmModule !== null;
}
