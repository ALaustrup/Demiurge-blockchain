import express, { type Request, type Response } from 'express';
import { getDb } from '../db.js';
import { getSessionId, getUserIdFromSession } from './abyssid.js';
import { deriveDemiurgeKeypair } from '../crypto/keyDerivation.js';

const router: express.Router = express.Router();

const RPC_URL = process.env.DEMIURGE_RPC_URL || 'https://rpc.demiurge.cloud/rpc';

/**
 * Check on-chain NFT ownership for a Demiurge address
 */
async function checkOnChainNftOwnership(demiurgeAddress: string): Promise<boolean> {
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'cgt_getNftsByOwner',
        params: { address: demiurgeAddress },
        id: Date.now(),
      }),
    });

    if (!response.ok) {
      console.error('RPC call failed:', response.statusText);
      return false;
    }

    const json = await response.json() as { error?: any; result?: { nfts?: any[] } };
    if (json.error) {
      console.error('RPC error:', json.error);
      return false;
    }

    const nfts = json.result?.nfts || [];
    return nfts.length > 0;
  } catch (error) {
    console.error('Failed to check on-chain NFT ownership:', error);
    return false;
  }
}

/**
 * Sync NFT mint status from on-chain data
 */
async function syncNftMintStatus(userId: number, demiurgeAddress: string, db: any): Promise<boolean> {
  const hasNftsOnChain = await checkOnChainNftOwnership(demiurgeAddress);
  
  if (hasNftsOnChain) {
    // Update database flag
    db.prepare(`
      UPDATE user_wallet_balances 
      SET has_minted_nft = 1 
      WHERE user_id = ?
    `).run(userId);
    
    // Also ensure wallet exists
    const wallet = db.prepare('SELECT user_id FROM user_wallet_balances WHERE user_id = ?').get(userId);
    if (!wallet) {
      db.prepare(`
        INSERT INTO user_wallet_balances (user_id, cgt_balance, cgt_minted, has_minted_nft)
        VALUES (?, 0.0, 0, 1)
      `).run(userId);
    }
    
    return true;
  }
  
  return false;
}

// Check if user can send CGT (must have minted/swapped an NFT)
router.get('/can-send', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    
    const userId = getUserIdFromSession(sessionId);
    if (!userId) {
      return res.status(401).json({ error: { code: 'INVALID_SESSION', message: 'Invalid or expired session' } });
    }
    
    const db = getDb();
    
    // Get user's AbyssID public key
    const user = db.prepare('SELECT public_key FROM abyssid_users WHERE id = ?').get(userId) as {
      public_key: string;
    } | undefined;
    
    if (!user) {
      return res.json({ canSend: false, reason: 'User not found' });
    }
    
    // Derive Demiurge address from AbyssID public key
    const { publicKey } = deriveDemiurgeKeypair(user.public_key);
    const demiurgeAddress = Array.from(publicKey).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Check database flag first (fast path)
    const wallet = db.prepare('SELECT has_minted_nft FROM user_wallet_balances WHERE user_id = ?').get(userId) as {
      has_minted_nft: number;
    } | undefined;
    
    let canSend = wallet?.has_minted_nft === 1;
    
    // If database says no, check on-chain directly (real-time sync)
    if (!canSend) {
      const hasNftsOnChain = await checkOnChainNftOwnership(demiurgeAddress);
      
      if (hasNftsOnChain) {
        // Sync database with on-chain state
        await syncNftMintStatus(userId, demiurgeAddress, db);
        canSend = true;
      }
    }
    
    res.json({ 
      canSend,
      reason: canSend ? null : 'You must mint or swap a DRC-369 NFT before sending CGT',
    });
  } catch (error) {
    console.error('Check can send error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to check send permission' } });
  }
});

// Sync NFT mint status from on-chain data
router.post('/sync-nft-status', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    
    const userId = getUserIdFromSession(sessionId);
    if (!userId) {
      return res.status(401).json({ error: { code: 'INVALID_SESSION', message: 'Invalid or expired session' } });
    }
    
    const db = getDb();
    
    // Get user's AbyssID public key
    const user = db.prepare('SELECT public_key FROM abyssid_users WHERE id = ?').get(userId) as {
      public_key: string;
    } | undefined;
    
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }
    
    // Derive Demiurge address
    const { publicKey } = deriveDemiurgeKeypair(user.public_key);
    const demiurgeAddress = Array.from(publicKey).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Sync from on-chain
    const hasNfts = await syncNftMintStatus(userId, demiurgeAddress, db);
    
    res.json({ 
      success: true,
      hasMintedNft: hasNfts,
      message: hasNfts ? 'NFT mint status synced from chain' : 'No NFTs found on-chain',
    });
  } catch (error) {
    console.error('Sync NFT status error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to sync NFT status' } });
  }
});

export default router;

