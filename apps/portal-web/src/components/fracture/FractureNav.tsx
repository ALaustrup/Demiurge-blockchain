"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Code, Network, BookOpen, Sparkles, Fingerprint } from "lucide-react";
import { useState } from "react";
import { AbyssIDDialog } from "./AbyssIDDialog";
import { AudioToggle } from "./AudioToggle";
import { GENESIS_CONFIG } from "@/config/genesis";
import { useOperator } from "@/lib/operator/OperatorContextProvider";

const navItems = [
  { href: "/haven", label: "Haven", icon: Home, description: "User home & profile" },
  { href: "/void", label: "Void", icon: Code, description: "Developer HQ" },
  { href: "/nexus", label: "Nexus", icon: Network, description: "P2P analytics & seeding" },
  { href: "/scrolls", label: "Scrolls", icon: BookOpen, description: "Docs & lore" },
  { href: "/conspire", label: "Conspire", icon: Sparkles, description: "AI/LLM interaction" },
];

export function FractureNav() {
  const pathname = usePathname();
  const [showAbyssID, setShowAbyssID] = useState(false);
  const { operator } = useOperator();

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo / Brand - DEMIURGE */}
            <Link
              href="/"
              className="text-2xl sm:text-3xl font-display text-zinc-200 hover:text-cyan-300 transition-all duration-300"
              style={{ 
                textShadow: "0 0 15px rgba(34, 211, 238, 0.4), 0 0 8px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)",
                letterSpacing: "0.2em",
                fontFamily: "var(--font-bebas), sans-serif",
                fontWeight: 400,
              }}
            >
              DEMIURGE
            </Link>

            {/* Navigation Items - Icons Only */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      relative flex items-center justify-center px-3 py-2 rounded-lg
                      transition-all duration-200 ease-in-out
                      ${isActive
                        ? "text-cyan-300 bg-white/5 border border-white/10"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                      }
                      group
                    `}
                    title={item.description}
                  >
                    <Icon className="h-5 w-5" />
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500/50" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right side: Operator Role + Genesis Mode Indicator + Audio Toggle + AbyssID */}
            <div className="flex items-center gap-3">
              {operator && (
                <span className={`text-xs font-medium ${
                  operator.role === "OBSERVER" ? "text-gray-400" :
                  operator.role === "OPERATOR" ? "text-blue-400" :
                  "text-purple-400"
                }`}>
                  {operator.role}
                </span>
              )}
              {GENESIS_CONFIG.enabled && (
                <span className="px-2 py-1 rounded bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 text-purple-300 text-xs font-medium">
                  GENESIS MODE
                </span>
              )}
              <AudioToggle />
              <button
                onClick={() => setShowAbyssID(true)}
                className="flex items-center justify-center px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:border-cyan-500/30 hover:text-cyan-300 transition-all duration-200"
                title="AbyssID"
              >
                <Fingerprint className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation - Icons Only */}
        <div className="md:hidden border-t border-white/10">
          <div className="flex items-center justify-around px-2 py-2 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center justify-center px-3 py-2 rounded-lg min-w-[44px]
                    transition-all duration-200
                    ${isActive
                      ? "text-cyan-300 bg-white/5"
                      : "text-zinc-500"
                    }
                  `}
                  title={item.description}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* AbyssID Dialog */}
      {showAbyssID && (
        <AbyssIDDialog
          open={showAbyssID}
          onClose={() => setShowAbyssID(false)}
        />
      )}
    </>
  );
}

