# Demiurge Rust SDK

Rust SDK for interacting with the Demiurge Blockchain.

## Usage

Add to your `Cargo.toml`:

```toml
[dependencies]
demiurge-rust-sdk = { path = "../sdk/rust-sdk" }
tokio = { version = "1.0", features = ["full"] }
```

Example:

```rust
use demiurge_rust_sdk::DemiurgeSDK;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let sdk = DemiurgeSDK::new("http://127.0.0.1:8545/rpc");
    
    // Get CGT balance
    let balance = sdk.cgt().get_balance("0x...").await?;
    
    // Get UrgeID profile
    let profile = sdk.urgeid().get_profile("0x...").await?;
    
    // Get NFTs
    let nfts = sdk.nft().get_nfts_by_owner("0x...").await?;
    
    Ok(())
}
```

## License

MIT

