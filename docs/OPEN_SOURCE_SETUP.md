# 🌐 Open Source Setup Guide

**Optimizing the repository for open source developers building dApps and games**

---

## 🎯 Repository Structure for Developers

This repository is organized to give developers everything they need to build on Demiurge, without requiring them to understand the full blockchain implementation.

### 📁 Key Directories

```
Demiurge-Blockchain/
├── docs/developers/          # 👨‍💻 Developer documentation
│   ├── QUICK_START.md       # ⚡ 5-minute quick start
│   ├── getting-started.md   # Complete setup guide
│   ├── rpc-api-reference.md # All RPC methods
│   └── transaction-building.md
│
├── framework/               # 🔧 Blockchain framework (for contributors)
│   ├── rpc/                 # RPC layer (useful for SDK developers)
│   └── modules/             # Module implementations
│
├── packages/                # 📦 SDKs and libraries
│   ├── qor-sdk/            # QOR Identity SDK
│   └── ui-shared/          # Shared UI components
│
├── apps/                    # 🌐 Applications (reference implementations)
│   └── hub/                # Main web platform
│
└── services/                # 🔐 Backend services
    └── qor-auth/           # QOR Identity service
```

---

## 🚀 What Developers Need

### Essential Files

1. **`DEVELOPER_GUIDE.md`** - Main entry point for developers
2. **`docs/developers/QUICK_START.md`** - 5-minute quick start
3. **`docs/developers/getting-started.md`** - Complete setup
4. **`docs/developers/rpc-api-reference.md`** - API documentation

### RPC Endpoint

**Production**: `https://rpc.demiurge.cloud`  
**Local**: `http://localhost:9944`

---

## 📚 Documentation Strategy

### For dApp Developers
- Focus on RPC API and SDK usage
- Provide code examples in multiple languages
- Show common patterns (checking balance, querying NFTs, etc.)
- No need to understand blockchain internals

### For Game Developers
- Emphasize session keys and seamless UX
- Show NFT integration patterns
- Provide game-specific examples
- Focus on feeless transactions

### For Contributors
- Full framework documentation
- Architecture guides
- Module specifications
- Contribution guidelines

---

## 🔒 What to Keep Private

### Internal/Private
- Server IP addresses (use domains instead)
- Internal deployment scripts
- Production environment variables
- Private keys or secrets

### What's Public
- ✅ RPC endpoint URLs (`rpc.demiurge.cloud`)
- ✅ API documentation
- ✅ SDK code
- ✅ Example implementations
- ✅ Framework code (open source)

---

## 📝 Documentation Best Practices

### Use Production Endpoints
- ✅ `https://rpc.demiurge.cloud` (production)
- ✅ `http://localhost:9944` (local development)
- ❌ `http://127.0.0.1:9944` (internal IP)

### Clear Examples
- Show both production and local examples
- Include error handling
- Provide multiple language examples (TypeScript, Python, Rust)

### Developer-Focused
- Start with "what can I build?"
- Show real-world examples
- Minimize blockchain internals
- Focus on practical usage

---

## 🎯 Repository Goals

### For Developers
- **Easy to start** - Quick start guide gets them building in 5 minutes
- **Clear documentation** - Everything needed to build dApps/games
- **Working examples** - Real code they can copy and use
- **Active support** - Issues and discussions welcome

### For Contributors
- **Clear architecture** - Understand how it works
- **Modular design** - Easy to contribute modules
- **Testing** - Comprehensive test suite
- **Documentation** - Internal docs for contributors

---

## ✅ Checklist for Open Source Readiness

- [x] Developer quick start guide
- [x] RPC endpoint documentation
- [x] API reference
- [x] Code examples
- [x] Clear repository structure
- [x] Contribution guidelines
- [x] License file (MIT)
- [x] README with clear entry points
- [x] Issue templates
- [x] Pull request template

---

**The repository is optimized for developers to build amazing things on Demiurge!**
