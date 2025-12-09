/**
 * Express Server Setup
 */

import express, { type Express } from 'express';
import cors from 'cors';
import lookupRoutes from './routes/lookup';
import recordRoutes from './routes/record';
import chainRoutes from './routes/chain';
import { initDb } from './db/client';

export function createServer(): Express {
  const app = express();
  
  // Initialize database
  const dbPath = process.env.DNS_DB_PATH || './dns-cache.db';
  initDb(dbPath);
  
  // Middleware
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
  }));
  app.use(express.json());
  
  // Health check
  app.get('/healthz', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  // Routes
  app.use('/api/dns', lookupRoutes);
  app.use('/api/dns', recordRoutes);
  app.use('/api/dns', chainRoutes);
  
  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message || 'Internal server error',
      },
    });
  });
  
  return app;
}

