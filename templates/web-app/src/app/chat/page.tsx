"use client";

import { useState, useEffect } from "react";
import { useUrgeID } from "@/hooks/useUrgeID";
import { MessageSquare } from "lucide-react";

const ABYSS_GATEWAY_URL = process.env.NEXT_PUBLIC_ABYSS_GATEWAY_URL || "http://localhost:4000/graphql";

export default function ChatPage() {
  const { address, profile } = useUrgeID();
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) {
      loadMessages();
      const interval = setInterval(loadMessages, 2000);
      return () => clearInterval(interval);
    }
  }, [address]);

  const loadMessages = async () => {
    try {
      const query = `
        query {
          worldChatMessages(limit: 20) {
            id
            content
            sender {
              username
              isArchon
            }
            createdAt
          }
        }
      `;

      const response = await fetch(ABYSS_GATEWAY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demiurge-address": address || "",
          "x-demiurge-username": profile?.username || "",
        },
        body: JSON.stringify({ query }),
      });

      const json = await response.json();
      if (json.data?.worldChatMessages) {
        setMessages(json.data.worldChatMessages);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !address) return;

    try {
      setLoading(true);
      const mutation = `
        mutation {
          sendWorldMessage(content: "${messageInput}") {
            id
            content
          }
        }
      `;

      await fetch(ABYSS_GATEWAY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demiurge-address": address,
          "x-demiurge-username": profile?.username || "",
        },
        body: JSON.stringify({ query: mutation }),
      });

      setMessageInput("");
      await loadMessages();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-zinc-400">Please create or load an UrgeID first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <MessageSquare className="h-8 w-8" />
          World Chat
        </h1>
        
        <div className="space-y-4">
          <div className="h-96 overflow-y-auto p-4 rounded-lg border border-zinc-800 bg-zinc-900 space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className="p-3 rounded bg-zinc-800">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">
                    @{msg.sender?.username || "unknown"}
                  </span>
                  {msg.sender?.isArchon && <span>✨</span>}
                </div>
                <p className="text-zinc-300">{msg.content}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {new Date(msg.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-50"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !messageInput.trim()}
              className="px-6 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

