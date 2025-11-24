/**
 * Type definitions for Demiurge Blockchain entities
 */

export type Address = string; // 64-char hex string (32 bytes)

export type CgtMetadata = {
  name: string;
  symbol: string;
  decimals: number;
  maxSupply: string;
  totalSupply: string;
};

export type CgtBalance = {
  balance: string; // u128 as string
};

export type UrgeIDProfile = {
  address: string;
  display_name: string;
  bio?: string | null;
  handle?: string | null;
  username?: string | null;
  level: number;
  syzygy_score: number;
  total_cgt_earned_from_rewards: string;
  badges: string[];
  created_at_height?: number | null;
};

export type UrgeIDProgress = {
  address: string;
  level: number;
  syzygyScore: number;
  currentLevelThreshold: number;
  nextLevelThreshold: number;
  progressRatio: number;
  totalCgtEarnedFromRewards: string;
};

export type UserAnalytics = {
  totalTransactions: number;
  totalCgtSent: string;
  totalCgtReceived: string;
  nftCount: number;
  listingsCreated: number;
  listingsSold: number;
};

export type DGenMetadata = {
  id: number;
  owner: Address;
  creator: Address;
  fabric_root_hash: string;
  royalty_bps?: number;
  name?: string;
  description?: string;
};

export type Listing = {
  id: number;
  nft_id: number;
  seller: Address;
  price: string; // CGT in smallest units
  created_at: number;
  status: 'active' | 'sold' | 'cancelled';
};

export type Transaction = {
  hash: string;
  from: Address;
  to: Address;
  amount?: string;
  nonce: number;
  payload: string;
  signature?: string;
};

export type ChainInfo = {
  height: number;
  block_hash: string;
};

export type RpcError = {
  code: number;
  message: string;
  data?: any;
};

export type RpcResponse<T> = {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: RpcError;
};

