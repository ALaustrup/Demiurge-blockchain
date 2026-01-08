/**
 * LaunchCard.qml - The Fork Selection Cards
 * 
 * Animated, hoverable cards for launching Miner or Full OS
 */
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Effects

Rectangle {
    id: root
    
    property string title: "TITLE"
    property string subtitle: "Subtitle"
    property string description: "Description text"
    property string iconSource: ""
    property color accentColor: "#FF3D00"
    
    signal clicked()
    
    width: 280
    height: 360
    radius: 16
    
    // Dynamic color based on hover
    color: mouseArea.containsMouse ? "#151515" : "#0A0A0A"
    
    Behavior on color {
        ColorAnimation { duration: 200 }
    }
    
    // Glow border on hover
    Rectangle {
        anchors.fill: parent
        radius: parent.radius
        color: "transparent"
        border.color: mouseArea.containsMouse ? 
            Qt.rgba(accentColor.r, accentColor.g, accentColor.b, 0.5) :
            Qt.rgba(1, 1, 1, 0.05)
        border.width: mouseArea.containsMouse ? 2 : 1
        
        Behavior on border.color {
            ColorAnimation { duration: 200 }
        }
    }
    
    // Content
    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 24
        spacing: 16
        
        // Icon area
        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            Layout.preferredWidth: 80
            Layout.preferredHeight: 80
            radius: 40
            color: Qt.rgba(accentColor.r, accentColor.g, accentColor.b, 0.1)
            
            // Icon image or placeholder
            Image {
                anchors.centerIn: parent
                width: 48
                height: 48
                source: iconSource
                visible: iconSource.length > 0
                
                layer.enabled: true
                layer.effect: MultiEffect {
                    colorization: 1.0
                    colorizationColor: accentColor
                }
            }
            
            // Placeholder if no icon
            Text {
                anchors.centerIn: parent
                text: title.charAt(0)
                font.pixelSize: 32
                font.weight: Font.Bold
                color: accentColor
                visible: iconSource.length === 0
            }
            
            // Pulsing glow animation
            SequentialAnimation on scale {
                loops: Animation.Infinite
                running: mouseArea.containsMouse
                
                NumberAnimation { to: 1.05; duration: 1000; easing.type: Easing.InOutSine }
                NumberAnimation { to: 1.0; duration: 1000; easing.type: Easing.InOutSine }
            }
        }
        
        // Title
        Text {
            Layout.alignment: Qt.AlignHCenter
            text: title
            font.family: "Orbitron"
            font.pixelSize: 20
            font.weight: Font.Bold
            color: "#E0E0E0"
            
            // Glow on hover
            layer.enabled: mouseArea.containsMouse
            layer.effect: MultiEffect {
                blurEnabled: true
                blur: 0.2
                blurMax: 8
                colorization: 1.0
                colorizationColor: accentColor
            }
        }
        
        // Subtitle
        Text {
            Layout.alignment: Qt.AlignHCenter
            text: subtitle
            font.family: "Rajdhani"
            font.pixelSize: 14
            color: accentColor
        }
        
        // Divider
        Rectangle {
            Layout.fillWidth: true
            height: 1
            color: Qt.rgba(1, 1, 1, 0.1)
        }
        
        // Description
        Text {
            Layout.fillWidth: true
            Layout.fillHeight: true
            text: description
            font.family: "Rajdhani"
            font.pixelSize: 13
            color: "#7A7A7A"
            wrapMode: Text.WordWrap
            horizontalAlignment: Text.AlignHCenter
            verticalAlignment: Text.AlignVCenter
        }
        
        // Launch indicator
        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            Layout.preferredWidth: 120
            Layout.preferredHeight: 40
            radius: 20
            color: mouseArea.containsMouse ? accentColor : "transparent"
            border.color: accentColor
            border.width: 1
            
            Text {
                anchors.centerIn: parent
                text: "LAUNCH"
                font.family: "Orbitron"
                font.pixelSize: 12
                color: mouseArea.containsMouse ? "#000000" : accentColor
            }
            
            Behavior on color {
                ColorAnimation { duration: 150 }
            }
        }
    }
    
    // Click handler
    MouseArea {
        id: mouseArea
        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        
        onClicked: root.clicked()
    }
    
    // Scale animation on hover
    scale: mouseArea.containsMouse ? 1.02 : 1.0
    
    Behavior on scale {
        NumberAnimation { duration: 150; easing.type: Easing.OutQuad }
    }
}
