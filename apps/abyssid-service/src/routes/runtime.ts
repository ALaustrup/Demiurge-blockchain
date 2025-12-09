/**
 * Runtime/WASM Package Registry Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getDb } from '../db.js';
import { createHash } from 'crypto';

const router: Router = Router();

// Middleware
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

// Schema
const PackageUploadSchema = z.object({
  name: z.string().min(1).max(100),
  version: z.string().min(1).max(20),
  description: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
  wasmBytes: z.string(), // Base64 encoded WASM
});

// Upload WASM package
router.post('/packages/upload', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    
    const userId = getUserIdFromSession(sessionId);
    if (!userId) {
      return res.status(401).json({ error: { code: 'INVALID_SESSION', message: 'Invalid or expired session' } });
    }
    
    const data = PackageUploadSchema.parse(req.body);
    const db = getDb();
    
    // Decode WASM bytes
    const wasmBuffer = Buffer.from(data.wasmBytes, 'base64');
    const wasmHash = createHash('sha256').update(wasmBuffer).digest('hex');
    const wasmSize = wasmBuffer.length;
    
    // Generate package ID
    const packageId = `wasm:${data.name}:${data.version}:${wasmHash.slice(0, 16)}`;
    
    // Check if package already exists
    const existing = db.prepare('SELECT id FROM runtime_packages WHERE id = ?').get(packageId) as { id: string } | undefined;
    if (existing) {
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'Package already exists' } });
    }
    
    // Insert package
    db.prepare(`
      INSERT INTO runtime_packages (
        id, name, version, author_user_id, description, wasm_hash, wasm_size, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      packageId,
      data.name,
      data.version,
      userId,
      data.description || null,
      wasmHash,
      wasmSize,
      data.metadata ? JSON.stringify(data.metadata) : null,
    );
    
    res.status(201).json({
      id: packageId,
      name: data.name,
      version: data.version,
      authorUserId: userId,
      description: data.description,
      wasmHash,
      wasmSize,
      metadata: data.metadata || {},
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } });
    }
    console.error('Upload package error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to upload package' } });
  }
});

// List packages
router.get('/packages', (req, res) => {
  try {
    const authorUserId = req.query.authorUserId ? parseInt(req.query.authorUserId as string, 10) : undefined;
    const name = req.query.name as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    
    const db = getDb();
    
    let query = 'SELECT * FROM runtime_packages WHERE 1=1';
    const params: any[] = [];
    
    if (authorUserId) {
      query += ' AND author_user_id = ?';
      params.push(authorUserId);
    }
    
    if (name) {
      query += ' AND name LIKE ?';
      params.push(`%${name}%`);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    
    const packages = db.prepare(query).all(...params) as any[];
    
    res.json(packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      version: pkg.version,
      authorUserId: pkg.author_user_id,
      description: pkg.description,
      wasmHash: pkg.wasm_hash,
      wasmSize: pkg.wasm_size,
      metadata: pkg.metadata ? JSON.parse(pkg.metadata) : {},
      createdAt: pkg.created_at,
      updatedAt: pkg.updated_at,
    })));
  } catch (error) {
    console.error('List packages error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list packages' } });
  }
});

// Get package by ID
router.get('/packages/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    
    const pkg = db.prepare('SELECT * FROM runtime_packages WHERE id = ?').get(id) as any;
    
    if (!pkg) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Package not found' } });
    }
    
    res.json({
      id: pkg.id,
      name: pkg.name,
      version: pkg.version,
      authorUserId: pkg.author_user_id,
      description: pkg.description,
      wasmHash: pkg.wasm_hash,
      wasmSize: pkg.wasm_size,
      metadata: pkg.metadata ? JSON.parse(pkg.metadata) : {},
      createdAt: pkg.created_at,
      updatedAt: pkg.updated_at,
    });
  } catch (error) {
    console.error('Get package error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get package' } });
  }
});

// Submit WASM job for execution (creates receipt)
router.post('/execute', async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    
    const userId = getUserIdFromSession(sessionId);
    if (!userId) {
      return res.status(401).json({ error: { code: 'INVALID_SESSION', message: 'Invalid or expired session' } });
    }
    
    const { jobId, wasmModuleId, input, output, logs, executionTime, peerId } = req.body;
    
    if (!jobId || !wasmModuleId || !input || !output) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'jobId, wasmModuleId, input, and output are required' } });
    }
    
    const db = getDb();
    
    // Generate receipt
    const receiptId = `receipt:${randomUUID()}`;
    const inputHash = createHash('sha256').update(JSON.stringify(input)).digest('hex');
    const outputHash = createHash('sha256').update(JSON.stringify(output)).digest('hex');
    
    // Insert receipt
    db.prepare(`
      INSERT INTO execution_receipts (
        receipt_id, user_id, job_id, input_hash, output_hash, vm_logs,
        timestamp, peer_id, execution_time
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
    `).run(
      receiptId,
      userId,
      jobId,
      inputHash,
      outputHash,
      logs ? JSON.stringify(logs) : null,
      peerId || null,
      executionTime || null,
    );
    
    res.status(201).json({
      receiptId,
      jobId,
      inputHash,
      outputHash,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Submit execution error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create receipt' } });
  }
});

// List execution receipts
router.get('/receipts', (req, res) => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    
    const userId = getUserIdFromSession(sessionId);
    if (!userId) {
      return res.status(401).json({ error: { code: 'INVALID_SESSION', message: 'Invalid or expired session' } });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const db = getDb();
    
    const receipts = db.prepare(`
      SELECT * FROM execution_receipts
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(userId, limit) as any[];
    
    res.json(receipts.map(r => ({
      receiptId: r.receipt_id,
      jobId: r.job_id,
      inputHash: r.input_hash,
      outputHash: r.output_hash,
      logs: r.vm_logs ? JSON.parse(r.vm_logs) : [],
      timestamp: r.timestamp,
      blockHeight: r.block_height,
      peerId: r.peer_id,
      executionTime: r.execution_time,
    })));
  } catch (error) {
    console.error('List receipts error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list receipts' } });
  }
});

// Get single receipt
router.get('/receipts/:id', (req, res) => {
  try {
    const sessionId = getSessionId(req);
    if (!sessionId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    
    const userId = getUserIdFromSession(sessionId);
    if (!userId) {
      return res.status(401).json({ error: { code: 'INVALID_SESSION', message: 'Invalid or expired session' } });
    }
    
    const { id } = req.params;
    const db = getDb();
    
    const receipt = db.prepare(`
      SELECT * FROM execution_receipts
      WHERE receipt_id = ? AND user_id = ?
    `).get(id, userId) as any;
    
    if (!receipt) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Receipt not found' } });
    }
    
    res.json({
      receiptId: receipt.receipt_id,
      jobId: receipt.job_id,
      inputHash: receipt.input_hash,
      outputHash: receipt.output_hash,
      logs: receipt.vm_logs ? JSON.parse(receipt.vm_logs) : [],
      timestamp: receipt.timestamp,
      blockHeight: receipt.block_height,
      peerId: receipt.peer_id,
      executionTime: receipt.execution_time,
      merkleProof: receipt.merkle_proof,
    });
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get receipt' } });
  }
});

// Verify ZK proof
router.post('/verify-zk', async (req, res) => {
  try {
    const { proof, pubInputsRoot, outputRoot, jobsHash, expectedOutput } = req.body;
    
    if (!proof || !pubInputsRoot || !outputRoot || !jobsHash) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Missing required fields' } });
    }
    
    // Import verifier (in production, use actual zk verifier)
    // Stub for now - zk verifier would be implemented separately
    const verifyZKProof = async (input: any, expectedOutput?: any) => ({ valid: true, error: null, verifiedAt: new Date().toISOString() });
    
    const verificationResult = await verifyZKProof(
      { proof, pubInputsRoot, outputRoot, jobsHash, publicInputs: [] },
      expectedOutput || {}
    );
    
    if (!verificationResult.valid) {
      return res.status(400).json({
        valid: false,
        error: verificationResult.error,
      });
    }
    
    res.json({
      valid: true,
      verifiedAt: verificationResult.verifiedAt,
    });
  } catch (error: any) {
    console.error('ZK verification error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to verify proof' } });
  }
});

export default router;

