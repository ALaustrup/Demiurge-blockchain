/**
 * CyberpunkProgressBar.qml - Stylized Progress Indicator
 */
import QtQuick
import QtQuick.Layouts

Rectangle {
    id: root
    
    property real value: 0.0  // 0.0 to 1.0
    property string statusText: "Loading..."
    property color barColor: "#FF3D00"
    
    color: "#0A0A0A"
    radius: 4
    
    RowLayout {
        anchors.fill: parent
        anchors.margins: 8
        spacing: 12
        
        // Status text
        Text {
            text: statusText
            font.family: "JetBrains Mono"
            font.pixelSize: 11
            color: "#7A7A7A"
            Layout.preferredWidth: 200
            elide: Text.ElideMiddle
        }
        
        // Progress bar
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 6
            radius: 3
            color: "#1A1A1A"
            
            Rectangle {
                width: parent.width * value
                height: parent.height
                radius: parent.radius
                
                gradient: Gradient {
                    orientation: Gradient.Horizontal
                    GradientStop { position: 0.0; color: barColor }
                    GradientStop { position: 1.0; color: "#FF9100" }
                }
                
                Behavior on width {
                    NumberAnimation { duration: 200 }
                }
            }
            
            // Animated glow overlay
            Rectangle {
                id: glowBar
                width: 50
                height: parent.height
                radius: parent.radius
                
                gradient: Gradient {
                    orientation: Gradient.Horizontal
                    GradientStop { position: 0.0; color: "transparent" }
                    GradientStop { position: 0.5; color: Qt.rgba(1, 1, 1, 0.3) }
                    GradientStop { position: 1.0; color: "transparent" }
                }
                
                SequentialAnimation on x {
                    loops: Animation.Infinite
                    running: value > 0 && value < 1
                    
                    NumberAnimation {
                        from: -50
                        to: root.width
                        duration: 1500
                        easing.type: Easing.Linear
                    }
                }
            }
        }
        
        // Percentage
        Text {
            text: Math.round(value * 100) + "%"
            font.family: "JetBrains Mono"
            font.pixelSize: 11
            color: barColor
            Layout.preferredWidth: 40
            horizontalAlignment: Text.AlignRight
        }
    }
}
