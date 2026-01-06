/**
 * Documentation Indexer
 * 
 * Scans docs/ directory and builds searchable index
 */

import { glob } from 'glob';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { marked } from 'marked';

export interface DocEntry {
  path: string;
  title: string;
  content: string;
  category: string;
  metadata: Record<string, any>;
}

export async function indexDocs(): Promise<DocEntry[]> {
  const docsDir = join(process.cwd(), '../../docs');
  const files = await glob('**/*.md', { cwd: docsDir });
  
  const entries: DocEntry[] = [];
  
  for (const file of files) {
    const fullPath = join(docsDir, file);
    const content = await readFile(fullPath, 'utf-8');
    
    // Extract title from first heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : file;
    
    // Determine category from path
    const category = file.split('/')[0] || 'root';
    
    // Parse markdown to plain text for indexing
    const plainText = marked.parse(content, { breaks: true }) as string;
    
    entries.push({
      path: file,
      title,
      content: plainText,
      category,
      metadata: {
        file,
        lastModified: (await import('fs')).statSync(fullPath).mtime,
      },
    });
  }
  
  console.log(`📚 Indexed ${entries.length} documentation files`);
  return entries;
}
