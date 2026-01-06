/**
 * App Marketplace Application
 * 
 * Browse, install, and manage applications in AbyssOS
 */

import { useState, useEffect } from 'react';
import { useDesktopStore } from '../../../state/desktopStore';
import { useAbyssID } from '../../../hooks/useAbyssID';

interface AppListing {
  id: string;
  name: string;
  description: string;
  author: {
    username: string;
    address: string;
  };
  version: string;
  category: string;
  icon: string;
  screenshots: string[];
  rating: number;
  installs: number;
  installed: boolean;
  manifest: any;
}

export function AppMarketplaceApp() {
  const { session } = useAbyssID();
  const { openApp } = useDesktopStore();
  const [apps, setApps] = useState<AppListing[]>([]);
  const [selectedApp, setSelectedApp] = useState<AppListing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const categories = ['all', 'blockchain', 'media', 'productivity', 'development', 'network', 'systems'];

  useEffect(() => {
    // Load apps from API (in production, fetch from server)
    loadApps();
  }, []);

  const loadApps = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockApps: AppListing[] = [
        {
          id: 'wallet',
          name: 'Abyss Wallet',
          description: 'Manage your CGT and NFTs',
          author: { username: 'demiurge', address: '0x...' },
          version: '1.0.0',
          category: 'blockchain',
          icon: '💼',
          screenshots: [],
          rating: 4.8,
          installs: 1234,
          installed: true,
          manifest: {},
        },
        {
          id: 'block-explorer',
          name: 'Block Explorer',
          description: 'Explore the Demiurge blockchain',
          author: { username: 'demiurge', address: '0x...' },
          version: '1.0.0',
          category: 'blockchain',
          icon: '🔍',
          screenshots: [],
          rating: 4.6,
          installs: 890,
          installed: true,
          manifest: {},
        },
        // Add more apps...
      ];
      setApps(mockApps);
      setLoading(false);
    }, 1000);
  };

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || app.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = async (app: AppListing) => {
    if (!session) {
      alert('Please log in to install apps');
      return;
    }
    
    // In production, this would:
    // 1. Download app files
    // 2. Install dependencies
    // 3. Register in AbyssOS
    // 4. Update installed status
    
    setApps(prev => prev.map(a => 
      a.id === app.id ? { ...a, installed: true } : a
    ));
    alert(`"${app.name}" installed successfully!`);
  };

  const handleUninstall = async (app: AppListing) => {
    if (!confirm(`Uninstall "${app.name}"?`)) return;
    
    setApps(prev => prev.map(a => 
      a.id === app.id ? { ...a, installed: false } : a
    ));
    alert(`"${app.name}" uninstalled`);
  };

  const handleOpen = (app: AppListing) => {
    if (app.installed) {
      openApp(app.id as any);
    } else {
      alert('Please install the app first');
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-abyss-dark text-white flex items-center justify-center">
        <div className="text-abyss-cyan">Loading marketplace...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-abyss-dark text-white flex flex-col">
      {/* Header */}
      <div className="h-16 bg-abyss-navy/50 border-b border-abyss-cyan/20 flex items-center justify-between px-6">
        <h2 className="text-xl font-bold text-abyss-cyan">App Marketplace</h2>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded text-sm w-64"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-abyss-dark border border-abyss-cyan/30 rounded text-sm"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* App List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredApps.map(app => (
              <div
                key={app.id}
                className="p-4 bg-abyss-navy/30 border border-abyss-cyan/20 rounded-lg hover:border-abyss-cyan/40 transition-colors cursor-pointer"
                onClick={() => setSelectedApp(app)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-4xl">{app.icon}</div>
                  <div className="flex-1">
                    <div className="font-semibold">{app.name}</div>
                    <div className="text-xs text-gray-400">v{app.version}</div>
                  </div>
                  {app.installed && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Installed</span>
                  )}
                </div>
                <div className="text-sm text-gray-300 mb-3 line-clamp-2">{app.description}</div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>⭐ {app.rating}</span>
                  <span>📥 {app.installs}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* App Details Sidebar */}
        {selectedApp && (
          <div className="w-96 bg-abyss-navy/40 border-l border-abyss-cyan/20 p-6 overflow-y-auto">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">{selectedApp.icon}</div>
              <div>
                <h3 className="text-xl font-bold">{selectedApp.name}</h3>
                <div className="text-sm text-gray-400">by @{selectedApp.author.username}</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-1">Description</div>
              <div className="text-sm">{selectedApp.description}</div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-1">Details</div>
              <div className="text-xs space-y-1">
                <div>Version: {selectedApp.version}</div>
                <div>Category: {selectedApp.category}</div>
                <div>Rating: ⭐ {selectedApp.rating}</div>
                <div>Installs: {selectedApp.installs}</div>
              </div>
            </div>

            <div className="flex gap-2">
              {selectedApp.installed ? (
                <>
                  <button
                    onClick={() => handleOpen(selectedApp)}
                    className="flex-1 px-4 py-2 bg-abyss-cyan/20 hover:bg-abyss-cyan/30 rounded text-sm"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleUninstall(selectedApp)}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded text-sm"
                  >
                    Uninstall
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleInstall(selectedApp)}
                  disabled={!session}
                  className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 rounded text-sm disabled:opacity-50"
                >
                  Install
                </button>
              )}
            </div>

            {session && (
              <div className="mt-6 pt-6 border-t border-abyss-cyan/20">
                <button
                  onClick={() => openApp('craft')}
                  className="w-full px-4 py-2 bg-abyss-cyan/20 hover:bg-abyss-cyan/30 rounded text-sm"
                >
                  Create Your Own App
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
