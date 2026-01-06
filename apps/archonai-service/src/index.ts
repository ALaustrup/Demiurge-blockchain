/**
 * ArchonAI Service
 * 
 * Intelligent assistant for Demiurge ecosystem
 * Provides context-aware responses using all documentation
 */

import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { chatHandler } from './handlers/chat.js';
import { indexDocs } from './indexer.js';

config();

const app = express();
const PORT = process.env.PORT || 8083;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'archonai' });
});

// Chat endpoint
app.post('/api/chat', chatHandler);

// Documentation indexing
app.post('/api/index-docs', async (req, res) => {
  try {
    await indexDocs();
    res.json({ success: true, message: 'Documentation indexed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🌊 ArchonAI Service running on port ${PORT}`);
  console.log(`📚 Documentation indexing available at POST /api/index-docs`);
  console.log(`💬 Chat available at POST /api/chat`);
});
