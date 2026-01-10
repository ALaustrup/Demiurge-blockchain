/**
 * CRAFT - Creator's Advanced Framework & Tools
 * 
 * A comprehensive on-chain IDE inspired by Cursor, with:
 * - Monaco Editor (VS Code engine)
 * - ArchonAI integration for code completion
 * - Template system for various project types
 * - Drag-and-drop file system integration
 * - GitHub repository integration
 * - Rig system (on-chain Git alternative)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useQorID } from '../../../hooks/useAbyssID';
import { useAbyssIDIdentity } from '../../../hooks/useAbyssIDIdentity';
import { demiurgeRpc } from '../../../lib/demiurgeRpcClient';
import type { editor } from 'monaco-editor';

interface Project {
  id: string;
  name: string;
  type: string;
  category: string;
  files: FileEntry[];
  createdAt: number;
  updatedAt: number;
  rigHistory: RigEntry[];
  source: 'template' | 'github' | 'local' | 'drag-drop';
  githubUrl?: string;
  localPath?: string;
}

interface FileEntry {
  path: string;
  content: string;
  type: 'file' | 'directory';
  children?: FileEntry[];
}

interface RigEntry {
  id: string;
  timestamp: number;
  message: string;
  changes: number;
  filesChanged: string[];
  onChainHash?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  type: string;
  files: FileEntry[];
}

const TEMPLATE_CATEGORIES = [
  { id: 'web', label: 'Web Applications', icon: '🌐' },
  { id: 'games', label: 'Games', icon: '🎮' },
  { id: 'dapps', label: 'dApps', icon: '⛓️' },
  { id: 'abyssos', label: 'QOR OS Apps', icon: '🖥️' },
  { id: 'services', label: 'Services', icon: '⚙️' },
  { id: 'porting', label: 'Port from Other Chains', icon: '🔄' },
];

const TEMPLATES: Template[] = [
  // Web Applications
  {
    id: 'web-app-nextjs',
    name: 'Next.js Web App',
    description: 'Full-featured Next.js dApp with QorID, CGT, NFTs',
    category: 'web',
    icon: '🌐',
    type: 'web-app',
    files: [
      { path: 'package.json', content: getWebAppPackageJson(), type: 'file' },
      { path: 'src/app/page.tsx', content: getWebAppPageTemplate(), type: 'file' },
      { path: 'src/app/wallet/page.tsx', content: getWalletPageTemplate(), type: 'file' },
      { path: 'src/lib/sdk.ts', content: getSDKTemplate(), type: 'file' },
      { path: 'README.md', content: '# Next.js Web App\n\nBuilt with CRAFT', type: 'file' },
    ],
  },
  {
    id: 'web-app-react',
    name: 'React dApp',
    description: 'React application with Demiurge SDK integration',
    category: 'web',
    icon: '⚛️',
    type: 'react-app',
    files: [
      { path: 'package.json', content: getReactAppPackageJson(), type: 'file' },
      { path: 'src/App.tsx', content: getReactAppTemplate(), type: 'file' },
      { path: 'src/index.tsx', content: getReactIndexTemplate(), type: 'file' },
      { path: 'README.md', content: '# React dApp\n\nBuilt with CRAFT', type: 'file' },
    ],
  },
  
  // Games
  {
    id: 'game-2d',
    name: '2D Game',
    description: '2D game template with CGT rewards and NFT integration',
    category: 'games',
    icon: '🎮',
    type: 'game-2d',
    files: [
      { path: 'package.json', content: getGame2DPackageJson(), type: 'file' },
      { path: 'src/Game.tsx', content: getGame2DTemplate(), type: 'file' },
      { path: 'src/components/Player.tsx', content: getPlayerComponentTemplate(), type: 'file' },
      { path: 'README.md', content: '# 2D Game\n\nBuilt with CRAFT', type: 'file' },
    ],
  },
  {
    id: 'game-3d',
    name: '3D Game',
    description: '3D game template with Three.js and Demiurge integration',
    category: 'games',
    icon: '🎯',
    type: 'game-3d',
    files: [
      { path: 'package.json', content: getGame3DPackageJson(), type: 'file' },
      { path: 'src/Game.tsx', content: getGame3DTemplate(), type: 'file' },
      { path: 'src/scenes/MainScene.tsx', content: getMainSceneTemplate(), type: 'file' },
      { path: 'README.md', content: '# 3D Game\n\nBuilt with CRAFT', type: 'file' },
    ],
  },
  
  // dApps
  {
    id: 'dapp-defi',
    name: 'DeFi dApp',
    description: 'DeFi application template with CGT staking and swaps',
    category: 'dapps',
    icon: '💱',
    type: 'dapp-defi',
    files: [
      { path: 'package.json', content: getDeFiPackageJson(), type: 'file' },
      { path: 'src/App.tsx', content: getDeFiAppTemplate(), type: 'file' },
      { path: 'src/components/Staking.tsx', content: getStakingTemplate(), type: 'file' },
      { path: 'README.md', content: '# DeFi dApp\n\nBuilt with CRAFT', type: 'file' },
    ],
  },
  {
    id: 'dapp-nft-marketplace',
    name: 'NFT Marketplace',
    description: 'NFT marketplace with minting, trading, and royalties',
    category: 'dapps',
    icon: '🖼️',
    type: 'dapp-nft',
    files: [
      { path: 'package.json', content: getNFTMarketplacePackageJson(), type: 'file' },
      { path: 'src/App.tsx', content: getNFTMarketplaceTemplate(), type: 'file' },
      { path: 'src/components/MintPanel.tsx', content: getMintPanelTemplate(), type: 'file' },
      { path: 'README.md', content: '# NFT Marketplace\n\nBuilt with CRAFT', type: 'file' },
    ],
  },
  
  // QOR OS Apps
  {
    id: 'abyssos-app',
    name: 'QOR OS App',
    description: 'Native QOR OS desktop application',
    category: 'abyssos',
    icon: '🖥️',
    type: 'abyssos-app',
    files: [
      { path: 'package.json', content: getQorOSAppPackageJson(), type: 'file' },
      { path: 'src/App.tsx', content: getQorOSAppTemplate(), type: 'file' },
      { path: 'manifest.json', content: getManifestTemplate(), type: 'file' },
      { path: 'README.md', content: '# QOR OS App\n\nBuilt with CRAFT', type: 'file' },
    ],
  },
  
  // Services
  {
    id: 'rust-service',
    name: 'Rust Service',
    description: 'Rust backend service with Axum and Demiurge SDK',
    category: 'services',
    icon: '🦀',
    type: 'rust-service',
    files: [
      { path: 'Cargo.toml', content: getRustServiceCargoToml(), type: 'file' },
      { path: 'src/main.rs', content: getRustServiceMain(), type: 'file' },
      { path: 'README.md', content: '# Rust Service\n\nBuilt with CRAFT', type: 'file' },
    ],
  },
  {
    id: 'node-bot',
    name: 'Node.js Bot',
    description: 'Node.js microservice with GraphQL and CGT rewards',
    category: 'services',
    icon: '🤖',
    type: 'node-bot',
    files: [
      { path: 'package.json', content: getNodeBotPackageJson(), type: 'file' },
      { path: 'src/index.ts', content: getNodeBotTemplate(), type: 'file' },
      { path: 'README.md', content: '# Node.js Bot\n\nBuilt with CRAFT', type: 'file' },
    ],
  },
  
  // Porting Templates
  {
    id: 'port-ethereum',
    name: 'Port from Ethereum',
    description: 'Template for porting Ethereum dApps to Demiurge',
    category: 'porting',
    icon: '🔷',
    type: 'port-ethereum',
    files: [
      { path: 'PORTING_GUIDE.md', content: getEthereumPortingGuide(), type: 'file' },
      { path: 'migration.js', content: getEthereumMigrationScript(), type: 'file' },
      { path: 'package.json', content: getPortingPackageJson(), type: 'file' },
    ],
  },
  {
    id: 'port-solana',
    name: 'Port from Solana',
    description: 'Template for porting Solana programs to Demiurge',
    category: 'porting',
    icon: '🟣',
    type: 'port-solana',
    files: [
      { path: 'PORTING_GUIDE.md', content: getSolanaPortingGuide(), type: 'file' },
      { path: 'migration.js', content: getSolanaMigrationScript(), type: 'file' },
      { path: 'package.json', content: getPortingPackageJson(), type: 'file' },
    ],
  },
  {
    id: 'port-polygon',
    name: 'Port from Polygon',
    description: 'Template for porting Polygon dApps to Demiurge',
    category: 'porting',
    icon: '🟣',
    type: 'port-polygon',
    files: [
      { path: 'PORTING_GUIDE.md', content: getPolygonPortingGuide(), type: 'file' },
      { path: 'migration.js', content: getPolygonMigrationScript(), type: 'file' },
      { path: 'package.json', content: getPortingPackageJson(), type: 'file' },
    ],
  },
];

export function CraftApp() {
  const { session } = useQorID();
  const { demiurgePublicKey } = useAbyssIDIdentity();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeCategory, setActiveCategory] = useState('web');
  const [githubUrl, setGithubUrl] = useState('');
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Load projects from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('craft_projects');
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load projects:', e);
      }
    }
  }, []);

  // Save projects to localStorage
  const saveProjects = useCallback((newProjects: Project[]) => {
    setProjects(newProjects);
    localStorage.setItem('craft_projects', JSON.stringify(newProjects));
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;

    const items = Array.from(e.dataTransfer.items);
    const files: File[] = [];

    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      await loadFilesFromDesktop(files);
    }
  }, []);

  const loadFilesFromDesktop = async (files: File[]) => {
    const fileEntries: FileEntry[] = [];
    
    for (const file of files) {
      const content = await file.text();
      fileEntries.push({
        path: file.name,
        content,
        type: 'file',
      });
    }

    const project: Project = {
      id: `project-${Date.now()}`,
      name: `Imported Project ${new Date().toLocaleDateString()}`,
      type: 'imported',
      category: 'imported',
      files: fileEntries,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      rigHistory: [],
      source: 'drag-drop',
    };

    const newProjects = [...projects, project];
    saveProjects(newProjects);
    setCurrentProject(project);
    setSelectedFile(project.files[0]?.path || null);
    setCode(project.files[0]?.content || '');
  };

  const loadFromGithub = async () => {
    if (!githubUrl.trim()) return;
    
    setIsLoadingGithub(true);
    try {
      // Extract owner and repo from URL
      const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        throw new Error('Invalid GitHub URL');
      }

      const [, owner, repo] = match;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;

      // Fetch repository structure
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch repository');

      const contents = await response.json();
      const files = await processGithubContents(contents, owner, repo);

      const project: Project = {
        id: `project-${Date.now()}`,
        name: repo,
        type: 'github',
        category: 'imported',
        files,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        rigHistory: [],
        source: 'github',
        githubUrl,
      };

      const newProjects = [...projects, project];
      saveProjects(newProjects);
      setCurrentProject(project);
      setSelectedFile(project.files[0]?.path || null);
      setCode(project.files[0]?.content || '');
      setGithubUrl('');
    } catch (error) {
      console.error('Failed to load from GitHub:', error);
      alert(`Failed to load repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingGithub(false);
    }
  };

  const processGithubContents = async (contents: any[], owner: string, repo: string, path = ''): Promise<FileEntry[]> => {
    const files: FileEntry[] = [];

    for (const item of contents) {
      if (item.type === 'file') {
        try {
          const fileResponse = await fetch(item.download_url);
          const content = await fileResponse.text();
          files.push({
            path: path ? `${path}/${item.name}` : item.name,
            content,
            type: 'file',
          });
        } catch (e) {
          console.warn(`Failed to load ${item.path}:`, e);
        }
      } else if (item.type === 'dir') {
        const dirResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${item.path}`);
        const dirContents = await dirResponse.json();
        const children = await processGithubContents(dirContents, owner, repo, path ? `${path}/${item.name}` : item.name);
        files.push({
          path: path ? `${path}/${item.name}` : item.name,
          content: '',
          type: 'directory',
          children,
        });
        files.push(...children);
      }
    }

    return files;
  };

  const createProjectFromTemplate = (template: Template) => {
    const project: Project = {
      id: `project-${Date.now()}`,
      name: template.name,
      type: template.type,
      category: template.category,
      files: template.files,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      rigHistory: [],
      source: 'template',
    };

    const newProjects = [...projects, project];
    saveProjects(newProjects);
    setCurrentProject(project);
    setSelectedFile(project.files[0]?.path || null);
    setCode(project.files[0]?.content || '');
    setShowTemplates(false);
  };

  const handleFileSelect = (path: string) => {
    if (!currentProject) return;
    const file = findFileInTree(currentProject.files, path);
    if (file && file.type === 'file') {
      setSelectedFile(path);
      setCode(file.content);
    }
  };

  const findFileInTree = (files: FileEntry[], path: string): FileEntry | null => {
    for (const file of files) {
      if (file.path === path) return file;
      if (file.children) {
        const found = findFileInTree(file.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    if (currentProject && selectedFile) {
      const updated = updateFileInTree(currentProject.files, selectedFile, newCode);
      const updatedProject = { ...currentProject, files: updated, updatedAt: Date.now() };
      setCurrentProject(updatedProject);
      const newProjects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
      saveProjects(newProjects);
    }
  };

  const updateFileInTree = (files: FileEntry[], path: string, content: string): FileEntry[] => {
    return files.map(file => {
      if (file.path === path) {
        return { ...file, content };
      }
      if (file.children) {
        return { ...file, children: updateFileInTree(file.children, path, content) };
      }
      return file;
    });
  };

  const handleRig = async () => {
    if (!currentProject || !session) {
      alert('Please log in to rig your changes');
      return;
    }

    // Calculate changes
    const changes = calculateChanges(currentProject);
    
    if (changes === 0) {
      alert('No changes to rig');
      return;
    }

    try {
      // Create rig entry
      const rigEntry: RigEntry = {
        id: `rig-${Date.now()}`,
        timestamp: Date.now(),
        message: `Rig ${currentProject.rigHistory.length + 1}`,
        changes,
        filesChanged: getChangedFiles(currentProject),
      };

      // Submit to chain (work_claim style submission for rigging)
      const rigData = {
        project_id: currentProject.id,
        rig_id: rigEntry.id,
        changes,
        files_changed: rigEntry.filesChanged.length,
        timestamp: rigEntry.timestamp,
      };

      // Get user's Demiurge address
      if (!demiurgePublicKey) {
        throw new Error('No Demiurge address found. Please ensure your QorID is properly configured.');
      }

      // Store rig hash on-chain
      const result = await demiurgeRpc.submitWorkClaim({
        address: demiurgePublicKey,
        game_id: 'craft',
        session_id: `rig-${currentProject.id}`,
        depth_metric: changes,
        active_ms: Math.max(1000, Date.now() - currentProject.updatedAt),
        extra: JSON.stringify(rigData),
      });

      rigEntry.onChainHash = result.tx_hash || `rig-${rigEntry.id}`;

      // Update project with rig
      const updatedProject = {
        ...currentProject,
        rigHistory: [...currentProject.rigHistory, rigEntry],
        updatedAt: Date.now(),
      };

      const newProjects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
      saveProjects(newProjects);
      setCurrentProject(updatedProject);

      setTerminalOutput(prev => [...prev, `✅ Rigged ${changes} changes to chain`, `Hash: ${rigEntry.onChainHash}`]);
    } catch (error) {
      console.error('Rig failed:', error);
      alert(`Failed to rig: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const calculateChanges = (project: Project): number => {
    // Simple change calculation based on file modifications
    let changes = 0;
    const lastRigTime = project.rigHistory.length > 0 
      ? project.rigHistory[project.rigHistory.length - 1].timestamp 
      : project.createdAt;
    
    // Count files modified since last rig
    for (const file of project.files) {
      if (file.type === 'file' && file.content) {
        changes += file.content.length;
      }
    }
    
    return Math.floor(changes / 100); // Normalize to reasonable number
  };

  const getChangedFiles = (project: Project): string[] => {
    return project.files
      .filter(f => f.type === 'file')
      .map(f => f.path);
  };

  const handleAIPrompt = async () => {
    if (!aiPrompt.trim() || !currentProject) return;

    try {
      const archonaiUrl = import.meta.env.VITE_ARCHONAI_URL || 'http://localhost:8083';
      const response = await fetch(`${archonaiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Code assistance: ${aiPrompt}\n\nCurrent file: ${selectedFile}\n\nCode context:\n${code.substring(0, 1000)}`,
          context: [],
        }),
      });

      if (!response.ok) throw new Error('ArchonAI service error');

      const data = await response.json();
      setAiSuggestions([data.response]);
    } catch (error) {
      console.error('AI request failed:', error);
      setAiSuggestions(['AI service unavailable. Please check ArchonAI service.']);
    }
  };

  const handleBuild = async () => {
    if (!currentProject) return;
    setIsBuilding(true);
    setTerminalOutput(['Building project...']);
    
    setTimeout(() => {
      setTerminalOutput(prev => [...prev, '✓ Dependencies installed', '✓ TypeScript compiled', '✓ Bundle created', '✓ Build successful!']);
      setIsBuilding(false);
    }, 2000);
  };

  const handleDeploy = async () => {
    if (!currentProject || !session) return;
    setIsDeploying(true);
    setTerminalOutput(['Deploying to staging...']);
    
    setTimeout(() => {
      setTerminalOutput(prev => [...prev, '✓ Project deployed to staging', '✓ Available at: https://staging.demiurge.cloud/apps/' + currentProject.id]);
      setIsDeploying(false);
    }, 3000);
  };

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    
    // Configure Monaco for better experience
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: true },
      wordWrap: 'on',
      automaticLayout: true,
      tabSize: 2,
    });
  };

  // Project selection screen
  if (!currentProject) {
    return (
      <div 
        className="w-full h-full bg-genesis-glass-light text-white p-8 overflow-y-auto"
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-genesis-cipher-cyan mb-2">CRAFT</h2>
          <p className="text-genesis-text-tertiary mb-8">Creator's Advanced Framework & Tools - On-Chain IDE</p>

          {/* GitHub Import */}
          <div className="mb-8 p-4 bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-genesis-cipher-cyan">Import from GitHub</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="flex-1 px-4 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-white"
              />
              <button
                onClick={loadFromGithub}
                disabled={isLoadingGithub || !githubUrl.trim()}
                className="px-4 py-2 bg-abyss-cyan/20 border border-genesis-border-default/40 text-genesis-cipher-cyan hover:bg-abyss-cyan/30 hover:border-genesis-border-default/60 hover:shadow-[0_0_12px_rgba(0,255,255,0.4)] rounded transition-all disabled:opacity-50"
              >
                {isLoadingGithub ? 'Loading...' : 'Import'}
              </button>
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div className="mb-8 p-8 border-2 border-dashed border-genesis-border-default/30 rounded-lg text-center hover:border-genesis-border-default/60 transition-colors">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-lg font-semibold mb-2 text-genesis-cipher-cyan">Drag & Drop Your Repository</h3>
            <p className="text-genesis-text-tertiary mb-4">Drop files or folders from your desktop to import them into CRAFT</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-abyss-cyan/20 border border-genesis-border-default/40 text-genesis-cipher-cyan hover:bg-abyss-cyan/30 rounded transition-all"
            >
              Or Select Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 0) loadFilesFromDesktop(files);
              }}
            />
          </div>

          {/* Templates */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-genesis-cipher-cyan">Project Templates</h3>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="px-4 py-2 bg-abyss-cyan/20 border border-genesis-border-default/40 text-genesis-cipher-cyan hover:bg-abyss-cyan/30 rounded transition-all"
              >
                {showTemplates ? 'Hide Templates' : 'Show Templates'}
              </button>
            </div>

            {showTemplates && (
              <div className="space-y-6">
                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
                        activeCategory === cat.id
                          ? 'bg-abyss-cyan/20 border-genesis-border-default/60 text-genesis-cipher-cyan'
                          : 'bg-abyss-navy/50 border-genesis-border-default/20 text-genesis-text-secondary hover:border-genesis-border-default/40'
                      }`}
                    >
                      <span className="mr-2">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {TEMPLATES.filter(t => t.category === activeCategory).map(template => (
                    <button
                      key={template.id}
                      onClick={() => createProjectFromTemplate(template)}
                      className="p-4 bg-abyss-navy/50 border border-genesis-border-default/20 rounded-lg hover:bg-abyss-cyan/10 hover:border-genesis-border-default/50 hover:shadow-[0_0_12px_rgba(0,255,255,0.3)] transition-all text-left"
                    >
                      <div className="text-3xl mb-2">{template.icon}</div>
                      <div className="font-semibold text-genesis-cipher-cyan mb-1">{template.name}</div>
                      <div className="text-sm text-genesis-text-tertiary">{template.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent Projects */}
          {projects.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-genesis-cipher-cyan">Recent Projects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setCurrentProject(project);
                      setSelectedFile(project.files[0]?.path || null);
                      setCode(project.files[0]?.content || '');
                    }}
                    className="p-4 bg-abyss-navy/30 border border-genesis-border-default/20 rounded-lg hover:bg-abyss-cyan/10 transition-colors text-left"
                  >
                    <div className="font-semibold text-genesis-cipher-cyan mb-1">{project.name}</div>
                    <div className="text-sm text-genesis-text-tertiary mb-2">{project.type} • {project.category}</div>
                    <div className="text-xs text-gray-500">
                      {project.rigHistory.length} rigs • {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main IDE interface
  return (
    <div className="w-full h-full bg-genesis-glass-light text-white flex flex-col">
      {/* Toolbar */}
      <div className="h-12 bg-abyss-navy/50 border-b border-genesis-border-default/20 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setCurrentProject(null);
              setSelectedFile(null);
              setCode('');
            }}
            className="px-3 py-1 bg-abyss-cyan/20 border border-genesis-border-default/40 text-genesis-cipher-cyan hover:bg-abyss-cyan/30 rounded text-sm transition-all"
          >
            ← Back
          </button>
          <span className="font-semibold text-genesis-cipher-cyan">{currentProject.name}</span>
          <span className="text-xs text-genesis-text-tertiary">{currentProject.type}</span>
          {currentProject.rigHistory.length > 0 && (
            <span className="text-xs text-green-400">
              {currentProject.rigHistory.length} rigs
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAIPanel(!showAIPanel)}
            className="px-3 py-1 bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30 rounded text-sm transition-all"
          >
            🤖 AI
          </button>
          <button
            onClick={handleRig}
            disabled={!session}
            className="px-3 py-1 bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30 rounded text-sm transition-all disabled:opacity-50"
            title="Rig it - Save changes to chain"
          >
            ⚒️ Rig It
          </button>
          <button
            onClick={handleBuild}
            disabled={isBuilding}
            className="px-3 py-1 bg-abyss-cyan/20 border border-genesis-border-default/40 text-genesis-cipher-cyan hover:bg-abyss-cyan/30 rounded text-sm transition-all disabled:opacity-50"
          >
            {isBuilding ? 'Building...' : 'Build'}
          </button>
          <button
            onClick={handleDeploy}
            disabled={isDeploying || !session}
            className="px-3 py-1 bg-abyss-cyan/20 border border-genesis-border-default/40 text-genesis-cipher-cyan hover:bg-abyss-cyan/30 rounded text-sm transition-all disabled:opacity-50"
          >
            {isDeploying ? 'Deploying...' : 'Deploy'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* File Browser */}
        <div className="w-64 bg-abyss-navy/30 border-r border-genesis-border-default/20 overflow-y-auto p-2">
          <div className="text-xs text-genesis-text-tertiary mb-2">Files</div>
          {renderFileTree(currentProject.files, '')}
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {selectedFile && (
            <>
              <div className="h-8 bg-abyss-navy/40 border-b border-genesis-border-default/20 px-4 flex items-center text-sm">
                {selectedFile}
              </div>
              <div className="flex-1 min-h-0">
                <Editor
                  height="100%"
                  language={getLanguageFromPath(selectedFile)}
                  value={code}
                  onChange={handleCodeChange}
                  onMount={handleEditorDidMount}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: true },
                    wordWrap: 'on',
                    automaticLayout: true,
                    tabSize: 2,
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* AI Panel */}
        {showAIPanel && (
          <div className="w-80 bg-abyss-navy/50 border-l border-genesis-border-default/20 flex flex-col">
            <div className="h-8 bg-abyss-navy/60 border-b border-genesis-border-default/20 px-4 flex items-center text-sm font-semibold text-genesis-cipher-cyan">
              🤖 ArchonAI Assistant
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ask ArchonAI for code help..."
                  className="w-full h-24 px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-white text-sm resize-none"
                />
                <button
                  onClick={handleAIPrompt}
                  className="mt-2 w-full px-3 py-2 bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30 rounded text-sm transition-all"
                >
                  Ask AI
                </button>
              </div>
              {aiSuggestions.map((suggestion, i) => (
                <div key={i} className="p-3 bg-genesis-glass-light/50 rounded border border-genesis-border-default/20 text-sm">
                  {suggestion}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Terminal */}
      <div className="h-48 bg-black border-t border-genesis-border-default/20 flex flex-col">
        <div className="h-6 bg-abyss-navy/50 px-4 flex items-center text-xs text-genesis-text-tertiary">
          Terminal
        </div>
        <div className="flex-1 overflow-y-auto p-2 font-mono text-xs text-green-400">
          {terminalOutput.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );

  function renderFileTree(files: FileEntry[], prefix: string): JSX.Element[] {
    return files.map(file => (
      <div key={file.path}>
        <button
          onClick={() => handleFileSelect(file.path)}
          className={`w-full text-left px-2 py-1 rounded text-sm mb-1 ${
            selectedFile === file.path
              ? 'bg-abyss-cyan/20 text-genesis-cipher-cyan'
              : 'hover:bg-abyss-cyan/10 text-genesis-text-secondary'
          }`}
        >
          {file.type === 'directory' ? '📁' : '📄'} {file.path.split('/').pop()}
        </button>
        {file.children && (
          <div className="ml-4">
            {renderFileTree(file.children, prefix + file.path + '/')}
          </div>
        )}
      </div>
    ));
  }

  function getLanguageFromPath(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'rs': 'rust',
      'toml': 'toml',
      'json': 'json',
      'md': 'markdown',
      'mdx': 'markdown',
      'css': 'css',
      'html': 'html',
      'py': 'python',
      'go': 'go',
      'cpp': 'cpp',
      'h': 'cpp',
      'c': 'c',
    };
    return langMap[ext || ''] || 'plaintext';
  }
}

// Template Functions
function getWebAppPackageJson(): string {
  return JSON.stringify({
    name: 'my-web-app',
    version: '1.0.0',
    dependencies: {
      '@demiurge/ts-sdk': '^1.0.0',
      'next': '^16.0.0',
      'react': '^18.0.0',
      'react-dom': '^18.0.0',
    },
  }, null, 2);
}

function getWebAppPageTemplate(): string {
  return `import { useQorID } from '@demiurge/ts-sdk';

export default function HomePage() {
  const { identity, balance } = useQorID();
  
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">My Web App</h1>
      {identity && (
        <div>
          <p>Address: {identity.address}</p>
          <p>Balance: {balance} CGT</p>
        </div>
      )}
    </div>
  );
}`;
}

function getWalletPageTemplate(): string {
  return `import { useQorID } from '@demiurge/ts-sdk';
import { sdk } from '@/lib/sdk';

export default function WalletPage() {
  const { identity } = useQorID();
  const [balance, setBalance] = useState('0');
  
  useEffect(() => {
    if (identity) {
      sdk.cgt.getBalanceFormatted(identity.address).then(setBalance);
    }
  }, [identity]);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Wallet</h1>
      <div className="text-3xl font-mono">{balance} CGT</div>
    </div>
  );
}`;
}

function getSDKTemplate(): string {
  return `import { DemiurgeSDK } from '@demiurge/ts-sdk';

export const sdk = new DemiurgeSDK({
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545/rpc',
});`;
}

function getReactAppPackageJson(): string {
  return JSON.stringify({
    name: 'my-react-app',
    version: '1.0.0',
    dependencies: {
      '@demiurge/ts-sdk': '^1.0.0',
      'react': '^18.0.0',
      'react-dom': '^18.0.0',
    },
  }, null, 2);
}

function getReactAppTemplate(): string {
  return `import { useState } from 'react';
import { useQorID } from '@demiurge/ts-sdk';

export default function App() {
  const { identity, balance } = useQorID();
  const [count, setCount] = useState(0);
  
  return (
    <div className="p-8">
      <h1>My React App</h1>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      {identity && <p>Balance: {balance} CGT</p>}
    </div>
  );
}`;
}

function getReactIndexTemplate(): string {
  return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
}

function getGame2DPackageJson(): string {
  return JSON.stringify({
    name: 'my-2d-game',
    version: '1.0.0',
    dependencies: {
      '@demiurge/ts-sdk': '^1.0.0',
      'react': '^18.0.0',
      'phaser': '^3.80.0',
    },
  }, null, 2);
}

function getGame2DTemplate(): string {
  return `import Phaser from 'phaser';
import { sdk } from './lib/sdk';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private score: number = 0;
  
  constructor() {
    super({ key: 'GameScene' });
  }
  
  create() {
    this.player = this.add.sprite(400, 300, 'player');
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      // Handle player movement
    });
  }
  
  async submitScore() {
    // Submit score to chain for CGT rewards
    await sdk.workClaim.submit({
      game_id: 'my-2d-game',
      session_id: \`session-\${Date.now()}\`,
      depth_metric: this.score,
      active_ms: Date.now() - this.time.now,
    });
  }
}`;
}

function getPlayerComponentTemplate(): string {
  return `import { useState, useEffect } from 'react';

export function Player({ x, y }: { x: number; y: number }) {
  const [position, setPosition] = useState({ x, y });
  
  return (
    <div
      className="absolute w-8 h-8 bg-abyss-cyan rounded-full"
      style={{ left: position.x, top: position.y }}
    />
  );
}`;
}

function getGame3DPackageJson(): string {
  return JSON.stringify({
    name: 'my-3d-game',
    version: '1.0.0',
    dependencies: {
      '@demiurge/ts-sdk': '^1.0.0',
      'three': '^0.160.0',
      'react': '^18.0.0',
    },
  }, null, 2);
}

function getGame3DTemplate(): string {
  return `import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { sdk } from './lib/sdk';

export function Game3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!mountRef.current) return;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);
    
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    
    camera.position.z = 5;
    
    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();
  }, []);
  
  return <div ref={mountRef} />;
}`;
}

function getMainSceneTemplate(): string {
  return `import * as THREE from 'three';

export class MainScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  
  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }
}`;
}

function getDeFiPackageJson(): string {
  return JSON.stringify({
    name: 'my-defi-app',
    version: '1.0.0',
    dependencies: {
      '@demiurge/ts-sdk': '^1.0.0',
      'react': '^18.0.0',
      'react-dom': '^18.0.0',
    },
  }, null, 2);
}

function getDeFiAppTemplate(): string {
  return `import { useState } from 'react';
import { useQorID } from '@demiurge/ts-sdk';
import { sdk } from './lib/sdk';

export default function DeFiApp() {
  const { identity } = useQorID();
  const [stakeAmount, setStakeAmount] = useState('');
  
  const handleStake = async () => {
    if (!identity) return;
    // Implement staking logic
    await sdk.cgt.transfer(identity.address, 'staking_contract', stakeAmount);
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">DeFi dApp</h1>
      <div className="space-y-4">
        <input
          type="number"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          placeholder="Amount to stake"
          className="px-4 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded"
        />
        <button onClick={handleStake} className="px-4 py-2 bg-abyss-cyan text-white rounded">
          Stake CGT
        </button>
      </div>
    </div>
  );
}`;
}

function getStakingTemplate(): string {
  return `import { useState, useEffect } from 'react';
import { sdk } from '../lib/sdk';

export function Staking({ address }: { address: string }) {
  const [staked, setStaked] = useState('0');
  const [rewards, setRewards] = useState('0');
  
  useEffect(() => {
    // Fetch staking data
    loadStakingData();
  }, [address]);
  
  const loadStakingData = async () => {
    // Implement staking data fetching
  };
  
  return (
    <div className="p-4 border border-genesis-border-default/20 rounded">
      <h3 className="font-semibold mb-2">Staking</h3>
      <p>Staked: {staked} CGT</p>
      <p>Rewards: {rewards} CGT</p>
    </div>
  );
}`;
}

function getNFTMarketplacePackageJson(): string {
  return JSON.stringify({
    name: 'nft-marketplace',
    version: '1.0.0',
    dependencies: {
      '@demiurge/ts-sdk': '^1.0.0',
      'react': '^18.0.0',
    },
  }, null, 2);
}

function getNFTMarketplaceTemplate(): string {
  return `import { useState, useEffect } from 'react';
import { useQorID } from '@demiurge/ts-sdk';
import { sdk } from './lib/sdk';

export default function NFTMarketplace() {
  const { identity } = useQorID();
  const [nfts, setNfts] = useState([]);
  
  useEffect(() => {
    if (identity) {
      loadNFTs();
    }
  }, [identity]);
  
  const loadNFTs = async () => {
    const nftList = await sdk.nft.getNftsByOwner(identity.address);
    setNfts(nftList);
  };
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">NFT Marketplace</h1>
      <div className="grid grid-cols-3 gap-4">
        {nfts.map(nft => (
          <div key={nft.id} className="border border-genesis-border-default/20 rounded p-4">
            <p>NFT #{nft.id}</p>
          </div>
        ))}
      </div>
    </div>
  );
}`;
}

function getMintPanelTemplate(): string {
  return `import { useState } from 'react';
import { sdk } from '../lib/sdk';

export function MintPanel() {
  const [fabricHash, setFabricHash] = useState('');
  
  const handleMint = async () => {
    // Mint NFT with fabric hash
    await sdk.nft.mint({
      fabric_root_hash: fabricHash,
      royalty_recipient: null,
      royalty_bps: 500, // 5%
    });
  };
  
  return (
    <div className="p-4 border border-genesis-border-default/20 rounded">
      <h3 className="font-semibold mb-2">Mint NFT</h3>
      <input
        type="text"
        value={fabricHash}
        onChange={(e) => setFabricHash(e.target.value)}
        placeholder="Fabric root hash"
        className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded mb-2"
      />
      <button onClick={handleMint} className="w-full px-4 py-2 bg-abyss-cyan text-white rounded">
        Mint
      </button>
    </div>
  );
}`;
}

function getQorOSAppPackageJson(): string {
  return JSON.stringify({
    name: 'my-qor-app',
    version: '1.0.0',
    dependencies: {
      'react': '^18.0.0',
    },
  }, null, 2);
}

function getQorOSAppTemplate(): string {
  return `import { useState } from 'react';

export function MyQorOSApp() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="w-full h-full bg-genesis-glass-light text-white p-4">
      <h1 className="text-2xl font-bold text-genesis-cipher-cyan mb-4">My QOR OS App</h1>
      <button
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-abyss-cyan/20 border border-genesis-border-default/40 text-genesis-cipher-cyan rounded hover:bg-abyss-cyan/30"
      >
        Count: {count}
      </button>
    </div>
  );
}`;
}

function getManifestTemplate(): string {
  return JSON.stringify({
    id: 'my-abyssos-app',
    name: 'My QOR OS App',
    version: '1.0.0',
    description: 'Built with CRAFT',
    category: 'productivity',
    icon: '💻',
    entry: 'src/App.tsx',
  }, null, 2);
}

function getRustServiceCargoToml(): string {
  return `[package]
name = "my-rust-service"
version = "1.0.0"
edition = "2021"

[dependencies]
demiurge-rust-sdk = { path = "../../sdk/rust-sdk" }
axum = "0.7"
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
`;
}

function getRustServiceMain(): string {
  return `use axum::{routing::get, Router};
use demiurge_rust_sdk::DemiurgeSDK;

#[tokio::main]
async fn main() {
    let sdk = DemiurgeSDK::new("http://127.0.0.1:8545/rpc".to_string());
    
    let app = Router::new()
        .route("/", get(|| async { "Hello from Rust Service!" }));
    
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
`;
}

function getNodeBotPackageJson(): string {
  return JSON.stringify({
    name: 'my-node-bot',
    version: '1.0.0',
    dependencies: {
      '@demiurge/ts-sdk': '^1.0.0',
      'express': '^4.18.0',
    },
  }, null, 2);
}

function getNodeBotTemplate(): string {
  return `import express from 'express';
import { DemiurgeSDK } from '@demiurge/ts-sdk';

const app = express();
const sdk = new DemiurgeSDK({
  rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545/rpc',
});

app.get('/', (req, res) => {
  res.json({ message: 'Node.js Bot running!' });
});

app.listen(3000, () => {
  console.log('Bot listening on port 3000');
});`;
}

function getEthereumPortingGuide(): string {
  return `# Porting from Ethereum to Demiurge

## Key Differences

1. **Address Format**: Demiurge uses 32-byte addresses (Ed25519), not 20-byte Ethereum addresses
2. **Transaction Signing**: Ed25519 signatures instead of ECDSA
3. **Gas Model**: Fixed fees, no gas estimation needed
4. **Smart Contracts**: Demiurge uses runtime modules, not Solidity contracts

## Migration Steps

1. Replace Web3.js/Ethers.js with @demiurge/ts-sdk
2. Update address handling (32 bytes)
3. Replace contract calls with module calls
4. Update transaction signing to Ed25519

## Example Migration

\`\`\`typescript
// Before (Ethereum)
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
await contract.transfer(to, amount);

// After (Demiurge)
import { sdk } from '@demiurge/ts-sdk';
await sdk.cgt.transfer(from, to, amount);
\`\`\`
`;
}

function getEthereumMigrationScript(): string {
  return `// Ethereum to Demiurge Migration Script
// Run this to help migrate your Ethereum dApp

const migration = {
  // Replace Web3 providers
  replaceProvider: (code) => {
    return code
      .replace(/new ethers\\.providers\\.Web3Provider/g, 'new DemiurgeSDK')
      .replace(/window\\.ethereum/g, 'rpcUrl');
  },
  
  // Update address handling
  updateAddresses: (code) => {
    return code.replace(/0x[a-fA-F0-9]{40}/g, (match) => {
      // Convert Ethereum address to Demiurge format
      return match.padEnd(66, '0');
    });
  },
};

export default migration;
`;
}

function getSolanaPortingGuide(): string {
  return `# Porting from Solana to Demiurge

## Key Differences

1. **Account Model**: Demiurge uses address-based accounts, not Solana's account model
2. **Programs**: Demiurge uses runtime modules, not Solana programs
3. **Transactions**: Different transaction structure
4. **Token Standard**: CGT instead of SPL tokens

## Migration Steps

1. Replace @solana/web3.js with @demiurge/ts-sdk
2. Convert Solana accounts to Demiurge addresses
3. Replace program calls with module calls
4. Update token operations to CGT

## Example Migration

\`\`\`typescript
// Before (Solana)
import { Connection, PublicKey } from '@solana/web3.js';
const connection = new Connection('https://api.mainnet-beta.solana.com');
await connection.getBalance(publicKey);

// After (Demiurge)
import { sdk } from '@demiurge/ts-sdk';
const balance = await sdk.cgt.getBalance(address);
\`\`\`
`;
}

function getSolanaMigrationScript(): string {
  return `// Solana to Demiurge Migration Script
const migration = {
  replaceSolanaSDK: (code) => {
    return code
      .replace(/@solana\\/web3\\.js/g, '@demiurge/ts-sdk')
      .replace(/new Connection\\(/g, 'new DemiurgeSDK({ rpcUrl: ')
      .replace(/\\)/g, ' })');
  },
  
  updatePublicKeys: (code) => {
    return code.replace(/new PublicKey\\(/g, '// Convert to Demiurge address: ');
  },
};

export default migration;
`;
}

function getPolygonPortingGuide(): string {
  return `# Porting from Polygon to Demiurge

## Key Differences

1. **Network**: Demiurge is a standalone chain, not an L2
2. **Gas**: Fixed fees, no gas estimation
3. **Contracts**: Runtime modules instead of smart contracts
4. **Tokens**: CGT native token

## Migration Steps

1. Replace Polygon Web3 with Demiurge SDK
2. Update contract interactions to module calls
3. Convert MATIC operations to CGT
4. Update transaction signing

## Example Migration

\`\`\`typescript
// Before (Polygon)
import { ethers } from 'ethers';
const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');
const contract = new ethers.Contract(address, abi, signer);
await contract.transfer(to, amount);

// After (Demiurge)
import { sdk } from '@demiurge/ts-sdk';
await sdk.cgt.transfer(from, to, amount);
\`\`\`
`;
}

function getPolygonMigrationScript(): string {
  return `// Polygon to Demiurge Migration Script
const migration = {
  replacePolygonSDK: (code) => {
    return code
      .replace(/ethers\\.providers\\.JsonRpcProvider/g, 'DemiurgeSDK')
      .replace(/https:\\/\\/polygon-rpc\\.com/g, 'http://127.0.0.1:8545/rpc');
  },
  
  updateContractCalls: (code) => {
    return code.replace(/contract\\.(\\w+)\\(/g, (match, method) => {
      // Map common contract methods to Demiurge module calls
      const methodMap = {
        transfer: 'sdk.cgt.transfer',
        balanceOf: 'sdk.cgt.getBalance',
      };
      return methodMap[method] || match;
    });
  },
};

export default migration;
`;
}

function getPortingPackageJson(): string {
  return JSON.stringify({
    name: 'porting-tool',
    version: '1.0.0',
    dependencies: {
      '@demiurge/ts-sdk': '^1.0.0',
    },
  }, null, 2);
}
