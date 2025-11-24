"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Book, MessageSquare, Wallet, BarChart3, Store, Grid3x3, Code } from "lucide-react";

const navItems = [
  { href: "/urgeid", label: "UrgeID", icon: Wallet, loggedInLabel: "My Void" },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/fabric", label: "Fabric", icon: Grid3x3 },
  { href: "/developers", label: "Developers", icon: Code },
  { href: "/analytics", label: "Analytics", icon: BarChart3, loggedInOnly: true },
  { href: "/marketplace", label: "Abyss", icon: Store },
  { href: "/docs", label: "Docs", icon: Book },
];

export function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const storedAddress = localStorage.getItem("demiurge_urgeid_wallet_address");
    setIsLoggedIn(!!storedAddress);
    
    // Listen for storage changes (when user logs in/out)
    const handleStorageChange = () => {
      const address = localStorage.getItem("demiurge_urgeid_wallet_address");
      setIsLoggedIn(!!address);
    };
    
    window.addEventListener("storage", handleStorageChange);
    // Also check on focus in case localStorage was updated in same window
    window.addEventListener("focus", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleStorageChange);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link 
            href="/" 
            className="text-xl font-bold text-zinc-50 hover:text-rose-400 transition-colors duration-200 relative group"
          >
            <span className="relative inline-block">
              <span className="relative flex">
                {"DEMIURGE".split("").map((letter, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-purple-500 bg-clip-text text-transparent bg-[length:200%_200%] animate-gradient-shift-letter"
                    style={{
                      animationDelay: `${index * 0.5}s`,
                      animationDuration: '10s'
                    }}
                  >
                    {letter === " " ? "\u00A0" : letter}
                  </span>
                ))}
              </span>
            </span>
          </Link>
                  <div className="flex items-center space-x-2">
            {navItems.map((item) => {
              // Hide logged-in-only items if not logged in
              if ((item as any).loggedInOnly && !isLoggedIn) {
                return null;
              }
              
              const isActive = pathname === item.href || pathname?.startsWith(item.href);
              const Icon = item.icon;
              const displayLabel = isLoggedIn && item.loggedInLabel ? item.loggedInLabel : item.label;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    relative flex items-center justify-center px-3 py-2 rounded-lg
                    transition-all duration-200 ease-in-out
                    ${isActive
                      ? "text-rose-400 bg-zinc-900/50"
                      : "text-zinc-400 hover:text-rose-400 hover:bg-zinc-900/30"
                    }
                    group
                  `}
                >
                  <Icon className={`h-6 w-6 transition-all duration-200 ${isActive ? "text-rose-400" : "text-zinc-400 group-hover:text-rose-400 group-hover:scale-110"}`} />
                  <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-zinc-900 text-xs font-medium text-zinc-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 border border-zinc-800 shadow-lg">
                    {displayLabel}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-rose-400 to-pink-400"></span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

