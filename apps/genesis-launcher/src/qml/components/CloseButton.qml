/**
 * CloseButton.qml - Window Close Button
 */
import QtQuick

Rectangle {
    id: root
    
    signal clicked()
    
    width: 24
    height: 24
    radius: 12
    color: mouseArea.containsMouse ? "#FF4444" : "transparent"
    
    Behavior on color {
        ColorAnimation { duration: 150 }
    }
    
    // X icon
    Text {
        anchors.centerIn: parent
        text: "✕"
        font.pixelSize: 12
        color: mouseArea.containsMouse ? "#FFFFFF" : "#666666"
    }
    
    MouseArea {
        id: mouseArea
        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        onClicked: root.clicked()
    }
}
