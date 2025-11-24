"use client";

import { useState } from "react";
import { useUrgeID } from "@/hooks/useUrgeID";
import { Wallet, Key, User } from "lucide-react";

export default function UrgeIDPage() {
  const { address, profile, loading, error, generateNew, loadExisting } = useUrgeID();
  const [inputAddress, setInputAddress] = useState("");

  if (!address) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Create or Load UrgeID</h1>
          
          <div className="space-y-4">
            <button
              onClick={generateNew}
              disabled={loading}
              className="w-full p-6 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors flex items-center gap-4"
            >
              <Wallet className="h-6 w-6 text-rose-400" />
              <div className="text-left">
                <h2 className="text-xl font-semibold">Generate New UrgeID</h2>
                <p className="text-sm text-zinc-400">Create a new identity</p>
              </div>
            </button>

            <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Key className="h-5 w-5" />
                Load Existing UrgeID
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputAddress}
                  onChange={(e) => setInputAddress(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 px-4 py-2 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-50"
                />
                <button
                  onClick={() => loadExisting(inputAddress)}
                  disabled={loading || !inputAddress}
                  className="px-6 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors disabled:opacity-50"
                >
                  Load
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 rounded-lg bg-red-500/20 border border-red-500 text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">UrgeID Profile</h1>
        
        {loading ? (
          <div className="text-zinc-400">Loading...</div>
        ) : profile ? (
          <div className="space-y-4">
            <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900">
              <div className="flex items-center gap-4 mb-4">
                <User className="h-12 w-12 text-rose-400" />
                <div>
                  <h2 className="text-2xl font-semibold">{profile.display_name}</h2>
                  {profile.username && (
                    <p className="text-zinc-400">@{profile.username}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Address:</span>
                  <span className="font-mono">{address.slice(0, 10)}...{address.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Level:</span>
                  <span>{profile.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Syzygy Score:</span>
                  <span>{profile.syzygy_score}</span>
                </div>
                {profile.badges.length > 0 && (
                  <div>
                    <span className="text-zinc-400">Badges: </span>
                    <span>{profile.badges.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-zinc-400">No profile found</div>
        )}
      </div>
    </div>
  );
}

