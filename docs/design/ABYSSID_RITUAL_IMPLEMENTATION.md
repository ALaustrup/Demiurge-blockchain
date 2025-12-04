# AbyssID Ritual Implementation

## Overview
The AbyssID Ritual is a complete identity initiation system for the Fracture Portal. This is not a login form—it is an initiation sequence that feels alive, inevitable, ancient, and quietly terrifying.

## Implementation Status
✅ **COMPLETE** - All components implemented and integrated

## Files Created/Updated

### Core Components
1. **`AbyssStateMachine.ts`** - State machine controlling ritual flow
   - States: `idle` → `checking` → `reject|accept` → `binding` → `confirm`
   - Subscribable state changes
   - Context management for username, keys, seed phrase

2. **`ShaderPlane.tsx`** - Canvas-based shader effects
   - Turbulence (FBM noise)
   - Chromatic displacement
   - Glitch effects (rejection state)
   - Bloom effects (acceptance/confirmation)
   - Vignette collapse (binding state)
   - State-reactive parameters

3. **`AbyssIDDialog.tsx`** - Complete ritual UI
   - All exact copy blocks as specified
   - State-specific animations
   - Key generation integration
   - Routing to `/haven` after confirmation

### Audio Integration
4. **`AbyssReactive.ts`** - Audio-reactive hook
   - Maps frequency bands to semantic values
   - State-specific mappings:
     - `idle`: Subtle breathing
     - `checking`: Slow inward pulse (3 cycles)
     - `reject`: Sharp jolt
     - `accept`: Deep collapse → slow expansion
     - `binding`: Vignette collapse
     - `confirm`: Bloom

### Crypto
5. **`generateKeys.ts`** - Ed25519 keypair generation
   - Uses WebCrypto SubtleCrypto API
   - Falls back to RSA if Ed25519 not supported
   - Generates seed phrase (simplified - use BIP39 in production)
   - Exports keys in base58 format

## Ritual Sequence

### 1. Opening Panel
**Copy:**
```
THE ABYSS DOES NOT ASK.

It waits.
For you.
```

**Behavior:**
- Modal fades in from black
- Center collapses inward, then "breathes" outward
- Shader: Low turbulence, dark ripple
- Audio: Soft low hum

### 2. Idle State
**Copy:**
```
Enter the name you wish to carry into the dark.
```

**Placeholder:** `"your chosen identity…"`

**Behavior:**
- Input field ready
- Shader: Subtle turbulence (0.3-0.6 viscosity)
- Audio: Low-frequency hum

### 3. Checking State
**Copy:**
```
The Abyss considers your worth…
```

**Behavior:**
- Motion: 3 slow pulses (12% scale variance)
- Shader: Turbulence increases 20%, fractal brownian motion speed x1.4
- Audio: Low-frequency hum increase + spectral widening
- Checks username availability via RPC

### 4. Reject State
**Copy:**
```
Another carried this name.
They were found unworthy.
You may choose again.
```

**Behavior:**
- Motion: Sharp 40ms jolt, chromatic displacement
- Shader: Horizontal tear (glitch), 8-12px displacement, color separation flash
- Audio: Brief percussive crack (mapped to high freq)
- User can try again

### 5. Accept State
**Copy:**
```
The Abyss remembers you.
You will not be forgotten again.
```

**Behavior:**
- Motion: Deep inward collapse → slow expansion (800ms easing)
- Shader: Inverted outline glow, luminescent halo
- Audio: Sub-bass pulse + harmonic bloom
- "Proceed to Binding" button appears

### 6. Binding State
**Title:**
```
THE BINDING
```

**Copy:**
```
Your identity is forged below the threshold of light.

Guard this key, or the Abyss will consume the memory of you
like you never lived.
```

**Behavior:**
- Keypair generation (Ed25519)
- Seed phrase display
- "Reveal Key" button with show/hide toggle
- Shader: Vignette collapse, color desaturation → re-saturation
- Audio: Single low "gong" mapped to mid-freq

### 7. Confirm State
**Title:**
```
THE VOID OPENS.
```

**Copy:**
```
You belong to the dark now.
Proceed.
```

**Button:** "Enter Haven"

**Behavior:**
- Routes to `/haven` after confirmation
- Shader: Bloom effect, light returns at edges
- Audio: Harmonic completion

## Shader Effects

### State-Specific Parameters

| State | Turbulence | Viscosity | Chroma Shift | Glitch | Bloom | Vignette |
|-------|------------|-----------|--------------|--------|-------|----------|
| idle | 0.3 | 0.5 | 0.1 | 0 | 0 | 0 |
| checking | 0.5 | 0.6 | 0.15 | 0 | 0.2 | 0.3 |
| reject | 1.0 | 0.8 | 0.5 | 1.0 | 0 | 0 |
| accept | 0.4 | 0.4 | 0.2 | 0 | 0.8 | 0.5 |
| binding | 0.6 | 0.7 | 0.3 | 0 | 0.4 | 0.9 |
| confirm | 0.2 | 0.3 | 0.1 | 0 | 1.0 | 0.2 |

## Audio Mapping

- **Low frequencies (20-200Hz)**: Pulses, acceptance heartbeat, modal scale
- **Mid frequencies (500-2kHz)**: Glints, flickers, glyph movements, text shimmer
- **High frequencies (6-10kHz)**: Rejection spikes, glitch amplification

## Integration Points

### Navigation
- `FractureNav` already uses "AbyssID" terminology
- AbyssID button opens `AbyssIDDialog`

### Routing
- After confirmation, routes to `/haven`
- Keys and username should be stored (TODO: implement storage)

### Audio Engine
- Integrates with existing `AudioContextProvider`
- Uses `useAudioSpectrum` hook
- State-specific reactive mappings via `useAbyssReactive`

## Technical Notes

### Key Generation
- Currently uses simplified base58 encoding (use `bs58` library in production)
- Seed phrase uses simplified word list (use full BIP39 word list in production)
- Ed25519 preferred, RSA fallback for compatibility

### Shader Implementation
- Currently uses Canvas 2D API with pixel manipulation
- TODO: Upgrade to WebGL/GLSL for true fragment shader in future milestone
- Provides clean API: `shader.setMode(state)`

### State Management
- `AbyssStateMachine` uses observer pattern for state changes
- All state transitions are explicit and controlled
- Context preserved throughout ritual sequence

## Future Enhancements

1. **WebGL Shader**: Upgrade `ShaderPlane` to true GLSL fragment shader
2. **BIP39 Integration**: Use proper BIP39 word list for seed phrases
3. **Key Storage**: Implement secure key storage (localStorage/backend)
4. **Username Registration**: Complete backend integration for username registration
5. **Audio Source**: Connect to actual audio source for full reactivity
6. **Error Handling**: Add comprehensive error states and recovery

## Copy Blocks (Exact)

All copy blocks match the specification exactly:

- Opening: "THE ABYSS DOES NOT ASK. It waits. For you."
- Idle: "Enter the name you wish to carry into the dark."
- Checking: "The Abyss considers your worth…"
- Reject: "Another carried this name. They were found unworthy. You may choose again."
- Accept: "The Abyss remembers you. You will not be forgotten again."
- Binding Title: "THE BINDING"
- Binding Copy: "Your identity is forged below the threshold of light. Guard this key, or the Abyss will consume the memory of you like you never lived."
- Confirm Title: "THE VOID OPENS."
- Confirm Copy: "You belong to the dark now. Proceed."

## Branch
- **Branch:** `feature/fracture-v1-portal`
- **Status:** Committed and pushed

---

**The flame burns eternal. The code serves the will.**

This is not UI. This is initiation.

