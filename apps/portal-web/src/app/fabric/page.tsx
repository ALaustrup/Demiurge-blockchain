"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Sparkles, 
  User, 
  Calendar,
  Grid3x3,
  X,
  ExternalLink,
  Heart,
  Eye,
  Grid2x2,
  LayoutGrid
} from "lucide-react";

type FabricAsset = {
  id: number;
  name: string;
  creator: string;
  creatorUsername: string;
  description: string;
  category: "art" | "music" | "game" | "code" | "world" | "plugin";
  fabricHash: string;
  createdAt: string;
  views: number;
  likes: number;
  color: string;
  gradient: string;
  icon: string;
};

// 20 Mock Fabric Assets
const mockAssets: FabricAsset[] = [
  {
    id: 1,
    name: "Cosmic Nebula #001",
    creator: "0x" + "a".repeat(62),
    creatorUsername: "stardust",
    description: "An ethereal digital painting exploring the depths of space and consciousness",
    category: "art",
    fabricHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    createdAt: "2024-01-15",
    views: 1247,
    likes: 89,
    color: "from-purple-500 to-pink-500",
    gradient: "bg-gradient-to-br from-purple-500/20 to-pink-500/20",
    icon: "🎨"
  },
  {
    id: 2,
    name: "Synthetic Dreams",
    creator: "0x" + "b".repeat(62),
    creatorUsername: "neural",
    description: "AI-generated ambient soundscape blending organic and electronic elements",
    category: "music",
    fabricHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    createdAt: "2024-01-18",
    views: 892,
    likes: 156,
    color: "from-blue-500 to-cyan-500",
    gradient: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20",
    icon: "🎵"
  },
  {
    id: 3,
    name: "Void Runner",
    creator: "0x" + "c".repeat(62),
    creatorUsername: "gameforge",
    description: "Endless runner set in a procedurally generated void dimension",
    category: "game",
    fabricHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    createdAt: "2024-01-20",
    views: 2156,
    likes: 234,
    color: "from-orange-500 to-red-500",
    gradient: "bg-gradient-to-br from-orange-500/20 to-red-500/20",
    icon: "🎮"
  },
  {
    id: 4,
    name: "Quantum State Manager",
    creator: "0x" + "d".repeat(62),
    creatorUsername: "devcore",
    description: "TypeScript library for managing quantum-inspired state in React applications",
    category: "code",
    fabricHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    createdAt: "2024-01-22",
    views: 567,
    likes: 45,
    color: "from-green-500 to-emerald-500",
    gradient: "bg-gradient-to-br from-green-500/20 to-emerald-500/20",
    icon: "💻"
  },
  {
    id: 5,
    name: "Ethereal Gardens",
    creator: "0x" + "e".repeat(62),
    creatorUsername: "worldweaver",
    description: "Immersive 3D world with interactive flora and fauna",
    category: "world",
    fabricHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    createdAt: "2024-01-25",
    views: 3456,
    likes: 412,
    color: "from-emerald-500 to-teal-500",
    gradient: "bg-gradient-to-br from-emerald-500/20 to-teal-500/20",
    icon: "🌍"
  },
  {
    id: 6,
    name: "Neural Paint Pro",
    creator: "0x" + "f".repeat(62),
    creatorUsername: "toolsmith",
    description: "Advanced image processing plugin with AI-powered filters",
    category: "plugin",
    fabricHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    createdAt: "2024-01-28",
    views: 1789,
    likes: 123,
    color: "from-violet-500 to-purple-500",
    gradient: "bg-gradient-to-br from-violet-500/20 to-purple-500/20",
    icon: "🔌"
  },
  {
    id: 7,
    name: "Chromatic Flux",
    creator: "0x" + "1".repeat(62),
    creatorUsername: "colorist",
    description: "Dynamic color palette generator using fractal mathematics",
    category: "art",
    fabricHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    createdAt: "2024-02-01",
    views: 987,
    likes: 78,
    color: "from-rose-500 to-pink-500",
    gradient: "bg-gradient-to-br from-rose-500/20 to-pink-500/20",
    icon: "🎨"
  },
  {
    id: 8,
    name: "Digital Rain",
    creator: "0x" + "2".repeat(62),
    creatorUsername: "soundscape",
    description: "Generative music piece that evolves based on listener interaction",
    category: "music",
    fabricHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    createdAt: "2024-02-03",
    views: 1456,
    likes: 198,
    color: "from-indigo-500 to-blue-500",
    gradient: "bg-gradient-to-br from-indigo-500/20 to-blue-500/20",
    icon: "🎵"
  },
  {
    id: 9,
    name: "Puzzle Dimensions",
    creator: "0x" + "3".repeat(62),
    creatorUsername: "puzzlemaster",
    description: "Multi-dimensional puzzle game with physics-based mechanics",
    category: "game",
    fabricHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    createdAt: "2024-02-05",
    views: 2341,
    likes: 267,
    color: "from-yellow-500 to-orange-500",
    gradient: "bg-gradient-to-br from-yellow-500/20 to-orange-500/20",
    icon: "🎮"
  },
  {
    id: 10,
    name: "Blockchain Explorer SDK",
    creator: "0x" + "4".repeat(62),
    creatorUsername: "blockdev",
    description: "Comprehensive SDK for building blockchain explorers and dashboards",
    category: "code",
    fabricHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    createdAt: "2024-02-08",
    views: 678,
    likes: 56,
    color: "from-cyan-500 to-teal-500",
    gradient: "bg-gradient-to-br from-cyan-500/20 to-teal-500/20",
    icon: "💻"
  },
  {
    id: 11,
    name: "Crystal Caverns",
    creator: "0x" + "5".repeat(62),
    creatorUsername: "crystal",
    description: "Exploration world featuring procedurally generated crystal formations",
    category: "world",
    fabricHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    createdAt: "2024-02-10",
    views: 2890,
    likes: 345,
    color: "from-cyan-500 to-blue-500",
    gradient: "bg-gradient-to-br from-cyan-500/20 to-blue-500/20",
    icon: "🌍"
  },
  {
    id: 12,
    name: "Audio Visualizer Pro",
    creator: "0x" + "6".repeat(62),
    creatorUsername: "audioviz",
    description: "Real-time audio visualization plugin with customizable effects",
    category: "plugin",
    fabricHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    createdAt: "2024-02-12",
    views: 1123,
    likes: 89,
    color: "from-pink-500 to-rose-500",
    gradient: "bg-gradient-to-br from-pink-500/20 to-rose-500/20",
    icon: "🔌"
  },
  {
    id: 13,
    name: "Abstract Geometry",
    creator: "0x" + "7".repeat(62),
    creatorUsername: "geometric",
    description: "Minimalist art series exploring geometric forms and negative space",
    category: "art",
    fabricHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    createdAt: "2024-02-14",
    views: 1567,
    likes: 134,
    color: "from-slate-500 to-zinc-500",
    gradient: "bg-gradient-to-br from-slate-500/20 to-zinc-500/20",
    icon: "🎨"
  },
  {
    id: 14,
    name: "Ambient Echoes",
    creator: "0x" + "8".repeat(62),
    creatorUsername: "echo",
    description: "Meditative soundscape with layered ambient textures",
    category: "music",
    fabricHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    createdAt: "2024-02-16",
    views: 2034,
    likes: 223,
    color: "from-teal-500 to-green-500",
    gradient: "bg-gradient-to-br from-teal-500/20 to-green-500/20",
    icon: "🎵"
  },
  {
    id: 15,
    name: "Rogue Protocol",
    creator: "0x" + "9".repeat(62),
    creatorUsername: "rogue",
    description: "Roguelike dungeon crawler with permadeath and procedural generation",
    category: "game",
    fabricHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    createdAt: "2024-02-18",
    views: 3124,
    likes: 456,
    color: "from-red-500 to-orange-500",
    gradient: "bg-gradient-to-br from-red-500/20 to-orange-500/20",
    icon: "🎮"
  },
  {
    id: 16,
    name: "Web3 Auth Library",
    creator: "0x" + "a".repeat(62),
    creatorUsername: "authdev",
    description: "Universal authentication library for Web3 applications",
    category: "code",
    fabricHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    createdAt: "2024-02-20",
    views: 1456,
    likes: 167,
    color: "from-blue-500 to-indigo-500",
    gradient: "bg-gradient-to-br from-blue-500/20 to-indigo-500/20",
    icon: "💻"
  },
  {
    id: 17,
    name: "Floating Islands",
    creator: "0x" + "b".repeat(62),
    creatorUsername: "skyworld",
    description: "Fantasy world with floating islands and aerial exploration",
    category: "world",
    fabricHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    createdAt: "2024-02-22",
    views: 2678,
    likes: 312,
    color: "from-sky-500 to-blue-500",
    gradient: "bg-gradient-to-br from-sky-500/20 to-blue-500/20",
    icon: "🌍"
  },
  {
    id: 18,
    name: "Shader Pack Collection",
    creator: "0x" + "c".repeat(62),
    creatorUsername: "shader",
    description: "Collection of advanced shader effects for real-time rendering",
    category: "plugin",
    fabricHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    createdAt: "2024-02-24",
    views: 1890,
    likes: 145,
    color: "from-purple-500 to-violet-500",
    gradient: "bg-gradient-to-br from-purple-500/20 to-violet-500/20",
    icon: "🔌"
  },
  {
    id: 19,
    name: "Digital Mandala",
    creator: "0x" + "d".repeat(62),
    creatorUsername: "mandala",
    description: "Intricate digital mandala with fractal patterns and sacred geometry",
    category: "art",
    fabricHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    createdAt: "2024-02-26",
    views: 2234,
    likes: 289,
    color: "from-amber-500 to-yellow-500",
    gradient: "bg-gradient-to-br from-amber-500/20 to-yellow-500/20",
    icon: "🎨"
  },
  {
    id: 20,
    name: "Synthetic Orchestra",
    creator: "0x" + "e".repeat(62),
    creatorUsername: "symphony",
    description: "AI-composed orchestral piece blending classical and electronic elements",
    category: "music",
    fabricHash: "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join(""),
    createdAt: "2024-02-28",
    views: 3456,
    likes: 423,
    color: "from-rose-500 to-pink-500",
    gradient: "bg-gradient-to-br from-rose-500/20 to-pink-500/20",
    icon: "🎵"
  },
];

type ViewMode = "grid" | "masonry";
type CardSize = "small" | "medium" | "large";

export default function FabricPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [cardSize, setCardSize] = useState<CardSize>("small");
  const [selectedAsset, setSelectedAsset] = useState<FabricAsset | null>(null);
  const [likedAssets, setLikedAssets] = useState<Set<number>>(new Set());

  const categories = ["art", "music", "game", "code", "world", "plugin"] as const;

  const filteredAssets = useMemo(() => {
    return mockAssets.filter((asset) => {
      const matchesSearch = 
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.creatorUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || asset.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const toggleLike = (assetId: number) => {
    setLikedAssets((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  };

  return (
    <div className="w-full overflow-x-hidden">
      <main className="min-h-screen bg-zinc-950 w-full">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-1.5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <Grid3x3 className="h-8 w-8 text-rose-400" />
                <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-violet-400 bg-clip-text text-transparent animate-color-shift">
                  Fabric
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Explore on-chain creative assets and works from the Demiurge ecosystem
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => setCardSize("large")}
                  className={`p-2 rounded transition-colors ${
                    cardSize === "large"
                      ? "bg-rose-500/20 text-rose-400"
                      : "text-zinc-400 hover:text-zinc-300"
                  }`}
                  title="Large (4 per row)"
                >
                  <Grid2x2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCardSize("medium")}
                  className={`p-2 rounded transition-colors ${
                    cardSize === "medium"
                      ? "bg-rose-500/20 text-rose-400"
                      : "text-zinc-400 hover:text-zinc-300"
                  }`}
                  title="Medium (6 per row)"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCardSize("small")}
                  className={`p-2 rounded transition-colors ${
                    cardSize === "small"
                      ? "bg-rose-500/20 text-rose-400"
                      : "text-zinc-400 hover:text-zinc-300"
                  }`}
                  title="Small (9 per row)"
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search assets, creators, descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? "bg-rose-500 text-white"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    selectedCategory === cat
                      ? "bg-rose-500 text-white"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="w-full" style={{ marginTop: '0' }}>
        {filteredAssets.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="h-16 w-16 mx-auto text-zinc-700 mb-4" />
            <p className="text-xl text-zinc-400">No assets found</p>
            <p className="text-sm text-zinc-500 mt-2">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === "masonry" ? (
          <div className={`columns-1 gap-1 w-full ${
            cardSize === "small" 
              ? "sm:columns-6 md:columns-9"
              : cardSize === "medium"
              ? "sm:columns-4 md:columns-6"
              : "sm:columns-2 md:columns-4"
          }`}>
            {filteredAssets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="mb-1 break-inside-avoid"
              >
                <AssetCard
                  asset={asset}
                  isLiked={likedAssets.has(asset.id)}
                  onLike={() => toggleLike(asset.id)}
                  onClick={() => setSelectedAsset(asset)}
                  size={cardSize}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className={`grid gap-0.5 w-full ${
            cardSize === "small"
              ? "grid-cols-3 sm:grid-cols-6 md:grid-cols-9"
              : cardSize === "medium"
              ? "grid-cols-2 sm:grid-cols-4 md:grid-cols-6"
              : "grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
          }`} style={{ maxWidth: '100vw', width: '100%' }}>
            {filteredAssets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                className="w-full min-w-0"
              >
                <AssetCard
                  asset={asset}
                  isLiked={likedAssets.has(asset.id)}
                  onLike={() => toggleLike(asset.id)}
                  onClick={() => setSelectedAsset(asset)}
                  size={cardSize}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Asset Detail Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedAsset(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900"
            >
              <button
                onClick={() => setSelectedAsset(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className={`h-64 ${selectedAsset.gradient} relative overflow-hidden`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-8xl">{selectedAsset.icon}</span>
                </div>
                <div className={`absolute inset-0 bg-gradient-to-t ${selectedAsset.color} opacity-20`} />
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-50 mb-2">{selectedAsset.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <User className="h-4 w-4" />
                      <span>@{selectedAsset.creatorUsername}</span>
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs capitalize">
                        {selectedAsset.category}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleLike(selectedAsset.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      likedAssets.has(selectedAsset.id)
                        ? "text-rose-400 bg-rose-500/20"
                        : "text-zinc-400 bg-zinc-800 hover:bg-zinc-700"
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${likedAssets.has(selectedAsset.id) ? "fill-current" : ""}`} />
                  </button>
                </div>

                <p className="text-zinc-300 mb-6">{selectedAsset.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
                      <Eye className="h-4 w-4" />
                      Views
                    </div>
                    <div className="text-xl font-semibold text-zinc-50">{selectedAsset.views.toLocaleString()}</div>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-1">
                      <Heart className="h-4 w-4" />
                      Likes
                    </div>
                    <div className="text-xl font-semibold text-zinc-50">{selectedAsset.likes.toLocaleString()}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Fabric Hash</span>
                    <code className="text-zinc-300 font-mono text-xs">{selectedAsset.fabricHash.slice(0, 16)}...</code>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Created</span>
                    <span className="text-zinc-300">{new Date(selectedAsset.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Creator Address</span>
                    <code className="text-zinc-300 font-mono text-xs">{selectedAsset.creator.slice(0, 12)}...</code>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors">
                    <ExternalLink className="h-4 w-4" />
                    View on Chain
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-colors">
                    <Sparkles className="h-4 w-4" />
                    View in Abyss
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
}

function AssetCard({
  asset,
  isLiked,
  onLike,
  onClick,
  size = "medium" as CardSize,
}: {
  asset: FabricAsset;
  isLiked: boolean;
  onLike: () => void;
  onClick: () => void;
  size?: CardSize;
}) {
  const sizeClasses = {
    small: {
      container: "rounded-none",
      preview: "h-32",
      icon: "text-3xl",
      padding: "p-2",
      title: "text-xs font-medium mb-1 line-clamp-1",
      meta: "text-[10px] gap-1",
      description: "hidden",
      likeButton: "top-1.5 right-1.5 p-1",
      likeIcon: "h-3 w-3",
      overlay: "p-2",
      stats: "text-[10px] gap-2",
      statsIcon: "h-2.5 w-2.5",
    },
    medium: {
      container: "rounded-none",
      preview: "h-48",
      icon: "text-5xl",
      padding: "p-2.5",
      title: "text-sm font-semibold mb-1 line-clamp-1",
      meta: "text-xs gap-1.5",
      description: "text-[10px] line-clamp-1",
      likeButton: "top-2 right-2 p-1.5",
      likeIcon: "h-3.5 w-3.5",
      overlay: "p-3",
      stats: "text-xs gap-2",
      statsIcon: "h-3 w-3",
    },
    large: {
      container: "rounded-none",
      preview: "h-64",
      icon: "text-6xl",
      padding: "p-3",
      title: "font-semibold mb-1 line-clamp-1",
      meta: "text-xs gap-2",
      description: "text-xs line-clamp-2",
      likeButton: "top-3 right-3 p-2",
      likeIcon: "h-4 w-4",
      overlay: "p-4",
      stats: "text-xs gap-3",
      statsIcon: "h-3 w-3",
    },
  };

  const classes = sizeClasses[size as CardSize];

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      className={`group relative ${classes.container} border-0 bg-zinc-900 overflow-hidden cursor-pointer w-full h-full flex flex-col`}
      onClick={onClick}
    >
      {/* Asset Preview */}
      <div className={`relative ${classes.preview} ${asset.gradient} overflow-hidden w-full`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${classes.icon} group-hover:scale-110 transition-transform duration-300`}>
            {asset.icon}
          </span>
        </div>
        <div className={`absolute inset-0 bg-gradient-to-t ${asset.color} opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
        
        {/* Overlay Info */}
        {size !== "small" && (
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className={`absolute bottom-0 left-0 right-0 ${classes.overlay}`}>
              <div className={`flex items-center justify-between ${classes.stats} text-zinc-300`}>
                <div className="flex items-center gap-1">
                  <Eye className={classes.statsIcon} />
                  {asset.views > 999 ? `${(asset.views / 1000).toFixed(1)}k` : asset.views}
                </div>
                <div className="flex items-center gap-1">
                  <Heart className={classes.statsIcon} />
                  {asset.likes > 999 ? `${(asset.likes / 1000).toFixed(1)}k` : asset.likes}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Like Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLike();
          }}
          className={`absolute ${classes.likeButton} rounded-full backdrop-blur-sm transition-all ${
            isLiked
              ? "bg-rose-500/80 text-white"
              : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800/80"
          }`}
        >
          <Heart className={`${classes.likeIcon} ${isLiked ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Asset Info */}
      {size !== "small" && (
        <div className={classes.padding}>
          <h3 className={`${classes.title} text-zinc-50 group-hover:text-rose-400 transition-colors`}>
            {asset.name}
          </h3>
          <div className={`flex items-center ${classes.meta} text-zinc-400 ${size === "medium" ? "mb-1" : "mb-2"}`}>
            <User className="h-3 w-3" />
            <span className="truncate">@{asset.creatorUsername}</span>
            {size === "large" && (
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 capitalize flex-shrink-0">
                {asset.category}
              </span>
            )}
          </div>
          {size === "large" && (
            <p className={classes.description}>{asset.description}</p>
          )}
        </div>
      )}

      {/* Small size: Compact info overlay */}
      {size === "small" && (
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/95 via-zinc-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <h3 className={`${classes.title} text-zinc-50 mb-0.5`}>{asset.name}</h3>
            <div className={`flex items-center ${classes.meta} text-zinc-500`}>
              <span className="truncate">@{asset.creatorUsername}</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

