# RPC Implementation Notes

**Status:** Implementation structure complete, requires async state API integration

## Current Implementation

The RPC handlers are structured but require async state API calls to query storage. The current implementation provides:

1. **Storage key generation functions** - All storage keys are properly generated
2. **Account decoding** - SS58 address decoding works correctly  
3. **Error handling** - Proper error types and messages
4. **Method registration** - All RPC methods are registered

## What's Needed

To complete the RPC implementation, the handlers need to:

1. Use `sc_client_api::StorageProvider` trait to query storage
2. Convert storage values from SCALE-encoded bytes to Rust types
3. Handle optional storage values (Some/None)
4. Return proper JSON-RPC responses

## Implementation Pattern

Each RPC method should follow this pattern:

```rust
fn balance(&self, account: String) -> RpcResult<String> {
    let account_id = decode_account(&account)?;
    let storage_key = storage_key_for_balance(&account_id);
    let block_hash = self.get_latest_block_hash()?;
    
    // Query storage (requires async state API)
    // This would use: client.storage(block_hash, storage_key)
    // Then decode the SCALE-encoded balance value
    // Return as hex string or decimal string
    
    Ok(format!("0x0")) // Placeholder
}
```

## Next Steps

1. Add `sc-client-api` dependency with `StorageProvider` trait
2. Make RPC methods async (or use blocking storage API)
3. Implement storage value decoding for each pallet type
4. Add proper error handling for storage queries
5. Test with running node

## Storage Types to Decode

- **Balances**: `pallet_balances::AccountData<Balance>` - decode `free` field
- **CGT TotalBurned**: `Balance` (u128)
- **CGT CirculatingSupply**: `Balance` (u128)
- **QOR Identity**: `pallet_qor_identity::Identity` struct
- **DRC-369 Items**: `pallet_drc369::Item` struct
- **DRC-369 Owners**: `AccountId`

---

**Note:** Full implementation requires the node to be running and state API access. The current structure is ready for completion.
