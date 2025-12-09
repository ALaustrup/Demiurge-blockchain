# Security Fix Instructions - DNS Package Removal

## Issue

After removing the `dns` npm package from `apps/dns-service/package.json`, vulnerabilities are still showing because the lockfile (`pnpm-lock.yaml`) still contains references to the old package and its dependency tree.

## Solution

The lockfile needs to be regenerated to remove all references to the `dns@0.2.2` package and its vulnerable dependencies.

### Step 1: Clean Installation

```bash
# Remove lockfile and node_modules
Remove-Item pnpm-lock.yaml -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# Clean all workspace node_modules
Get-ChildItem -Recurse -Directory -Filter "node_modules" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Fresh install
pnpm install
```

### Step 2: Verify Fix

```bash
pnpm audit
```

**Expected Result:** The vulnerabilities should be significantly reduced (from 60 to likely <10), as most were coming from the `dns@0.2.2` package dependency tree.

### Step 3: If Vulnerabilities Persist

If you still see vulnerabilities referencing `dns@0.2.2`, check:

1. **Verify package.json was updated:**
   ```bash
   Get-Content apps\dns-service\package.json | Select-String "dns"
   ```
   Should return nothing (no `dns` package reference).

2. **Check for other references:**
   ```bash
   Get-ChildItem -Recurse -Filter "package.json" | Select-String '"dns"'
   ```

3. **Force clean and reinstall:**
   ```bash
   pnpm store prune
   pnpm install --force
   ```

## Why This Happens

Package managers use lockfiles (`pnpm-lock.yaml`, `package-lock.json`, etc.) to ensure reproducible installs. When you remove a dependency from `package.json`, the lockfile still contains:
- The old package reference
- All its transitive dependencies
- The dependency tree structure

Only a fresh `pnpm install` will regenerate the lockfile without the removed package.

## Verification Checklist

- [ ] `apps/dns-service/package.json` no longer contains `"dns": "^0.2.2"`
- [ ] Lockfile has been removed or regenerated
- [ ] `pnpm install` completes successfully
- [ ] `pnpm audit` shows significantly fewer vulnerabilities
- [ ] No paths in audit output reference `dns@0.2.2`

## Notes

- The DNS service uses Node.js's built-in `dns` module (`import { promises as dns } from 'dns'`), not the npm package
- The npm `dns@0.2.2` package was pulling in 50+ vulnerable legacy dependencies
- After lockfile regeneration, these should all be removed
