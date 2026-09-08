# Finding Build Configuration in Visual Studio

## The Configuration Dropdown Location

The configuration dropdown is **NOT always visible** by default. Here's where to find it:

### Option 1: Standard Toolbar (Most Common)

1. **Look at the top toolbar** (below the menu bar)
2. **Find these dropdowns** (usually grouped together):
   - **Solution Configurations** dropdown
   - **Solution Platforms** dropdown
3. **If you don't see them:**
   - Right-click the **toolbar** → **Customize**
   - Check **Standard** toolbar
   - Look for dropdowns with "Debug", "Release", etc.

### Option 2: Solution Explorer Context Menu

1. **Right-click** on **Solution 'DemiurgeClient'** (top item in Solution Explorer)
2. **Properties** → **Configuration Properties**
3. **Configuration** dropdown → Select **Development Editor**
4. **Platform** → Select **Win64**
5. Click **OK**

### Option 3: Project Properties (Per Project)

1. **Right-click** on **DemiurgeClient** project (in Solution Explorer)
2. **Properties**
3. **Configuration:** Dropdown at top → **Development Editor**
4. **Platform:** Dropdown next to it → **Win64**
5. Click **OK**

### Option 4: Build Menu

1. **Build** → **Configuration Manager**
2. **Active solution configuration:** Dropdown → **Development Editor**
3. **Active solution platform:** Dropdown → **Win64**
4. Click **Close**

---

## If You Still Can't Find It

**Just build anyway!** Visual Studio will use the default configuration.

1. **Build** → **Build Solution** (`Ctrl+Shift+B`)
2. If it builds with wrong config, you'll see errors
3. Then use **Configuration Manager** (Option 4 above) to fix it

---

## Quick Check: What Configuration Am I Using?

**Build** → **Configuration Manager**

Look at **Active solution configuration** - it will show:
- ✅ `Development Editor` (correct)
- ❌ `Debug` (wrong - change it)
- ❌ `Release` (wrong - change it)

---

## The Easiest Way

**Just right-click Solution → Properties → Configuration Properties → Development Editor**

That's it. Then build.
