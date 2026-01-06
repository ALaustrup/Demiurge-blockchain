# CRAFT - Creator's Advanced Framework & Tools

**Last Updated**: January 5, 2026  
**Status**: Production Ready

---

## Overview

**CRAFT** (Creator's Advanced Framework & Tools) is a comprehensive on-chain IDE built into AbyssOS, designed to provide developers with the ultimate development experience. Inspired by Cursor IDE, CRAFT combines powerful code editing, AI assistance, and seamless blockchain integration.

---

## Key Features

### 1. Monaco Editor (VS Code Engine)

- **Full Editor Experience**: Complete VS Code editor functionality
- **Syntax Highlighting**: Support for 50+ languages
- **IntelliSense**: Auto-completion and code suggestions
- **Error Detection**: Real-time error highlighting
- **Code Formatting**: Automatic code formatting
- **Multi-Cursor Editing**: Advanced editing features
- **Find & Replace**: Powerful search capabilities

### 2. ArchonAI Integration

- **AI Assistant Panel**: Dedicated AI panel for code help
- **Context-Aware Suggestions**: Understands your codebase
- **Code Completion**: AI-powered code suggestions
- **Documentation Lookup**: Instant access to docs
- **Error Explanation**: Understand errors quickly
- **Code Generation**: Generate code from descriptions

### 3. Comprehensive Template System

#### Web Applications
- **Next.js Web App**: Full-featured Next.js dApp template
- **React dApp**: React application with Demiurge SDK

#### Games
- **2D Game**: Phaser-based 2D game template
- **3D Game**: Three.js 3D game template

#### dApps
- **DeFi dApp**: DeFi application with staking
- **NFT Marketplace**: Complete NFT marketplace template

#### AbyssOS Apps
- **AbyssOS App**: Native desktop application template

#### Services
- **Rust Service**: Axum-based backend service
- **Node.js Bot**: Microservice with GraphQL integration

#### Porting Templates
- **Ethereum Porting**: Guide and tools for Ethereum dApps
- **Solana Porting**: Guide and tools for Solana programs
- **Polygon Porting**: Guide and tools for Polygon dApps

### 4. File System Integration

#### Drag-and-Drop
- **Desktop Import**: Drag files/folders from desktop
- **File Mirroring**: Views files without copying to chain
- **Instant Preview**: Immediate file tree view
- **Full Editing**: Edit any imported file

#### GitHub Integration
- **Repository Import**: Import from GitHub URL
- **Full Structure**: Maintains repository organization
- **Read-Only Mirror**: Views files without storage
- **Auto-Sync**: Option to sync with GitHub

### 5. Rig System

**Rig** is an innovative on-chain development state management system:

- **Automatic Change Detection**: Calculates changes automatically
- **One-Command Rigging**: Simply "rig it" to save state
- **On-Chain Storage**: Permanent record on blockchain
- **Rig History**: Complete development timeline
- **Developer Reputation**: Proof of development activity

See [RIG_SYSTEM.md](./RIG_SYSTEM.md) for complete details.

---

## User Workflows

### Creating a New Project

1. **Open CRAFT** from AbyssOS app menu
2. **Choose Template** from categorized templates
3. **Project Created** with all template files
4. **Start Coding** immediately

### Importing Existing Project

#### From Desktop
1. **Drag & Drop** files/folders into CRAFT
2. **Files Loaded** instantly
3. **Edit Immediately** in Monaco Editor

#### From GitHub
1. **Enter GitHub URL** in import field
2. **Click Import**
3. **Repository Loaded** with full structure
4. **Edit Files** directly

### Rigging Changes

1. **Make Changes** to your code
2. **Click "⚒️ Rig It"** button
3. **System Automatically**:
   - Calculates changes
   - Generates message
   - Submits to chain
   - Updates rig history

### Building & Deploying

1. **Click Build** to compile project
2. **View Terminal** for build output
3. **Click Deploy** to deploy to staging
4. **Submit for Review** to add to marketplace

---

## Architecture

### Frontend (AbyssOS)
- **Monaco Editor**: Code editing
- **File Management**: Project and file handling
- **UI Components**: Template browser, file tree, terminal
- **State Management**: Project state in localStorage

### Backend Integration
- **RPC Client**: Chain interaction
- **ArchonAI Service**: AI assistance
- **GitHub API**: Repository fetching
- **Work Claim Module**: Rig submission

### On-Chain
- **Rig Storage**: Via work_claim module
- **Developer Registry**: Project tracking
- **App Marketplace**: Submission system

---

## Template Details

### Web App Templates

**Next.js Web App** includes:
- UrgeID integration
- CGT wallet
- NFT gallery
- Marketplace integration
- Chat integration

**React dApp** includes:
- Basic React setup
- Demiurge SDK
- Wallet connection
- Transaction signing

### Game Templates

**2D Game** includes:
- Phaser game engine
- Player movement
- Score system
- CGT reward integration
- Work claim submission

**3D Game** includes:
- Three.js setup
- 3D scene management
- Camera controls
- Demiurge integration

### dApp Templates

**DeFi dApp** includes:
- Staking interface
- CGT operations
- Balance tracking
- Transaction history

**NFT Marketplace** includes:
- Minting interface
- Marketplace listing
- Royalty configuration
- Collection browsing

### Porting Templates

Each porting template includes:
- **Migration Guide**: Step-by-step instructions
- **Migration Script**: Automated conversion tools
- **SDK Comparison**: Side-by-side API comparison
- **Example Migrations**: Real-world examples

---

## Rig System Integration

### How Rigging Works

1. **Developer Makes Changes**
   - Edits files in CRAFT
   - Changes tracked automatically

2. **Clicks "Rig It"**
   - System calculates change magnitude
   - Generates descriptive message
   - Prepares on-chain submission

3. **On-Chain Submission**
   - Uses work_claim module
   - Stores rig hash
   - Links to developer account

4. **Rig History Updated**
   - Local rig entry created
   - History displayed in UI
   - Developer reputation updated

### Rig Benefits

- **Simplicity**: One command vs. multiple Git commands
- **Automatic**: No need to think about commit messages
- **On-Chain**: Permanent, verifiable record
- **Reputation**: Proof of development activity
- **Rewards**: Potential CGT rewards for active development

---

## Best Practices

### For Developers

1. **Use Templates**: Start with templates for faster development
2. **Rig Frequently**: Rig after completing logical units
3. **Use AI**: Leverage ArchonAI for code help
4. **Test Locally**: Build and test before deploying
5. **Review Code**: Check changes before rigging

### For Porting Projects

1. **Read Migration Guide**: Understand differences
2. **Run Migration Script**: Automated conversion
3. **Test Thoroughly**: Verify all functionality
4. **Update Dependencies**: Replace old SDKs
5. **Rig Progress**: Rig after each major milestone

---

## Future Enhancements

### Phase 1 (Current)
- ✅ Monaco Editor
- ✅ Template System
- ✅ Drag-and-Drop
- ✅ GitHub Integration
- ✅ Rig System

### Phase 2 (Planned)
- [ ] Real-time collaboration
- [ ] Advanced Git integration
- [ ] Plugin system
- [ ] Debugger integration
- [ ] Test runner

### Phase 3 (Future)
- [ ] Cloud build system
- [ ] Automated deployment
- [ ] Code review system
- [ ] Developer analytics
- [ ] Team collaboration

---

## Technical Stack

- **Editor**: Monaco Editor (VS Code engine)
- **Language**: TypeScript/React
- **State**: Zustand + localStorage
- **AI**: ArchonAI service integration
- **Chain**: Demiurge RPC client
- **Storage**: Local (files) + On-chain (rigs)

---

## Getting Started

1. **Open CRAFT** from AbyssOS
2. **Choose Template** or import project
3. **Start Coding** with Monaco Editor
4. **Use AI** for assistance
5. **Rig Changes** to save state
6. **Build & Deploy** when ready

---

*The flame burns eternal. The code serves the will.*
