# OVH Server Partitioning Guide

## Your Hardware
- **2×960 GB SSD NVMe** (Soft RAID available)
- **Expected Setup:** `/` (root) + `/data` (RAID 0 for high-performance)

## Recommended Partitioning Scheme

### Option 1: Simple Setup (Recommended for Start)

**Let OVH handle partitioning automatically:**
- Use **"Use the entire disk"** or **"Guided - use entire disk"**
- OVH will create a standard partition layout
- You can set up `/data` RAID 0 manually after installation

**Pros:**
- ✅ Fastest setup
- ✅ No manual configuration needed
- ✅ Can add `/data` RAID 0 later

**Cons:**
- ⚠️ Won't match documented setup initially
- ⚠️ Need to configure RAID 0 post-install

### Option 2: Custom Partitioning (Matches Documentation)

**Manual partitioning to match expected setup:**

#### Partition Layout:

```
Disk 1 (nvme0n1 - 960GB):
├── /boot/efi     - 512MB  (EFI boot)
├── /             - 100GB  (ext4) - Root filesystem
└── (unused)      - ~859GB - For RAID 0

Disk 2 (nvme1n1 - 960GB):
├── (unused)      - ~100GB - Reserved for RAID 0 alignment
└── (unused)      - ~860GB - For RAID 0

RAID 0 (md0):
└── /data         - ~1.7TB (XFS) - High-entropy operations
```

#### Steps in OVH Installer:

1. **Select "Manual" partitioning**
2. **Disk 1 (nvme0n1):**
   - Create EFI partition: 512MB, EFI System Partition
   - Create root partition: 100GB, ext4, mount point: `/`
   - Leave rest unallocated

3. **Disk 2 (nvme1n1):**
   - Leave entire disk unallocated (for RAID 0)

4. **After installation, create RAID 0:**
   ```bash
   # Create RAID 0 array
   sudo mdadm --create /dev/md0 --level=0 --raid-devices=2 \
     /dev/nvme0n1p3 /dev/nvme1n1p1
   
   # Format as XFS
   sudo mkfs.xfs /dev/md0
   
   # Mount
   sudo mkdir -p /data
   sudo mount /dev/md0 /data
   
   # Add to fstab
   echo '/dev/md0 /data xfs defaults 0 2' | sudo tee -a /etc/fstab
   ```

**Pros:**
- ✅ Matches documented configuration
- ✅ Optimal performance for `/data`
- ✅ Separates OS from data

**Cons:**
- ⚠️ More complex setup
- ⚠️ Requires post-install RAID configuration

### Option 3: Hybrid (Easiest Custom Setup)

**Use one disk for root, RAID 0 both for /data:**

```
Disk 1 (nvme0n1):
├── /boot/efi - 512MB
└── /         - 100GB ext4 (rest unused for now)

Disk 2 (nvme1n1):
└── (entire disk unused - for RAID 0)

After install, create RAID 0 from:
- nvme0n1p2 (remaining space ~859GB)
- nvme1n1 (entire disk ~960GB)
- Total: ~1.8TB RAID 0
```

## My Recommendation: **Option 1 (Simple)**

**Why:**
1. **Get SSH working first** - Priority is getting the server accessible
2. **RAID 0 can be added later** - Not critical for initial Docker setup
3. **OVH installer is reliable** - Less chance of installation issues
4. **Can migrate data** - Easy to set up RAID 0 later without data loss

**Post-Install RAID 0 Setup:**

After OS is installed and SSH works:

```bash
# 1. Install mdadm
sudo apt update
sudo apt install -y mdadm

# 2. Create RAID 0 (use remaining space on both disks)
# Check available space first
lsblk

# 3. Create partitions for RAID 0
sudo parted /dev/nvme0n1
  (parted) print
  (parted) mkpart primary 100GB 100%
  (parted) set 2 raid on
  (parted) quit

sudo parted /dev/nvme1n1
  (parted) mkpart primary 0% 100%
  (parted) set 1 raid on
  (parted) quit

# 4. Create RAID 0 array
sudo mdadm --create /dev/md0 --level=0 --raid-devices=2 \
  /dev/nvme0n1p2 /dev/nvme1n1p1

# 5. Format as XFS
sudo mkfs.xfs /dev/md0

# 6. Mount
sudo mkdir -p /data
sudo mount /dev/md0 /data

# 7. Add to fstab
echo '/dev/md0 /data xfs defaults 0 2' | sudo tee -a /etc/fstab

# 8. Save RAID configuration
sudo mdadm --detail --scan | sudo tee -a /etc/mdadm/mdadm.conf
sudo update-initramfs -u
```

## Partitioning Settings Summary

### For OVH Installer:

**Recommended:** Use **"Guided - use entire disk"** or **"Use the entire disk"**

**If Custom:**
- **Root (`/`):** 100GB, ext4
- **Boot:** 512MB, EFI (if UEFI)
- **Swap:** 8-16GB (optional, can use zram later)
- **Rest:** Leave unallocated for `/data` RAID 0 setup

## Filesystem Choices

- **Root (`/`):** `ext4` - Standard, reliable
- **Data (`/data`):** `XFS` - Better for large files, high I/O (Rust builds, Docker volumes)

## Important Notes

1. **RAID 0 = No Redundancy** - If one disk fails, all data is lost
   - Acceptable for `/data` (can rebuild from git)
   - Root should be on single disk or RAID 1

2. **Backup Strategy** - Since RAID 0 has no redundancy:
   - Keep code in git (already done)
   - Backup Docker volumes regularly
   - Backup database dumps

3. **Performance** - RAID 0 gives ~2x read/write speed:
   - Perfect for Rust/Substrate builds
   - Great for Docker image layers
   - Ideal for blockchain node data

4. **OVH Soft RAID** - OVH's "Soft RAID" means software RAID (mdadm)
   - Works perfectly fine
   - No hardware RAID controller needed

## Quick Decision Matrix

| Scenario | Recommendation |
|----------|---------------|
| **Want to get started fast** | Option 1 (Simple) |
| **Want exact documented setup** | Option 2 (Custom) |
| **Want balance** | Option 3 (Hybrid) |
| **Uncertain** | **Option 1** - Can always add RAID 0 later |

---

**My Final Recommendation:** Use **Option 1 (Simple)** - let OVH handle partitioning, get SSH working, then set up RAID 0 for `/data` after installation. This gets you up and running fastest while still achieving the optimal setup.
