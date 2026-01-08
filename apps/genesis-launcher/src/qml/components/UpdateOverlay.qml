/**
 * UpdateOverlay.qml - Update Download Overlay
 */
import QtQuick

Rectangle {
    id: root
    
    color: Qt.rgba(0, 0, 0, 0.8)
    radius: 16
    
    Column {
        anchors.centerIn: parent
        spacing: 20
        
        // Spinning loader
        Item {
            width: 60
            height: 60
            anchors.horizontalCenter: parent.horizontalCenter
            
            Rectangle {
                id: spinner
                anchors.fill: parent
                color: "transparent"
                border.color: "#FF3D00"
                border.width: 3
                radius: 30
                
                Rectangle {
                    width: 10
                    height: 10
                    radius: 5
                    color: "#FF3D00"
                    anchors.horizontalCenter: parent.horizontalCenter
                    anchors.top: parent.top
                    anchors.topMargin: -2
                }
                
                RotationAnimation on rotation {
                    from: 0
                    to: 360
                    duration: 1000
                    loops: Animation.Infinite
                }
            }
        }
        
        // Status text
        Text {
            text: UpdateEngine.statusMessage
            font.family: "Orbitron"
            font.pixelSize: 14
            color: "#E0E0E0"
            anchors.horizontalCenter: parent.horizontalCenter
        }
        
        // Progress bar
        CyberpunkProgressBar {
            width: 300
            height: 30
            value: UpdateEngine.downloadProgress
            statusText: "Synchronizing Reality..."
        }
        
        // Cancel button
        Text {
            text: "Cancel"
            font.pixelSize: 12
            color: "#666666"
            anchors.horizontalCenter: parent.horizontalCenter
            
            MouseArea {
                anchors.fill: parent
                cursorShape: Qt.PointingHandCursor
                onClicked: UpdateEngine.cancelDownload()
            }
        }
    }
}
