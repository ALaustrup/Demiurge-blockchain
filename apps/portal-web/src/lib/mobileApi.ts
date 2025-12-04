/**
 * Mobile-Oriented API Surface (Pocket Studio API)
 * 
 * This module provides clean, composable functions that a mobile client
 * (like the future Demiurge Pocket Studio app) would consume.
 * 
 * All functions are designed to be:
 * - Composable and reusable
 * - Mobile-friendly (async, error-handled)
 * - Consistent with existing SDK patterns
 */

import { callRpc, getCgtBalance, formatCgt, getUrgeIdProfile, getNftsByOwner, buildTransferTx, sendRawTransaction, signTransactionRpc, getNonce } from "./rpc";
import { graphqlQuery, graphqlRequest } from "./graphql";
import { signTransaction } from "./signing";

// ============================================================================
// Auth / Identity
// ============================================================================

export interface LocalWallet {
  address: string;
  privateKey: string;
  username?: string;
}

/**
 * Load wallet from localStorage
 */
export async function loadLocalWallet(): Promise<LocalWallet | null> {
  if (typeof window === "undefined") return null;
  
  const address = localStorage.getItem("demiurge_urgeid_wallet_address") || localStorage.getItem("demiurge_address");
  const privateKey = localStorage.getItem("demiurge_urgeid_private_key") || localStorage.getItem("demiurge_private_key");
  
  if (!address || !privateKey) return null;
  
  return { address, privateKey };
}

/**
 * Save wallet to localStorage
 */
export function saveLocalWallet(wallet: LocalWallet): void {
  if (typeof window === "undefined") return;
  
  localStorage.setItem("demiurge_urgeid_wallet_address", wallet.address);
  localStorage.setItem("demiurge_urgeid_private_key", wallet.privateKey);
  if (wallet.username) {
    localStorage.setItem("demiurge_urgeid_username", wallet.username);
  }
}

/**
 * Create a new UrgeID (offline keygen)
 */
export async function createUrgeId(): Promise<LocalWallet> {
  const ed25519 = await import("@noble/ed25519");
  const privateKeyBytes = ed25519.utils.randomSecretKey();
  const publicKeyBytes = await ed25519.getPublicKeyAsync(privateKeyBytes);
  
  // Derive address (simplified - use actual SDK method)
  const address = "0x" + Array.from(publicKeyBytes.slice(0, 32))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  const privateKeyHex = "0x" + Array.from(privateKeyBytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  return { address, privateKey: privateKeyHex };
}

/**
 * Login with existing UrgeID (address or handle)
 */
export async function loginWithUrgeId(identifier: string): Promise<LocalWallet | null> {
  // If it's an address, try to load from storage
  if (identifier.startsWith("0x")) {
    const wallet = await loadLocalWallet();
    if (wallet && wallet.address === identifier) {
      return wallet;
    }
  }
  
  // If it's a username, resolve to address first
  // TODO: Implement username resolution
  return null;
}

// ============================================================================
// Profile / Progress
// ============================================================================

export interface MyProfile {
  address: string;
  username?: string;
  displayName?: string;
  level: number;
  syzygyScore: number;
  badges: string[];
}

export interface MyProgress {
  level: number;
  syzygyScore: number;
  progressRatio: number;
  nextLevelThreshold: number;
}

/**
 * Get current user's profile
 */
export async function getMyProfile(address: string): Promise<MyProfile | null> {
  try {
    const profile = await getUrgeIdProfile(address);
    if (!profile) {
      return null;
    }
    return {
      address: profile.address,
      username: profile.username || undefined,
      displayName: profile.display_name || undefined,
      level: profile.level,
      syzygyScore: profile.syzygy_score,
      badges: profile.badges || [],
    };
  } catch (error) {
    console.error("Failed to get profile:", error);
    return null;
  }
}

/**
 * Get current user's progress (Syzygy, level, XP)
 */
export async function getMyProgress(address: string): Promise<MyProgress | null> {
  try {
    const progress = await callRpc<any>("urgeid_getProgress", { address });
    return {
      level: progress.level || 0,
      syzygyScore: progress.syzygy_score || 0,
      progressRatio: progress.progress_ratio || 0,
      nextLevelThreshold: progress.next_level_threshold || 100,
    };
  } catch (error) {
    console.error("Failed to get progress:", error);
    return null;
  }
}

/**
 * Get current user's developer profile (if registered)
 */
export async function getMyDeveloperProfile(address: string): Promise<any | null> {
  try {
    const query = `
      query {
        developer(address: "${address}") {
          address
          username
          reputation
          createdAt
        }
      }
    `;
    const data = await graphqlQuery(query);
    return data?.data?.developer || null;
  } catch (error) {
    console.error("Failed to get developer profile:", error);
    return null;
  }
}

// ============================================================================
// Economy
// ============================================================================

/**
 * Get current user's CGT balance
 */
export async function getMyBalance(address: string): Promise<string> {
  try {
    const balance = await getCgtBalance(address);
    return formatCgt(balance.balance);
  } catch (error) {
    console.error("Failed to get balance:", error);
    return "0.00000000";
  }
}

/**
 * Send CGT to another user (by handle or address)
 */
export async function sendCgt(params: {
  from: string;
  toHandleOrAddress: string;
  amount: number;
  privateKey: string;
}): Promise<string> {
  try {
    // Resolve handle to address if needed
    let toAddress = params.toHandleOrAddress;
    if (!toAddress.startsWith("0x")) {
      // Assume it's a username, resolve it
      const resolved = await callRpc<string>("urgeid_resolveUsername", { username: toAddress });
      if (!resolved) {
        throw new Error(`Username @${toAddress} not found`);
      }
      toAddress = resolved;
    }
    
    // Get nonce and build transaction
    const { nonce } = await getNonce(params.from);
    // Convert amount to smallest unit (assuming 8 decimals)
    const amountSmallest = Math.floor(params.amount * 100000000).toString();
    const { tx_hex } = await buildTransferTx(params.from, toAddress, amountSmallest, nonce);
    
    // Sign transaction
    const txBytes = new Uint8Array(tx_hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const signatureHex = await signTransaction(txBytes, params.privateKey);
    const { tx_hex: signedTxHex } = await signTransactionRpc(tx_hex, signatureHex);
    
    // Send transaction
    const result = await sendRawTransaction(signedTxHex);
    return result.tx_hash;
  } catch (error: any) {
    throw new Error(`Failed to send CGT: ${error.message}`);
  }
}

/**
 * Get current user's NFTs
 */
export async function getMyNfts(address: string): Promise<any[]> {
  try {
    const result = await getNftsByOwner(address);
    return result.nfts || [];
  } catch (error) {
    console.error("Failed to get NFTs:", error);
    return [];
  }
}

// ============================================================================
// Dev Registry
// ============================================================================

/**
 * Get current user's projects
 */
export async function getMyProjects(address: string): Promise<any[]> {
  try {
    const devProfile = await getMyDeveloperProfile(address);
    if (!devProfile) return [];
    
    // Get all projects and filter by maintainer
    const query = `
      query {
        projects {
          slug
          name
          description
          maintainers {
            address
          }
        }
      }
    `;
    const data = await graphqlQuery(query);
    const projects = data?.data?.projects || [];
    
    return projects.filter((p: any) => 
      p.maintainers.some((m: any) => m.address === address)
    );
  } catch (error) {
    console.error("Failed to get projects:", error);
    return [];
  }
}

/**
 * Create a new project
 */
export async function createProject(params: {
  slug: string;
  name: string;
  description?: string;
  address: string;
}): Promise<any> {
  try {
    const mutation = `
      mutation {
        createProject(
          slug: "${params.slug}"
          name: "${params.name}"
          description: ${params.description ? `"${params.description}"` : "null"}
        ) {
          slug
          name
          description
        }
      }
    `;
    const data = await graphqlQuery(mutation, { "x-demiurge-address": params.address });
    return data?.data?.createProject;
  } catch (error: any) {
    throw new Error(`Failed to create project: ${error.message}`);
  }
}

/**
 * Get projects for a developer (by username)
 */
export async function getDeveloperProjects(username: string): Promise<any[]> {
  try {
    const query = `
      query {
        developer(username: "${username}") {
          address
        }
        projects {
          slug
          name
          description
          maintainers {
            address
            username
          }
        }
      }
    `;
    const data = await graphqlQuery(query);
    const dev = data?.data?.developer;
    if (!dev) return [];
    
    const projects = data?.data?.projects || [];
    return projects.filter((p: any) => 
      p.maintainers.some((m: any) => m.address === dev.address)
    );
  } catch (error) {
    console.error("Failed to get developer projects:", error);
    return [];
  }
}

// ============================================================================
// Chat (via GraphQL)
// ============================================================================

/**
 * Get world chat messages
 */
export async function getWorldChatMessages(limit: number = 50): Promise<any[]> {
  try {
    const query = `
      query {
        worldChatMessages(limit: ${limit}) {
          id
          content
          sender {
            username
            address
          }
          createdAt
        }
      }
    `;
    const data = await graphqlQuery(query);
    return data?.data?.worldChatMessages || [];
  } catch (error) {
    console.error("Failed to get world chat:", error);
    return [];
  }
}

/**
 * Send a world chat message
 */
export async function sendWorldMessage(params: {
  content: string;
  address: string;
  username?: string;
}): Promise<any> {
  try {
    const mutation = `
      mutation {
        sendWorldMessage(content: "${params.content}") {
          id
          content
          createdAt
        }
      }
    `;
    const headers: Record<string, string> = { "x-demiurge-address": params.address };
    if (params.username) {
      headers["x-demiurge-username"] = params.username;
    }
    const data = await graphqlQuery(mutation, headers);
    return data?.data?.sendWorldMessage;
  } catch (error: any) {
    throw new Error(`Failed to send message: ${error.message}`);
  }
}

/**
 * Get DM rooms
 */
export async function getDmRooms(address: string): Promise<any[]> {
  try {
    const query = `
      query {
        dmRooms {
          id
          members {
            username
            address
          }
          lastMessage {
            content
            createdAt
          }
        }
      }
    `;
    const data = await graphqlQuery(query, { "x-demiurge-address": address });
    return data?.data?.dmRooms || [];
  } catch (error) {
    console.error("Failed to get DM rooms:", error);
    return [];
  }
}

/**
 * Send a DM
 */
export async function sendDm(params: {
  toHandleOrUrgeId: string;
  content: string;
  address: string;
  username?: string;
}): Promise<any> {
  try {
    const mutation = `
      mutation {
        sendDirectMessage(toUsername: "${params.toHandleOrUrgeId}", content: "${params.content}") {
          id
          content
          createdAt
        }
      }
    `;
    const headers: Record<string, string> = { "x-demiurge-address": params.address };
    if (params.username) {
      headers["x-demiurge-username"] = params.username;
    }
    const data = await graphqlQuery(mutation, headers);
    return data?.data?.sendDirectMessage;
  } catch (error: any) {
    throw new Error(`Failed to send DM: ${error.message}`);
  }
}

