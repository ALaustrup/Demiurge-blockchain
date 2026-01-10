import QtQuick
// import QtQuick.Effects  // Not available
import ".."

/**
 * VoidBackground - The Animated Abyss
 * 
 * An animated background that represents the digital void.
 * Subtle particle movement and occasional pulses create
 * a living, breathing environment.
 */
Item {
    id: voidBackground
    
    // ========================================================================
    // PROPERTIES
    // ========================================================================
    
    /** Whether animations are running */
    property bool active: true
    
    /** Pulse intensity (0-1, triggered by events) */
    property real pulseIntensity: 0
    
    // ========================================================================
    // BASE GRADIENT
    // ========================================================================
    
    Rectangle {
        anchors.fill: parent
        
        gradient: Gradient {
            GradientStop { position: 0.0; color: "#000000" }
            GradientStop { position: 0.3; color: Theme.voidBlack }
            GradientStop { position: 0.7; color: Theme.voidDeep }
            GradientStop { position: 1.0; color: "#000000" }
        }
    }
    
    // ========================================================================
    // PARTICLE FIELD
    // ========================================================================
    
    Item {
        id: particleField
        anchors.fill: parent
        opacity: 0.4
        
        // Star-like particles
        Repeater {
            model: 100
            
            Rectangle {
                id: particle
                
                property real baseX: Math.random() * voidBackground.width
                property real baseY: Math.random() * voidBackground.height
                property real driftSpeed: Math.random() * 0.5 + 0.1
                property real flickerSpeed: Math.random() * 2000 + 1000
                
                x: baseX + Math.sin(Date.now() / 10000 * driftSpeed) * 20
                y: baseY + Math.cos(Date.now() / 8000 * driftSpeed) * 15
                
                width: Math.random() > 0.9 ? 3 : (Math.random() > 0.7 ? 2 : 1)
                height: width
                radius: width / 2
                
                color: {
                    let rand = Math.random()
                    if (rand > 0.95) return Theme.accentFlame
                    if (rand > 0.9) return Theme.cipherCyan
                    return Theme.textMuted
                }
                
                opacity: 0.3 + Math.random() * 0.4
                
                // Flicker animation
                SequentialAnimation on opacity {
                    running: voidBackground.active
                    loops: Animation.Infinite
                    NumberAnimation { 
                        to: Math.random() * 0.5 + 0.2
                        duration: particle.flickerSpeed
                    }
                    NumberAnimation { 
                        to: Math.random() * 0.7 + 0.3
                        duration: particle.flickerSpeed
                    }
                }
            }
        }
        
        // Drift animation driver
        Timer {
            interval: 50
            running: voidBackground.active
            repeat: true
            onTriggered: particleField.update()
        }
    }
    
    // ========================================================================
    // AMBIENT GLOW ORBS
    // ========================================================================
    
    Repeater {
        model: 5
        
        Rectangle {
            id: glowOrb
            
            property real orbitRadius: 200 + index * 100
            property real orbitSpeed: 0.0001 + index * 0.00002
            property real orbitOffset: index * (Math.PI * 2 / 5)
            
            x: voidBackground.width / 2 + Math.cos(Date.now() * orbitSpeed + orbitOffset) * orbitRadius - width / 2
            y: voidBackground.height / 2 + Math.sin(Date.now() * orbitSpeed + orbitOffset) * orbitRadius * 0.6 - height / 2
            
            width: 100 + index * 30
            height: width
            radius: width / 2
            
            color: index % 2 === 0 ? Theme.accentFlame : Theme.cipherCyan
            opacity: 0.03
            
            // layer.enabled: true
            // layer.effect: MultiEffect {
            //     blurEnabled: true
            //     blur: 1.0
            //     blurMax: 100
            // }
        }
    }
    
    // ========================================================================
    // PULSE OVERLAY (For notifications/events)
    // ========================================================================
    
    Rectangle {
        anchors.fill: parent
        color: Theme.accentFlame
        opacity: pulseIntensity * 0.1
        
        Behavior on opacity {
            NumberAnimation { duration: 500 }
        }
    }
    
    // ========================================================================
    // VIGNETTE OVERLAY
    // ========================================================================
    
    Rectangle {
        anchors.fill: parent
        
        gradient: Gradient {
            GradientStop { position: 0.0; color: Qt.rgba(0, 0, 0, 0.3) }
            GradientStop { position: 0.3; color: "transparent" }
            GradientStop { position: 0.7; color: "transparent" }
            GradientStop { position: 1.0; color: Qt.rgba(0, 0, 0, 0.4) }
        }
    }
    
    // Horizontal vignette
    Rectangle {
        anchors.fill: parent
        rotation: 90
        
        gradient: Gradient {
            GradientStop { position: 0.0; color: Qt.rgba(0, 0, 0, 0.2) }
            GradientStop { position: 0.2; color: "transparent" }
            GradientStop { position: 0.8; color: "transparent" }
            GradientStop { position: 1.0; color: Qt.rgba(0, 0, 0, 0.2) }
        }
    }
    
    // ========================================================================
    // PUBLIC METHODS
    // ========================================================================
    
    /**
     * Trigger a pulse effect (for notifications, etc.)
     */
    function pulse() {
        pulseIntensity = 1.0
        pulseDecay.start()
    }
    
    NumberAnimation {
        id: pulseDecay
        target: voidBackground
        property: "pulseIntensity"
        to: 0
        duration: 1000
        easing.type: Easing.OutQuad
    }
}

