import express, { type Request, type Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { getDb } from '../db.js';
import { getSessionId, getUserIdFromSession } from './abyssid.js';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { mintDrc369OnChain } from '../crypto/chainSigner.js';
import { getChainInfo } from '../rpc.js';

const router: express.Router = express.Router();

const STORAGE_BASE_PATH = process.env.STORAGE_PATH || join(process.cwd(), 'data', 'user-storage');
const STORAGE_QUOTA_BYTES = 536870912000; // 500GB in bytes

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024, // 10GB max file size
  },
});

// Ensure storage directory exists
async function ensureStorageDir() {
  await fs.mkdir(STORAGE_BASE_PATH, { recursive: true });
}

// Initialize user storage quota
function initUserStorage(userId: number) {
  const db = getDb();
  const existing = db.prepare('SELECT user_id FROM user_storage WHERE user_id = ?').get(userId);
  if (!existing) {
    db.prepare(`
      INSERT INTO user_storage (user_id, total_quota_bytes, used_bytes)
      VALUES (?, ?, 0)
    `).run(userId, STORAGE_QUOTA_BYTES);
  }
}

// Initialize user wallet balance
function initUserWallet(userId: number) {
  const db = getDb();
  const existing = db.prepare('SELECT user_id FROM user_wallet_balances WHERE user_id = ?').get(userId);
  if (!existing) {
    db.prepare(`
      INSERT INTO user_wallet_balances (user_id, cgt_balance)
      VALUES (?, 5000.0)
    `).run(userId);
  }
}

// Get user storage info
router.get('/info', async (req, res) => {
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
    initUserStorage(userId);
    
    const storage = db.prepare('SELECT * FROM user_storage WHERE user_id = ?').get(userId) as {
      user_id: number;
      total_quota_bytes: number;
      used_bytes: number;
    } | undefined;
    
    if (!storage) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Storage not initialized' } });
    }
    
    res.json({
      userId,
      totalQuotaBytes: storage.total_quota_bytes,
      usedBytes: storage.used_bytes,
      availableBytes: storage.total_quota_bytes - storage.used_bytes,
      quotaPercent: (storage.used_bytes / storage.total_quota_bytes) * 100,
    });
  } catch (error) {
    console.error('Get storage info error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get storage info' } });
  }
});

// Upload file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    await ensureStorageDir();
    
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    
    const userId = getUserIdFromSession(sessionId);
    if (!userId) {
      return res.status(401).json({ error: { code: 'INVALID_SESSION', message: 'Invalid or expired session' } });
    }
    
    const db = getDb();
    initUserStorage(userId);
    
    // Check storage quota
    const storage = db.prepare('SELECT * FROM user_storage WHERE user_id = ?').get(userId) as {
      total_quota_bytes: number;
      used_bytes: number;
    };
    
    // Get file from multer
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: { code: 'NO_FILE', message: 'No file provided' } });
    }
    
    const fileSize = file.size || (file.buffer ? file.buffer.length : 0);
    
    if (storage.used_bytes + fileSize > storage.total_quota_bytes) {
      return res.status(413).json({ 
        error: { 
          code: 'QUOTA_EXCEEDED', 
          message: `Storage quota exceeded. Available: ${(storage.total_quota_bytes - storage.used_bytes) / 1024 / 1024 / 1024}GB` 
        } 
      });
    }
    
    // Generate file ID and path
    const fileId = randomUUID();
    const userDir = join(STORAGE_BASE_PATH, userId.toString());
    await fs.mkdir(userDir, { recursive: true });
    const filePath = join(userDir, fileId);
    
    // Save file
    const fileBuffer = file.buffer || Buffer.from([]);
    await fs.writeFile(filePath, fileBuffer);
    
    // Calculate file hash
    const fileHash = createHash('sha256').update(fileBuffer).digest('hex');
    
    // Insert file record
    const fileRecord = {
      id: fileId,
      user_id: userId,
      filename: fileId,
      original_filename: file.originalname || file.filename || 'untitled',
      file_path: filePath,
      file_size: fileSize,
      mime_type: file.mimetype || 'application/octet-stream',
      file_hash: fileHash,
    };
    
    db.prepare(`
      INSERT INTO user_files (
        id, user_id, filename, original_filename, file_path, file_size, mime_type, file_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      fileRecord.id,
      fileRecord.user_id,
      fileRecord.filename,
      fileRecord.original_filename,
      fileRecord.file_path,
      fileRecord.file_size,
      fileRecord.mime_type,
      fileRecord.file_hash,
    );
    
    // Update storage usage
    db.prepare(`
      UPDATE user_storage 
      SET used_bytes = used_bytes + ?, updated_at = datetime('now')
      WHERE user_id = ?
    `).run(fileSize, userId);
    
    // Auto-mint as DRC-369 NFT
    try {
      const user = db.prepare('SELECT public_key FROM abyssid_users WHERE id = ?').get(userId) as { public_key: string } | undefined;
      if (user) {
        const assetName = fileRecord.original_filename.replace(/\.[^/.]+$/, '');
        const contentType = fileRecord.mime_type.startsWith('image/') ? 'image' :
                           fileRecord.mime_type.startsWith('video/') ? 'video' :
                           fileRecord.mime_type.startsWith('audio/') ? 'audio' : 'other';
        
        const mintAsset = {
          title: assetName,
          ipfsHash: `abyss://storage/${userId}/${fileId}`, // Use Abyss storage URI
          description: `Uploaded file: ${fileRecord.original_filename}`,
          metadata: {
            originalFilename: fileRecord.original_filename,
            fileSize: fileSize,
            mimeType: fileRecord.mime_type,
            fileHash: fileHash,
          },
        };
        
        const chainResult = await mintDrc369OnChain(
          { public_key: user.public_key },
          mintAsset
        );
        
        const chainInfo = await getChainInfo();
        const blockHeight = chainInfo.height;
        
        // Create DRC-369 asset record
        const assetId = chainResult.assetId || `drc369:${fileId}`;
        db.prepare(`
          INSERT INTO drc369_assets (
            id, owner_user_id, origin_chain, standard, name, description, uri, metadata,
            on_chain, tx_hash, block_height
          ) VALUES (?, ?, 'DEMIURGE', 'DRC-369', ?, ?, ?, ?, 1, ?, ?)
        `).run(
          assetId,
          userId,
          assetName,
          mintAsset.description,
          mintAsset.ipfsHash,
          JSON.stringify(mintAsset.metadata),
          chainResult.txHash,
          blockHeight,
        );
        
        // Link file to DRC-369 asset
        db.prepare('UPDATE user_files SET drc369_asset_id = ? WHERE id = ?').run(assetId, fileId);
        
        // Mark user as having minted/swapped an NFT (allows CGT sending)
        db.prepare(`
          UPDATE user_wallet_balances 
          SET has_minted_nft = 1 
          WHERE user_id = ?
        `).run(userId);
        
        res.json({
          fileId,
          filename: fileRecord.original_filename,
          size: fileSize,
          mimeType: fileRecord.mime_type,
          hash: fileHash,
          drc369AssetId: assetId,
          txHash: chainResult.txHash,
          blockHeight,
          uri: mintAsset.ipfsHash,
        });
      } else {
        res.json({
          fileId,
          filename: fileRecord.original_filename,
          size: fileSize,
          mimeType: fileRecord.mime_type,
          hash: fileHash,
          drc369AssetId: null,
          message: 'File uploaded but minting failed (user not found)',
        });
      }
    } catch (mintError) {
      console.error('Auto-mint failed:', mintError);
      res.json({
        fileId,
        filename: fileRecord.original_filename,
        size: fileSize,
        mimeType: fileRecord.mime_type,
        hash: fileHash,
        drc369AssetId: null,
        message: 'File uploaded but minting failed',
      });
    }
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to upload file' } });
  }
});

// List user files
router.get('/files', async (req, res) => {
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
    const files = db.prepare(`
      SELECT id, original_filename, file_size, mime_type, file_hash, drc369_asset_id, created_at
      FROM user_files
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId) as Array<{
      id: string;
      original_filename: string;
      file_size: number;
      mime_type: string;
      file_hash: string;
      drc369_asset_id: string | null;
      created_at: string;
    }>;
    
    res.json({ files });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list files' } });
  }
});

// Download file
router.get('/files/:fileId', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    
    const userId = getUserIdFromSession(sessionId);
    if (!userId) {
      return res.status(401).json({ error: { code: 'INVALID_SESSION', message: 'Invalid or expired session' } });
    }
    
    const { fileId } = req.params;
    const db = getDb();
    
    const file = db.prepare('SELECT * FROM user_files WHERE id = ? AND user_id = ?').get(fileId, userId) as {
      file_path: string;
      original_filename: string;
      mime_type: string;
    } | undefined;
    
    if (!file) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'File not found' } });
    }
    
    const fileData = await fs.readFile(file.file_path);
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_filename}"`);
    res.send(fileData);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to download file' } });
  }
});

export default router;

