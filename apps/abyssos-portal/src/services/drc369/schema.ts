/**
 * DRC-369 (Demiurge Resource Contract, Standard 369)
 * 
 * Universal NFT schema supporting native Demiurge NFTs and multi-chain imports.
 * Replaces the legacy "DemiNFT" / "DGEN-NFT" concept.
 */

export type DRC369Chain =
  | "DEMIURGE"
  | "ETH"
  | "POLYGON"
  | "BSC"
  | "SOL"
  | "BTC"
  | "TON"
  | string;

export type DRC369Standard =
  | "DRC-369"
  | "ERC-721"
  | "ERC-1155"
  | "SPL"
  | "ORDINAL"
  | "ARC-3"
  | string;

export type DRC369ContentType =
  | "image"
  | "video"
  | "audio"
  | "model"
  | "html-app"
  | "binary"
  | "dns-record"
  | "awe-world"
  | "other";

export interface DRC369 {
  id: string;              // internal UUID, or deterministic hash
  chain: DRC369Chain;
  standard: DRC369Standard;

  owner: string;           // AbyssID or external wallet address
  creator?: string;
  supply?: number;         // 1 for NFT, >1 for semi-fungible

  uri: string;             // IPFS / Arweave / HTTP / Mycelia / Fabric
  contentType: DRC369ContentType;

  bridgeWrapped?: boolean; // true if imported from another chain
  originalChain?: string;
  originalContract?: string;
  originalTokenId?: string;

  attributes?: Record<string, string | number>;
  unlockables?: {
    encrypted: boolean;
    accessRequires?: number; // CGT amount required, optional
  };

  // Legacy compatibility fields (for migration from PublishedFile)
  name?: string;
  description?: string;
  mediaUrl?: string;
  fileId?: string;
  priceCgt?: number;
  createdAt?: string;
  
  // On-chain fields
  onChain?: boolean;       // true if minted on-chain
  txHash?: string;         // Transaction hash
  blockHeight?: number;    // Block height when minted
  
  // DRC-369 v2 fields
  royalties?: number;      // Royalty percentage (0-20%)
  provenance?: Array<{     // Ownership lineage
    owner: string;
    txHash: string;
    timestamp: number;
    blockHeight?: number;
  }>;
  transfers?: Array<{      // Transfer history
    from: string;
    to: string;
    txHash: string;
    blockHeight: number;
    timestamp: number;
  }>;
  burned?: boolean;        // True if asset has been burned
  metadata?: {             // Extended metadata
    mime?: string;
    dimensions?: { width: number; height: number };
    duration?: number;     // For video/audio
    extra?: Record<string, any>;
  };
  
  // Music-specific fields (for contentType === "audio")
  music?: {
    trackNumber?: number;
    trackName: string;
    albumName?: string;
    artistName: string;
    genre?: string;
    releaseDate?: string;
    duration: number;      // in seconds
    fractal1Hash?: string; // SHA-256 hash of fractal-1 encoded audio
    beatmapHash?: string;  // SHA-256 hash of beatmap data
    segmentRoot?: string;  // Merkle root of segment table
  };
}

export function isDRC369(obj: any): obj is DRC369 {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.chain === "string" &&
    typeof obj.standard === "string"
  );
}

/**
 * Legacy type alias for backward compatibility
 * @deprecated Use DRC369 instead
 */
export type DemiNft = DRC369;

/**
 * Legacy type alias for backward compatibility
 * @deprecated Use DRC369['id'] instead
 */
export type DemiNftId = string;

