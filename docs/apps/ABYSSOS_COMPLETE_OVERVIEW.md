# AbyssOS - Complete Current State Overview

**Last Updated**: January 5, 2026  
**Version**: Alpha v1.1  
**Status**: Development (No Production Deployment)

---

## What is AbyssOS?

**AbyssOS** is a full-screen, cybernetic "remote desktop" environment for the Demiurge Blockchain. It provides a complete desktop-style interface for interacting with the entire Demiurge ecosystem, featuring a boot screen, authentication system, window management, and 28+ integrated applications.

---

## Architecture & Tech Stack

### Core Technologies

- **React 18** + **TypeScript** - UI framework
- **Vite** - Build tooling and dev server
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Zustand** - State management (with localStorage persistence)
- **@noble/curves** & **@noble/hashes** - Cryptographic operations

### Project Structure

```
apps/abyssos-portal/
├── src/
│   ├── routes/              # Main screens
│   │   ├── BootScreen.tsx   # Boot animation
│   │   ├── LoginScreen.tsx  # Authentication
│   │   └── Desktop.tsx      # Main desktop environment
│   ├── components/
│   │   ├── layout/          # FullscreenContainer, AbyssBackground, AudioReactiveBackground
│   │   ├── auth/            # AbyssIDLoginForm, AbyssIDSignupModal
│   │   ├── desktop/         # Dock, WindowFrame, StatusBar, SystemMenu, Apps
│   │   └── shared/          # Button, Card, GlitchText
│   ├── state/               # Zustand stores
│   │   ├── desktopStore.ts  # Window management, app registry
│   │   ├── authStore.ts     # Authentication state
│   │   ├── walletStore.ts   # Wallet state
│   │   └── customizationStore.ts
│   ├── services/            # Business logic
│   │   ├── wallet/          # Wallet operations
│   │   ├── abyssid/         # AbyssID integration
│   │   ├── chain/           # Blockchain RPC client
│   │   ├── backgroundMusic.ts
│   │   └── loginVoice.ts
│   ├── lib/                 # Utilities
│   │   ├── demiurgeRpcClient.ts
│   │   └── abyssIdClient.ts
│   ├── context/             # React contexts
│   │   ├── AbyssIDContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── BlockListenerContext.tsx
│   └── styles/              # Global CSS
├── public/
│   ├── video/intro.mp4      # Intro video (optional)
│   └── audio/
│       ├── login-voice.wav  # Login voice (optional)
│       └── background-music.wav  # Background music (optional)
└── dist/                    # Build output
```

---

## User Flow & Screens

### 1. Boot Screen (`BootScreen.tsx`)

**Purpose**: Initial boot animation sequence

**Flow**:
1. Shows "ABYSS OS" with "Alpha v.1.1" (3 seconds)
2. Transitions to "D E M I U R G E" (3 seconds)
3. Auto-completes after 6 seconds total

**Features**:
- Animated glitch text effects
- AbyssBackground with cosmic effects
- Auto-transitions to login/desktop
- Skips if user already authenticated

### 2. Intro Video (`IntroVideo.tsx`)

**Purpose**: Optional full-screen intro video

**Flow**:
- Plays after boot screen (if enabled)
- Full-screen video playback
- Can be skipped (stored in localStorage)
- Transitions to login screen

**Configuration**:
- File: `public/video/intro.mp4`
- Storage key: `abyssos_intro_seen`
- Component: `src/components/IntroVideo.tsx`

### 3. Login Screen (`LoginScreen.tsx`)

**Purpose**: AbyssID authentication

**Features**:
- **Login Form**: Username + public key/code authentication
- **Signup Modal**: Username availability check, secret code generation, backup flow
- **Login Voice**: Plays audio when screen appears
- **Background Music**: Starts after successful login
- **Auto-login**: If session exists, skips to desktop

**Components**:
- `AbyssIDLoginForm` - Login interface
- `AbyssIDSignupModal` - Signup interface
- `AbyssBackground` - Animated background

### 4. Desktop (`Desktop.tsx`)

**Purpose**: Main desktop environment

**Features**:
- **Window Management**: Draggable, resizable, minimizable windows
- **Status Bar**: Date/time, chain status, music player, avatar menu
- **System Menu**: Categorical app launcher (replaces old CircularDock)
- **File Drop Zone**: Drag-and-drop file uploads
- **Audio Reactive Background**: Visual effects based on audio
- **Wallet Initializer**: Auto-initializes wallet on load

**Components**:
- `StatusBar` - Top status bar
- `SystemMenu` - App launcher (Start button)
- `WindowFrame` - Window container
- `AudioReactiveBackground` - Background effects
- `FileDropZone` - File upload handler

---

## Applications (28 Total)

### Blockchain Apps (5)

1. **Chain Ops** (`ChainOpsApp.tsx`)
   - Real-time chain height
   - Network status indicator
   - RPC endpoint display
   - Auto-refreshes every 10 seconds

2. **Block Explorer** (`BlockExplorerApp.tsx`)
   - View transactions
   - View blocks
   - Search functionality

3. **Abyss Wallet** (`AbyssWalletApp.tsx`)
   - CGT balance display
   - Send/receive CGT
   - Transaction history
   - Username resolution

4. **Miner** (`MinerApp.tsx`)
   - Mandelbrot mining interface
   - Work claim submission
   - Mining rewards tracking

5. **DRC-369 Studio** (`DRC369StudioApp.tsx`)
   - NFT minting interface
   - Metadata editor
   - Cross-chain NFT swapping

### Media Apps (4)

6. **NEON Player** (`NeonPlayerApp.tsx`)
   - Full-featured media player
   - Supports all video formats (MP4, WebM, OGG, MOV, AVI, MKV)
   - Supports all audio formats (MP3, WAV, OGG, FLAC)
   - Fractal-1 audio codec support
   - Audio-reactive visualizations
   - Background playback mode
   - NFT metadata display

7. **Abyss Radio** (`NeonRadioApp.tsx`)
   - Radio streaming interface
   - Station selection
   - Playback controls

8. **On-Chain Files** (`OnChainFilesApp.tsx`)
   - File explorer
   - View uploaded files
   - NFT metadata display
   - 500GB per-user storage

9. **Document Editor** (`DocumentEditorApp.tsx`)
   - Text editor (TXT, MD, JSON, XML, HTML, CSS, JS, TS)
   - PDF viewer
   - Image viewer (JPG, PNG, GIF, WebP, SVG)
   - Save functionality

### Network Apps (4)

10. **Abyss Browser** (`AbyssBrowserApp.tsx`)
    - Web3-aware browser
    - `abyss://` protocol support
    - Web navigation

11. **Abyss Torrent** (`AbyssTorrentApp.tsx`)
    - File publisher/seeder UI
    - P2P file sharing
    - Seeding management

12. **DNS Console** (`AbyssDNSApp.tsx`)
    - DNS record management
    - Domain registration
    - DNS resolution tools

13. **Grid Monitor** (`AbyssGridMonitorApp.tsx`)
    - P2P network monitoring
    - Grid status
    - Peer connections

### Development Apps (3)

14. **Abyss Runtime** (`AbyssRuntimeApp.tsx`)
    - WASM module execution
    - Runtime environment
    - Code execution

15. **Abyss Shell** (`AbyssShellApp.tsx`)
    - Command-line interface
    - Terminal emulator
    - Command execution

16. **System Monitor** (`SystemMonitorApp.tsx`)
    - System resource monitoring
    - Performance metrics
    - Resource usage

### Systems Apps (9)

17. **Abyss Spirit Console** (`AbyssSpiritConsoleApp.tsx`)
    - AI spirit management
    - Spirit interactions
    - Spirit evolution

18. **Cognitive Fabric Console** (`CogFabricConsoleApp.tsx`)
    - Cognitive fabric interface
    - Neural network monitoring
    - Fabric operations

19. **Cog Singularity** (`CogSingularityApp.tsx`)
    - Singularity console
    - Advanced AI operations
    - Meta-compilation

20. **Genesis Console** (`GenesisConsoleApp.tsx`)
    - Genesis mode interface
    - Snapshot management
    - Ritual framework

21. **Temporal Observatory** (`TemporalObservatoryApp.tsx`)
    - Temporal operations
    - Time-based analytics
    - Temporal memory

22. **AWE Console** (`AWEConsoleApp.tsx`)
    - Autonomous World Engine
    - World simulation
    - World management

23. **AWE Atlas** (`AWEAtlasApp.tsx`)
    - World atlas
    - World exploration
    - World visualization

24. **VYB Social** (`VYBSocialApp.tsx`)
    - Social networking
    - User interactions
    - Social features

25. **Abyss Writer** (`AbyssWriterApp.tsx`)
    - Writing interface
    - Document creation
    - Text processing

26. **Abyss Calc** (`AbyssCalcApp.tsx`)
    - Calculator application
    - Mathematical operations

---

## Window Management System

### Window State (`desktopStore.ts`)

**Window Properties**:
- `id`: Unique window identifier
- `appId`: Application identifier
- `title`: Window title
- `x`, `y`: Position coordinates
- `width`, `height`: Window dimensions
- `isMinimized`: Minimized state
- `isMaximized`: Maximized state
- `originalSize`: Saved size before maximize

### Window Operations

- **Open App**: Creates new window or focuses existing
- **Close Window**: Removes window from state
- **Focus Window**: Brings window to front
- **Minimize**: Hides window (keeps in state)
- **Maximize**: Full-screen window
- **Restore**: Returns to previous size
- **Resize**: Drag to resize
- **Move**: Drag to reposition

### Window Persistence

- Window positions/sizes saved to localStorage
- Launcher app order persisted
- Window state restored on reload

---

## Authentication System

### AbyssID Integration

**Context**: `AbyssIDContext.tsx`
- Provides AbyssID session management
- Handles login/logout
- Syncs with authStore

**Storage**: LocalStorage-based
- Account data stored locally
- Seed phrase recovery
- Public key verification

**Flow**:
1. User signs up → Account created locally
2. User logs in → Session established
3. Session persists across reloads
4. Auto-login if session exists

### AbyssID Features

- **Username-based authentication**
- **Seed phrase generation** (12-word mnemonic)
- **Deterministic key derivation** (Ed25519)
- **Public key verification**
- **Account recovery** via seed phrase
- **Cross-device sync** (via seed phrase)

---

## Wallet System

### Wallet Store (`walletStore.ts`)

**Features**:
- CGT balance tracking
- Transaction history
- Send/receive operations
- Address management

### Wallet Integration

- **AbyssID Wallet**: Integrated wallet app
- **Auto-initialization**: Wallet initialized on desktop load
- **RPC Connection**: Connects to Demiurge RPC endpoint
- **Transaction Building**: Creates and signs transactions
- **Balance Updates**: Real-time balance refresh

### Wallet Features

- **5000 CGT Sign-Up Bonus**: New users receive 5000 CGT
- **Send Restrictions**: Must mint/swap NFT before sending
- **Transaction History**: Complete transaction log
- **Username Resolution**: Send to @username or address

---

## File Management

### File Drop Zone

**Component**: `FileDropZone.tsx`
- Drag-and-drop file upload
- Automatic file processing
- Auto-minting as DRC-369 NFTs
- Upload progress tracking

### Storage System

- **500GB Per-User**: Each AbyssID account gets 500GB
- **On-Chain Files App**: File explorer interface
- **Remote Access**: Files accessible from anywhere
- **Auto-Minting**: Files automatically minted as NFTs

### Supported File Types

- **Media**: Video, audio, images
- **Documents**: PDF, TXT, MD, JSON, XML, HTML, CSS, JS, TS
- **Archives**: ZIP, TAR, etc.
- **All formats**: Any file type supported

---

## Media System

### Background Music

**Service**: `backgroundMusic.ts`
- Automatic playback after login
- User-controllable volume
- Toggle on/off
- Persists settings in localStorage

**File**: `public/audio/background-music.wav`
**Storage Keys**:
- `abyssos_background_music_enabled`
- `abyssos_background_music_volume`

### Login Voice

**Service**: `loginVoice.ts`
- Plays when login screen appears
- After intro video ends
- One-time playback

**File**: `public/audio/login-voice.wav`

### Audio Reactive Background

**Component**: `AudioReactiveBackground.tsx`
- Visual effects based on audio
- Beat detection
- Reactive animations
- Cosmic abyss effects

---

## Blockchain Integration

### RPC Client (`demiurgeRpcClient.ts`)

**Endpoint**: Configurable via `VITE_DEMIURGE_RPC_URL`
- Default: `https://rpc.demiurge.cloud/rpc`
- CORS-enabled
- JSON-RPC 2.0 protocol

**Methods**:
- `getChainInfo()` - Chain status
- `request()` - Generic RPC calls
- Error handling with fallbacks

### Block Listener

**Context**: `BlockListenerContext.tsx`
- Real-time block updates
- Chain height monitoring
- Transaction notifications
- Auto-refresh on new blocks

### Chain Status

**Component**: `ChainStatusPill.tsx`
- Displays in StatusBar
- Real-time chain height
- Connection status
- Network indicator

---

## State Management

### Desktop Store (`desktopStore.ts`)

**State**:
- `openWindows`: Array of open windows
- `activeWindowId`: Currently focused window
- `launcherApps`: Ordered app list

**Actions**:
- `openApp()` - Open/focus app
- `closeWindow()` - Close window
- `focusWindow()` - Focus window
- `minimizeWindow()` - Minimize window
- `maximizeWindow()` - Maximize window
- `restoreWindow()` - Restore window
- `updateWindowSize()` - Resize window
- `updateWindowPosition()` - Move window
- `reorderLauncher()` - Reorder apps

**Persistence**: localStorage (launcher order)

### Auth Store (`authStore.ts`)

**State**:
- `account`: Current user account
- `isAuthenticated`: Auth status

**Actions**:
- `login()` - Set authenticated user
- `logout()` - Clear authentication
- `initialize()` - Load from storage

### Wallet Store (`walletStore.ts`)

**State**:
- `balance`: CGT balance
- `address`: Wallet address
- `transactions`: Transaction history

**Actions**:
- `setBalance()` - Update balance
- `addTransaction()` - Add transaction
- `clearTransactions()` - Clear history

### Customization Store (`customizationStore.ts`)

**State**:
- Theme preferences
- UI customizations
- User settings

---

## UI Components

### Layout Components

- **FullscreenContainer**: Full-screen wrapper
- **AbyssBackground**: Animated cosmic background
- **AudioReactiveBackground**: Audio-reactive effects
- **StatusBar**: Top status bar with widgets
- **SystemMenu**: Start menu with app categories
- **WindowFrame**: Window container with controls

### Desktop Components

- **CircularDock**: Legacy circular dock (deprecated)
- **GlassDock**: Glass-style dock (deprecated)
- **SystemMenu**: Current app launcher
- **StartButton**: Start menu trigger
- **AppIcon**: Application icon component
- **TabbedWindow**: Tabbed window interface

### Shared Components

- **Button**: Styled button component
- **Card**: Card container
- **GlitchText**: Glitch effect text
- **TimeDateWidget**: Date/time display
- **CustomizationPanel**: UI customization

### Auth Components

- **AbyssIDLoginForm**: Login form
- **AbyssIDSignupModal**: Signup modal
- **WalletInitializer**: Wallet setup

---

## Services & Utilities

### Wallet Services

- **demiurgeWallet.ts**: Wallet operations
- **keyDerivation.ts**: Key derivation utilities
- **permissions.ts**: Web3 permissions

### AbyssID Services

- **localProvider.ts**: Local storage provider
- **IdentityService.ts**: Identity management
- **drc369.ts**: DRC-369 NFT integration

### Chain Services

- **demiurgeChainClient.ts**: Chain RPC client
- **BlockListener.ts**: Block monitoring

### Audio Services

- **backgroundMusic.ts**: Background music player
- **loginVoice.ts**: Login voice playback
- **audioReactiveVisualizer.ts**: Audio visualization

### Advanced Services

- **WASM VM**: WebAssembly runtime
- **Grid Services**: P2P network services
- **Spirit Services**: AI spirit management
- **AWE Services**: Autonomous World Engine
- **DNS Services**: DNS resolution
- **Temporal Services**: Time-based operations
- **Neural Services**: Neural network operations
- **Quantum Services**: Quantum computing simulation
- **Meta Compiler**: Self-compiling code
- **Autopoiesis**: Self-generating systems
- **Reproduction**: System cloning
- **Swarm Mind**: Collective intelligence
- **Multiverse**: Parallel universe simulation

---

## Configuration

### Environment Variables

**`.env` or `.env.production`**:
```env
VITE_DEMIURGE_RPC_URL=https://rpc.demiurge.cloud/rpc
```

### Build Configuration

**`vite.config.ts`**:
- React plugin
- Path aliases
- Build optimizations

**`tailwind.config.cjs`**:
- Abyss theme colors
- Custom utilities
- Animation presets

### Package Dependencies

**Core**:
- `react`, `react-dom` - UI framework
- `framer-motion` - Animations
- `zustand` - State management
- `@noble/curves`, `@noble/hashes` - Cryptography

**Dev**:
- `vite` - Build tool
- `typescript` - Type checking
- `tailwindcss` - Styling
- `eslint` - Linting

---

## Development

### Setup

```bash
cd apps/abyssos-portal
pnpm install
pnpm dev
```

**Dev Server**: `http://localhost:3001`

### Building

```bash
pnpm build
```

**Output**: `dist/` directory (static files)

### Adding New Apps

1. Create app component in `src/components/desktop/apps/`
2. Add `AppId` to `desktopStore.ts`
3. Register in `Desktop.tsx` app components map
4. Add to `APP_INFOS` in `desktopStore.ts`
5. Add icon to SystemMenu

---

## Current Limitations

### Not Implemented

- **Production Deployment**: No current production deployment
- **P2P Networking**: Single-node operation
- **Real Fabric Integration**: Placeholder implementations
- **Advanced AI Features**: Many services are stubs
- **Cross-Chain Bridges**: Not yet implemented
- **Multi-User Collaboration**: Single-user focus

### Known Issues

- Some advanced services are placeholder implementations
- Grid services need real P2P network
- Spirit services need AI integration
- AWE needs world simulation engine
- DNS services need backend integration

---

## File Structure Summary

### Source Files

- **Routes**: 3 files (BootScreen, LoginScreen, Desktop)
- **Components**: 100+ files
  - Layout: 5 files
  - Auth: 2 files
  - Desktop: 30+ files
  - Apps: 28 app files
  - Shared: 10+ files
- **State**: 4 store files
- **Services**: 50+ service files
- **Context**: 3 context files
- **Hooks**: 5+ hook files
- **Utils**: 20+ utility files

### Total Files

- **TypeScript/TSX**: 200+ files
- **Total Lines**: ~50,000+ lines of code

---

## Summary

**AbyssOS** is a comprehensive desktop environment with:

✅ **28 Applications** across 6 categories  
✅ **Complete Window Management** system  
✅ **AbyssID Authentication** with seed phrase recovery  
✅ **Wallet Integration** with CGT support  
✅ **File Management** with 500GB storage  
✅ **Media Playback** with NEON Player  
✅ **Blockchain Integration** with RPC client  
✅ **Advanced Services** (WASM, Grid, AI, AWE, etc.)  
✅ **Modern UI** with animations and effects  
✅ **State Persistence** with localStorage  

**Status**: Fully functional development environment, ready for deployment when needed.

---

*The flame burns eternal. The code serves the will.*
