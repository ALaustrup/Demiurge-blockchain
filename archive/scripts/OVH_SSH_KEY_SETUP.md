# OVH Server SSH Key Setup Guide

## Server Information

- **Server Name:** Monad
- **Commercial Name:** RISE-LE-2
- **IP Address:** 127.0.0.1
- **OS:** Ubuntu Server 25.10 "Questing Quokka"
- **Provider:** OVH
- **Region:** Europe (France – Roubaix)

## Adding SSH Key via OVH Manager

### Method 1: OVH Manager Web Interface (Recommended)

1. **Log in to OVH Manager:**
   - Go to https://www.ovh.com/manager/
   - Log in with your OVH account

2. **Navigate to your server:**
   - Go to **Bare Metal Cloud** → **Dedicated Servers**
   - Find server **Monad** (or search by IP: 127.0.0.1)
   - Click on the server name

3. **Add SSH Key:**
   - In the server details, look for **"SSH Keys"** or **"Security"** section
   - Click **"Add an SSH key"** or **"Import an SSH key"**
   - Paste your public key (from `show-ssh-public-key.ps1`)
   - Give it a name (e.g., "Pleroma Key")
   - Click **"Add"** or **"Save"**

4. **Apply to Server:**
   - The key should be automatically added to `~/.ssh/authorized_keys` on the server
   - If not, you may need to reboot or wait a few minutes

### Method 2: OVH API (Advanced)

If you prefer using the API:

```bash
# Get your public key
cat ~/.ssh/id_ed25519_pleroma.pub

# Use OVH API to add the key
# (Requires OVH API credentials)
```

### Method 3: Direct Server Access (IPMI/KVM)

If you have IPMI/KVM access:

1. **Access IPMI Console:**
   - In OVH Manager → Server → **IPMI** section
   - Click **"Launch IPMI KVM"** or use IPMI credentials

2. **Log in to server:**
   ```bash
   # Default OVH user might be 'ubuntu' or 'root'
   # Check OVH documentation for default credentials
   ```

3. **Add SSH key:**
   ```bash
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

## Get Your Public Key

Run this script to display and copy your public key:

```powershell
.\scripts\show-ssh-public-key.ps1
```

Your public key:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIE8wXsLPN517JTu4txnUQi1ecmBH6aCCkCqYs+54CsHR admin@pleroma
```

## Verify SSH Access

After adding the key via OVH Manager:

```powershell
# Test connection (will timeout after 10 seconds if it fails)
ssh pleroma

# Or with verbose output
ssh -v pleroma
```

## OVH-Specific Notes

1. **Default User:** OVH servers may use `ubuntu` or `root` as default user
   - Check your SSH config: `cat C:\Users\Gnosis\.ssh\config`
   - Update if needed: `User ubuntu` (default for OVH Ubuntu installations)

2. **Firewall:** OVH may have a firewall enabled
   - Check in OVH Manager → Server → **Firewall** section
   - Ensure port 22 (SSH) is allowed

3. **SSH Service:** Should be running by default, but verify:
   ```bash
   sudo systemctl status ssh
   ```

4. **Key Propagation:** After adding via OVH Manager, keys are usually applied within 1-2 minutes

## Troubleshooting

### SSH Still Not Working?

1. **Check user in SSH config:**
   ```powershell
   cat C:\Users\Gnosis\.ssh\config
   ```
   - If server uses `ubuntu`, update config:
     ```
     Host pleroma
         User ubuntu
     ```

2. **Test with explicit user:**
   ```powershell
   ssh ubuntu@127.0.0.1
   # or
   ssh root@127.0.0.1
   ```

3. **Check OVH Firewall:**
   - OVH Manager → Server → **Firewall**
   - Ensure SSH (port 22) is allowed

4. **Verify key was added:**
   - Use IPMI/KVM to access server console
   - Check: `cat ~/.ssh/authorized_keys`

## Next Steps

Once SSH is working:

1. **Install Docker:**
   ```powershell
   .\scripts\install-docker-monad.ps1
   ```

2. **Deploy Services:**
   ```bash
   ssh pleroma
   cd /data/Demiurge-Blockchain/docker
   docker compose -f docker-compose.production.yml up -d
   ```

---

**OVH Support:** If issues persist, contact OVH support or check their documentation:
- https://docs.ovh.com/
