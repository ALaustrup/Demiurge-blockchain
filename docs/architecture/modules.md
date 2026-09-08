# Module System

Demiurge uses a modular architecture where functionality is organized into runtime modules.

---

## Overview

Modules are self-contained units that:
- Manage their own storage (prefixed keys)
- Define their own transactions
- Implement the `Module` trait
- Can be hot-swapped at runtime

---

## Core Modules

### Balances (`balances`)
**Purpose:** CGT token management

| Function | Description |
|----------|-------------|
| `transfer` | Send CGT between accounts |
| `mint` | Create new CGT (privileged) |
| `burn` | Destroy CGT |
| `get_balance` | Query account balance |

**Storage Keys:**
- `Balances:Account:{address}` - Account balance
- `Balances:TotalSupply` - Total CGT in circulation
- `Balances:StarterClaimed:{address}` - Starter bonus tracking

### Energy (`energy`)
**Purpose:** Feeless transaction system

| Function | Description |
|----------|-------------|
| `consume_energy` | Spend energy for transaction |
| `regenerate_energy` | Restore energy over time |
| `get_energy` | Query current energy |

**Configuration:**
- Max energy: 1,000 per account
- Regeneration: 10 per block
- Transaction cost: 1-10 energy

**Storage Keys:**
- `Energy:Account:{address}` - Current energy
- `Energy:LastUpdate:{address}` - Last regeneration block

### DRC-369 (`drc369`)
**Purpose:** Dynamic NFTs with physics

| Function | Description |
|----------|-------------|
| `mint` | Create new NFT |
| `transfer` | Transfer NFT ownership |
| `set_physics` | Set physics properties |
| `get_physics` | Query physics data |
| `update_state` | Modify dynamic state |

**Storage Keys:**
- `DRC369:Token:{id}` - Token metadata
- `DRC369:Owner:{id}` - Token owner
- `DRC369:Physics:{id}` - Physics properties
- `DRC369:State:{id}:{key}` - Dynamic state
- `DRC369:TotalSupply` - Total NFTs minted

### Session Keys (`session-keys`)
**Purpose:** Temporary authorization

| Function | Description |
|----------|-------------|
| `authorize_session_key` | Grant temporary access |
| `revoke_session_key` | Remove access |
| `validate_session_key` | Check authorization |
| `cleanup_expired_keys` | Remove expired keys |

**Storage Keys:**
- `SessionKeys:Key:{primary}:{session}` - Session key data
- `SessionKeys:Expiry:{primary}:{session}` - Expiration time

### CVP (`cvp`)
**Purpose:** Consensus-Verified Polymorphism (security)

| Function | Description |
|----------|-------------|
| `mutate` | Trigger code mutation |
| `verify_equivalence` | Check semantic equality |
| `detect_attack` | Analyze for exploits |
| `emergency_mutate` | Immediate security response |

**Storage Keys:**
- `CVP:Contract:{id}` - Contract bytecode
- `CVP:Epoch:{id}` - Current mutation epoch
- `CVP:Proof:{id}:{epoch}` - ZK equivalence proof

### Agentic (`agentic`)
**Purpose:** AI agent system

| Function | Description |
|----------|-------------|
| `register_agent` | Create agent identity |
| `set_capabilities` | Define agent permissions |
| `execute_action` | Agent performs action |
| `get_agent_did` | Query agent DID |

**Storage Keys:**
- `Agentic:Agent:{did}` - Agent metadata
- `Agentic:Capabilities:{did}` - Permission set
- `Agentic:Owner:{did}` - Agent owner

---

## Module Trait

All modules implement the `Module` trait:

```rust
pub trait Module: Send + Sync {
    /// Module name for dispatch
    fn name(&self) -> &'static str;
    
    /// Execute a module call
    fn execute(
        &self,
        call: Vec<u8>,
        storage: &dyn Storage,
    ) -> Result<(), ModuleError>;
    
    /// Called at block start
    fn on_initialize(
        &self,
        block_number: u64,
        storage: &dyn Storage,
    ) -> Result<(), ModuleError>;
    
    /// Called at block end
    fn on_finalize(
        &self,
        block_number: u64,
        storage: &dyn Storage,
    ) -> Result<(), ModuleError>;
}
```

---

## Storage Pattern

Modules use prefixed storage keys:

```rust
// Example: Balances module
const BALANCE_PREFIX: &[u8] = b"Balances:Account:";

fn balance_key(account: &[u8; 32]) -> Vec<u8> {
    let mut key = BALANCE_PREFIX.to_vec();
    key.extend_from_slice(account);
    key
}

// Read balance
let balance = storage.get(&balance_key(&account))
    .map(|bytes| u128::decode(&bytes))
    .unwrap_or(0);

// Write balance
storage.put(&balance_key(&account), &balance.encode());
```

---

## Creating a New Module

### 1. Define Storage Keys

```rust
mod storage_keys {
    pub const MY_DATA: &[u8] = b"MyModule:Data:";
    pub const MY_CONFIG: &[u8] = b"MyModule:Config";
}
```

### 2. Implement Module Trait

```rust
pub struct MyModule;

impl Module for MyModule {
    fn name(&self) -> &'static str {
        "my_module"
    }
    
    fn execute(&self, call: Vec<u8>, storage: &dyn Storage) -> Result<(), ModuleError> {
        // Decode and handle call
        Ok(())
    }
    
    fn on_initialize(&self, _block: u64, _storage: &dyn Storage) -> Result<(), ModuleError> {
        Ok(())
    }
    
    fn on_finalize(&self, _block: u64, _storage: &dyn Storage) -> Result<(), ModuleError> {
        Ok(())
    }
}
```

### 3. Register in Runtime

```rust
// In runtime.rs
runtime.register_module(Box::new(MyModule));
```

### 4. Add RPC Methods

```rust
// In rpc/methods.rs
pub async fn my_module_get_data(&self, key: String) -> Result<Data, RpcError> {
    // Implementation
}

// In rpc/server.rs
module.register_async_method("myModule_getData", |params, ctx| async move {
    ctx.my_module_get_data(params.one()?).await
});
```

---

## Module Directory Structure

```
framework/modules/
├── src/
│   ├── lib.rs        # Module exports
│   └── traits.rs     # Module trait definition
├── balances/
│   ├── src/
│   │   ├── lib.rs
│   │   └── balances.rs
│   └── Cargo.toml
├── energy/
│   ├── src/
│   │   ├── lib.rs
│   │   └── energy.rs
│   └── Cargo.toml
├── drc369/
│   ├── src/
│   │   ├── lib.rs
│   │   ├── nft.rs
│   │   └── physics.rs
│   └── Cargo.toml
└── ... (other modules)
```

---

## Module Communication

Modules can interact through:

### 1. Direct Storage Access
```rust
// Energy module reads balance
let balance = BalancesModule::get_balance(storage, &account);
```

### 2. Cross-Module Calls
```rust
// DRC-369 module deducts royalties via balances
BalancesModule::transfer(storage, from, royalty_recipient, royalty_amount)?;
```

### 3. Events
```rust
// Emit event for external listeners
self.emit_event(Event::Transfer { from, to, amount });
```

---

## Testing Modules

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::storage::MockStorage;
    
    #[test]
    fn test_transfer() {
        let storage = MockStorage::new();
        let module = BalancesModule;
        
        // Setup
        module.mint(&storage, alice, 1000).unwrap();
        
        // Test
        module.transfer(&storage, alice, bob, 500).unwrap();
        
        // Assert
        assert_eq!(module.get_balance(&storage, &alice), 500);
        assert_eq!(module.get_balance(&storage, &bob), 500);
    }
}
```

---

## Further Reading

- [Architecture Overview](./README.md)
- [DRC-369 Specification](../specifications/drc369.md)
- [RPC Reference](../developers/rpc-reference.md)
