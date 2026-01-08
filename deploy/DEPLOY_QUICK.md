# 🚀 Quick Deployment Guide

**One-command deployment from Windows PowerShell**

---

## ✅ Prerequisites

1. SSH access to server: `ubuntu@51.210.209.112`
2. Git checked out to `D5-rebrand-qor` branch on server
3. PowerShell on your Windows machine

---

## 🎯 Deploy Everything (Recommended)

```powershell
cd C:\Repos\DEMIURGE
.\deploy\deploy-rebrand.ps1
```

**This will:**
- ✅ Create backup
- ✅ Rebuild blockchain
- ✅ Install QOR ID Service
- ✅ Install QOR Gateway  
- ✅ Build QLOUD OS
- ✅ Fix permissions
- ✅ Reload Nginx

**Time:** ~10-15 minutes

---

## ⚡ Frontend Only (Faster)

If you only changed frontend code:

```powershell
.\deploy\deploy-rebrand.ps1 -FrontendOnly
```

**Skips:** Chain rebuild  
**Time:** ~5 minutes

---

## 🔧 Chain Only

If you only changed Rust code:

```powershell
.\deploy\deploy-rebrand.ps1 -ChainOnly
```

**Skips:** Frontend builds  
**Time:** ~10 minutes

---

## 🚫 Skip Backup

To deploy without creating a backup:

```powershell
.\deploy\deploy-rebrand.ps1 -SkipBackup
```

---

## 📊 Verify Deployment

After deployment completes, test these URLs:

| Service | URL | Expected |
|---------|-----|----------|
| **QLOUD OS** | https://demiurge.cloud | "Sign in with your QOR ID" |
| **GraphQL** | https://api.demiurge.cloud/graphql | GraphQL Playground |
| **RPC** | https://rpc.demiurge.cloud/rpc | JSON-RPC endpoint |

---

## 🔍 Monitor Logs

```powershell
# Watch all services
ssh ubuntu@51.210.209.112 "sudo journalctl -f -u demiurge -u qorid -u qor-gateway"

# Check specific service
ssh ubuntu@51.210.209.112 "sudo systemctl status qorid"
ssh ubuntu@51.210.209.112 "sudo systemctl status qor-gateway"
```

---

## ❌ Troubleshooting

### "Command failed with exit code 1"

**Likely cause:** Missing dependencies or build error

**Fix:**
```powershell
# Check what failed
ssh ubuntu@51.210.209.112 "cd /home/ubuntu/DEMIURGE && git status"

# Check node/pnpm versions
ssh ubuntu@51.210.209.112 "node --version && pnpm --version"

# Check cargo
ssh ubuntu@51.210.209.112 "bash -l -c 'cargo --version'"
```

### "Connection refused"

**Likely cause:** SSH key issues

**Fix:**
```powershell
# Test connection
ssh ubuntu@51.210.209.112 "echo 'Connection OK'"

# If fails, check SSH config
cat ~/.ssh/config
```

### "Permission denied"

**Likely cause:** Wrong user or missing sudo

**Fix:**
```powershell
# Verify user
ssh ubuntu@51.210.209.112 "whoami"

# Should output: ubuntu
```

---

## 🔄 Rollback

If deployment fails and you need to rollback:

```powershell
ssh ubuntu@51.210.209.112 @"
cd /home/ubuntu/DEMIURGE
git checkout D4
git pull origin D4
# Then rebuild everything
"@
```

---

## 📞 Support

If you encounter issues:

1. Check the full deployment log in `deploy/REBRAND_DEPLOYMENT.md`
2. Review error messages carefully
3. Check service logs on the server
4. Verify all prerequisites are met

---

**Ready to deploy?**

```powershell
cd C:\Repos\DEMIURGE
.\deploy\deploy-rebrand.ps1
```

🔥 **Let's go!**
