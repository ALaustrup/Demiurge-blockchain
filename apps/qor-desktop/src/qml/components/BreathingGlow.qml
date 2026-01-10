import QtQuick
// import QtQuick.Effects  // Not available
import ".."

/**
 * BreathingGlow - Pulsing glow animation component
 * 
 * Creates the "living flame" effect used on the QOR button
 * and other active elements. The glow pulses like a heartbeat,
 * giving life to the ancient terminal aesthetic.
 */
Item {
    id: breathingGlow
    
    // ========================================================================
    // PUBLIC PROPERTIES
    // ========================================================================
    
    /** The content to wrap with glow */
    default property alias content: contentContainer.data
    
    /** Whether the breathing animation is active */
    property bool breathing: true
    
    /** Glow color (flame gradient applied) */
    property color glowColor: Theme.accentFlame
    
    /** Secondary glow color for gradient effect */
    property color glowColorEnd: Theme.accentMagma
    
    /** Maximum glow radius */
    property int glowRadius: Theme.glowRadiusLarge
    
    /** Animation duration for one breath cycle */
    property int breatheDuration: Theme.breatheDuration
    
    /** Minimum opacity during breath */
    property real minOpacity: Theme.breatheMinOpacity
    
    /** Maximum opacity during breath */
    property real maxOpacity: Theme.breatheMaxOpacity
    
    // ========================================================================
    // GLOW LAYERS
    // ========================================================================
    
    // Outer glow (larger, more diffuse)
    Rectangle {
        id: outerGlow
        anchors.centerIn: parent
        width: parent.width + glowRadius * 2
        height: parent.height + glowRadius * 2
        radius: width / 2
        color: "transparent"
        
        // Radial gradient simulation with multiple rects
        Rectangle {
            anchors.fill: parent
            radius: parent.radius
            color: breathingGlow.glowColor
            opacity: breathingAnim.glowOpacity * 0.3
            
            // layer.enabled: true
            // layer.effect: MultiEffect {
            //     blurEnabled: true
            //     blur: 0.8
            //     blurMax: 64
            // }
        }
    }
    
    // Inner glow (tighter, more intense)
    Rectangle {
        id: innerGlow
        anchors.centerIn: parent
        width: parent.width + glowRadius
        height: parent.height + glowRadius
        radius: width / 2
        color: "transparent"
        
        Rectangle {
            anchors.fill: parent
            radius: parent.radius
            color: breathingGlow.glowColorEnd
            opacity: breathingAnim.glowOpacity * 0.5
            
            // layer.enabled: true
            // layer.effect: MultiEffect {
            //     blurEnabled: true
            //     blur: 0.6
            //     blurMax: 48
            // }
        }
    }
    
    // ========================================================================
    // CONTENT CONTAINER
    // ========================================================================
    
    Item {
        id: contentContainer
        anchors.fill: parent
        z: 1  // Above glow layers
    }
    
    // ========================================================================
    // BREATHING ANIMATION
    // ========================================================================
    
    QtObject {
        id: breathingAnim
        property real glowOpacity: breathingGlow.minOpacity
    }
    
    SequentialAnimation {
        id: breatheAnimation
        running: breathingGlow.breathing
        loops: Animation.Infinite
        
        // Inhale (glow intensifies)
        NumberAnimation {
            target: breathingAnim
            property: "glowOpacity"
            from: breathingGlow.minOpacity
            to: breathingGlow.maxOpacity
            duration: breathingGlow.breatheDuration / 2
            easing.type: Easing.InOutSine
        }
        
        // Exhale (glow diminishes)
        NumberAnimation {
            target: breathingAnim
            property: "glowOpacity"
            from: breathingGlow.maxOpacity
            to: breathingGlow.minOpacity
            duration: breathingGlow.breatheDuration / 2
            easing.type: Easing.InOutSine
        }
    }
}

