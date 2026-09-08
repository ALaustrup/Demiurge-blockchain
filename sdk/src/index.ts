/**
 * @demiurge/sdk - TypeScript SDK for the Demiurge Protocol
 * 
 * The Demiurge Protocol is a next-generation blockchain featuring:
 * - DRC-369: Dynamic NFT standard with soulbound tokens, nesting, and delegation
 * - CVP: Consensus-Verified Polymorphism for real-time security
 * - CGT: Native utility token (Cogito)
 */

// Core exports
export { DemiurgeClient, type DemiurgeClientOptions } from './client';
export { DRC369, type TokenInfo, type DynamicState } from './drc369';
export { CVP, type CvpStatus } from './cvp';
export { Wallet, type KeyPair } from './wallet';
export { 
  DemiurgeAuth, 
  createTestWallet,
  type AuthSession, 
  type DemiurgeAuthOptions,
  type RegistrationResult,
} from './auth';

// Types
export * from './types';

// Utilities
export { hexToBytes, bytesToHex, encodeTransaction } from './utils';

// Version
export const VERSION = '1.0.0';
