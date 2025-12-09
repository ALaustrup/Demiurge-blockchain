# Add SSH Key via Remote KVM

Instructions for adding your Node0 SSH key to the server using the Remote KVM console feature.

## Step 1: Get Your Public Key (On Your Local Machine)

**Windows PowerShell:**
```powershell
Get-Content "$env:USERPROFILE\.ssh\Node0.pub"
```

**Copy the entire output** - it should look like:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... Node0@YourComputerName
```

## Step 2: Access Server via Remote KVM

1. Log into your hosting provider's control panel
2. Navigate to your server (51.210.209.112)
3. Open the **Remote KVM** or **Console** feature
4. You should see the server's terminal/console

## Step 3: Login to Server

If you see a login prompt:
- **Username**: `ubuntu`
- **Password**: (enter your server password)

## Step 4: Add SSH Key (On Server Console)

Once logged in, run these commands **one by one**:

```bash
# 1. Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh

# 2. Set correct permissions on .ssh directory
chmod 700 ~/.ssh

# 3. Add your public key to authorized_keys
# Replace PASTE_YOUR_PUBLIC_KEY_HERE with the key you copied in Step 1
echo "PASTE_YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys

# 4. Set correct permissions on authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 5. Verify the key was added
cat ~/.ssh/authorized_keys

# 6. Verify permissions are correct
ls -la ~/.ssh/
```

## Step 5: Verify Setup

The `ls -la ~/.ssh/` command should show:
```
drwx------ 2 ubuntu ubuntu 4096 ... .ssh
-rw------- 1 ubuntu ubuntu  XXX ... authorized_keys
```

- `.ssh` directory: `drwx------` (700) ✅
- `authorized_keys` file: `-rw-------` (600) ✅

## Step 6: Test Connection (From Your Local Machine)

**Windows PowerShell:**
```powershell
ssh -i "$env:USERPROFILE\.ssh\Node0" ubuntu@51.210.209.112
```

You should now be able to connect **without entering a password**!

## Troubleshooting

### Key Not Working

1. **Verify key format** - Make sure you copied the ENTIRE key (one line)
2. **Check permissions** - Run `chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`
3. **Verify key is in file** - Run `cat ~/.ssh/authorized_keys` and confirm your key is there

### Permission Denied Still

```bash
# On server, check SSH service
sudo systemctl status sshd

# Check SSH config allows key authentication
sudo grep -E "PubkeyAuthentication|PasswordAuthentication" /etc/ssh/sshd_config

# Should show:
# PubkeyAuthentication yes
# PasswordAuthentication yes (or no)
```

### Key Format Issues

Make sure when you paste the key:
- It's all on **one line**
- No line breaks in the middle
- Starts with `ssh-ed25519` and ends with your comment (Node0@...)

## Example: Complete Key Addition

Here's what the complete process looks like:

**On your local machine:**
```powershell
# Get your public key
Get-Content "$env:USERPROFILE\.ssh\Node0.pub"
# Output: ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... Node0@YourPC
```

**On server via KVM:**
```bash
ubuntu@server:~$ mkdir -p ~/.ssh
ubuntu@server:~$ chmod 700 ~/.ssh
ubuntu@server:~$ echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... Node0@YourPC" >> ~/.ssh/authorized_keys
ubuntu@server:~$ chmod 600 ~/.ssh/authorized_keys
ubuntu@server:~$ cat ~/.ssh/authorized_keys
# Should show your key
ubuntu@server:~$ ls -la ~/.ssh/
# Should show correct permissions
```

**Back on your local machine:**
```powershell
ssh -i "$env:USERPROFILE\.ssh\Node0" ubuntu@51.210.209.112
# Should connect without password!
```

## Security Note

After confirming SSH key authentication works, you can optionally:
- Disable password authentication (more secure)
- But wait until you're 100% sure the key works!
