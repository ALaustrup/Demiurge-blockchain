"use client";

import { FractureShell } from "@/components/fracture/FractureShell";
import { HeroPanel } from "@/components/fracture/HeroPanel";
import Link from "next/link";
import { ArrowRight, BookOpen, FileText, GraduationCap, Code, Settings, Database, Zap, Users, Wallet, MessageSquare, Layers, Globe, Shield, X } from "lucide-react";
import { useState } from "react";
import { RuntimeModulesDoc } from "@/components/docs/RuntimeModulesDoc";
import { AbyssIDAuthDoc } from "@/components/docs/AbyssIDAuthDoc";
import { AbyssIDDoc } from "@/components/docs/UrgeIDDoc";
import { ArchitectureDoc } from "@/components/docs/ArchitectureDoc";
import { SystemOpsDoc } from "@/components/docs/SystemOpsDoc";
import { APIDoc } from "@/components/docs/APIDoc";
import { CreatorsDoc } from "@/components/docs/CreatorsDoc";
import { ChatDoc } from "@/components/docs/ChatDoc";

export default function ScrollsPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string | null) => {
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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  Documentation Hub
                </h3>
                <p className="text-xs text-zinc-300">
                  Complete documentation index
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <div
            onClick={() => toggleSection("api")}
            className="group p-4 bg-black/20 border border-white/10 rounded-xl hover:bg-black/30 hover:border-fuchsia-500/30 transition-all duration-200 cursor-pointer"
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
                  JSON-RPC & GraphQL APIs (40+ methods)
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-fuchsia-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>

          <div
            onClick={() => toggleSection("runtime")}
            className="group p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-rose-500/30 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/30">
                <Database className="h-5 w-5 text-rose-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">
                  Runtime Modules
                </h3>
                <p className="text-xs text-zinc-300">
                  All 9 runtime modules documented
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>

          <Link
            href="/docs/system"
            className="group p-4 bg-black/20 border border-white/10 rounded-xl hover:bg-black/30 hover:border-purple-500/30 transition-all duration-200"
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
        <div className="p-6 bg-black/20 border border-white/10 rounded-xl">
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
                <div
                  onClick={() => toggleSection("analytics")}
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
                >
                  <h3 className="font-semibold text-zinc-100 mb-2">Profile Analytics</h3>
                  <p className="text-sm text-zinc-300">
                    Track your contribution to the network, view metrics, and understand your impact.
                  </p>
                </div>

                <div
                  onClick={() => toggleSection("chat")}
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
                >
                  <h3 className="font-semibold text-zinc-100 mb-2">Chat & Social</h3>
                  <p className="text-sm text-zinc-300">
                    World Chat, Direct Messages, and the social layer of Demiurge.
                  </p>
                </div>

                <div
                  onClick={() => toggleSection("creators")}
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
                >
                  <h3 className="font-semibold text-zinc-100 mb-2">Creators Handbook</h3>
                  <p className="text-sm text-zinc-300">
                    Guide for Archons: minting NFTs, listing in Abyss, earning CGT, and best practices.
                  </p>
                </div>

                <div
                  onClick={() => toggleSection("auth")}
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
                >
                  <h3 className="font-semibold text-zinc-100 mb-2">My Void & Identity</h3>
                  <p className="text-sm text-zinc-300 mb-2">
                    AbyssID profiles (accessible via "My Void" in the portal), username registration, leveling system.
                  </p>
                  <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
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

        {/* Sub-sections for user docs */}
        {expandedSection === "analytics" && (
          <div className="p-6 bg-black/20 border border-white/10 rounded-xl">
            <button
              onClick={() => toggleSection("user")}
              className="mb-4 text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
            >
              <ArrowRight className="h-4 w-4 rotate-180" /> Back to User Documentation
            </button>
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">Profile Analytics</h3>
              <div className="p-4 bg-black/20 border border-white/10 rounded-lg">
                <p className="text-sm text-zinc-300 mb-4">
                  Track your contribution to the Demiurge network through analytics and metrics.
                </p>
                <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside">
                  <li><strong className="text-zinc-100">Syzygy Score:</strong> Your contribution score for seeding/serving content</li>
                  <li><strong className="text-zinc-100">Level:</strong> Current level (1 + syzygy/1000)</li>
                  <li><strong className="text-zinc-100">CGT Earned:</strong> Total CGT earned from level-up rewards</li>
                  <li><strong className="text-zinc-100">Badges:</strong> Achievement markers (Luminary at 10K syzygy)</li>
                  <li><strong className="text-zinc-100">Transaction History:</strong> View all your on-chain transactions</li>
              </ul>
              <Link
                href="/docs/analytics"
                className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
              >
                View Full Analytics Docs <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
        
        {expandedSection === "chat" && (
          <div className="p-6 bg-black/20 border border-white/10 rounded-xl">
            <button
              onClick={() => toggleSection("user")}
              className="mb-4 text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
            >
              <ArrowRight className="h-4 w-4 rotate-180" /> Back to User Documentation
            </button>
            <ChatDoc />
          </div>
        )}
        
        {expandedSection === "creators" && (
          <div className="p-6 bg-black/20 border border-white/10 rounded-xl">
            <button
              onClick={() => toggleSection("user")}
              className="mb-4 text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
            >
              <ArrowRight className="h-4 w-4 rotate-180" /> Back to User Documentation
            </button>
            <CreatorsDoc />
          </div>
        )}

        {/* Developer Documentation */}
        <div className="p-6 bg-black/20 border border-white/10 rounded-xl">
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
                  <p className="text-sm text-zinc-300">
                    Introduction to the Developer Registry, registration, and project management.
                  </p>
                </Link>

                <Link
                  href="/docs/developers/sdk-ts"
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-fuchsia-500/30 transition-all"
                >
                  <h3 className="font-semibold text-zinc-100 mb-2">TypeScript SDK</h3>
                  <p className="text-sm text-zinc-300">
                    High-level TypeScript interface for building dApps on Demiurge.
                  </p>
                </Link>

                <Link
                  href="/docs/developers/sdk-rust"
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-fuchsia-500/30 transition-all"
                >
                  <h3 className="font-semibold text-zinc-100 mb-2">Rust SDK</h3>
                  <p className="text-sm text-zinc-300">
                    Server-side tools and integration for building on Demiurge.
                  </p>
                </Link>

                <Link
                  href="/docs/developers/templates"
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-fuchsia-500/30 transition-all"
                >
                  <h3 className="font-semibold text-zinc-100 mb-2">Developer Templates</h3>
                  <p className="text-sm text-zinc-300">
                    Production-ready templates: Web App, Mobile App, Rust Service, Node Bot, Game Engine.
                  </p>
                </Link>

                <Link
                  href="/docs/developers/mobile"
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-fuchsia-500/30 transition-all"
                >
                  <h3 className="font-semibold text-zinc-100 mb-2">Mobile & Pocket Studio</h3>
                  <p className="text-sm text-zinc-300">
                    Mobile-first design, PWA support, and the upcoming Pocket Studio native app.
                  </p>
                </Link>

                <Link
                  href="/docs/developers/dev-capsules"
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-fuchsia-500/30 transition-all"
                >
                  <h3 className="font-semibold text-zinc-100 mb-2">Dev Capsules</h3>
                  <p className="text-sm text-zinc-300">
                    Project-bound execution environments tracked on-chain.
                  </p>
                </Link>

                <Link
                  href="/docs/developers/recursion"
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-fuchsia-500/30 transition-all"
                >
                  <h3 className="font-semibold text-zinc-100 mb-2">Recursion Engine</h3>
                  <p className="text-sm text-zinc-300">
                    Chain-native game engine for creating sovereign worlds.
                  </p>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* System Documentation */}
        <div className="p-6 bg-black/20 border border-white/10 rounded-xl">
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
            <div className="mt-4">
              <SystemOpsDoc />
            </div>
          )}
        </div>

        {/* Architecture & Concepts */}
        <div className="p-6 bg-black/20 border border-white/10 rounded-xl">
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
            <div className="mt-4">
              <ArchitectureDoc />
            </div>
          )}
        </div>

        {/* Runtime Modules Documentation */}
        <div className="p-6 bg-black/20 border border-white/10 rounded-xl">
          <button
            onClick={() => toggleSection("runtime")}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-rose-400" />
              <h2 className="text-xl font-semibold text-zinc-100">Runtime Modules</h2>
            </div>
            <ArrowRight
              className={`h-5 w-5 text-zinc-400 transition-transform ${
                expandedSection === "runtime" ? "rotate-90" : ""
              }`}
            />
          </button>

          {expandedSection === "runtime" && (
            <div className="mt-4">
              <RuntimeModulesDoc />
            </div>
          )}
        </div>

        {/* Authentication & Identity */}
        <div className="p-6 bg-black/20 border border-white/10 rounded-xl">
          <button
            onClick={() => toggleSection("auth")}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-emerald-400" />
              <h2 className="text-xl font-semibold text-zinc-100">Authentication & Identity</h2>
            </div>
            <ArrowRight
              className={`h-5 w-5 text-zinc-400 transition-transform ${
                expandedSection === "auth" ? "rotate-90" : ""
              }`}
            />
          </button>

          {expandedSection === "auth" && (
            <div className="mt-4 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-100 mb-4">AbyssID Authentication</h3>
                <AbyssIDAuthDoc />
              </div>
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-lg font-semibold text-zinc-100 mb-4">AbyssID System</h3>
                <AbyssIDDoc />
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
          <div className="space-y-3 text-sm text-zinc-300">
            <div>
              <h3 className="font-semibold text-zinc-100 mb-2">1. Start the Chain</h3>
              <code className="block p-2 bg-black/30 rounded text-xs text-cyan-300 font-mono">
                cargo run -p demiurge-chain
              </code>
              <p className="text-xs text-zinc-400 mt-1">Initializes RocksDB, Genesis Archon (1M CGT), starts RPC on port 8545</p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 mb-2">2. Start the Portal</h3>
              <code className="block p-2 bg-black/30 rounded text-xs text-cyan-300 font-mono">
                cd apps/portal-web && pnpm dev
              </code>
              <p className="text-xs text-zinc-400 mt-1">Portal available at http://localhost:3000</p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 mb-2">3. Start Abyss Gateway</h3>
              <code className="block p-2 bg-black/30 rounded text-xs text-cyan-300 font-mono">
                cd indexer/abyss-gateway && pnpm dev
              </code>
              <p className="text-xs text-zinc-400 mt-1">GraphQL API available at http://localhost:4000/graphql</p>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 mb-2">4. Create Your AbyssID</h3>
              <p className="text-xs">Visit the portal, click "Create your AbyssID", generate keypair, set username, start earning Syzygy!</p>
            </div>
          </div>
        </div>

        {/* API Documentation */}
        {expandedSection === "api" && (
          <div className="p-6 bg-black/20 border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-zinc-100">API Reference</h2>
              <button
                onClick={() => toggleSection(null)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <APIDoc />
          </div>
        )}

        {/* Info Section */}
        <div className="p-6 bg-gradient-to-r from-cyan-500/10 to-fuchsia-500/10 border border-cyan-500/20 rounded-xl">
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">
            About Scrolls
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed">
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
