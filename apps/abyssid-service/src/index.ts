console.log('[Index] AbyssID service starting...');

// --- HARD DIAGNOSTICS (DO NOT REMOVE) ---
process.on('uncaughtException', (err) => {
  console.error('[Fatal] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Fatal] Unhandled Promise Rejection:', reason);
});
// ------------------------------------------------

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import abyssidRoutes from './routes/abyssid.js';
import drc369Routes from './routes/drc369.js';
import runtimeRoutes from './routes/runtime.js';
import computeMarketRoutes from './routes/computeMarket.js';
import miningRoutes from './routes/mining.js';
import archonRoutes from './routes/archon.js';
import storageRoutes from './routes/storage.js';
import nftSwapRoutes from './routes/nftSwap.js';
import walletRoutes from './routes/wallet.js';
import { getDb } from './db.js';

dotenv.config();

// Import radio routes with error handling
console.log('[Index] Before radio import');
let radioRoutes: any = null;
try {
  console.log('[Index] Attempting to import radio routes...');
  const radioModule = await import('./routes/radio.js');
  radioRoutes = radioModule.default;
  console.log('[Index] Radio routes imported successfully:', typeof radioRoutes);
} catch (e: any) {
  console.error('[Index] Radio import failed:', e);
  console.error('[Index] Error message:', e.message);
  console.error('[Index] Error code:', e.code);
  console.error('[Index] Error stack:', e.stack);
}
console.log('[Index] After radio import');

const app = express();
const PORT = process.env.PORT || 8082;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://demiurge.cloud';

// Middleware
app.use(cors({
  origin: [CORS_ORIGIN, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/healthz', (req, res) => {
  try {
    // Quick DB check
    const db = getDb();
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', service: 'abyssid-service' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// API routes
app.use('/api/abyssid', abyssidRoutes);
app.use('/api/drc369', drc369Routes);
app.use('/api/runtime', runtimeRoutes);
app.use('/api/compute-market', computeMarketRoutes);
app.use('/api/mining', miningRoutes);
app.use('/api/archon', archonRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/nft-swap', nftSwapRoutes);
app.use('/api/wallet', walletRoutes);

// Mount radio routes with validation
if (radioRoutes) {
  if (typeof radioRoutes === 'function') {
    console.log('[Index] Mounting /api/radio router...');
    app.use('/api/radio', radioRoutes);
    console.log('[Index] Radio router mounted.');
    console.log('[Index] Radio router integrity: VALID');
  } else {
    console.error('[Index] Radio router integrity: INVALID (not a function)');
    console.error('[Index] Radio router type:', typeof radioRoutes);
  }
} else {
  console.error('[Index] Radio router NOT mounted due to failed import.');
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
});

// Start server
app.listen(PORT, () => {
  console.log(`AbyssID Service running on port ${PORT}`);
  console.log(`CORS origin: ${CORS_ORIGIN}`);
  console.log(`Database initialized`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

