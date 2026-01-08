/**
 * GlassTextField.qml - Dark Glass Input Field
 */
import QtQuick
import QtQuick.Controls

TextField {
    id: root
    
    height: 48
    
    color: "#E0E0E0"
    placeholderTextColor: "#666666"
    
    font.family: "Rajdhani"
    font.pixelSize: 16
    
    leftPadding: 16
    rightPadding: 16
    
    background: Rectangle {
        color: "#0F0F0F"
        radius: 8
        border.color: root.activeFocus ? "#FF3D00" : 
                      root.hovered ? "#333333" : "#1A1A1A"
        border.width: 1
        
        Behavior on border.color {
            ColorAnimation { duration: 150 }
        }
    }
    
    // Focus glow effect
    Rectangle {
        anchors.fill: parent
        anchors.margins: -2
        radius: 10
        color: "transparent"
        border.color: root.activeFocus ? Qt.rgba(1, 0.24, 0, 0.3) : "transparent"
        border.width: 2
        
        Behavior on border.color {
            ColorAnimation { duration: 150 }
        }
    }
}
