/**
 * QOR ID Wallet Integration Service
 *
 * Links blockchain addresses to QOR ID accounts and manages wallet operations.
 *
 * SECURITY (Phase 0): keys are NEVER derived from a QOR ID / username. Signing
 * keys come only from the user's encrypted local keystore (`lib/wallet.ts`,
 * random mnemonic, password-encrypted) after an explicit unlock. Display
 * addresses come only from the authenticated profile (`on_chain.address`).
 */

import { qorAuth, User } from '@demiurge/qor-sdk';
import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { cryptoWaitReady, mnemonicGenerate } from '@polkadot/util-crypto';
import axios from 'axios';
import { createStoredWallet, hasStoredWallet, loadStoredWalletMnemonic } from './wallet';
import { WalletNotLinkedError, WalletNotUnlockedError } from './wallet-errors';

export { WalletNotLinkedError, WalletNotUnlockedError } from './wallet-errors';

// Get default API URL (same logic as qor-sdk)
function getDefaultApiUrl(): string {
  if (process.env.NEXT_PUBLIC_QOR_AUTH_URL) {
    return process.env.NEXT_PUBLIC_QOR_AUTH_URL;
  }
  return 'http://localhost:8080/api/v1';
}

/**
 * Link blockchain address to QOR ID account via API
 */
export async function linkAddressToQorId(address: string): Promise<void> {
  const apiUrl = getDefaultApiUrl();
  const token = qorAuth.getToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  try {
    await axios.post(
      `${apiUrl}/profile/link-wallet`,
      { address },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Authentication required');
    }
    throw new Error(error.response?.data?.message || 'Failed to link address');
  }
}

// ---------------------------------------------------------------------------
// Display addresses (from the authenticated profile only)
// ---------------------------------------------------------------------------

/**
 * Address linked to the user's QOR ID, or null if none is linked.
 */
export function getLinkedAddress(user: User | null | undefined): string | null {
  if (!user) return null;
  return user.on_chain?.address || user.on_chain_address || null;
}

/**
 * Address linked to the user's QOR ID; throws WalletNotLinked if none.
 */
export function requireLinkedAddress(user: User | null | undefined): string {
  const address = getLinkedAddress(user);
  if (!address) {
    throw new WalletNotLinkedError();
  }
  return address;
}

/**
 * Get the blockchain address linked to a QOR ID account.
 *
 * Phase 0: this no longer *creates* (derives) an address. It returns the
 * address from the authenticated profile or throws WalletNotLinked. Link a
 * real wallet address via `linkAddressToQorId` after creating a local wallet.
 *
 * @deprecated Use `requireLinkedAddress(user)` / `getLinkedAddress(user)`.
 */
export async function getOrCreateAddressForQorId(
  user: User,
  _linkToAccount: boolean = true
): Promise<string> {
  return requireLinkedAddress(user);
}

// ---------------------------------------------------------------------------
// Signing keys (encrypted local keystore + explicit unlock)
// ---------------------------------------------------------------------------

let unlockedPair: KeyringPair | null = null;

async function makeKeyring(): Promise<Keyring> {
  await cryptoWaitReady();
  return new Keyring({ type: 'sr25519', ss58Format: 42 });
}

/** True if an encrypted wallet exists in this browser's local keystore. */
export function hasLocalWallet(): boolean {
  return hasStoredWallet();
}

/** True if a signing key is currently unlocked in memory. */
export function isWalletUnlocked(): boolean {
  return unlockedPair !== null;
}

/**
 * Create a new local wallet (random mnemonic, encrypted with `password`)
 * and unlock it. Returns the mnemonic for the user to back up.
 */
export async function createWallet(password: string): Promise<{ mnemonic: string; address: string }> {
  const mnemonic = await createStoredWallet(password);
  const pair = await unlockWallet(password);
  return { mnemonic, address: pair.address };
}

/**
 * Unlock the local wallet with its password. Decrypts the stored mnemonic and
 * keeps the derived keypair in memory until `lockWallet()`.
 */
export async function unlockWallet(password: string): Promise<KeyringPair> {
  if (!hasStoredWallet()) {
    throw new WalletNotUnlockedError('WalletNotUnlocked: no local wallet exists; create one first');
  }
  const mnemonic = await loadStoredWalletMnemonic(password);
  const keyring = await makeKeyring();
  unlockedPair = keyring.addFromMnemonic(mnemonic, { name: 'local' }, 'sr25519');
  return unlockedPair;
}

/** Forget the in-memory signing key. */
export function lockWallet(): void {
  if (unlockedPair) {
    try { unlockedPair.lock(); } catch { /* ignore */ }
  }
  unlockedPair = null;
}

/**
 * Keypair for signing. Throws WalletNotUnlocked when no wallet is unlocked.
 */
export function getUnlockedKeypair(): KeyringPair {
  if (!unlockedPair) {
    throw new WalletNotUnlockedError();
  }
  return unlockedPair;
}

/**
 * Generate a fresh random address (e.g. for a throwaway session key).
 * The private key is not retained.
 */
export async function generateRandomAddress(): Promise<string> {
  const keyring = await makeKeyring();
  return keyring.addFromMnemonic(mnemonicGenerate(), {}, 'sr25519').address;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check if QOR ID has a linked blockchain address
 */
export function hasLinkedAddress(user: User): boolean {
  return !!getLinkedAddress(user);
}

/**
 * Format QOR ID for display
 */
export function formatQorId(qorId: string): string {
  return qorId; // Already formatted as "username#0001"
}

/**
 * Extract username from QOR ID
 */
export function getUsernameFromQorId(qorId: string): string {
  const parts = qorId.split('#');
  return parts[0] || qorId;
}

/**
 * Extract discriminator from QOR ID
 */
export function getDiscriminatorFromQorId(qorId: string): string {
  const parts = qorId.split('#');
  return parts[1] || '0000';
}

/**
 * Multi-wallet support: Link multiple addresses to one QOR ID
 */

export interface LinkedWallet {
  address: string;
  label?: string;
  isPrimary: boolean;
  createdAt: number;
}

/**
 * Get all linked wallets for a QOR ID (currently: the profile's primary address).
 *
 * @param qorId QOR ID account (must be the authenticated user)
 * @returns Array of linked wallets (empty if none linked)
 */
export async function getLinkedWallets(qorId: string): Promise<LinkedWallet[]> {
  // TODO: Query QOR Auth API for linked wallets
  const user = await qorAuth.getProfile();
  if (user.qor_id !== qorId) return [];
  const primaryAddress = getLinkedAddress(user);
  if (!primaryAddress) return [];
  return [{
    address: primaryAddress,
    label: 'Primary Wallet',
    isPrimary: true,
    createdAt: Date.now(),
  }];
}

/**
 * Add a new wallet address to QOR ID account
 */
export async function addLinkedWallet(
  qorId: string,
  address: string,
  label?: string
): Promise<void> {
  // TODO: Call QOR Auth API to add linked wallet
  // await qorAuth.addLinkedWallet(address, label);
}

/**
 * Set a wallet as primary
 */
export async function setPrimaryWallet(qorId: string, address: string): Promise<void> {
  // TODO: Call QOR Auth API to set primary wallet
  // await qorAuth.setPrimaryWallet(address);
}

/**
 * Remove a linked wallet
 */
export async function removeLinkedWallet(qorId: string, address: string): Promise<void> {
  // TODO: Call QOR Auth API to remove linked wallet
  // await qorAuth.removeLinkedWallet(address);
}
