/**
 * DNS Lookup Routes
 */

import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { resolveDNS } from '../dns/resolver';
import type { DNSRecordType } from '../types';

const router: ExpressRouter = Router();

const LookupSchema = z.object({
  domain: z.string().min(1),
  type: z.enum(['A', 'AAAA', 'CNAME', 'TXT', 'NS', 'MX', 'SOA']).optional().default('A'),
  trace: z.boolean().optional().default(false),
});

router.get('/lookup', async (req, res) => {
  try {
    const params = LookupSchema.parse({
      domain: req.query.domain,
      type: req.query.type,
      trace: req.query.trace === 'true',
    });
    
    const result = await resolveDNS(params.domain, params.type as DNSRecordType, params.trace);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: error.message || 'Invalid lookup request',
      },
    });
  }
});

export default router;

