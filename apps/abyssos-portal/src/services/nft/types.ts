/**
 * DemiNFT (D-721) Type Definitions
 * 
 * Frontend model for Demiurge NFTs, designed to integrate with
 * on-chain file publishing and marketplace features.
 */

export type DemiNftId = string; // Format: "demi://nft/<txHash>#<index>" or similar

export interface DemiNft {
  id: DemiNftId;
  owner: string; // AbyssID username or address
  name: string;
  description?: string;
  mediaUrl?: string;
  fileId?: string; // Link to AbyssTorrent uploaded file
  createdAt: string; // ISO timestamp
  priceCgt?: number; // Optional listing price
  metadata?: {
    [key: string]: any;
  };
}

export interface PublishedFile {
  fileId: string; // SHA-256 hash
  title: string;
  description?: string;
  priceCgt: number;
  ownerPubKey: string;
  ownerUsername?: string;
  createdAt: string;
  mediaUrl?: string;
  nftId?: DemiNftId; // If minted as NFT
}

/**
 * Check if a published file can be minted as a DemiNFT
 */
export function canMintAsNft(file: PublishedFile): boolean {
  // For now, all published files can potentially be minted
  // In the future, this might check on-chain state
  return !!file.fileId && !!file.ownerPubKey;
}

/**
 * Generate a placeholder DemiNFT ID for a file
 * (In production, this would come from on-chain minting)
 */
export function generateNftIdForFile(fileId: string, ownerPubKey: string): DemiNftId {
  return `demi://nft/placeholder/${fileId.slice(0, 16)}#${ownerPubKey.slice(0, 8)}`;
}

