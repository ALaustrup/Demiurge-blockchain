import QtQuick
// import QtQuick.Effects  // Not available in Qt 6.10.0
import ".."

/**
 * GlassPanel - The foundational glassmorphic component
 * 
 * A smoky, semi-transparent panel with configurable depth blur.
 * This is the building block for all QØЯ UI panels: dock, windows, menus.
 * 
 * Depth Layers (Atmospheric Perspective):
 *   0 = Desktop (no blur, opaque)
 *   1 = Dock (light blur, 85% opacity)
 *   2 = Window (medium blur, 88% opacity)
 *   3 = Popup/Menu (heavy blur, 92% opacity)
 * 
 * The higher the layer, the "closer" it appears to the user,
 * creating a sense of dimensional depth in the UI.
 */
Rectangle {
    id: glassPanel
    
    // ========================================================================
    // PUBLIC PROPERTIES
    // ========================================================================
    
    /** Depth layer (0-3). Higher = more blur, more opaque */
    property int depthLevel: 2
    
    /** Whether to show the subtle border */
    property bool showBorder: true
    
    /** Whether panel is currently active/focused */
    property bool active: false
    
    /** Optional glow color (set to transparent to disable) */
    property color glowColor: "transparent"
    
    /** Glow radius when active */
    property int glowRadius: 0
    
    /** Content margins */
    property int contentMargins: Theme.spacingMedium
    
    /** Alias for placing content inside */
    default property alias content: contentContainer.data
    
    // ========================================================================
    // INTERNAL PROPERTIES
    // ========================================================================
    
    // Calculate layer properties based on depth
    readonly property var layerConfig: Theme.getLayer(depthLevel)
    readonly property int blurRadius: layerConfig.blur
    readonly property real panelOpacity: layerConfig.opacity
    readonly property real borderOpacity: layerConfig.borderOpacity
    
    // ========================================================================
    // VISUAL CONFIGURATION
    // ========================================================================
    
    // Base appearance
    color: {
        switch (depthLevel) {
            case 0: return Theme.voidBlack
            case 1: return Theme.glassPanelDock
            case 2: return Theme.glassPanelWindow
            case 3: return Theme.glassPanelPopup
            default: return Theme.glassPanel
        }
    }
    opacity: panelOpacity
    radius: Theme.radiusMedium
    
    // Border styling
    border.color: active ? Theme.panelBorderActive : Theme.panelBorder
    border.width: showBorder ? 1 : 0
    
    // Smooth transitions
    Behavior on opacity {
        NumberAnimation { duration: Theme.animFast }
    }
    Behavior on border.color {
        ColorAnimation { duration: Theme.animFast }
    }
    
    // ========================================================================
    // BLUR EFFECT (The "Smoky Glass" Look)
    // ========================================================================
    
    // Enable layer for blur effect - temporarily disabled (MultiEffect not available)
    // layer.enabled: blurRadius > 0
    // layer.effect: MultiEffect {
    //     blurEnabled: true
    //     blur: glassPanel.blurRadius / 100.0
    //     blurMax: 64
    //     saturation: 0.8
    // }
    
    // ========================================================================
    // GLOW EFFECT (Optional flame glow)
    // ========================================================================
    
    // Outer glow when glowColor is set
    Rectangle {
        id: glowLayer
        anchors.fill: parent
        anchors.margins: -glowRadius
        radius: parent.radius + glowRadius
        color: "transparent"
        visible: glowColor !== "transparent" && glowRadius > 0
        
        // Glow is achieved with a gradient border
        border.width: glowRadius
        border.color: glowColor
        opacity: 0.3
        
        Behavior on opacity {
            NumberAnimation { duration: Theme.animNormal }
        }
    }
    
    // ========================================================================
    // CIPHER BORDER (Subtle cyan data-line accent)
    // ========================================================================
    
    // Top accent line (the "cipher" edge)
    Rectangle {
        id: cipherLine
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.margins: 1
        height: 1
        radius: parent.radius
        
        gradient: Gradient {
            orientation: Gradient.Horizontal
            GradientStop { position: 0.0; color: "transparent" }
            GradientStop { position: 0.3; color: Qt.rgba(Theme.cipherCyan.r, Theme.cipherCyan.g, Theme.cipherCyan.b, 0.1) }
            GradientStop { position: 0.5; color: Qt.rgba(Theme.cipherCyan.r, Theme.cipherCyan.g, Theme.cipherCyan.b, 0.2) }
            GradientStop { position: 0.7; color: Qt.rgba(Theme.cipherCyan.r, Theme.cipherCyan.g, Theme.cipherCyan.b, 0.1) }
            GradientStop { position: 1.0; color: "transparent" }
        }
        
        visible: showBorder && depthLevel > 0
    }
    
    // ========================================================================
    // CONTENT CONTAINER
    // ========================================================================
    
    Item {
        id: contentContainer
        anchors.fill: parent
        anchors.margins: glassPanel.contentMargins
    }
    
    // ========================================================================
    // HOVER EFFECT (Subtle brightness increase)
    // ========================================================================
    
    // Internal hover state
    property bool hovered: false
    
    // Hover brightness overlay
    Rectangle {
        anchors.fill: parent
        radius: parent.radius
        color: Theme.textPrimary
        opacity: parent.hovered ? 0.02 : 0
        
        Behavior on opacity {
            NumberAnimation { duration: Theme.animFast }
        }
    }
}
