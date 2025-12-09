import { Router } from 'express';
import { getDb } from '../db';
import { getSessionId, getUserIdFromSession } from './abyssid';

const router = Router();

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
    const wallet = db.prepare('SELECT has_minted_nft FROM user_wallet_balances WHERE user_id = ?').get(userId) as {
      has_minted_nft: number;
    } | undefined;
    
    if (!wallet) {
      return res.json({ canSend: false, reason: 'Wallet not initialized' });
    }
    
    const canSend = wallet.has_minted_nft === 1;
    
    res.json({ 
      canSend,
      reason: canSend ? null : 'You must mint or swap a DRC-369 NFT before sending CGT',
    });
  } catch (error) {
    console.error('Check can send error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to check send permission' } });
  }
});

export default router;

