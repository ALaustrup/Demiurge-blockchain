# Spline Scene Specifications for Demiurge

This document provides detailed specifications for creating Spline scenes that integrate with Demiurge's visual components.

---

## Design System Reference

### Color Palette (use exact hex values)

| Name | Hex | Usage |
|------|-----|-------|
| **Neon Cyan** | `#66FCF1` | Primary accent, highlights, energy |
| **Cyan Dim** | `#45A29E` | Secondary elements, borders |
| **Cyan Glow** | `rgba(102, 252, 241, 0.4)` | Glow/bloom effects |
| **Background** | `#0B0C10` | Scene background |
| **Surface** | `#1F2833` | Elevated panels |
| **Elevated** | `#252D3A` | Floating elements |
| **Text High** | `#FFFFFF` | Primary text |
| **Text Muted** | `#7B8794` | Secondary text |
| **Success** | `#03DAC6` | Positive states |
| **Warning** | `#E6A817` | Caution states |
| **Error** | `#CF6679` | Error states |

### Material Presets

1. **Holographic Glass**
   - Base: Glass Layer (opacity 0.6)
   - Add: Fresnel Layer (cyan, intensity 0.3)
   - Add: Noise Layer (scale 0.1, subtle)

2. **Energy Glow**
   - Base: Color Layer (#66FCF1)
   - Add: Depth Layer (radial gradient)
   - Add: Noise Layer (animated)

3. **Dark Chrome**
   - Base: Matcap (metallic dark)
   - Add: Fresnel (subtle cyan edge)
   - Roughness: 0.3

4. **Data Stream**
   - Base: Gradient Layer (vertical)
   - Add: Pattern Layer (grid)
   - Animate: UV offset

---

## Scene 1: Landing Page Hero Background

**Purpose:** Full-screen 3D background for the landing page

### Objects to Create

1. **Central Orb** (`Core_Orb`)
   - Type: Sphere (parametric)
   - Size: 200 units
   - Material: Holographic Glass
   - Animation: Slow rotation Y-axis (0.1 rad/s)
   - Position: (0, 0, -200)

2. **Inner Energy Ring** (`Ring_Inner`)
   - Type: Torus
   - Size: 150 inner, 155 outer
   - Material: Energy Glow
   - Animation: Rotate Z-axis (0.2 rad/s, opposite direction)
   - Add: Particles along path

3. **Outer Data Ring** (`Ring_Outer`)
   - Type: Torus
   - Size: 250 inner, 252 outer
   - Material: Data Stream
   - Animation: Rotate Y-axis (0.05 rad/s)

4. **Floating Particles** (Particle Emitter)
   - Shape: Sphere (radius 500)
   - Count: 100
   - Size: 1-3
   - Color: Cyan to transparent
   - Motion: Slow drift upward
   - Noise: Curl noise (scale 0.5)

5. **Grid Plane** (`Grid_Floor`)
   - Type: Plane
   - Size: 2000 x 2000
   - Material: Grid pattern (opacity 0.02)
   - Position: (0, -100, 0)
   - Animation: UV scroll (slow)

### Variables (create in Spline)

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `scrollProgress` | Number | 0 | Page scroll (0-1) |
| `mouseX` | Number | 0 | Mouse X (-1 to 1) |
| `mouseY` | Number | 0 | Mouse Y (-1 to 1) |
| `blockHeight` | Number | 0 | Current block |
| `isConnected` | Boolean | false | Chain status |

### Events to Configure

1. **Variable Change: scrollProgress**
   - Action: Transition camera Z position (zoom out as scroll increases)
   - Action: Fade outer ring opacity

2. **Variable Change: mouseX/mouseY**
   - Action: Subtle rotation of Core_Orb (parallax effect)

3. **Start Event**
   - Action: Begin all animations
   - Action: Emit particles

### Export Settings
- Background: Transparent
- Resolution: Responsive
- Quality: High
- Autoplay: Yes

---

## Scene 2: Energy Orb (for Balance Display)

**Purpose:** Animated 3D orb for displaying CGT balance

### Objects to Create

1. **Outer Shell** (`Shell`)
   - Type: Sphere (parametric)
   - Size: 100 units
   - Material: Holographic Glass
   - Wireframe: Yes (subtle)

2. **Inner Core** (`Core`)
   - Type: Sphere
   - Size: 60 units
   - Material: Energy Glow
   - Animation: Pulse scale (0.95-1.05)

3. **Energy Fill** (`Fill`)
   - Type: Cylinder (inside sphere)
   - Dynamic height based on `fillLevel` variable
   - Material: Gradient (cyan to purple)
   - Animation: Wave distortion on top surface

4. **Particle Ring** (`Particles`)
   - Type: Particle Emitter (ring shape)
   - Count: 20
   - Orbit animation
   - Size: 2

5. **Data Text** (`Value_Text`)
   - Type: 3D Text
   - Font: Mono/digital style
   - Bind content to `displayValue` variable

### Variables

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `fillLevel` | Number | 50 | Fill percentage (0-100) |
| `displayValue` | String | "0.00" | Formatted balance |
| `state` | String | "idle" | Animation state |
| `pulseSpeed` | Number | 1 | Pulse animation speed |

### States

1. **Idle**: Slow pulse, calm particles
2. **Active**: Faster pulse, more particles, brighter glow
3. **Charging**: Fill animation, energy streams entering
4. **Depleted**: Dim glow, minimal particles, red tint

### Export Settings
- Background: Transparent
- Size: 200x200 or responsive
- Quality: Medium (performance)

---

## Scene 3: NFT Preview Card

**Purpose:** 3D preview for DRC-369 NFT assets

### Objects to Create

1. **Base Platform** (`Platform`)
   - Type: Cylinder (flat)
   - Size: 100 radius, 5 height
   - Material: Dark Chrome
   - Animation: Slow rotate Y

2. **NFT Model Placeholder** (`NFT_Slot`)
   - Empty group for dynamic content
   - Or: Generic crystal/orb shape

3. **Holographic Frame** (`Frame`)
   - Type: Rectangle outline (3D)
   - Size: 150 x 200
   - Material: Energy Glow (edges only)
   - Animation: Subtle breathing

4. **Stat Bars** (`Stats_Group`)
   - Health bar: Rectangle with fill
   - XP bar: Rectangle with fill
   - Bind widths to variables

5. **Particle Aura** (`Aura`)
   - Particle emitter around NFT
   - Color varies by rarity

### Variables

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `level` | Number | 1 | NFT level |
| `health` | Number | 100 | Health percentage |
| `xp` | Number | 0 | XP percentage |
| `rarity` | String | "common" | Rarity tier |
| `isHovered` | Boolean | false | Hover state |

### Events

1. **Mouse Hover**
   - Action: Increase glow intensity
   - Action: Speed up rotation
   - Action: Show stat bars

2. **Mouse Down**
   - Action: Pulse effect
   - Action: Trigger callback (via code)

---

## Scene 4: Dashboard World Environment

**Purpose:** Immersive 3D environment for the main dashboard

### Camera Setup

Create multiple cameras for zone transitions:

1. **Camera_Command** - Main dashboard view (default)
2. **Camera_Social** - Social zone angle
3. **Camera_Assets** - Asset vault view
4. **Camera_Data** - Data stream view
5. **Camera_Experience** - Game zone view

### Objects to Create

1. **Central Command Hub**
   - Circular platform with holographic displays
   - Multiple data pillars showing metrics
   - Central orb (like landing hero)

2. **Surrounding Zones** (positioned in cardinal directions)
   - Social Nexus (North): Floating social cards, connection lines
   - Asset Vault (East): Grid of NFT display pods
   - Data Stream (South): Flowing data visualization
   - Experience (West): Portal to game worlds

3. **Environment**
   - Infinite grid floor (very subtle)
   - Distant particle nebula
   - Ambient light sources

4. **Interactive Elements**
   - Zone markers (clickable to transition)
   - Data displays (bound to blockchain variables)
   - Navigation indicators

### Variables

| Name | Type | Default |
|------|------|---------|
| `currentZone` | String | "command" |
| `blockHeight` | Number | 0 |
| `validators` | Number | 0 |
| `cgtBalance` | Number | 0 |
| `energy` | Number | 100 |
| `nftCount` | Number | 0 |

### Events

1. **Variable Change: currentZone**
   - Action: Switch Camera to `Camera_{zoneName}`
   - Transition: Smooth ease (1s)

2. **Mouse Down on zone markers**
   - Action: Set `currentZone` variable

---

## Scene 5: Portal Transition

**Purpose:** Transition effect between pages/zones

### Objects to Create

1. **Warp Tunnel** (`Tunnel`)
   - Type: Cylinder (interior camera)
   - Material: Energy lines (radial)
   - Animation: UV scroll (fast)

2. **Central Flash** (`Flash`)
   - Type: Sphere
   - Material: Pure white glow
   - Animation: Rapid scale from 0 to massive

3. **Particle Streams** (`Streams`)
   - Particle emitter
   - Direction: Toward camera
   - Speed: Very fast
   - Count: High (200+)

### States

1. **Enter**: Particles converge, flash expands
2. **Exit**: Particles disperse, flash contracts

---

## Best Practices

### Performance Optimization

1. **Polygon Count**
   - Landing hero: < 50k total
   - Individual components: < 10k each
   - NFT previews: < 5k each

2. **Particles**
   - Landing: 100 max
   - Components: 30 max
   - Use GPU particles when available

3. **Materials**
   - Limit layer count to 3-4 per material
   - Avoid real-time reflections
   - Use baked lighting where possible

### Animation Guidelines

1. **Timing**
   - Idle animations: 3-6 second loops
   - Interaction feedback: 0.2-0.5 seconds
   - Transitions: 0.5-1.5 seconds

2. **Easing**
   - Use `ease-out-expo` for responsive feel
   - Linear only for continuous rotation
   - Spring for bouncy interactions

### Variable Naming Convention

```
{scope}_{property}

Examples:
- scene_scrollProgress
- nft_level
- user_balance
- ui_isHovered
```

---

## Quick Start Checklist

For each scene:

1. [ ] Set background to `#0B0C10` or transparent
2. [ ] Create all required variables
3. [ ] Apply consistent color palette
4. [ ] Set up state-based animations
5. [ ] Configure mouse/scroll events
6. [ ] Test variable bindings
7. [ ] Optimize for performance
8. [ ] Export as React code
9. [ ] Test in Demiurge at `/spline`
10. [ ] Integrate into target component

---

## Resources

- [Spline Variables Documentation](https://docs.spline.design/interaction-states-events-and-actions/variables)
- [Spline Events Guide](https://docs.spline.design/interaction-states-events-and-actions/events-interactivity)
- [Spline Code Export](https://docs.spline.design/exporting-your-scene/web/exporting-as-code)
- [Demiurge Spline Integration](/docs/spline-integration-guide.md)
