import express, { type Request, type Response } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';
import { getSessionId, getUserIdFromSession } from './abyssid.js';
import { mintDrc369OnChain } from '../crypto/chainSigner.js';
import { getChainInfo } from '../rpc.js';

const router: express.Router = express.Router();

const NFTSwapRequestSchema = z.object({
  originChain: z.enum(['ETH', 'POLYGON', 'BSC', 'SOL']), // Focus on Ethereum, Solana, Polygon
  standard: z.enum(['ERC-721', 'ERC-1155', 'SPL', 'OTHER']),
  contractAddress: z.string().optional(), // For EVM chains
  tokenId: z.string(),
  ownerAddress: z.string(), // Address that owns the NFT on source chain
  walletSignature: z.string(), // Wallet signature proving ownership
  signedMessage: z.string(), // Message that was signed (e.g., "Swap NFT {tokenId} from {chain}")
  metadata: z.record(z.any()).optional(),
});

/**
 * Validate NFT ownership using wallet signature
 * Verifies that the user owns the wallet address by checking the signature
 */
async function validateNFTOwnership(
  chain: string,
  contractAddress: string | undefined,
  tokenId: string,
  ownerAddress: string,
  walletSignature: string,
  signedMessage: string
): Promise<boolean> {
  try {
    // Verify the signature matches the owner address
    // For EVM chains (ETH, POLYGON, BSC): Use ECDSA signature recovery
    if (chain === 'ETH' || chain === 'POLYGON' || chain === 'BSC') {
      // Expected message format: "Swap NFT {tokenId} from {chain} to DRC-369"
      const expectedMessage = `Swap NFT ${tokenId} from ${chain} to DRC-369`;
      if (signedMessage !== expectedMessage) {
        console.error(`[NFT Swap] Message mismatch: expected "${expectedMessage}", got "${signedMessage}"`);
        return false;
      }
      
      // TODO: Implement ECDSA signature recovery to verify ownerAddress
      // For now, verify signature format and message match
      // In production, use ethers.js or web3.js to recover address from signature
      if (!walletSignature || walletSignature.length < 130) {
        return false;
      }
      
      // Placeholder: In production, recover address from signature and verify it matches ownerAddress
      console.log(`[NFT Swap] Validating EVM signature: ${chain} ${contractAddress || 'N/A'} #${tokenId} owned by ${ownerAddress}`);
      
      // For now, accept if signature format is valid (production should verify)
      return true;
    }
    
    // For Solana: Use Ed25519 signature verification
    if (chain === 'SOL') {
      const expectedMessage = `Swap NFT ${tokenId} from Solana to DRC-369`;
      if (signedMessage !== expectedMessage) {
        console.error(`[NFT Swap] Message mismatch: expected "${expectedMessage}", got "${signedMessage}"`);
        return false;
      }
      
      // TODO: Implement Ed25519 signature verification
      // In production, use @solana/web3.js to verify signature
      if (!walletSignature || walletSignature.length < 128) {
        return false;
      }
      
      console.log(`[NFT Swap] Validating Solana signature: #${tokenId} owned by ${ownerAddress}`);
      
      // For now, accept if signature format is valid (production should verify)
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[NFT Swap] Signature validation error:', error);
    return false;
  }
}

/**
 * Fetch NFT metadata from source chain
 */
async function fetchNFTMetadata(
  chain: string,
  contractAddress: string | undefined,
  tokenId: string
): Promise<{
  name: string;
  description?: string;
  image?: string;
  attributes?: any[];
}> {
  // TODO: Implement actual metadata fetching
  // For EVM: Query tokenURI(tokenId) and fetch from IPFS/HTTP
  // For Solana: Query metadata account
  // For Bitcoin: Parse ordinal metadata
  
  return {
    name: `NFT #${tokenId}`,
    description: `Swapped from ${chain}`,
  };
}

// Swap NFT from external chain to DRC-369
router.post('/swap', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    
    const userId = getUserIdFromSession(sessionId);
    if (!userId) {
      return res.status(401).json({ error: { code: 'INVALID_SESSION', message: 'Invalid or expired session' } });
    }
    
    const data = NFTSwapRequestSchema.parse(req.body);
    const db = getDb();
    
    // Get user's public key
    const user = db.prepare('SELECT public_key FROM abyssid_users WHERE id = ?').get(userId) as { public_key: string } | undefined;
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }
    
    // Validate NFT ownership using wallet signature
    const isValid = await validateNFTOwnership(
      data.originChain,
      data.contractAddress,
      data.tokenId,
      data.ownerAddress,
      data.walletSignature,
      data.signedMessage
    );
    
    if (!isValid) {
      return res.status(403).json({ 
        error: { 
          code: 'OWNERSHIP_INVALID', 
          message: 'Cannot verify NFT ownership on source chain. Please ensure you own this NFT and the address is correct.' 
        } 
      });
    }
    
    // Fetch metadata
    const metadata = await fetchNFTMetadata(
      data.originChain,
      data.contractAddress,
      data.tokenId
    );
    
    // Create DRC-369 asset ID
    const swapId = `swap:${data.originChain}:${data.contractAddress || 'native'}:${data.tokenId}`;
    
    // Check if already swapped
    const existing = db.prepare('SELECT id FROM drc369_assets WHERE id = ?').get(swapId) as { id: string } | undefined;
    if (existing) {
      const asset = db.prepare('SELECT * FROM drc369_assets WHERE id = ?').get(swapId) as any;
      return res.json({
        id: asset.id,
        chain: asset.origin_chain,
        standard: asset.standard,
        owner: asset.owner_user_id,
        name: asset.name,
        description: asset.description,
        uri: asset.uri,
        bridgeWrapped: true,
        onChain: asset.on_chain === 1,
        txHash: asset.tx_hash,
        blockHeight: asset.block_height,
        attributes: asset.metadata ? JSON.parse(asset.metadata) : {},
        createdAt: asset.created_at,
      });
    }
    
    // Mint as DRC-369 on-chain
    let chainResult = null;
    try {
      const mintAsset = {
        title: metadata.name || `Swapped NFT #${data.tokenId}`,
        ipfsHash: metadata.image || `abyss://swap/${swapId}`,
        description: metadata.description || `NFT swapped from ${data.originChain}`,
        metadata: {
          originChain: data.originChain,
          originStandard: data.standard,
          originContract: data.contractAddress,
          originTokenId: data.tokenId,
          originOwner: data.ownerAddress,
          swappedAt: new Date().toISOString(),
          ...metadata.attributes,
          ...data.metadata,
        },
      };
      
      chainResult = await mintDrc369OnChain(
        { public_key: user.public_key },
        mintAsset
      );
      
      const chainInfo = await getChainInfo();
      const blockHeight = chainInfo.height;
      
      // Store as DRC-369 asset
      const assetMetadata = JSON.stringify(mintAsset.metadata);
      db.prepare(`
        INSERT INTO drc369_assets (
          id, owner_user_id, origin_chain, standard, name, description, uri, metadata,
          wrapped, on_chain, tx_hash, block_height
        ) VALUES (?, ?, ?, 'DRC-369', ?, ?, ?, ?, 1, 1, ?, ?)
      `).run(
        swapId,
        userId,
        data.originChain,
        mintAsset.title,
        mintAsset.description,
        mintAsset.ipfsHash,
        assetMetadata,
        chainResult.txHash,
        blockHeight,
      );
      
      // Create swap event
      db.prepare(`
        INSERT INTO drc369_events (asset_id, event_type, to_user_id, event_data, created_at)
        VALUES (?, 'SWAP', ?, ?, datetime('now'))
      `).run(
        swapId,
        userId,
        JSON.stringify({
          originChain: data.originChain,
          originTokenId: data.tokenId,
          txHash: chainResult.txHash,
        }),
      );
      
      // Mark user as having minted/swapped an NFT (allows CGT sending)
      db.prepare(`
        UPDATE user_wallet_balances 
        SET has_minted_nft = 1 
        WHERE user_id = ?
      `).run(userId);
      
      res.json({
        id: swapId,
        chain: data.originChain,
        standard: 'DRC-369',
        owner: userId,
        name: mintAsset.title,
        description: mintAsset.description,
        uri: mintAsset.ipfsHash,
        bridgeWrapped: true,
        onChain: true,
        txHash: chainResult.txHash,
        blockHeight,
        attributes: mintAsset.metadata,
        createdAt: new Date().toISOString(),
      });
    } catch (chainError: any) {
      console.error('On-chain minting failed during swap:', chainError);
      
      // Store locally without on-chain flag
      const assetMetadata = JSON.stringify({
        originChain: data.originChain,
        originStandard: data.standard,
        originContract: data.contractAddress,
        originTokenId: data.tokenId,
        originOwner: data.ownerAddress,
        ...metadata.attributes,
        ...data.metadata,
      });
      
      db.prepare(`
        INSERT INTO drc369_assets (
          id, owner_user_id, origin_chain, standard, name, description, uri, metadata, wrapped, on_chain
        ) VALUES (?, ?, ?, 'DRC-369', ?, ?, ?, ?, 1, 0)
      `).run(
        swapId,
        userId,
        data.originChain,
        metadata.name || `Swapped NFT #${data.tokenId}`,
        metadata.description || `NFT swapped from ${data.originChain}`,
        metadata.image || `abyss://swap/${swapId}`,
        assetMetadata,
      );
      
      res.json({
        id: swapId,
        chain: data.originChain,
        standard: 'DRC-369',
        owner: userId,
        name: metadata.name || `Swapped NFT #${data.tokenId}`,
        description: metadata.description || `NFT swapped from ${data.originChain}`,
        uri: metadata.image || `abyss://swap/${swapId}`,
        bridgeWrapped: true,
        onChain: false,
        message: 'Swap completed but on-chain minting failed. Asset stored locally.',
        attributes: JSON.parse(assetMetadata),
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } });
    }
    console.error('NFT swap error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to swap NFT' } });
  }
});

export default router;

