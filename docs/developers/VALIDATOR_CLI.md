# Validator CLI Reference

**Last Updated:** February 4, 2026

Complete reference for Demiurge validator operations via the CLI.

---

## Overview

The Demiurge CLI provides comprehensive validator management commands for:

- Listing and querying validators
- Registering as a validator
- Staking and unstaking CGT
- Claiming rewards
- Managing commission rates

---

## Prerequisites

### Install the CLI

```bash
# Install globally
npm install -g @demiurge/cli

# Verify installation
demiurge --version

# Or run from source
cd cli
npm install
npm run build
npm link
```

### Configure Wallet

```bash
# Generate a new wallet
demiurge wallet generate --output validator-wallet.json

# Or use existing wallet
export DEMIURGE_WALLET_PATH=/path/to/wallet.json
```

---

## Commands

### List All Validators

Display all registered validators on the network.

```bash
demiurge validator list
```

**Output:**
```
┌─────────┬────────────────────┬────────────┬────────────┬────────────┐
│ Rank    │ Address            │ Stake      │ Commission │ Status     │
├─────────┼────────────────────┼────────────┼────────────┼────────────┤
│ 1       │ 0x1234...5678      │ 100,000    │ 5%         │ Active     │
│ 2       │ 0xabcd...ef01      │ 75,000     │ 10%        │ Active     │
│ 3       │ 0x9876...5432      │ 50,000     │ 8%         │ Active     │
└─────────┴────────────────────┴────────────┴────────────┴────────────┘

Total Validators: 3
Total Staked: 225,000 CGT
```

**Options:**
```bash
--limit <n>       # Limit number of results (default: 50)
--offset <n>      # Skip first n results
--sort <field>    # Sort by: stake, commission, address
--format <type>   # Output format: table, json, csv
```

---

### Get Validator Info

Get detailed information about a specific validator.

```bash
demiurge validator info <address>

# Example
demiurge validator info 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

**Output:**
```
Validator Information
═══════════════════════════════════════════════════════════════

Address:         0x1234...abcdef
Status:          Active
Total Stake:     100,000 CGT
Self Stake:      50,000 CGT
Delegated Stake: 50,000 CGT
Commission:      5%
Pending Rewards: 1,250 CGT

Performance (Last 100 Eras):
  - Blocks Produced: 847
  - Uptime: 99.7%
  - Slashing Events: 0

Delegators: 12

═══════════════════════════════════════════════════════════════
```

---

### Register as Validator

Register a new validator on the network.

```bash
demiurge validator register [options]
```

**Options:**
```bash
--stake <amount>      # Initial stake amount (required)
--commission <rate>   # Commission percentage 0-100 (default: 10)
--wallet <path>       # Path to wallet file
--password            # Prompt for wallet password
```

**Example:**
```bash
demiurge validator register --stake 10000 --commission 5 --wallet ./my-wallet.json
```

**Output:**
```
🚀 Registering Validator...

Wallet: 0x1234...abcdef
Initial Stake: 10,000 CGT
Commission Rate: 5%

⚠️  This will lock 10,000 CGT as validator stake.
Continue? (y/n): y

Signing transaction...
Broadcasting...

✅ Validator Registered Successfully!

Transaction Hash: 0xabc123...
Validator Address: 0x1234...abcdef
Status: Active (next era)
```

**Requirements:**
- Minimum stake: 1,000 CGT
- Sufficient balance for stake + fees
- Valid wallet with signing capability

---

### Stake CGT

Stake additional CGT to a validator.

```bash
demiurge validator stake <amount> [options]
```

**Options:**
```bash
--validator <address>  # Target validator (default: self if registered)
--wallet <path>        # Path to wallet file
```

**Example:**
```bash
# Stake to your own validator
demiurge validator stake 5000

# Delegate to another validator
demiurge validator stake 5000 --validator 0xabcd...
```

**Output:**
```
📈 Staking CGT...

Amount: 5,000 CGT
Target Validator: 0xabcd...efgh
Current Stake: 10,000 CGT
New Total: 15,000 CGT

Signing transaction...
Broadcasting...

✅ Stake Successful!

Transaction Hash: 0xdef456...
New Total Stake: 15,000 CGT
Estimated APY: 12.5%
```

---

### Unstake CGT

Unstake CGT from a validator (subject to unbonding period).

```bash
demiurge validator unstake <amount> [options]
```

**Options:**
```bash
--validator <address>  # Target validator (default: self if registered)
--wallet <path>        # Path to wallet file
```

**Example:**
```bash
demiurge validator unstake 2000
```

**Output:**
```
📉 Unstaking CGT...

Amount: 2,000 CGT
From Validator: 0x1234...abcdef
Current Stake: 15,000 CGT
Remaining: 13,000 CGT

⚠️  Unbonding period: 7 days (168 eras)
Funds available at era: 1,245

Continue? (y/n): y

Signing transaction...
Broadcasting...

✅ Unstake Initiated!

Transaction Hash: 0x789abc...
Unbonding Amount: 2,000 CGT
Available At: Era 1,245 (~7 days)
```

---

### Claim Rewards

Claim pending staking rewards.

```bash
demiurge validator claim-rewards [options]
```

**Options:**
```bash
--wallet <path>   # Path to wallet file
```

**Example:**
```bash
demiurge validator claim-rewards
```

**Output:**
```
💰 Claiming Rewards...

Validator: 0x1234...abcdef
Pending Rewards: 1,250 CGT
Current Balance: 5,000 CGT

Signing transaction...
Broadcasting...

✅ Rewards Claimed!

Transaction Hash: 0xaaa111...
Amount Claimed: 1,250 CGT
New Balance: 6,250 CGT
```

---

### Get Staking Status

Check your staking status across all validators.

```bash
demiurge validator status [options]
```

**Options:**
```bash
--address <addr>  # Check specific address (default: wallet address)
```

**Example:**
```bash
demiurge validator status
```

**Output:**
```
Staking Status for 0x1234...abcdef
═══════════════════════════════════════════════════════════════

Role: Validator
Validator Address: 0x1234...abcdef

Stake Summary:
  Self Stake:      50,000 CGT
  Delegated Stake: 25,000 CGT
  Total Stake:     75,000 CGT

Rewards:
  Pending Rewards: 1,250 CGT
  Lifetime Earned: 15,000 CGT

Unbonding:
  In Progress:     0 CGT
  Available:       0 CGT

Delegations (as delegator):
  None

═══════════════════════════════════════════════════════════════
```

---

### Set Commission Rate

Update your validator's commission rate.

```bash
demiurge validator set-commission <rate> [options]
```

**Options:**
```bash
--wallet <path>   # Path to wallet file
```

**Example:**
```bash
demiurge validator set-commission 8
```

**Output:**
```
⚙️  Updating Commission Rate...

Validator: 0x1234...abcdef
Current Commission: 5%
New Commission: 8%

⚠️  Commission changes take effect next era.
Continue? (y/n): y

Signing transaction...
Broadcasting...

✅ Commission Updated!

Transaction Hash: 0xbbb222...
New Commission: 8%
Effective: Era 1,078
```

**Constraints:**
- Commission rate must be 0-100%
- Changes are limited to once per era
- New rate applies from the next era

---

## Interactive Mode

All validator commands are available in the interactive shell:

```bash
demiurge
```

```
🔥 DEMIURGE PROTOCOL CLI
═══════════════════════════════════════════════════════════════

Welcome to the Demiurge Interactive Shell
Type 'help' for available commands

demiurge> validator list
(displays validators)

demiurge> validator register --stake 10000
(interactive registration flow)

demiurge> exit
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEMIURGE_RPC_URL` | RPC endpoint | https://rpc.demiurge.cloud:9944 |
| `DEMIURGE_WALLET_PATH` | Default wallet path | ./wallet.json |
| `DEMIURGE_NETWORK` | Network (mainnet/testnet) | mainnet |

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Wallet error (not found, wrong password) |
| 4 | RPC error |
| 5 | Transaction failed |
| 6 | Insufficient balance |

---

## Related Documentation

- [RPC Reference](./rpc-reference.md) - Underlying RPC methods
- [TypeScript SDK](../sdk/TYPESCRIPT_SDK.md) - Programmatic access
- [Complete Setup Guide](./COMPLETE_SETUP_GUIDE.md) - Development setup
