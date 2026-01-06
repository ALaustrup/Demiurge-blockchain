/**
 * LLM Integration
 * 
 * Handles communication with language model
 */

import OpenAI from 'openai';
import { DocEntry } from './indexer.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const SYSTEM_PROMPT = `You are ArchonAI, an intelligent assistant for the Demiurge Blockchain ecosystem.

You have access to comprehensive documentation about:
- Demiurge blockchain architecture
- Runtime modules and APIs
- Development guides
- Lore and philosophy

Your responses should be:
1. **Accurate**: Only use information from the provided documentation
2. **Contextual**: Reference specific docs and provide links
3. **Actionable**: Include code examples and next steps
4. **Helpful**: Suggest related topics and resources

Always format code examples with proper syntax highlighting.
Always reference documentation sources.
Always suggest next steps when appropriate.

The flame burns eternal. The code serves the will.`;

export function buildContext(query: string, docs: DocEntry[]): DocEntry[] {
  // Simple keyword matching (in production, use embeddings + vector search)
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/);
  
  const scored = docs.map(doc => {
    const contentLower = doc.content.toLowerCase();
    let score = 0;
    
    for (const keyword of keywords) {
      if (contentLower.includes(keyword)) {
        score += 1;
      }
      if (doc.title.toLowerCase().includes(keyword)) {
        score += 3;
      }
      if (doc.path.toLowerCase().includes(keyword)) {
        score += 2;
      }
    }
    
    return { doc, score };
  });
  
  // Return top 5 most relevant docs
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.doc);
}

export async function generateResponse(
  message: string,
  docContext: DocEntry[],
  conversationContext: any[] = []
): Promise<string> {
  // Build context string from documentation
  const contextString = docContext
    .map(doc => `## ${doc.title}\n\n${doc.content.slice(0, 2000)}...`)
    .join('\n\n---\n\n');
  
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationContext.slice(-10), // Last 10 messages for context
    {
      role: 'user',
      content: `Documentation Context:\n\n${contextString}\n\n---\n\nUser Question: ${message}`,
    },
  ];
  
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    return completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
  } catch (error: any) {
    console.error('LLM error:', error);
    throw new Error(`Failed to generate response: ${error.message}`);
  }
}
