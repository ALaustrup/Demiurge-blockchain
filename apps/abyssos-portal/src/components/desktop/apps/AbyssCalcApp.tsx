import { useMemo, useState } from 'react';
import { Button } from '../../shared/Button';

type Mode = 'basic' | 'scientific' | 'programmer' | 'graph' | 'ai';

interface HistoryItem {
  expr: string;
  result: string;
}

export function AbyssCalcApp() {
  const [mode, setMode] = useState<Mode>('basic');
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');

  const placeholder = useMemo(() => {
    if (mode === 'programmer') return 'e.g. 0xff + 0b1010';
    if (mode === 'graph') return 'Enter f(x), e.g. sin(x) + x^2';
    return 'e.g. (2+3)*4';
  }, [mode]);

  const evaluate = () => {
    if (!expr.trim()) return;
    try {
      // Very lightweight eval; in production replace with math library
      // eslint-disable-next-line no-new-func
      const val = Function(`"use strict"; return (${expr})`)();
      const rendered = String(val);
      setResult(rendered);
      setHistory((prev) => [{ expr, result: rendered }, ...prev].slice(0, 20));
    } catch (error: any) {
      setResult(error.message || 'Error');
    }
  };

  const handleAiExplain = () => {
    if (!aiPrompt.trim()) return;
    // Stub until backend AI is wired
    setResult('AI explanation/solution will appear here (stub).');
  };

  return (
    <div className="h-full w-full flex flex-col bg-abyss-dark/90 text-gray-100">
      <div className="px-6 py-4 border-b border-abyss-cyan/20 flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-abyss-cyan">Abyss Calc</div>
          <div className="text-sm text-gray-400">Scientific, programmer, graphing, and AI assist</div>
        </div>
        <div className="flex gap-2">
          {(['basic', 'scientific', 'programmer', 'graph', 'ai'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded text-sm ${
                mode === m ? 'bg-abyss-cyan text-black font-semibold' : 'bg-abyss-dark border border-abyss-cyan/20'
              }`}
            >
              {m === 'basic' && 'Basic'}
              {m === 'scientific' && 'Scientific'}
              {m === 'programmer' && 'Programmer'}
              {m === 'graph' && 'Graph'}
              {m === 'ai' && 'AI Assist'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {mode !== 'ai' && (
          <>
            <input
              className="w-full px-3 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded text-lg font-mono"
              placeholder={placeholder}
              value={expr}
              onChange={(e) => setExpr(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  evaluate();
                }
              }}
            />
            <div className="flex gap-2">
              <Button onClick={evaluate} className="px-4">
                Evaluate
              </Button>
              <Button variant="secondary" className="px-4" onClick={() => { setExpr(''); setResult(''); }}>
                Clear
              </Button>
            </div>
          </>
        )}

        {mode === 'ai' && (
          <div className="space-y-2">
            <textarea
              className="w-full min-h-[160px] px-3 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded text-sm"
              placeholder="Describe what you want to solve or explain..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <Button onClick={handleAiExplain} className="px-4">
              Ask AI (stub)
            </Button>
          </div>
        )}

        <div className="bg-abyss-dark/60 border border-abyss-cyan/20 rounded-lg p-3 min-h-[120px]">
          <div className="text-xs text-gray-400 mb-1">Result</div>
          <div className="text-lg font-mono text-abyss-cyan whitespace-pre-wrap">
            {result || '—'}
          </div>
        </div>

        <div className="bg-abyss-dark/60 border border-abyss-cyan/20 rounded-lg p-3">
          <div className="text-sm font-semibold text-gray-200 mb-2">History</div>
          <div className="space-y-1 max-h-48 overflow-auto">
            {history.length === 0 && <div className="text-xs text-gray-500">No history yet.</div>}
            {history.map((h, idx) => (
              <div key={`${h.expr}-${idx}`} className="flex items-center justify-between text-xs font-mono bg-abyss-dark/40 px-2 py-1 rounded">
                <span className="text-gray-300">{h.expr}</span>
                <span className="text-abyss-cyan">{h.result}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


