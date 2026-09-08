# Start Here - Demiurge Protocol

**Last Updated:** September 8, 2026

> **Status:** pre-alpha, local-first. There is no hosted network; every URL below that mentions `demiurge.cloud` is historical and should be read as `http://127.0.0.1`. See [`STATUS.md`](../STATUS.md) for what works.

Welcome to Demiurge! This guide helps you find exactly what you need.

---

## What Do You Want to Do?

### 🎮 **I'm a User / Gamer**
*I want to use Demiurge-powered apps, hold CGT tokens, or interact with NFTs*

**Start with:** [Wallet Setup Guide](./getting-started/WALLET_SETUP.md)

Quick path:
1. Install the [Browser Wallet Extension](./sdk/WALLET_EXTENSION.md)
2. Create or import a wallet
3. Claim your starter CGT bonus
4. Explore https://demiurge.cloud

---

### 💻 **I'm a Developer**
*I want to build apps, integrate with Demiurge, or contribute to the protocol*

**Choose your path:**

| I want to... | Guide |
|--------------|-------|
| Get started quickly (5 min) | [5-Minute Quickstart](./getting-started/5-MINUTE_QUICKSTART.md) |
| Build a dApp | [dApp Quickstart](./getting-started/DAPP_QUICKSTART.md) |
| Use the TypeScript SDK | [TypeScript SDK](./sdk/TYPESCRIPT_SDK.md) |
| Integrate a game engine | [Unity](./developers/drc-sdk/UNITY_INTEGRATION.md) / [Unreal](./sdk/unreal/) |
| Set up full dev environment | [Complete Setup Guide](./developers/COMPLETE_SETUP_GUIDE.md) |
| Explore RPC methods | [RPC Reference](./developers/rpc-reference.md) |

---

### ⚡ **I'm a Validator / Node Operator**
*I want to run a node, stake CGT, or participate in consensus*

**Start with:** [Validator Quickstart](./getting-started/VALIDATOR_QUICKSTART.md)

Quick path:
1. [Deploy a node](./deployment/TESTNET_DEPLOYMENT_GUIDE.md)
2. Register as validator via [CLI](./developers/VALIDATOR_CLI.md)
3. Stake CGT and start earning rewards

---

### 🧪 **I'm a Tester**
*I want to test features, report bugs, or participate in testnet*

**Start with:** [Testnet Quickstart](./getting-started/TESTNET_QUICKSTART.md)

Quick path:
1. Connect to testnet RPC: `https://testnet.demiurge.cloud:9944`
2. Get testnet tokens from faucet
3. Test features and report issues

---

### 📚 **I'm Researching**
*I want to understand how Demiurge works*

| Topic | Document |
|-------|----------|
| Overview | [Main README](../README.md) |
| Architecture | [Architecture Overview](./architecture/README.md) |
| Consensus | [Consensus Design](./architecture/consensus.md) |
| NFT Standard | [DRC-369 Specification](./specifications/drc369.md) |
| Token Economics | [CGT Tokenomics](./specifications/cgt-tokenomics.md) |
| Security | [CVP Specification](./specifications/cvp.md) |
| Identity | [QOR ID Specification](./specifications/qor-id.md) |

---

## Quick Reference

### Live Endpoints

| Service | URL |
|---------|-----|
| Web Platform | https://demiurge.cloud |
| RPC (HTTP) | https://rpc.demiurge.cloud:9944 |
| RPC (WebSocket) | wss://rpc.demiurge.cloud:9944 |
| Testnet RPC | https://testnet.demiurge.cloud:9944 |
| GitHub | https://github.com/ALaustrup/Demiurge-Blockchain |

### Key Commands

```bash
# Install CLI
npm install -g @demiurge/cli

# Check chain status
demiurge chain status

# Generate wallet
demiurge wallet generate

# Check balance
demiurge wallet balance <address>
```

### SDKs

```bash
# Core SDK
npm install @demiurge/sdk

# Identity SDK
npm install @demiurge/qor-sdk

# NFT SDK
npm install @demiurge/drc369-sdk
```

---

## Need Help?

- **GitHub Issues:** https://github.com/ALaustrup/Demiurge-Blockchain/issues
- **Documentation:** Browse the `docs/` folder
- **Troubleshooting:** [Troubleshooting Guide](./troubleshooting/TROUBLESHOOTING.md)

---

## Documentation Map

```
docs/
├── START_HERE.md              ← You are here
├── getting-started/           ← Beginner guides
│   ├── 5-MINUTE_QUICKSTART.md
│   ├── WALLET_SETUP.md
│   ├── VALIDATOR_QUICKSTART.md
│   ├── DAPP_QUICKSTART.md
│   └── TESTNET_QUICKSTART.md
├── developers/                ← Developer reference
│   ├── COMPLETE_SETUP_GUIDE.md
│   ├── rpc-reference.md
│   └── VALIDATOR_CLI.md
├── sdk/                       ← SDK documentation
│   ├── TYPESCRIPT_SDK.md
│   └── WALLET_EXTENSION.md
├── deployment/                ← Deployment guides
│   ├── PRODUCTION_DEPLOYMENT.md
│   └── DOCKER_TESTNET.md
├── configuration/             ← Configuration reference
│   ├── CONFIGURATION_REFERENCE.md
│   └── ENVIRONMENT_VARIABLES.md
├── architecture/              ← Technical architecture
├── specifications/            ← Protocol specifications
└── troubleshooting/           ← Problem solving
```

---

**Built with 🔥 by Team Laustrup**
