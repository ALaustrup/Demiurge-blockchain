"use client";

import { useEffect, useState } from "react";
import { BarChart3, MessageSquare, Users, Image as ImageIcon, TrendingUp, Coins, Award, Activity, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { getUserAnalytics, type UserAnalytics } from "@/lib/rpc";
import { graphqlRequest, getChatHeaders, QUERIES, type ChatAnalytics, type MessageActivity } from "@/lib/graphql";
import { formatCgt, cgtFromSmallest } from "@/lib/rpc";
// Helper function for relative time
function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return options?.addSuffix ? "just now" : "0 minutes";
  if (diffMins < 60) return options?.addSuffix ? `${diffMins}m ago` : `${diffMins} minutes`;
  if (diffHours < 24) return options?.addSuffix ? `${diffHours}h ago` : `${diffHours} hours`;
  return options?.addSuffix ? `${diffDays}d ago` : `${diffDays} days`;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [onChainAnalytics, setOnChainAnalytics] = useState<UserAnalytics | null>(null);
  const [chatAnalytics, setChatAnalytics] = useState<ChatAnalytics | null>(null);
  const [messageActivity, setMessageActivity] = useState<MessageActivity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedAddress = localStorage.getItem("demiurge_urgeid_wallet_address");
    if (!storedAddress) {
      router.push("/urgeid");
      return;
    }
    setAddress(storedAddress);
    loadAnalytics(storedAddress);
  }, [router]);

  const loadAnalytics = async (addr: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Load on-chain analytics
      const onChain = await getUserAnalytics(addr);
      setOnChainAnalytics(onChain);

      // Load chat analytics
      try {
        const chatData = await graphqlRequest<{ userChatAnalytics: ChatAnalytics }>(
          QUERIES.USER_CHAT_ANALYTICS,
          { address: addr },
          getChatHeaders(addr, "")
        );
        setChatAnalytics(chatData.userChatAnalytics);

        const activityData = await graphqlRequest<{ userMessageActivity: MessageActivity[] }>(
          QUERIES.USER_MESSAGE_ACTIVITY,
          { address: addr },
          getChatHeaders(addr, "")
        );
        setMessageActivity(activityData.userMessageActivity);
      } catch (chatErr: any) {
        console.warn("Chat analytics not available:", chatErr);
        // Chat analytics are optional
      }
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-400">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-400">Error: {error}</p>
          <button
            onClick={() => router.push("/urgeid")}
            className="rounded bg-rose-500 px-4 py-2 text-white hover:bg-rose-600"
          >
            Back to My Void
          </button>
        </div>
      </div>
    );
  }

  const totalContribution = (onChainAnalytics?.syzygyScore || 0) + 
    (chatAnalytics?.totalMessages || 0) * 10 + 
    (chatAnalytics?.roomsCreated || 0) * 50;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <button
          onClick={() => router.push("/urgeid")}
          className="mb-4 flex items-center gap-2 text-zinc-400 hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Void
        </button>
        <h1 className="text-4xl font-bold text-slate-50">Profile Analytics</h1>
        <p className="mt-2 text-zinc-400">Your contribution to the Demiurge network</p>
      </div>

      {/* Overview Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="mb-2 flex items-center gap-2 text-zinc-400">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm">Total Contribution</span>
          </div>
          <div className="text-2xl font-bold text-slate-50">{totalContribution.toLocaleString()}</div>
          <div className="mt-1 text-xs text-zinc-500">Combined network impact score</div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="mb-2 flex items-center gap-2 text-zinc-400">
            <Coins className="h-5 w-5" />
            <span className="text-sm">CGT Balance</span>
          </div>
          <div className="text-2xl font-bold text-slate-50">
            {onChainAnalytics ? formatCgt(cgtFromSmallest(onChainAnalytics.balance)) : "0"} CGT
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            {onChainAnalytics?.totalCgtEarnedFromRewards ? 
              `${formatCgt(cgtFromSmallest(onChainAnalytics.totalCgtEarnedFromRewards))} from rewards` : 
              "No rewards yet"}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="mb-2 flex items-center gap-2 text-zinc-400">
            <Award className="h-5 w-5" />
            <span className="text-sm">Level</span>
          </div>
          <div className="text-2xl font-bold text-slate-50">Level {onChainAnalytics?.level || 1}</div>
          <div className="mt-1 text-xs text-zinc-500">
            {onChainAnalytics?.syzygyScore || 0} Syzygy Score
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="mb-2 flex items-center gap-2 text-zinc-400">
            <Activity className="h-5 w-5" />
            <span className="text-sm">Transactions</span>
          </div>
          <div className="text-2xl font-bold text-slate-50">
            {onChainAnalytics?.totalTransactions || 0}
          </div>
          <div className="mt-1 text-xs text-zinc-500">On-chain activity</div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* On-Chain Metrics */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-slate-50">On-Chain Metrics</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Syzygy Score</span>
              <span className="font-semibold text-slate-50">{onChainAnalytics?.syzygyScore || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">CGT Earned from Rewards</span>
              <span className="font-semibold text-slate-50">
                {onChainAnalytics ? formatCgt(cgtFromSmallest(onChainAnalytics.totalCgtEarnedFromRewards)) : "0"} CGT
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Total Transactions</span>
              <span className="font-semibold text-slate-50">{onChainAnalytics?.totalTransactions || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">NFTs Owned</span>
              <span className="font-semibold text-slate-50">{onChainAnalytics?.totalNfts || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Archon Status</span>
              <span className={`font-semibold ${onChainAnalytics?.isArchon ? "text-amber-400" : "text-zinc-500"}`}>
                {onChainAnalytics?.isArchon ? "Archon" : "Nomad"}
              </span>
            </div>
            {onChainAnalytics?.badges && onChainAnalytics.badges.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <div className="mb-2 text-sm text-zinc-400">Badges</div>
                <div className="flex flex-wrap gap-2">
                  {onChainAnalytics.badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-400"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat & Social Metrics */}
        {chatAnalytics && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="mb-4 text-xl font-semibold text-slate-50">Chat & Social Metrics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-400">
                  <MessageSquare className="h-4 w-4" />
                  <span>Total Messages</span>
                </div>
                <span className="font-semibold text-slate-50">{chatAnalytics.totalMessages}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">World Chat</span>
                <span className="font-semibold text-slate-50">{chatAnalytics.worldChatMessages}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Direct Messages</span>
                <span className="font-semibold text-slate-50">{chatAnalytics.dmMessages}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Custom Room Messages</span>
                <span className="font-semibold text-slate-50">{chatAnalytics.customRoomMessages}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Users className="h-4 w-4" />
                  <span>Rooms Created</span>
                </div>
                <span className="font-semibold text-slate-50">{chatAnalytics.roomsCreated}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Rooms Moderated</span>
                <span className="font-semibold text-slate-50">{chatAnalytics.roomsModerated}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-400">
                  <ImageIcon className="h-4 w-4" />
                  <span>Media Shared</span>
                </div>
                <span className="font-semibold text-slate-50">{chatAnalytics.mediaShared}</span>
              </div>
              {chatAnalytics.firstMessageAt && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <div className="text-xs text-zinc-500">
                    First message: {formatDistanceToNow(new Date(chatAnalytics.firstMessageAt), { addSuffix: true })}
                  </div>
                  {chatAnalytics.lastMessageAt && (
                    <div className="text-xs text-zinc-500">
                      Last message: {formatDistanceToNow(new Date(chatAnalytics.lastMessageAt), { addSuffix: true })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Message Activity Chart */}
      {messageActivity.length > 0 && (
        <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-slate-50">Message Activity (Last 30 Days)</h2>
          <div className="flex items-end gap-2" style={{ height: "200px" }}>
            {messageActivity.map((day, idx) => {
              const maxCount = Math.max(...messageActivity.map((d) => d.count), 1);
              const height = (day.count / maxCount) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-rose-500 to-rose-400 transition-all hover:from-rose-400 hover:to-rose-300"
                    style={{ height: `${height}%`, minHeight: day.count > 0 ? "4px" : "0" }}
                    title={`${day.date}: ${day.count} messages`}
                  />
                  <div className="mt-2 text-xs text-zinc-500">
                    {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contribution Breakdown */}
      <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-xl font-semibold text-slate-50">Contribution Breakdown</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Syzygy Contribution</span>
            <span className="font-semibold text-slate-50">{onChainAnalytics?.syzygyScore || 0} points</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Chat Activity</span>
            <span className="font-semibold text-slate-50">
              {(chatAnalytics?.totalMessages || 0) * 10} points ({chatAnalytics?.totalMessages || 0} messages × 10)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Room Creation</span>
            <span className="font-semibold text-slate-50">
              {(chatAnalytics?.roomsCreated || 0) * 50} points ({chatAnalytics?.roomsCreated || 0} rooms × 50)
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-slate-50">Total Contribution Score</span>
              <span className="text-2xl font-bold text-rose-400">{totalContribution.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

