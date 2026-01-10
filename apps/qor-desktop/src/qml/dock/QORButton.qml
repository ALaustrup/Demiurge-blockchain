import QtQuick
// import QtQuick.Effects  // Not available

import "../components"

/**
 * QORButton - The Glowing Center Button
 * 
 * The heart of the Q-Dock. A pulsing flame orb that opens
 * the Q-Menu when clicked. Features a breathing glow animation
 * that gives life to the interface.
 */
Item {
    id: qorButton
    
    // ========================================================================
    // PUBLIC PROPERTIES
    // ========================================================================
    
    /** Whether edit mode is active (shows drag indicator) */
    property bool editMode: false
    
    // ========================================================================
    // SIGNALS
    // ========================================================================
    
    signal clicked()
    
    // ========================================================================
    // DIMENSIONS
    // ========================================================================
    
    width: 48
    height: 48
    
    // ========================================================================
    // BREATHING GLOW WRAPPER
    // ========================================================================
    
    BreathingGlow {
        anchors.fill: parent
        breathing: true
        glowColor: Theme.accentFlame
        glowColorEnd: Theme.accentMagma
        glowRadius: Theme.glowRadiusLarge
        breatheDuration: 3000
        
        // ================================================================
        // BUTTON CORE
        // ================================================================
        
        Rectangle {
            id: buttonCore
            anchors.fill: parent
            radius: width / 2
            
            // Radial gradient simulation with layered rects
            gradient: Gradient {
                GradientStop { position: 0.0; color: Theme.accentMagma }
                GradientStop { position: 0.5; color: Theme.accentEmber }
                GradientStop { position: 1.0; color: Theme.accentFlame }
            }
            
            // Inner highlight
            Rectangle {
                anchors.centerIn: parent
                width: parent.width * 0.6
                height: parent.height * 0.6
                radius: width / 2
                color: Qt.lighter(Theme.accentMagma, 1.3)
                opacity: 0.5
            }
            
            // QØЯ Text
            Text {
                anchors.centerIn: parent
                text: "Q"
                font.family: Theme.fontHeader
                font.pixelSize: 20
                font.weight: Font.Bold
                color: Theme.voidBlack
            }
            
            // Hover scale
            scale: mouseArea.containsMouse ? 1.1 : 1.0
            Behavior on scale { NumberAnimation { duration: Theme.animFast } }
            
            // Press effect
            opacity: mouseArea.pressed ? 0.8 : 1.0
            Behavior on opacity { NumberAnimation { duration: 50 } }
        }
    }
    
    // ========================================================================
    // EDIT MODE INDICATOR
    // ========================================================================
    
    Rectangle {
        visible: editMode
        anchors.fill: parent
        anchors.margins: -4
        radius: width / 2
        color: "transparent"
        border.width: 2
        border.color: Theme.cipherCyan
        
        // Dashed border effect
        SequentialAnimation on opacity {
            running: editMode
            loops: Animation.Infinite
            NumberAnimation { to: 1.0; duration: 500 }
            NumberAnimation { to: 0.3; duration: 500 }
        }
    }
    
    // ========================================================================
    // MOUSE INTERACTION (Handled by parent in QDock)
    // ========================================================================
    
    MouseArea {
        id: mouseArea
        anchors.fill: parent
        hoverEnabled: true
        // Click handled by parent to support drag in edit mode
    }
}

