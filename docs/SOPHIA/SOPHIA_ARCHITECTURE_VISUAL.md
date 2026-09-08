# Sophia Glass-Panel Architecture - Visual Reference

## System Layers (Top to Bottom)

```
╔════════════════════════════════════════════════════════════════╗
║  Layer 5: SOPHIA CHAT (z-50)                                   ║
║  ┌─────────────────────────────────────────────────────────┐   ║
║  │  ◇ Sophia                                               │   ║
║  │  AI Gatekeeper                                          │   ║
║  │  ┌─────────────────────────────────────────────────┐   │   ║
║  │  │ Welcome, traveler...                            │   │   ║
║  │  │ User: How do I mine?                            │   │   ║
║  │  │ Sophia: I'll guide you...                       │   │   ║
║  │  │ [Input field]                 [Send]            │   │   ║
║  │  └─────────────────────────────────────────────────┘   │   ║
║  │                                                         │   ║
║  └─────────────────────────────────────────────────────────┘   ║
║  [Floating Button - Pulsing Glow]                              ║
╚════════════════════════════════════════════════════════════════╝
                            ▲
                            │ onClick
                            │
╔════════════════════════════════════════════════════════════════╗
║  Layer 4: CONTENT (z-20)                                       ║
║  ┌─────────────────────────────────────────────────────────┐   ║
║  │ HEADER (Glass Panel)                                    │   ║
║  │ ┌─────────────────────────────────────────────────┐     │   ║
║  │ │ ◇ Sophia      [Username] [Logout]              │     │   ║
║  │ └─────────────────────────────────────────────────┘     │   ║
║  │                                                         │   ║
║  │ WELCOME SECTION (Glass Panel)                          │   ║
║  │ ┌─────────────────────────────────────────────────┐     │   ║
║  │ │ Welcome, user                                   │     │   ║
║  │ │ Choose a system to begin...                     │     │   ║
║  │ │ ────────────────────────────────                │     │   ║
║  │ └─────────────────────────────────────────────────┘     │   ║
║  │                                                         │   ║
║  │ SYSTEM GRID (6 Glass Panels)                           │   ║
║  │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │   ║
║  │ │⛏️ Mining    │ │💰 Wallet    │ │🎨 NFT Portal│    │   ║
║  │ │Validate...   │ │Manage...     │ │Create...     │    │   ║
║  │ │[Explore →]  │ │[Explore →]  │ │[Explore →]  │    │   ║
║  │ └──────────────┘ └──────────────┘ └──────────────┘    │   ║
║  │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │   ║
║  │ │🎮 Games     │ │💻 Dev Hub   │ │📚 Knowledge │    │   ║
║  │ │Play...       │ │Build...      │ │Learn...      │    │   ║
║  │ │[Explore →]  │ │[Explore →]  │ │[Explore →]  │    │   ║
║  │ └──────────────┘ └──────────────┘ └──────────────┘    │   ║
║  │                                                         │   ║
║  │ STATS SECTION (3 Glass Panels)                         │   ║
║  │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │   ║
║  │ │Account       │ │Last Active   │ │Network       │    │   ║
║  │ │Verified      │ │Just now      │ │Excellent     │    │   ║
║  │ └──────────────┘ └──────────────┘ └──────────────┘    │   ║
║  │                                                         │   ║
║  │ [Floating Accent Orbs - Purple & Cyan]                │   ║
║  └─────────────────────────────────────────────────────────┘   ║
╚════════════════════════════════════════════════════════════════╝
                            ▲
                            │ Drawn on top
                            │
╔════════════════════════════════════════════════════════════════╗
║  Layer 2: GLASS PANELS (z-10, via CSS)                         ║
║  ┌─────────────────────────────────────────────────────────┐   ║
║  │ Semi-transparent panels with blur & border             │   ║
║  │ background: rgba(255, 255, 255, 0.1)                  │   ║
║  │ backdrop-filter: blur(12px)                            │   ║
║  │ border: 1px solid rgba(255, 255, 255, 0.1-0.2)       │   ║
║  │ transition: All states smoothly on hover/click          │   ║
║  │ ┌─────────────────────────────────────────────────┐   │   ║
║  │ │ Reflective Shine Overlay                        │   │   ║
║  │ │ radial-gradient: White @ cursor → transparent  │   │   ║
║  │ │ opacity: 0 (default) → 1 (hover)                │   │   ║
║  │ └─────────────────────────────────────────────────┘   │   ║
║  └─────────────────────────────────────────────────────────┘   ║
╚════════════════════════════════════════════════════════════════╝
                            ▲
                            │ Rendered on
                            │
╔════════════════════════════════════════════════════════════════╗
║  Layer 1: ANIMATED BACKGROUND (z-0, Canvas)                   ║
║  ┌─────────────────────────────────────────────────────────┐   ║
║  │                                                         │   ║
║  │  ◆ ◆ ◆ ◇ ◆    ← Purple & Cyan Particles              │   ║
║  │    ◆ ◆ ◆ ◇                                              │   ║
║  │  ◇ ◆ [CURSOR POSITION] ◆                               │   ║
║  │    ◆ ◆ ┈┈┈ Trail ┈┈┈ ◆                                 │   ║
║  │  ◆ ◆ ◆ ◇ ◆    Purple Glow Halo                         │   ║
║  │    ◆ ◆ ◆ ◇                                              │   ║
║  │                                                         │   ║
║  │  Physics:                                              │   ║
║  │  ├─ Particles attracted to cursor (radius: 150px)     │   ║
║  │  ├─ Motion trail: 50-point history with glow           │   ║
║  │  ├─ Particle wrap-around at edges                      │   ║
║  │  ├─ Velocity dampening: 0.95 per frame                │   ║
║  │  └─ 60 FPS target rendering                            │   ║
║  │                                                         │   ║
║  └─────────────────────────────────────────────────────────┘   ║
╚════════════════════════════════════════════════════════════════╝
```

## Interaction Flow Diagram

```
User Hovers Over Glass Panel
            │
            ▼
     MOUSE MOVE EVENT
            │
            ├─────────────────────────────────┐
            │                                 │
            ▼                                 ▼
    Update Cursor Position         Attract Particles
    (useCursorTracker hook)        (Canvas physics)
            │                                 │
            ▼                                 ▼
    Calculate Velocity             Render Motion Trail
            │                                 │
            ▼                                 ▼
    Update Reflective Overlay       Update Canvas
    (radial gradient)               (60 FPS)
            │
            ▼
    Panel Scales 1.02 (Framer Motion)
    Border brightens
    Glow increases
    Shadow deepens
            │
            ▼
    User sees interactive response
    (feels like interface "breathes")


User Clicks Glass Panel
            │
            ▼
     MOUSE CLICK EVENT
            │
            ▼
   Calculate Click Position
            │
            ├─────────────────────────────────┐
            │                                 │
            ▼                                 ▼
   Ripple Animation                 Panel Scale Feedback
   (useRippleEffect hook)           (0.98 for click effect)
            │                                 │
            ▼                                 ▼
   Ripple Size: 0 → Max             Scale back to 1.02
   Opacity: 0.6 → 0                 (spring animation)
   Duration: 600ms
            │
            ▼
   Remove ripple from DOM
            │
            ▼
   User feels tactile feedback
   (water droplet tap sensation)
```

## Particle System Behavior

```
Particle State Machine:

┌──────────────┐
│ IDLE         │  Position: (x, y)
│ Movement: 0.5│  Velocity: (-0.25 to +0.25)
└──────────────┘  Color: Purple or Cyan
        │
        └─ Continuous Loop ─┐
                            │
        ┌───────────────────┘
        │
        ▼
    CURSOR NEAR (distance < 150px)?
        │
        ├─ YES ─────────────────────┐
        │                           │
        │        ATTRACTED          │
        │        State              │
        │        ├─ Calculate       │
        │        │   force toward   │
        │        │   cursor         │
        │        ├─ Apply velocity  │
        │        │   acceleration   │
        │        └─ Damp to 0.95    │
        │           per frame       │
        │                           │
        └─ NO ──────────────────────┤
                                    │
                    ┌───────────────┘
                    │
                    ▼
            WRAP-AROUND
            Check screen
            edges and loop


Mouse Trail Lifecycle:

Mouse Click
    │
    ▼
Create trail point
Position: (cursor.x, cursor.y)
Opacity: 1.0
    │
    ▼
Render radial gradient glow
Radius: 40px
Color: Purple (0.3 opacity)
    │
    ├─ Every frame ─┐
    │               │
    │      ┌────────┘
    │      │
    │      ▼
    │   Opacity -= 0.02
    │   (Decay)
    │      │
    │      └─ Loop until opacity <= 0
    │
    ▼
Remove from trail array
```

## Ripple Effect Lifecycle

```
Click Detected at (x, y)
    │
    ▼
Create Ripple Object:
{
  id: "ripple-1",
  x: clickX,
  y: clickY,
  size: 0,
  opacity: 0.6
}
    │
    ▼
Animation Frame 0ms
├─ size = 0px
└─ opacity = 0.6
    │
    ▼
Animation Frame 300ms (Peak)
├─ size = 50% of max
└─ opacity = 0.3
    │
    ▼
Animation Frame 600ms (Complete)
├─ size = 100% (element size)
└─ opacity = 0 (invisible)
    │
    ▼
Remove from ripples array
```

## Color & Light System

```
Glass Panel Color Layers:

Layer 1 (Base):
background: rgba(15, 23, 42, 0.6)  ← Navy blue with transparency
└─ Provides dark background

Layer 2 (Frosted Glass):
background: rgba(255, 255, 255, 0.1)  ← White semi-transparent
backdrop-filter: blur(12px)
└─ Creates frosted glass effect

Layer 3 (Border):
border: 1px solid rgba(255, 255, 255, 0.1-0.2)
└─ Enhances separation, highlights edges

Layer 4 (Glow - Hover State):
box-shadow: 0 25px 50px rgba(124, 58, 237, 0.3)
└─ Purple glow that increases on hover

Layer 5 (Reflective Shine - Hover):
background: radial-gradient(
  circle at var(--mouse-x) var(--mouse-y),
  rgba(124, 58, 237, 0.2),
  transparent
)
└─ Cursor-following shine effect


Particle Colors:

┌─────────────┐         ┌─────────────┐
│  #7C3AED    │         │  #06B6D4    │
│   Purple    │         │   Cyan      │
│   Sophia    │         │   Accent    │
│   Brand     │         │   Tech      │
└─────────────┘         └─────────────┘
     50% of particles         50% of particles

Trail Glow:
radial-gradient: Purple @ 0% → transparent @ 100%
opacity: 0.3 (cursor position) → 0 (edge)
```

## Animation Timeline Visualization

```
Landing Page Load:
├─ 0ms      : Page renders
├─ 0-500ms  : Background fade in
├─ 300-1100ms: Logo scale + fade in (staggered)
├─ 500-1300ms: Headline text reveal (staggered)
├─ 700-1500ms: Description text appear (staggered)
├─ 900-1700ms: CTA button appear (staggered)
└─ ∞        : Particles animate, floating orbs loop

Dashboard Interaction:
├─ Hover    : Panel scale 1.0 → 1.02 (300ms)
├─ Hover    : Glow opacity increase (300ms)
├─ Hover    : Border opacity 0.1 → 0.2 (300ms)
├─ Click    : Scale 1.02 → 0.98 (100ms)
├─ Click    : Ripple expand 0 → max (600ms)
├─ Click    : Scale 0.98 → 1.02 (spring, 300ms)
└─ Ripple   : Opacity 0.6 → 0 (600ms, linear)

Ambient Animations:
├─ Floating orb 1: y ± 30px over 8s (∞ loop)
├─ Floating orb 2: y ± 30px over 15s (∞ loop, offset)
├─ Particles     : Continuous movement (∞)
├─ Trail glow    : Fade 600ms (one-shot, repeating)
└─ Pulsing button: Glow 20-40px over 2s (∞)
```

---

This architecture creates an **immersive, interactive experience** where:
- 🎬 **Animations** feel natural and responsive
- 🎨 **Glass panels** create elegant depth
- ✨ **Particles** add visual interest without distraction
- 🖱️ **Cursor interactions** provide satisfying feedback
- 🌊 **Ripple effects** create tactile sensation
- 🚀 **Performance** remains smooth (60 FPS)

The result: **A premium, next-generation blockchain interface** that feels futuristic, professional, and incredibly polished.
