"use client";

import { FractureShell } from "@/components/fracture/FractureShell";
import { HeroPanel } from "@/components/fracture/HeroPanel";
import Link from "next/link";
import { ArrowRight, BookOpen, FileText, GraduationCap, Code, Settings, Database, Zap, Users, Wallet, MessageSquare, Layers, Globe } from "lucide-react";
import { useState } from "react";

export default function ScrollsPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <FractureShell>
      <HeroPanel
        title="Scrolls"
        subtitle="Documentation, lore, and knowledge repository"
      />

      <div className="space-y-6">
        {/* Quick Access Links */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            href="/docs"
            className="group p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                <BookOpen className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">
                  Legacy Docs
                </h3>
                <p className="text-xs text-zinc-400">
                  Access old documentation structure
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            href="/docs/api"
            className="group p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-fuchsia-500/30 transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/30">
                <Zap className="h-5 w-5 text-fuchsia-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">
                  API Reference
                </h3>
                <p className="text-xs text-zinc-400">
                  JSON-RPC & GraphQL APIs
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-fuchsia-400 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            href="/docs/system"
            className="group p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-purple-500/30 transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                <Settings className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">
                  System Docs
                </h3>
                <p className="text-xs text-zinc-400">
                  Node operations & deployment
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </div>

        {/* User Documentation */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
          <button
            onClick={() => toggleSection("user")}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-cyan-400" />
              <h2 className="text-xl font-semibold text-zinc-100">User Documentation</h2>
            </div>
            <ArrowRight
              className={`h-5 w-5 text-zinc-400 transition-transform ${
                expandedSection === "user" ? "rotate-90" : ""
              }`}
            />
          </button>

          {expandedSection === "user" && (
            <div className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Link
                  href="/docs/analytics"
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-cyan-500/30 transition-all"
                >
                  <h3 className="font-semibold text-zinc-100 mb-2">Profile Analytics</h3>
                  <p className="text-sm text-zinc-400">
                    Track your contribution to the network, view metrics, and understand your impact.
                  </p>
                </Link>

                <Link
                  href="/docs/chat"
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-cyan-500/30 transition-all"
                >
                  <h3 className="font-semibold text-zinc-100 mb-2">Chat & Social</h3>
                  <p className="text-sm text-zinc-400">
                    World Chat, Direct Messages, and the social layer of Demiurge.
                  </p>
                </Link>

                <Link
                  href="/docs/creators"
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-cyan-500/30 transition-all"
                >
                  <h3 className="font-semibold text-zinc-100 mb-2">Creators Handbook</h3>
                  <p className="text-sm text-zinc-400">
                    Guide for Archons: minting NFTs, listing in Abyss, earning CGT, and best practices.
                  </p>
                </Link>

                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <h3 className="font-semibold text-zinc-100 mb-2">My Void & Identity</h3>
                  <p className="text-sm text-zinc-400 mb-2">
                    UrgeID profiles (accessible via "My Void" in the portal), username registration, leveling system.
                  </p>
                  <ul className="text-xs text-zinc-500 space-y-1 list-disc list-inside">
                    <li>View your profile, level, and Syzygy score</li>
                    <li>Claim a globally unique username</li>
                    <li>Manage your CGT wallet and transaction history</li>
                    <li>Track your leveling progress and CGT rewards</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Developer Documentation */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
          <button
            onClick={() => toggleSection("developer")}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <Code className="h-6 w-6 text-fuchsia-400" />
              <h2 className="text-xl font-semibold text-zinc-100">Developer Documentation</h2>
            </div>
            <ArrowRight
              className={`h-5 w-5 text-zinc-400 transition-transform ${
                expandedSection === "developer" ? "rotate-90" : ""
              }`}
            />
          </button>

          {expandedSection === "developer" && (
            <div className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Link
                  href="/docs/developers/getting-started"
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-fuchsia-500/30 transition-all"
                >
                  <h3 className="font-semibold text-zinc-100 mb-2">Getting Started</h3>
                  <p className="text-sm text-zinc-400">
                    Introduction to the Developer Registry, registration, and project management.
                  </p>
                </Link>

                <Link
                  href="/docs/developers/sdk-ts"
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-fuchsia-500/30 transition-all"
                >
                  <h3 className="font-semibold text-zinc-100 mb-2">TypeScript SDK</h3>
                  <p className="text-sm text-zinc-400">
                    High-level TypeScript interface for building dApps on Demiurge.
                  </p>
                </Link>

                <Link
                  href="/docs/developers/sdk-rust"
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-fuchsia-500/30 transition-all"
                >
                  <h3 className="font-semibold text-zinc-100 mb-2">Rust SDK</h3>
                  <p className="text-sm text-zinc-400">
                    Server-side tools and integration for building on Demiurge.
                  </p>
                </Link>

                <Link
                  href="/docs/developers/templates"
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-fuchsia-500/30 transition-all"
                >
                  <h3 className="font-semibold text-zinc-100 mb-2">Developer Templates</h3>
                  <p className="text-sm text-zinc-400">
                    Production-ready templates: Web App, Mobile App, Rust Service, Node Bot, Game Engine.
                  </p>
                </Link>

                <Link
                  href="/docs/developers/mobile"
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-fuchsia-500/30 transition-all"
                >
                  <h3 className="font-semibold text-zinc-100 mb-2">Mobile & Pocket Studio</h3>
                  <p className="text-sm text-zinc-400">
                    Mobile-first design, PWA support, and the upcoming Pocket Studio native app.
                  </p>
                </Link>

                <Link
                  href="/docs/developers/dev-capsules"
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-fuchsia-500/30 transition-all"
                >
                  <h3 className="font-semibold text-zinc-100 mb-2">Dev Capsules</h3>
                  <p className="text-sm text-zinc-400">
                    Project-bound execution environments tracked on-chain.
                  </p>
                </Link>

                <Link
                  href="/docs/developers/recursion"
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-fuchsia-500/30 transition-all"
                >
                  <h3 className="font-semibold text-zinc-100 mb-2">Recursion Engine</h3>
                  <p className="text-sm text-zinc-400">
                    Chain-native game engine for creating sovereign worlds.
                  </p>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* System Documentation */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
          <button
            onClick={() => toggleSection("system")}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-zinc-100">System & Operations</h2>
            </div>
            <ArrowRight
              className={`h-5 w-5 text-zinc-400 transition-transform ${
                expandedSection === "system" ? "rotate-90" : ""
              }`}
            />
          </button>

          {expandedSection === "system" && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <h3 className="font-semibold text-zinc-100 mb-2">Chain Node Operations</h3>
                <p className="text-sm text-zinc-400 mb-3">
                  Technical documentation for system administrators and operators running Demiurge infrastructure.
                </p>
                <ul className="text-xs text-zinc-500 space-y-1 list-disc list-inside">
                  <li>Installation and building</li>
                  <li>Configuration (data directory, RPC endpoint)</li>
                  <li>Running in development and production modes</li>
                  <li>Service management (systemd, PM2)</li>
                  <li>Monitoring and logging</li>
                </ul>
                <Link
                  href="/docs/system"
                  className="mt-3 inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
                >
                  View Full Documentation <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Architecture & Concepts */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
          <button
            onClick={() => toggleSection("architecture")}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <Layers className="h-6 w-6 text-cyan-400" />
              <h2 className="text-xl font-semibold text-zinc-100">Architecture & Concepts</h2>
            </div>
            <ArrowRight
              className={`h-5 w-5 text-zinc-400 transition-transform ${
                expandedSection === "architecture" ? "rotate-90" : ""
              }`}
            />
          </button>

          {expandedSection === "architecture" && (
            <div className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <h3 className="font-semibold text-zinc-100 mb-2">Core Concepts</h3>
                  <ul className="text-sm text-zinc-400 space-y-2">
                    <li>
                      <strong className="text-zinc-200">UrgeID (My Void):</strong> Sovereign identity with username, Syzygy score, leveling system
                    </li>
                    <li>
                      <strong className="text-zinc-200">Archons:</strong> Creators who can mint D-GEN NFTs
                    </li>
                    <li>
                      <strong className="text-zinc-200">CGT:</strong> Creator God Token (native currency, 8 decimals, 1B max supply)
                    </li>
                    <li>
                      <strong className="text-zinc-200">Fabric:</strong> P2P content network for immutable content roots
                    </li>
                    <li>
                      <strong className="text-zinc-200">Abyss:</strong> Marketplace and GraphQL Gateway for chat/social
                    </li>
                    <li>
                      <strong className="text-zinc-200">D-GEN NFTs:</strong> AI-native NFTs with provenance tracking
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <h3 className="font-semibold text-zinc-100 mb-2">System Architecture</h3>
                  <ul className="text-sm text-zinc-400 space-y-2">
                    <li>
                      <strong className="text-zinc-200">Blockchain Node:</strong> Rust-based L1 with PoW (Forge), RocksDB state
                    </li>
                    <li>
                      <strong className="text-zinc-200">Runtime Modules:</strong> bank_cgt, urgeid_registry, nft_dgen, fabric_manager, abyss_registry
                    </li>
                    <li>
                      <strong className="text-zinc-200">Portal Web:</strong> Next.js 15+ with UrgeID onboarding, chat, marketplace
                    </li>
                    <li>
                      <strong className="text-zinc-200">Abyss Gateway:</strong> GraphQL API for chat system and social features
                    </li>
                    <li>
                      <strong className="text-zinc-200">JSON-RPC:</strong> Chain node API at http://127.0.0.1:8545/rpc
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Start Guide */}
        <div className="p-6 bg-gradient-to-r from-cyan-500/10 to-fuchsia-500/10 border border-cyan-500/20 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-6 w-6 text-cyan-400" />
            <h2 className="text-xl font-semibold text-zinc-100">Quick Start Guide</h2>
          </div>
          <div className="space-y-3 text-sm text-zinc-400">
            <div>
              <h3 className="font-semibold text-zinc-200 mb-2">1. Start the Chain</h3>
              <code className="block p-2 bg-black/30 rounded text-xs text-cyan-300 font-mono">
                cargo run -p demiurge-chain
              </code>
              <p className="text-xs text-zinc-500 mt-1">Initializes RocksDB, Genesis Archon (1M CGT), starts RPC on port 8545</p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-200 mb-2">2. Start the Portal</h3>
              <code className="block p-2 bg-black/30 rounded text-xs text-cyan-300 font-mono">
                cd apps/portal-web && pnpm dev
              </code>
              <p className="text-xs text-zinc-500 mt-1">Portal available at http://localhost:3000</p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-200 mb-2">3. Start Abyss Gateway</h3>
              <code className="block p-2 bg-black/30 rounded text-xs text-cyan-300 font-mono">
                cd indexer/abyss-gateway && pnpm dev
              </code>
              <p className="text-xs text-zinc-500 mt-1">GraphQL API available at http://localhost:4000/graphql</p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-200 mb-2">4. Create Your UrgeID</h3>
              <p className="text-xs">Visit the portal, click "Create your UrgeID", generate keypair, set username, start earning Syzygy!</p>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-6 bg-gradient-to-r from-cyan-500/10 to-fuchsia-500/10 border border-cyan-500/20 rounded-xl">
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">
            About Scrolls
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Scrolls is the repository of all knowledge within the Demiurge ecosystem. Here you can find
            technical documentation, learn how to build on the chain, explore system architecture,
            and access all resources needed to understand and contribute to the sovereign digital pantheon.
            All documentation from previous versions has been preserved and organized here for easy access.
          </p>
        </div>
      </div>
    </FractureShell>
  );
}
