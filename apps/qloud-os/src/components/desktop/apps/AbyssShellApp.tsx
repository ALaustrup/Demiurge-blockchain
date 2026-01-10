/**
 * QOR OS Shell Application
 * 
 * Neon terminal with command routing system
 */

import { useState, useEffect, useRef } from 'react';
import { useQorID } from '../../../hooks/useAbyssID';
import { useBlockListener } from '../../../context/BlockListenerContext';
import { executeCommand, type CommandContext } from '../../../services/shell/commands';
import { deriveDemiurgePublicKey, getCgtBalance } from '../../../services/wallet/demiurgeWallet';

interface CommandHistory {
  input: string;
  result: { success: boolean; output: string; error?: string };
  timestamp: number;
}

export function AbyssShellApp() {
  const { session } = useQorID();
  const blockListener = useBlockListener();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);
  
  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Autocomplete
  useEffect(() => {
    if (!input.trim()) {
      setAutocompleteSuggestions([]);
      return;
    }
    
    const commands = ['help', 'wallet.balance', 'wallet.send', 'drc369.list', 'chain.info', 'system.ps', 'system.kill'];
    const matches = commands.filter(cmd => cmd.startsWith(input.trim()));
    setAutocompleteSuggestions(matches.slice(0, 5));
  }, [input]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isExecuting) return;
    
    const commandInput = input.trim();
    setInput('');
    setIsExecuting(true);
    
    // Add command to history
    const commandEntry: CommandHistory = {
      input: commandInput,
      result: { success: false, output: 'Executing...' },
      timestamp: Date.now(),
    };
    setHistory(prev => [...prev, commandEntry]);
    
    // Execute command
    const context: CommandContext = {
      session: session ? { username: session.username, publicKey: session.publicKey } : null,
      getBalance: async () => {
        if (!session) throw new Error('Not logged in');
        const publicKey = await deriveDemiurgePublicKey(session.publicKey);
        return await getCgtBalance(publicKey);
      },
      getBlockHeight: () => blockListener.currentBlockHeight,
      getConnectionStatus: () => blockListener.connectionStatus,
    };
    
    const result = await executeCommand(commandInput, context);
    
    // Update history with result
    setHistory(prev => {
      const updated = [...prev];
      updated[updated.length - 1] = {
        ...commandEntry,
        result,
      };
      return updated;
    });
    
    setIsExecuting(false);
    inputRef.current?.focus();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Arrow up: previous command
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const commands = history.map(h => h.input).filter(Boolean);
      if (commands.length > 0) {
        const lastCommand = commands[commands.length - 1];
        setInput(lastCommand);
      }
    }
    
    // Tab: autocomplete
    if (e.key === 'Tab' && autocompleteSuggestions.length > 0) {
      e.preventDefault();
      setInput(autocompleteSuggestions[0]);
    }
  };
  
  return (
    <div className="h-full flex flex-col min-h-0 bg-genesis-glass-light">
      {/* Terminal Header */}
      <div className="bg-abyss-navy/80 border-b border-genesis-border-default/20 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-xs text-genesis-text-tertiary">QOR OS Shell</div>
      </div>
      
      {/* Terminal Output */}
      <div className="flex-1 overflow-auto p-4 font-mono text-sm min-h-0">
        <div className="text-genesis-cipher-cyan mb-4">
          <div className="glitch-text">ABYSS OS SHELL v1.0</div>
          <div className="text-genesis-text-tertiary text-xs mt-1">Type 'help' for available commands</div>
        </div>
        
        {history.map((entry, i) => (
          <div key={i} className="mb-4">
            <div className="text-genesis-cipher-cyan mb-1">
              <span className="text-gray-500">$ </span>
              {entry.input}
            </div>
            <div className={`ml-4 ${entry.result.success ? 'text-genesis-text-secondary' : 'text-red-400'}`}>
              {entry.result.error ? (
                <div className="text-red-400">Error: {entry.result.error}</div>
              ) : (
                <div className="whitespace-pre-wrap">{entry.result.output}</div>
              )}
            </div>
          </div>
        ))}
        
        {isExecuting && (
          <div className="text-gray-500 animate-pulse">Executing...</div>
        )}
        
        <div ref={historyEndRef} />
      </div>
      
      {/* Terminal Input */}
      <form onSubmit={handleSubmit} className="border-t border-genesis-border-default/20 p-4 bg-abyss-navy/40">
        <div className="flex items-center space-x-2">
          <span className="text-genesis-cipher-cyan font-mono">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm"
            disabled={isExecuting}
          />
        </div>
        
        {autocompleteSuggestions.length > 0 && (
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            {autocompleteSuggestions.map((suggestion, i) => (
              <div key={i} className="cursor-pointer hover:text-genesis-cipher-cyan" onClick={() => setInput(suggestion)}>
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}

