// Theme.qml - Global Theme Singleton
pragma Singleton
import QtQuick

QtObject {
    id: theme
    
    // ============================================
    // COLOR PALETTE - Ancient Code Meets Glass
    // ============================================
    
    // Base Colors (Void)
    readonly property color voidBlack: Qt.rgba(0.02, 0.02, 0.02, 1.0)
    readonly property color voidBlackTransparent: Qt.rgba(0.02, 0.02, 0.02, 0.85)
    
    // Accent Colors (Mystical Energy)
    readonly property color neonCyan: "#00FFFF"        // Electric cyan
    readonly property color electricPurple: "#8A2BE2"  // Deep purple
    readonly property color deepGold: "#FFD700"        // Ancient gold
    
    // Reactive Colors (Audio-modulated - these will be bound to AudioColors C++ object)
    property color primaryAccent: typeof AudioColors !== 'undefined' ? AudioColors.primaryColor : neonCyan
    property color secondaryAccent: typeof AudioColors !== 'undefined' ? AudioColors.secondaryColor : electricPurple
    property color tertiaryAccent: typeof AudioColors !== 'undefined' ? AudioColors.tertiaryColor : deepGold
    
    // Text Colors
    readonly property color textPrimary: Qt.rgba(1, 1, 1, 0.95)
    readonly property color textSecondary: Qt.rgba(1, 1, 1, 0.7)
    readonly property color textMuted: Qt.rgba(1, 1, 1, 0.5)
    readonly property color textDisabled: Qt.rgba(1, 1, 1, 0.3)
    
    // Glass Colors
    readonly property color glassTint: Qt.rgba(0.02, 0.02, 0.02, 0.85)
    readonly property color glassTintLight: Qt.rgba(0.05, 0.05, 0.05, 0.7)
    readonly property color glassTintDark: Qt.rgba(0.02, 0.02, 0.02, 0.95)
    
    // State Colors
    readonly property color successGreen: "#00FF88"
    readonly property color errorRed: "#FF3D00"
    readonly property color warningYellow: "#FFC107"
    readonly property color infoBlue: "#2196F3"
    
    // ============================================
    // GLASS ENGINE PARAMETERS
    // ============================================
    
    readonly property int blurRadiusDefault: 64
    readonly property int blurRadiusStrong: 80
    readonly property int blurRadiusLight: 48
    readonly property int blurRadiusSubtle: 32
    
    readonly property real noiseStrength: 0.15
    readonly property real glassOpacity: 0.85
    
    // ============================================
    // ANIMATION TIMINGS
    // ============================================
    
    readonly property int animationFast: 150
    readonly property int animationNormal: 300
    readonly property int animationSlow: 500
    readonly property int animationVerySlow: 800
    
    // Spring animation parameters
    readonly property real springSmooth: 3.0
    readonly property real springBouncy: 2.0
    readonly property real springSnappy: 5.0
    
    readonly property real dampingSmooth: 0.3
    readonly property real dampingBouncy: 0.15
    readonly property real dampingSnappy: 0.5
    
    // ============================================
    // TYPOGRAPHY
    // ============================================
    
    readonly property string fontFamily: "SF Pro Display"
    readonly property string fontFamilyMono: "Fira Code"
    readonly property string fontFamilyDisplay: "SF Pro Display"
    
    readonly property int fontSizeXL: 32
    readonly property int fontSizeLarge: 24
    readonly property int fontSizeMedium: 16
    readonly property int fontSizeNormal: 14
    readonly property int fontSizeSmall: 12
    readonly property int fontSizeXS: 10
    
    // ============================================
    // SPACING & SIZING
    // ============================================
    
    readonly property int spacingXS: 4
    readonly property int spacingSmall: 8
    readonly property int spacingMedium: 12
    readonly property int spacingNormal: 16
    readonly property int spacingLarge: 24
    readonly property int spacingXL: 32
    readonly property int spacingXXL: 48
    
    readonly property int borderRadiusSmall: 6
    readonly property int borderRadiusMedium: 10
    readonly property int borderRadiusLarge: 15
    readonly property int borderRadiusXL: 20
    
    readonly property int borderWidthThin: 1
    readonly property int borderWidthMedium: 2
    readonly property int borderWidthThick: 3
    
    // ============================================
    // GLOW PARAMETERS
    // ============================================
    
    readonly property real glowIntensityLow: 0.3
    readonly property real glowIntensityMedium: 0.6
    readonly property real glowIntensityHigh: 1.0
    
    // ============================================
    // Z-INDEX LAYERS
    // ============================================
    
    readonly property int zIndexBackground: 0
    readonly property int zIndexWorkspace: 10
    readonly property int zIndexWidget: 100
    readonly property int zIndexDock: 200
    readonly property int zIndexStatusBar: 300
    readonly property int zIndexMenu: 400
    readonly property int zIndexPopup: 500
    readonly property int zIndexModal: 600
    readonly property int zIndexTooltip: 700
    readonly property int zIndexOverlay: 1000
    
    // ============================================
    // EFFECTS
    // ============================================
    
    // Shadow parameters
    readonly property real shadowBlurLight: 8
    readonly property real shadowBlurMedium: 16
    readonly property real shadowBlurHeavy: 32
    
    readonly property color shadowColor: Qt.rgba(0, 0, 0, 0.5)
    readonly property color shadowColorLight: Qt.rgba(0, 0, 0, 0.2)
    
    // ============================================
    // FUNCTIONS
    // ============================================
    
    // Color manipulation
    function withOpacity(color, opacity) {
        return Qt.rgba(color.r, color.g, color.b, opacity)
    }
    
    function lighten(color, amount) {
        return Qt.lighter(color, 1.0 + amount)
    }
    
    function darken(color, amount) {
        return Qt.darker(color, 1.0 + amount)
    }
    
    // Modulate color based on intensity (for audio reactivity)
    function modulateColor(baseColor, intensity) {
        return Qt.rgba(
            baseColor.r,
            baseColor.g,
            baseColor.b,
            Math.min(1.0, baseColor.a + intensity * 0.2)
        )
    }
    
    // Get color for state
    function stateColor(state) {
        switch(state) {
            case "success": return successGreen
            case "error": return errorRed
            case "warning": return warningYellow
            case "info": return infoBlue
            default: return primaryAccent
        }
    }
}
