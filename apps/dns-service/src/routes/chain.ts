/**
 * Chain DNS Routes
 */

import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { lookupChainRecord } from '../dns/chainLookup';

const router: ExpressRouter = Router();

router.get('/onchain/:domain', async (req, res) => {
  try {
    const domain = z.string().min(1).parse(req.params.domain);
    
    const record = await lookupChainRecord(domain);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No chain record found for domain',
        },
      });
    }
    
    res.json({
      success: true,
      data: record,
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

router.get('/resolve-tld', async (req, res) => {
  try {
    const name = z.string().min(1).parse(req.query.name);
    
    // For future Demiurge-native TLDs
    // For now, return placeholder
    res.json({
      success: true,
      data: {
        name,
        tld: 'demiurge',
        resolver: 'chain',
        message: 'Demiurge-native TLD resolution coming soon',
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

export default router;

