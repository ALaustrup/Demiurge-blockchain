import { useEffect, useState } from 'react';
import { Button } from '../../shared/Button';

const STORAGE_KEY = 'abyss-writer-draft';

export function QorWriterApp() {
  const [title, setTitle] = useState('Untitled');
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<number | null>(null);

  // Load draft
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTitle(parsed.title || 'Untitled');
        setContent(parsed.content || '');
        setLastSaved(parsed.lastSaved || null);
      } catch {
        // ignore
      }
    }
  }, []);

  // Autosave
  useEffect(() => {
    const id = setTimeout(() => {
      const now = Date.now();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ title, content, lastSaved: now })
      );
      setLastSaved(now);
    }, 600);
    return () => clearTimeout(id);
  }, [title, content]);

  const download = (type: 'md' | 'txt') => {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title || 'document'}.${type}`;
    link.click();
  };

  return (
    <div className="h-full w-full flex flex-col bg-genesis-glass-light/90 text-gray-100">
      <div className="px-6 py-4 border-b border-genesis-border-default/20 flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-genesis-cipher-cyan">QOR Writer</div>
          <div className="text-sm text-genesis-text-tertiary">Rich text, autosave, export (docx/pdf/md coming soon)</div>
        </div>
        <div className="flex gap-2">
          <Button className="text-sm px-3" onClick={() => download('md')}>
            Export .md
          </Button>
          <Button className="text-sm px-3" variant="secondary" onClick={() => download('txt')}>
            Export .txt
          </Button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <input
          className="px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-lg font-semibold"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex gap-2 text-xs text-genesis-text-tertiary">
          <span>Autosaves locally</span>
          {lastSaved && <span>• Last saved {new Date(lastSaved).toLocaleTimeString()}</span>}
          <span>• QorID-linked sync coming soon</span>
        </div>
        <textarea
          className="flex-1 min-h-[420px] px-3 py-3 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-sm leading-relaxed"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..."
        />
      </div>
    </div>
  );
}


