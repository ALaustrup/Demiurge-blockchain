/**
 * DNS Record Routes
 */

import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { cache } from '../db/client';
import { resolveDNS } from '../dns/resolver';
import type { DNSRecordType } from '../types';

const router: ExpressRouter = Router();

router.get('/record', async (req, res) => {
  try {
    const domain = z.string().min(1).parse(req.query.domain);
    
    // Resolve all common record types
    const types: DNSRecordType[] = ['A', 'AAAA', 'CNAME', 'TXT', 'NS'];
    const allRecords = [];
    
    for (const type of types) {
      try {
        const result = await resolveDNS(domain, type, false);
        allRecords.push(...result.records);
      } catch (error) {
        // Ignore errors for individual types
      }
    }
    
    res.json({
      success: true,
      data: {
        domain,
        records: allRecords,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: error.message || 'Invalid request',
      },
    });
  }
});

router.get('/cache/:domain', async (req, res) => {
  try {
    const domain = z.string().min(1).parse(req.params.domain);
    const type = z.enum(['A', 'AAAA', 'CNAME', 'TXT', 'NS']).optional().parse(req.query.type);
    
    if (type) {
      const entry = cache.get(domain, type);
      res.json({
        success: true,
        data: entry,
      });
    } else {
      const allEntries = cache.getAll().filter(e => e.domain === domain);
      res.json({
        success: true,
        data: allEntries,
      });
    }
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: error.message || 'Invalid request',
      },
    });
  }
});

router.post('/cache/flush', async (req, res) => {
  try {
    cache.flush();
    res.json({
      success: true,
      message: 'Cache flushed',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to flush cache',
      },
    });
  }
});

export default router;

