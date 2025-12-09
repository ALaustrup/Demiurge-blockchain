# Fix SSH Host Key Warning

When you see "REMOTE HOST IDENTIFICATION HAS CHANGED", it means the server's host key has changed (common after a fresh OS install).

## Quick Fix

### Windows PowerShell

```powershell
# Remove the old host key entry for the server
ssh-keygen -R 51.210.209.112

# Or manually edit the file
notepad "$env:USERPROFILE\.ssh\known_hosts"
# Delete line 6 (or the line containing 51.210.209.112)
```

### Linux/Ubuntu

```bash
# Remove the old host key entry
ssh-keygen -R 51.210.209.112

# Or manually edit
nano ~/.ssh/known_hosts
# Delete the line containing 51.210.209.112
```

## Verify and Accept New Key

After removing the old entry, connect again and accept the new key:

```powershell
# Windows PowerShell
ssh -i "$env:USERPROFILE\.ssh\Node0" ubuntu@51.210.209.112
```

When prompted:
```
The authenticity of host '51.210.209.112 (51.210.209.112)' can't be established.
ED25519 key fingerprint is SHA256:s3Gxt96UWtP29TGWc5saRM/Q0Ec1L0nfQl4LP9cr3vk.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
```

Type `yes` to accept the new key.

## One-Line Fix (Windows PowerShell)

```powershell
ssh-keygen -R 51.210.209.112; ssh -i "$env:USERPROFILE\.ssh\Node0" -o StrictHostKeyChecking=accept-new ubuntu@51.210.209.112 "echo 'Connection successful'"
```

## Verify New Key is Added

```powershell
# Check known_hosts for the server
Select-String -Path "$env:USERPROFILE\.ssh\known_hosts" -Pattern "51.210.209.112"
```

You should see the new ED25519 key entry.

## Security Note

This warning appears because:
- ✅ **Legitimate**: Server was reinstalled with fresh Ubuntu 24.04 LTS (new host key)
- ⚠️ **Possible**: Man-in-the-middle attack (unlikely if you control the server)

Since you're setting up a fresh server, this is expected and safe to accept.
