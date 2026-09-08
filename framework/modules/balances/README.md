# Balances Module

**CGT token management - The Creator God Token**

## Token Details

- **Name**: Creator God Token
- **Symbol**: CGT
- **Total Supply**: 13,000,000,000 (fixed)
- **Precision**: 2 decimals
- **Smallest Unit**: 1 Spark = 0.01 CGT
- **Conversion**: 100 Sparks = 1 CGT

## Functions

- `transfer(to, amount)` - Transfer CGT
- `mint(to, amount)` - Mint new CGT (governance only)
- `burn(from, amount)` - Burn CGT

## Storage

- Account balances
- Total supply
- Reserves

## Usage

```rust
use demiurge_module_balances::BalancesModule;

let module = BalancesModule;
let call = BalanceCall::Transfer { to, amount };
module.execute(call.encode(), storage)?;
```
