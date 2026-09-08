# @demiurge/cli

Official command-line interface for the Demiurge Protocol.

**Features:** Interactive shell mode | Animated splash screen | Dual-mode operation | 30+ commands

## Installation

```bash
npm install -g @demiurge/cli

# Or use with npx
npx @demiurge/cli --help
```

## Dual-Mode Operation

The CLI supports two modes of operation:

### Interactive Shell Mode (Recommended)

Launch the interactive shell with animated splash screen:

```bash
# Start interactive shell
demiurge

# You'll see an animated splash screen, then enter the REPL:
# 🔥 DEMIURGE PROTOCOL
# Mainnet v1 | Genesis Block #1
# 
# demiurge> chain status
# demiurge> wallet generate
# demiurge> exit
```

**Shell Features:**
- Animated splash screen on launch
- Tab completion for commands and parameters
- Command history (up/down arrows)
- Session persistence
- Built-in help (`help` or `?`)

### Command Mode

Use traditional CLI for scripts and automation:

```bash
# Single commands
demiurge chain status
demiurge wallet balance <address>

# Pipe-friendly output
demiurge --json chain block-number | jq .blockNumber

# Use in scripts
BLOCK=$(demiurge --quiet chain block-number)
```

## Quick Start

```bash
# Interactive mode
demiurge
> chain status
> wallet generate --output my-wallet.json
> identity register --interactive
> exit

# Or command mode
demiurge chain status
demiurge chain block-number
demiurge wallet generate --output my-wallet.json
demiurge wallet balance <address>
demiurge identity register --interactive
demiurge nft list <owner-address>
```

## Commands

### Chain Operations

```bash
# Get current block number
demiurge chain block-number

# Get block information
demiurge chain block [number]

# Get chain status
demiurge chain status

# List validators
demiurge chain validators
```

### Wallet Management

```bash
# Generate new wallet
demiurge wallet generate
demiurge wallet generate --output wallet.json
demiurge wallet generate --mnemonic

# Import wallet
demiurge wallet import <private-key>
demiurge wallet import wallet.json

# Check balance
demiurge wallet balance <address>

# Send CGT
demiurge wallet send <to> <amount> --wallet wallet.json

# Check energy
demiurge wallet energy <address>

# View transaction history
demiurge wallet history <address> --limit 20
```

### NFT Operations (DRC-369)

```bash
# Get NFT info
demiurge nft info <token-id>

# List owned NFTs
demiurge nft list <owner-address>
demiurge nft list <owner-address> --limit 50

# Mint new NFT
demiurge nft mint --interactive
demiurge nft mint --name "Epic Sword" --description "..." --image "ipfs://..."

# Transfer NFT
demiurge nft transfer <token-id> <to-address> --wallet wallet.json

# Update dynamic state
demiurge nft update-state <token-id> --key "stats/damage" --value "100" --wallet wallet.json
```

### AI Agent Operations

```bash
# Deploy new agent
demiurge agent deploy --interactive
demiurge agent deploy --name "TradingBot" --mission "..." --autonomy bounded

# List agents
demiurge agent list
demiurge agent list --owner <address>

# Get agent status
demiurge agent status <agent-did>

# Stop agent
demiurge agent stop <agent-did> --reason "Maintenance"

# View agent logs
demiurge agent logs <agent-did>
demiurge agent logs <agent-did> --follow
```

### Identity (QOR ID)

```bash
# Register new QOR ID
demiurge identity register --interactive
demiurge identity register -u alice -p password123 -e alice@example.com

# Login
demiurge identity login alice#1234
demiurge identity login alice@example.com

# Resolve QOR ID to address
demiurge identity resolve alice#1234

# Check username availability
demiurge identity check alice

# View profile
demiurge identity profile
```

### Validator Operations

```bash
# List validators
demiurge validator list
demiurge validator list --all

# Get validator info
demiurge validator info <validator-address>

# Stake to validator
demiurge validator stake <validator> <amount> --wallet wallet.json
```

### Development Tools

```bash
# Initialize new project
demiurge dev init
demiurge dev init my-game --template game

# Test RPC connection
demiurge dev test-rpc

# Request testnet CGT
demiurge dev faucet <address>

# Run benchmark
demiurge dev benchmark --transactions 1000
```

## Global Options

```bash
# Specify RPC endpoint
demiurge --rpc https://rpc.demiurge.cloud chain status

# JSON output
demiurge --json chain block-number

# Quiet mode
demiurge --quiet wallet balance <address>

# No colors
demiurge --no-color chain status
```

## Configuration

### Environment Variables

```bash
# Set default RPC endpoint
export DEMIURGE_RPC_URL=https://rpc.demiurge.cloud

# Set QOR Auth endpoint
export QOR_AUTH_URL=https://demiurge.cloud/api/v1

# Enable debug mode
export DEBUG=true
```

### Config File

Create `~/.demiurge/config.json`:

```json
{
  "rpcUrl": "https://rpc.demiurge.cloud",
  "qorAuthUrl": "https://demiurge.cloud/api/v1",
  "defaultWallet": "~/.demiurge/wallet.json"
}
```

## Examples

### Deploy a Trading Agent

```bash
# Interactive deployment
demiurge agent deploy --interactive

# Programmatic deployment
demiurge agent deploy \
  --name "MarketAnalyzer" \
  --mission "Analyze CGT price trends and provide insights" \
  --autonomy bounded \
  --limit 500 \
  --llm gemini \
  --api-key $GEMINI_API_KEY
```

### Mint a Game Asset NFT

```bash
demiurge nft mint \
  --name "Legendary Sword" \
  --description "Forged in the fires of the Demiurge" \
  --image "ipfs://QmX..." \
  --wallet my-wallet.json \
  --interactive
```

### Check Validator Performance

```bash
# List all validators
demiurge validator list

# Get detailed info
demiurge validator info 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY

# Stake to validator
demiurge validator stake \
  5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY \
  1000 \
  --wallet wallet.json
```

## Interactive Shell Commands

When in interactive shell mode, additional commands are available:

```bash
# Shell-specific commands
help              # Show available commands
?                 # Alias for help
clear             # Clear the screen
history           # Show command history
exit              # Exit the shell
quit              # Alias for exit

# Tab completion
wal<TAB>          # Completes to "wallet"
wallet gen<TAB>   # Completes to "wallet generate"
```

## Output Formats

### Default (Pretty)

```
🔥 Demiurge Protocol CLI

📦 Current Block: 1
⚡ Genesis: Fresh
🏛️  Validators: 4
💰 Treasury: 1,000,000,000 CGT
```

### JSON

```bash
demiurge --json chain status
```

```json
{
  "blockNumber": 1,
  "genesis": "fresh",
  "validators": 4,
  "treasury": "1000000000"
}
```

## Development

### Build from Source

```bash
git clone https://github.com/ALaustrup/Demiurge-Blockchain.git
cd Demiurge-Blockchain/cli
npm install
npm run build
npm link
```

### Run Tests

```bash
npm test
```

## Troubleshooting

### Connection Issues

```bash
# Test RPC connection
demiurge dev test-rpc

# Try different endpoint
demiurge --rpc http://localhost:9944 chain status
```

### Wallet Issues

```bash
# Verify wallet file format
cat wallet.json | jq .

# Generate new wallet
demiurge wallet generate --output new-wallet.json
```

## Related Packages

- [@demiurge/sdk](https://www.npmjs.com/package/@demiurge/sdk) - Core SDK
- [@demiurge/qor-sdk](https://www.npmjs.com/package/@demiurge/qor-sdk) - Identity
- [@demiurge/drc369-sdk](https://www.npmjs.com/package/@demiurge/drc369-sdk) - NFTs
- [@demiurge/agent-foundry](https://www.npmjs.com/package/@demiurge/agent-foundry) - Agents

## License

MIT - Demiurge Protocol

## Links

- [Documentation](https://demiurge.cloud/docs)
- [GitHub](https://github.com/ALaustrup/Demiurge-Blockchain)
- [Website](https://demiurge.cloud)
- [Discord](https://discord.gg/demiurge)
