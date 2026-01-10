/**
 * ArchonAI Assistant Application
 * 
 * Intelligent assistant integrated into QOR OS
 * Provides context-aware help and guidance
 */

import { useState, useRef, useEffect } from 'react';
import { useQorID } from '../../../hooks/useAbyssID';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ path: string; title: string }>;
  timestamp: number;
}

export function ArchonAIAssistantApp() {
  const { session } = useQorID();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am ArchonAI, your intelligent assistant for the Demiurge ecosystem. I can help you with:\n\n• Understanding Demiurge architecture\n• Writing code and using SDKs\n• Navigating documentation\n• Building applications\n• And much more!\n\nWhat would you like to know?',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);
    setError(null);

    try {
      // In production, call ArchonAI service
      const archonaiUrl = import.meta.env.VITE_ARCHONAI_URL || 'http://localhost:8083';
      
      const response = await fetch(`${archonaiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          context: messages.slice(-5).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        sources: data.sources,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('ArchonAI error:', err);
      setError(err.message || 'Failed to get response');
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or check if the ArchonAI service is running.',
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: 'How do I mint an NFT?', query: 'How do I mint an NFT on Demiurge?' },
    { label: 'Explain CGT', query: 'What is CGT and how does it work?' },
    { label: 'SDK Usage', query: 'How do I use the TypeScript SDK?' },
    { label: 'Build an App', query: 'How do I build an QOR OS application?' },
  ];

  return (
    <div className="w-full h-full bg-genesis-glass-light text-white flex flex-col">
      {/* Header */}
      <div className="h-16 bg-abyss-navy/50 border-b border-genesis-border-default/20 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🤖</div>
          <div>
            <h2 className="text-xl font-bold text-genesis-cipher-cyan">ArchonAI Assistant</h2>
            <div className="text-xs text-genesis-text-tertiary">Intelligent help for Demiurge</div>
          </div>
        </div>
        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 px-3 py-1 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-abyss-cyan/20 text-white'
                  : 'bg-abyss-navy/50 text-gray-100'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-genesis-border-default/20">
                  <div className="text-xs text-genesis-text-tertiary mb-2">📚 Sources:</div>
                  <div className="space-y-1">
                    {message.sources.map((source, i) => (
                      <div key={i} className="text-xs text-genesis-cipher-cyan">
                        • {source.title} ({source.path})
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-500 mt-2">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {sending && (
          <div className="flex justify-start">
            <div className="bg-abyss-navy/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-genesis-text-tertiary">
                <div className="w-2 h-2 bg-abyss-cyan rounded-full animate-pulse"></div>
                <span className="text-sm">ArchonAI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length === 1 && (
        <div className="px-6 py-4 border-t border-genesis-border-default/20">
          <div className="text-xs text-genesis-text-tertiary mb-2">Quick Actions:</div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => setInput(action.query)}
                className="px-3 py-1 bg-abyss-navy/30 border border-genesis-border-default/20 rounded text-xs hover:bg-abyss-cyan/20 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="h-24 bg-abyss-navy/30 border-t border-genesis-border-default/20 p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask ArchonAI anything about Demiurge..."
            className="flex-1 px-4 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded-lg text-sm resize-none focus:outline-none focus:border-genesis-border-default"
            rows={2}
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="px-6 py-2 bg-abyss-cyan/20 hover:bg-abyss-cyan/30 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
