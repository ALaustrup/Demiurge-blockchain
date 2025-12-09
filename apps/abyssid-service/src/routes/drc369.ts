import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getDb } from '../db.js';
import { DRC369NativeRequestSchema, DRC369ImportRequestSchema } from '../types.js';
import { mintDrc369OnChain } from '../crypto/chainSigner.js';
import { getChainInfo } from '../rpc.js';

const router: Router = Router();

// Middleware to extract session from auth header
function getSessionId(req: any): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

function getUserIdFromSession(sessionId: string): number | null {
  const db = getDb();
  const session = db.prepare(`
    SELECT user_id FROM abyssid_sessions
    WHERE id = ? AND expires_at > datetime('now')
  `).get(sessionId) as { user_id: number } | undefined;
  
  return session?.user_id ?? null;
}

// Get owned assets
router.get('/assets/owned', (req, res) => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    
    const userId = getUserIdFromSession(sessionId);
    if (!userId) {
      return res.status(401).json({ error: { code: 'INVALID_SESSION', message: 'Invalid or expired session' } });
    }
    
    const username = req.query.username as string | undefined;
    const chain = req.query.chain as string | undefined;
    const standard = req.query.standard as string | undefined;
    
    const db = getDb();
    
    let query = 'SELECT * FROM drc369_assets WHERE owner_user_id = ?';
    const params: any[] = [userId];
    
    if (username) {
      // If username is provided, get that user's ID
      const user = db.prepare('SELECT id FROM abyssid_users WHERE username = ?').get(username.toLowerCase()) as { id: number } | undefined;
      if (user) {
        query = 'SELECT * FROM drc369_assets WHERE owner_user_id = ?';
        params[0] = user.id;
      } else {
        return res.json([]);
      }
    }
    
    if (chain) {
      query += ' AND origin_chain = ?';
      params.push(chain);
    }
    
    if (standard) {
      query += ' AND standard = ?';
      params.push(standard);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const assets = db.prepare(query).all(...params) as any[];
    
    res.json(assets.map(asset => ({
      id: asset.id,
      chain: asset.origin_chain,
      standard: asset.standard,
      owner: asset.owner_user_id, // In production, resolve to username/address
      name: asset.name,
      description: asset.description,
      uri: asset.uri,
      contentType: asset.metadata ? JSON.parse(asset.metadata).contentType : null,
      bridgeWrapped: asset.wrapped === 1,
      attributes: asset.metadata ? JSON.parse(asset.metadata) : {},
      createdAt: asset.created_at,
      onChain: (asset.on_chain ?? 0) === 1,
      txHash: asset.tx_hash || undefined,
      blockHeight: asset.block_height || undefined,
    })));
  } catch (error) {
    console.error('Get owned assets error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get owned assets' } });
  }
});

// Get network/public assets
router.get('/assets/network', (req, res) => {
  try {
    const chain = req.query.chain as string | undefined;
    const standard = req.query.standard as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    
    const db = getDb();
    
    let query = 'SELECT * FROM drc369_assets WHERE 1=1';
    const params: any[] = [];
    
    if (chain) {
      query += ' AND origin_chain = ?';
      params.push(chain);
    }
    
    if (standard) {
      query += ' AND standard = ?';
      params.push(standard);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    
    const assets = db.prepare(query).all(...params) as any[];
    
    res.json(assets.map(asset => ({
      id: asset.id,
      chain: asset.origin_chain,
      standard: asset.standard,
      owner: asset.owner_user_id, // In production, resolve to username/address
      name: asset.name,
      description: asset.description,
      uri: asset.uri,
      contentType: asset.metadata ? JSON.parse(asset.metadata).contentType : null,
      bridgeWrapped: asset.wrapped === 1,
      attributes: asset.metadata ? JSON.parse(asset.metadata) : {},
      createdAt: asset.created_at,
      onChain: (asset.on_chain ?? 0) === 1,
      txHash: asset.tx_hash || undefined,
      blockHeight: asset.block_height || undefined,
    })));
  } catch (error) {
    console.error('Get network assets error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get network assets' } });
  }
});

// Mint native DRC-369 asset
router.post('/assets/native', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    
    const userId = getUserIdFromSession(sessionId);
    if (!userId) {
      return res.status(401).json({ error: { code: 'INVALID_SESSION', message: 'Invalid or expired session' } });
    }
    
    const data = DRC369NativeRequestSchema.parse(req.body);
    const db = getDb();
    
    // Get user for chain signing
    const user = db.prepare('SELECT id, username, public_key FROM abyssid_users WHERE id = ?').get(userId) as {
      id: number;
      username: string;
      public_key: string;
    } | undefined;
    
    if (!user) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }
    
    // Mint on-chain
    let chainResult: { txHash: string; assetId: string; onChain: boolean } | null = null;
    let blockHeight: number | null = null;
    
    try {
      // Prepare asset data for on-chain minting
      const mintAsset = {
        title: data.name,
        ipfsHash: data.uri, // For now, use URI as IPFS hash placeholder
        description: data.description,
        metadata: data.metadata,
      };
      
      // Mint on Demiurge chain
      chainResult = await mintDrc369OnChain(user, mintAsset);
      
      // Get current chain height
      try {
        const chainInfo = await getChainInfo();
        blockHeight = chainInfo.height;
      } catch {
        // Chain info fetch failed, but mint succeeded
        console.warn('Failed to fetch chain height after mint');
      }
    } catch (chainError: any) {
      // Chain minting failed - log but continue with local storage
      console.error('On-chain minting failed, storing locally only:', chainError);
      // Continue to store in database without on-chain flag
    }
    
    // Use chain-provided asset ID if available, otherwise generate one
    const assetId = chainResult?.assetId || `drc369:${randomUUID()}`;
    const metadata = JSON.stringify({
      contentType: data.contentType,
      ...data.metadata,
    });
    
    // Insert into database
    db.prepare(`
      INSERT INTO drc369_assets (
        id, owner_user_id, origin_chain, standard, name, description, uri, metadata, wrapped, 
        on_chain, tx_hash, block_height, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      assetId,
      userId,
      data.originChain || 'DEMIURGE',
      data.standard || 'DRC-369',
      data.name,
      data.description || null,
      data.uri,
      metadata,
      chainResult ? 1 : 0, // on_chain flag
      chainResult?.txHash || null,
      blockHeight,
    );
    
    // Create event
    db.prepare(`
      INSERT INTO drc369_events (asset_id, event_type, to_user_id, event_data, created_at)
      VALUES (?, 'MINT', ?, ?, datetime('now'))
    `).run(
      assetId,
      userId,
      chainResult ? JSON.stringify({ txHash: chainResult.txHash, blockHeight }) : null,
    );
    
    // Mark user as having minted/swapped an NFT (allows CGT sending)
    db.prepare(`
      UPDATE user_wallet_balances 
      SET has_minted_nft = 1 
      WHERE user_id = ?
    `).run(userId);
    
    res.json({
      id: assetId,
      chain: data.originChain || 'DEMIURGE',
      standard: data.standard || 'DRC-369',
      owner: userId,
      name: data.name,
      description: data.description,
      uri: data.uri,
      contentType: data.contentType,
      bridgeWrapped: false,
      attributes: data.metadata || {},
      createdAt: new Date().toISOString(),
      onChain: chainResult !== null,
      txHash: chainResult?.txHash,
      blockHeight: blockHeight,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } });
    }
    console.error('Mint native asset error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to mint asset' } });
  }
});

// Import external asset
router.post('/assets/import', (req, res) => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    
    const userId = getUserIdFromSession(sessionId);
    if (!userId) {
      return res.status(401).json({ error: { code: 'INVALID_SESSION', message: 'Invalid or expired session' } });
    }
    
    const data = DRC369ImportRequestSchema.parse(req.body);
    const db = getDb();
    
    const assetId = `external:${data.originChain}:${data.externalId}`;
    
    // Check if already imported
    const existing = db.prepare('SELECT id FROM drc369_assets WHERE id = ?').get(assetId) as { id: string } | undefined;
    if (existing) {
      const asset = db.prepare('SELECT * FROM drc369_assets WHERE id = ?').get(assetId) as any;
      return res.json({
        id: asset.id,
        chain: asset.origin_chain,
        standard: asset.standard,
        owner: asset.owner_user_id,
        name: asset.name,
        description: asset.description,
        uri: asset.uri,
        contentType: asset.metadata ? JSON.parse(asset.metadata).contentType : null,
        bridgeWrapped: true,
        attributes: asset.metadata ? JSON.parse(asset.metadata) : {},
        createdAt: asset.created_at,
      });
    }
    
    const metadata = JSON.stringify({
      contentType: 'other',
      externalId: data.externalId,
      ...data.metadata,
    });
    
    db.prepare(`
      INSERT INTO drc369_assets (
        id, owner_user_id, origin_chain, standard, name, description, uri, metadata, wrapped, raw_payload, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))
    `).run(
      assetId,
      userId,
      data.originChain,
      data.standard,
      data.name || null,
      data.description || null,
      data.uri || null,
      metadata,
      data.rawPayload ? JSON.stringify(data.rawPayload) : null,
    );
    
    // Create event
    db.prepare(`
      INSERT INTO drc369_events (asset_id, event_type, to_user_id, created_at)
      VALUES (?, 'IMPORT', ?, datetime('now'))
    `).run(assetId, userId);
    
    res.json({
      id: assetId,
      chain: data.originChain,
      standard: data.standard,
      owner: userId,
      name: data.name,
      description: data.description,
      uri: data.uri,
      contentType: 'other',
      bridgeWrapped: true,
      attributes: data.metadata || {},
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } });
    }
    console.error('Import asset error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to import asset' } });
  }
});

// Transfer DRC-369 asset
router.post('/assets/transfer', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    
    const userId = getUserIdFromSession(sessionId);
    if (!userId) {
      return res.status(401).json({ error: { code: 'INVALID_SESSION', message: 'Invalid or expired session' } });
    }
    
    const { assetId, toUserId, toUsername } = req.body;
    
    if (!assetId) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'assetId is required' } });
    }
    
    if (!toUserId && !toUsername) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'toUserId or toUsername is required' } });
    }
    
    const db = getDb();
    
    // Get asset
    const asset = db.prepare('SELECT * FROM drc369_assets WHERE id = ?').get(assetId) as any;
    if (!asset) {
      return res.status(404).json({ error: { code: 'ASSET_NOT_FOUND', message: 'Asset not found' } });
    }
    
    // Verify ownership
    if (asset.owner_user_id !== userId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not the owner of this asset' } });
    }
    
    // Get recipient user ID
    let recipientUserId: number;
    if (toUserId) {
      recipientUserId = toUserId;
    } else {
      const recipient = db.prepare('SELECT id FROM abyssid_users WHERE username = ?').get(toUsername.toLowerCase()) as { id: number } | undefined;
      if (!recipient) {
        return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'Recipient user not found' } });
      }
      recipientUserId = recipient.id;
    }
    
    // Update asset owner
    db.prepare(`
      UPDATE drc369_assets 
      SET owner_user_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(recipientUserId, assetId);
    
    // Create transfer event
    db.prepare(`
      INSERT INTO drc369_events (asset_id, event_type, from_user_id, to_user_id, created_at)
      VALUES (?, 'TRANSFER', ?, ?, datetime('now'))
    `).run(assetId, userId, recipientUserId);
    
    // Get updated asset
    const updatedAsset = db.prepare('SELECT * FROM drc369_assets WHERE id = ?').get(assetId) as any;
    
    res.json({
      id: updatedAsset.id,
      chain: updatedAsset.origin_chain,
      standard: updatedAsset.standard,
      owner: updatedAsset.owner_user_id,
      name: updatedAsset.name,
      description: updatedAsset.description,
      uri: updatedAsset.uri,
      contentType: updatedAsset.metadata ? JSON.parse(updatedAsset.metadata).contentType : null,
      bridgeWrapped: updatedAsset.wrapped === 1,
      attributes: updatedAsset.metadata ? JSON.parse(updatedAsset.metadata) : {},
      createdAt: updatedAsset.created_at,
      onChain: (updatedAsset.on_chain ?? 0) === 1,
      txHash: updatedAsset.tx_hash || undefined,
      blockHeight: updatedAsset.block_height || undefined,
    });
  } catch (error) {
    console.error('Transfer asset error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to transfer asset' } });
  }
});

// Burn DRC-369 asset
router.post('/assets/burn', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    
    const userId = getUserIdFromSession(sessionId);
    if (!userId) {
      return res.status(401).json({ error: { code: 'INVALID_SESSION', message: 'Invalid or expired session' } });
    }
    
    const { assetId } = req.body;
    
    if (!assetId) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'assetId is required' } });
    }
    
    const db = getDb();
    
    // Get asset
    const asset = db.prepare('SELECT * FROM drc369_assets WHERE id = ?').get(assetId) as any;
    if (!asset) {
      return res.status(404).json({ error: { code: 'ASSET_NOT_FOUND', message: 'Asset not found' } });
    }
    
    // Verify ownership
    if (asset.owner_user_id !== userId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not the owner of this asset' } });
    }
    
    // Create burn event
    db.prepare(`
      INSERT INTO drc369_events (asset_id, event_type, from_user_id, event_data, created_at)
      VALUES (?, 'BURN', ?, ?, datetime('now'))
    `).run(assetId, userId, JSON.stringify({ burnedAt: new Date().toISOString() }));
    
    // Delete asset (or mark as burned - for now we'll delete)
    db.prepare('DELETE FROM drc369_assets WHERE id = ?').run(assetId);
    
    res.json({
      success: true,
      assetId,
      message: 'Asset burned successfully',
    });
  } catch (error) {
    console.error('Burn asset error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to burn asset' } });
  }
});

// Get asset provenance (transfer history)
router.get('/assets/:assetId/provenance', (req, res) => {
  try {
    const { assetId } = req.params;
    const db = getDb();
    
    const events = db.prepare(`
      SELECT e.*, 
        u1.username as from_username, u1.public_key as from_public_key,
        u2.username as to_username, u2.public_key as to_public_key
      FROM drc369_events e
      LEFT JOIN abyssid_users u1 ON e.from_user_id = u1.id
      LEFT JOIN abyssid_users u2 ON e.to_user_id = u2.id
      WHERE e.asset_id = ?
      ORDER BY e.created_at ASC
    `).all(assetId) as any[];
    
    res.json(events.map(event => ({
      id: event.id,
      eventType: event.event_type,
      fromUserId: event.from_user_id,
      fromUsername: event.from_username,
      fromPublicKey: event.from_public_key,
      toUserId: event.to_user_id,
      toUsername: event.to_username,
      toPublicKey: event.to_public_key,
      eventData: event.event_data ? JSON.parse(event.event_data) : null,
      createdAt: event.created_at,
    })));
  } catch (error) {
    console.error('Get provenance error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get provenance' } });
  }
});

export default router;

