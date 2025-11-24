# Demiurge CLI

Command-line interface for the Demiurge Blockchain.

## Installation

```bash
cargo install --path cli
```

## Usage

### UrgeID Operations

```bash
# Generate a new UrgeID
demiurge urgeid generate

# Get UrgeID profile
demiurge urgeid profile 0x...

# Resolve username
demiurge urgeid resolve username

# Get progress
demiurge urgeid progress 0x...
```

### CGT Operations

```bash
# Get balance
demiurge cgt balance 0x...

# Get metadata
demiurge cgt metadata

# Get total supply
demiurge cgt supply

# Get chain info
demiurge cgt chain-info
```

### NFT Operations

```bash
# Get NFT by ID
demiurge nft get 123

# Get NFTs by owner
demiurge nft by-owner 0x...
```

### Marketplace Operations

```bash
# List all listings
demiurge marketplace list

# Get listing by ID
demiurge marketplace get 1
```

## Options

- `--rpc-url`: Specify RPC URL (default: `http://127.0.0.1:8545/rpc`)

## License

MIT

