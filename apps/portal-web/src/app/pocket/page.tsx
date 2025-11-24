"use client";

import { useState, useEffect } from "react";
import { Home, Wallet, Plus, Code, MessageSquare, QrCode, Send, Sparkles, Coins } from "lucide-react";
import { loadLocalWallet, getMyProfile, getMyBalance, getMyNfts, getMyProjects, getMyDeveloperProfile, getWorldChatMessages, sendWorldMessage } from "@/lib/mobileApi";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";

type Tab = "home" | "wallet" | "create" | "dev" | "chat";

export default function PocketPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [wallet, setWallet] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState<string>("0.00000000");
  const [nfts, setNfts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === "chat") {
      loadChat();
      const interval = setInterval(loadChat, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const loadData = async () => {
    const w = await loadLocalWallet();
    if (!w) {
      router.push("/urgeid");
      return;
    }
    setWallet(w);

    const [prof, bal, nftList, devProf] = await Promise.all([
      getMyProfile(w.address),
      getMyBalance(w.address),
      getMyNfts(w.address),
      getMyDeveloperProfile(w.address),
    ]);

    setProfile(prof);
    setBalance(bal);
    setNfts(nftList);
    setIsDeveloper(!!devProf);

    if (devProf) {
      const projList = await getMyProjects(w.address);
      setProjects(projList);
    }
  };

  const loadChat = async () => {
    const messages = await getWorldChatMessages(20);
    setChatMessages(messages);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !wallet || sendingChat) return;
    setSendingChat(true);
    try {
      await sendWorldMessage({
        content: chatInput.trim(),
        address: wallet.address,
        username: profile?.username,
      });
      setChatInput("");
      await loadChat();
    } catch (err: any) {
      console.error("Failed to send message:", err);
    } finally {
      setSendingChat(false);
    }
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div className={`min-h-screen bg-zinc-950 ${isMobile ? "" : "flex items-center justify-center p-8"}`}>
      {/* Desktop: Phone Frame */}
      {!isMobile && (
        <div className="w-full max-w-[390px] h-[844px] rounded-[3rem] border-8 border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
          <div className="h-full flex flex-col bg-zinc-950">
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {renderTabContent()}
            </div>
            {/* Tab Bar */}
            {renderTabBar()}
          </div>
        </div>
      )}

      {/* Mobile: Full Screen */}
      {isMobile && (
        <div className="h-screen flex flex-col bg-zinc-950 pb-16">
          <div className="flex-1 overflow-y-auto">
            {renderTabContent()}
          </div>
          {renderTabBar()}
        </div>
      )}

      {/* QR Modal */}
      {showQR && wallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowQR(false)}>
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-zinc-50 mb-4">Receive CGT</h3>
            <div className="bg-white p-4 rounded-lg mb-4">
              <QRCode value={wallet.address} size={256} />
            </div>
            <p className="text-xs text-zinc-400 font-mono text-center break-all">{wallet.address}</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(wallet.address);
                setShowQR(false);
              }}
              className="w-full mt-4 min-h-[44px] rounded-lg bg-rose-500 text-white font-medium hover:bg-rose-600"
            >
              Copy Address
            </button>
          </div>
        </div>
      )}
    </div>
  );

  function renderTabContent() {
    switch (activeTab) {
      case "home":
        return (
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                {profile?.username ? (
                  <h1 className="text-2xl font-bold text-rose-400">@{profile.username}</h1>
                ) : (
                  <h1 className="text-2xl font-bold text-zinc-400">My Void</h1>
                )}
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  {wallet?.address.slice(0, 8)}...{wallet?.address.slice(-6)}
                </p>
              </div>
              {profile?.level && (
                <div className="text-right">
                  <div className="text-lg font-bold text-violet-400">Lv. {profile.level}</div>
                  <div className="text-xs text-zinc-500">{profile.syzygyScore.toLocaleString()} Syzygy</div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs text-zinc-400">CGT</span>
                </div>
                <p className="text-xl font-mono font-semibold text-emerald-400">{balance}</p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  <span className="text-xs text-zinc-400">NFTs</span>
                </div>
                <p className="text-xl font-mono font-semibold text-violet-400">{nfts.length}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <button
                onClick={() => setShowQR(true)}
                className="w-full min-h-[44px] rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-50 hover:bg-zinc-800 flex items-center justify-center gap-2"
              >
                <QrCode className="h-5 w-5" />
                Receive CGT
              </button>
              <button
                onClick={() => router.push("/urgeid?sendTo=")}
                className="w-full min-h-[44px] rounded-lg bg-rose-500 text-white font-medium hover:bg-rose-600 flex items-center justify-center gap-2"
              >
                <Send className="h-5 w-5" />
                Send CGT
              </button>
              <button
                onClick={() => router.push("/urgeid")}
                className="w-full min-h-[44px] rounded-lg border border-violet-600 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Mint NFT
              </button>
            </div>
          </div>
        );

      case "wallet":
        return (
          <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold text-zinc-50 mb-4">Wallet</h2>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
              <div className="text-3xl font-mono font-bold text-emerald-400 mb-2">{balance}</div>
              <div className="text-sm text-zinc-400">CGT Balance</div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 mb-2">NFTs ({nfts.length})</h3>
              {nfts.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">No NFTs yet</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {nfts.slice(0, 6).map((nft) => (
                    <div key={nft.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                      <div className="aspect-square bg-zinc-800 rounded mb-2 flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-violet-400/30" />
                      </div>
                      <div className="text-xs font-semibold text-zinc-300">NFT #{nft.id}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "create":
        return (
          <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold text-zinc-50 mb-4">Create</h2>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/urgeid")}
                className="w-full min-h-[44px] rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-50 hover:bg-zinc-800 flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Mint D-GEN NFT
              </button>
              <p className="text-xs text-zinc-500 text-center">
                Full creation tools available in My Void
              </p>
            </div>
          </div>
        );

      case "dev":
        return (
          <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold text-zinc-50 mb-4">Developer</h2>
            {!isDeveloper ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
                <p className="text-sm text-zinc-400 mb-4">You're not registered as a developer yet.</p>
                <button
                  onClick={() => router.push("/developers")}
                  className="min-h-[44px] rounded-lg bg-rose-500 text-white font-medium hover:bg-rose-600 px-6"
                >
                  Register as Developer
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-400">My Projects ({projects.length})</h3>
                {projects.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-8">No projects yet</p>
                ) : (
                  <div className="space-y-2">
                    {projects.map((project) => (
                      <div
                        key={project.slug}
                        onClick={() => router.push(`/developers/projects/${project.slug}`)}
                        className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 min-h-[44px] cursor-pointer hover:bg-zinc-800"
                      >
                        <div className="font-semibold text-zinc-50">{project.name}</div>
                        <div className="text-xs text-zinc-400 font-mono">{project.slug}</div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => router.push("/developers/projects")}
                  className="w-full min-h-[44px] rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-50 hover:bg-zinc-800"
                >
                  Create New Project
                </button>
              </div>
            )}
          </div>
        );

      case "chat":
        return (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">No messages yet</p>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="flex gap-2">
                    <div className="flex-1">
                      <div className="text-xs text-zinc-400 mb-1">
                        {msg.sender?.username ? `@${msg.sender.username}` : msg.sender?.address?.slice(0, 8)}
                      </div>
                      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-200">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-zinc-800 p-4 bg-zinc-950">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder="Type a message..."
                  className="flex-1 min-h-[44px] rounded-lg border border-zinc-800 bg-zinc-900 px-4 text-zinc-50 outline-none focus:border-rose-500"
                />
                <button
                  onClick={handleSendChat}
                  disabled={sendingChat || !chatInput.trim()}
                  className="min-h-[44px] min-w-[44px] rounded-lg bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 flex items-center justify-center"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  function renderTabBar() {
    const tabs: { id: Tab; icon: any; label: string }[] = [
      { id: "home", icon: Home, label: "Home" },
      { id: "wallet", icon: Wallet, label: "Wallet" },
      { id: "create", icon: Plus, label: "Create" },
      { id: "dev", icon: Code, label: "Dev" },
      { id: "chat", icon: MessageSquare, label: "Chat" },
    ];

    return (
      <div className="flex items-center justify-around h-16 border-t border-zinc-800 bg-zinc-950">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 min-h-[44px] transition-colors ${
                isActive ? "text-rose-400" : "text-zinc-400"
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    );
  }
}

