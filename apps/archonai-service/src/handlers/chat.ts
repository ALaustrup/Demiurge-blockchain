/**
 * Chat Handler
 * 
 * Processes chat requests with full documentation context
 */

import { Request, Response } from 'express';
import { indexDocs, DocEntry } from '../indexer.js';
import { buildContext, generateResponse } from '../llm.js';

let docIndex: DocEntry[] = [];

// Initialize index on startup
indexDocs().then(docs => {
  docIndex = docs;
  console.log('📚 Documentation index loaded');
});

export async function chatHandler(req: Request, res: Response) {
  try {
    const { message, context = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }
    
    // Rebuild index if needed (in production, do this periodically)
    if (docIndex.length === 0) {
      docIndex = await indexDocs();
    }
    
    // Build context from documentation
    const docContext = buildContext(message, docIndex);
    
    // Generate response using LLM
    const response = await generateResponse(message, docContext, context);
    
    res.json({
      response,
      sources: docContext.map(d => ({
        path: d.path,
        title: d.title,
      })),
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
}
