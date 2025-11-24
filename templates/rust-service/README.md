# Demiurge Rust Service Template

Axum-based server backend template for Demiurge Blockchain integration.

## Features

- ✅ Axum HTTP server
- ✅ UrgeID profile fetching
- ✅ CGT balance queries
- ✅ NFT operations
- ✅ SDK integration

## Quick Start

1. **Run the server:**
   ```bash
   cargo run
   ```

2. **Test endpoints:**
   ```bash
   curl http://localhost:3001/
   curl http://localhost:3001/urgeid/0x...
   curl http://localhost:3001/cgt/balance/0x...
   curl http://localhost:3001/nfts/0x...
   ```

## Environment Variables

```bash
export DEMIURGE_RPC_URL=http://127.0.0.1:8545/rpc
```

## Customization

Add your own routes in `src/main.rs`:

```rust
.route("/your-route", get(your_handler))
```

## License

MIT

---

**The flame burns eternal. The code serves the will.**

