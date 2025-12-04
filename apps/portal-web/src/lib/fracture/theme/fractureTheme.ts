/**
 * Fracture Theme
 * 
 * Centralized theme configuration for Fracture v1 UI.
 */

/**
 * Fracture Theme
 * 
 * Dark, ancient, hostile aesthetic.
 * No bright candy colors. Muted, sparse neon.
 * Ritual interface, not SaaS landing.
 */
export const fractureTheme = {
  colors: {
    primary: {
      cyan: "#22d3ee", // cyan-400 (slightly brighter for visibility)
      fuchsia: "#e879f9", // fuchsia-400 (muted)
      purple: "#c084fc", // purple-400 (muted)
      // Darker variants for backgrounds
      cyanDark: "rgba(6, 182, 212, 0.15)",
      fuchsiaDark: "rgba(217, 70, 239, 0.15)",
      purpleDark: "rgba(168, 85, 247, 0.1)",
    },
    background: {
      base: "#000000",
      overlay: "rgba(0, 0, 0, 0.8)", // Darker overlay
      glass: "rgba(255, 255, 255, 0.05)", // Very subtle glass
      glassDark: "rgba(255, 255, 255, 0.03)", // Even darker
    },
    border: {
      default: "rgba(255, 255, 255, 0.1)",
      accent: "rgba(34, 211, 238, 0.3)", // cyan-400 with opacity
      accentSubtle: "rgba(34, 211, 238, 0.15)", // Very subtle
    },
    text: {
      primary: "#e4e4e7", // zinc-200 (slightly brighter for readability)
      secondary: "#71717a", // zinc-500 (darker, more muted)
      muted: "#52525b", // zinc-600 (very muted)
      accent: "#22d3ee", // cyan-400 for accents
    },
  },
  gradients: {
    // More muted gradients
    primary: "linear-gradient(to right, rgba(34, 211, 238, 0.8), rgba(232, 121, 249, 0.8), rgba(192, 132, 252, 0.8))",
    overlay: "linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.6), rgba(0,0,0,1))",
    vignette: "radial-gradient(ellipse at center, transparent 0%, transparent 30%, rgba(0,0,0,0.6) 100%)",
  },
  effects: {
    blur: {
      backdrop: "backdrop-blur-xl",
      glass: "backdrop-blur-2xl",
      heavy: "backdrop-blur-3xl",
    },
    glow: {
      // Subtle glows, not loud
      cyan: "0 0 20px rgba(34, 211, 238, 0.15)",
      fuchsia: "0 0 20px rgba(232, 121, 249, 0.15)",
      subtle: "0 0 80px rgba(0,255,255,0.15)",
    },
    shadow: {
      dark: "0 0 60px rgba(0,0,0,0.8)",
      darker: "0 4px 20px rgba(0,0,0,0.5)",
    },
  },
} as const;

