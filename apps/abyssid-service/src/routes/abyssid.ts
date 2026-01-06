import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getDb } from '../db.js';
import { deriveDemiurgeKey } from '../crypto/keyDerivation.js';
import {
  RegisterRequestSchema,
  SessionInitRequestSchema,
  SessionConfirmRequestSchema,
  UsernameSchema,
} from '../types.js';

const router: Router = Router();
const challenges = new Map<string, { username: string; expiresAt: Date }>();

// Helper functions for session management (exported for use in other routes)
export function getSessionId(req: any): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export function getUserIdFromSession(sessionId: string): number | null {
  const db = getDb();
  const session = db.prepare(`
    SELECT user_id FROM abyssid_sessions
    WHERE id = ? AND expires_at > datetime('now')
  `).get(sessionId) as { user_id: number } | undefined;
  
  return session?.user_id ?? null;
}

// Check username availability
router.get('/username-available', (req, res) => {
  try {
    const username = UsernameSchema.parse(req.query.username);
    const db = getDb();
    
    const user = db.prepare('SELECT id FROM abyssid_users WHERE username = ?').get(username.toLowerCase());
    
    if (user) {
      return res.json({ available: false });
    }
    
    res.json({ available: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } });
    }
    console.error('Username availability check error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to check username availability' } });
  }
});

// Register new AbyssID
router.post('/register', async (req, res) => {
  try {
    const { username, publicKey } = RegisterRequestSchema.parse(req.body);
    const db = getDb();
    const normalizedUsername = username.toLowerCase();
    
    // Check if username already exists
    const existing = db.prepare('SELECT id FROM abyssid_users WHERE username = ?').get(normalizedUsername);
    if (existing) {
      return res.status(409).json({ error: { code: 'USERNAME_TAKEN', message: 'Username already taken' } });
    }
    
    // Insert new user
    const result = db.prepare(`
      INSERT INTO abyssid_users (username, public_key, created_at)
      VALUES (?, ?, datetime('now'))
    `).run(normalizedUsername, publicKey);
    
    const userId = result.lastInsertRowid;
    
    // Also insert into keys table
    db.prepare(`
      INSERT INTO abyssid_keys (user_id, public_key, label, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(userId, publicKey, 'primary');
    
    // Initialize user storage (500GB quota)
    db.prepare(`
      INSERT INTO user_storage (user_id, total_quota_bytes, used_bytes)
      VALUES (?, 536870912000, 0)
    `).run(userId);
    
    // Initialize wallet (CGT will be minted on-chain)
    db.prepare(`
      INSERT INTO user_wallet_balances (user_id, cgt_balance, cgt_minted, has_minted_nft)
      VALUES (?, 0.0, 0, 0)
    `).run(userId);
    
    // Mint 5000 CGT on-chain for new user
    try {
      const demiurgePublicKey = deriveDemiurgeKey(publicKey);
      const mintAmount = 5000 * 100000000; // 5000 CGT in smallest units (8 decimals)
      const addressHex = Array.from(demiurgePublicKey).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Call RPC to mint CGT (using dev faucet method if available, or direct mint)
      const rpcUrl = process.env.DEMIURGE_RPC_URL || 'https://rpc.demiurge.cloud/rpc';
      const mintResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'cgt_faucet', // Use faucet method for new users
          params: {
            address: addressHex,
          },
          id: Date.now(),
        }),
      });
      
      if (mintResponse.ok) {
        const jsonResponse = await mintResponse.json();
        const mintResult = jsonResponse as { result?: string | number };
        if (mintResult && typeof mintResult === 'object' && mintResult.result !== undefined) {
          // Update wallet record
          const balance = Number(mintResult.result) / 100000000; // Convert from smallest units
          db.prepare(`
            UPDATE user_wallet_balances 
            SET cgt_balance = ?, cgt_minted = 1
            WHERE user_id = ?
          `).run(balance, userId);
        }
      }
    } catch (mintError) {
      console.error('Failed to mint CGT on-chain for new user:', mintError);
      // Continue registration even if minting fails (can be retried later)
    }
    
    res.json({
      userId,
      username: normalizedUsername,
      publicKey,
      createdAt: new Date().toISOString(),
      cgtGift: 5000.0,
      storageQuota: '500GB',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to register user' } });
  }
});

// Initialize session (get challenge)
router.post('/session/init', (req, res) => {
  try {
    const { username } = SessionInitRequestSchema.parse(req.body);
    const db = getDb();
    const normalizedUsername = username.toLowerCase();
    
    // Check if user exists
    const user = db.prepare('SELECT id FROM abyssid_users WHERE username = ?').get(normalizedUsername) as { id: number } | undefined;
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }
    
    // Generate challenge
    const challengeId = randomUUID();
    const challenge = randomUUID(); // In production, use a proper nonce
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    challenges.set(challengeId, { username: normalizedUsername, expiresAt });
    
    res.json({
      challengeId,
      challenge,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } });
    }
    console.error('Session init error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to initialize session' } });
  }
});

// Confirm session (verify signature and create session)
router.post('/session/confirm', (req, res) => {
  try {
    const { challengeId, username, publicKey, signature } = SessionConfirmRequestSchema.parse(req.body);
    const db = getDb();
    const normalizedUsername = username.toLowerCase();
    
    // Verify challenge
    const challenge = challenges.get(challengeId);
    if (!challenge) {
      return res.status(400).json({ error: { code: 'INVALID_CHALLENGE', message: 'Invalid or expired challenge' } });
    }
    
    if (challenge.expiresAt < new Date()) {
      challenges.delete(challengeId);
      return res.status(400).json({ error: { code: 'CHALLENGE_EXPIRED', message: 'Challenge expired' } });
    }
    
    if (challenge.username !== normalizedUsername) {
      return res.status(400).json({ error: { code: 'USERNAME_MISMATCH', message: 'Username mismatch' } });
    }
    
    // Get user
    const user = db.prepare('SELECT * FROM abyssid_users WHERE username = ?').get(normalizedUsername) as any;
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }
    
    // TODO: Verify signature cryptographically
    // For now, accept any non-empty signature
    if (!signature || signature.length === 0) {
      return res.status(400).json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid signature' } });
    }
    
    // Create session
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    db.prepare(`
      INSERT INTO abyssid_sessions (id, user_id, created_at, expires_at)
      VALUES (?, ?, datetime('now'), ?)
    `).run(sessionId, user.id, expiresAt.toISOString());
    
    // Update last login
    db.prepare('UPDATE abyssid_users SET last_login_at = datetime("now") WHERE id = ?').run(user.id);
    
    // Clean up challenge
    challenges.delete(challengeId);
    
    res.json({
      sessionId,
      user: {
        id: user.id,
        username: user.username,
        publicKey: user.public_key,
        avatarUrl: user.avatar_url,
        displayName: user.display_name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } });
    }
    console.error('Session confirm error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to confirm session' } });
  }
});

// Get current user (requires auth)
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } });
    }
    
    const sessionId = authHeader.substring(7);
    const db = getDb();
    
    // Get session
    const session = db.prepare(`
      SELECT s.*, u.*
      FROM abyssid_sessions s
      JOIN abyssid_users u ON s.user_id = u.id
      WHERE s.id = ? AND s.expires_at > datetime('now')
    `).get(sessionId) as any;
    
    if (!session) {
      return res.status(401).json({ error: { code: 'INVALID_SESSION', message: 'Invalid or expired session' } });
    }
    
    // Get user's keys
    const keys = db.prepare('SELECT public_key, label FROM abyssid_keys WHERE user_id = ?').all(session.user_id) as Array<{ public_key: string; label: string | null }>;
    
    // Get basic stats
    const assetCount = db.prepare('SELECT COUNT(*) as count FROM drc369_assets WHERE owner_user_id = ?').get(session.user_id) as { count: number };
    
    res.json({
      id: session.id,
      username: session.username,
      publicKey: session.public_key,
      avatarUrl: session.avatar_url,
      displayName: session.display_name,
      createdAt: session.created_at,
      lastLoginAt: session.last_login_at,
      keys: keys.map(k => ({ publicKey: k.public_key, label: k.label })),
      stats: {
        assetCount: assetCount.count,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get user info' } });
  }
});

// Get wallet balance
router.get('/wallet/balance', (req, res) => {
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
    
    // Initialize wallet if it doesn't exist
    const existing = db.prepare('SELECT user_id FROM user_wallet_balances WHERE user_id = ?').get(userId);
    if (!existing) {
      db.prepare(`
        INSERT INTO user_wallet_balances (user_id, cgt_balance)
        VALUES (?, 5000.0)
      `).run(userId);
    }
    
    const wallet = db.prepare('SELECT cgt_balance FROM user_wallet_balances WHERE user_id = ?').get(userId) as {
      cgt_balance: number;
    } | undefined;
    
    if (!wallet) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Wallet not initialized' } });
    }
    
    res.json({ balance: wallet.cgt_balance });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get wallet balance' } });
  }
});

export default router;

