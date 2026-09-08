# 🖥️ MONAD CONFIGURATION & SANITY CHECK

> *The Monad: The primordial source from which all computation emanates.*

---

## 📋 Table of Contents

1. [System Identity](#system-identity)
2. [Hardware Specifications](#hardware-specifications)
3. [2026 Toolchain Versions](#2026-toolchain-versions)
4. [Kernel Optimizations](#kernel-optimizations)
5. [Pre-Flight Sanity Check](#pre-flight-sanity-check)
6. [UE 5.7.1 Build Commands](#ue-571-build-commands)

---

## System Identity

| Property | Value |
|----------|-------|
| **Server Name** | Monad |
| **Hostname** | Pleroma |
| **IP Address** | 127.0.0.1 |
| **OS** | Ubuntu Server 25.10 "Questing Quokka" |
| **Provider** | OVH (RISE-LE-2) |
| **Kernel** | 6.x (HWE) |
| **Architecture** | x86_64 |

---

## Hardware Specifications

### Storage Configuration

| Mount | Type | Size | Filesystem | Purpose |
|-------|------|------|------------|---------|
| `/` | SSD | 100GB | ext4 | Root system |
| `/data` | NVMe RAID 0 | **1.7 TiB** | XFS | High-entropy operations |

### RAID 0 Configuration

```
┌─────────────────────────────────────────────────────┐
│                  /data (RAID 0)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   NVMe 0    │  │   NVMe 1    │  │   NVMe 2    │  │
│  │   ~567GB    │  │   ~567GB    │  │   ~567GB    │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│         │                │                │         │
│         └────────────────┼────────────────┘         │
│                          │                          │
│            Striped for Maximum Throughput           │
│              ~3-5 GB/s Sequential R/W               │
└─────────────────────────────────────────────────────┘
```

### Memory

| Metric | Value |
|--------|-------|
| **Total RAM** | 64 GB DDR5 |
| **Swap** | 8 GB (zram compressed) |

### CPU

| Metric | Value |
|--------|-------|
| **Model** | AMD EPYC / Intel Xeon (16 cores) |
| **Threads** | 32 |
| **Optimized for** | `make -j16` parallel builds |

---

## 2026 Toolchain Versions

### Compilers (January 2026)

| Tool | Version | Purpose |
|------|---------|---------|
| **Clang** | 19.x | UE 5.7.1 Primary Compiler |
| **GCC** | 15.x | Fallback / System Libs |
| **LLVM** | 19.x | Toolchain Infrastructure |
| **LLD** | 19.x | Fast Linker |

### Rust Toolchain

| Component | Version | Target |
|-----------|---------|--------|
| **rustc** | 1.84+ (2024 Edition) | Native + WASM |
| **cargo** | 1.84+ | Package Manager |
| **wasm32-unknown-unknown** | Target | Substrate Runtime |
| **rust-src** | Component | IDE Support |

### Build Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **CMake** | 3.30+ | UE5 Meta-build |
| **Ninja** | 1.12+ | Fast builds |
| **Make** | 4.4+ | Legacy support |
| **pkg-config** | Latest | Library detection |

### Node.js (for UE5 Web Tools)

| Component | Version |
|-----------|---------|
| **Node.js** | 22 LTS |
| **npm** | 10.x |

---

## Kernel Optimizations

### `/etc/sysctl.conf` Additions

```bash
# DEMIURGE-BLOCKCHAIN Kernel Tuning for UE5/Substrate Builds
# Applied to: Pleroma (Monad Server)

# Increase max file descriptors (UE5 opens thousands of files)
fs.file-max = 2097152

# Increase inotify watches for file monitoring
fs.inotify.max_user_watches = 524288
fs.inotify.max_user_instances = 1024

# Memory optimizations for large builds
vm.swappiness = 10
vm.dirty_ratio = 60
vm.dirty_background_ratio = 5
vm.vfs_cache_pressure = 50

# Network tuning for Substrate P2P
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216

# RAID 0 I/O Scheduler (none = passthrough for NVMe)
# Set via udev rules for /data devices
```

### Apply Command

```bash
sudo sysctl -p
```

### I/O Scheduler Verification

```bash
# Should return "none" for NVMe RAID 0
cat /sys/block/md0/queue/scheduler
# Or for individual NVMe
cat /sys/block/nvme0n1/queue/scheduler
```

---

## Pre-Flight Sanity Check

Execute these commands via SSH before any UE 5.7.1 build:

```bash
#!/bin/bash
# MONAD SANITY CHECK - Pre-Flight for UE 5.7.1
# Run from: ssh monad (or ssh ubuntu@127.0.0.1)

echo "═══════════════════════════════════════════════════════"
echo "  🎭 MONAD SANITY CHECK - Demiurge-Blockchain Genesis"
echo "═══════════════════════════════════════════════════════"

# 1. COMPILER ALIGNMENT
echo -e "\n📦 [1/6] Compiler Versions..."
clang-19 --version | head -1
gcc-15 --version | head -1
rustc --version
cargo --version

# 2. UE 5.7.1 SCRIPT INTEGRITY
echo -e "\n📜 [2/6] UE 5.7.1 Shell Script Permissions..."
cd /data/Demiurge-Blockchain/ue5-source
chmod +x Setup.sh GenerateProjectFiles.sh
ls -la Setup.sh GenerateProjectFiles.sh
ls -la Engine/Build/BatchFiles/Linux/ | head -10

# 3. STORAGE STRESS CHECK
echo -e "\n💾 [3/6] RAID 0 Mount Verification..."
findmnt /data
df -Th /data
echo "XFS Health:"
xfs_info /data 2>/dev/null || echo "XFS info requires root"

# 4. MEMORY STATUS
echo -e "\n🧠 [4/6] Memory Status..."
free -h
echo "Swap Configuration:"
swapon --show

# 5. CPU READINESS
echo -e "\n⚡ [5/6] CPU Configuration..."
nproc
lscpu | grep -E "Model name|CPU\(s\)|Thread|Core"

# 6. DRY RUN PROJECT GENERATION
echo -e "\n🔧 [6/6] UE 5.7.1 Dry Run (Project Files Generation)..."
cd /data/Demiurge-Blockchain/ue5-source
./GenerateProjectFiles.sh -help 2>&1 | head -20
# Full dry run (uncomment when ready):
# ./GenerateProjectFiles.sh

echo -e "\n═══════════════════════════════════════════════════════"
echo "  ✅ SANITY CHECK COMPLETE - Ready for Genesis Build"
echo "═══════════════════════════════════════════════════════"
```

### Save as Script

```bash
# On Monad:
cat > /data/Demiurge-Blockchain/scripts/monad-sanity-check.sh << 'EOF'
# (paste script above)
EOF
chmod +x /data/Demiurge-Blockchain/scripts/monad-sanity-check.sh
```

---

## UE 5.7.1 Build Commands

### Full Build Sequence

```bash
# Connect to Monad
ssh monad

# Navigate to UE5 source
cd /data/Demiurge-Blockchain/ue5-source

# Step 1: Run Setup (Downloads dependencies ~20-50GB)
./Setup.sh

# Step 2: Generate Project Files
./GenerateProjectFiles.sh

# Step 3: Build with 16 cores (Background with logging)
nohup make -j16 > /data/Demiurge-Blockchain/logs/ue5-build-$(date +%Y%m%d-%H%M%S).log 2>&1 &

# Monitor build progress
tail -f /data/Demiurge-Blockchain/logs/ue5-build-*.log

# Or use tmux for persistent session
tmux new -s ue5-build
make -j16
# Ctrl+B, D to detach
```

### Build Verification

```bash
# Check for successful binaries
ls -la Engine/Binaries/Linux/UnrealEditor
ls -la Engine/Binaries/Linux/ShaderCompileWorker

# Verify executable
file Engine/Binaries/Linux/UnrealEditor
```

### Build Flags Reference

| Flag | Purpose |
|------|---------|
| `-j16` | 16 parallel jobs (match CPU cores) |
| `ARGS="-clean"` | Clean before build |
| `ShaderCompileWorker` | Build shader compiler only |
| `UnrealEditor` | Build editor only |

---

## Directory Symlinks

Ensure heavy artifacts are on RAID 0:

```bash
# Rust build artifacts
ln -sfn /data/Demiurge-Blockchain/build ~/Demiurge-Blockchain/target

# Node modules (if any)
ln -sfn /data/Demiurge-Blockchain/node_modules ~/Demiurge-Blockchain/node_modules

# UE5 Intermediate files
# (Already on /data by virtue of source location)
```

---

## Quick Reference

```bash
# SSH to Monad
ssh monad

# Run sanity check
/data/Demiurge-Blockchain/scripts/monad-sanity-check.sh

# Start UE5 build
cd /data/Demiurge-Blockchain/ue5-source && make -j16

# Monitor logs
journalctl -f  # System logs
tail -f /data/Demiurge-Blockchain/logs/*.log  # Build logs
```

---

*Last Updated: January 12, 2026*  
*Document Version: 1.0*  
*Maintainer: Alaustrup*
