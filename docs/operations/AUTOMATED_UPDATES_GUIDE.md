# Automated Updates Guide - Demiurge Server

This guide explains how to set up and manage automated system updates on your Demiurge OVHcloud server.

---

## 🚀 Quick Setup

### **One-Command Setup**

```bash
cd /opt/demiurge/repo
chmod +x scripts/setup-automated-updates.sh
sudo ./scripts/setup-automated-updates.sh
```

This will:
- ✅ Install `unattended-upgrades` if not already installed
- ✅ Configure automatic security updates
- ✅ Configure automatic regular updates
- ✅ Enable automatic cleanup of unused packages
- ✅ Set up logging to syslog
- ❌ **Disable** automatic reboots (manual reboot required)

---

## 📋 What Gets Updated Automatically?

### **Security Updates** ✅
- Critical security patches
- Vulnerability fixes
- Security-related package updates

### **Regular Updates** ✅
- Bug fixes
- Feature updates
- Package improvements

### **What's NOT Updated**
- Kernel updates (may require manual reboot)
- Major version upgrades (e.g., Ubuntu 22.04 → 24.04)
- Packages in blacklist (configurable)

---

## ⚙️ Configuration

### **Main Configuration File**

```bash
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

**Key Settings:**

| Setting | Default | Description |
|---------|---------|-------------|
| `Allowed-Origins` | `security`, `updates` | Which repositories to auto-update |
| `Automatic-Reboot` | `false` | Auto-reboot after updates |
| `Automatic-Reboot-Time` | `02:00` | Time to reboot (if enabled) |
| `Mail` | (empty) | Email for notifications |
| `Remove-Unused-Dependencies` | `true` | Auto-remove unused packages |
| `Remove-Unused-Kernel-Packages` | `true` | Auto-remove old kernels |

### **Update Frequency**

```bash
sudo nano /etc/apt/apt.conf.d/20auto-upgrades
```

**Settings:**
- `Update-Package-Lists`: `"1"` = Daily
- `Unattended-Upgrade`: `"1"` = Daily
- `Download-Upgradeable-Packages`: `"1"` = Daily
- `AutocleanInterval`: `"7"` = Weekly

---

## 🔍 Monitoring & Status

### **Check Update Status**

```bash
# Dry run (test what would be updated)
sudo unattended-upgrade --dry-run

# Check what updates are available
sudo apt list --upgradable

# View update history
sudo cat /var/log/unattended-upgrades/unattended-upgrades.log | tail -50
```

### **View Recent Updates**

```bash
# View last 50 lines of update log
sudo tail -50 /var/log/unattended-upgrades/unattended-upgrades.log

# View all update logs
sudo ls -lh /var/log/unattended-upgrades/

# Check if reboot is required
cat /var/run/reboot-required 2>/dev/null && echo "Reboot required!" || echo "No reboot needed"
```

### **Check Service Status**

```bash
# Check if service is running
sudo systemctl status unattended-upgrades

# View service logs
sudo journalctl -u unattended-upgrades -f
```

---

## 🛠️ Manual Updates

### **Quick Manual Update**

```bash
cd /opt/demiurge/repo
chmod +x scripts/update-system.sh
sudo ./scripts/update-system.sh
```

### **Manual Commands**

```bash
# Update package lists
sudo apt update

# See what's available
sudo apt list --upgradable

# Install all updates
sudo apt upgrade -y

# Clean up
sudo apt autoremove -y
sudo apt autoclean
```

---

## 🔔 Email Notifications (Optional)

To receive email notifications about updates:

1. **Install mail server:**
   ```bash
   sudo apt install -y mailutils
   ```

2. **Configure email in unattended-upgrades:**
   ```bash
   sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
   ```
   
   Uncomment and set:
   ```conf
   Unattended-Upgrade::Mail "your-email@example.com";
   Unattended-Upgrade::MailOnlyOnError "true";  // Only email on errors
   ```

3. **Test email:**
   ```bash
   echo "Test email" | mail -s "Test" your-email@example.com
   ```

---

## 🔄 Automatic Reboots (Optional)

**⚠️ Warning:** Enabling automatic reboots will restart your server without confirmation!

To enable:

```bash
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

Uncomment and set:
```conf
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "02:00";  // Reboot at 2 AM
```

**Recommended:** Keep this disabled and manually reboot when needed.

---

## 🚫 Package Blacklist

To prevent specific packages from auto-updating:

```bash
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

Add to `Package-Blacklist`:
```conf
Unattended-Upgrade::Package-Blacklist {
    "package-name";
    "another-package";
};
```

**Example:** Prevent kernel updates
```conf
Unattended-Upgrade::Package-Blacklist {
    "linux-image-.*";
    "linux-headers-.*";
};
```

---

## 🐛 Troubleshooting

### **Updates Not Running**

1. **Check service status:**
   ```bash
   sudo systemctl status unattended-upgrades
   ```

2. **Check logs:**
   ```bash
   sudo tail -f /var/log/unattended-upgrades/unattended-upgrades.log
   ```

3. **Test manually:**
   ```bash
   sudo unattended-upgrade --dry-run --debug
   ```

### **Too Many Updates**

If you want to reduce update frequency, edit:
```bash
sudo nano /etc/apt/apt.conf.d/20auto-upgrades
```

Change `"1"` to `"0"` for any setting to disable it.

### **Disable Automated Updates**

```bash
# Stop service
sudo systemctl stop unattended-upgrades
sudo systemctl disable unattended-upgrades

# Remove configuration
sudo rm /etc/apt/apt.conf.d/20auto-upgrades
```

---

## 📊 Best Practices

1. **Monitor Logs Regularly**
   - Check `/var/log/unattended-upgrades/` weekly
   - Review what was updated

2. **Test Before Production**
   - Run `--dry-run` before enabling on production
   - Test on staging server first

3. **Keep Reboots Manual**
   - Don't enable auto-reboot on production
   - Schedule maintenance windows for reboots

4. **Backup Before Updates**
   - Ensure backups are configured
   - Test restore procedures

5. **Monitor System After Updates**
   - Check services: `pm2 status`
   - Check logs: `pm2 logs`
   - Test endpoints: `curl http://localhost:3000`

---

## 📝 Summary

**Setup:**
```bash
sudo ./scripts/setup-automated-updates.sh
```

**Check Status:**
```bash
sudo unattended-upgrade --dry-run
sudo tail -f /var/log/unattended-upgrades/unattended-upgrades.log
```

**Manual Update:**
```bash
sudo ./scripts/update-system.sh
```

**Configuration:**
- Main config: `/etc/apt/apt.conf.d/50unattended-upgrades`
- Frequency: `/etc/apt/apt.conf.d/20auto-upgrades`
- Logs: `/var/log/unattended-upgrades/`

---

**✅ Your server will now automatically stay up-to-date with security patches and updates!**

