"use client";

import { FractureShell } from "@/components/fracture/FractureShell";
import { HeroPanel } from "@/components/fracture/HeroPanel";
import { Sparkles, MessageSquare, Zap, BookOpen, Send, Loader2, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAbyssID } from "@/lib/fracture/identity/AbyssIDContext";
import { ArchonProposalPanel } from "@/components/archon/ArchonProposalPanel";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ConspirePage() {
  const { identity } = useAbyssID();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Greetings, seeker. I am ArchonAI, your guide through the Demiurge. How may I assist you today? I can help with development tasks, documentation queries, creation workflows, and understanding the ecosystem.",
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || sending || !identity?.address) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);
    setError(null);

    try {
      // TODO: Replace with actual ArchonAI backend endpoint
      // For now, simulate a response
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulated response - replace with actual API call
      const response: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `I understand you're asking about "${userMessage.content}". This is a placeholder response. The ArchonAI backend integration is pending. In production, this will connect to an LLM service that can assist with:\n\n- SDK integration and API usage\n- Documentation queries and code examples\n- Creation workflows for NFTs and worlds\n- Understanding Demiurge architecture\n\nWould you like to know more about any specific aspect of the Demiurge ecosystem?`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, response]);
    } catch (err: any) {
      setError(err.message || "Failed to get response from ArchonAI");
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I apologize, but I'm experiencing technical difficulties. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Greetings, seeker. I am ArchonAI, your guide through the Demiurge. How may I assist you today?",
        timestamp: new Date(),
      },
    ]);
    setConversationId(null);
    setError(null);
  };

  return (
    <FractureShell>
      <HeroPanel
        title="Conspire"
        subtitle="Commune with the Archon: AI-powered assistance for developers and creators"
      />

      <div className="space-y-6">
        {/* Main Chat Interface */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-xl min-h-[500px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 border border-cyan-500/30">
                <Sparkles className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-zinc-100 mb-1">
                  ArchonAI Assistant
                </h3>
                <p className="text-sm text-zinc-400">
                  {identity ? "Ready to assist" : "Please create an AbyssID to use ArchonAI"}
                </p>
              </div>
            </div>
            {messages.length > 1 && (
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
              >
                Clear Chat
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[300px] max-h-[400px]">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 border border-cyan-500/30 text-zinc-100"
                      : "bg-white/5 border border-white/10 text-zinc-300"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  <div className="text-xs text-zinc-500 mt-2">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-zinc-300">
                      {identity?.username?.slice(0, 2).toUpperCase() || "U"}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
            {sending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Input */}
          {identity ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask ArchonAI anything about Demiurge..."
                className="flex-1 rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white font-semibold rounded-lg hover:from-cyan-400 hover:to-fuchsia-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
              <p className="text-sm text-yellow-300">
                Please create an AbyssID to use ArchonAI. Visit Haven to get started.
              </p>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="p-3 rounded-lg bg-cyan-500/20 border border-cyan-500/30 w-fit mb-4">
              <Zap className="h-5 w-5 text-cyan-400" />
            </div>
            <h4 className="text-lg font-semibold text-zinc-100 mb-2">
              Dev Assistance
            </h4>
            <p className="text-sm text-zinc-400">
              Get help with SDK integration, API usage, and development workflows.
            </p>
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="p-3 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/30 w-fit mb-4">
              <BookOpen className="h-5 w-5 text-fuchsia-400" />
            </div>
            <h4 className="text-lg font-semibold text-zinc-100 mb-2">
              Documentation
            </h4>
            <p className="text-sm text-zinc-400">
              Query the docs, get code examples, and understand system architecture.
            </p>
          </div>

          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <div className="p-3 rounded-lg bg-purple-500/20 border border-purple-500/30 w-fit mb-4">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <h4 className="text-lg font-semibold text-zinc-100 mb-2">
              Creation Workflows
            </h4>
            <p className="text-sm text-zinc-400">
              Guidance on minting NFTs, creating worlds, and building on-chain experiences.
            </p>
          </div>
        </div>

        {/* ArchonAI Proposals */}
        <ArchonProposalPanel />

        {/* Info Section */}
        <div className="p-6 bg-gradient-to-r from-cyan-500/10 to-fuchsia-500/10 border border-cyan-500/20 rounded-xl">
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">
            About Conspire
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Conspire is your gateway to ArchonAI, an intelligent assistant powered by advanced language models.
            Use it to get help with development tasks, understand documentation, explore creation workflows,
            and receive guidance on building within the Demiurge ecosystem. This is where human creativity
            meets artificial intelligence in service of sovereign creation.
          </p>
        </div>
      </div>
    </FractureShell>
  );
}
