# Spline Integration Guide for Demiurge

This guide covers everything you need to know about creating immersive 3D experiences for Demiurge using Spline.

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Scene Templates](#scene-templates)
4. [Variable Bindings](#variable-bindings)
5. [Events & Interactions](#events--interactions)
6. [NFT Asset Creation](#nft-asset-creation)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Spline is integrated into Demiurge for:

| Use Case | Component | Description |
|----------|-----------|-------------|
| **Landing Hero** | `SplineHero` | Full-screen 3D backgrounds with scroll effects |
| **NFT Previews** | `SplineNFTPreview` | Interactive 3D representations of DRC-369 NFTs |
| **Dashboard World** | `DemiurgeSplineWorld` | Immersive data visualization |
| **Custom Scenes** | `SplineScene` | General-purpose 3D embeds |

---

## Getting Started

### 1. Design in Spline

1. Go to [spline.design](https://spline.design)
2. Create a new project
3. Design your 3D scene

### 2. Add Variables (for blockchain data)

In Spline's right sidebar → Variables panel, create:

```
blockHeight    (Number)  - Current block number
validators     (Number)  - Validator count
isConnected    (Boolean) - Chain status
cgtBalance     (Number)  - User's CGT balance
energy         (Number)  - User's energy level
scrollProgress (Number)  - Page scroll position (0-1)
mouseX         (Number)  - Mouse X position (-1 to 1)
mouseY         (Number)  - Mouse Y position (-1 to 1)
```

### 3. Export to React

1. Click **Export** (top right)
2. Select **Code** → **React**
3. Copy the scene URL

### 4. Use in Demiurge

```tsx
import { SplineScene } from '@/components/spline';

function MyComponent() {
  return (
    <SplineScene 
      scene="https://prod.spline.design/YOUR_URL/scene.splinecode"
      onLoad={(spline) => console.log('Loaded!', spline)}
    />
  );
}
```

---

## Scene Templates

### Template 1: Landing Page Hero

**Requirements:**
- Fullscreen background scene
- Responsive to scroll
- Mouse parallax effect
- Blockchain data display

**Spline Setup:**
1. Create a scene with these objects:
   - `Core` - Central animated element
   - `Particles` - Background particle system
   - `DataPillar_Block` - Displays block height
   - `DataPillar_Validators` - Displays validator count

2. Add Variables:
   ```
   scrollProgress (Number, default: 0)
   mouseX (Number, default: 0)
   mouseY (Number, default: 0)
   blockHeight (Number, default: 0)
   validators (Number, default: 0)
   ```

3. Add Events:
   - Variable Change on `scrollProgress` → Transition camera position
   - Variable Change on `mouseX/Y` → Rotate Core subtly

**React Integration:**
```tsx
import { SplineHero } from '@/components/spline';

<SplineHero
  sceneUrl="YOUR_SCENE_URL"
  title="DEMIURGE"
  subtitle="The Sovereign Creative Substrate"
  enableScrollEffect
  enableMouseParallax
  enableBlockchainSync
>
  <button>Get Started</button>
</SplineHero>
```

---

### Template 2: NFT Asset Preview

**Requirements:**
- Showcase a single 3D NFT
- Display dynamic stats (level, XP, etc.)
- Interactive rotation
- Glow/highlight on hover

**Spline Setup:**
1. Create the 3D NFT model
2. Add hover state with glow effect
3. Create Variables:
   ```
   level (Number, default: 1)
   xp (Number, default: 0)
   health (Number, default: 100)
   nftName (String, default: "NFT")
   isSoulbound (Boolean, default: false)
   ```

4. Bind variables to text objects:
   - Select text object → Properties → Content → Link to variable

**React Integration:**
```tsx
import { SplineNFTPreview } from '@/components/spline';

<SplineNFTPreview
  nft={{
    tokenId: 'drc369_abc123',
    name: 'Cosmic Warrior',
    splineSceneUrl: 'YOUR_NFT_SCENE_URL',
    dynamicState: {
      level: 5,
      xp: 2500,
      health: 85,
    },
    soulbound: true,
  }}
  size="lg"
  showControls
/>
```

---

### Template 3: Dashboard World

**Requirements:**
- Multi-zone navigation
- Real-time data pillars
- Camera transitions
- HUD overlay

**Spline Setup:**
1. Create zones as separate areas:
   - Command Center (origin)
   - Social Nexus (north)
   - Asset Vault (east)
   - Data Stream (south)
   - Experience (west)

2. Add multiple cameras:
   - `Camera_Command`
   - `Camera_Social`
   - `Camera_Assets`
   - etc.

3. Create Variables:
   ```
   currentZone (String, default: "command")
   blockHeight (Number)
   validators (Number)
   cgtBalance (Number)
   energy (Number)
   ```

4. Add Events:
   - Variable Change on `currentZone` → Switch Camera action

**React Integration:**
```tsx
import { DemiurgeSplineWorld } from '@/components/spline';

<DemiurgeSplineWorld
  sceneUrl="YOUR_WORLD_URL"
  zoneScenes={{
    social: 'SOCIAL_SCENE_URL',
    assets: 'ASSETS_SCENE_URL',
  }}
  enableDataBinding
  showHUD
/>
```

---

## Variable Bindings

### Automatic Blockchain Sync

Use the `useSplineBlockchain` hook:

```tsx
import { useRef } from 'react';
import { SplineScene, SplineSceneRef, useSplineBlockchain } from '@/components/spline';

function MyScene() {
  const splineRef = useRef<SplineSceneRef>(null);
  
  const { variables, isConnected } = useSplineBlockchain({
    splineRef,
    updateInterval: 2000,
    includeUserData: true,
  });

  return (
    <SplineScene
      ref={splineRef}
      scene="YOUR_URL"
    />
  );
}
```

### Supported Auto-Synced Variables

| Variable | Type | Description |
|----------|------|-------------|
| `blockHeight` | Number | Current block number |
| `validators` | Number | Active validators |
| `tps` | Number | Transactions per second |
| `isConnected` | Boolean | Chain connection |
| `cgtBalance` | Number | User's CGT (if logged in) |
| `energy` | Number | User's energy level |
| `nftCount` | Number | User's NFT count |
| `networkLoad` | Number | Network load (0-100) |

### Manual Variable Updates

```tsx
const splineRef = useRef<SplineSceneRef>(null);

// Update a single variable
splineRef.current?.setVariable('customValue', 42);

// Get all variables
const vars = splineRef.current?.getAllVariables();
```

---

## Events & Interactions

### Handling Spline Events in React

```tsx
<SplineScene
  scene="YOUR_URL"
  onSplineMouseDown={(e) => {
    if (e.target?.name === 'BuyButton') {
      handlePurchase();
    }
  }}
  onSplineMouseHover={(e) => {
    setHoveredObject(e.target?.name);
  }}
/>
```

### Triggering Spline Events from React

```tsx
// Trigger a named event
splineRef.current?.emitEvent('startAnimation');

// Trigger event on specific object
splineRef.current?.emitEventByName('Cube', 'hoverState');
```

---

## NFT Asset Creation

### Workflow for 3D NFT Assets

1. **Design in Spline**
   - Create the 3D model
   - Add materials and lighting
   - Set up interaction states (idle, hover, selected)

2. **Add Dynamic Properties**
   - Create variables for evolving stats
   - Bind to visual elements (glow intensity, size, color)

3. **Export Options**
   - **Web Preview**: Export as React code
   - **Static Asset**: Export as GLTF for IPFS storage
   - **Thumbnail**: Export as PNG for marketplace listings

4. **Mint with Spline URL**
   ```bash
   nft mint --name="My 3D NFT" \
            --spline="https://prod.spline.design/xxx/scene.splinecode" \
            --dynamic
   ```

### Dynamic NFT State Updates

When NFT state changes on-chain, the Spline scene updates automatically:

```tsx
// NFT gains XP after battle
const updatedNFT = {
  ...nft,
  dynamicState: {
    ...nft.dynamicState,
    xp: nft.dynamicState.xp + 100,
    level: nft.dynamicState.level + 1,
  },
};

// SplineNFTPreview automatically syncs new state to Spline variables
```

---

## Best Practices

### Performance

1. **Optimize Geometry**
   - Keep polygon counts low (< 50k for complex scenes)
   - Use instancing for repeated objects
   - Merge static geometry

2. **Texture Compression**
   - Use 1024x1024 max for most textures
   - Enable texture compression in Spline

3. **Scene Size**
   - Target < 5MB for landing pages
   - Target < 2MB for NFT previews

### Visual Consistency

1. **Color Palette** (Demiurge Brand)
   ```
   Neon Cyan:    #66FCF1
   Neon Purple:  #BF00FF
   Gold:         #FFD700
   Background:   #0B0C10
   ```

2. **Lighting**
   - Use cool-toned ambient light
   - Add cyan rim lights for tech aesthetic
   - Enable soft shadows for depth

3. **Materials**
   - Glass layers for holographic effects
   - Fresnel for edge glow
   - Noise layers for energy/particle effects

### Accessibility

1. Provide fallback images for non-WebGL browsers
2. Keep essential info in overlay text, not just 3D
3. Test on lower-end devices

---

## Troubleshooting

### Scene Not Loading

```tsx
<SplineScene
  scene="YOUR_URL"
  onLoad={() => console.log('Loaded')}
  onError={(e) => console.error('Error:', e)}
/>
```

### Variables Not Updating

1. Ensure variable names match exactly (case-sensitive)
2. Check variable type matches (Number vs String)
3. Verify scene is fully loaded before setting

### Performance Issues

1. Open DevTools → Performance tab
2. Check for:
   - High draw calls (reduce objects)
   - Large textures (compress them)
   - Complex shaders (simplify materials)

### CORS Errors

If loading from external URL fails:
1. Download the `.splinecode` file
2. Host in `/public/spline/`
3. Reference as `/spline/scene.splinecode`

---

## Resources

- [Spline Documentation](https://docs.spline.design)
- [Spline Community](https://spline.design/community)
- [@splinetool/react-spline](https://github.com/splinetool/react-spline)
- [Demiurge Design System](/docs/design-system.md)

---

## Examples

### Live Demo

Visit [demiurge.cloud/spline](https://demiurge.cloud/spline) to test scenes interactively.

### Sample Scene URLs

(Replace with your actual exported scenes)

```
Landing Hero:    https://prod.spline.design/xxx/scene.splinecode
NFT Preview:     https://prod.spline.design/yyy/scene.splinecode
Dashboard World: https://prod.spline.design/zzz/scene.splinecode
```
