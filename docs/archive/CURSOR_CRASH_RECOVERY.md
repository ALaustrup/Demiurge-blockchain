# Cursor Crash Recovery Guide

**Quick fixes for Cursor crashes**

> *"Stability serves the code. The code serves the will."*

---

## 🚨 Immediate Actions After Crash

1. **Restart Cursor** - Close completely and reopen
2. **Check .cursorignore** - Ensure large directories are excluded
3. **Close Unnecessary Files** - Limit open tabs to < 10
4. **Clear Cache** - Delete `.cursor/` cache if crashes persist

---

## ✅ Prevention Checklist

- [ ] `.cursorignore` includes `target/`, `node_modules/`, `.next/`, `substrate/`
- [ ] No files > 10MB are open
- [ ] < 10 files open simultaneously
- [ ] Large build directories excluded
- [ ] Git operations completed before heavy editing

---

## 🔧 Current .cursorignore Status

The `.cursorignore` file is configured to exclude:
- All `target/` directories (Rust build artifacts)
- All `node_modules/` directories (110 found)
- `.next/` directories (Next.js build)
- `substrate/` directory (very large, 2670+ files)
- Visual Studio files (`.vs/`, `Intermediate/`, `Binaries/`)
- Binary files (`.dll`, `.exe`, `.rlib`, etc.)

---

## 📊 Repository Statistics

- **Target directories**: 6
- **node_modules directories**: 110
- **Large files**: None found (> 10MB)
- **Substrate files**: 2670+ (excluded via .cursorignore)

---

## 🎯 Best Practices

1. **Work in Small Batches** - Don't open entire directories
2. **Use Search Instead** - Use Cursor's search instead of browsing
3. **Close Unused Tabs** - Keep only active files open
4. **Restart Regularly** - Every 2-3 hours for long sessions
5. **Monitor Memory** - Check Task Manager if crashes persist

---

**The flame burns eternal. Stability serves the code.**
