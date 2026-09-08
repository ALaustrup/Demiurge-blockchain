# OVH Firewall Configuration for SSH Access

## Current Issue
SSH port 22 is timing out, which means either:
1. OVH Firewall is blocking port 22
2. SSH service isn't running on the server
3. Server needs initial configuration

## Solution: Configure OVH Firewall

### Step 1: Access OVH Manager

1. Log in to **OVH Manager**: https://www.ovh.com/manager/
2. Go to **Bare Metal Cloud** → **Dedicated Servers**
3. Click on server **Monad** (1301538)

### Step 2: Configure Firewall

1. In the server details page, look for **"Firewall"** or **"Network"** section
2. Click on **"Firewall"** or **"Network Security"**

3. **Enable Firewall** (if disabled):
   - Click **"Enable Firewall"**
   - Choose **"Custom rules"** or **"Allow all"** for now

4. **Add SSH Rule**:
   - Click **"Add a rule"** or **"New rule"**
   - **Protocol:** TCP
   - **Port:** 22
   - **Source:** 0.0.0.0/0 (or your IP for security)
   - **Action:** Accept
   - **Description:** SSH Access
   - Click **"Add"** or **"Save"**

5. **Apply Firewall Rules**:
   - Click **"Apply"** or **"Save configuration"**
   - Rules should apply immediately (no reboot needed)

### Step 3: Verify SSH Service

If firewall is configured but SSH still doesn't work, check if SSH service is running:

**Option A: Use IPMI/KVM Console (Recommended)**

1. In OVH Manager → Server → **IPMI** section
2. Click **"Launch IPMI KVM"** or **"KVM over IP"**
3. Log in to the server console
4. Check SSH service:
   ```bash
   sudo systemctl status ssh
   # or
   sudo systemctl status sshd
   ```

5. If SSH is not running, start it:
   ```bash
   sudo systemctl start ssh
   sudo systemctl enable ssh
   ```

**Option B: Use OVH Rescue Mode**

If you can't access via IPMI:

1. In OVH Manager → Server → **Boot** section
2. Select **"Rescue mode"**
3. Boot into rescue mode
4. Mount your disk and check SSH configuration

### Step 4: Alternative - Use Different SSH Port

If port 22 is blocked by your ISP or network:

1. **Change SSH port on server** (via IPMI console):
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Change: Port 22 to Port 2222 (or another port)
   sudo systemctl restart ssh
   ```

2. **Update firewall** to allow the new port

3. **Update SSH config**:
   ```
   Host pleroma
       HostName 127.0.0.1
       User ubuntu
       Port 2222
       IdentityFile ~/.ssh/id_ed25519_pleroma
   ```

## Quick Checklist

- [ ] OVH Firewall enabled and configured
- [ ] Port 22 (SSH) rule added to firewall
- [ ] Firewall rules applied
- [ ] SSH service running on server (check via IPMI)
- [ ] SSH key added to server (via OVH Manager or manually)
- [ ] Test connection: `ssh pleroma`

## After SSH Works

Once SSH connection is successful:

1. **Install Docker:**
   ```powershell
   .\scripts\install-docker-monad.ps1
   ```

2. **Verify server setup:**
   ```bash
   ssh pleroma
   uname -a
   cat /etc/os-release
   ```

3. **Deploy services:**
   ```bash
   cd /data/Demiurge-Blockchain/docker
   docker compose -f docker-compose.production.yml up -d
   ```

## OVH Support

If you continue having issues:
- **OVH Support:** https://www.ovh.com/support/
- **Documentation:** https://docs.ovh.com/
- **Community:** https://community.ovh.com/

---

**Note:** OVH servers sometimes have firewall enabled by default. Make sure to configure it properly before attempting SSH access.
