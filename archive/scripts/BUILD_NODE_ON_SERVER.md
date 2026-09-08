# Building Blockchain Node on Server - Step by Step

## Quick Start

```bash
# 1. SSH to server
ssh pleroma

# 2. Navigate to blockchain directory
cd /data/Demiurge-Blockchain/blockchain

# 3. Source Rust environment
source ~/.cargo/env

# 4. Build the node (this will take 30-60 minutes)
cargo build --release --bin demiurge-node
```

## Detailed Steps

### Step 1: Connect to Server

```bash
ssh pleroma
```

### Step 2: Navigate to Blockchain Directory

```bash
cd /data/Demiurge-Blockchain/blockchain
```

### Step 3: Source Rust Environment

**Important:** You must source the Rust environment in every new SSH session:

```bash
source ~/.cargo/env
```

Verify Rust is available:
```bash
rustc --version
cargo --version
```

Expected output:
```
rustc 1.94.0-nightly (f6a07efc8 2026-01-16)
cargo 1.94.0-nightly (6d1bd93c4 2026-01-10)
```

### Step 4: Handle Dependency Conflict (if needed)

If you encounter the `librocksdb-sys` conflict, try these workarounds:

#### Option A: Update Dependencies

```bash
cargo update
cargo build --release --bin demiurge-node
```

#### Option B: Clean and Rebuild

```bash
# Clean previous builds
cargo clean

# Build again
cargo build --release --bin demiurge-node
```

#### Option C: Build Specific Workspace Member

```bash
cd node
cargo build --release --bin demiurge-node
```

### Step 5: Build the Node

**Full build command:**
```bash
cargo build --release --bin demiurge-node
```

**Expected build time:** 30-60 minutes (depending on server resources)

**What happens:**
- Downloads and compiles all dependencies
- Compiles the blockchain runtime
- Compiles the node binary
- Creates optimized release binary at `target/release/demiurge-node`

### Step 6: Verify Build

After build completes, verify the binary exists:

```bash
ls -lh target/release/demiurge-node
```

You should see something like:
```
-rwxr-xr-x 1 ubuntu ubuntu 150M Jan 17 03:00 target/release/demiurge-node
```

Test the binary:
```bash
./target/release/demiurge-node --version
```

## Running in Background (tmux/screen)

Since the build takes a long time, use `tmux` or `screen`:

### Using tmux (Recommended)

```bash
# Start a new tmux session
tmux new -s build-node

# Run the build command
cd /data/Demiurge-Blockchain/blockchain
source ~/.cargo/env
cargo build --release --bin demiurge-node

# Detach: Press Ctrl+B, then D
# Reattach: tmux attach -t build-node
```

### Using screen

```bash
# Start a new screen session
screen -S build-node

# Run the build command
cd /data/Demiurge-Blockchain/blockchain
source ~/.cargo/env
cargo build --release --bin demiurge-node

# Detach: Press Ctrl+A, then D
# Reattach: screen -r build-node
```

## Monitoring Build Progress

While building, you can monitor:

### Check Build Progress
```bash
# In another SSH session
tail -f target/release/.cargo-lock  # Not always available
```

### Check System Resources
```bash
htop                    # CPU/Memory usage
df -h                   # Disk space
```

### Check Cargo Cache
```bash
du -sh ~/.cargo/registry
du -sh ~/.cargo/git
```

## Troubleshooting

### Build Fails with librocksdb-sys Error

**Error:**
```
error: failed to select a version for `librocksdb-sys`
```

**Solutions:**

1. **Try updating dependencies:**
   ```bash
   cargo update
   cargo build --release --bin demiurge-node
   ```

2. **Clean and rebuild:**
   ```bash
   cargo clean
   cargo build --release --bin demiurge-node
   ```

3. **Check Substrate versions** in `blockchain/node/Cargo.toml` - ensure `sc-cli` and `sc-service` use compatible versions

### Out of Memory During Build

If build fails due to memory:

```bash
# Check available memory
free -h

# Build with limited parallelism (uses less memory)
cargo build --release --bin demiurge-node -j 2
```

### Disk Space Issues

```bash
# Check disk space
df -h

# Clean Cargo cache if needed (frees ~5-10GB)
cargo clean
rm -rf ~/.cargo/registry/cache
```

### Build Hangs or Very Slow

- Check CPU usage: `htop`
- Ensure you're building in release mode: `--release`
- Consider building with fewer parallel jobs: `-j 2` or `-j 4`

## After Successful Build

Once the build completes successfully:

1. **Test the binary:**
   ```bash
   ./target/release/demiurge-node --version
   ./target/release/demiurge-node --help
   ```

2. **Run the node** (see `BLOCKCHAIN_NODE_SETUP.md` for details):
   ```bash
   ./target/release/demiurge-node \
     --chain demiurge-testnet \
     --name "Pleroma-Validator" \
     --validator \
     --rpc-cors all \
     --rpc-external \
     --prometheus-external \
     --base-path /data/demiurge-node-data
   ```

3. **Or set up as systemd service** (see `BLOCKCHAIN_NODE_SETUP.md`)

## Quick Reference

```bash
# Full build process
ssh pleroma
cd /data/Demiurge-Blockchain/blockchain
source ~/.cargo/env
cargo build --release --bin demiurge-node

# Check if binary exists
ls -lh target/release/demiurge-node

# Run node
./target/release/demiurge-node --chain demiurge-testnet --validator
```

---

**Build Time:** 30-60 minutes  
**Binary Location:** `/data/Demiurge-Blockchain/blockchain/target/release/demiurge-node`  
**Binary Size:** ~150MB (optimized release build)
