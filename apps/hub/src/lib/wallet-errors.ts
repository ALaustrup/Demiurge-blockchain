/**
 * Wallet error types shared by the local keystore wallets.
 */

/** Thrown when a signing key is required but no wallet has been unlocked in this session. */
export class WalletNotUnlockedError extends Error {
  readonly code = 'WalletNotUnlocked';
  constructor(message = 'WalletNotUnlocked: unlock your wallet with its password before signing') {
    super(message);
    this.name = 'WalletNotUnlocked';
  }
}

/** Thrown when an on-chain address is required but the QOR ID has none linked. */
export class WalletNotLinkedError extends Error {
  readonly code = 'WalletNotLinked';
  constructor(message = 'WalletNotLinked: no on-chain address is linked to this QOR ID') {
    super(message);
    this.name = 'WalletNotLinked';
  }
}
