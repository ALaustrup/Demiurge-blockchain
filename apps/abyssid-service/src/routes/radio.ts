/**
 * Radio Routes
 * 
 * HTTP endpoints for Abyss Radio
 */

console.log('[Radio] Loading radio routes module...');

import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { getDb } from '../db.js';
import { RadioQueue } from '../radio/radioQueue.js';
import { RadioSegmentServer } from '../radio/radioSegmentServer.js';
import { RadioScheduler } from '../radio/radioScheduler.js';
import type { RadioBlock } from '../radio/radioTypes.js';

const router: ExpressRouter = Router();

// MINIMAL TEST ROUTE - MUST BE FIRST
console.log('[Radio] Registering test route...');
router.get('/test', (req, res) => {
  console.log('[Radio] TEST ROUTE HIT');
  res.json({ ok: true, message: 'Radio router alive' });
});

// Global scheduler instance (lazy initialization to avoid blocking route registration)
let scheduler: RadioScheduler | null = null;
let currentBlocks: RadioBlock[] = [];

// Initialize scheduler after routes are registered
function initScheduler() {
  if (scheduler) return;
  
  try {
    scheduler = new RadioScheduler();
    scheduler.start('all', (block) => {
      currentBlocks.push(block);
      // Keep only last 100 blocks
      if (currentBlocks.length > 100) {
        currentBlocks.shift();
      }
    });
    console.log('[Radio] Scheduler started successfully');
  } catch (error) {
    console.error('[Radio] Failed to start scheduler:', error);
    // Don't throw - allow routes to still work even if scheduler fails
  }
}

// Start scheduler after a delay to ensure routes are registered first
setTimeout(() => {
  initScheduler();
}, 1000);

/**
 * GET /api/radio/blocks/stream
 * Stream radio blocks (SSE or long-poll)
 */
router.get('/blocks/stream', (req, res) => {
  const genreId = z.string().optional().parse(req.query.genre) || 'all';
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send current blocks
  const genreBlocks = currentBlocks.filter(b => genreId === 'all' || b.genreId === genreId);
  res.write(`data: ${JSON.stringify(genreBlocks)}\n\n`);
  
  // Keep connection open for new blocks
  const interval = setInterval(() => {
    const latest = currentBlocks.slice(-10);
    res.write(`data: ${JSON.stringify(latest)}\n\n`);
  }, 5000);
  
  req.on('close', () => {
    clearInterval(interval);
  });
});

/**
 * GET /api/radio/segment/:trackId/:segmentIndex
 * Get audio segment for streaming
 */
router.get('/segment/:trackId/:segmentIndex', async (req, res) => {
  try {
    const trackId = z.string().parse(req.params.trackId);
    const segmentIndex = z.number().int().parse(Number(req.params.segmentIndex));
    
    const segment = await RadioSegmentServer.getSegment(trackId, segmentIndex);
    
    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    
    // Set headers for streaming
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', segment.data.length);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Support range requests
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : segment.data.length - 1;
      const chunk = segment.data.slice(start, end + 1);
      
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${segment.data.length}`);
      res.setHeader('Content-Length', chunk.length);
      return res.send(Buffer.from(chunk));
    }
    
    res.send(Buffer.from(segment.data));
  } catch (error: any) {
    console.error('Error serving segment:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/radio/queue
 * Get queue for genre
 */
console.log('[Radio] Registering GET /queue...');
router.get('/queue', (req, res) => {
  try {
    const genreId = z.string().optional().parse(req.query.genre) || 'all';
    const queue = RadioQueue.getQueue(genreId);
    res.json({ queue, length: queue.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * POST /api/radio/queue
 * Add track to queue
 */
console.log('[Radio] Registering POST /queue...');
router.post('/queue', async (req, res) => {
  try {
    const body = z.object({
      trackId: z.string(),
      genreId: z.string(),
    }).parse(req.body);
    
    // Get user from session (simplified)
    const submittedBy = 'user'; // In real implementation, get from auth
    
    const result = await RadioQueue.addToQueue(body.trackId, body.genreId, submittedBy);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * GET /api/radio/now-playing
 * Get currently playing track
 */
console.log('[Radio] Registering GET /now-playing...');
router.get('/now-playing', (req, res) => {
  const genreId = z.string().optional().parse(req.query.genre) || 'all';
  const latest = currentBlocks
    .filter(b => genreId === 'all' || b.genreId === genreId)
    .slice(-1)[0];
  
  res.json({ block: latest || null });
});

// Router integrity validation
if (!router || typeof router !== 'function') {
  console.error('[Radio] Exported router is invalid!');
  console.error('[Radio] Router type:', typeof router);
  console.error('[Radio] Router value:', router);
} else {
  console.log('[Radio] Router exported successfully.');
}

export default router;

