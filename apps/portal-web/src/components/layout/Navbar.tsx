"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Users, Sparkles, Cpu, Book, MessageSquare, Wallet } from "lucide-react";

const navItems = [
  { href: "/urgeid", label: "UrgeID", icon: Wallet, loggedInLabel: "My Void" },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/pantheon", label: "Pantheon", icon: Users },
  { href: "/creators", label: "Creators", icon: Sparkles },
  { href: "/technology", label: "Technology", icon: Cpu },
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
        <div className="flex h-16 items-center justify-between">
          <Link 
            href="/" 
            className="text-xl font-bold text-zinc-50 hover:text-rose-400 transition-colors duration-200"
          >
            DEMIURGE
          </Link>
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href);
              const Icon = item.icon;
              const displayLabel = isLoggedIn && item.loggedInLabel ? item.loggedInLabel : item.label;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200 ease-in-out
                    ${isActive
                      ? "text-rose-400 bg-zinc-900/50"
                      : "text-zinc-300 hover:text-rose-400 hover:bg-zinc-900/30"
                    }
                    group
                  `}
                >
                  <Icon className={`h-4 w-4 transition-transform duration-200 ${isActive ? "text-rose-400" : "text-zinc-400 group-hover:text-rose-400 group-hover:scale-110"}`} />
                  <span className="relative">
                    {displayLabel}
                    {!isActive && (
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-rose-400 to-pink-400 group-hover:w-full transition-all duration-300"></span>
                    )}
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

