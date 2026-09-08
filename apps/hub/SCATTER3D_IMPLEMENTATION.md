# Scatter3D Engine Implementation

**Status**: ✅ Complete  
**Version**: 1.0.0-alpha  
**Date**: January 2026

---

## Overview

Scatter3D is a high-fidelity ASCII raymarching engine that renders 3D worlds entirely out of text characters. It implements a "Text-Based Photon Mapping System" that intercepts WebGL output and converts it to colored ASCII characters.

---

## Architecture

### Core Components

1. **ScatterRenderer** (`components/scatter3d/ScatterRenderer.tsx`)
   - Intercepts WebGL render pipeline
   - Converts 3D geometry to ASCII characters
   - Supports full RGBA color per character
   - Configurable resolution and character sets

2. **DemiurgeGate** (`components/scatter3d/DemiurgeGate.tsx`)
   - Security layer protecting engine access
   - Verifies QOR ID authentication
   - Checks minimum staking balance (100 CGT)
   - Validates stake percentage (0.01% of total)

3. **useQOR Hook** (`hooks/useQOR.ts`)
   - Integrates with QOR Auth SDK
   - Fetches staking balance from blockchain
   - Calculates stake percentage
   - Provides authentication state

4. **Scatter3DScene** (`components/scatter3d/Scatter3DScene.tsx`)
   - Demo 3D world with rotating objects
   - Grid floor, floating cubes, torus knot
   - Mouse-controlled camera (OrbitControls)
   - Dynamic lighting

---

## Access Requirements

### Authentication
- ✅ QOR ID login required
- ✅ Valid session token

### Staking
- ✅ Minimum 100 CGT (10,000 smallest units)
- ✅ Minimum 0.01% of total staked assets

### Error States
- **403 UNAUTHORIZED**: Not logged in
- **403 INSUFFICIENT COMPUTING CREDITS**: Insufficient stake

---

## File Structure

```
apps/hub/src/
├── hooks/
│   └── useQOR.ts                    # QOR auth & staking hook
├── components/
│   └── scatter3d/
│       ├── ScatterRenderer.tsx      # ASCII rendering engine
│       ├── DemiurgeGate.tsx          # Access control wrapper
│       └── Scatter3DScene.tsx       # Demo 3D scene
├── app/
│   ├── scatter3d/
│   │   └── page.tsx                 # Main game page
│   └── docs/
│       └── scatter3d/
│           └── page.tsx             # Documentation
└── lib/
    └── game-registry.ts             # Game registry (updated)
```

---

## Dependencies Added

```json
{
  "@react-three/drei": "^9.88.0",
  "@react-three/fiber": "^8.15.0",
  "three": "^0.160.0"
}
```

---

## Usage

### Access the Engine

1. Navigate to `/scatter3d`
2. Ensure you're logged in with QOR ID
3. Verify you have minimum stake (100 CGT)
4. The engine will initialize automatically

### View Documentation

Navigate to `/docs/scatter3d` for comprehensive documentation.

---

## Technical Details

### Character Set
Default: `" .:-+*=%@#"` (light to dark)

### Resolution
Default: `0.18` (lower = blockier/faster, higher = sharper/slower)

### Rendering Pipeline
1. **Geometry Pass**: Load 3D models (invisible)
2. **Raycaster**: Cast rays for each screen coordinate
3. **Quantizer**: Map lighting to character density
4. **Colorizer**: Apply material colors to characters

### Performance
- Uses WebGL for computation
- Outputs text characters (lightweight)
- Configurable resolution for performance tuning

---

## Integration Points

### Game Registry
Scatter3D is registered in `game-registry.ts`:
- ID: `scatter3d`
- Title: `Scatter3D Engine`
- Tags: `['engine', '3d', 'ascii', 'raymarching', 'experimental', 'stake-required']`

### Blockchain Integration
- Uses `demiurgeRpc` for balance queries
- Integrates with QOR Auth SDK
- Checks staking pools (future enhancement)

---

## Future Enhancements

1. **NFT Rendering**: Render DRC-369 NFTs as 3D ASCII objects
2. **Multiplayer**: Network synchronization for shared worlds
3. **Custom Scenes**: User-created 3D worlds
4. **Performance**: Web Workers for heavy calculations
5. **Advanced Lighting**: Real-time shadows and reflections

---

## Security Considerations

- ✅ Authentication required (QOR ID)
- ✅ Staking verification (prevents abuse)
- ✅ Server resource protection (exclusive access)
- ✅ Client-side rendering (no server load)

---

## Testing

To test the engine:

1. **With Sufficient Stake**:
   - Login with QOR ID
   - Ensure balance > 100 CGT
   - Navigate to `/scatter3d`
   - Should see ASCII-rendered 3D scene

2. **Without Authentication**:
   - Logout
   - Navigate to `/scatter3d`
   - Should see "403 UNAUTHORIZED" screen

3. **With Insufficient Stake**:
   - Login with QOR ID
   - Ensure balance < 100 CGT
   - Navigate to `/scatter3d`
   - Should see "403 INSUFFICIENT COMPUTING CREDITS" screen

---

## Notes

- The engine uses React Three Fiber for 3D rendering
- ASCII conversion happens via Three.js AsciiEffect
- All rendering is client-side (no server load)
- Character colors inherit from 3D material colors
- Background is deep black (#050505) for terminal aesthetic

---

**The Code is the World. Only the staked may see behind the veil.**
