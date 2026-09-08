# Cursor Stability Guide

**Preventing Cursor crashes and improving stability**

> *"The code serves the will, and stability serves the code."*

---

## 🛡️ Common Causes of Cursor Crashes

1. **Large Files** - Files over 10MB can cause parsing issues
2. **Too Many Open Files** - Having 20+ files open simultaneously
3. **File Watchers** - Too many files being watched for changes
4. **Memory Issues** - Insufficient RAM for large codebases
5. **Syntax Errors** - Malformed files causing parser crashes
6. **Git Operations** - Large git operations blocking the UI

---

## ✅ Immediate Fixes

### 1. Close Unnecessary Files
- Close files you're not actively editing
- Use file search instead of opening many files
- Limit open tabs to < 10 files

### 2. Exclude Large Directories
Add to `.cursorignore` or `.gitignore`:
```
# Large build artifacts
target/
node_modules/
.next/
dist/
build/
*.log
*.cache
```

### 3. Restart Cursor Regularly
- Close and reopen Cursor every few hours
- This clears memory leaks and resets file watchers

### 4. Disable Unnecessary Extensions
- Disable extensions you don't use
- Some extensions can cause stability issues

---

## 🔧 Script Fixes Applied

The deployment script has been fixed:
- ✅ Removed emoji characters (encoding issues)
- ✅ Fixed PowerShell `&&` operators (replaced with `;`)
- ✅ Fixed quote escaping issues
- ✅ Verified syntax is valid

---

## 📝 Best Practices

1. **Commit Frequently** - Don't leave many uncommitted changes
2. **Use Git Sparingly** - Avoid large git operations in Cursor
3. **Close Large Files** - Don't keep large log files open
4. **Monitor Memory** - Check Task Manager if crashes persist
5. **Update Cursor** - Keep Cursor updated to latest version

---

## 🚨 If Cursor Keeps Crashing

1. **Clear Cursor Cache**
   ```powershell
   Remove-Item -Recurse -Force "$env:APPDATA\Cursor\Cache"
   Remove-Item -Recurse -Force "$env:APPDATA\Cursor\CachedData"
   ```

2. **Disable File Watchers**
   - Settings → Search "files.watcherExclude"
   - Add: `**/target/**, **/node_modules/**, **/.next/**`

3. **Reduce Workspace Size**
   - Close unnecessary folders
   - Use workspace files to limit scope

4. **Check System Resources**
   - Ensure 8GB+ RAM available
   - Close other memory-intensive applications

---

**The flame burns eternal. The code serves the will.**
