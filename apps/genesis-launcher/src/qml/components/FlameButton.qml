/**
 * FlameButton.qml - Glowing Action Button
 */
import QtQuick
import QtQuick.Controls
import QtQuick.Effects

Button {
    id: root
    
    property color flameColor: "#FF3D00"
    property color flameHighlight: "#FF9100"
    
    contentItem: Text {
        text: root.text
        font.family: "Orbitron"
        font.pixelSize: 14
        font.weight: Font.Bold
        color: root.enabled ? "#FFFFFF" : "#666666"
        horizontalAlignment: Text.AlignHCenter
        verticalAlignment: Text.AlignVCenter
    }
    
    background: Rectangle {
        radius: 8
        
        gradient: Gradient {
            orientation: Gradient.Horizontal
            GradientStop { position: 0.0; color: root.enabled ? flameColor : "#333333" }
            GradientStop { position: 1.0; color: root.enabled ? flameHighlight : "#444444" }
        }
        
        // Glow effect
        layer.enabled: root.enabled && root.hovered
        layer.effect: MultiEffect {
            blurEnabled: true
            blur: 0.5
            blurMax: 32
        }
        
        // Hover overlay
        Rectangle {
            anchors.fill: parent
            radius: parent.radius
            color: "white"
            opacity: root.hovered ? 0.1 : 0
            
            Behavior on opacity {
                NumberAnimation { duration: 150 }
            }
        }
        
        // Press effect
        Rectangle {
            anchors.fill: parent
            radius: parent.radius
            color: "black"
            opacity: root.pressed ? 0.2 : 0
        }
    }
    
    // Breathing animation when idle
    SequentialAnimation on opacity {
        loops: Animation.Infinite
        running: root.enabled
        
        NumberAnimation { to: 0.9; duration: 1500; easing.type: Easing.InOutSine }
        NumberAnimation { to: 1.0; duration: 1500; easing.type: Easing.InOutSine }
    }
}
